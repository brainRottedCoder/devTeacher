export interface Team {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logo_url?: string;
    owner_id: string;
    plan: 'free' | 'pro' | 'enterprise';
    max_members: number;
    settings: TeamSettings;
    created_at: string;
    updated_at: string;
}

export interface TeamSettings {
    allowMemberInvite: boolean;
    requireApproval: boolean;
    defaultRole: TeamRole;
    features: {
        sharedDesigns: boolean;
        sharedLearningPaths: boolean;
        analytics: boolean;
        certifications: boolean;
    };
}

export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface TeamMember {
    id: string;
    team_id: string;
    user_id: string;
    role: TeamRole;
    joined_at: string;
    invited_by?: string;
    user?: TeamUser;
}

export interface TeamUser {
    id: string;
    name: string | null;
    email: string;
    avatar_url: string | null;
}

export interface TeamInvitation {
    id: string;
    team_id: string;
    email: string;
    role: TeamRole;
    token: string;
    invited_by: string;
    expires_at: string;
    accepted_at?: string;
    team?: Team;
}

export interface TeamAnalytics {
    teamId: string;
    period: 'week' | 'month' | 'quarter';
    metrics: {
        totalMembers: number;
        activeMembers: number;
        avgProgress: number;
        modulesCompleted: number;
        certificationsEarned: number;
        designsCreated: number;
        avgSessionTime: number;
    };
    memberStats: MemberStats[];
    topPerformers: TopPerformer[];
    activityTimeline: ActivityEvent[];
}

export interface MemberStats {
    userId: string;
    userName: string;
    modulesCompleted: number;
    avgScore: number;
    timeSpent: number;
    lastActive: string;
}

export interface TopPerformer {
    userId: string;
    userName: string;
    score: number;
    badge: string;
}

export interface ActivityEvent {
    id: string;
    type: 'module_complete' | 'certification' | 'design_create' | 'path_complete';
    userId: string;
    userName: string;
    description: string;
    timestamp: string;
}

export interface TeamLearningPath {
    id: string;
    team_id: string;
    name: string;
    description?: string;
    assigned_roles: TeamRole[];
    module_ids: string[];
    deadline?: string;
    created_by: string;
    created_at: string;
    progress?: TeamPathProgress;
}

export interface TeamPathProgress {
    pathId: string;
    totalMembers: number;
    completedMembers: number;
    avgProgress: number;
    memberProgress: MemberPathProgress[];
}

export interface MemberPathProgress {
    userId: string;
    userName: string;
    progress: number;
    status: 'not_started' | 'in_progress' | 'completed';
    startedAt?: string;
    completedAt?: string;
}

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
    viewer: 'Viewer',
};

export const TEAM_ROLE_COLORS: Record<TeamRole, string> = {
    owner: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    admin: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    member: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    viewer: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export const TEAM_PLAN_LABELS: Record<string, string> = {
    free: 'Free',
    pro: 'Pro',
    enterprise: 'Enterprise',
};

export const TEAM_PLAN_LIMITS: Record<string, number> = {
    free: 5,
    pro: 25,
    enterprise: 100,
};
