import { NextRequest, NextResponse } from 'next/server';
import { communityDb } from '@/lib/db/community';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const timeframe = (searchParams.get('timeframe') || 'month') as 'week' | 'month' | 'all';

    try {
        const leaderboard = await communityDb.getLeaderboard(timeframe);
        return NextResponse.json(leaderboard);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return NextResponse.json([]);
    }
}
