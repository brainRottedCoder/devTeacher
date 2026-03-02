import { createClient } from "@supabase/supabase-js";

// Lazy-initialize Supabase client with SERVICE ROLE key (bypasses RLS for embedding writes + vector search)
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
    if (!_supabase) {
        _supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
    }
    return _supabase;
}

// Text chunking configuration
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

export interface TextChunk {
    id: string;
    content: string;
    moduleId: string;
    lessonId?: string;
    lessonTitle?: string;
    metadata: {
        position: number;
        wordCount: number;
    };
}

export interface SearchResult {
    chunk: TextChunk;
    score: number;
}

/**
 * Split text into overlapping chunks
 */
export function chunkText(text: string, moduleId: string, lessonId?: string, lessonTitle?: string): TextChunk[] {
    if (!text || text.length < CHUNK_SIZE) {
        return [{
            id: `${moduleId}-${lessonId || 'module'}-0`,
            content: text,
            moduleId,
            lessonId,
            lessonTitle,
            metadata: {
                position: 0,
                wordCount: text.split(/\s+/).length,
            },
        }];
    }

    const chunks: TextChunk[] = [];
    const words = text.split(/\s+/);
    let position = 0;

    while (position < words.length) {
        const chunkWords = words.slice(position, position + CHUNK_SIZE);
        const chunkContent = chunkWords.join(" ");

        chunks.push({
            id: `${moduleId}-${lessonId || 'module'}-${chunks.length}`,
            content: chunkContent,
            moduleId,
            lessonId,
            lessonTitle,
            metadata: {
                position: chunks.length,
                wordCount: chunkWords.length,
            },
        });

        position += CHUNK_SIZE - CHUNK_OVERLAP;
    }

    return chunks;
}

/**
 * Generate embeddings — tries MegaLLM/OpenAI first, falls back to Gemini
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
    // Try MegaLLM / OpenAI first
    const megallmResult = await generateEmbeddingViaOpenAI(text);
    if (megallmResult) return megallmResult;

    // Fallback to Gemini
    const geminiResult = await generateEmbeddingViaGemini(text);
    if (geminiResult) return geminiResult;

    console.warn("[RAG] No embedding provider succeeded");
    return null;
}

/**
 * Generate embedding using MegaLLM / OpenAI compatible API
 */
async function generateEmbeddingViaOpenAI(text: string): Promise<number[] | null> {
    const apiKey = process.env.MEGALLM_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    try {
        const baseUrl = process.env.MEGALLM_BASE_URL || "https://api.openai.com/v1";
        const response = await fetch(`${baseUrl}/embeddings`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                input: text.slice(0, 8000),
                model: "text-embedding-ada-002",
            }),
        });

        if (!response.ok) {
            console.warn("[RAG] MegaLLM/OpenAI embedding failed:", response.status, response.statusText);
            return null;
        }

        const data = await response.json();
        return data.data?.[0]?.embedding || null;
    } catch (error) {
        console.warn("[RAG] MegaLLM/OpenAI embedding error:", error);
        return null;
    }
}

/**
 * Generate embedding using Gemini API (fallback)
 * Uses text-embedding-004 model which produces 768-dimensional vectors.
 * We pad/truncate to 1536 dimensions to match our pgvector column.
 */
async function generateEmbeddingViaGemini(text: string): Promise<number[] | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "models/text-embedding-004",
                    content: { parts: [{ text: text.slice(0, 8000) }] },
                    outputDimensionality: 1536, // Match pgvector column size
                }),
            }
        );

        if (!response.ok) {
            console.warn("[RAG] Gemini embedding failed:", response.status, response.statusText);
            return null;
        }

        const data = await response.json();
        const embedding = data.embedding?.values;
        if (!embedding || !Array.isArray(embedding)) return null;

        // Ensure exactly 1536 dimensions (pad with 0 if needed)
        if (embedding.length < 1536) {
            return [...embedding, ...new Array(1536 - embedding.length).fill(0)];
        }
        return embedding.slice(0, 1536);
    } catch (error) {
        console.warn("[RAG] Gemini embedding error:", error);
        return null;
    }
}

/**
 * Vector similarity search using pgvector match_documents RPC
 */
async function vectorSearch(query: string, matchCount: number = 5): Promise<SearchResult[]> {
    try {
        const queryEmbedding = await generateEmbedding(query);
        if (!queryEmbedding) return [];

        const { data, error } = await (getSupabase() as any)
            .rpc("match_documents", {
                query_embedding: queryEmbedding,
                match_threshold: 0.7,
                match_count: matchCount,
            });

        if (error || !data) {
            console.error("[RAG] Vector search error:", error);
            return [];
        }

        return data.map((doc: any) => ({
            chunk: {
                id: doc.id,
                content: doc.content,
                moduleId: doc.metadata?.module_id || "",
                lessonId: doc.metadata?.lesson_id,
                lessonTitle: doc.metadata?.lesson_title,
                metadata: {
                    position: 0,
                    wordCount: doc.content.split(/\s+/).length,
                },
            },
            score: doc.similarity,
        }));
    } catch (error) {
        console.error("[RAG] Vector search failed:", error);
        return [];
    }
}

