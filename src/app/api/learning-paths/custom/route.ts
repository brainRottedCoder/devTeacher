import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Get custom paths from database
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const pathId = searchParams.get('id');
        const userId = searchParams.get('userId');
        const isTemplate = searchParams.get('template');

        const supabase = createServerClient();
        
        // Get current user if authenticated
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id;

        // If requesting a specific path
        if (pathId) {
            // Get path details with items
            const { data: path, error } = await (supabase
                .from('custom_learning_paths') as any)
                .select('*, custom_path_items(*)')
                .eq('id', pathId)
                .single();

            if (error || !path) {
                return NextResponse.json({ error: 'Path not found' }, { status: 404 });
            }

            // Check access - owner or public
            if (!path.is_public && path.user_id !== currentUserId) {
                return NextResponse.json({ error: 'Access denied' }, { status: 403 });
            }

            // Get user's progress if authenticated
            if (currentUserId) {
                const { data: progress } = await (supabase
                    .from('user_custom_paths') as any)
                    .select('*')
                    .eq('user_id', currentUserId)
                    .eq('path_id', pathId)
                    .single();

                if (progress) {
                    (path as any).user_progress = progress;
                }
            }

            return NextResponse.json(path);
        }

        // Get list of paths
        let query = (supabase
            .from('custom_learning_paths') as any)
            .select('*');

        // Filter by template flag
        if (isTemplate === 'true') {
            query = query.eq('is_template', true);
        }
        
        // Filter by user if provided (or current user)
        if (userId) {
            query = query.eq('user_id', userId);
        } else if (currentUserId) {
            // Show public paths + user's own paths
            query = query.or(`is_public.eq.true,user_id.eq.${currentUserId}`);
        } else {
            // Only public paths for anonymous users
            query = query.eq('is_public', true);
        }

        const { data: paths, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching paths:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get progress for each path if user is authenticated
        const pathsWithProgress = await Promise.all(
            (paths || []).map(async (path: any) => {
                // Get item count for enrollment estimation
                const { data: items } = await (supabase
                    .from('custom_path_items') as any)
                    .select('id')
                    .eq('path_id', path.id);

                // Get true enrollment count
                const { count: enrollmentCount } = await (supabase
                    .from('user_custom_paths') as any)
                    .select('*', { count: 'exact', head: true })
                    .eq('path_id', path.id);

                return {
                    ...path,
                    items: items || [],
                    enrollment_count: enrollmentCount || 0,
                };
            })
        );

        return NextResponse.json(pathsWithProgress);
    } catch (error) {
        console.error('Error in custom paths:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Create a new custom path
export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient();
        
        // Require authentication
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized - Login required' }, { status: 401 });
        }

        const body = await request.json();
        const { 
            name, 
            description, 
            items = [], 
            is_public = false, 
            target_role, 
            target_level,
            prerequisites = [],
            outcomes = []
        } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        // Calculate estimated hours from items
        const estimated_hours = Math.ceil(
            items.reduce((sum: number, item: any) => 
                sum + (item.estimated_minutes || 60), 0
            ) / 60
        );

        // Create the custom path
        const { data: path, error: pathError } = await (supabase
            .from('custom_learning_paths') as any)
            .insert({
                user_id: session.user.id,
                name,
                description: description || '',
                is_public,
                is_template: false,
                target_role,
                target_level,
                estimated_hours,
                prerequisites,
                outcomes,
            })
            .select()
            .single();

        if (pathError) {
            console.error('Error creating path:', pathError);
            return NextResponse.json({ error: pathError.message }, { status: 500 });
        }

        // Add items if provided
        if (items.length > 0) {
            const itemsData = items.map((item: any, index: number) => ({
                path_id: path.id,
                item_type: item.item_type || item.type || 'module',
                item_id: item.item_id || item.itemId || '',
                order_index: index + 1,
                is_required: item.is_required !== false,
                estimated_minutes: item.estimated_minutes || 60,
                metadata: item.metadata || {},
            }));

            await (supabase
                .from('custom_path_items') as any)
                .insert(itemsData);
        }

        // Auto-enroll the creator
        await (supabase
            .from('user_custom_paths') as any)
            .insert({
                user_id: session.user.id,
                path_id: path.id,
                status: 'not_started',
            });

        // Fetch the created path with items
        const { data: createdPath } = await (supabase
            .from('custom_learning_paths') as any)
            .select('*, custom_path_items(*)')
            .eq('id', path.id)
            .single();

        return NextResponse.json(createdPath, { status: 201 });
    } catch (error) {
        console.error('Error creating custom path:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Update a custom path
export async function PUT(request: NextRequest) {
    try {
        const supabase = createServerClient();
        
        // Require authentication
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Path ID is required' }, { status: 400 });
        }

        // Check ownership
        const { data: existing } = await (supabase
            .from('custom_learning_paths') as any)
            .select('user_id')
            .eq('id', id)
            .single();

        if (!existing || existing.user_id !== session.user.id) {
            return NextResponse.json({ error: 'Access denied - You can only edit your own paths' }, { status: 403 });
        }

        // Update the path
        const { data: path, error } = await (supabase
            .from('custom_learning_paths') as any)
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating path:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(path);
    } catch (error) {
        console.error('Error updating path:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Delete a custom path
export async function DELETE(request: NextRequest) {
    try {
        const supabase = createServerClient();
        
        // Require authentication
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const pathId = searchParams.get('id');

        if (!pathId) {
            return NextResponse.json({ error: 'Path ID is required' }, { status: 400 });
        }

        // Check ownership
        const { data: existing } = await (supabase
            .from('custom_learning_paths') as any)
            .select('user_id')
            .eq('id', pathId)
            .single();

        if (!existing || existing.user_id !== session.user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Delete the path (cascade will handle items and enrollments)
        const { error } = await (supabase
            .from('custom_learning_paths') as any)
            .delete()
            .eq('id', pathId);

        if (error) {
            console.error('Error deleting path:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting path:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
