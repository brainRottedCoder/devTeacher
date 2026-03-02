// @ts-nocheck
import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const lesson_id = searchParams.get("lesson_id");

        if (!lesson_id) {
            return NextResponse.json({ error: "lesson_id is required" }, { status: 400 });
        }

        const supabase = createServerClient();

        // Get quiz for the lesson
        const { data: quiz, error } = await supabase
            .from("quizzes")
            .select("*")
            .eq("lesson_id", lesson_id)
            .single();

        if (error) {
            // No quiz found is not an error, just return null
            if (error.code === 'PGRST116') {
                return NextResponse.json({ quiz: null });
            }
            console.error("Error fetching quiz:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ quiz });
    } catch (error) {
        console.error("Error in quiz API:", error);
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
        const { quiz_id, answers } = body;

        if (!quiz_id || !answers) {
            return NextResponse.json({ error: "quiz_id and answers are required" }, { status: 400 });
        }

        // Get the quiz to check answers
        const { data: quiz, error: quizError } = await supabase
            .from("quizzes")
            .select("questions, passing_score")
            .eq("id", quiz_id)
            .single();

        if (quizError || !quiz) {
            return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
        }

        // Calculate score
        const questions = quiz.questions || [];
        let correctCount = 0;
        const results = [];

        questions.forEach((question: any, index: number) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === question.correctAnswer;
            if (isCorrect) correctCount++;

            results.push({
                questionId: question.id,
                userAnswer,
                correctAnswer: question.correctAnswer,
                isCorrect,
                explanation: question.explanation
            });
        });

        const score = Math.round((correctCount / questions.length) * 100);
        const passed = score >= (quiz.passing_score || 70);

        // Save the attempt
        const { data: attempt, error: attemptError } = await supabase
            .from("quiz_attempts")
            .insert({
                user_id: session.user.id,
                quiz_id,
                score,
                answers,
                passed_at: passed ? new Date().toISOString() : null,
            })
            .select()
            .single();

        if (attemptError) {
            console.error("Error saving quiz attempt:", attemptError);
            return NextResponse.json({ error: attemptError.message }, { status: 500 });
        }

        return NextResponse.json({
            attempt: {
                ...attempt,
                results,
                passed,
                totalQuestions: questions.length,
                correctCount,
            }
        });
    } catch (error) {
        console.error("Error in quiz attempt API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
