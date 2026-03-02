import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch teams the user is a member of (RLS handles this automatically)
        const { data: teams, error } = await supabase
            .from('teams')
            .select(`
                *,
                team_members (
                    user_id,
                    role
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching teams:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ teams });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name } = body;

        if (!name || typeof name !== 'string') {
            return NextResponse.json({ error: "Team name is required" }, { status: 400 });
        }

        // 1. Create the team
        const { data: team, error: teamError } = await supabase
            .from('teams')
            .insert({ name, owner_id: user.id })
            .select()
            .single();

        if (teamError) {
            console.error('Error creating team:', teamError);
            return NextResponse.json({ error: teamError.message }, { status: 500 });
        }

        // 2. Add the owner as a team member
        const { error: memberError } = await supabase
            .from('team_members')
            .insert({
                team_id: team.id,
                user_id: user.id,
                role: 'owner'
            });

        if (memberError) {
            console.error('Error adding team owner to members:', memberError);
            // Non-fatal, but should be logged. The user is still the owner.
        }

        return NextResponse.json({ team }, { status: 201 });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
