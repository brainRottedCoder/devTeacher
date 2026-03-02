import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const hash = searchParams.get('hash');

        if (!hash) {
            return NextResponse.json({ valid: false, error: "Missing hash parameter" }, { status: 400 });
        }

        const supabase = createRouteHandlerClient({ cookies });

        // Fetch certification with proper join
        const { data: cert, error } = await supabase
            .from('user_certifications')
            .select(`
                id,
                verification_hash,
                issued_at,
                expires_at,
                user_id,
                cert_id,
                certifications (
                    title,
                    description,
                    difficulty
                )
            `)
            .eq('verification_hash', hash)
            .single();

        if (error || !cert) {
            return NextResponse.json({ valid: false, error: "Certificate not found" });
        }

        // Get user name from profiles table
        let userName = 'Unknown';
        
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', cert.user_id)
                .single();
            
            if (profile?.name) {
                userName = profile.name;
            } else {
                // Try to get from auth metadata
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.user_metadata?.name) {
                    userName = user.user_metadata.name;
                }
            }
        } catch (e) {
            // Use fallback
            console.warn('Could not fetch user name:', e);
        }

        // Check if certificate has expired
        const isExpired = cert.expires_at && new Date(cert.expires_at) < new Date();

        return NextResponse.json({
            valid: true,
            certificate: {
                id: cert.id,
                title: (cert as any).certifications?.title,
                description: (cert as any).certifications?.description,
                difficulty: (cert as any).certifications?.difficulty,
                issuedAt: cert.issued_at,
                expiresAt: cert.expires_at,
                isExpired,
                userName,
                verificationUrl: `/api/certifications/verify?hash=${hash}`,
            }
        });
    } catch (error) {
        console.error('Server error verifying cert:', error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
