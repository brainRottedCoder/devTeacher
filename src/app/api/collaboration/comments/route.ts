import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const designId = searchParams.get('designId');
        const type = searchParams.get('type');

        if (!designId) {
            return NextResponse.json({ error: 'Design ID is required' }, { status: 400 });
        }

        const supabase = createServerClient();

        if (type === 'versions') {
            const { data: versions, error } = await (supabase
                .from('collaboration_versions') as any)
                .select('*')
                .eq('design_id', designId)
                .order('version', { ascending: false });

            if (error) throw error;
            return NextResponse.json(versions || []);
        }

        // Fetch comments along with their replies
        const { data: comments, error } = await (supabase
            .from('collaboration_comments') as any)
            .select(`
                *,
                replies:collaboration_comment_replies(*)
            `)
            .eq('design_id', designId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        
        // Ensure replies is always an array
        const formattedComments = (comments || []).map((c: any) => ({
            ...c,
            replies: c.replies || []
        }));

        return NextResponse.json(formattedComments);
    } catch (error) {
        console.error('Error in GET collaboration comments:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { designId, userId, userName, content, nodeId, position } = body;

        if (!designId || !content) {
            return NextResponse.json({ error: 'Design ID and content are required' }, { status: 400 });
        }

        const supabase = createServerClient();
        
        const { data: newComment, error } = await (supabase
            .from('collaboration_comments') as any)
            .insert({
                design_id: designId,
                user_id: userId,
                user_name: userName,
                content,
                node_id: nodeId,
                position: position || null,
                resolved: false,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ ...newComment, replies: [] });
    } catch (error) {
        console.error('Error in POST collaboration comment:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { commentId, resolved, reply } = body;

        if (!commentId) {
            return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
        }

        const supabase = createServerClient();

        if (resolved !== undefined) {
            const { data: updatedComment, error } = await (supabase
                .from('collaboration_comments') as any)
                .update({ resolved })
                .eq('id', commentId)
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json(updatedComment);
        }

        if (reply) {
            const { data: newReply, error } = await (supabase
                .from('collaboration_comment_replies') as any)
                .insert({
                    comment_id: commentId,
                    user_id: reply.user_id,
                    user_name: reply.user_name,
                    content: reply.content,
                })
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json(newReply);
        }

        return NextResponse.json({ error: 'No update action provided' }, { status: 400 });
    } catch (error) {
        console.error('Error in PUT collaboration comment:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
