import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function getRandomColor(): string {
    const colors = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];
    return colors[Math.floor(Math.random() * colors.length)];
}

async function getAuthUser(supabase: ReturnType<typeof createServerClient>) {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user ?? null;
}

export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get("sessionId");
        const designId = searchParams.get("designId");

        if (sessionId) {
            const { data: session, error } = await (supabase
                .from("collaboration_sessions") as any)
                .select("*")
                .eq("id", sessionId)
                .single();

            if (error || !session) {
                return NextResponse.json({ error: "Session not found" }, { status: 404 });
            }

            const { data: participants } = await (supabase
                .from("collaboration_participants") as any)
                .select("*")
                .eq("session_id", sessionId);

            return NextResponse.json({ ...session, participants: participants || [] });
        }

        if (designId) {
            const { data: sessions, error } = await (supabase
                .from("collaboration_sessions") as any)
                .select("*")
                .eq("design_id", designId)
                .eq("status", "active")
                .order("created_at", { ascending: false });

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            if (!sessions || sessions.length === 0) {
                return NextResponse.json(null);
            }

            const session = sessions[0];
            const { data: participants } = await (supabase
                .from("collaboration_participants") as any)
                .select("*")
                .eq("session_id", session.id);

            return NextResponse.json({ ...session, participants: participants || [] });
        }

        const { data: sessions, error } = await (supabase
            .from("collaboration_sessions") as any)
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(sessions || []);
    } catch (error: any) {
        console.error("Error fetching collaboration sessions:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const user = await getAuthUser(supabase);
        
        const body = await request.json();
        const { designId, userId, userName } = body;

        if (!designId) {
            return NextResponse.json({ error: "Design ID is required" }, { status: 400 });
        }

        const userIdToUse = user?.id || userId || `anonymous-${Date.now()}`;
        const userNameToUse = user?.email || userName || "Anonymous";

        const { data: existingSessions } = await (supabase
            .from("collaboration_sessions") as any)
            .select("*")
            .eq("design_id", designId)
            .eq("status", "active");

        if (existingSessions && existingSessions.length > 0) {
            const existingSession = existingSessions[0];
            
            const { data: participant, error: participantError } = await (supabase
                .from("collaboration_participants") as any)
                .insert({
                    session_id: existingSession.id,
                    user_id: userIdToUse,
                    user_name: userNameToUse,
                    user_color: getRandomColor(),
                    is_active: true,
                    joined_at: new Date().toISOString(),
                    last_seen_at: new Date().toISOString(),
                } as any)
                .select()
                .single();

            if (participantError) {
                return NextResponse.json({ error: participantError.message }, { status: 500 });
            }

            await (supabase
                .from("collaboration_sessions") as any)
                .update({ updated_at: new Date().toISOString() })
                .eq("id", existingSession.id);

            const { data: participants } = await (supabase
                .from("collaboration_participants") as any)
                .select("*")
                .eq("session_id", existingSession.id);

            return NextResponse.json({ 
                session: { ...existingSession, participants: participants || [] }, 
                participant 
            });
        }

        const { data: newSession, error: sessionError } = await (supabase
            .from("collaboration_sessions") as any)
            .insert({
                design_id: designId,
                owner_id: userIdToUse,
                status: "active",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            } as any)
            .select()
            .single();

        if (sessionError) {
            return NextResponse.json({ error: sessionError.message }, { status: 500 });
        }

        const { data: participant, error: participantError } = await (supabase
            .from("collaboration_participants") as any)
            .insert({
                session_id: newSession.id,
                user_id: userIdToUse,
                user_name: userNameToUse,
                user_color: getRandomColor(),
                is_active: true,
                joined_at: new Date().toISOString(),
                last_seen_at: new Date().toISOString(),
            } as any)
            .select()
            .single();

        if (participantError) {
            await (supabase
                .from("collaboration_sessions") as any)
                .delete()
                .eq("id", newSession.id);
            return NextResponse.json({ error: participantError.message }, { status: 500 });
        }

        return NextResponse.json({ 
            session: { ...newSession, participants: [participant] }, 
            participant 
        });
    } catch (error: any) {
        console.error("Error creating collaboration session:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const body = await request.json();
        const { sessionId, participantId, cursorPosition, selectedNodes, isActive } = body;

        if (participantId) {
            const updates: Record<string, any> = {
                last_seen_at: new Date().toISOString(),
            };

            if (cursorPosition !== undefined) updates.cursor_position = cursorPosition;
            if (selectedNodes !== undefined) updates.selected_nodes = selectedNodes;
            if (isActive !== undefined) updates.is_active = isActive;

            const { error } = await (supabase
                .from("collaboration_participants") as any)
                .update(updates)
                .eq("id", participantId);

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
        }

        if (sessionId) {
            await (supabase
                .from("collaboration_sessions") as any)
                .update({ updated_at: new Date().toISOString() })
                .eq("id", sessionId);
        }

        const { data: session } = sessionId 
            ? await (supabase
                .from("collaboration_sessions") as any)
                .select("*")
                .eq("id", sessionId)
                .single()
            : { data: null };

        return NextResponse.json({ success: true, session });
    } catch (error: any) {
        console.error("Error updating collaboration session:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get("sessionId");
        const participantId = searchParams.get("participantId");

        if (!sessionId) {
            return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
        }

        if (participantId) {
            const { error } = await (supabase
                .from("collaboration_participants") as any)
                .delete()
                .eq("id", participantId);

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            const { data: remainingParticipants } = await (supabase
                .from("collaboration_participants") as any)
                .select("id")
                .eq("session_id", sessionId);

            if (!remainingParticipants || remainingParticipants.length === 0) {
                await (supabase
                    .from("collaboration_sessions") as any)
                    .update({ status: "ended", updated_at: new Date().toISOString() })
                    .eq("id", sessionId);
            }
        } else {
            const { error } = await (supabase
                .from("collaboration_sessions") as any)
                .delete()
                .eq("id", sessionId);

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting collaboration session:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
