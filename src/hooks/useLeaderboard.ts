"use client";

import { useState, useEffect, useCallback } from "react";

export interface LeaderboardEntry {
    rank: number;
    display_name: string;
    xp: number;
    level: number;
    streak: number;
    badge_count: number;
    is_current_user: boolean;
}

export function useLeaderboard() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLeaderboard = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/leaderboard");
            if (res.ok) {
                const data = await res.json();
                setEntries(data.entries || []);
                setCurrentUserRank(data.currentUserRank || null);
            }
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    return { entries, currentUserRank, isLoading, refetch: fetchLeaderboard };
}
