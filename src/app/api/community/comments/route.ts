import { NextRequest, NextResponse } from 'next/server';
import { communityDb } from '@/lib/db/community';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const designId = searchParams.get('designId');

    if (!designId) {
        return NextResponse.json({ error: 'Design ID required' }, { status: 400 });
    }

    try {
        const comments = await communityDb.getDesignComments(designId);
        return NextResponse.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }
}

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
        const { designId, content, parentId } = body;

        if (!designId || !content) {
            return NextResponse.json({ error: 'Design ID and content required' }, { status: 400 });
        }

        const comment = await communityDb.createDesignComment({
            design_id: designId,
            user_id: user.id,
            content,
            parent_id: parentId,
        });

        if (!comment) {
            return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
        }

        return NextResponse.json(comment);
    } catch (error) {
        console.error('Error creating comment:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
