import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// XP rewards per achievement category
const XP_REWARDS: Record<string, number> = {
    learning: 50,
    streak: 75,
    quiz: 60,
    interview: 100,
    design: 80,
    community: 120,
};

async function getAuthUser(supabase: any) {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user ?? null;
}

// Update streak server-side and return updated value
async function updateStreak(supabase: any, userId: string): Promise<number> {
    const { data: userData } = await (supabase.from("profiles") as any)
        .select("current_streak, longest_streak, streak_last_date")
        .eq("id", userId)
        .single();

    if (!userData) return 0;

    const today = new Date().toISOString().split("T")[0];
    const lastDate = userData.streak_last_date;

    if (lastDate === today) {
        return userData.current_streak; // Already updated today
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    let newStreak = lastDate === yesterday ? userData.current_streak + 1 : 1;
    let longestStreak = Math.max(userData.longest_streak || 0, newStreak);

    await (supabase.from("profiles") as any)
        .update({
            current_streak: newStreak,
            longest_streak: longestStreak,
            streak_last_date: today,
        })
        .eq("id", userId);

    return newStreak;
}

// Award XP and recalculate level
async function awardXP(supabase: any, userId: string, xpAmount: number) {
    const { data: userData } = await (supabase.from("profiles") as any)
        .select("xp")
        .eq("id", userId)
        .single();

    const currentXP = (userData?.xp || 0) + xpAmount;
    const newLevel = Math.floor(currentXP / 100) + 1;

    await (supabase.from("profiles") as any)
        .update({ xp: currentXP, level: newLevel })
        .eq("id", userId);

    return { xp: currentXP, level: newLevel };
}

// GET: Fetch all achievements and user's earned ones
export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const user = await getAuthUser(supabase);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch all achievements
        const { data: achievements } = await (supabase.from("achievements") as any)
            .select("*")
            .order("category");

        // Fetch user's earned achievements
        const { data: userAchievements } = await (supabase.from("user_achievements") as any)
            .select("*, achievement:achievements(*)")
            .eq("user_id", user.id);

        // Fetch user's XP/level/streak
        const { data: userData } = await (supabase.from("profiles") as any)
            .select("xp, level, current_streak, longest_streak, leaderboard_visible, display_name")
            .eq("id", user.id)
            .single();

        return NextResponse.json({
            achievements: achievements || [],
            userAchievements: userAchievements || [],
            xp: userData?.xp || 0,
            level: userData?.level || 1,
            currentStreak: userData?.current_streak || 0,
            longestStreak: userData?.longest_streak || 0,
            leaderboardVisible: userData?.leaderboard_visible || false,
            displayName: userData?.display_name || null,
        });
    } catch (error) {
        console.error("Error fetching achievements:", error);
        return NextResponse.json({ error: "Failed to fetch achievements" }, { status: 500 });
    }
}

// POST: Check and unlock new achievements, update streak, award XP
export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const user = await getAuthUser(supabase);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Update streak first
        const currentStreak = await updateStreak(supabase, user.id);

        // Get all achievements
        const { data: allAchievements } = await (supabase.from("achievements") as any).select("*");

        // Get user's already-earned achievements
        const { data: earned } = await (supabase.from("user_achievements") as any)
            .select("achievement_id")
            .eq("user_id", user.id);

        const earnedIds = new Set((earned || []).map((e: any) => e.achievement_id));

        // Get user stats
        const { data: progressData } = await (supabase.from("user_progress") as any)
            .select("*").eq("user_id", user.id);

        const { data: quizData } = await (supabase.from("quiz_attempts") as any)
            .select("*").eq("user_id", user.id);

        const { data: interviewData } = await (supabase.from("interview_sessions") as any)
            .select("*").eq("user_id", user.id).eq("status", "completed");

        // Get current user XP for community achievements
        const { data: userData } = await (supabase.from("profiles") as any)
            .select("xp").eq("id", user.id).single();

        const stats = {
            modules_completed: (progressData || []).filter((p: any) => p.completed).length,
            lessons_completed: (progressData || []).length,
            quizzes_passed: (quizData || []).filter((q: any) => q.passed).length,
            perfect_quiz: (quizData || []).filter((q: any) => q.score === 100).length,
            interviews_completed: (interviewData || []).length,
            max_interview_score: Math.max(0, ...(interviewData || []).map((i: any) => i.score || 0)),
            streak_days: currentStreak,
            xp_earned: userData?.xp || 0,
        };

        const newAchievements: any[] = [];
        let totalXPEarned = 0;

        for (const achievement of (allAchievements || [])) {
            if (earnedIds.has(achievement.id)) continue;

            const criteria = achievement.criteria;
            let shouldUnlock = false;

            switch (criteria.type) {
                case "modules_completed":
                    shouldUnlock = stats.modules_completed >= (criteria.count || 1);
                    break;
                case "lessons_completed":
                    shouldUnlock = stats.lessons_completed >= (criteria.count || 1);
                    break;
                case "quizzes_passed":
                    shouldUnlock = stats.quizzes_passed >= (criteria.count || 1);
                    break;
                case "perfect_quiz":
                    shouldUnlock = stats.perfect_quiz >= (criteria.count || 1);
                    break;
                case "interviews_completed":
                    shouldUnlock = stats.interviews_completed >= (criteria.count || 1);
                    break;
                case "interview_score":
                    shouldUnlock = stats.max_interview_score >= (criteria.min_score || 80);
                    break;
                case "streak_days":
                    shouldUnlock = stats.streak_days >= (criteria.count || 3);
                    break;
                case "xp_earned":
                    shouldUnlock = stats.xp_earned >= (criteria.count || 500);
                    break;
            }

            if (shouldUnlock) {
                const { data: newAchievement, error: insertError } = await (supabase.from("user_achievements") as any)
                    .insert({ user_id: user.id, achievement_id: achievement.id })
                    .select("*, achievement:achievements(*)")
                    .single();

                if (newAchievement && !insertError) {
                    newAchievements.push(newAchievement);
                    const xpReward = XP_REWARDS[achievement.category] || 50;
                    totalXPEarned += xpReward;
                }
            }
        }

        // Award XP for all newly unlocked achievements
        let xpResult = { xp: 0, level: 1 };
        if (totalXPEarned > 0) {
            xpResult = await awardXP(supabase, user.id, totalXPEarned);
        }

        return NextResponse.json({
            newAchievements,
            xpEarned: totalXPEarned,
            xp: xpResult.xp,
            level: xpResult.level,
            currentStreak,
        });
    } catch (error) {
        console.error("Error checking achievements:", error);
        return NextResponse.json({ error: "Failed to check achievements" }, { status: 500 });
    }
}
