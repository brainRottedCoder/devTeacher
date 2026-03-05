import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
import { InterviewSession, InterviewRequest } from "@/types/interview-session.types";

async function getAuthUser(supabase: any) {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
}

export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const user = await getAuthUser(supabase);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: sessions, error } = await (supabase
            .from("interview_sessions") as any)
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ sessions });
    } catch (error) {
        console.error("Error fetching interview sessions:", error);
        return NextResponse.json(
            { error: "Failed to fetch interview sessions" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const user = await getAuthUser(supabase);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body: InterviewRequest = await request.json();
        const { company_id, interview_type, difficulty = "medium" } = body;

        const { data: session, error } = await (supabase
            .from("interview_sessions") as any)
            .insert([
                {
                    user_id: user.id,
                    company_id,
                    interview_type,
                    difficulty,
                    status: "in_progress"
                }
            ])
            .select("*")
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ session }, { status: 201 });
    } catch (error) {
        console.error("Error creating interview session:", error);
        return NextResponse.json(
            { error: "Failed to create interview session" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const user = await getAuthUser(supabase);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body: { id: string; status?: string; score?: number; feedback?: any } = await request.json();
        const { id, status, score, feedback } = body;

        const { data: session, error } = await (supabase
            .from("interview_sessions") as any)
            .update({ status, score, feedback })
            .eq("id", id)
            .eq("user_id", user.id)
            .select("*")
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ session });
    } catch (error) {
        console.error("Error updating interview session:", error);
        return NextResponse.json(
            { error: "Failed to update interview session" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const user = await getAuthUser(supabase);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Session ID is required" },
                { status: 400 }
            );
        }

        const { error } = await (supabase
            .from("interview_sessions") as any)
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting interview session:", error);
        return NextResponse.json(
            { error: "Failed to delete interview session" },
            { status: 500 }
        );
    }
}
