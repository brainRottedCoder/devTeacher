import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { certificationId } = body;

        if (!certificationId) {
            return NextResponse.json({ error: "certificationId is required" }, { status: 400 });
        }

        // Verify the certification exists
        const { data: cert, error: certError } = await supabase
            .from('certifications')
            .select('id, title, time_limit_minutes, passing_score')
            .eq('id', certificationId)
            .single();

        if (certError || !cert) {
            return NextResponse.json({ error: "Certification not found" }, { status: 404 });
        }

        // Check if there are questions for this certification
        const { count, error: qCountError } = await supabase
            .from('certification_questions')
            .select('id', { count: 'exact', head: true })
            .eq('cert_id', certificationId);

        if (qCountError || !count || count === 0) {
            return NextResponse.json({ error: "No questions available for this certification" }, { status: 400 });
        }

        // Check for any existing in-progress attempts
        const { data: existingAttempt } = await supabase
            .from('certification_attempts')
            .select('id, started_at')
            .eq('user_id', user.id)
            .eq('cert_id', certificationId)
            .is('completed_at', null)
            .order('started_at', { ascending: false })
            .limit(1)
            .single();

        // If there's an existing in-progress attempt, return it
        if (existingAttempt) {
            return NextResponse.json({ 
                id: existingAttempt.id, 
                certificationId,
                certificationTitle: cert.title,
                timeLimit: cert.time_limit_minutes,
                inProgress: true,
                message: "You have an exam in progress"
            });
        }

        // Create new attempt
        const { data: attempt, error } = await supabase
            .from('certification_attempts')
            .insert({
                user_id: user.id,
                cert_id: certificationId
            })
            .select()
            .single();

        if (error) {
            console.error('Error starting exam:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ 
            id: attempt.id, 
            certificationId,
            certificationTitle: cert.title,
            timeLimit: cert.time_limit_minutes,
            passingScore: cert.passing_score,
            questionCount: count,
            message: "Exam started successfully"
        });
    } catch (error) {
        console.error('Server error starting exam:', error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
