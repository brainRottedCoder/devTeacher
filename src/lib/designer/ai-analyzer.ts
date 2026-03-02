// AI Architecture Analysis - Uses MegaLLM for intelligent design review

import OpenAI from "openai";
import { Node, Edge } from "@xyflow/react";
import { ArchitectureNodeData, ArchitectureComponentType } from "./types";
import { AnalysisResult, ArchitectureIssue, ArchitectureSuggestion, CostBreakdown, parseDesign, estimateCosts } from "./analyzer";

// Lazy-initialize OpenAI client (avoids build-time crash when env vars missing)
let _openai: OpenAI | null = null;
function getOpenAIClient() {
    if (!_openai) {
        _openai = new OpenAI({
            apiKey: process.env.MEGALLM_API_KEY || process.env.OPENAI_API_KEY,
            baseURL: process.env.MEGALLM_BASE_URL || "https://api.megallm.com/v1",
        });
    }
    return _openai;
}

interface AIAnalysisResponse {
    issues: ArchitectureIssue[];
    suggestions: ArchitectureSuggestion[];
    summary: string;
    score: number;
}

// Analyze architecture using AI
export async function analyzeWithAI(
    nodes: Node[],
    edges: Edge[]
): Promise<AnalysisResult> {
    const { components, connections } = parseDesign(nodes, edges);

    if (components.length === 0) {
        return {
            overallScore: 0,
            issues: [],
            suggestions: [],
            costEstimate: estimateCosts([]),
            summary: "No components found in the architecture. Add components to get started.",
        };
    }

    // Build description for AI
    const architectureDescription = buildArchitectureDescription(components, connections);

    try {
        // Call MegaLLM for analysis
        const completion = await getOpenAIClient().chat.completions.create({
            model: "openai-gpt-oss-120b",
            messages: [
                {
                    role: "system",
                    content: `You are an expert software architect and system design reviewer. Analyze the given architecture and provide:
1. Issues found (critical, warning, or info severity)
2. Improvement suggestions
3. A summary of the architecture quality
4. A score from 0-100

Respond in JSON format:
{
  "issues": [
    {
      "id": "unique-id",
      "severity": "critical|warning|info",
      "type": "spof|bottleneck|security|scalability|reliability|cost",
      "title": "Issue title",
      "description": "Detailed description",
      "affectedComponents": ["component-id"],
      "recommendation": "How to fix it"
    }
  ],
  "suggestions": [
    {
      "id": "unique-id",
      "priority": "high|medium|low",
      "title": "Suggestion title",
      "description": "Detailed description",
      "impact": "Expected impact",
      "effort": "easy|medium|hard"
    }
  ],
  "summary": "Overall summary of the architecture",
  "score": 85
}

Focus on:
- Single points of failure (SPOF)
- Scalability concerns
- Security vulnerabilities
- Cost optimization
- Reliability patterns
- Best practices for the specific architecture type`,
                },
                {
                    role: "user",
                    content: `Analyze this system architecture:

${architectureDescription}

Provide a comprehensive review with issues, suggestions, and an overall score.`,
                },
            ],
            max_tokens: 2000,
            temperature: 0.3,
            response_format: { type: "json_object" },
        });

        const aiResponse = completion.choices[0]?.message?.content;

        if (aiResponse) {
            const parsed = JSON.parse(aiResponse) as AIAnalysisResponse;

            // Calculate cost estimate
            const costEstimate = estimateCosts(components);

            return {
                overallScore: parsed.score ?? calculateFallbackScore(components, parsed.issues),
                issues: parsed.issues ?? [],
                suggestions: parsed.suggestions ?? [],
                costEstimate,
                summary: parsed.summary ?? "Architecture analysis completed.",
            };
        }
    } catch (error) {
        console.error("AI analysis failed, falling back to rule-based analysis:", error);
    }

    // Fallback to rule-based analysis
    return fallbackAnalysis(nodes, edges);
}

