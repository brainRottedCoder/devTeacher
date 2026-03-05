import { NextRequest, NextResponse } from "next/server";
import { createMegallmClient } from "@/lib/megallm";

export const dynamic = "force-dynamic";

const VALID_TYPES = [
    "web-server", "api-server", "app-server", "microservice",
    "postgres", "mysql", "mongodb", "redis", "cassandra", "dynamodb",
    "cache-layer", "cdn", "load-balancer", "api-gateway",
    "message-queue", "reverse-proxy", "lambda", "container", "kubernetes",
    "web-client", "mobile-client", "iot-device",
];

const ANALYSIS_PROMPT = `You are a senior software architect performing a deep architecture review. Analyze the architecture below and return a JSON object with this exact structure:

{
  "score": <number 0-100>,
  "summary": "<2-3 sentence overall assessment>",
  "issues": [
    {
      "id": "issue-1",
      "severity": "critical|warning|info",
      "type": "spof|bottleneck|security|cost|scalability|reliability",
      "title": "Short title",
      "description": "Detailed explanation of the issue",
      "affectedComponents": ["component-label"],
      "recommendation": "Specific actionable fix"
    }
  ],
  "suggestions": [
    {
      "id": "sug-1",
      "priority": "high|medium|low",
      "title": "Short title",
      "description": "What to improve and why",
      "impact": "Expected benefit",
      "effort": "easy|medium|hard"
    }
  ],
  "costEstimate": {
    "compute": <monthly USD>,
    "database": <monthly USD>,
    "storage": <monthly USD>,
    "network": <monthly USD>,
    "other": <monthly USD>,
    "total": <sum>,
    "monthlyEstimate": <same as total>,
    "currency": "USD"
  }
}

Analysis checklist — evaluate ALL of these:
1. **Single Points of Failure (SPOF)**: Any component without redundancy?
2. **Scalability**: Can this handle 10x traffic? Are there bottlenecks?
3. **Security**: Direct DB access from clients? Missing API gateway? Missing auth layer?
4. **Reliability**: Is there failover? Health checks? Circuit breakers?
5. **Performance**: Missing cache? Missing CDN? Connection pooling?
6. **Cost Efficiency**: Over-provisioned? Under-provisioned? Better alternatives?
7. **Best Practices**: Microservices vs monolith fit? Async communication? Event-driven patterns?
8. **Data Flow**: Are data paths optimal? Any unnecessary hops?
9. **Disaster Recovery**: Backups? Multi-region? Data replication?
10. **Observability**: Monitoring? Logging? Tracing?

Be thorough but practical. Give 4-8 issues and 3-6 suggestions. Score strictly — most architectures should be 50-85.

CRITICAL: Return ONLY the JSON object. No markdown, no code fences, no explanation.`;

function extractJSON(text: string): string {
    let cleaned = text.trim();
    cleaned = cleaned.replace(/^```(?:json|JSON)?\s*\n?/gm, "");
    cleaned = cleaned.replace(/\n?\s*```\s*$/gm, "");
    cleaned = cleaned.trim();

    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first !== -1 && last > first) {
        cleaned = cleaned.substring(first, last + 1);
    }
    cleaned = cleaned.replace(/,\s*([\]}])/g, "$1");
    return cleaned.trim();
}

