import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: usage, error } = await supabase
            .from("user_token_usage")
            .select("*")
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Token usage fetch error:", error);
            return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 });
        }

        // Calculate aggregate stats
        const totalInputTokens = usage?.reduce((sum: number, record: any) => sum + record.input_tokens, 0) || 0;
        const totalOutputTokens = usage?.reduce((sum: number, record: any) => sum + record.output_tokens, 0) || 0;

        // Group by date for charts
        const dailyUsage: Record<string, { date: string; input: number; output: number }> = {};

        usage?.forEach((record: any) => {
            const date = new Date(record.created_at).toISOString().split('T')[0];
            if (!dailyUsage[date]) {
                dailyUsage[date] = { date, input: 0, output: 0 };
            }
            dailyUsage[date].input += record.input_tokens;
            dailyUsage[date].output += record.output_tokens;
        });

        return NextResponse.json({
            totalInputTokens,
            totalOutputTokens,
            totalTokens: totalInputTokens + totalOutputTokens,
            dailyUsage: Object.values(dailyUsage).sort((a: any, b: any) => a.date.localeCompare(b.date)),
            history: usage?.slice(0, 50) || [] // Return last 50 for table
        });
    } catch (error) {
        console.error("Usage API Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
