"use client";

import { useState, useEffect, useCallback } from "react";
import { Achievement, UserAchievement } from "@/types/achievements.types";

export function useAchievements() {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
    const [newlyUnlocked, setNewlyUnlocked] = useState<UserAchievement[]>([]);
    const [xp, setXP] = useState(0);
    const [level, setLevel] = useState(1);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [longestStreak, setLongestStreak] = useState(0);
    const [leaderboardVisible, setLeaderboardVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAchievements = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/achievements");
            if (res.ok) {
                const data = await res.json();
                setAchievements(data.achievements || []);
                setUserAchievements(data.userAchievements || []);
                setXP(data.xp || 0);
                setLevel(data.level || 1);
                setCurrentStreak(data.currentStreak || 0);
                setLongestStreak(data.longestStreak || 0);
                setLeaderboardVisible(data.leaderboardVisible || false);
            }
        } catch (error) {
            console.error("Error fetching achievements:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const checkAndUnlock = useCallback(async () => {
        try {
            const res = await fetch("/api/achievements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            if (res.ok) {
                const data = await res.json();
                if (data.newAchievements?.length > 0) {
                    setUserAchievements((prev) => [...prev, ...data.newAchievements]);
                    setNewlyUnlocked(data.newAchievements);
                    // Clear after 6s (toast display time)
                    setTimeout(() => setNewlyUnlocked([]), 6000);
                }
                if (data.xp !== undefined) setXP(data.xp);
                if (data.level !== undefined) setLevel(data.level);
                if (data.currentStreak !== undefined) setCurrentStreak(data.currentStreak);
                return data.newAchievements || [];
            }
            return [];
        } catch {
            return [];
        }
    }, []);

    useEffect(() => {
        fetchAchievements();
    }, [fetchAchievements]);

    const unlockedIds = new Set(userAchievements.map((ua) => ua.achievement_id));
    // XP needed for next level
    const xpForNextLevel = level * 100;
    const xpProgress = xp - (level - 1) * 100;
    const xpProgressPct = Math.min(100, Math.round((xpProgress / 100) * 100));

    return {
        achievements,
        userAchievements,
        newlyUnlocked,
        unlockedIds,
        xp,
        level,
        xpProgress,
        xpForNextLevel,
        xpProgressPct,
        currentStreak,
        longestStreak,
        leaderboardVisible,
        isLoading,
        checkAndUnlock,
        refetch: fetchAchievements,
    };
}
