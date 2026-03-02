import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { analyzeWithAI } from "@/lib/designer/ai-analyzer";
import { analyzeArchitecture } from "@/lib/designer/analyzer";

export async function POST(request: NextRequest) {
    try {
        // Auth check
        const supabase = createServerClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { nodes, edges, useAI = true } = body;

        if (!nodes || !Array.isArray(nodes)) {
            return NextResponse.json(
                { error: "Invalid request: nodes array is required" },
                { status: 400 }
            );
        }

        if (!edges || !Array.isArray(edges)) {
            return NextResponse.json(
                { error: "Invalid request: edges array is required" },
                { status: 400 }
            );
        }

        let analysis;

        if (useAI) {
            try {
                analysis = await analyzeWithAI(nodes, edges);
            } catch (aiError) {
                console.error("AI analysis failed, falling back to rule-based:", aiError);
                analysis = analyzeArchitecture(nodes, edges);
            }
        } else {
            analysis = analyzeArchitecture(nodes, edges);
        }

        return NextResponse.json({ analysis });
    } catch (error) {
        console.error("Error analyzing design:", error);
        return NextResponse.json(
            { error: "Failed to analyze design" },
            { status: 500 }
        );
    }
}
