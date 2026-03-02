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

        const certId = params.id;

        // Fetch the user's certification
        const { data: userCert, error } = await supabase
            .from('user_certifications')
            .select(`
                *,
                certifications (
                    title,
                    description,
                    difficulty
                )
            `)
            .eq('user_id', user.id)
            .eq('cert_id', certId)
            .single();

        if (error || !userCert) {
            return NextResponse.json({ error: "Certification not found" }, { status: 404 });
        }

        // Get user profile for name
        const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', user.id)
            .single();

        const userName = profile?.name || user.email?.split('@')[0] || 'User';

        // Generate certificate data (in a real app, this would generate a PDF)
        const certificateData = {
            id: userCert.id,
            title: (userCert as any).certifications?.title,
            description: (userCert as any).certifications?.description,
            difficulty: (userCert as any).certifications?.difficulty,
            userName,
            issuedAt: userCert.issued_at,
            verificationHash: userCert.verification_hash,
            verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://sudomakeworld.com'}/verify?hash=${userCert.verification_hash}`,
        };

        // Return certificate data as JSON (frontend can render as PDF/HTML)
        return NextResponse.json(certificateData);
    } catch (error) {
        console.error('Server error downloading cert:', error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
