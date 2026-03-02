import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface ProgressBody {
    lesson_id: string;
    module_id: string;
    status?: string;
}

export async function GET() {
    try {
        const supabase = createServerClient();

        // Use getUser() for secure authentication (verifies token with server)
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Test connection first
        const { error: connectionError } = await supabase.from("user_progress").select("count").limit(1);

        if (connectionError) {
            console.error("Supabase connection error:", connectionError);

            if (connectionError.message?.includes('fetch failed') || connectionError.message?.includes('timeout')) {
                return NextResponse.json({
                    error: "Database connection unavailable. Please try again later.",
                    code: "DB_UNAVAILABLE"
                }, { status: 503 });
            }
        }

        const { data: progress, error } = await supabase
            .from("user_progress")
            .select("*")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false });

        if (error) {
            console.error("Error fetching progress:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ progress: progress || [] });
    } catch (error: any) {
        console.error("Error in progress API:", error);

        if (error?.message?.includes('fetch failed') || error?.cause?.message?.includes('connect')) {
            return NextResponse.json({
                error: "Unable to connect to database. Please check your network connection.",
                code: "NETWORK_ERROR"
            }, { status: 503 });
        }

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = createServerClient();

        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { lesson_id, module_id, status } = body as ProgressBody;

        if (!lesson_id || !module_id) {
            return NextResponse.json({ error: "lesson_id and module_id are required" }, { status: 400 });
        }

        // Check if progress exists
        const { data: existing } = await (supabase
            .from("user_progress") as any)
            .select("*")
            .eq("user_id", session.user.id)
            .eq("lesson_id", lesson_id)
            .single();

        let result;

        if (existing) {
            const { data, error } = await (supabase
                .from("user_progress") as any)
                .update({
                    status: status ?? existing.status,
                    completed_at: status === 'completed' ? new Date().toISOString() : existing.completed_at,
                    updated_at: new Date().toISOString(),
                })
                .eq("user_id", session.user.id)
                .eq("lesson_id", lesson_id)
                .select()
                .single();

            if (error) {
                console.error("Error updating progress:", error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
            result = data;
        } else {
            const { data, error } = await (supabase
                .from("user_progress") as any)
                .insert({
                    user_id: session.user.id,
                    lesson_id,
                    module_id,
                    status: status || 'not_started',
                })
                .select()
                .single();

            if (error) {
                console.error("Error inserting progress:", error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
            result = data;
        }

        return NextResponse.json({ progress: result });
    } catch (error) {
        console.error("Error in progress API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
