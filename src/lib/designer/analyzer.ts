// Architecture Analysis Service - AI-powered design review

import { Node, Edge } from "@xyflow/react";
import { ArchitectureNodeData, ArchitectureComponentType, COMPONENT_CONFIGS } from "./types";

// Analysis result types
export interface AnalysisResult {
    overallScore: number; // 0-100
    issues: ArchitectureIssue[];
    suggestions: ArchitectureSuggestion[];
    costEstimate: CostBreakdown;
    summary: string;
}

export interface ArchitectureIssue {
    id: string;
    severity: "critical" | "warning" | "info";
    type: "spof" | "bottleneck" | "security" | "cost" | "scalability" | "reliability";
    title: string;
    description: string;
    affectedComponents: string[];
    recommendation: string;
}

export interface ArchitectureSuggestion {
    id: string;
    priority: "high" | "medium" | "low";
    title: string;
    description: string;
    impact: string;
    effort: "easy" | "medium" | "hard";
}

export interface CostBreakdown {
    compute: number;
    database: number;
    storage: number;
    network: number;
    other: number;
    total: number;
    monthlyEstimate: number;
    currency: string;
}

// Parse design from React Flow nodes and edges
export function parseDesign(nodes: Node[], edges: Edge[]) {
    const components = nodes.map((node) => ({
        id: node.id,
        type: node.data?.type as ArchitectureComponentType,
        label: node.data?.label,
        category: node.data?.category,
        connections: {
            incoming: edges.filter((e) => e.target === node.id).map((e) => e.source),
            outgoing: edges.filter((e) => e.source === node.id).map((e) => e.target),
        },
    }));

    const connections = edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
    }));

    return { components, connections };
}

// Analyze architecture design
export async function analyzeArchitecture(
    nodes: Node[],
    edges: Edge[]
): Promise<AnalysisResult> {
    const { components, connections } = parseDesign(nodes, edges);
    const issues: ArchitectureIssue[] = [];
    const suggestions: ArchitectureSuggestion[] = [];

    // 1. Check for Single Points of Failure (SPOF)
    const spofIssues = detectSPOF(components, connections);
    issues.push(...spofIssues);

    // 2. Check for bottlenecks
    const bottleneckIssues = detectBottlenecks(components, connections);
    issues.push(...bottleneckIssues);

    // 3. Check for security issues
    const securityIssues = detectSecurityIssues(components, connections);
    issues.push(...securityIssues);

    // 4. Check for scalability issues
    const scalabilityIssues = detectScalabilityIssues(components, connections);
    issues.push(...scalabilityIssues);

    // 5. Generate improvement suggestions
    const improvementSuggestions = generateSuggestions(components, connections, issues);
    suggestions.push(...improvementSuggestions);

    // 6. Calculate cost estimate
    const costEstimate = estimateCosts(components);

    // 7. Calculate overall score
    const overallScore = calculateScore(issues, components.length);

    // 8. Generate summary
    const summary = generateSummary(issues, suggestions, overallScore);

    return {
        overallScore,
        issues,
        suggestions,
        costEstimate,
        summary,
    };
}

// Detect Single Points of Failure
function detectSPOF(
    components: any[],
    connections: any[]
): ArchitectureIssue[] {
    const issues: ArchitectureIssue[] = [];

    // Check for single server without load balancer
    const servers = components.filter((c) => c.category === "server");
    const loadBalancers = components.filter((c) => c.type === "load-balancer");
    const apiGateways = components.filter((c) => c.type === "api-gateway");

    if (servers.length === 1 && loadBalancers.length === 0 && apiGateways.length === 0) {
        issues.push({
            id: `spof-server-${Date.now()}`,
            severity: "critical",
            type: "spof",
            title: "Single Server Point of Failure",
            description:
                "Your architecture has only one server. If it fails, your entire application will be unavailable.",
            affectedComponents: servers.map((s) => s.id),
            recommendation:
                "Add a load balancer and multiple servers for high availability. Consider at least 2 servers behind a load balancer.",
        });
    }

    // Check for single database
    const databases = components.filter((c) => c.category === "database");
    if (databases.length === 1) {
        const db = databases[0];
        if (db.type !== "dynamodb") {
            // DynamoDB is managed and has built-in redundancy
            issues.push({
                id: `spof-db-${Date.now()}`,
                severity: "warning",
                type: "spof",
                title: "Single Database Instance",
                description:
                    "You have a single database instance. Consider adding read replicas or a standby for failover.",
                affectedComponents: [db.id],
                recommendation:
                    "Add a read replica for your database to improve read performance and provide failover capability.",
            });
        }
    }

    // Check for single cache
    const caches = components.filter(
        (c) => c.type === "redis" || c.type === "cache-layer"
    );
    if (caches.length === 1) {
        issues.push({
            id: `spof-cache-${Date.now()}`,
            severity: "warning",
            type: "spof",
            title: "Single Cache Instance",
            description:
                "A single cache instance can become a bottleneck and point of failure.",
            affectedComponents: caches.map((c) => c.id),
            recommendation:
                "Consider using Redis Cluster or adding cache replicas for high availability.",
        });
    }

    return issues;
}

