import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Team,
    TeamMember,
    TeamInvitation,
    TeamAnalytics,
    TeamRole,
    TeamLearningPath,
} from '@/types/team.types';

export function useTeams() {
    const queryClient = useQueryClient();

    const { data: teams, isLoading, error } = useQuery<Team[]>({
        queryKey: ['teams'],
        queryFn: async () => {
            const res = await fetch('/api/teams');
            if (!res.ok) throw new Error('Failed to fetch teams');
            const data = await res.json();
            return data.teams || [];
        },
    });

    const createTeam = useMutation({
        mutationFn: async (data: { name: string; description?: string; plan?: string }) => {
            const res = await fetch('/api/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create team');
            return res.json() as Promise<Team>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teams'] });
        },
    });

    const updateTeam = useMutation({
        mutationFn: async (data: { id: string;[key: string]: any }) => {
            const res = await fetch('/api/teams', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update team');
            return res.json() as Promise<Team>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teams'] });
        },
    });

    const deleteTeam = useMutation({
        mutationFn: async (teamId: string) => {
            const res = await fetch(`/api/teams?id=${teamId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete team');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teams'] });
        },
    });

    return {
        teams: teams || [],
        isLoading,
        error,
        createTeam,
        updateTeam,
        deleteTeam,
    };
}

export function useTeam(teamId: string | null) {
    const { data: team, isLoading, error } = useQuery<Team>({
        queryKey: ['team', teamId],
        queryFn: async () => {
            if (!teamId) throw new Error('No team ID');
            const res = await fetch(`/api/teams/${teamId}`);
            if (!res.ok) throw new Error('Failed to fetch team');
            return res.json();
        },
        enabled: !!teamId,
    });

    return { team, isLoading, error };
}

export function useTeamMembers(teamId: string | null) {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery<{ members: TeamMember[]; invitations: TeamInvitation[] }>({
        queryKey: ['team-members', teamId],
        queryFn: async () => {
            if (!teamId) return { members: [], invitations: [] };
            const res = await fetch(`/api/teams/${teamId}/members`);
            if (!res.ok) throw new Error('Failed to fetch members');
            return res.json();
        },
        enabled: !!teamId,
    });

    const inviteMember = useMutation({
        mutationFn: async (data: { email: string; role: TeamRole }) => {
            const res = await fetch(`/api/teams/${teamId}/members/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to invite member');
            return res.json() as Promise<TeamInvitation>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
        },
    });

    const updateMemberRole = useMutation({
        mutationFn: async (data: { memberId: string; role: TeamRole }) => {
            const res = await fetch(`/api/teams/${teamId}/members`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update member');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
        },
    });

    const removeMember = useMutation({
        mutationFn: async (memberId: string) => {
            const res = await fetch(`/api/teams/${teamId}/members?memberId=${memberId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to remove member');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
        },
    });

    return {
        members: data?.members || [],
        invitations: data?.invitations || [],
        isLoading,
        error,
        inviteMember,
        updateMemberRole,
        removeMember,
    };
}

export function useTeamAnalytics(teamId: string | null, period: 'week' | 'month' | 'quarter' = 'month') {
    const { data: analytics, isLoading, error } = useQuery<TeamAnalytics>({
        queryKey: ['team-analytics', teamId, period],
        queryFn: async () => {
            if (!teamId) throw new Error('No team ID');
            const res = await fetch(`/api/teams/analytics?teamId=${teamId}&period=${period}`);
            if (!res.ok) throw new Error('Failed to fetch analytics');
            return res.json();
        },
        enabled: !!teamId,
    });

    return { analytics, isLoading, error };
}

export function useTeamLearningPaths(teamId: string | null) {
    const queryClient = useQueryClient();

    const { data: paths, isLoading } = useQuery<TeamLearningPath[]>({
        queryKey: ['team-paths', teamId],
        queryFn: async () => {
            if (!teamId) return [];
            const res = await fetch(`/api/teams/paths?teamId=${teamId}`);
            if (!res.ok) throw new Error('Failed to fetch team paths');
            return res.json();
        },
        enabled: !!teamId,
    });

    const assignPath = useMutation({
        mutationFn: async (data: { pathId: string; assignedRoles: TeamRole[]; deadline?: string }) => {
            const res = await fetch('/api/teams/paths', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId, ...data }),
            });
            if (!res.ok) throw new Error('Failed to assign path');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['team-paths', teamId] });
        },
    });

    return {
        paths: paths || [],
        isLoading,
        assignPath,
    };
}
