import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { KNOWLEDGE_GRAPH_TEMPLATES, KnowledgeGraph, LearningPath } from "@/lib/knowledge-graph";

async function getAuthUser(supabase: ReturnType<typeof createServerClient>) {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user ?? null;
}

export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const { searchParams } = new URL(request.url);
        const pathId = searchParams.get("pathId");
        const userId = searchParams.get("userId");

        if (pathId) {
            const template = KNOWLEDGE_GRAPH_TEMPLATES[pathId];
            if (!template) {
                return NextResponse.json({ error: "Learning path not found" }, { status: 404 });
            }

            let userMastery: Record<string, number> = {};
            let userProgress: any = null;

            if (userId) {
                const { data: progress } = await (supabase
                    .from("knowledge_mastery") as any)
                    .select("*")
                    .eq("user_id", userId)
                    .eq("path_id", pathId);

                if (progress) {
                    for (const p of progress) {
                        userMastery[p.node_id] = p.mastery_score;
                    }
                }

                const { data: userPath } = await (supabase
                    .from("user_learning_paths") as any)
                    .select("*")
                    .eq("user_id", userId)
                    .eq("path_id", pathId)
                    .single();

                userProgress = userPath;
            }

            const nodes = template.nodes.map(node => ({
                ...node,
                mastery: userMastery[node.id] ?? node.mastery,
            }));

            return NextResponse.json({
                path: {
                    id: template.id,
                    name: template.name,
                    description: template.description,
                    estimatedHours: template.estimatedHours,
                    nodeCount: template.nodes.length,
                },
                nodes,
                edges: template.edges,
                userMastery,
                userProgress,
            });
        }

        const paths = Object.values(KNOWLEDGE_GRAPH_TEMPLATES).map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            estimatedHours: p.estimatedHours,
            nodeCount: p.nodes.length,
        }));

        return NextResponse.json({ paths });
    } catch (error: any) {
        console.error("Error fetching knowledge graph:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const user = await getAuthUser(supabase);

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { pathId, nodeId, masteryScore, timeSpent } = body;

        if (!pathId || !nodeId) {
            return NextResponse.json({ error: "pathId and nodeId are required" }, { status: 400 });
        }

        const template = KNOWLEDGE_GRAPH_TEMPLATES[pathId];
        if (!template) {
            return NextResponse.json({ error: "Learning path not found" }, { status: 404 });
        }

        const { data: existing, error: fetchError } = await (supabase
            .from("knowledge_mastery") as any)
            .select("*")
            .eq("user_id", user.id)
            .eq("path_id", pathId)
            .eq("node_id", nodeId)
            .single();

        if (existing) {
            const { error: updateError } = await (supabase
                .from("knowledge_mastery") as any)
                .update({
                    mastery_score: masteryScore ?? existing.mastery_score,
                    time_spent_minutes: timeSpent ? existing.time_spent_minutes + timeSpent : existing.time_spent_minutes,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", existing.id);

            if (updateError) {
                return NextResponse.json({ error: updateError.message }, { status: 500 });
            }
        } else {
            const { error: insertError } = await (supabase
                .from("knowledge_mastery") as any)
                .insert({
                    user_id: user.id,
                    path_id: pathId,
                    node_id: nodeId,
                    mastery_score: masteryScore ?? 0,
                    time_spent_minutes: timeSpent ?? 0,
                });

            if (insertError) {
                return NextResponse.json({ error: insertError.message }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error updating knowledge mastery:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const user = await getAuthUser(supabase);

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { pathId, status } = body;

        if (!pathId) {
            return NextResponse.json({ error: "pathId is required" }, { status: 400 });
        }

        const template = KNOWLEDGE_GRAPH_TEMPLATES[pathId];
        if (!template) {
            return NextResponse.json({ error: "Learning path not found" }, { status: 404 });
        }

        const { data: existing } = await (supabase
            .from("user_learning_paths") as any)
            .select("*")
            .eq("user_id", user.id)
            .eq("path_id", pathId)
            .single();

        if (existing) {
            await (supabase
                .from("user_learning_paths") as any)
                .update({
                    status: status ?? existing.status,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", existing.id);
        } else {
            await (supabase
                .from("user_learning_paths") as any)
                .insert({
                    user_id: user.id,
                    path_id: pathId,
                    status: status ?? "active",
                    started_at: new Date().toISOString(),
                });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error updating learning path status:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const user = await getAuthUser(supabase);

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const pathId = searchParams.get("pathId");
        const nodeId = searchParams.get("nodeId");

        if (!pathId) {
            return NextResponse.json({ error: "pathId is required" }, { status: 400 });
        }

        if (nodeId) {
            await (supabase
                .from("knowledge_mastery") as any)
                .delete()
                .eq("user_id", user.id)
                .eq("path_id", pathId)
                .eq("node_id", nodeId);
        } else {
            await (supabase
                .from("knowledge_mastery") as any)
                .delete()
                .eq("user_id", user.id)
                .eq("path_id", pathId);

            await (supabase
                .from("user_learning_paths") as any)
                .delete()
                .eq("user_id", user.id)
                .eq("path_id", pathId);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting knowledge progress:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
