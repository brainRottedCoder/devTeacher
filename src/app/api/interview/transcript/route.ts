import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { AnswerRequest } from "@/types/interview-session.types";
import { analyzeAnswer, generateFollowUpQuestion, generateOverallFeedback } from "@/lib/interview/ai-interviewer";

async function getAuthUser(supabase: any) {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
}

const MAX_QUESTIONS_PER_SESSION = 5;

export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const user = await getAuthUser(supabase);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body: AnswerRequest = await request.json();
        const { session_id, question, response } = body;

        if (!session_id || !question || !response) {
            return NextResponse.json(
                { error: "Missing required fields: session_id, question, and response are required" },
                { status: 400 }
            );
        }

        // Verify session belongs to this user
        const { data: session, error: sessionError } = await (supabase
            .from("interview_sessions") as any)
            .select("*")
            .eq("id", session_id)
            .eq("user_id", user.id)
            .single();

        if (sessionError || !session) {
            return NextResponse.json(
                { error: "Session not found or unauthorized" },
                { status: 404 }
            );
        }

        // Check if session is still active
        if (session.status !== "in_progress") {
            return NextResponse.json(
                { error: "This interview session has already been completed or cancelled" },
                { status: 400 }
            );
        }

        // Validate answer is not empty or too short
        if (response.trim().length < 10) {
            return NextResponse.json(
                { error: "Answer is too short. Please provide a more detailed response (at least 10 characters)" },
                { status: 400 }
            );
        }

        // Save the transcript first (without feedback)
        const { data: transcript, error: transcriptError } = await (supabase
            .from("interview_transcripts") as any)
            .insert([{ 
                session_id, 
                question, 
                response 
            }])
            .select("*")
            .single();

        if (transcriptError) {
            console.error("Error saving transcript:", transcriptError);
            return NextResponse.json({ error: transcriptError.message }, { status: 500 });
        }

        let analysisResult;
        let followUpQuestion = null;

        try {
            // Analyze the answer and generate feedback
            analysisResult = await analyzeAnswer(question, response);
            
            // Generate follow-up question
            followUpQuestion = await generateFollowUpQuestion(question, response);
        } catch (aiError) {
            console.error("Error during AI analysis:", aiError);
            // Use fallback values if AI fails
            analysisResult = {
                score: 5,
                feedback: "Unable to analyze answer due to technical issues. Please try again later.",
                suggested_answer: "The ideal answer would cover the core concepts, discuss trade-offs, and provide real-world examples."
            };
        }

        // Update transcript with feedback
        const { error: updateError } = await (supabase
            .from("interview_transcripts") as any)
            .update({
                feedback: analysisResult.feedback,
                score: analysisResult.score,
                suggested_answer: analysisResult.suggested_answer,
                follow_up_questions: followUpQuestion ? [followUpQuestion] : []
            })
            .eq("id", transcript.id);

        if (updateError) {
            console.error("Error updating transcript:", updateError);
        }

        // Get total transcript count for this session
        const { data: allTranscripts } = await (supabase
            .from("interview_transcripts") as any)
            .select("id, question, response, feedback, score")
            .eq("session_id", session_id)
            .order("created_at", { ascending: true });

        const transcriptCount = allTranscripts?.length || 0;
        let sessionCompleted = false;
        let overallFeedback = null;

        // End interview after MAX_QUESTIONS_PER_SESSION questions
        if (transcriptCount >= MAX_QUESTIONS_PER_SESSION) {
            sessionCompleted = true;

            try {
                // Generate overall feedback
                overallFeedback = await generateOverallFeedback(allTranscripts || []);
            } catch (feedbackError) {
                console.error("Error generating overall feedback:", feedbackError);
                overallFeedback = {
                    detailed_feedback: "Interview completed. Great effort in answering all questions!",
                    strengths: ["Completed the interview session"],
                    weaknesses: ["Continue practicing"],
                    recommendations: ["Review the feedback for each question"]
                };
            }

            // Calculate overall score
            const scores = (allTranscripts || []).map((t: any) => t.score || 5);
            const avgScore = scores.length > 0
                ? Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10)
                : 50;

            // Update session status
            const { error: sessionUpdateError } = await (supabase
                .from("interview_sessions") as any)
                .update({
                    status: "completed",
                    score: avgScore,
                    feedback: { 
                        summary: overallFeedback.detailed_feedback, 
                        transcripts: allTranscripts,
                        strengths: overallFeedback.strengths,
                        weaknesses: overallFeedback.weaknesses,
                        recommendations: overallFeedback.recommendations
                    },
                    completed_at: new Date().toISOString()
                })
                .eq("id", session_id);

            if (sessionUpdateError) {
                console.error("Error updating session status:", sessionUpdateError);
            }
        }

        return NextResponse.json({
            success: true,
            transcript,
            feedback: analysisResult.feedback,
            score: analysisResult.score,
            suggested_answer: analysisResult.suggested_answer,
            follow_up_question: sessionCompleted ? null : followUpQuestion,
            session_completed: sessionCompleted,
            questions_remaining: MAX_QUESTIONS_PER_SESSION - transcriptCount,
            overall_feedback: overallFeedback
        });
    } catch (error) {
        console.error("Error handling answer:", error);
        return NextResponse.json(
            { error: "Failed to process answer. Please try again." },
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
            .order("created_at", { ascending: true });

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
