import { NextRequest, NextResponse } from 'next/server';
import { communityDb } from '@/lib/db/community';

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await request.json();
        const { type, id } = body;

        if (!type || !id) {
            return NextResponse.json({ error: 'Type and ID required' }, { status: 400 });
        }

        if (!['design', 'discussion', 'reply', 'comment'].includes(type)) {
            return NextResponse.json({ error: 'Invalid like type' }, { status: 400 });
        }

        const result = await communityDb.toggleLike(
            user.id,
            type as 'design' | 'discussion' | 'reply' | 'comment',
            id
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error toggling like:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
