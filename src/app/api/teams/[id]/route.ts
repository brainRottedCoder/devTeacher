import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

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

        const { data: team, error } = await supabase
            .from('teams')
            .select('*')
            .eq('id', teamId)
            .single();

        if (error) {
            console.error('Error fetching team:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(team);
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
