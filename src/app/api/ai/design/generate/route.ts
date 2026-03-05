import { NextRequest, NextResponse } from "next/server";
import { createMegallmClient } from "@/lib/megallm";

export const dynamic = "force-dynamic";

const VALID_COMPONENT_TYPES = [
    "web-server",
    "api-server",
    "app-server",
    "microservice",
    "postgres",
    "mysql",
    "mongodb",
    "redis",
    "cassandra",
    "dynamodb",
    "cache-layer",
    "cdn",
    "load-balancer",
    "api-gateway",
    "message-queue",
    "reverse-proxy",
    "lambda",
    "container",
    "kubernetes",
    "web-client",
    "mobile-client",
    "iot-device",
];

const COMPONENT_META: Record<string, { icon: string; color: string; category: string }> = {
    "web-server": { icon: "🖥️", color: "#8b5cf6", category: "server" },
    "api-server": { icon: "🔌", color: "#3b82f6", category: "server" },
    "app-server": { icon: "⚙️", color: "#10b981", category: "server" },
    "microservice": { icon: "🔷", color: "#06b6d4", category: "server" },
    "postgres": { icon: "🐘", color: "#336791", category: "database" },
    "mysql": { icon: "🗄️", color: "#00758f", category: "database" },
    "mongodb": { icon: "🍃", color: "#47a248", category: "database" },
    "redis": { icon: "⚡", color: "#dc382d", category: "database" },
    "cassandra": { icon: "📊", color: "#1287b1", category: "database" },
    "dynamodb": { icon: "📦", color: "#4053d6", category: "database" },
    "cache-layer": { icon: "💾", color: "#f59e0b", category: "cache" },
    "cdn": { icon: "🌍", color: "#f97316", category: "cache" },
    "load-balancer": { icon: "⚖️", color: "#22c55e", category: "infrastructure" },
    "api-gateway": { icon: "🚪", color: "#a855f7", category: "infrastructure" },
    "message-queue": { icon: "📨", color: "#ec4899", category: "infrastructure" },
    "reverse-proxy": { icon: "🔄", color: "#6366f1", category: "infrastructure" },
    "lambda": { icon: "λ", color: "#ff9900", category: "service" },
    "container": { icon: "📦", color: "#2496ed", category: "service" },
    "kubernetes": { icon: "☸️", color: "#326ce5", category: "service" },
    "web-client": { icon: "🌐", color: "#64748b", category: "client" },
    "mobile-client": { icon: "📱", color: "#64748b", category: "client" },
    "iot-device": { icon: "📡", color: "#64748b", category: "client" },
};

const SYSTEM_PROMPT = `You are an expert software architect. Given a user's app description, output ONLY a valid JSON object (no markdown, no explanation, no code fences) with this exact schema:

{"nodes":[{"id":"string","type":"architecture","position":{"x":0,"y":0},"data":{"type":"component-type","label":"Label"}}],"edges":[{"id":"string","source":"node-id","target":"node-id"}]}

Valid component types: ${VALID_COMPONENT_TYPES.join(", ")}

Layout rules:
- Clients: x=50, Infrastructure: x=400, Servers: x=800, Databases: x=1200
- Space nodes 200px apart vertically (y=50, y=250, y=450, etc.)
- Use 6-12 components. Always include at least one client.
- Every edge source/target must match a node id.
- Design for scalability and redundancy.

Example for a simple blog:
{"nodes":[{"id":"c1","type":"architecture","position":{"x":50,"y":200},"data":{"type":"web-client","label":"Web Client"}},{"id":"lb1","type":"architecture","position":{"x":400,"y":200},"data":{"type":"load-balancer","label":"Load Balancer"}},{"id":"api1","type":"architecture","position":{"x":800,"y":200},"data":{"type":"api-server","label":"API Server"}},{"id":"db1","type":"architecture","position":{"x":1200,"y":200},"data":{"type":"postgres","label":"PostgreSQL"}}],"edges":[{"id":"e1","source":"c1","target":"lb1"},{"id":"e2","source":"lb1","target":"api1"},{"id":"e3","source":"api1","target":"db1"}]}

CRITICAL: Output ONLY the JSON object. No text before or after it.`;

/**
 * Aggressively extract a JSON object from LLM output.
 * Handles code fences, leading/trailing text, and common issues.
 */
