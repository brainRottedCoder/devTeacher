import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { examId, questionId, answer } = body;

        if (!examId || !questionId || answer === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify the attempt exists and belongs to user
        const { data: attempt, error: fetchError } = await supabase
            .from('certification_attempts')
            .select('*, certifications(passing_score)')
            .eq('id', examId)
            .eq('user_id', user.id)
            .single();

        if (fetchError || !attempt) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
        }

        // Check if exam is already completed
        if (attempt.completed_at) {
            return NextResponse.json({ error: 'Exam already completed' }, { status: 400 });
        }

        // Get current answers or initialize empty object
        const currentAnswers = attempt.answers || {};
        
        // Update answers
        const updatedAnswers = {
            ...currentAnswers,
            [questionId]: answer,
        };

        // Update the attempt with the new answer
        const { error: updateError } = await supabase
            .from('certification_attempts')
            .update({ answers: updatedAnswers })
            .eq('id', examId);

        if (updateError) {
            console.error('Error saving answer:', updateError);
            return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 });
        }

        return NextResponse.json({ success: true, saved: true, answers: updatedAnswers });
    } catch (error) {
        console.error('Error submitting answer:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
