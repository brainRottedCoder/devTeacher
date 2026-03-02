import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const attemptId = params.id;

        // 1. Verify the attempt exists and belongs to user
        const { data: attempt, error: attemptError } = await supabase
            .from('certification_attempts')
            .select('*, certifications(passing_score)')
            .eq('id', attemptId)
            .eq('user_id', user.id)
            .single();

        if (attemptError || !attempt) {
            return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
        }

        // 2. Check if exam is already completed
        if (attempt.completed_at) {
            return NextResponse.json({ error: "Exam already completed" }, { status: 400 });
        }

        // 3. Fetch questions from database for this certification
        const { data: questions, error: questionsError } = await supabase
            .from('certification_questions')
            .select('id, question_text, question_type, options, points, order_index')
            .eq('cert_id', attempt.cert_id)
            .order('order_index', { ascending: true });

        if (questionsError) {
            console.error('Error fetching questions:', questionsError);
            return NextResponse.json({ error: "Failed to load questions" }, { status: 500 });
        }

        // 4. Get certification details
        const { data: cert } = await supabase
            .from('certifications')
            .select('title, passing_score, time_limit_minutes')
            .eq('id', attempt.cert_id)
            .single();

        // 5. Check if time limit has expired
        const startedAt = new Date(attempt.started_at);
        const now = new Date();
        const timeLimit = cert?.time_limit_minutes || 60;
        const timeElapsed = Math.floor((now.getTime() - startedAt.getTime()) / 1000 / 60);
        const timeRemaining = Math.max(0, timeLimit - timeElapsed);

        if (timeElapsed >= timeLimit) {
            // Auto-submit with current answers
            return NextResponse.json({ 
                error: "Time limit exceeded",
                autoSubmit: true,
                attemptId
            }, { status: 400 });
        }

        // Return sanitized questions (without correct answers)
        const sanitizedQuestions = (questions || []).map(q => ({
            id: q.id,
            question: q.question_text,
            type: q.question_type,
            options: q.options,
            points: q.points,
            order: q.order_index,
        }));

        return NextResponse.json({
            id: attemptId,
            certificationId: attempt.cert_id,
            certificationTitle: cert?.title,
            passingScore: cert?.passing_score,
            timeLimit: timeLimit,
            timeRemaining,
            questions: sanitizedQuestions,
            totalQuestions: sanitizedQuestions.length,
            startedAt: attempt.started_at,
        });
    } catch (error) {
        console.error('Server error fetching exam:', error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
