/**
 * Architecture Security Analyzer
 * 
 * Identifies security vulnerabilities in architecture designs:
 * - Single points of failure
 * - Missing authentication/authorization
 * - Data exposure risks
 * - Insecure communication patterns
 * - Compliance issues
 */

import { ArchitectureNode, ArchitectureEdge } from './types';

export interface SecurityIssue {
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    category: string;
    title: string;
    description: string;
    affectedNodes: string[];
    recommendation: string;
    cwe?: string; // Common Weakness Enumeration
}

export interface SecurityAnalysisResult {
    score: number; // 0-100
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    issues: SecurityIssue[];
    summary: string;
    compliance: {
        soc2: boolean;
        gdpr: boolean;
        hipaa: boolean;
        pci: boolean;
    };
}

// Security rules database
const SECURITY_RULES = {
    // Critical: No authentication
    missingAuth: {
        severity: 'critical' as const,
        category: 'Authentication',
        title: 'Missing Authentication Layer',
        description: 'Public-facing services must have authentication to prevent unauthorized access.',
        recommendation: 'Add an authentication layer (OAuth, JWT, API keys) to all public endpoints.',
        cwe: 'CWE-306',
    },

    // Critical: Single point of failure
    singlePointOfFailure: {
        severity: 'critical' as const,
        category: 'Availability',
        title: 'Single Point of Failure Detected',
        description: 'A component has no redundancy, causing potential service disruption if it fails.',
        recommendation: 'Add redundancy or load balancing for critical components.',
        cwe: 'CWE-693',
    },

    // High: Unencrypted data
    unencryptedData: {
        severity: 'high' as const,
        category: 'Data Protection',
        title: 'Unencrypted Data Storage',
        description: 'Sensitive data is stored without encryption, risking data breaches.',
        recommendation: 'Enable encryption at rest for all databases and storage services.',
        cwe: 'CWE-311',
    },

    // High: No SSL/TLS
    noEncryption: {
        severity: 'high' as const,
        category: 'Data Protection',
        title: 'Unencrypted Communication',
        description: 'Data is transmitted without encryption, vulnerable to interception.',
        recommendation: 'Enable TLS/SSL for all network communications.',
        cwe: 'CWE-295',
    },

    // High: Exposed secrets
    exposedSecrets: {
        severity: 'high' as const,
        category: 'Secrets Management',
        title: 'Hardcoded Secrets Detected',
        description: 'API keys or credentials found in configuration, risking unauthorized access.',
        recommendation: 'Use secret management services (AWS Secrets Manager, HashiCorp Vault).',
        cwe: 'CWE-798',
    },

    // Medium: Missing rate limiting
    noRateLimiting: {
        severity: 'medium' as const,
        category: 'API Security',
        title: 'No Rate Limiting',
        description: 'APIs lack rate limiting, vulnerable to DoS attacks.',
        recommendation: 'Implement rate limiting at API Gateway or load balancer.',
        cwe: 'CWE-770',
    },

    // Medium: Missing logging
    noLogging: {
        severity: 'medium' as const,
        category: 'Observability',
        title: 'Insufficient Logging',
        description: 'Security-relevant events are not logged, hindering incident response.',
        recommendation: 'Add comprehensive logging for authentication, access, and errors.',
        cwe: 'CWE-778',
    },

    // Medium: No backup
    noBackup: {
        severity: 'medium' as const,
        category: 'Availability',
        title: 'No Backup Strategy',
        description: 'Critical data lacks backup and recovery procedures.',
        recommendation: 'Implement automated backups with regular testing.',
        cwe: 'CWE-713',
    },

    // Low: Over-permissive CORS
    permissiveCors: {
        severity: 'low' as const,
        category: 'API Security',
        title: 'Permissive CORS Policy',
        description: 'CORS allows all origins, increasing attack surface.',
        recommendation: 'Restrict CORS to trusted origins only.',
        cwe: 'CWE-346',
    },

    // Low: Missing input validation
    noInputValidation: {
        severity: 'low' as const,
        category: 'Input Validation',
        title: 'Missing Input Validation',
        description: 'User input is not validated, risking injection attacks.',
        recommendation: 'Implement input validation at all entry points.',
        cwe: 'CWE-20',
    },

    // Info: Use of deprecated protocols
    deprecatedProtocol: {
        severity: 'info' as const,
        category: 'Best Practices',
        title: 'Deprecated Protocol Usage',
        description: 'Using deprecated or outdated protocols reduces security.',
        recommendation: 'Upgrade to current, supported protocol versions.',
        cwe: 'CWE-327',
    },
};

