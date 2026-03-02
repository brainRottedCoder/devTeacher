import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

async function getAuthenticatedUser(supabase: ReturnType<typeof createRouteHandlerClient<any>>) {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

async function getTeamMemberStats(supabase: ReturnType<typeof createRouteHandlerClient<any>>, teamId: string, startDate: Date) {
    const { data: members } = await supabase
        .from('team_members')
        .select('user_id, role, joined_at')
        .eq('team_id', teamId);

    if (!members || members.length === 0) {
        return [];
    }

    const userIds = members.map(m => m.user_id);

    const { data: progress } = await supabase
        .from('user_progress')
        .select('user_id, lesson_id, completed_at, score')
        .in('user_id', userIds)
        .gte('completed_at', startDate.toISOString());

    const { data: certifications } = await supabase
        .from('user_certifications')
        .select('user_id, earned_at')
        .in('user_id', userIds)
        .gte('earned_at', startDate.toISOString());

    const { data: designs } = await supabase
        .from('community_designs')
        .select('user_id, created_at')
        .in('user_id', userIds)
        .gte('created_at', startDate.toISOString());

    const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, name, email, avatar_url')
        .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    return members.map(member => {
        const userProgress = progress?.filter(p => p.user_id === member.user_id) || [];
        const userCerts = certifications?.filter(c => c.user_id === member.user_id) || [];
        const userDesigns = designs?.filter(d => d.user_id === member.user_id) || [];

        const completedModules = new Set(userProgress.map(p => p.lesson_id)).size;
        const avgScore = userProgress.length > 0
            ? Math.round(userProgress.reduce((acc, p) => acc + (p.score || 0), 0) / userProgress.length)
            : 0;
        const timeSpent = userProgress.length * 15;

        const profile = profileMap.get(member.user_id);
        
        let lastActive: string = member.joined_at;
        if (userProgress.length > 0) {
            const latestProgress = userProgress.reduce((latest, p) => 
                p.completed_at > latest ? p.completed_at : latest, member.joined_at);
            lastActive = latestProgress;
        }

        return {
            userId: member.user_id,
            userName: profile?.name || profile?.email?.split('@')[0] || 'Unknown',
            modulesCompleted: completedModules,
            avgScore,
            timeSpent,
            lastActive
        };
    });
}

async function getActivityTimeline(supabase: ReturnType<typeof createRouteHandlerClient<any>>, teamId: string, startDate: Date) {
    const { data: members } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId);

    if (!members || members.length === 0) {
        return [];
    }

    const userIds = members.map(m => m.user_id);

    const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, name, email')
        .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const { data: moduleCompletions } = await supabase
        .from('user_progress')
        .select('user_id, completed_at, lesson_id, lessons(title)')
        .in('user_id', userIds)
        .gte('completed_at', startDate.toISOString())
        .order('completed_at', { ascending: false })
        .limit(10);

    const { data: newCertifications } = await supabase
        .from('user_certifications')
        .select('user_id, earned_at, certifications(name)')
        .in('user_id', userIds)
        .gte('earned_at', startDate.toISOString())
        .order('earned_at', { ascending: false })
        .limit(5);

    const { data: newDesigns } = await supabase
        .from('community_designs')
        .select('user_id, created_at, title')
        .in('user_id', userIds)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

    const activities: Array<{
        id: string;
        type: string;
        userId: string;
        userName: string;
        description: string;
        timestamp: string;
    }> = [];

    moduleCompletions?.forEach((item, index) => {
        const profile = profileMap.get(item.user_id);
        activities.push({
            id: `module-${index}`,
            type: 'module_complete',
            userId: item.user_id,
            userName: profile?.name || profile?.email?.split('@')[0] || 'Unknown',
            description: `Completed a lesson`,
            timestamp: item.completed_at
        });
    });

    newCertifications?.forEach((item, index) => {
        const profile = profileMap.get(item.user_id);
        const certName = (item.certifications as any)?.name || 'a certification';
        activities.push({
            id: `cert-${index}`,
            type: 'certification',
            userId: item.user_id,
            userName: profile?.name || profile?.email?.split('@')[0] || 'Unknown',
            description: `Earned ${certName} certification`,
            timestamp: item.earned_at
        });
    });

    newDesigns?.forEach((item, index) => {
        const profile = profileMap.get(item.user_id);
        activities.push({
            id: `design-${index}`,
            type: 'design_create',
            userId: item.user_id,
            userName: profile?.name || profile?.email?.split('@')[0] || 'Unknown',
            description: `Created "${item.title || 'a new design'}"`,
            timestamp: item.created_at
        });
    });

    return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
}

