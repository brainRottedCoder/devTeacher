import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    SharedDesign,
    Discussion,
    DiscussionReply,
    LeaderboardEntry,
    DiscussionCategory,
} from '@/types/community.types';

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
            const res = await fetch('/api/community/designs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to share design');
            return res.json() as Promise<SharedDesign>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shared-designs'] });
        },
    });
}

export function useDiscussions(options: { category?: DiscussionCategory; limit?: number } = {}) {
    const { category, limit = 20 } = options;

    const { data: discussions, isLoading, error } = useQuery<Discussion[]>({
        queryKey: ['discussions', category, limit],
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
            const res = await fetch('/api/community/discussions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create discussion');
            return res.json() as Promise<Discussion>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['discussions'] });
        },
    });
}

export function useCreateReply() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { discussionId: string; content: string; parentId?: string }) => {
            const res = await fetch('/api/community/discussions/replies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create reply');
            return res.json() as Promise<DiscussionReply>;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['discussion', variables.discussionId] });
        },
    });
}

export function useCreateComment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { designId: string; content: string; parentId?: string }) => {
            const res = await fetch('/api/community/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create comment');
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['shared-design', variables.designId] });
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
            const res = await fetch('/api/community/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to like');
            return res.json() as Promise<{ liked: boolean; count: number }>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shared-designs'] });
            queryClient.invalidateQueries({ queryKey: ['discussions'] });
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
