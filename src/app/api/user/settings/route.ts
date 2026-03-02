import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { leaderboard_visible, display_name } = body;

        const updates: Record<string, any> = {};
        if (typeof leaderboard_visible === "boolean") {
            updates.leaderboard_visible = leaderboard_visible;
        }
        if (typeof display_name === "string") {
            updates.display_name = display_name.slice(0, 30); // max 30 chars
        }

        const { data, error } = await (supabase.from("profiles") as any)
            .update(updates)
            .eq("id", session.user.id)
            .select("id, display_name, leaderboard_visible, xp, level, current_streak")
            .single();

        if (error) {
            console.error("User settings update error:", error);
            return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
        }

        return NextResponse.json({ user: data });
    } catch (error) {
        console.error("User settings error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await (supabase.from("profiles") as any)
            .select("id, display_name, leaderboard_visible, xp, level, current_streak, longest_streak")
            .eq("id", session.user.id)
            .single();

        if (error) {
            return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
        }

        return NextResponse.json({ user: data });
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
