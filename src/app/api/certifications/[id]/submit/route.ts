import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import crypto from 'crypto';

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const certId = params.id;
        const body = await req.json();
        const { attemptId, answers } = body;

        if (!attemptId) {
            return NextResponse.json({ error: "Attempt ID is required" }, { status: 400 });
        }

        // 1. Verify attempt exists and belongs to user
        const { data: attempt, error: attemptError } = await supabase
            .from('certification_attempts')
            .select('*, certifications(passing_score, title)')
            .eq('id', attemptId)
            .eq('user_id', user.id)
            .single();

        if (attemptError || !attempt) {
            return NextResponse.json({ error: "Invalid attempt" }, { status: 400 });
        }

        if (attempt.completed_at) {
            return NextResponse.json({ error: "Attempt already completed" }, { status: 400 });
        }

        // 2. Fetch all questions for this certification to check answers
        const { data: questions, error: questionsError } = await supabase
            .from('certification_questions')
            .select('id, correct_answer, points')
            .eq('cert_id', certId);

        if (questionsError) {
            console.error('Error fetching questions for grading:', questionsError);
            return NextResponse.json({ error: "Failed to grade exam" }, { status: 500 });
        }

        // 3. Grade the exam
        let totalPoints = 0;
        let earnedPoints = 0;

        // Create a map of correct answers
        const correctAnswersMap: Record<string, string> = {};
        for (const q of questions || []) {
            correctAnswersMap[q.id] = q.correct_answer;
            totalPoints += q.points;
        }

        // Calculate earned points
        const userAnswers = answers || {};
        for (const questionId of Object.keys(userAnswers)) {
            const userAnswer = userAnswers[questionId];
            const correctAnswer = correctAnswersMap[questionId];
            const question = questions?.find(q => q.id === questionId);

            if (correctAnswer && userAnswer === correctAnswer) {
                earnedPoints += question?.points || 10;
            }
        }

        // Calculate percentage score
        const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
        const passingScore = (attempt as any).certifications?.passing_score || 80;
        const passed = score >= passingScore;

        // 4. Update attempt record with score and completion
        const { error: updateError } = await supabase
            .from('certification_attempts')
            .update({
                score,
                passed,
                completed_at: new Date().toISOString(),
                answers: userAnswers
            })
            .eq('id', attemptId);

        if (updateError) {
            console.error('Error updating attempt:', updateError);
            return NextResponse.json({ error: "Failed to save results" }, { status: 500 });
        }

        // 5. Issue certificate if passed
        let certificate = null;
        if (passed) {
            // Generate unique hash using attempt ID, user ID, and timestamp
            const rawString = `${attemptId}-${user.id}-${Date.now()}`;
            const verificationHash = crypto.createHash('sha256').update(rawString).digest('hex').slice(0, 16);

            // Check if user already has this certification
            const { data: existingCert } = await supabase
                .from('user_certifications')
                .select('id')
                .eq('user_id', user.id)
                .eq('cert_id', certId)
                .single();

            if (existingCert) {
                // Update existing certificate
                const { data: updatedCert, error: updateCertError } = await supabase
                    .from('user_certifications')
                    .update({
                        attempt_id: attemptId,
                        verification_hash: verificationHash,
                        issued_at: new Date().toISOString()
                    })
                    .eq('id', existingCert.id)
                    .select()
                    .single();

                if (!updateCertError) {
                    certificate = updatedCert;
                }
            } else {
                // Insert new certificate
                const { data: newCert, error: issueError } = await supabase
                    .from('user_certifications')
                    .insert({
                        user_id: user.id,
                        cert_id: certId,
                        attempt_id: attemptId,
                        verification_hash: verificationHash
                    })
                    .select()
                    .single();

                if (!issueError) {
                    certificate = newCert;
                } else {
                    console.error("Failed to issue cert:", issueError);
                }
            }
        }

        return NextResponse.json({
            score,
            totalPoints,
            earnedPoints,
            passingScore,
            passed,
            certificate: certificate ? {
                id: certificate.id,
                verificationHash: certificate.verification_hash,
            } : null,
            certificationTitle: (attempt as any).certifications?.title,
            message: passed 
                ? "Congratulations! You have earned the certification!" 
                : `Score too low (${score}%). You need ${passingScore}% to pass.`
        });

    } catch (error) {
        console.error('Server error during exam submission:', error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