/**
 * Analyze architecture for security vulnerabilities
 */
export function analyzeSecurity(nodes: ArchitectureNode[], edges: ArchitectureEdge[]): SecurityAnalysisResult {
    const issues: SecurityIssue[] = [];

    // Build node and edge maps
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const outgoingEdges = new Map<string, ArchitectureEdge[]>();
    const incomingEdges = new Map<string, ArchitectureEdge[]>();

    edges.forEach(edge => {
        if (!outgoingEdges.has(edge.source)) outgoingEdges.set(edge.source, []);
        outgoingEdges.get(edge.source)!.push(edge);

        if (!incomingEdges.has(edge.target)) incomingEdges.set(edge.target, []);
        incomingEdges.get(edge.target)!.push(edge);
    });

    // Check 1: Public-facing services without auth
    nodes.forEach(node => {
        if (isPublicFacing(node) && !hasAuth(node, nodeMap, outgoingEdges)) {
            issues.push({
                id: `auth-${node.id}`,
                ...SECURITY_RULES.missingAuth,
                affectedNodes: [node.id],
            });
        }
    });

    // Check 2: Single points of failure
    nodes.forEach(node => {
        if (isCriticalComponent(node) && isSinglePointOfFailure(node.id, outgoingEdges, incomingEdges)) {
            issues.push({
                id: `spof-${node.id}`,
                ...SECURITY_RULES.singlePointOfFailure,
                affectedNodes: [node.id],
            });
        }
    });

    // Check 3: Unencrypted databases
    nodes.forEach(node => {
        if (isDatabase(node) && !isEncrypted(node)) {
            issues.push({
                id: `enc-${node.id}`,
                ...SECURITY_RULES.unencryptedData,
                affectedNodes: [node.id],
            });
        }
    });

    // Check 4: Unencrypted connections
    edges.forEach(edge => {
        if (!isEncryptedConnection(edge, nodeMap)) {
            const sourceNode = nodeMap.get(edge.source);
            const targetNode = nodeMap.get(edge.target);
            issues.push({
                id: `tls-${edge.id}`,
                ...SECURITY_RULES.noEncryption,
                affectedNodes: [edge.source, edge.target],
                description: `Connection between ${sourceNode?.data.label} and ${targetNode?.data.label} is unencrypted`,
            });
        }
    });

    // Check 5: No API Gateway
    const hasApiGateway = nodes.some(n => n.data.type === 'api-gateway');
    const publicServices = nodes.filter(n => isPublicFacing(n));
    if (publicServices.length > 0 && !hasApiGateway) {
        issues.push({
            id: 'gateway',
            severity: 'medium',
            category: 'API Security',
            title: 'No API Gateway',
            description: 'Public services lack an API Gateway for centralized security.',
            affectedNodes: publicServices.map(n => n.id),
            recommendation: 'Implement an API Gateway for authentication, rate limiting, and logging.',
        });
    }

    // Check 6: No load balancer for critical services
    nodes.forEach(node => {
        if (isCriticalComponent(node)) {
            const hasLoadBalancer = [...incomingEdges.get(node.id) || []].some(e => {
                const source = nodeMap.get(e.source);
                return source?.data.type === 'load-balancer';
            });
            if (!hasLoadBalancer) {
                issues.push({
                    id: `lb-${node.id}`,
                    severity: 'medium',
                    category: 'Availability',
                    title: 'No Load Balancer',
                    description: `Critical service ${node.data.label} lacks load balancing.`,
                    affectedNodes: [node.id],
                    recommendation: 'Add a load balancer in front of critical services.',
                });
            }
        }
    });

    // Check 7: No caching layer for public APIs
    const publicAPIs = nodes.filter(n => n.data.type === 'api-gateway' || n.data.category === 'server');
    const hasCache = nodes.some(n => n.data.type === 'redis' || n.data.type === 'cache-layer');
    if (publicAPIs.length > 1 && !hasCache) {
        issues.push({
            id: 'cache',
            severity: 'low',
            category: 'Performance',
            title: 'No Caching Layer',
            description: 'API responses are not cached, increasing load and costs.',
            affectedNodes: publicAPIs.map(n => n.id),
            recommendation: 'Add Redis or Memcached for response caching.',
        });
    }

    // Check 8: Database without backup
    nodes.forEach(node => {
        if (isDatabase(node) && !hasBackup(node)) {
            issues.push({
                id: `backup-${node.id}`,
                ...SECURITY_RULES.noBackup,
                affectedNodes: [node.id],
            });
        }
    });

    // Calculate score
    const score = calculateScore(issues);
    const grade = getGrade(score);

    // Check compliance
    const compliance = checkCompliance(issues);

    // Generate summary
    const summary = generateSummary(issues, grade);

    return {
        score,
        grade,
        issues,
        summary,
        compliance,
    };
}

