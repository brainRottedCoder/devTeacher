import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();

        // Use getUser() for secure authentication
        const { data: { user } } = await supabase.auth.getUser();

        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

        // Test connection first
        const { error: connectionError } = await supabase.from("profiles").select("count").limit(1);

        if (connectionError) {
            console.error("Supabase connection error:", connectionError);

            if (connectionError.message?.includes('fetch failed') || connectionError.message?.includes('timeout')) {
                return NextResponse.json({
                    error: "Database connection unavailable. Please try again later.",
                    code: "DB_UNAVAILABLE"
                }, { status: 503 });
            }
        }

        // Fetch top users who opted into the leaderboard
        const { data: topUsers, error } = await (supabase
            .from("profiles") as any)
            .select("id, display_name, email, xp, level, current_streak, longest_streak")
            .eq("leaderboard_visible", true)
            .order("xp", { ascending: false })
            .limit(limit);

        if (error) {
            console.error("Leaderboard fetch error:", error);
            return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
        }

        // Count achievements per user
        const userIds = (topUsers || []).map((u: any) => u.id);
        let badgeCounts: Record<string, number> = {};

        if (userIds.length > 0) {
            const { data: badges } = await (supabase
                .from("user_achievements") as any)
                .select("user_id")
                .in("user_id", userIds);

            (badges || []).forEach((b: any) => {
                badgeCounts[b.user_id] = (badgeCounts[b.user_id] || 0) + 1;
            });
        }

        const entries = (topUsers || []).map((user: any, index: number) => ({
            rank: index + 1,
            display_name: user.display_name || user.email?.split("@")[0] || "Anonymous",
            xp: user.xp,
            level: user.level,
            streak: user.current_streak,
            badge_count: badgeCounts[user.id] || 0,
            is_current_user: user?.id === user.id,
        }));

        // Find current user's rank even if they're not in top list
        let currentUserRank = null;
        if (user) {
            const { data: currentUser } = await (supabase
                .from("profiles") as any)
                .select("xp, leaderboard_visible")
                .eq("id", user.id)
                .single();

            if (currentUser?.leaderboard_visible && currentUser.xp > 0) {
                const { count } = await (supabase
                    .from("profiles") as any)
                    .select("id", { count: "exact", head: true })
                    .eq("leaderboard_visible", true)
                    .gt("xp", currentUser.xp);

                currentUserRank = (count || 0) + 1;
            }
        }

        return NextResponse.json({ entries, currentUserRank });
    } catch (error: any) {
        console.error("Leaderboard error:", error);

        if (error?.message?.includes('fetch failed') || error?.cause?.message?.includes('connect')) {
            return NextResponse.json({
                error: "Unable to connect to database. Please check your network connection.",
                code: "NETWORK_ERROR"
            }, { status: 503 });
        }

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
