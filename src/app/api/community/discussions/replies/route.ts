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
        const { discussionId, content, parentId } = body;

        if (!discussionId || !content) {
            return NextResponse.json({ error: 'Discussion ID and content required' }, { status: 400 });
        }

        const reply = await communityDb.createReply({
            discussion_id: discussionId,
            user_id: user.id,
            content,
            parent_id: parentId,
        });

        if (!reply) {
            return NextResponse.json({ error: 'Failed to create reply' }, { status: 500 });
        }

        return NextResponse.json(reply);
    } catch (error) {
        console.error('Error creating reply:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
