import { NextRequest, NextResponse } from 'next/server';
import { communityDb } from '@/lib/db/community';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'trending';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    try {
        const designs = await communityDb.getSharedDesigns({ sortBy, limit, offset });
        return NextResponse.json(designs);
    } catch (error) {
        console.error('Error fetching designs:', error);
        return NextResponse.json({ error: 'Failed to fetch designs' }, { status: 500 });
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
        const { title, description, designData, difficulty, tags, previewImage } = body;

        if (!title || !designData) {
            return NextResponse.json({ error: 'Title and design data required' }, { status: 400 });
        }

        const design = await communityDb.createSharedDesign({
            user_id: user.id,
            title,
            description,
            design_data: designData,
            difficulty: difficulty || 'medium',
            tags: tags || [],
            preview_image: previewImage,
        });

        if (!design) {
            return NextResponse.json({ error: 'Failed to create design' }, { status: 500 });
        }

        return NextResponse.json(design);
    } catch (error) {
        console.error('Error sharing design:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
