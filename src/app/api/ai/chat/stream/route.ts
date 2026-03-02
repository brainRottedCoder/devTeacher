import { NextRequest, NextResponse } from "next/server";
import { sendChatMessageStream } from "@/lib/megallm";
import { getRAGContext } from "@/lib/rag";
import { createClient } from "@supabase/supabase-js";

// Lazy-initialize Supabase client for server-side
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
    if (!_supabase) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        _supabase = createClient(supabaseUrl, supabaseServiceKey);
    }
    return _supabase;
}

// Rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20;
const RATE_LIMIT_WINDOW = 60 * 1000;

function checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userLimit = rateLimitMap.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
        rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return true;
    }

    if (userLimit.count >= RATE_LIMIT) {
        return false;
    }

    userLimit.count++;
    return true;
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");

        if (!authHeader) {
            return NextResponse.json(
                { error: "Authorization header required" },
                { status: 401 }
            );
        }

        const token = authHeader.replace("Bearer ", "");

        const { data: { user }, error: authError } = await getSupabase().auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json(
                { error: "Invalid or expired token" },
                { status: 401 }
            );
        }

        if (!checkRateLimit(user.id)) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Please try again later." },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { message, context, history } = body;

        if (!message || typeof message !== "string") {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            );
        }

        // Get user's module/lesson context if not provided
        let finalContext = context;

        if (!finalContext && user.id) {
            const { data: progress } = await getSupabase()
                .from("user_progress")
                .select(`
          *,
          module:modules(title),
          lesson:lessons(title)
        `)
                .eq("user_id", user.id)
                .order("last_accessed_at", { ascending: false })
                .limit(1)
                .single() as { data: any };

            if (progress) {
                finalContext = {
                    moduleId: progress.module_id,
                    lessonId: progress.lesson_id,
                    moduleTitle: progress.module?.title,
                    lessonTitle: progress.lesson?.title,
                };
            }
        }

        // Get RAG context from knowledge base
        const ragContext = await getRAGContext(message, finalContext?.moduleId);

        // Build enhanced prompt with RAG context
        let enhancedMessage = message;
        if (ragContext) {
            enhancedMessage = `${message}\n\n---\n\n${ragContext}`;
        }

        const stream = await sendChatMessageStream({
            message: enhancedMessage,
            context: finalContext,
            history: history || [],
        });

        const customReadable = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        const data = JSON.stringify({ content: chunk });
                        controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
                    }
                    controller.close();
                } catch (err: any) {
                    const errorMsg = JSON.stringify({ error: err.message || "Streaming failed" });
                    controller.enqueue(new TextEncoder().encode(`data: ${errorMsg}\n\n`));
                    controller.close();
                }
            },
        });

        // We skip logging token usage for stream to `user_token_usage` for now, 
        // as the stream API in OpenAI doesn't natively return usage in chunks by default unless requested.
        
        return new NextResponse(customReadable, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    } catch (error) {
        console.error("AI Chat Stream API Error:", error);

        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}
