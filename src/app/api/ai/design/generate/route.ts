import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

// Lazy-initialize OpenAI client configured for MegaLLM
let _openai: OpenAI | null = null;
function getClient() {
    if (!_openai) {
        _openai = new OpenAI({
            apiKey: process.env.MEGALLM_API_KEY || "",
            baseURL: "https://ai.megallm.io/v1",
        });
    }
    return _openai;
}

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

const SYSTEM_PROMPT = `You are an expert software architect. Given a user's description of their application, generate the best scalable, stable, production-ready architecture.

Return a JSON object with exactly this structure:
{
  "nodes": [
    {
      "id": "unique-string-id",
      "type": "architecture",
      "position": { "x": number, "y": number },
      "data": {
        "type": "<component-type>",
        "label": "Human-readable label"
      }
    }
  ],
  "edges": [
    {
      "id": "unique-edge-id",
      "source": "<node-id>",
      "target": "<node-id>"
    }
  ]
}

VALID component types (use ONLY these for data.type):
${VALID_COMPONENT_TYPES.join(", ")}

RULES:
1. Place nodes in a readable left-to-right flow. Clients on the left (x~100), infrastructure in the middle (x~300-500), servers next (x~500-700), databases on the right (x~700-900). Space y positions 100-120px apart.
2. Use 5-15 components for a good architecture. Always include clients.
3. Every edge must reference valid node IDs from your nodes array.
4. Design for scalability: use load balancers, caching, message queues where appropriate.
5. Design for stability: avoid single points of failure, add redundancy.
6. Return ONLY valid JSON, no markdown fences, no explanation.`;

export async function POST(request: NextRequest) {
    try {
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

        const completion = await getClient().chat.completions.create({
            model: "openai-gpt-oss-120b",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                {
                    role: "user",
                    content: `Design the best architecture for: ${trimmedPrompt}`,
                },
            ],
            max_tokens: 3000,
            temperature: 0.4,
            response_format: { type: "json_object" },
        });

        const raw = completion.choices[0]?.message?.content;
        if (!raw) {
            return NextResponse.json(
                { error: "AI returned an empty response. Please try again." },
                { status: 502 }
            );
        }

        // Parse and validate
        const parsed = JSON.parse(raw) as {
            nodes: Array<{
                id: string;
                type: string;
                position: { x: number; y: number };
                data: { type: string; label: string };
            }>;
            edges: Array<{ id: string; source: string; target: string }>;
        };

        if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
            return NextResponse.json(
                { error: "AI returned an invalid architecture structure." },
                { status: 502 }
            );
        }

        // Enrich nodes with icon, color, category from our component meta
        // Generate unique IDs to avoid duplicates
        const nodeIdMap = new Map<string, string>();
        let idCounter = 0;
        
        const enrichedNodes = parsed.nodes
            .filter((n) => VALID_COMPONENT_TYPES.includes(n.data?.type))
            .map((n) => {
                // Generate a unique ID if needed
                let uniqueId = n.id;
                if (nodeIdMap.has(n.id)) {
                    uniqueId = `${n.id}-${idCounter++}`;
                }
                nodeIdMap.set(n.id, uniqueId);
                
                const meta = COMPONENT_META[n.data.type];
                return {
                    id: uniqueId,
                    type: "architecture",
                    position: n.position || { x: 0, y: 0 },
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

        // Only keep edges that reference valid enriched node IDs and use mapped IDs
        const validNodeIds = new Set(enrichedNodes.map((n) => n.id));
        const validEdges = parsed.edges
            .filter((e) => {
                const mappedSource = nodeIdMap.get(e.source);
                const mappedTarget = nodeIdMap.get(e.target);
                return mappedSource && mappedTarget && validNodeIds.has(mappedSource) && validNodeIds.has(mappedTarget);
            })
            .map((e, index) => ({
                id: `${e.id || `edge-${index}`}`,
                source: nodeIdMap.get(e.source) || e.source,
                target: nodeIdMap.get(e.target) || e.target,
                animated: true,
                style: { stroke: "#8b5cf6", strokeWidth: 2 },
            }));

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

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to generate architecture.",
            },
            { status: 500 }
        );
    }
}
