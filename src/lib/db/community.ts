import { createClient } from '@supabase/supabase-js';

function getServerClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
}

export interface SharedDesignWithUser {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    design_data: any;
    preview_image: string | null;
    difficulty: 'easy' | 'medium' | 'hard';
    tags: string[];
    likes_count: number;
    comments_count: number;
    views_count: number;
    is_featured: boolean;
    is_public: boolean;
    created_at: string;
    updated_at: string;
    user: {
        id: string;
        name: string | null;
        avatar_url: string | null;
        score: number;
        streak: number;
    } | null;
}

export interface DiscussionWithUser {
    id: string;
    user_id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
    replies_count: number;
    views_count: number;
    is_pinned: boolean;
    is_hot: boolean;
    last_reply_at: string | null;
    created_at: string;
    updated_at: string;
    user: {
        id: string;
        name: string | null;
        avatar_url: string | null;
        score: number;
        streak: number;
    } | null;
}

export interface ReplyWithUser {
    id: string;
    discussion_id: string;
    user_id: string;
    parent_id: string | null;
    content: string;
    likes_count: number;
    is_accepted_answer: boolean;
    created_at: string;
    updated_at: string;
    user: {
        id: string;
        name: string | null;
        avatar_url: string | null;
    } | null;
    replies?: ReplyWithUser[];
}

