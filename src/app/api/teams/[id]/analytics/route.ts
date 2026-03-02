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

        // Return dummy analytics for now
        // In a real app, you would aggregate the data across team members
        return NextResponse.json({
            period: 'month',
            metrics: {
                totalMembers: 5,
                activeMembers: 3,
                avgProgress: 88,
                modulesCompleted: 45,
                certificationsEarned: 2,
                designsCreated: 15,
                avgSessionTime: 30
            },
            activityTimeline: [
                { type: 'module_complete', userName: 'Alice', description: 'Completed Kubernetes Basics', timestamp: new Date().toISOString() },
                { type: 'certification', userName: 'Bob', description: 'Earned Docker Expert cert', timestamp: new Date(Date.now() - 3600000).toISOString() },
            ],
            memberStats: [
                { userName: 'Alice', modulesCompleted: 15, avgScore: 95, timeSpent: 2800 },
                { userName: 'Bob', modulesCompleted: 10, avgScore: 89, timeSpent: 1600 },
            ]
        });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
