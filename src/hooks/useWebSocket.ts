import { useState, useEffect, useRef, useCallback } from 'react';
import {
    WebSocketMessage,
    WebSocketClientOptions,
    WebSocketEventType,
} from '@/types/websocket.types';

type MessageHandler = (message: WebSocketMessage) => void;

export function useWebSocket(options: WebSocketClientOptions) {
    const {
        url,
        token,
        reconnect = true,
        reconnectInterval = 3000,
        maxReconnectAttempts = 5,
        onOpen,
        onClose,
        onError,
        onMessage,
    } = options;

    const [isConnected, setIsConnected] = useState(false);
    const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const handlersRef = useRef<Map<string, Set<MessageHandler>>>(new Map());
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const userIdRef = useRef<string | null>(null);

    const connect = useCallback((userId?: string) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) return;

        setConnectionState('connecting');
        
        if (userId) {
            userIdRef.current = userId;
        }

        try {
            // Build WebSocket URL with token
            const wsUrl = new URL(url);
            if (token) {
                wsUrl.searchParams.set('token', token);
            } else if (userIdRef.current) {
                // Use base64 encoded user ID as token
                wsUrl.searchParams.set('token', btoa(userIdRef.current));
            }
            
            const ws = new WebSocket(wsUrl.toString());

            ws.onopen = () => {
                setIsConnected(true);
                setConnectionState('connected');
                reconnectAttemptsRef.current = 0;
                console.log('[WebSocket] Connected to', url);
                onOpen?.();
            };

            ws.onclose = (event) => {
                setIsConnected(false);
                setConnectionState('disconnected');
                console.log('[WebSocket] Disconnected:', event.code, event.reason);
                onClose?.();

                if (reconnect && reconnectAttemptsRef.current < maxReconnectAttempts && !event.wasClean) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttemptsRef.current++;
                        console.log(`[WebSocket] Reconnecting... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
                        connect(userIdRef.current || undefined);
                    }, reconnectInterval);
                }
            };

            ws.onerror = (error) => {
                setConnectionState('error');
                console.error('[WebSocket] Error:', error);
                onError?.(error);
            };

            ws.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);
                    
                    // Handle built-in message types
                    if (message.type === 'connection_ack') {
                        console.log('[WebSocket] Connection acknowledged:', message.payload);
                    }
                    
                    // Call the general message handler
                    onMessage?.(message);

                    // Call type-specific handlers
                    const handlers = handlersRef.current.get(message.type);
                    if (handlers) {
                        handlers.forEach(handler => handler(message));
                    }

                    // Call wildcard handlers
                    const allHandlers = handlersRef.current.get('*');
                    if (allHandlers) {
                        allHandlers.forEach(handler => handler(message));
                    }
                } catch (e) {
                    console.error('[WebSocket] Failed to parse message:', e);
                }
            };

            socketRef.current = ws;
        } catch (error) {
            setConnectionState('error');
            console.error('[WebSocket] Connection error:', error);
        }
    }, [url, token, reconnect, reconnectInterval, maxReconnectAttempts, onOpen, onClose, onError, onMessage]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        
        if (socketRef.current) {
            socketRef.current.close(1000, 'Client disconnect');
            socketRef.current = null;
        }
        
        setIsConnected(false);
        setConnectionState('disconnected');
    }, []);

    const send = useCallback(<T = any>(type: string, payload?: T, roomId?: string) => {
        if (socketRef.current?.readyState !== WebSocket.OPEN) {
            console.warn('[WebSocket] Cannot send - not connected');
            return false;
        }

        const message: WebSocketMessage<T> = {
            type,
            payload: payload as T,
            roomId,
            userId: userIdRef.current || undefined,
            timestamp: Date.now(),
        };

        socketRef.current.send(JSON.stringify(message));
        return true;
    }, []);

    const subscribe = useCallback((eventType: string, handler: MessageHandler) => {
        if (!handlersRef.current.has(eventType)) {
            handlersRef.current.set(eventType, new Set());
        }
        handlersRef.current.get(eventType)!.add(handler);

        return () => {
            handlersRef.current.get(eventType)?.delete(handler);
        };
    }, []);

    // Auto-connect on mount if URL is provided
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        isConnected,
        connectionState,
        connect,
        disconnect,
        send,
        subscribe,
    };
}

// Simulation WebSocket hook
export function useSimulationWebSocket(simulationId: string, userId?: string, token?: string) {
    const [metrics, setMetrics] = useState<any>(null);
    const [bottlenecks, setBottlenecks] = useState<any[]>([]);
    const [collaborators, setCollaborators] = useState<any[]>([]);

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3006'}`;

    const { isConnected, connect, disconnect, send, subscribe } = useWebSocket({
        url: `${wsUrl}/simulation/${simulationId}`,
        token,
        onMessage: (message) => {
            console.log('[Simulation WS] Message:', message.type);
            switch (message.type) {
                case 'simulation_update':
                    setMetrics(message.payload?.metrics);
                    setBottlenecks(message.payload?.bottlenecks || []);
                    break;
                case 'room_joined':
                    console.log('[Simulation WS] Joined room:', message.payload);
                    break;
            }
        },
    });

    const joinSimulation = useCallback(() => {
        connect(userId);
        // Send join message after connection
        setTimeout(() => {
            send('join_simulation', undefined, simulationId);
        }, 100);
    }, [connect, send, simulationId, userId]);

    const leaveSimulation = useCallback(() => {
        send('leave_simulation', undefined, simulationId);
        disconnect();
    }, [send, disconnect, simulationId]);

    const updateSimulation = useCallback((users: number, rps?: number) => {
        send('simulation_update', { users, rps }, simulationId);
    }, [send, simulationId]);

    return {
        isConnected,
        metrics,
        bottlenecks,
        collaborators,
        joinSimulation,
        leaveSimulation,
        updateSimulation,
    };
}

// Collaboration WebSocket hook
export function useCollaborationWebSocket(sessionId: string, userId?: string, userName?: string, token?: string) {
    const [participants, setParticipants] = useState<any[]>([]);
    const [designState, setDesignState] = useState<any>(null);
    const [cursors, setCursors] = useState<Map<string, { x: number; y: number; userId: string; userName: string }>>(new Map());

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3006'}`;

    const { isConnected, connect, disconnect, send, subscribe } = useWebSocket({
        url: `${wsUrl}/collaboration/${sessionId}`,
        token,
        onMessage: (message) => {
            console.log('[Collaboration WS] Message:', message.type);
            switch (message.type) {
                case 'room_joined':
                    console.log('[Collaboration WS] Joined room:', message.payload);
                    break;
                case 'design_update':
                    setDesignState(message.payload);
                    break;
                case 'cursor_position':
                    const cursorData = message.payload;
                    setCursors(prev => {
                        const newCursors = new Map(prev);
                        newCursors.set(cursorData.userId, cursorData);
                        return newCursors;
                    });
                    break;
            }
        },
    });

    const joinCollaboration = useCallback(() => {
        connect(userId);
        // Send join message after connection
        setTimeout(() => {
            send('join_collaboration', { userId, userName }, sessionId);
        }, 100);
    }, [connect, send, sessionId, userId, userName]);

    const leaveCollaboration = useCallback(() => {
        send('leave_collaboration', undefined, sessionId);
        disconnect();
    }, [send, disconnect, sessionId]);

    const broadcastDesignUpdate = useCallback((designData: any) => {
        send('design_update', designData, sessionId);
    }, [send, sessionId]);

    const broadcastCursorPosition = useCallback((x: number, y: number) => {
        send('cursor_position', { x, y, userId, userName }, sessionId);
    }, [send, sessionId, userId, userName]);

    return {
        isConnected,
        participants,
        designState,
        cursors,
        joinCollaboration,
        leaveCollaboration,
        broadcastDesignUpdate,
        broadcastCursorPosition,
    };
}
