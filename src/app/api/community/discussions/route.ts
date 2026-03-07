import { NextRequest, NextResponse } from 'next/server';
import { communityDb } from '@/lib/db/community';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    try {
        const discussions = await communityDb.getDiscussions({ 
            category: category && category.trim() !== '' ? category : undefined, 
            limit, 
            offset 
        });
        return NextResponse.json(discussions);
    } catch (error) {
        console.error('Error fetching discussions:', error);
        return NextResponse.json({ error: 'Failed to fetch discussions' }, { status: 500 });
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
        const { title, content, category, tags } = body;

        if (!title || !content || !category) {
            return NextResponse.json({ error: 'Title, content, and category required' }, { status: 400 });
        }

        const discussion = await communityDb.createDiscussion({
            user_id: user.id,
            title,
            content,
            category,
            tags: tags || [],
        });

        if (!discussion) {
            return NextResponse.json({ error: 'Failed to create discussion' }, { status: 500 });
        }

        return NextResponse.json(discussion);
    } catch (error) {
        console.error('Error creating discussion:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