// Detect bottlenecks
function detectBottlenecks(
    components: any[],
    connections: any[]
): ArchitectureIssue[] {
    const issues: ArchitectureIssue[] = [];

    // Check for database being connected to many services
    const databases = components.filter((c) => c.category === "database");
    databases.forEach((db) => {
        const incomingConnections = connections.filter(
            (c) => c.target === db.id
        ).length;
        if (incomingConnections > 5) {
            issues.push({
                id: `bottleneck-db-${db.id}`,
                severity: "warning",
                type: "bottleneck",
                title: "Database Connection Bottleneck",
                description: `Database "${db.label}" has ${incomingConnections} services connecting to it, which may cause connection pool exhaustion.`,
                affectedComponents: [db.id],
                recommendation:
                    "Consider adding a connection pooler like PgBouncer, or implementing read replicas to distribute load.",
            });
        }
    });

    // Check for services with too many outgoing connections
    components.forEach((comp) => {
        const outgoingConnections = connections.filter(
            (c) => c.source === comp.id
        ).length;
        if (outgoingConnections > 8) {
            issues.push({
                id: `bottleneck-service-${comp.id}`,
                severity: "info",
                type: "bottleneck",
                title: "High Fan-out Service",
                description: `Service "${comp.label}" connects to ${outgoingConnections} other components, which may indicate tight coupling.`,
                affectedComponents: [comp.id],
                recommendation:
                    "Consider using an event-driven architecture or message queue to decouple services.",
            });
        }
    });

    // Check for missing cache
    const hasCache = components.some(
        (c) => c.type === "redis" || c.type === "cache-layer"
    );
    const hasDatabase = components.some((c) => c.category === "database");
    if (hasDatabase && !hasCache) {
        issues.push({
            id: `bottleneck-no-cache-${Date.now()}`,
            severity: "warning",
            type: "bottleneck",
            title: "Missing Cache Layer",
            description:
                "Your architecture has a database but no caching layer. This can lead to database overload under high traffic.",
            affectedComponents: [],
            recommendation:
                "Add Redis or a caching layer to reduce database load and improve response times.",
        });
    }

    return issues;
}

// Detect security issues
function detectSecurityIssues(
    components: any[],
    connections: any[]
): ArchitectureIssue[] {
    const issues: ArchitectureIssue[] = [];

    // Check for direct database access from clients
    const clients = components.filter((c) => c.category === "client");
    const databases = components.filter((c) => c.category === "database");

    clients.forEach((client) => {
        const clientConnections = connections.filter((c) => c.source === client.id);
        clientConnections.forEach((conn) => {
            const target = components.find((comp) => comp.id === conn.target);
            if (target && target.category === "database") {
                issues.push({
                    id: `security-direct-db-${client.id}-${target.id}`,
                    severity: "critical",
                    type: "security",
                    title: "Direct Database Access from Client",
                    description: `Client "${client.label}" has direct access to database "${target.label}". This is a major security risk.`,
                    affectedComponents: [client.id, target.id],
                    recommendation:
                        "Remove direct database access. Route all database operations through an API server or backend service.",
                });
            }
        });
    });

    // Check for missing API Gateway
    const hasAPIGateway = components.some((c) => c.type === "api-gateway");
    const hasMultipleAPIs =
        components.filter((c) => c.type === "api-server" || c.type === "microservice")
            .length > 1;

    if (hasMultipleAPIs && !hasAPIGateway) {
        issues.push({
            id: `security-no-gateway-${Date.now()}`,
            severity: "warning",
            type: "security",
            title: "Missing API Gateway",
            description:
                "You have multiple API services but no API Gateway. This makes it harder to manage authentication, rate limiting, and monitoring.",
            affectedComponents: [],
            recommendation:
                "Add an API Gateway to centralize authentication, rate limiting, and request routing.",
        });
    }

    return issues;
}

// Detect scalability issues
function detectScalabilityIssues(
    components: any[],
    connections: any[]
): ArchitectureIssue[] {
    const issues: ArchitectureIssue[] = [];

    // Check for monolithic design
    const servers = components.filter((c) => c.category === "server");
    const hasMessageQueue = components.some((c) => c.type === "message-queue");

    if (servers.length > 0 && !hasMessageQueue) {
        const hasMicroservices = servers.some((s) => s.type === "microservice");
        if (!hasMicroservices) {
            issues.push({
                id: `scalability-monolith-${Date.now()}`,
                severity: "info",
                type: "scalability",
                title: "Consider Microservices Architecture",
                description:
                    "Your current architecture appears to be monolithic. For better scalability, consider breaking it into microservices.",
                affectedComponents: servers.map((s) => s.id),
                recommendation:
                    "Identify independent business capabilities and extract them into separate microservices. Use a message queue for async communication.",
            });
        }
    }

    // Check for missing CDN for web clients
    const hasWebClient = components.some((c) => c.type === "web-client");
    const hasCDN = components.some((c) => c.type === "cdn");

    if (hasWebClient && !hasCDN) {
        issues.push({
            id: `scalability-no-cdn-${Date.now()}`,
            severity: "info",
            type: "scalability",
            title: "Missing CDN for Static Content",
            description:
                "Adding a CDN can significantly improve load times and reduce server load for static content.",
            affectedComponents: [],
            recommendation:
                "Add a CDN like CloudFront or Cloudflare to cache and deliver static content closer to users.",
        });
    }

    return issues;
}

