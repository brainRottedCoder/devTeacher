import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Lazy-initialize Supabase client
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
    if (!_supabase) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        _supabase = createClient(supabaseUrl, supabaseServiceKey);
    }
    return _supabase;
}

export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabase();
        
        // Get query parameters
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('companyId') || searchParams.get('company_id');
        const type = searchParams.get('type');
        const difficulty = searchParams.get('difficulty');
        const limit = parseInt(searchParams.get('limit') || '20');
        
        // Build query
        let query = supabase
            .from("interview_questions")
            .select(`
                *,
                company:companies(id, name, logo_url)
            `);
        
        // Apply filters
        if (companyId) {
            query = query.eq("company_id", companyId);
        }
        if (type) {
            query = query.eq("type", type);
        }
        if (difficulty) {
            query = query.eq("difficulty", difficulty);
        }
        
        // Execute query with limit
        const { data: questions, error } = await query.limit(limit);
        
        if (error) {
            console.error("Error fetching questions:", error);
            return NextResponse.json(
                { error: "Failed to fetch questions", details: error.message },
                { status: 500 }
            );
        }
        
        // Get total count for pagination
        let countQuery = supabase
            .from("interview_questions")
            .select("*", { count: "exact", head: true });
        
        if (companyId) {
            countQuery = countQuery.eq("company_id", companyId);
        }
        if (type) {
            countQuery = countQuery.eq("type", type);
        }
        if (difficulty) {
            countQuery = countQuery.eq("difficulty", difficulty);
        }
        
        const { count } = await countQuery;

        return NextResponse.json({
            questions: questions || [],
            total: count || 0
        });
    } catch (error: any) {
        console.error("Error fetching questions:", error);
        return NextResponse.json(
            { error: "Failed to fetch questions", details: error.message },
            { status: 500 }
        );
    }
}