/**
 * Keyword-based similarity search (fallback when vector search returns nothing)
 */
async function keywordSearch(query: string, moduleId?: string): Promise<SearchResult[]> {
    try {
        let lessonsQuery = getSupabase()
            .from("lessons")
            .select("id, title, content, module_id, modules(title)")
            .textSearch("content", query.split(" ").join(" | "))
            .limit(5);

        if (moduleId) {
            lessonsQuery = lessonsQuery.eq("module_id", moduleId);
        }

        const { data: lessons, error } = await lessonsQuery as { data: Array<{ id: string; title: string; content: string; module_id: string; modules: { title: string } | null }> | null; error: any };

        if (error || !lessons) {
            console.error("[RAG] Keyword search error:", error);
            return [];
        }

        const results: SearchResult[] = [];

        for (const lesson of lessons) {
            if (!lesson.content) continue;

            const queryWords = query.toLowerCase().split(/\s+/);
            const contentLower = lesson.content.toLowerCase();

            let score = 0;
            for (const word of queryWords) {
                const matches = contentLower.split(word).length - 1;
                score += matches;
            }

            if (score > 0) {
                const chunks = chunkText(
                    lesson.content,
                    lesson.module_id,
                    lesson.id,
                    lesson.title
                );

                let bestChunk = chunks[0];
                let bestChunkScore = 0;

                for (const chunk of chunks) {
                    let chunkScore = 0;
                    for (const word of queryWords) {
                        chunkScore += chunk.content.toLowerCase().split(word).length - 1;
                    }
                    if (chunkScore > bestChunkScore) {
                        bestChunkScore = chunkScore;
                        bestChunk = chunk;
                    }
                }

                results.push({
                    chunk: bestChunk,
                    score: score + bestChunkScore,
                });
            }
        }

        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
    } catch (error) {
        console.error("[RAG] Keyword search error:", error);
        return [];
    }
}

/**
 * Hybrid search using Reciprocal Rank Fusion (RRF)
 */
export async function searchContext(query: string, moduleId?: string): Promise<SearchResult[]> {
    // Run both searches concurrently
    const [vectorResults, keywordResults] = await Promise.all([
        vectorSearch(query),
        keywordSearch(query, moduleId)
    ]);

    if (vectorResults.length === 0 && keywordResults.length === 0) {
        return [];
    }

    // Reciprocal Rank Fusion (RRF)
    const k = 60;
    const scores = new Map<string, { chunk: TextChunk, rrfScore: number }>();

    // Rank vector results (weighted higher)
    vectorResults.forEach((result, index) => {
        const id = result.chunk.id;
        const rank = index + 1;
        const rrfScore = 1.5 / (k + rank); // 1.5x weight for vector results

        scores.set(id, { chunk: result.chunk, rrfScore });
    });

    // Rank keyword results
    keywordResults.forEach((result, index) => {
        const id = result.chunk.id;
        const rank = index + 1;
        const rrfScore = 1 / (k + rank);

        if (scores.has(id)) {
            scores.get(id)!.rrfScore += rrfScore;
        } else {
            scores.set(id, { chunk: result.chunk, rrfScore });
        }
    });

    // Sort by combined RRF score and return top results
    const fusedResults = Array.from(scores.values())
        .sort((a, b) => b.rrfScore - a.rrfScore)
        .map(item => ({ chunk: item.chunk, score: item.rrfScore }))
        .slice(0, 5);

    return fusedResults;
}

/**
 * Build context string from search results for RAG
 */
export function buildRAGContext(searchResults: SearchResult[]): string {
    if (searchResults.length === 0) {
        return "";
    }

    const contextParts = searchResults.map((result) => {
        const source = result.chunk.lessonTitle
            ? `[From: ${result.chunk.lessonTitle}]`
            : "[From: Module Content]";

        return `${source}\n${result.chunk.content}`;
    });

    return `Relevant context from knowledge base:\n\n${contextParts.join("\n\n---\n\n")}`;
}

/**
 * Full RAG pipeline: retrieve relevant context and augment the prompt
 */
export async function getRAGContext(query: string, moduleId?: string): Promise<string> {
    const searchResults = await searchContext(query, moduleId);
    return buildRAGContext(searchResults);
}

/**
 * Embed and store content for vector search
 */
export async function embedAndStoreContent(
    content: string,
    metadata: { module_id?: string; lesson_id?: string; lesson_title?: string }
): Promise<boolean> {
    try {
        const embedding = await generateEmbedding(content);
        if (!embedding) return false;

        const { error } = await (getSupabase()
            .from("content_embeddings") as any)
            .insert({
                content,
                embedding,
                metadata,
            });

        if (error) {
            console.error("[RAG] Error storing embedding:", error);
            return false;
        }

        return true;
    } catch (error) {
        console.error("[RAG] Error in embedAndStoreContent:", error);
        return false;
    }
}