export const communityDb = {
    async getSharedDesigns(options: {
        sortBy?: string;
        limit?: number;
        offset?: number;
        userId?: string;
    } = {}): Promise<SharedDesignWithUser[]> {
        const supabase = getServerClient();
        const { sortBy = 'trending', limit = 20, offset = 0 } = options;

        let query = supabase
            .from('shared_designs')
            .select(`
                *,
                user:users (
                    id,
                    name,
                    avatar_url
                )
            `)
            .eq('is_public', true)
            .range(offset, offset + limit - 1);

        switch (sortBy) {
            case 'newest':
                query = query.order('created_at', { ascending: false });
                break;
            case 'most_liked':
                query = query.order('likes_count', { ascending: false });
                break;
            case 'most_discussed':
                query = query.order('comments_count', { ascending: false });
                break;
            default:
                query = query.order('is_featured', { ascending: false })
                    .order('likes_count', { ascending: false });
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching designs:', error);
            return [];
        }

        return (data || []).map((design: any) => ({
            ...design,
            user: design.user ? {
                ...design.user,
                score: 0,
                streak: 0,
            } : null,
        }));
    },

    async getSharedDesign(id: string): Promise<SharedDesignWithUser | null> {
        const supabase = getServerClient();

        const { data, error } = await supabase
            .from('shared_designs')
            .select(`
                *,
                user:users (
                    id,
                    name,
                    avatar_url
                )
            `)
            .eq('id', id)
            .single();

        if (error || !data) {
            return null;
        }

        await supabase.rpc('increment_design_views', { design_id: id });

        return {
            ...data,
            user: data.user ? {
                ...data.user,
                score: 0,
                streak: 0,
            } : null,
        };
    },

    async createSharedDesign(input: {
        user_id: string;
        title: string;
        description?: string;
        design_data: any;
        difficulty?: 'easy' | 'medium' | 'hard';
        tags?: string[];
        preview_image?: string;
    }): Promise<SharedDesignWithUser | null> {
        const supabase = getServerClient();

        const { data: design, error } = await supabase
            .from('shared_designs')
            .insert({
                user_id: input.user_id,
                title: input.title,
                description: input.description || null,
                design_data: input.design_data,
                difficulty: input.difficulty || 'medium',
                tags: input.tags || [],
                preview_image: input.preview_image || null,
            })
            .select(`
                *,
                user:users (
                    id,
                    name,
                    avatar_url
                )
            `)
            .single();

        if (error) {
            console.error('Error creating design:', error);
            return null;
        }

        await this.updateUserScore(input.user_id, 10);

        return {
            ...design,
            user: design.user ? {
                ...design.user,
                score: 0,
                streak: 0,
            } : null,
        };
    },

    async getDesignComments(designId: string): Promise<any[]> {
        const supabase = getServerClient();

        const { data, error } = await supabase
            .from('design_comments')
            .select(`
                *,
                user:users (
                    id,
                    name,
                    avatar_url
                )
            `)
            .eq('design_id', designId)
            .is('parent_id', null)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching comments:', error);
            return [];
        }

        return data || [];
    },

    async createDesignComment(input: {
        design_id: string;
        user_id: string;
        content: string;
        parent_id?: string;
    }): Promise<any | null> {
        const supabase = getServerClient();

        const { data: comment, error } = await supabase
            .from('design_comments')
            .insert({
                design_id: input.design_id,
                user_id: input.user_id,
                content: input.content,
                parent_id: input.parent_id || null,
            })
            .select(`
                *,
                user:users (
                    id,
                    name,
                    avatar_url
                )
            `)
            .single();

        if (error) {
            console.error('Error creating comment:', error);
            return null;
        }

        const { data: designData } = await supabase
            .from('shared_designs')
            .select('comments_count')
            .eq('id', input.design_id)
            .single();

        if (designData) {
            await supabase
                .from('shared_designs')
                .update({ comments_count: (designData.comments_count || 0) + 1 })
                .eq('id', input.design_id);
        }

        return comment;
    },

    async getDiscussions(options: {
        category?: string;
        limit?: number;
        offset?: number;
    } = {}): Promise<DiscussionWithUser[]> {
        const supabase = getServerClient();
        const { category, limit = 20, offset = 0 } = options;

        let query = supabase
            .from('discussions')
            .select(`
                *,
                user:users (
                    id,
                    name,
                    avatar_url
                )
            `)
            .range(offset, offset + limit - 1);

        if (category) {
            query = query.eq('category', category);
        }

        query = query
            .order('is_pinned', { ascending: false })
            .order('is_hot', { ascending: false })
            .order('last_reply_at', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching discussions:', error);
            return [];
        }

        return (data || []).map((disc: any) => ({
            ...disc,
            user: disc.user ? {
                ...disc.user,
                score: 0,
                streak: 0,
            } : null,
        }));
    },

    async getDiscussion(id: string): Promise<(DiscussionWithUser & { replies: ReplyWithUser[] }) | null> {
        const supabase = getServerClient();

        const { data: discussion, error } = await supabase
            .from('discussions')
            .select(`
                *,
                user:users (
                    id,
                    name,
                    avatar_url
                )
            `)
            .eq('id', id)
            .single();

        if (error || !discussion) {
            return null;
        }

        await supabase.rpc('increment_discussion_views', { discussion_id: id });

        const { data: replies } = await supabase
            .from('discussion_replies')
            .select(`
                *,
                user:users (
                    id,
                    name,
                    avatar_url
                )
            `)
            .eq('discussion_id', id)
            .order('created_at', { ascending: true });

        return {
            ...discussion,
            user: discussion.user ? {
                ...discussion.user,
                score: 0,
                streak: 0,
            } : null,
            replies: (replies || []) as ReplyWithUser[],
        };
    },

    async createDiscussion(input: {
        user_id: string;
        title: string;
        content: string;
        category: string;
        tags?: string[];
    }): Promise<DiscussionWithUser | null> {
        const supabase = getServerClient();

        const { data: discussion, error } = await supabase
            .from('discussions')
            .insert({
                user_id: input.user_id,
                title: input.title,
                content: input.content,
                category: input.category,
                tags: input.tags || [],
            })
            .select(`
                *,
                user:users (
                    id,
                    name,
                    avatar_url
                )
            `)
            .single();

        if (error) {
            console.error('Error creating discussion:', error);
            return null;
        }

        await this.updateUserScore(input.user_id, 5);

        return {
            ...discussion,
            user: discussion.user ? {
                ...discussion.user,
                score: 0,
                streak: 0,
            } : null,
        };
    },

    async createReply(input: {
        discussion_id: string;
        user_id: string;
        content: string;
        parent_id?: string;
    }): Promise<ReplyWithUser | null> {
        const supabase = getServerClient();

        const { data: reply, error } = await supabase
            .from('discussion_replies')
            .insert({
                discussion_id: input.discussion_id,
                user_id: input.user_id,
                content: input.content,
                parent_id: input.parent_id || null,
            })
            .select(`
                *,
                user:users (
                    id,
                    name,
                    avatar_url
                )
            `)
            .single();

        if (error) {
            console.error('Error creating reply:', error);
            return null;
        }

        const { data: discData } = await supabase
            .from('discussions')
            .select('replies_count')
            .eq('id', input.discussion_id)
            .single();

        if (discData) {
            await supabase
                .from('discussions')
                .update({
                    replies_count: (discData.replies_count || 0) + 1,
                    last_reply_at: new Date().toISOString(),
                })
                .eq('id', input.discussion_id);
        }

        await this.updateUserScore(input.user_id, 2);

        return reply as ReplyWithUser;
    },

    async toggleLike(userId: string, type: 'design' | 'discussion' | 'reply' | 'comment', id: string): Promise<{ liked: boolean; count: number }> {
        const supabase = getServerClient();

        const { data, error } = await supabase.rpc('toggle_like', {
            p_user_id: userId,
            p_likeable_type: type,
            p_likeable_id: id,
        });

        if (error) {
            console.error('Error toggling like:', error);
            
            const { data: existing } = await supabase
                .from('likes')
                .select('id')
                .eq('user_id', userId)
                .eq('likeable_type', type)
                .eq('likeable_id', id)
                .single();

            if (existing) {
                await supabase
                    .from('likes')
                    .delete()
                    .eq('id', existing.id);
                return { liked: false, count: 0 };
            } else {
                await supabase
                    .from('likes')
                    .insert({
                        user_id: userId,
                        likeable_type: type,
                        likeable_id: id,
                    });
                return { liked: true, count: 1 };
            }
        }

        return data || { liked: false, count: 0 };
    },

    async getLeaderboard(timeframe: 'week' | 'month' | 'all' = 'month'): Promise<any[]> {
        const supabase = getServerClient();

        const { data, error } = await supabase
            .from('user_scores')
            .select(`
                *,
                user:users (
                    id,
                    name,
                    avatar_url
                )
            `)
            .order('score', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching leaderboard:', error);
            return [];
        }

        return (data || []).map((entry: any, index: number) => ({
            rank: index + 1,
            user_id: entry.user_id,
            score: entry.score,
            streak: entry.streak,
            change: 0,
            user: entry.user ? {
                ...entry.user,
                score: entry.score,
                streak: entry.streak,
                badges: [],
            } : null,
        }));
    },

    async getCommunityStats(): Promise<{
        totalDesigns: number;
        totalDiscussions: number;
        totalUsers: number;
        activeToday: number;
    }> {
        const supabase = getServerClient();

        const [designsResult, discussionsResult, usersResult] = await Promise.all([
            supabase.from('shared_designs').select('id', { count: 'exact', head: true }),
            supabase.from('discussions').select('id', { count: 'exact', head: true }),
            supabase.from('user_scores').select('id', { count: 'exact', head: true }),
        ]);

        return {
            totalDesigns: designsResult.count || 0,
            totalDiscussions: discussionsResult.count || 0,
            totalUsers: usersResult.count || 0,
            activeToday: Math.floor((usersResult.count || 0) * 0.1),
        };
    },

    async updateUserScore(userId: string, points: number): Promise<void> {
        const supabase = getServerClient();

        const { data: existing } = await supabase
            .from('user_scores')
            .select('*')
            .eq('user_id', userId)
            .single();

        const today = new Date().toISOString().split('T')[0];

        if (existing) {
            const lastActivity = existing.last_activity_date;
            let newStreak = existing.streak || 0;

            if (lastActivity) {
                const lastDate = new Date(lastActivity);
                const todayDate = new Date(today);
                const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    newStreak = (existing.streak || 0) + 1;
                } else if (diffDays > 1) {
                    newStreak = 1;
                }
            } else {
                newStreak = 1;
            }

            await supabase
                .from('user_scores')
                .update({
                    score: (existing.score || 0) + points,
                    streak: newStreak,
                    last_activity_date: today,
                })
                .eq('user_id', userId);
        } else {
            await supabase
                .from('user_scores')
                .insert({
                    user_id: userId,
                    score: points,
                    streak: 1,
                    last_activity_date: today,
                });
        }
    },

    async getUserLikes(userId: string): Promise<Record<string, boolean>> {
        const supabase = getServerClient();

        const { data, error } = await supabase
            .from('likes')
            .select('likeable_type, likeable_id')
            .eq('user_id', userId);

        if (error) {
            return {};
        }

        return (data || []).reduce((acc, like) => {
            acc[`${like.likeable_type}_${like.likeable_id}`] = true;
            return acc;
        }, {} as Record<string, boolean>);
    },
};
