export interface LearningPath {
    id: string;
    name: string;
    description: string;
    role: 'backend' | 'frontend' | 'fullstack' | 'devops' | 'sre';
    level: 'junior' | 'mid' | 'senior' | 'staff' | 'principal';
    module_ids: string[];
    estimated_hours: number;
    created_at: string;
}

export interface UserLearningPath {
    id: string;
    user_id: string;
    path_id: string;
    status: 'active' | 'completed' | 'paused';
    started_at: string;
    completed_at: string | null;
    path?: LearningPath;
}

export const ROLE_LABELS: Record<string, string> = {
    backend: 'Backend',
    frontend: 'Frontend',
    fullstack: 'Full-Stack',
    devops: 'DevOps',
    sre: 'SRE',
};

export const LEVEL_LABELS: Record<string, string> = {
    junior: 'Junior',
    mid: 'Mid-Level',
    senior: 'Senior',
    staff: 'Staff',
    principal: 'Principal',
};

export const ROLE_COLORS: Record<string, string> = {
    backend: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    frontend: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    fullstack: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    devops: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    sre: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export const ROLE_ICONS: Record<string, string> = {
    backend: '⚙️',
    frontend: '🎨',
    fullstack: '🚀',
    devops: '🔧',
    sre: '📊',
};
