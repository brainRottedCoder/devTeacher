import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { 
    generateOverallFeedback,
    generateTargetedQuestionsFeedback 
} from "@/lib/interview/ai-interviewer";

export const dynamic = "force-dynamic";

async function getAuthUser(supabase: any) {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user ?? null;
}

// GET: Get detailed feedback report for a completed interview session
export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const user = await getAuthUser(supabase);

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get("session_id");
        const reportType = searchParams.get("type") || "detailed"; // detailed, summary, strengths-weaknesses

        if (!sessionId) {
            return NextResponse.json(
                { error: "Session ID is required" },
                { status: 400 }
            );
        }

        // Get session with company info
        const { data: session, error: sessionError } = await (supabase
            .from("interview_sessions") as any)
            .select(`
                *,
                company:companies(*)
            `)
            .eq("id", sessionId)
            .eq("user_id", user.id)
            .single();

        if (sessionError || !session) {
            return NextResponse.json(
                { error: "Session not found" },
                { status: 404 }
            );
        }

        // Get all transcripts for this session
        const { data: transcripts, error: transcriptError } = await (supabase
            .from("interview_transcripts") as any)
            .select("*")
            .eq("session_id", sessionId)
            .order("timestamp", { ascending: true });

        if (transcriptError) {
            return NextResponse.json(
                { error: "Failed to fetch transcripts" },
                { status: 500 }
            );
        }

        // Calculate statistics
        const scores = transcripts?.map((t: any) => t.score || 0) || [];
        const avgScore = scores.length > 0
            ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length * 10)
            : 0;

        const scoreDistribution = {
            excellent: scores.filter((s: number) => s >= 8).length,
            good: scores.filter((s: number) => s >= 6 && s < 8).length,
            needsImprovement: scores.filter((s: number) => s < 6).length,
        };

        // Generate AI feedback if session is completed
        let aiFeedback = null;
        if (session.status === "completed" && transcripts?.length > 0) {
            try {
                aiFeedback = await generateOverallFeedback(transcripts);
            } catch (e) {
                console.error("Error generating AI feedback:", e);
            }
        }

        // Build response based on report type
        let response: any = {
            session: {
                id: session.id,
                status: session.status,
                interview_type: session.interview_type,
                difficulty: session.difficulty,
                score: session.score,
                created_at: session.created_at,
                company: session.company,
            },
            statistics: {
                total_questions: transcripts?.length || 0,
                average_score: avgScore,
                score_distribution: scoreDistribution,
            },
            transcripts: transcripts?.map((t: any) => ({
                question: t.question,
                response: t.response,
                score: t.score,
                feedback: t.feedback,
            })),
        };

        if (reportType === "detailed" || reportType === "summary") {
            response.ai_feedback = aiFeedback;
            response.recommendations = generateRecommendations(avgScore, session.interview_type);
            response.study_topics = generateStudyTopics(transcripts || [], session.interview_type);
        }

        if (reportType === "strengths-weaknesses") {
            response.analysis = analyzeStrengthsAndWeaknesses(transcripts || []);
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error generating feedback report:", error);
        return NextResponse.json(
            { error: "Failed to generate feedback report" },
            { status: 500 }
        );
    }
}

// POST: Generate a new interview session with AI-generated questions based on weak areas
export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const user = await getAuthUser(supabase);

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { focus_areas, interview_type, difficulty } = body;

        // Get user's past sessions to identify weak areas
        const { data: pastSessions } = await (supabase
            .from("interview_sessions") as any)
            .select(`
                *,
                transcripts:interview_transcripts(*)
            `)
            .eq("user_id", user.id)
            .eq("status", "completed")
            .order("created_at", { ascending: false })
            .limit(10);

        // Analyze weak areas from past sessions
        const weakAreas = analyzeWeakAreas(pastSessions || [], focus_areas);

        // Generate targeted practice questions based on weak areas
        const targetedQuestions = await generateTargetedQuestions(
            weakAreas,
            interview_type || "system_design",
            difficulty || "medium"
        );

        return NextResponse.json({
            weak_areas: weakAreas,
            targeted_questions: targetedQuestions,
        });
    } catch (error) {
        console.error("Error generating targeted practice:", error);
        return NextResponse.json(
            { error: "Failed to generate targeted practice" },
            { status: 500 }
        );
    }
}

