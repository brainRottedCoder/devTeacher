import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const supabase = createServerClient();

        // Test connection first
        const { error: connectionError } = await supabase.from("modules").select("count").limit(1);

        if (connectionError) {
            console.error("Supabase connection error:", connectionError);

            // Check if it's a connection timeout
            if (connectionError.message?.includes('fetch failed') || connectionError.message?.includes('timeout')) {
                return NextResponse.json({
                    error: "Database connection unavailable. Please try again later.",
                    code: "DB_UNAVAILABLE"
                }, { status: 503 });
            }

            return NextResponse.json({ error: connectionError.message }, { status: 500 });
        }

        const { data: modules, error } = await supabase
            .from("modules")
            .select("*")
            .order("order_index", { ascending: true });

        if (error) {
            console.error("Error fetching modules:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ modules });
    } catch (error: any) {
        console.error("Error in modules API:", error);

        // Handle network/connection errors
        if (error?.message?.includes('fetch failed') || error?.cause?.message?.includes('connect')) {
            return NextResponse.json({
                error: "Unable to connect to database. Please check your network connection.",
                code: "NETWORK_ERROR"
            }, { status: 503 });
        }

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
