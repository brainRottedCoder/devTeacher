import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from './useWebSocket';
import {
    CollaborationSession,
    CollaborationParticipant,
    CollaborationEventType,
    CollaborationOperation,
    CursorPosition,
    DesignComment,
    COLLABORATION_COLORS,
} from '@/types/collaboration.types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3006';

export function useCollaboration(designId: string | null) {
    const queryClient = useQueryClient();
    const [session, setSession] = useState<CollaborationSession | null>(null);
    const [participants, setParticipants] = useState<CollaborationParticipant[]>([]);
    const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
    const [pendingOps, setPendingOps] = useState<CollaborationOperation[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const userIdRef = useRef<string>('current-user');
    const participantColorRef = useRef<string>(getRandomColor());

    // WebSocket connection
    const { isConnected: wsConnected, connect, disconnect, send, subscribe } = useWebSocket({
        url: session ? `${WS_URL}/collaboration/${session.id}` : '',
        onOpen: () => {
            setIsConnected(true);
            console.log('[Collaboration] WebSocket connected');
        },
        onClose: () => {
            setIsConnected(false);
            console.log('[Collaboration] WebSocket disconnected');
        },
        onMessage: (message) => {
            console.log('[Collaboration] Received:', message.type);
            switch (message.type) {
                case 'room_joined':
                    console.log('[Collaboration] Joined room:', message.payload);
                    break;
                case 'design_update':
                    handleRemoteOperation(message.payload);
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

    const handleRemoteOperation = useCallback((operation: any) => {
        // Apply remote operations to local state
        switch (operation.type) {
            case 'cursor_move':
                if (operation.payload) {
                    setCursors(prev => {
                        const newCursors = new Map(prev);
                        newCursors.set(operation.payload.participantId, operation.payload.position);
                        return newCursors;
                    });
                }
                break;
            case 'node_add':
            case 'node_update':
            case 'node_delete':
            case 'edge_add':
            case 'edge_delete':
                // These would update the design state
                queryClient.invalidateQueries({ queryKey: ['design', designId] });
                break;
        }
    }, [designId, queryClient]);

    const joinSession = useCallback(async (userId: string, userName: string) => {
        if (!designId) return;
        
        userIdRef.current = userId;

        try {
            const res = await fetch('/api/collaboration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ designId, userId, userName }),
            });

            const data = await res.json();
            
            if (data.session) {
                setSession(data.session);
                setParticipants(data.session.participants || []);
                
                // Connect to WebSocket after getting session
                connect(userId);
                
                // Send join message
                setTimeout(() => {
                    send('join_collaboration', { 
                        userId, 
                        userName, 
                        userColor: participantColorRef.current 
                    }, data.session.id);
                }, 500);
            }
        } catch (error) {
            console.error('Failed to join session:', error);
        }
    }, [designId, connect, send]);

    const leaveSession = useCallback(async (sessionId: string, participantId: string) => {
        try {
            // Send leave message via WebSocket
            send('leave_collaboration', undefined, sessionId);
            
            // Disconnect WebSocket
            disconnect();

            // Call API to clean up
            await fetch(`/api/collaboration?sessionId=${sessionId}&participantId=${participantId}`, {
                method: 'DELETE',
            });
            
            setSession(null);
            setParticipants([]);
            setCursors(new Map());
        } catch (error) {
            console.error('Failed to leave session:', error);
        }
    }, [send, disconnect]);

    const updateCursor = useCallback((participantId: string, position: CursorPosition) => {
        setCursors(prev => {
            const newCursors = new Map(prev);
            newCursors.set(participantId, position);
            return newCursors;
        });

        // Broadcast cursor position via WebSocket
        if (session && isConnected) {
            send('cursor_position', { 
                participantId, 
                position,
                userId: userIdRef.current 
            }, session.id);
        }
    }, [session, isConnected, send]);

    const broadcastEvent = useCallback((type: CollaborationEventType, payload: any) => {
        const operation: CollaborationOperation = {
            id: `op-${Date.now()}`,
            type,
            payload,
            userId: userIdRef.current,
            timestamp: Date.now(),
            applied: false,
        };

        setPendingOps(prev => [...prev, operation]);

        // Send via WebSocket
        if (session && isConnected) {
            send('design_update', operation, session.id);
        }
    }, [session, isConnected, send]);

    const applyRemoteOperation = useCallback((operation: CollaborationOperation) => {
        handleRemoteOperation(operation);
    }, [handleRemoteOperation]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (session) {
                disconnect();
            }
        };
    }, [session, disconnect]);

    return {
        session,
        participants,
        cursors,
        pendingOps,
        isConnected,
        participantColor: participantColorRef.current,
        joinSession,
        leaveSession,
        updateCursor,
        broadcastEvent,
        applyRemoteOperation,
    };
}

export function useDesignComments(designId: string | null) {
    const queryClient = useQueryClient();

    const { data: comments, isLoading } = useQuery<DesignComment[]>({
        queryKey: ['design-comments', designId],
        queryFn: async () => {
            if (!designId) return [];
            const res = await fetch(`/api/collaboration/comments?designId=${designId}`);
            if (!res.ok) throw new Error('Failed to fetch comments');
            return res.json();
        },
        enabled: !!designId,
    });

    const addComment = useMutation({
        mutationFn: async (data: {
            content: string;
            nodeId?: string;
            position?: { x: number; y: number };
        }) => {
            const res = await fetch('/api/collaboration/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ designId, ...data, userId: 'current', userName: 'You' }),
            });
            if (!res.ok) throw new Error('Failed to add comment');
            return res.json() as Promise<DesignComment>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['design-comments', designId] });
        },
    });

    const resolveComment = useMutation({
        mutationFn: async (commentId: string) => {
            const res = await fetch('/api/collaboration/comments', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commentId, resolved: true }),
            });
            if (!res.ok) throw new Error('Failed to resolve comment');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['design-comments', designId] });
        },
    });

    const replyToComment = useMutation({
        mutationFn: async (data: { commentId: string; content: string }) => {
            const res = await fetch('/api/collaboration/comments', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    commentId: data.commentId,
                    reply: { user_id: 'current', user_name: 'You', content: data.content },
                }),
            });
            if (!res.ok) throw new Error('Failed to reply');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['design-comments', designId] });
        },
    });

    return {
        comments: comments || [],
        isLoading,
        addComment,
        resolveComment,
        replyToComment,
    };
}

export function useDesignVersions(designId: string | null) {
    const { data: versions, isLoading } = useQuery({
        queryKey: ['design-versions', designId],
        queryFn: async () => {
            if (!designId) return [];
            const res = await fetch(`/api/collaboration/comments?designId=${designId}&type=versions`);
            if (!res.ok) throw new Error('Failed to fetch versions');
            return res.json();
        },
        enabled: !!designId,
    });

    return { versions: versions || [], isLoading };
}

function getRandomColor(): string {
    return COLLABORATION_COLORS[Math.floor(Math.random() * COLLABORATION_COLORS.length)];
}