// Helper functions

function isPublicFacing(node: ArchitectureNode): boolean {
    const types = ['web-client', 'mobile-client', 'api-gateway', 'load-balancer'];
    const categories = ['client'];
    return types.includes(node.data.type) || categories.includes(node.data.category);
}

function hasAuth(node: ArchitectureNode, nodeMap: Map<string, ArchitectureNode>, edges: Map<string, ArchitectureEdge[]>): boolean {
    const incoming = edges.get(node.id) || [];
    return incoming.some(e => {
        const source = nodeMap.get(e.source);
        return source?.data.type === 'api-gateway' || source?.data.type === 'load-balancer';
    });
}

function isCriticalComponent(node: ArchitectureNode): boolean {
    const types = ['database', 'api-gateway', 'message-queue'];
    return types.includes(node.data.type);
}

function isSinglePointOfFailure(nodeId: string, outgoing: Map<string, ArchitectureEdge[]>, incoming: Map<string, ArchitectureEdge[]>): boolean {
    const hasRedundancy = (incoming.get(nodeId)?.length || 0) > 1 || (outgoing.get(nodeId)?.length || 0) > 1;
    return !hasRedundancy;
}

function isDatabase(node: ArchitectureNode): boolean {
    const types = ['postgres', 'mysql', 'mongodb', 'cassandra', 'dynamodb'];
    return types.includes(node.data.type) || node.data.category === 'database';
}

function isEncrypted(node: ArchitectureNode): boolean {
    return node.data.config?.encryption === true ||
        node.data.config?.encryptAtRest === true;
}

function isEncryptedConnection(edge: ArchitectureEdge, nodeMap: Map<string, ArchitectureNode>): boolean {
    // Cast edge.data to access custom properties
    const edgeData = edge.data as Record<string, unknown> | undefined;
    return edgeData?.tls === true || edgeData?.encrypted === true;
}

function hasBackup(node: ArchitectureNode): boolean {
    return node.data.config?.backup === true ||
        node.data.config?.replication === true ||
        node.data.config?.multiAZ === true;
}

function calculateScore(issues: SecurityIssue[]): number {
    const weights = {
        critical: 25,
        high: 15,
        medium: 8,
        low: 3,
        info: 1,
    };

    let deduction = 0;
    issues.forEach(issue => {
        deduction += weights[issue.severity];
    });

    return Math.max(0, 100 - deduction);
}

function getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 75) return 'B';
    if (score >= 60) return 'C';
    if (score >= 40) return 'D';
    return 'F';
}

function checkCompliance(issues: SecurityIssue[]): SecurityAnalysisResult['compliance'] {
    const hasCritical = issues.some(i => i.severity === 'critical');
    const hasEncryption = !issues.some(i => i.id.startsWith('enc-') || i.id.startsWith('tls-'));

    return {
        soc2: !hasCritical && hasEncryption,
        gdpr: hasEncryption,
        hipaa: hasEncryption,
        pci: hasEncryption,
    };
}

function generateSummary(issues: SecurityIssue[], grade: string): string {
    const critical = issues.filter(i => i.severity === 'critical').length;
    const high = issues.filter(i => i.severity === 'high').length;
    const medium = issues.filter(i => i.severity === 'medium').length;
    const low = issues.filter(i => i.severity === 'low').length;

    let summary = `Security Grade: ${grade}. `;

    if (critical > 0) {
        summary += `${critical} critical issues must be addressed immediately. `;
    }
    if (high > 0) {
        summary += `${high} high-severity issues need attention. `;
    }
    if (medium > 0) {
        summary += `${medium} medium issues recommended for improvement. `;
    }
    if (low > 0) {
        summary += `${low} low-severity suggestions for best practices. `;
    }

    if (issues.length === 0) {
        summary = 'No security issues detected. Great job!';
    }

    return summary;
}
