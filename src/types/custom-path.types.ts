import { Node, Edge } from '@xyflow/react';

export interface CustomLearningPath {
    id: string;
    user_id: string;
    team_id?: string;
    name: string;
    description?: string;
    is_public: boolean;
    is_template: boolean;
    target_role?: string;
    target_level?: string;
    estimated_hours: number;
    items: LearningPathItem[];
    prerequisites?: string[];
    outcomes?: string[];
    created_at: string;
    updated_at: string;
    enrollment_count?: number;
    user_progress?: UserPathProgress;
}

export interface LearningPathItem {
    id: string;
    type: 'module' | 'quiz' | 'lab' | 'project' | 'assessment';
    item_id: string;
    order: number;
    is_required: boolean;
    estimated_minutes: number;
    metadata?: {
        title?: string;
        description?: string;
        difficulty?: string;
    };
}

export interface UserPathProgress {
    path_id: string;
    user_id: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'paused';
    started_at?: string;
    completed_at?: string;
    current_item_index: number;
    total_progress: number;
    item_progress: ItemProgress[];
    time_spent_minutes: number;
}

export interface ItemProgress {
    item_id: string;
    status: 'locked' | 'available' | 'in_progress' | 'completed';
    started_at?: string;
    completed_at?: string;
    score?: number;
    time_spent_minutes?: number;
}

export interface PathTemplate {
    id: string;
    name: string;
    description: string;
    role: string;
    level: string;
    estimated_hours: number;
    items: LearningPathItem[];
    outcomes: string[];
    is_popular: boolean;
}

export interface PathRecommendation {
    path_id: string;
    path: CustomLearningPath;
    relevance_score: number;
    reason: string;
    missing_skills: string[];
}

export const PATH_ITEM_TYPES: { value: LearningPathItem['type']; label: string; icon: string }[] = [
    { value: 'module', label: 'Module', icon: '📚' },
    { value: 'quiz', label: 'Quiz', icon: '❓' },
    { value: 'lab', label: 'Lab', icon: '🔬' },
    { value: 'project', label: 'Project', icon: '🏗️' },
    { value: 'assessment', label: 'Assessment', icon: '📊' },
];

export const PATH_STATUS_COLORS: Record<string, string> = {
    not_started: 'bg-gray-500/20 text-gray-400',
    in_progress: 'bg-blue-500/20 text-blue-400',
    completed: 'bg-emerald-500/20 text-emerald-400',
    paused: 'bg-amber-500/20 text-amber-400',
};

export const PATH_ITEM_STATUS_COLORS: Record<string, string> = {
    locked: 'text-gray-500',
    available: 'text-blue-400',
    in_progress: 'text-amber-400',
    completed: 'text-emerald-400',
};
