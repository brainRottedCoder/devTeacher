import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getAuthUser(supabase: any) {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user ?? null;
}

// GET: Fetch user's chat history (paginated)
export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const user = await getAuthUser(supabase);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");

        const { data: messages, error } = await (supabase
            .from("chat_messages") as any)
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true })
            .range(offset, offset + limit - 1);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ messages });
    } catch (error) {
        console.error("Error fetching chat history:", error);
        return NextResponse.json(
            { error: "Failed to fetch chat history" },
            { status: 500 }
        );
    }
}

// POST: Save a message to chat history
export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const user = await getAuthUser(supabase);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { role, content, context } = body;

        if (!role || !content) {
            return NextResponse.json(
                { error: "role and content are required" },
                { status: 400 }
            );
        }

        const { data: message, error } = await (supabase
            .from("chat_messages") as any)
            .insert([{
                user_id: user.id,
                role,
                content,
                context: context || null
            }])
            .select("*")
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message }, { status: 201 });
    } catch (error) {
        console.error("Error saving chat message:", error);
        return NextResponse.json(
            { error: "Failed to save message" },
            { status: 500 }
        );
    }
}

// DELETE: Clear chat history
export async function DELETE(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const user = await getAuthUser(supabase);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { error } = await (supabase
            .from("chat_messages") as any)
            .delete()
            .eq("user_id", user.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error clearing chat history:", error);
        return NextResponse.json(
            { error: "Failed to clear chat history" },
            { status: 500 }
        );
    }
}
