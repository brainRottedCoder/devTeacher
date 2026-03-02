import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Get members of a specific team
export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const teamId = params.id;

        const { data: members, error } = await supabase
            .from('team_members')
            .select(`
                id,
                team_id,
                user_id,
                role,
                joined_at
            `)
            .eq('team_id', teamId);

        if (error) {
            console.error('Error fetching team members:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ members });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// Add or update a member (Admin/Owner only based on RLS)
export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const teamId = params.id;
        const body = await req.json();
        const { userId, role } = body;

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const validRoles = ['member', 'admin', 'owner'];
        const memberRole = validRoles.includes(role) ? role : 'member';

        const { data: member, error } = await supabase
            .from('team_members')
            .upsert({
                team_id: teamId,
                user_id: userId,
                role: memberRole
            }, { onConflict: 'team_id,user_id' })
            .select()
            .single();

        if (error) {
            console.error('Error adding/updating team member:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ member });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