function getDateRangeForPeriod(period: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
        case 'week':
            startDate.setDate(startDate.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
        case 'quarter':
            startDate.setMonth(startDate.getMonth() - 3);
            break;
        default:
            startDate.setMonth(startDate.getMonth() - 1);
    }

    return { startDate, endDate };
}

export async function GET(request: NextRequest) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        
        const user = await getAuthenticatedUser(supabase);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const teamId = searchParams.get('teamId');
        const period = searchParams.get('period') || 'month';

        if (!teamId) {
            return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
        }

        const { data: memberRole } = await supabase
            .from('team_members')
            .select('role')
            .eq('team_id', teamId)
            .eq('user_id', user.id)
            .single();

        if (!memberRole) {
            return NextResponse.json({ error: 'You are not a member of this team' }, { status: 403 });
        }

        const { startDate } = getDateRangeForPeriod(period);

        const { data: members } = await supabase
            .from('team_members')
            .select('user_id')
            .eq('team_id', teamId);

        const userIds = members?.map(m => m.user_id) || [];
        const totalMembers = userIds.length;

        const { data: activeProgress } = await supabase
            .from('user_progress')
            .select('user_id')
            .in('user_id', userIds)
            .gte('completed_at', startDate.toISOString());

        const activeUserIds = new Set(activeProgress?.map(p => p.user_id) || []);
        const activeMembers = activeUserIds.size;

        const { data: completions } = await supabase
            .from('user_progress')
            .select('lesson_id')
            .in('user_id', userIds)
            .gte('completed_at', startDate.toISOString());

        const modulesCompleted = new Set(completions?.map(c => c.lesson_id) || []).size;

        const { data: certs } = await supabase
            .from('user_certifications')
            .select('id')
            .in('user_id', userIds)
            .gte('earned_at', startDate.toISOString());

        const certificationsEarned = certs?.length || 0;

        const { data: communityDesigns } = await supabase
            .from('community_designs')
            .select('id')
            .in('user_id', userIds)
            .gte('created_at', startDate.toISOString());

        const designsCreated = communityDesigns?.length || 0;

        const avgProgress = totalMembers > 0 
            ? Math.round((activeMembers / totalMembers) * 100) 
            : 0;

        const memberStats = await getTeamMemberStats(supabase, teamId, startDate);

        const topPerformers = memberStats
            .sort((a, b) => b.avgScore - a.avgScore)
            .slice(0, 3)
            .map((stat, index) => ({
                userId: stat.userId,
                userName: stat.userName,
                score: stat.avgScore,
                badge: index === 0 ? '🏆' : index === 1 ? '🥈' : '🥉'
            }));

        const activityTimeline = await getActivityTimeline(supabase, teamId, startDate);

        const avgSessionTime = Math.round(
            memberStats.reduce((acc, m) => acc + m.timeSpent, 0) / (totalMembers || 1)
        );

        return NextResponse.json({
            teamId,
            period,
            metrics: {
                totalMembers,
                activeMembers,
                avgProgress,
                modulesCompleted,
                certificationsEarned,
                designsCreated,
                avgSessionTime
            },
            memberStats,
            topPerformers,
            activityTimeline
        });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
