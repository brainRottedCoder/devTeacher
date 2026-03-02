import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
        
        // Fetch companies from database
        const { data: companies, error } = await supabase
            .from("companies")
            .select("*")
            .order("name", { ascending: true });

        if (error) {
            console.error("Error fetching companies:", error);
            return NextResponse.json(
                { error: "Failed to fetch companies", details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ companies });
    } catch (error: any) {
        console.error("Error fetching companies:", error);
        return NextResponse.json(
            { error: "Failed to fetch companies", details: error.message },
            { status: 500 }
        );
    }
}