// Build architecture description for AI
function buildArchitectureDescription(components: any[], connections: any[]): string {
    const lines: string[] = [];

    lines.push("## Components:");
    components.forEach((comp) => {
        lines.push(`- ${comp.label || comp.type} (${comp.type}): ID=${comp.id}`);
    });

    lines.push("\n## Connections:");
    connections.forEach((conn) => {
        const source = components.find((c) => c.id === conn.source);
        const target = components.find((c) => c.id === conn.target);
        lines.push(`- ${source?.label || conn.source} -> ${target?.label || conn.target}`);
    });

    lines.push("\n## Architecture Summary:");
    lines.push(`Total components: ${components.length}`);
    lines.push(`Total connections: ${connections.length}`);

    // Count by category
    const categories: Record<string, number> = {};
    components.forEach((comp) => {
        categories[comp.category] = (categories[comp.category] || 0) + 1;
    });

    Object.entries(categories).forEach(([cat, count]) => {
        lines.push(`${cat}: ${count}`);
    });

    return lines.join("\n");
}

// Fallback to rule-based analysis if AI fails
async function fallbackAnalysis(
    nodes: Node[],
    edges: Edge[]
): Promise<AnalysisResult> {
    const { analyzeArchitecture } = await import("./analyzer");
    return analyzeArchitecture(nodes, edges);
}

// Calculate fallback score
function calculateFallbackScore(components: any[], issues: ArchitectureIssue[]): number {
    let score = 100;

    issues.forEach((issue) => {
        switch (issue.severity) {
            case "critical":
                score -= 15;
                break;
            case "warning":
                score -= 8;
                break;
            case "info":
                score -= 3;
                break;
        }
    });

    return Math.max(0, Math.min(100, score));
}

// Get improvement recommendations for specific issue
export async function getImprovementRecommendation(
    issue: ArchitectureIssue,
    architectureContext: string
): Promise<string> {
    try {
        const completion = await getOpenAIClient().chat.completions.create({
            model: "openai-gpt-oss-120b",
            messages: [
                {
                    role: "system",
                    content: "You are a software architect. Provide specific, actionable recommendations for the given architecture issue. Be concise but thorough.",
                },
                {
                    role: "user",
                    content: `Issue: ${issue.title}
Description: ${issue.description}
Current Architecture: ${architectureContext}

Provide a detailed recommendation to fix this issue.`,
                },
            ],
            max_tokens: 500,
            temperature: 0.3,
        });

        return completion.choices[0]?.message?.content || issue.recommendation;
    } catch (error) {
        console.error("Failed to get improvement recommendation:", error);
        return issue.recommendation;
    }
}

// Compare two architectures
export async function compareArchitectures(
    architecture1: { nodes: Node[]; edges: Edge[] },
    architecture2: { nodes: Node[]; edges: Edge[] }
): Promise<{
    comparison: string;
    recommendation: string;
}> {
    const parsed1 = parseDesign(architecture1.nodes, architecture1.edges);
    const parsed2 = parseDesign(architecture2.nodes, architecture2.edges);
    const desc1 = buildArchitectureDescription(parsed1.components, parsed1.connections);
    const desc2 = buildArchitectureDescription(parsed2.components, parsed2.connections);

    try {
        const completion = await getOpenAIClient().chat.completions.create({
            model: "openai-gpt-oss-120b",
            messages: [
                {
                    role: "system",
                    content: "You are a software architect comparing two architecture designs. Provide a detailed comparison and recommendation.",
                },
                {
                    role: "user",
                    content: `Compare these two architectures:

## Architecture 1:
${desc1}

## Architecture 2:
${desc2}

Provide:
1. A comparison of the two architectures
2. A recommendation on which one to use and why`,
                },
            ],
            max_tokens: 1000,
            temperature: 0.3,
        });

        const response = completion.choices[0]?.message?.content || "Unable to compare architectures.";

        return {
            comparison: response,
            recommendation: response,
        };
    } catch (error) {
        console.error("Failed to compare architectures:", error);
        return {
            comparison: "Unable to compare architectures due to an error.",
            recommendation: "Please try again later.",
        };
    }
}