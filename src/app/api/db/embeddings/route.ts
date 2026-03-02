import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateEmbedding, chunkText } from "@/lib/rag";

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

/**
 * API Route to populate content_embeddings table
 * 
 * GET /api/db/embeddings - Get current embedding status
 * POST /api/db/embeddings - Populate embeddings from modules content
 * 
 * This endpoint:
 * 1. Fetches all modules and lessons from the database
 * 2. Chunks content into smaller pieces
 * 3. Generates embeddings using the configured AI provider (Megallm/OpenAI)
 * 4. Stores embeddings in the content_embeddings table for RAG similarity search
 */

// GET: Get embedding status
export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabase();
        
        // Check if content_embeddings table exists
        const { data: tableCheck, error: tableError } = await supabase
            .from("content_embeddings")
            .select("count")
            .limit(1);

        if (tableError) {
            return NextResponse.json({
                error: "content_embeddings table not found or pgvector not enabled",
                details: tableError.message
            }, { status: 500 });
        }

        // Get count and sample
        const { count } = await supabase
            .from("content_embeddings")
            .select("*", { count: "exact", head: true });

        const { data: samples } = await supabase
            .from("content_embeddings")
            .select("id, metadata, created_at")
            .order("created_at", { ascending: false })
            .limit(5);

        return NextResponse.json({
            status: "ok",
            totalEmbeddings: count || 0,
            recentEmbeddings: samples || [],
            message: count === 0 ? "No embeddings found. POST to populate." : "Embeddings exist."
        });
    } catch (error: any) {
        console.error("Error getting embedding status:", error);
        return NextResponse.json({
            error: "Failed to get embedding status",
            details: error.message
        }, { status: 500 });
    }
}

// POST: Populate embeddings from modules content
export async function POST(request: NextRequest) {
    try {
        const supabase = getSupabase();
        
        // Fetch all modules
        const { data, error: modulesError } = await supabase
            .from("modules")
            .select("id, title, description, content, category, difficulty");
        
        const modules = data as any[] | null;

        if (modulesError) {
            return NextResponse.json({
                error: "Failed to fetch modules",
                details: modulesError.message
            }, { status: 500 });
        }

        if (!modules || modules.length === 0) {
            return NextResponse.json({
                error: "No modules found to embed",
                message: "Please ensure modules exist in the database first"
            }, { status: 400 });
        }

        // Check if pgvector extension is enabled
        try {
            // @ts-expect-error - match_documents might not be in the generated database types yet
            await supabase.rpc("match_documents", {
                query_embedding: Array(1536).fill(0),
                match_threshold: 0.7,
                match_count: 1
            });
        } catch (pgError: any) {
            return NextResponse.json({
                error: "pgvector not enabled or match_documents function missing",
                details: pgError.message,
                solution: "Run migration 005_pgvector.sql in Supabase dashboard"
            }, { status: 500 });
        }

        let totalChunks = 0;
        let embeddedCount = 0;
        const errors: string[] = [];

        // Process each module
        for (const courseModule of modules) {
            // Combine title, description, and content for embedding
            const contentText = `
                Module: ${courseModule.title}
                Category: ${courseModule.category}
                Difficulty: ${courseModule.difficulty}
                Description: ${courseModule.description}
                Content: ${typeof courseModule.content === 'string' ? courseModule.content : JSON.stringify(courseModule.content)}
            `;

            // Chunk the content
            const chunks = chunkText(contentText, courseModule.id);
            totalChunks += chunks.length;

            // Generate embeddings and store
            for (const chunk of chunks) {
                try {
                    const embedding = await generateEmbedding(chunk.content);
                    
                    if (!embedding) {
                        errors.push(`Failed to generate embedding for chunk: ${chunk.id}`);
                        continue;
                    }

                    const { error: insertError } = await supabase
                        .from("content_embeddings")
                        .insert({
                            content: chunk.content,
                            embedding: embedding,
                            metadata: {
                                module_id: courseModule.id,
                                chunk_id: chunk.id,
                                title: courseModule.title,
                                category: courseModule.category,
                                difficulty: courseModule.difficulty,
                                word_count: chunk.metadata.wordCount
                            }
                        } as any);

                    if (insertError) {
                        errors.push(`Insert error for ${chunk.id}: ${insertError.message}`);
                    } else {
                        embeddedCount++;
                    }
                } catch (chunkError: any) {
                    errors.push(`Error processing chunk ${chunk.id}: ${chunkError.message}`);
                }
            }
        }

        return NextResponse.json({
            status: "completed",
            modulesProcessed: modules.length,
            totalChunks,
            embeddingsCreated: embeddedCount,
            errors: errors.length > 0 ? errors : undefined,
            message: `Successfully created ${embeddedCount} embeddings from ${modules.length} modules`
        });

    } catch (error: any) {
        console.error("Error populating embeddings:", error);
        return NextResponse.json({
            error: "Failed to populate embeddings",
            details: error.message
        }, { status: 500 });
    }
}

// DELETE: Clear all embeddings (for re-indexing)
export async function DELETE(request: NextRequest) {
    try {
        const supabase = getSupabase();
        
        const { error } = await supabase
            .from("content_embeddings")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

        if (error) {
            return NextResponse.json({
                error: "Failed to clear embeddings",
                details: error.message
            }, { status: 500 });
        }

        return NextResponse.json({
            status: "cleared",
            message: "All embeddings have been deleted"
        });
    } catch (error: any) {
        console.error("Error clearing embeddings:", error);
        return NextResponse.json({
            error: "Failed to clear embeddings",
            details: error.message
        }, { status: 500 });
    }
}
