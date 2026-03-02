import { NextResponse } from 'next/server';
import { communityDb } from '@/lib/db/community';

export async function GET() {
    try {
        const stats = await communityDb.getCommunityStats();
        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error fetching community stats:', error);
        return NextResponse.json({
            totalDesigns: 0,
            totalDiscussions: 0,
            totalUsers: 0,
            activeToday: 0,
        });
    }
}
