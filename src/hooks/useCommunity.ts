import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    SharedDesign,
    Discussion,
    DiscussionReply,
    LeaderboardEntry,
    DiscussionCategory,
} from '@/types/community.types';
import { createClient } from '@/lib/supabase/client';

// Helper to get auth token
async function getAuthHeader() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        return `Bearer ${session.access_token}`;
    }
    return null;
}

export function useSharedDesigns(options: { sortBy?: string; limit?: number } = {}) {
    const { sortBy = 'trending', limit = 20 } = options;

    const { data: designs, isLoading, error } = useQuery<SharedDesign[]>({
        queryKey: ['shared-designs', sortBy, limit],
        queryFn: async () => {
            const params = new URLSearchParams({ sortBy, limit: String(limit) });
            const res = await fetch(`/api/community/designs?${params}`);
            if (!res.ok) throw new Error('Failed to fetch designs');
            return res.json();
        },
    });

    return { designs: designs || [], isLoading, error };
}

export function useSharedDesign(id: string) {
    const { data: design, isLoading, error } = useQuery<SharedDesign & { comments: any[] }>({
        queryKey: ['shared-design', id],
        queryFn: async () => {
            const res = await fetch(`/api/community/designs/${id}`);
            if (!res.ok) throw new Error('Failed to fetch design');
            return res.json();
        },
        enabled: !!id,
    });

    return { design, isLoading, error };
}

export function useShareDesign() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            title: string;
            description?: string;
            designData: any;
            difficulty: 'easy' | 'medium' | 'hard';
            tags: string[];
            previewImage?: string;
        }) => {
            const authHeader = await getAuthHeader();
            if (!authHeader) {
                throw new Error('You must be logged in to share a design');
            }
            
            const res = await fetch('/api/community/designs', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to share design');
            }
            return res.json() as Promise<SharedDesign>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shared-designs'] });
            queryClient.invalidateQueries({ queryKey: ['community-stats'] });
        },
    });
}

export function useDiscussions(options: { category?: DiscussionCategory; limit?: number } = {}) {
    const { category, limit = 20 } = options;

    const { data: discussions, isLoading, error } = useQuery<Discussion[]>({
        queryKey: ['discussions', category ?? 'all', limit],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (category) params.append('category', category);
            if (limit) params.append('limit', String(limit));
            
            const res = await fetch(`/api/community/discussions?${params}`);
            if (!res.ok) throw new Error('Failed to fetch discussions');
            return res.json();
        },
    });

    return { discussions: discussions || [], isLoading, error };
}

export function useDiscussion(id: string) {
    const { data: discussion, isLoading, error } = useQuery<Discussion & { replies: DiscussionReply[] }>({
        queryKey: ['discussion', id],
        queryFn: async () => {
            const res = await fetch(`/api/community/discussions/${id}`);
            if (!res.ok) throw new Error('Failed to fetch discussion');
            return res.json();
        },
        enabled: !!id,
    });

    return { discussion, isLoading, error };
}

export function useCreateDiscussion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            title: string;
            content: string;
            category: DiscussionCategory;
            tags: string[];
        }) => {
            const authHeader = await getAuthHeader();
            if (!authHeader) {
                throw new Error('You must be logged in to create a discussion');
            }
            
            const res = await fetch('/api/community/discussions', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create discussion');
            }
            return res.json() as Promise<Discussion>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['discussions'] });
            queryClient.invalidateQueries({ queryKey: ['community-stats'] });
        },
    });
}

export function useUpdateDiscussion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            id: string;
            title?: string;
            content?: string;
            category?: DiscussionCategory;
            tags?: string[];
        }) => {
            const authHeader = await getAuthHeader();
            if (!authHeader) {
                throw new Error('You must be logged in to update a discussion');
            }
            
            const { id, ...updateData } = data;
            
            const res = await fetch(`/api/community/discussions/${id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify(updateData),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to update discussion');
            }
            return res.json() as Promise<Discussion>;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['discussions'] });
            queryClient.invalidateQueries({ queryKey: ['discussion', variables.id] });
        },
    });
}

export function useDeleteDiscussion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const authHeader = await getAuthHeader();
            if (!authHeader) {
                throw new Error('You must be logged in to delete a discussion');
            }
            
            const res = await fetch(`/api/community/discussions/${id}`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': authHeader
                },
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to delete discussion');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['discussions'] });
            queryClient.invalidateQueries({ queryKey: ['community-stats'] });
        },
    });
}

export function useCreateReply() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { discussionId: string; content: string; parentId?: string }) => {
            const authHeader = await getAuthHeader();
            if (!authHeader) {
                throw new Error('You must be logged in to reply');
            }
            
            const res = await fetch('/api/community/discussions/replies', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create reply');
            return res.json() as Promise<DiscussionReply>;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['discussion', variables.discussionId] });
            queryClient.invalidateQueries({ queryKey: ['discussions'] });
        },
    });
}

export function useCreateComment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { designId: string; content: string; parentId?: string }) => {
            const authHeader = await getAuthHeader();
            if (!authHeader) {
                throw new Error('You must be logged in to comment');
            }
            
            const res = await fetch('/api/community/comments', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create comment');
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['shared-design', variables.designId] });
            queryClient.invalidateQueries({ queryKey: ['shared-designs'] });
        },
    });
}

export function useLeaderboard(timeframe: 'week' | 'month' | 'all' = 'month') {
    const { data: leaderboard, isLoading, error } = useQuery<LeaderboardEntry[]>({
        queryKey: ['leaderboard', timeframe],
        queryFn: async () => {
            const res = await fetch(`/api/community/leaderboard?timeframe=${timeframe}`);
            if (!res.ok) throw new Error('Failed to fetch leaderboard');
            return res.json();
        },
    });

    return { leaderboard: leaderboard || [], isLoading, error };
}

export function useLike() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { type: 'design' | 'discussion' | 'reply' | 'comment'; id: string }) => {
            const authHeader = await getAuthHeader();
            if (!authHeader) {
                throw new Error('You must be logged in to like');
            }
            
            const res = await fetch('/api/community/like', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to like');
            return res.json() as Promise<{ liked: boolean; count: number }>;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['shared-designs'] });
            queryClient.invalidateQueries({ queryKey: ['discussions'] });
            queryClient.invalidateQueries({ queryKey: ['shared-design', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['discussion', variables.id] });
        },
    });
}

export function useCommunityStats() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['community-stats'],
        queryFn: async () => {
            const res = await fetch('/api/community/stats');
            if (!res.ok) throw new Error('Failed to fetch stats');
            return res.json() as Promise<{
                totalDesigns: number;
                totalDiscussions: number;
                totalUsers: number;
                activeToday: number;
            }>;
        },
    });

    return { stats, isLoading };
}