function extractJSON(text: string): string {
    let cleaned = text.trim();

    // 1. Strip markdown code fences (```json ... ``` or ``` ... ```)
    cleaned = cleaned.replace(/^```(?:json|JSON)?\s*\n?/gm, "");
    cleaned = cleaned.replace(/\n?\s*```\s*$/gm, "");
    cleaned = cleaned.trim();

    // 2. Find the first '{' and last '}' to extract the JSON object
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    } else if (firstBrace !== -1) {
        // JSON might be truncated — take from first brace and try to repair
        cleaned = cleaned.substring(firstBrace);
    }

    // 3. Remove trailing commas before } or ] (common LLM mistake)
    cleaned = cleaned.replace(/,\s*([\]}])/g, "$1");

    // 4. Try to repair truncated JSON by closing open brackets/braces
    if (!cleaned.endsWith("}")) {
        // Count unmatched braces/brackets
        let braces = 0;
        let brackets = 0;
        let inString = false;
        let escape = false;
        for (const ch of cleaned) {
            if (escape) { escape = false; continue; }
            if (ch === "\\") { escape = true; continue; }
            if (ch === '"') { inString = !inString; continue; }
            if (inString) continue;
            if (ch === "{") braces++;
            if (ch === "}") braces--;
            if (ch === "[") brackets++;
            if (ch === "]") brackets--;
        }
        // Remove any trailing incomplete value (e.g., a string that was cut off)
        cleaned = cleaned.replace(/,\s*"[^"]*$/, "");
        cleaned = cleaned.replace(/,\s*\{[^}]*$/, "");
        // Close open brackets/braces
        for (let i = 0; i < brackets; i++) cleaned += "]";
        for (let i = 0; i < braces; i++) cleaned += "}";
    }

    return cleaned.trim();
}

/**
 * Call the LLM with retry on transient failures.
 */
async function callLLMWithRetry(
    client: ReturnType<typeof createMegallmClient>,
    messages: Array<{ role: "system" | "user"; content: string }>,
    maxRetries = 2
): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            // Try with json_object format first, fall back to regular on retry
            const useJsonMode = attempt === 0;

            const completion = await client.chat.completions.create({
                model: "openai-gpt-oss-120b",
                messages,
                max_tokens: 4096,
                temperature: attempt === 0 ? 0.3 : 0.2, // Lower temp on retry
                ...(useJsonMode ? { response_format: { type: "json_object" as const } } : {}),
            });

            const raw = completion.choices[0]?.message?.content;
            if (!raw) {
                throw new Error("AI returned an empty response.");
            }

            // Validate we can parse JSON from this response
            const jsonStr = extractJSON(raw);
            try {
                const test = JSON.parse(jsonStr);
                if (test.nodes && Array.isArray(test.nodes)) {
                    return jsonStr; // Good response, return parsed JSON string
                }
                throw new Error("Response missing nodes array");
            } catch (parseErr) {
                console.warn(`AI Design: Parse failed on attempt ${attempt + 1}. Raw (first 300 chars):`, raw.slice(0, 300));
                if (attempt < maxRetries) {
                    // Wait before retry
                    await new Promise((r) => setTimeout(r, 800));
                    continue;
                }
                throw parseErr;
            }
        } catch (error: any) {
            lastError = error instanceof Error ? error : new Error(String(error));
            const isTransient =
                error?.status >= 500 ||
                error?.code === "ETIMEDOUT" ||
                error?.code === "ECONNRESET" ||
                error?.message?.includes("fetch failed") ||
                error?.message?.includes("timeout");

            if ((isTransient || error instanceof SyntaxError) && attempt < maxRetries) {
                await new Promise((r) => setTimeout(r, 1000));
                continue;
            }
            break;
        }
    }

    throw lastError || new Error("Failed to get response from AI.");
}

/**
 * Validate and ensure sensible node positions.
 * If positions are missing or stacked at (0,0), auto-layout in a grid.
 */
function ensureValidPositions(
    nodes: Array<{ id: string; position?: { x?: number; y?: number }; [key: string]: any }>
): void {
    const allAtOrigin = nodes.every(
        (n) => !n.position || (n.position.x === 0 && n.position.y === 0)
    );

    if (allAtOrigin && nodes.length > 0) {
        // Auto-layout: arrange in a grid
        const cols = Math.ceil(Math.sqrt(nodes.length));
        nodes.forEach((n, i) => {
            n.position = {
                x: 100 + (i % cols) * 300,
                y: 100 + Math.floor(i / cols) * 250,
            };
        });
    } else {
        // Just ensure each position is valid
        nodes.forEach((n, i) => {
            if (!n.position || typeof n.position.x !== "number" || typeof n.position.y !== "number") {
                n.position = { x: 100 + (i % 4) * 300, y: 100 + Math.floor(i / 4) * 250 };
            }
        });
    }
}

