import { NextRequest, NextResponse } from 'next/server';
import { communityDb } from '@/lib/db/community';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const design = await communityDb.getSharedDesign(id);
        if (!design) {
            return NextResponse.json({ error: 'Design not found' }, { status: 404 });
        }

        const comments = await communityDb.getDesignComments(id);

        return NextResponse.json({
            ...design,
            comments,
        });
    } catch (error) {
        console.error('Error fetching design:', error);
        return NextResponse.json({ error: 'Failed to fetch design' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

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

        const design = await communityDb.getSharedDesign(id);
        if (!design) {
            return NextResponse.json({ error: 'Design not found' }, { status: 404 });
        }

        if (design.user_id !== user.id) {
            return NextResponse.json({ error: 'Not authorized to delete this design' }, { status: 403 });
        }

        const { error: deleteError } = await supabase
            .from('shared_designs')
            .delete()
            .eq('id', id);

        if (deleteError) {
            return NextResponse.json({ error: 'Failed to delete design' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting design:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
