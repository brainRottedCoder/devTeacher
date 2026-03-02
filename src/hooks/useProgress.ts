"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface UserProgress {
    id: string;
    user_id: string;
    lesson_id: string;
    module_id: string;
    status: 'not_started' | 'in_progress' | 'completed';
    completed_at: string | null;
    created_at: string;
    updated_at: string;
}

interface ProgressResponse {
    progress: UserProgress[];
}

async function fetchProgress(): Promise<UserProgress[]> {
    const response = await fetch("/api/progress");
    if (!response.ok) {
        if (response.status === 401) {
            return []; // Not authenticated
        }
        throw new Error("Failed to fetch progress");
    }
    const data: ProgressResponse = await response.json();
    return data.progress || [];
}

export interface UpdateProgressParams {
    module_id: string;
    lesson_id: string;
    status?: string;
}

async function updateProgress(params: UpdateProgressParams): Promise<UserProgress> {
    const response = await fetch("/api/progress", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        throw new Error("Failed to update progress");
    }
    const data = await response.json();
    return data.progress;
}

export function useProgress() {
    return useQuery({
        queryKey: ["progress"],
        queryFn: fetchProgress,
        staleTime: 60 * 1000, // 1 minute
    });
}

export function useUpdateProgress() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateProgress,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["progress"] });
        },
    });
}