// Generate improvement suggestions
function generateSuggestions(
    components: any[],
    connections: any[],
    issues: ArchitectureIssue[]
): ArchitectureSuggestion[] {
    const suggestions: ArchitectureSuggestion[] = [];

    // Add monitoring suggestion
    const hasMonitoring = components.some(
        (c) => c.label?.toLowerCase().includes("monitor")
    );
    if (!hasMonitoring) {
        suggestions.push({
            id: `suggest-monitoring-${Date.now()}`,
            priority: "high",
            title: "Add Monitoring & Observability",
            description:
                "Implement comprehensive monitoring with tools like Prometheus, Grafana, or Datadog to track system health.",
            impact: "Improved incident response and system reliability",
            effort: "medium",
        });
    }

    // Add logging suggestion
    suggestions.push({
        id: `suggest-logging-${Date.now()}`,
        priority: "medium",
        title: "Implement Centralized Logging",
        description:
            "Use tools like ELK Stack or Splunk to aggregate logs from all services for easier debugging.",
        impact: "Faster debugging and audit trail",
        effort: "medium",
    });

    // Add CI/CD suggestion
    suggestions.push({
        id: `suggest-cicd-${Date.now()}`,
        priority: "medium",
        title: "Set Up CI/CD Pipeline",
        description:
            "Implement continuous integration and deployment with GitHub Actions, GitLab CI, or Jenkins.",
        impact: "Faster, safer deployments",
        effort: "medium",
    });

    // Add backup suggestion for databases
    const hasDatabase = components.some((c) => c.category === "database");
    if (hasDatabase) {
        suggestions.push({
            id: `suggest-backup-${Date.now()}`,
            priority: "high",
            title: "Configure Database Backups",
            description:
                "Set up automated backups with point-in-time recovery for all databases.",
            impact: "Data protection and disaster recovery",
            effort: "easy",
        });
    }

    return suggestions;
}

// Estimate costs
export function estimateCosts(components: any[]): CostBreakdown {
    let compute = 0;
    let database = 0;
    let storage = 0;
    let network = 0;
    let other = 0;

    components.forEach((comp) => {
        switch (comp.type) {
            case "web-server":
            case "api-server":
            case "app-server":
                compute += 50; // ~$50/month per server
                break;
            case "microservice":
                compute += 30;
                break;
            case "lambda":
                compute += 10; // Pay per use, estimated
                break;
            case "container":
                compute += 40;
                break;
            case "kubernetes":
                compute += 100;
                break;
            case "postgres":
            case "mysql":
                database += 100; // ~$100/month for managed DB
                break;
            case "mongodb":
                database += 120;
                break;
            case "redis":
                database += 30;
                break;
            case "cassandra":
                database += 200;
                break;
            case "dynamodb":
                database += 50; // Pay per use
                break;
            case "cdn":
                network += 50;
                break;
            case "load-balancer":
                network += 20;
                break;
            case "api-gateway":
                network += 30;
                break;
            case "message-queue":
                other += 40;
                break;
            case "cache-layer":
                other += 30;
                break;
        }
    });

    const total = compute + database + storage + network + other;
    const monthlyEstimate = total;

    return {
        compute,
        database,
        storage,
        network,
        other,
        total,
        monthlyEstimate,
        currency: "USD",
    };
}

// Calculate overall score
function calculateScore(issues: ArchitectureIssue[], componentCount: number): number {
    if (componentCount === 0) return 0;

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

    // Bonus for good practices
    if (componentCount >= 5) score += 5; // Reasonable complexity
    if (componentCount >= 8) score -= 5; // But not too complex

    return Math.max(0, Math.min(100, score));
}

// Generate summary
function generateSummary(
    issues: ArchitectureIssue[],
    suggestions: ArchitectureSuggestion[],
    score: number
): string {
    const criticalCount = issues.filter((i) => i.severity === "critical").length;
    const warningCount = issues.filter((i) => i.severity === "warning").length;

    let summary = `Your architecture scores ${score}/100. `;

    if (criticalCount > 0) {
        summary += `There ${criticalCount === 1 ? "is" : "are"} ${criticalCount} critical issue${criticalCount > 1 ? "s" : ""} that need immediate attention. `;
    }

    if (warningCount > 0) {
        summary += `${warningCount} warning${warningCount > 1 ? "s" : ""} should be addressed for better reliability. `;
    }

    if (score >= 80) {
        summary += "Overall, this is a well-designed architecture with good practices.";
    } else if (score >= 60) {
        summary += "The architecture is decent but has room for improvement.";
    } else {
        summary += "The architecture needs significant improvements before production deployment.";
    }

    return summary;
}