function buildDescription(nodes: any[], edges: any[]): string {
    const lines: string[] = [];

    lines.push("## Components:");
    for (const n of nodes) {
        const label = n.data?.label || n.data?.type || "Unknown";
        const type = n.data?.type || "unknown";
        const category = n.data?.category || "unknown";
        lines.push(`- ${label} (type: ${type}, category: ${category})`);
    }

    lines.push("\n## Connections (data flow):");
    for (const e of edges) {
        const src = nodes.find((n: any) => n.id === e.source);
        const tgt = nodes.find((n: any) => n.id === e.target);
        const srcLabel = src?.data?.label || e.source;
        const tgtLabel = tgt?.data?.label || e.target;
        lines.push(`- ${srcLabel} → ${tgtLabel}`);
    }

    // Summary stats
    const cats: Record<string, number> = {};
    for (const n of nodes) {
        const cat = n.data?.category || "other";
        cats[cat] = (cats[cat] || 0) + 1;
    }
    lines.push(`\n## Summary: ${nodes.length} components, ${edges.length} connections`);
    for (const [cat, count] of Object.entries(cats)) {
        lines.push(`  ${cat}: ${count}`);
    }

    return lines.join("\n");
}

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.MEGALLM_API_KEY;
        if (!apiKey || apiKey.trim() === "") {
            return NextResponse.json(
                { error: "AI is not configured. Set MEGALLM_API_KEY.", fallbackToStatic: true },
                { status: 503 }
            );
        }

        const { nodes, edges } = await request.json();

        if (!Array.isArray(nodes) || nodes.length === 0) {
            return NextResponse.json(
                { error: "No components to analyze. Add components first." },
                { status: 400 }
            );
        }

        const description = buildDescription(nodes, edges || []);
        const client = createMegallmClient(apiKey);

        // Try up to 2 times
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const completion = await client.chat.completions.create({
                    model: "openai-gpt-oss-120b",
                    messages: [
                        { role: "system", content: ANALYSIS_PROMPT },
                        {
                            role: "user",
                            content: `Perform a thorough architecture review:\n\n${description}`,
                        },
                    ],
                    max_tokens: 4096,
                    temperature: attempt === 0 ? 0.3 : 0.2,
                    ...(attempt === 0 ? { response_format: { type: "json_object" as const } } : {}),
                });

                const raw = completion.choices[0]?.message?.content;
                if (!raw) continue;

                const jsonStr = extractJSON(raw);
                const parsed = JSON.parse(jsonStr);

                // Validate minimum structure
                if (typeof parsed.score !== "number") parsed.score = 70;
                if (!Array.isArray(parsed.issues)) parsed.issues = [];
                if (!Array.isArray(parsed.suggestions)) parsed.suggestions = [];
                if (!parsed.summary) parsed.summary = "Architecture analysis completed.";

                // Ensure cost estimate
                if (!parsed.costEstimate) {
                    parsed.costEstimate = estimateCostsFromNodes(nodes);
                }

                // Ensure IDs on issues/suggestions
                parsed.issues = parsed.issues.map((iss: any, i: number) => ({
                    id: iss.id || `ai-issue-${i}`,
                    severity: iss.severity || "info",
                    type: iss.type || "reliability",
                    title: iss.title || "Untitled Issue",
                    description: iss.description || "",
                    affectedComponents: iss.affectedComponents || [],
                    recommendation: iss.recommendation || "",
                }));

                parsed.suggestions = parsed.suggestions.map((sug: any, i: number) => ({
                    id: sug.id || `ai-sug-${i}`,
                    priority: sug.priority || "medium",
                    title: sug.title || "Untitled Suggestion",
                    description: sug.description || "",
                    impact: sug.impact || "",
                    effort: sug.effort || "medium",
                }));

                return NextResponse.json({
                    overallScore: Math.max(0, Math.min(100, parsed.score)),
                    issues: parsed.issues,
                    suggestions: parsed.suggestions,
                    costEstimate: parsed.costEstimate,
                    summary: parsed.summary,
                    aiPowered: true,
                });
            } catch (parseErr) {
                console.warn(`AI Analyze: attempt ${attempt + 1} failed:`, parseErr);
                if (attempt < 1) {
                    await new Promise((r) => setTimeout(r, 800));
                    continue;
                }
            }
        }

        // All attempts failed — tell client to use static fallback
        return NextResponse.json(
            { error: "AI analysis failed. Falling back to static analysis.", fallbackToStatic: true },
            { status: 502 }
        );
    } catch (error) {
        console.error("AI Analyze Error:", error);
        const message = error instanceof Error ? error.message : "Analysis failed.";

        if (message.includes("401") || message.includes("Unauthorized")) {
            return NextResponse.json(
                { error: "AI API key is invalid.", fallbackToStatic: true },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: message, fallbackToStatic: true },
            { status: 500 }
        );
    }
}

// Simple cost estimation from node types (used when AI doesn't return costs)
function estimateCostsFromNodes(nodes: any[]) {
    let compute = 0, database = 0, storage = 0, network = 0, other = 0;

    for (const n of nodes) {
        const type = n.data?.type;
        switch (type) {
            case "web-server": case "api-server": case "app-server": compute += 50; break;
            case "microservice": compute += 30; break;
            case "lambda": compute += 10; break;
            case "container": compute += 40; break;
            case "kubernetes": compute += 100; break;
            case "postgres": case "mysql": database += 100; break;
            case "mongodb": database += 120; break;
            case "redis": database += 30; break;
            case "cassandra": database += 200; break;
            case "dynamodb": database += 50; break;
            case "cdn": network += 50; break;
            case "load-balancer": network += 20; break;
            case "api-gateway": network += 30; break;
            case "message-queue": other += 40; break;
            case "cache-layer": other += 30; break;
        }
    }

    const total = compute + database + storage + network + other;
    return { compute, database, storage, network, other, total, monthlyEstimate: total, currency: "USD" };
}
