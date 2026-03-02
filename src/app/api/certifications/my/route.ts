import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
    if (!supabase) {
        supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
    }
    return supabase;
}

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await getSupabase().auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { data: userCerts, error } = await getSupabase()
            .from('user_certifications')
            .select('*')
            .eq('user_id', user.id);

        if (error) {
            return NextResponse.json({ error: 'Failed to fetch certifications' }, { status: 500 });
        }

        return NextResponse.json(userCerts || []);
    } catch (error) {
        console.error('Error fetching user certifications:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
