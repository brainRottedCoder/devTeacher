import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

async function getAuthenticatedUser(supabase: ReturnType<typeof createRouteHandlerClient<any>>) {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

async function getUserProfile(supabase: ReturnType<typeof createRouteHandlerClient<any>>, userId: string) {
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, name, email, avatar_url')
        .eq('id', userId)
        .single();
    
    if (profile) {
        return profile;
    }
    
    const { data: authUser } = await supabase.auth.getUser();
    if (authUser.user?.email) {
        return {
            id: userId,
            name: authUser.user.email.split('@')[0],
            email: authUser.user.email,
            avatar_url: null
        };
    }
    
    return { id: userId, name: 'Unknown', email: '', avatar_url: null };
}

export async function GET(request: NextRequest) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const { searchParams } = new URL(request.url);
        const teamId = searchParams.get('teamId');

        if (!teamId) {
            return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
        }

        const user = await getAuthenticatedUser(supabase);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: members, error: membersError } = await supabase
            .from('team_members')
            .select('*')
            .eq('team_id', teamId)
            .order('joined_at', { ascending: true });

        if (membersError) {
            console.error('Error fetching members:', membersError);
            return NextResponse.json({ error: membersError.message }, { status: 500 });
        }

        const membersWithUsers = await Promise.all(
            (members || []).map(async (member) => {
                const userProfile = await getUserProfile(supabase, member.user_id);
                return {
                    ...member,
                    user: userProfile
                };
            })
        );

        const { data: invitations, error: invitationsError } = await supabase
            .from('team_invitations')
            .select('*')
            .eq('team_id', teamId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (invitationsError) {
            console.error('Error fetching invitations:', invitationsError);
        }

        const { data: team } = await supabase
            .from('teams')
            .select('name')
            .eq('id', teamId)
            .single();

        const invitationsWithTeam = (invitations || []).map(inv => ({
            ...inv,
            team: team ? { id: teamId, name: team.name } : null
        }));

        return NextResponse.json({ 
            members: membersWithUsers, 
            invitations: invitationsWithTeam 
        });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        
        const user = await getAuthenticatedUser(supabase);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { teamId, email, role = 'member' } = body;

        if (!teamId || !email) {
            return NextResponse.json({ error: 'Team ID and email are required' }, { status: 400 });
        }

        const { data: existingMember } = await supabase
            .from('team_members')
            .select('user_id, user:user_profiles(email)')
            .eq('team_id', teamId)
            .limit(1)
            .single();

        if (existingMember) {
            const { data: memberUser } = await supabase.auth.getUser();
            if (memberUser.user?.email !== email) {
                return NextResponse.json({ error: 'User is already a member of this team' }, { status: 400 });
            }
        }

        const { data: existingInvitation } = await supabase
            .from('team_invitations')
            .select('*')
            .eq('team_id', teamId)
            .eq('email', email)
            .eq('status', 'pending')
            .maybeSingle();

        if (existingInvitation) {
            return NextResponse.json({ error: 'Invitation already sent to this email' }, { status: 400 });
        }

        const token = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const { data: invitation, error: invitationError } = await supabase
            .from('team_invitations')
            .insert({
                team_id: teamId,
                email,
                role,
                token,
                invited_by: user.id,
                expires_at: expiresAt,
                status: 'pending'
            })
            .select()
            .single();

        if (invitationError) {
            console.error('Error creating invitation:', invitationError);
            return NextResponse.json({ error: invitationError.message }, { status: 500 });
        }

        const { data: team } = await supabase
            .from('teams')
            .select('name')
            .eq('id', teamId)
            .single();

        return NextResponse.json({
            ...invitation,
            team: team ? { id: teamId, name: team.name } : null
        });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        
        const user = await getAuthenticatedUser(supabase);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { memberId, role } = body;

        if (!memberId || !role) {
            return NextResponse.json({ error: 'Member ID and role are required' }, { status: 400 });
        }

        const { data: member, error: fetchError } = await supabase
            .from('team_members')
            .select('team_id, role')
            .eq('id', memberId)
            .single();

        if (fetchError || !member) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        const { data: currentUserRole } = await supabase
            .from('team_members')
            .select('role')
            .eq('team_id', member.team_id)
            .eq('user_id', user.id)
            .single();

        if (!currentUserRole || !['owner', 'admin'].includes(currentUserRole.role)) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        if (member.role === 'owner' && role !== 'owner') {
            return NextResponse.json({ error: 'Cannot change owner role' }, { status: 400 });
        }

        const { data: updatedMember, error: updateError } = await supabase
            .from('team_members')
            .update({ role })
            .eq('id', memberId)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating member:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        const userProfile = await getUserProfile(supabase, updatedMember.user_id);
        
        return NextResponse.json({
            ...updatedMember,
            user: userProfile
        });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        
        const user = await getAuthenticatedUser(supabase);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const memberId = searchParams.get('memberId');

        if (!memberId) {
            return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
        }

        const { data: member, error: fetchError } = await supabase
            .from('team_members')
            .select('team_id, user_id, role')
            .eq('id', memberId)
            .single();

        if (fetchError || !member) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        if (member.user_id === user.id) {
            return NextResponse.json({ error: 'Cannot remove yourself from the team' }, { status: 400 });
        }

        const { data: currentUserRole } = await supabase
            .from('team_members')
            .select('role')
            .eq('team_id', member.team_id)
            .eq('user_id', user.id)
            .single();

        if (!currentUserRole || !['owner', 'admin'].includes(currentUserRole.role)) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        const { error: deleteError } = await supabase
            .from('team_members')
            .delete()
            .eq('id', memberId);

        if (deleteError) {
            console.error('Error removing member:', deleteError);
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
