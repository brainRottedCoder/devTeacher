export interface SharedDesign {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    design_data: ArchitectureDesignData;
    preview_image?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    tags: string[];
    likes_count: number;
    comments_count: number;
    views_count: number;
    is_featured: boolean;
    is_public: boolean;
    user?: CommunityUser;
    comments?: DesignCommentData[];
    created_at: string;
    updated_at: string;
}

export interface ArchitectureDesignData {
    nodes: any[];
    edges: any[];
    name?: string;
    exportedAt?: string;
    analysis?: {
        score: number;
        issues: string[];
        recommendations: string[];
        estimatedCost?: {
            monthly: number;
            breakdown: Record<string, number>;
        };
    };
}

export interface DesignCommentData {
    id: string;
    design_id: string;
    user_id: string;
    content: string;
    parent_id?: string;
    likes_count: number;
    user?: CommunityUser;
    replies?: DesignCommentData[];
    created_at: string;
    updated_at: string;
}

export interface Discussion {
    id: string;
    user_id: string;
    title: string;
    content: string;
    category: DiscussionCategory;
    tags: string[];
    replies_count: number;
    views_count: number;
    is_pinned: boolean;
    is_hot: boolean;
    last_reply_at?: string;
    user?: CommunityUser;
    last_reply_user?: CommunityUser;
    created_at: string;
    updated_at: string;
}

export interface DiscussionReply {
    id: string;
    discussion_id: string;
    user_id: string;
    parent_id?: string;
    content: string;
    likes_count: number;
    is_accepted_answer: boolean;
    user?: CommunityUser;
    replies?: DiscussionReply[];
    created_at: string;
    updated_at: string;
}

export interface CommunityUser {
    id: string;
    name: string | null;
    avatar_url: string | null;
    score: number;
    streak: number;
    badges: UserBadge[];
}

export interface UserBadge {
    id: string;
    name: string;
    icon: string;
    earned_at: string;
}

export interface LeaderboardEntry {
    rank: number;
    user_id: string;
    user: CommunityUser;
    score: number;
    streak: number;
    change: number;
}

export interface Likeable {
    id: string;
    type: 'design' | 'discussion' | 'reply';
    user_id: string;
}

export type DiscussionCategory = 
    | 'system_design'
    | 'architecture'
    | 'interviews'
    | 'career'
    | 'theory'
    | 'general';

export const DISCUSSION_CATEGORIES: { value: DiscussionCategory; label: string; icon: string }[] = [
    { value: 'system_design', label: 'System Design', icon: '🏗️' },
    { value: 'architecture', label: 'Architecture', icon: '蓝图' },
    { value: 'interviews', label: 'Interviews', icon: '💼' },
    { value: 'career', label: 'Career', icon: '📈' },
    { value: 'theory', label: 'Theory', icon: '📚' },
    { value: 'general', label: 'General', icon: '💬' },
];

export const DESIGN_DIFFICULTY_LABELS = {
    easy: { label: 'Easy', color: 'text-green-400', bg: 'bg-green-500/20' },
    medium: { label: 'Medium', color: 'text-amber-400', bg: 'bg-amber-500/20' },
    hard: { label: 'Hard', color: 'text-red-400', bg: 'bg-red-500/20' },
};

export const SORT_OPTIONS = [
    { value: 'trending', label: 'Trending' },
    { value: 'newest', label: 'Newest' },
    { value: 'most_liked', label: 'Most Liked' },
    { value: 'most_discussed', label: 'Most Discussed' },
] as const;
