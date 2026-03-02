export type WebSocketEventType =
    | 'connection_ack'
    | 'simulation_update'
    | 'join_simulation'
    | 'leave_simulation'
    | 'collaboration_join'
    | 'collaboration_leave'
    | 'join_collaboration'
    | 'leave_collaboration'
    | 'design_update'
    | 'cursor_position'
    | 'cursor_move'
    | 'node_add'
    | 'node_update'
    | 'node_delete'
    | 'edge_add'
    | 'edge_delete'
    | 'chat_message'
    | 'notification'
    | 'user_presence'
    | 'room_joined'
    | 'interview_feedback'
    | 'ping'
    | 'pong'
    | 'error';

export interface WebSocketMessage<T = any> {
    type: string;
    payload: T;
    timestamp?: number;
    userId?: string;
    roomId?: string;
}

export interface SimulationUpdatePayload {
    simulationId: string;
    users: number;
    metrics: SimulationMetrics;
    bottlenecks: SimulationBottleneck[];
}

export interface SimulationMetrics {
    totalLatency: number;
    throughput: number;
    errorRate: number;
    availability: number;
    cacheHitRate: number;
}

export interface SimulationBottleneck {
    componentId: string;
    componentName: string;
    type: 'cpu' | 'memory' | 'latency' | 'error-rate';
    severity: 'warning' | 'critical';
    message: string;
}

export interface CollaborationPayload {
    userId: string;
    userName: string;
    userColor: string;
    cursorPosition?: { x: number; y: number };
}

export interface NodeUpdatePayload {
    nodeId: string;
    updates: Record<string, any>;
}

export interface ChatMessagePayload {
    messageId: string;
    userId: string;
    userName: string;
    content: string;
    isAI: boolean;
}

export interface NotificationPayload {
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    actionUrl?: string;
}

export interface UserPresencePayload {
    userId: string;
    userName: string;
    status: 'online' | 'away' | 'offline';
    currentPage?: string;
}

export interface WebSocketClientOptions {
    url: string;
    token?: string;
    reconnect?: boolean;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
    onOpen?: () => void;
    onClose?: () => void;
    onError?: (error: Event) => void;
    onMessage?: (message: WebSocketMessage) => void;
}
