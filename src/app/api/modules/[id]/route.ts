import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createServerClient();
        const { id } = params;

        // Get module
        const { data: module, error } = await supabase
            .from("modules")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            console.error("Error fetching module:", error);
            return NextResponse.json({ error: error.message }, { status: 404 });
        }

        // Get lessons for this module
        const { data: lessons, error: lessonsError } = await supabase
            .from("lessons")
            .select("*")
            .eq("module_id", id)
            .eq("is_published", true)
            .order("order_index", { ascending: true });

        if (lessonsError) {
            console.error("Error fetching lessons:", lessonsError);
        }

        return NextResponse.json({ module, lessons: lessons || [] });
    } catch (error) {
        console.error("Error in module API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