export async function POST(request: NextRequest) {
    try {
        // Pre-check: API key must be configured
        const apiKey = process.env.MEGALLM_API_KEY;
        if (!apiKey || apiKey.trim() === "") {
            return NextResponse.json(
                { error: "AI is not configured. Please set the MEGALLM_API_KEY environment variable." },
                { status: 503 }
            );
        }

        const { prompt } = await request.json();

        if (!prompt || typeof prompt !== "string") {
            return NextResponse.json(
                { error: "A prompt is required." },
                { status: 400 }
            );
        }

        const trimmedPrompt = prompt.trim();

        if (trimmedPrompt.length < 3) {
            return NextResponse.json(
                { error: "Prompt must be at least 3 characters." },
                { status: 400 }
            );
        }

        if (trimmedPrompt.length > 500) {
            return NextResponse.json(
                { error: "Prompt must be less than 500 characters." },
                { status: 400 }
            );
        }

        // Use the shared MegaLLM client
        const client = createMegallmClient(apiKey);

        let jsonStr: string;
        try {
            jsonStr = await callLLMWithRetry(client, [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: `Design the best architecture for: ${trimmedPrompt}` },
            ]);
        } catch (err) {
            console.error("AI Design: All LLM attempts failed:", err);
            return NextResponse.json(
                { error: "AI could not generate a valid architecture. Please try again or use a simpler prompt." },
                { status: 502 }
            );
        }

        // Parse the validated JSON string
        let parsed: {
            nodes: Array<{
                id: string;
                type: string;
                position: { x: number; y: number };
                data: { type: string; label: string };
            }>;
            edges: Array<{ id: string; source: string; target: string }>;
        };

        try {
            parsed = JSON.parse(jsonStr);
        } catch {
            console.error("AI Design: Final JSON parse failed. JSON string:", jsonStr.slice(0, 500));
            return NextResponse.json(
                { error: "AI returned malformed data. Please try again with a different prompt." },
                { status: 502 }
            );
        }

        if (!Array.isArray(parsed.nodes)) {
            // Try to find nodes in nested structure (some models wrap it)
            const anyParsed = parsed as any;
            if (anyParsed.architecture?.nodes) {
                parsed.nodes = anyParsed.architecture.nodes;
                parsed.edges = anyParsed.architecture.edges || [];
            } else if (anyParsed.data?.nodes) {
                parsed.nodes = anyParsed.data.nodes;
                parsed.edges = anyParsed.data.edges || [];
            }
        }

        if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
            return NextResponse.json(
                { error: "AI returned an invalid architecture structure. Please try again." },
                { status: 502 }
            );
        }

        // Filter to only valid component types
        const validRawNodes = parsed.nodes.filter(
            (n) => n?.data?.type && VALID_COMPONENT_TYPES.includes(n.data.type)
        );

        if (validRawNodes.length === 0) {
            return NextResponse.json(
                { error: "AI couldn't generate valid architecture components. Try a more specific prompt." },
                { status: 502 }
            );
        }

        // Ensure valid positions
        ensureValidPositions(validRawNodes);

        // Generate unique IDs and build mapping from original → unique
        const nodeIdMap = new Map<string, string>();
        let idCounter = 0;

        const enrichedNodes = validRawNodes.map((n) => {
            // Generate a truly unique ID
            const uniqueId = `${n.data.type}-${Date.now()}-${idCounter++}`;
            // Map the original AI-generated ID to our unique ID
            nodeIdMap.set(n.id, uniqueId);

            const meta = COMPONENT_META[n.data.type];
            return {
                id: uniqueId,
                type: "architecture",
                position: n.position,
                data: {
                    type: n.data.type,
                    label: n.data.label || meta?.icon || n.data.type,
                    icon: meta?.icon || "📦",
                    color: meta?.color || "#8b5cf6",
                    category: meta?.category || "server",
                    config: {},
                },
            };
        });

        // Remap edge source/target using the ID mapping
        const validNodeIds = new Set(enrichedNodes.map((n) => n.id));
        const validEdges = parsed.edges
            .map((e, index) => {
                const mappedSource = nodeIdMap.get(e.source);
                const mappedTarget = nodeIdMap.get(e.target);
                if (!mappedSource || !mappedTarget) return null;
                if (!validNodeIds.has(mappedSource) || !validNodeIds.has(mappedTarget)) return null;

                return {
                    id: `edge-${Date.now()}-${index}`,
                    source: mappedSource,
                    target: mappedTarget,
                    animated: true,
                    style: { stroke: "#8b5cf6", strokeWidth: 2 },
                };
            })
            .filter(Boolean);

        return NextResponse.json({
            nodes: enrichedNodes,
            edges: validEdges,
        });
    } catch (error) {
        console.error("AI Design Generate Error:", error);

        if (error instanceof SyntaxError) {
            return NextResponse.json(
                { error: "AI returned malformed JSON. Please try again." },
                { status: 502 }
            );
        }

        const message = error instanceof Error ? error.message : "Failed to generate architecture.";

        // Detect common failure modes and give better messages
        if (message.includes("401") || message.includes("Unauthorized")) {
            return NextResponse.json(
                { error: "AI API key is invalid. Please check your MEGALLM_API_KEY." },
                { status: 401 }
            );
        }
        if (message.includes("429") || message.includes("rate limit")) {
            return NextResponse.json(
                { error: "AI rate limit exceeded. Please wait a moment and try again." },
                { status: 429 }
            );
        }
        if (message.includes("fetch failed") || message.includes("ECONNREFUSED")) {
            return NextResponse.json(
                { error: "Could not reach AI service. Please check your network connection and try again." },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}

