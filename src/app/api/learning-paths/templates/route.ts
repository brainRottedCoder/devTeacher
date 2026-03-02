import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Get learning path templates from database
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const role = searchParams.get('role');
        const level = searchParams.get('level');

        const supabase = createServerClient();

        // If requesting recommendations, get personalized recommendations
        if (type === 'recommendations') {
            // Get current user if authenticated
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user) {
                // Get user's recommendations from database
                const { data: recommendations, error: recError } = await (supabase
                    .from('path_recommendations') as any)
                    .select(`
                        *,
                        path:learning_paths(*),
                        custom_path:custom_learning_paths(*)
                    `)
                    .eq('user_id', session.user.id)
                    .gt('expires_at', new Date().toISOString())
                    .order('relevance_score', { ascending: false })
                    .limit(5);

                if (!recError && recommendations && recommendations.length > 0) {
                    return NextResponse.json(recommendations);
                }
            }

            // Fallback: Get popular templates as recommendations
            const { data: popularPaths } = await (supabase
                .from('learning_paths') as any)
                .select('*')
                .order('estimated_hours', { ascending: true })
                .limit(5);

            // Transform to recommendation format
            const recommendations = (popularPaths || []).map((path: any) => ({
                path_id: path.id,
                path,
                relevance_score: 0.5,
                reason: `Popular ${path.role} path for ${path.level} developers`,
                missing_skills: [],
            }));

            return NextResponse.json(recommendations);
        }

        // Get templates from learning_paths table
        let query = (supabase
            .from('learning_paths') as any)
            .select('*');

        // Filter by role if provided
        if (role) {
            query = query.eq('role', role);
        }

        // Filter by level if provided
        if (level) {
            query = query.eq('level', level);
        }

        // Order by estimated hours
        const { data: templates, error } = await query.order('estimated_hours', { ascending: true });

        if (error) {
            console.error('Error fetching templates:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get items for each template
        const templatesWithItems = await Promise.all(
            (templates || []).map(async (template: any) => {
                const { data: items } = await (supabase
                    .from('learning_path_items') as any)
                    .select('*')
                    .eq('path_id', template.id)
                    .order('order_index', { ascending: true });

                return {
                    ...template,
                    items: items || [],
                    is_popular: template.estimated_hours > 0,
                };
            })
        );

        return NextResponse.json(templatesWithItems);
    } catch (error) {
        console.error('Error in learning-paths/templates:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Create a new learning path template (admin only)
export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient();
        
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized - Login required' }, { status: 401 });
        }

        const body = await request.json();
        const { 
            name, 
            description, 
            role, 
            level, 
            estimated_hours, 
            items = [],
        } = body;

        if (!name || !role || !level) {
            return NextResponse.json({ 
                error: 'name, role, and level are required' 
            }, { status: 400 });
        }

        // Create the learning path
        const { data: path, error: pathError } = await (supabase
            .from('learning_paths') as any)
            .insert({
                name,
                description: description || '',
                role,
                level,
                estimated_hours: estimated_hours || 0,
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
                .from('learning_path_items') as any)
                .insert(itemsData);
        }

        // Fetch the created path with items
        const { data: createdPath } = await (supabase
            .from('learning_paths') as any)
            .select('*, learning_path_items(*)')
            .eq('id', path.id)
            .single();

        return NextResponse.json(createdPath, { status: 201 });
    } catch (error) {
        console.error('Error creating template:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
