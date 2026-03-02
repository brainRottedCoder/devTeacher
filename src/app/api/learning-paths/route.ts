import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getAuthUser(supabase: any) {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user ?? null;
}

// GET: Available learning paths + user's enrolled ones
export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const user = await getAuthUser(supabase);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: paths } = await (supabase.from("learning_paths") as any)
            .select("*")
            .order("level");

        // Get items for each path
        const pathsWithItems = await Promise.all(
            (paths || []).map(async (path: any) => {
                const { data: items } = await (supabase
                    .from('learning_path_items') as any)
                    .select('*')
                    .eq('path_id', path.id)
                    .order('order_index', { ascending: true });
                return { ...path, items: items || [] };
            })
        );

        const { data: userPaths } = await (supabase.from("user_learning_paths") as any)
            .select("*, path:learning_paths(*)")
            .eq("user_id", user.id);

        return NextResponse.json({
            paths: pathsWithItems || [],
            userPaths: userPaths || [],
        });
    } catch (error) {
        console.error("Error fetching learning paths:", error);
        return NextResponse.json({ error: "Failed to fetch paths" }, { status: 500 });
    }
}

// POST: Enroll in a path
export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const user = await getAuthUser(supabase);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { pathId } = await request.json();

        if (!pathId) {
            return NextResponse.json({ error: "pathId is required" }, { status: 400 });
        }

        // Check if already enrolled
        const { data: existing } = await (supabase.from("user_learning_paths") as any)
            .select("*")
            .eq("user_id", user.id)
            .eq("path_id", pathId)
            .single();

        if (existing) {
            return NextResponse.json({ error: "Already enrolled in this path" }, { status: 409 });
        }

        const { data: userPath, error } = await (supabase.from("user_learning_paths") as any)
            .insert({ user_id: user.id, path_id: pathId })
            .select("*, path:learning_paths(*)")
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ userPath }, { status: 201 });
    } catch (error) {
        console.error("Error enrolling in path:", error);
        return NextResponse.json({ error: "Failed to enroll" }, { status: 500 });
    }
}

// PUT: Update path progress
export async function PUT(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const user = await getAuthUser(supabase);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id, status } = await request.json();

        const { data: userPath, error } = await (supabase.from("user_learning_paths") as any)
            .update({
                status,
                ...(status === "completed" ? { completed_at: new Date().toISOString() } : {}),
            })
            .eq("id", id)
            .eq("user_id", user.id)
            .select("*")
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ userPath });
    } catch (error) {
        console.error("Error updating path:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
