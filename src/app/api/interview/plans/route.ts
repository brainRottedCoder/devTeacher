import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

async function getUserId(supabase: any): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
}

export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient() as any;
        const userId = await getUserId(supabase);
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: plans, error } = await supabase
            .from("study_plans")
            .select(`
                *,
                company:companies(*),
                items:study_plan_items(
                    *,
                    question:interview_questions(*)
                )
            `)
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ plans: plans || [] });
    } catch (error: any) {
        console.error("Error fetching study plans:", error);
        return NextResponse.json(
            { error: "Failed to fetch study plans", details: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient() as any;
        const userId = await getUserId(supabase);
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const body = await request.json();
        const { name, description, target_company_id, duration_weeks, questions_per_day, question_ids } = body;

        // Create study plan
        const { data: plan, error: planError } = await supabase
            .from("study_plans")
            .insert([
                {
                    user_id: userId,
                    name,
                    description,
                    target_company_id,
                    duration_weeks: duration_weeks || 4,
                    questions_per_day: questions_per_day || 3,
                    status: "active"
                }
            ])
            .select(`*, company:companies(*)`)
            .single();

        if (planError) {
            return NextResponse.json({ error: planError.message }, { status: 500 });
        }

        // Create study plan items
        if (question_ids && question_ids.length > 0) {
            const items = question_ids.map((question_id: string, index: number) => ({
                plan_id: plan.id,
                question_id,
                day_number: Math.floor(index / (questions_per_day || 3)) + 1,
                status: "pending"
            }));

            const { error: itemsError } = await supabase
                .from("study_plan_items")
                .insert(items);

            if (itemsError) {
                // Cleanup if items creation fails
                await supabase.from("study_plans").delete().eq("id", plan.id);
                return NextResponse.json({ error: itemsError.message }, { status: 500 });
            }
        }

        return NextResponse.json({ plan }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating study plan:", error);
        return NextResponse.json(
            { error: "Failed to create study plan", details: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = createServerClient() as any;
        const userId = await getUserId(supabase);
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const body = await request.json();
        const { id, status } = body;

        // Verify ownership
        const { data: existingPlan } = await supabase
            .from("study_plans")
            .select("user_id")
            .eq("id", id)
            .single();
            
        if (!existingPlan || existingPlan.user_id !== userId) {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        const { data: plan, error } = await supabase
            .from("study_plans")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("id", id)
            .select(`*, company:companies(*)`)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ plan });
    } catch (error: any) {
        console.error("Error updating study plan:", error);
        return NextResponse.json(
            { error: "Failed to update study plan", details: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = createServerClient() as any;
        const userId = await getUserId(supabase);
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Plan ID required" }, { status: 400 });
        }

        // Verify ownership
        const { data: existingPlan } = await supabase
            .from("study_plans")
            .select("user_id")
            .eq("id", id)
            .single();
            
        if (!existingPlan || existingPlan.user_id !== userId) {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        const { error } = await supabase
            .from("study_plans")
            .delete()
            .eq("id", id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting study plan:", error);
        return NextResponse.json(
            { error: "Failed to delete study plan", details: error.message },
            { status: 500 }
        );
    }
}
