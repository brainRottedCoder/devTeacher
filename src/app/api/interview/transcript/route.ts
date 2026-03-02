import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { AnswerRequest } from "@/types/interview-session.types";
import { analyzeAnswer, generateFollowUpQuestion, generateOverallFeedback } from "@/lib/interview/ai-interviewer";

async function getAuthUser(supabase: any) {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user ?? null;
}

const MAX_QUESTIONS_PER_SESSION = 6;

export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const user = await getAuthUser(supabase);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body: AnswerRequest = await request.json();
        const { session_id, question, response } = body;

        // Save the transcript
        const { data: transcript, error } = await (supabase
            .from("interview_transcripts") as any)
            .insert([{ session_id, question, response }])
            .select("*")
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Analyze the answer and generate feedback
        const { score, feedback } = await analyzeAnswer(question, response);

        // Generate follow-up question (if needed)
        const followUpQuestion = await generateFollowUpQuestion(question, response);

        // Update transcript with feedback and follow-up questions
        await (supabase
            .from("interview_transcripts") as any)
            .update({
                feedback,
                score,
                follow_up_questions: followUpQuestion ? [followUpQuestion] : []
            })
            .eq("id", transcript.id);

        // Get total transcript count for this session to decide if we should end
        const { data: allTranscripts } = await (supabase
            .from("interview_transcripts") as any)
            .select("*")
            .eq("session_id", session_id)
            .order("timestamp", { ascending: true });

        const transcriptCount = allTranscripts?.length || 0;
        let sessionCompleted = false;
        let overallFeedback = null;

        // End interview after MAX_QUESTIONS_PER_SESSION questions
        if (transcriptCount >= MAX_QUESTIONS_PER_SESSION) {
            sessionCompleted = true;

            // Generate overall feedback
            overallFeedback = await generateOverallFeedback(allTranscripts || []);

            // Calculate overall score
            const scores = (allTranscripts || []).map((t: any) => t.score || 5);
            const avgScore = scores.length > 0
                ? Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10)
                : 50;

            await (supabase
                .from("interview_sessions") as any)
                .update({
                    status: "completed",
                    score: avgScore,
                    feedback: { summary: overallFeedback, transcripts: allTranscripts }
                })
                .eq("id", session_id);
        }

        return NextResponse.json({
            transcript,
            feedback,
            score,
            follow_up_question: sessionCompleted ? null : followUpQuestion,
            session_completed: sessionCompleted,
            overall_feedback: overallFeedback
        });
    } catch (error) {
        console.error("Error handling answer:", error);
        return NextResponse.json(
            { error: "Failed to process answer" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const user = await getAuthUser(supabase);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const session_id = searchParams.get("session_id");

        if (!session_id) {
            return NextResponse.json(
                { error: "Session ID is required" },
                { status: 400 }
            );
        }

        const { data: transcripts, error } = await (supabase
            .from("interview_transcripts") as any)
            .select("*")
            .eq("session_id", session_id)
            .order("timestamp", { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ transcripts });
    } catch (error) {
        console.error("Error fetching transcripts:", error);
        return NextResponse.json(
            { error: "Failed to fetch transcripts" },
            { status: 500 }
        );
    }
}
