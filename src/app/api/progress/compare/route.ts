/**
 * Peer Comparison API
 * 
 * Compare user's progress with peers:
 * - Overall ranking
 * - Module-by-module comparison
 * - Time-based comparisons
 * - Skill level assessment
 */

import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const supabase = createServerClient();
        const { searchParams } = new URL(request.url);
        const moduleId = searchParams.get('module_id');
        const timeframe = searchParams.get('timeframe') || 'all'; // week, month, all

        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // Get user's progress count
        type UserProgressItem = { module_id: string; status: string; completed_at: string | null };
        const { data: userProgressRaw } = await supabase
            .from("user_progress")
            .select("module_id, status, completed_at")
            .eq("user_id", userId)
            .eq("status", "completed");
        const userProgress = (userProgressRaw || []) as UserProgressItem[];

        const userCompletedCount = userProgress?.length || 0;

        // Get all users' progress for comparison
        let query = supabase
            .from("user_progress")
            .select("user_id, module_id, status, completed_at");

        // Apply timeframe filter
        if (timeframe === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            query = query.gte("completed_at", weekAgo.toISOString());
        } else if (timeframe === 'month') {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            query = query.gte("completed_at", monthAgo.toISOString());
        }

        const { data: allProgress } = await query;

        // Calculate statistics - add type annotation
        type ProgressRecord = { user_id: string; module_id: string; status: string; completed_at: string | null };
        const progressData = (allProgress || []) as ProgressRecord[];

        const userProgressMap = new Map<string, number>();
        const moduleStats = new Map<string, { total: number; completed: number }>();

        progressData.forEach(p => {
            if (p.status === 'completed') {
                // Count completed per user
                userProgressMap.set(p.user_id, (userProgressMap.get(p.user_id) || 0) + 1);

                // Count per module
                const moduleStat = moduleStats.get(p.module_id) || { total: 0, completed: 0 };
                moduleStat.completed++;
                moduleStats.set(p.module_id, moduleStat);
            }
        });

        // Calculate percentile
        const allCounts = Array.from(userProgressMap.values()).sort((a, b) => a - b);
        const userRank = allCounts.filter(c => c > userCompletedCount).length + 1;
        const percentile = Math.round((1 - userRank / Math.max(allCounts.length, 1)) * 100);

        // Get module-specific comparison if requested
        let moduleComparison = null;
        if (moduleId) {
            const moduleProgress = progressData.filter(p => p.module_id === moduleId);
            const moduleCompletedCount = moduleProgress.filter(p => p.status === 'completed').length;
            const moduleUsers = new Set(moduleProgress.map(p => p.user_id)).size;

            const userModuleProgress = userProgress?.find(p => p.module_id === moduleId);

            moduleComparison = {
                completedByUser: userModuleProgress?.status === 'completed',
                totalCompleted: moduleCompletedCount,
                totalUsers: moduleUsers,
                completionRate: moduleUsers > 0 ? Math.round((moduleCompletedCount / moduleUsers) * 100) : 0,
            };
        }

        // Calculate skill level
        const skillLevel = getSkillLevel(userCompletedCount, allCounts);

        // Get recent activity
        const recentActivity = progressData
            .filter(p => p.user_id === userId && p.completed_at)
            .sort((a, b) => new Date(b.completed_at as string).getTime() - new Date(a.completed_at as string).getTime())
            .slice(0, 5)
            .map(p => ({
                module_id: p.module_id,
                completed_at: p.completed_at,
            }));

        return NextResponse.json({
            comparison: {
                userCompletedCount,
                totalUsers: userProgressMap.size,
                userRank,
                percentile,
                skillLevel,
                moduleComparison,
                recentActivity,
                averageProgress: allCounts.length > 0
                    ? Math.round(allCounts.reduce((a, b) => a + b, 0) / allCounts.length)
                    : 0,
            }
        });
    } catch (error) {
        console.error("Error in peer comparison API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

function getSkillLevel(userCount: number, allCounts: number[]): string {
    const median = allCounts.length > 0
        ? allCounts[Math.floor(allCounts.length / 2)]
        : 0;

    if (userCount === 0) return "Beginner";
    if (userCount < median * 0.5) return "Learning";
    if (userCount < median) return "Intermediate";
    if (userCount < median * 1.5) return "Advanced";
    return "Expert";
}