function generateRecommendations(avgScore: number, interviewType: string): string[] {
    const recommendations: string[] = [];

    if (avgScore >= 80) {
        recommendations.push("Excellent performance! Focus on maintaining consistency.");
        recommendations.push("Try practicing with harder difficulty questions.");
    } else if (avgScore >= 60) {
        recommendations.push("Good progress. Focus on providing more detailed explanations.");
        recommendations.push("Practice thinking out loud during problem-solving.");
    } else {
        recommendations.push("Keep practicing! Focus on understanding fundamental concepts.");
        recommendations.push("Review common interview patterns and design principles.");
    }

    if (interviewType === "system_design") {
        recommendations.push("Practice drawing architecture diagrams while explaining.");
        recommendations.push("Focus on scalability considerations and trade-offs.");
    } else if (interviewType === "coding") {
        recommendations.push("Practice time and space complexity analysis.");
        recommendations.push("Focus on writing clean, readable code.");
    } else if (interviewType === "behavioral") {
        recommendations.push("Prepare more STAR method examples from your experience.");
        recommendations.push("Focus on demonstrating leadership and collaboration skills.");
    }

    return recommendations;
}

function generateStudyTopics(transcripts: any[], interviewType: string): string[] {
    const topics = new Set<string>();

    transcripts.forEach((t: any) => {
        if (t.score && t.score < 7) {
            // Extract topics from question (simplified)
            const question = t.question.toLowerCase();
            if (question.includes("scale")) topics.add("System Scalability");
            if (question.includes("database") || question.includes("data")) topics.add("Database Design");
            if (question.includes("cache")) topics.add("Caching Strategies");
            if (question.includes("load balance")) topics.add("Load Balancing");
            if (question.includes("microservice")) topics.add("Microservices");
            if (question.includes("api")) topics.add("API Design");
            if (question.includes("algorithm")) topics.add("Algorithms");
        }
    });

    if (interviewType === "system_design") {
        topics.add("Distributed Systems");
        topics.add("Cloud Architecture");
    }

    return Array.from(topics);
}

function analyzeWeakAreas(sessions: any[], focusAreas?: string[]): string[] {
    const areaScores: Record<string, number[]> = {};

    sessions.forEach((session: any) => {
        const type = session.interview_type;
        if (!areaScores[type]) areaScores[type] = [];

        session.transcripts?.forEach((t: any) => {
            if (t.score) areaScores[type].push(t.score);
        });
    });

    const weakAreas: string[] = [];

    for (const [type, scores] of Object.entries(areaScores)) {
        if (scores.length > 0) {
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            if (avg < 7) {
                weakAreas.push(type);
            }
        }
    }

    // Add user-specified focus areas
    if (focusAreas) {
        focusAreas.forEach(area => {
            if (!weakAreas.includes(area)) {
                weakAreas.push(area);
            }
        });
    }

    return weakAreas.length > 0 ? weakAreas : ["system_design", "coding", "behavioral"];
}

async function generateTargetedQuestions(
    weakAreas: string[],
    interviewType: string,
    difficulty: string
): Promise<string[]> {
    if (!weakAreas || weakAreas.length === 0) {
        return [];
    }
    
    return await generateTargetedQuestionsFeedback(weakAreas, interviewType, difficulty);
}

function analyzeStrengthsAndWeaknesses(transcripts: any[]): {
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
} {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const improvements: string[] = [];

    transcripts.forEach((t: any, index: number) => {
        if (t.score && t.score >= 8) {
            strengths.push(`Q${index + 1}: Strong answer showing good understanding`);
        } else if (t.score && t.score < 6) {
            weaknesses.push(`Q${index + 1}: Needs more detailed explanation`);
            improvements.push(`Focus on providing concrete examples for Q${index + 1}`);
        }
    });

    return { strengths, weaknesses, improvements };
}
