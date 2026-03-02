/**
 * Real-time Simulation Hook
 * 
 * Provides WebSocket-based real-time updates for:
 * - Live simulation metrics sharing
 * - Collaborative design sessions
 * - Multiplayer architecture building
 */

import { useEffect, useRef, useCallback, useState } from 'react';

export interface RealtimeMetrics {
    timestamp: number;
    users: number;
    latency: number;
    throughput: number;
    errors: number;
    costs: number;
    cpu: number;
    memory: number;
    network: number;
}

export interface CollaborationUpdate {
    userId: string;
    userName?: string;
    action: 'add' | 'remove' | 'update' | 'cursor';
    nodeId?: string;
    data?: any;
    cursor?: { x: number; y: number };
}

type MessageHandler = (data: any) => void;

export function useRealtimeSimulation(simulationId: string | null, token?: string) {
    const wsRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null);
    const [collaborators, setCollaborators] = useState<string[]>([]);
    const handlersRef = useRef<Map<string, Set<MessageHandler>>>(new Map());
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3006';

    const connect = useCallback(() => {
        if (!simulationId) return;
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        try {
            // Append token to URL if provided
            const url = token
                ? `${wsUrl}/simulation/${simulationId}?token=${encodeURIComponent(token)}`
                : `${wsUrl}/simulation/${simulationId}`;
            const ws = new WebSocket(url);

            ws.onopen = () => {
                console.log('[Realtime] Connected to simulation');
                setIsConnected(true);
                reconnectAttempts.current = 0;

                // Join simulation room
                ws.send(JSON.stringify({
                    type: 'join_simulation',
                    roomId: simulationId
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    const { type, payload } = message;

                    switch (type) {
                        case 'connection_ack':
                            console.log('[Realtime] Connection acknowledged');
                            break;

                        case 'room_joined':
                            console.log('[Realtime] Joined room:', payload.roomId);
                            break;

                        case 'simulation_update':
                            setMetrics(payload);
                            // Call registered handlers
                            handlersRef.current.get('metrics')?.forEach(handler => handler(payload));
                            break;

                        case 'collaboration_update':
                            setCollaborators(prev => {
                                if (payload.action === 'add') {
                                    return [...prev.filter(id => id !== payload.userId), payload.userId];
                                } else if (payload.action === 'remove') {
                                    return prev.filter(id => id !== payload.userId);
                                }
                                return prev;
                            });
                            handlersRef.current.get('collaboration')?.forEach(handler => handler(payload));
                            break;

                        default:
                            // Handle custom handlers
                            handlersRef.current.get(type)?.forEach(handler => handler(payload));
                    }
                } catch (error) {
                    console.error('[Realtime] Failed to parse message:', error);
                }
            };

            ws.onclose = () => {
                console.log('[Realtime] Disconnected');
                setIsConnected(false);
                wsRef.current = null;

                // Attempt reconnection
                if (reconnectAttempts.current < 5) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttempts.current++;
                        console.log(`[Realtime] Reconnecting... (attempt ${reconnectAttempts.current})`);
                        connect();
                    }, Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000));
                }
            };

            ws.onerror = (error) => {
                console.error('[Realtime] Error:', error);
            };

            wsRef.current = ws;
        } catch (error) {
            console.error('[Realtime] Failed to connect:', error);
        }
    }, [simulationId, wsUrl, token]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        if (wsRef.current) {
            wsRef.current.send(JSON.stringify({
                type: 'leave_simulation',
                roomId: simulationId
            }));
            wsRef.current.close();
            wsRef.current = null;
        }

        setIsConnected(false);
        setMetrics(null);
    }, [simulationId]);

    // Send update to collaborators
    const broadcastUpdate = useCallback((data: Partial<RealtimeMetrics>) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'simulation_update',
                payload: data,
                roomId: simulationId
            }));
        }
    }, [simulationId]);

    // Register event handler
    const on = useCallback((event: string, handler: MessageHandler) => {
        if (!handlersRef.current.has(event)) {
            handlersRef.current.set(event, new Set());
        }
        handlersRef.current.get(event)!.add(handler);

        // Return unsubscribe function
        return () => {
            handlersRef.current.get(event)?.delete(handler);
        };
    }, []);

    // Connect when simulationId changes
    useEffect(() => {
        if (simulationId) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [simulationId, connect, disconnect]);

    // Send heartbeat
    useEffect(() => {
        if (!isConnected) return;

        const heartbeat = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000);

        return () => clearInterval(heartbeat);
    }, [isConnected]);

    return {
        isConnected,
        metrics,
        collaborators,
        connect,
        disconnect,
        broadcastUpdate,
        on,
    };
}

/**
 * Collaborative Design Hook
 * For real-time architecture design collaboration
 */
export function useCollaborativeDesign(designId: string | null, userId: string, token?: string) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3006';
    const wsRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [participants, setParticipants] = useState<Map<string, { x: number; y: number; name?: string }>>(new Map());

    const connect = useCallback(() => {
        if (!designId) return;

        const url = token
            ? `${wsUrl}/design/${designId}?token=${encodeURIComponent(token)}`
            : `${wsUrl}/design/${designId}`;
        const ws = new WebSocket(url);

        ws.onopen = () => {
            setIsConnected(true);
            ws.send(JSON.stringify({
                type: 'join_collaboration',
                roomId: designId,
                userId
            }));
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            const { type, payload, userId: senderId } = message;

            if (type === 'cursor_position' && senderId !== userId) {
                setParticipants(prev => {
                    const next = new Map(prev);
                    next.set(senderId, payload);
                    return next;
                });
            } else if (type === 'design_update') {
                // Handle design updates - emit custom event
                window.dispatchEvent(new CustomEvent('design-update', { detail: payload }));
            }
        };

        ws.onclose = () => setIsConnected(false);
        wsRef.current = ws;
    }, [designId, userId, wsUrl, token]);

    const sendCursorPosition = useCallback((x: number, y: number) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'cursor_position',
                payload: { x, y },
                roomId: designId,
                userId
            }));
        }
    }, [designId, userId]);

    const sendDesignUpdate = useCallback((nodes: any[], edges: any[]) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'design_update',
                payload: { nodes, edges },
                roomId: designId,
                userId
            }));
        }
    }, [designId, userId]);

    useEffect(() => {
        if (designId) connect();
        return () => wsRef.current?.close();
    }, [designId, connect]);

    return {
        isConnected,
        participants,
        sendCursorPosition,
        sendDesignUpdate,
    };
}
