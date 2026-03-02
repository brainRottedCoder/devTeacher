export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'learning' | 'streak' | 'quiz' | 'interview' | 'design' | 'community';
    criteria: AchievementCriteria;
    created_at: string;
}

export interface UserAchievement {
    id: string;
    user_id: string;
    achievement_id: string;
    unlocked_at: string;
    achievement?: Achievement;
}

export interface AchievementCriteria {
    type: string;
    count?: number;
    min_score?: number;
}

// Pre-defined badge icons for display
export const BADGE_ICONS: Record<string, string> = {
    'First Steps': '👶',
    'Module Master': '📚',
    'Bookworm': '🐛',
    'On Fire': '🔥',
    'Unstoppable': '⚡',
    'Month Warrior': '🏆',
    'Quiz Whiz': '🎯',
    'Perfect Score': '💯',
    'Interview Ready': '🎤',
    'Interview Pro': '⭐',
    'Architect': '🏗️',
    'System Designer': '🌐',
};

export const CATEGORY_COLORS: Record<string, string> = {
    learning: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    streak: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    quiz: 'bg-green-500/20 text-green-400 border-green-500/30',
    interview: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    design: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    community: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
};
