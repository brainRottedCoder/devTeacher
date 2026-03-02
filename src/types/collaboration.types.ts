import { Node, Edge } from '@xyflow/react';

export interface CollaborationSession {
    id: string;
    design_id: string;
    owner_id: string;
    status: 'active' | 'paused' | 'ended';
    participants: CollaborationParticipant[];
    created_at: string;
    updated_at: string;
    expires_at?: string;
}

export interface CollaborationParticipant {
    id: string;
    session_id: string;
    user_id: string;
    user_name: string;
    user_color: string;
    cursor_position?: CursorPosition;
    selected_nodes?: string[];
    is_active: boolean;
    joined_at: string;
    last_seen_at: string;
}

export interface CursorPosition {
    x: number;
    y: number;
    nodeId?: string;
}

export interface CollaborationEvent {
    id: string;
    session_id: string;
    user_id: string;
    type: CollaborationEventType;
    payload: any;
    timestamp: string;
}

export type CollaborationEventType =
    | 'join'
    | 'leave'
    | 'cursor_move'
    | 'node_add'
    | 'node_update'
    | 'node_delete'
    | 'edge_add'
    | 'edge_delete'
    | 'selection_change'
    | 'viewport_change'
    | 'chat_message'
    | 'undo'
    | 'redo';

export interface CollaborationState {
    session: CollaborationSession | null;
    participants: CollaborationParticipant[];
    cursors: Map<string, CursorPosition>;
    localSelection: string[];
    isSyncing: boolean;
    lastSyncAt: string | null;
    pendingOperations: CollaborationOperation[];
}

export interface CollaborationOperation {
    id: string;
    type: CollaborationEventType;
    payload: any;
    userId: string;
    timestamp: number;
    applied: boolean;
}

export interface SharedDesignState {
    nodes: Node[];
    edges: Edge[];
    version: number;
    lastModifiedBy: string;
    lastModifiedAt: string;
}

export interface DesignComment {
    id: string;
    design_id: string;
    user_id: string;
    user_name: string;
    content: string;
    position?: { x: number; y: number };
    node_id?: string;
    resolved: boolean;
    replies: CommentReply[];
    created_at: string;
}

export interface CommentReply {
    id: string;
    comment_id: string;
    user_id: string;
    user_name: string;
    content: string;
    created_at: string;
}

export interface DesignVersion {
    id: string;
    design_id: string;
    version: number;
    nodes: Node[];
    edges: Edge[];
    created_by: string;
    created_at: string;
    description?: string;
}

export const COLLABORATION_COLORS = [
    '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', 
    '#ef4444', '#ec4899', '#6366f1', '#14b8a6',
];

export function getUserColor(index: number): string {
    return COLLABORATION_COLORS[index % COLLABORATION_COLORS.length];
}
