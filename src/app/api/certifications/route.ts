import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const supabase = createRouteHandlerClient({ cookies });

        // 1. Fetch available certifications from catalog with question count
        const { data: catalog, error: catalogError } = await supabase
            .from('certifications')
            .select(`
                *,
                question_count:certification_questions(count)
            `)
            .order('difficulty', { ascending: true });

        if (catalogError) throw catalogError;

        // Transform the data to get question count
        const catalogWithCount = (catalog || []).map(cert => ({
            ...cert,
            questionCount: cert.question_count?.[0]?.count || 0
        }));

        // 2. Fetch user's earned certifications if logged in
        let earned: any[] = [];
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data: myCerts, error: certsError } = await supabase
                .from('user_certifications')
                .select(`
                    *,
                    certifications (
                        title,
                        difficulty,
                        description
                    )
                `)
                .eq('user_id', user.id);

            if (!certsError && myCerts) {
                earned = myCerts;
            }

            // Also get user's attempts
            const { data: attempts } = await supabase
                .from('certification_attempts')
                .select(`
                    *,
                    certifications (
                        title,
                        difficulty
                    )
                `)
                .eq('user_id', user.id)
                .order('started_at', { ascending: false })
                .limit(10);

            return NextResponse.json({ 
                catalog: catalogWithCount, 
                earned,
                recentAttempts: attempts || []
            });
        }

        return NextResponse.json({ catalog: catalogWithCount, earned: [] });
    } catch (error) {
        console.error('Server error fetching certifications:', error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
