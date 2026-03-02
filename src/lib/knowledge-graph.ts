/**
 * Knowledge Graph Library
 * Visualizes relationships between learning topics and tracks concept mastery
 */

export interface KnowledgeNode {
    id: string;
    label: string;
    category: 'concept' | 'technology' | 'skill' | 'module';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    mastery: number; // 0-100
    timeSpent: number; // minutes
    connections: string[]; // IDs of connected nodes
}

export interface KnowledgeEdge {
    source: string;
    target: string;
    type: 'prerequisite' | 'related' | ' builds-on';
    strength: number; // 0-1
}

export interface KnowledgeGraph {
    nodes: KnowledgeNode[];
    edges: KnowledgeEdge[];
}

export interface LearningPath {
    id: string;
    name: string;
    description: string;
    nodes: KnowledgeNode[];
    edges: KnowledgeEdge[];
    estimatedHours: number;
    modules: string[];
}

// Pre-defined knowledge graphs for different learning paths
export const KNOWLEDGE_GRAPH_TEMPLATES: Record<string, LearningPath> = {
    'system-design': {
        id: 'system-design',
        name: 'System Design Fundamentals',
        description: 'Learn how to design scalable systems',
        estimatedHours: 40,
        modules: ['basics', 'databases', 'caching', 'scalability', 'microservices'],
        nodes: [
            // Level 1: Basics
            { id: 'http', label: 'HTTP & REST', category: 'concept', difficulty: 'beginner', mastery: 0, timeSpent: 0, connections: ['api-design'] },
            { id: 'dns', label: 'DNS', category: 'concept', difficulty: 'beginner', mastery: 0, timeSpent: 0, connections: ['cdn', 'load-balancing'] },
            { id: 'cdn', label: 'CDN', category: 'technology', difficulty: 'beginner', mastery: 0, timeSpent: 0, connections: ['caching'] },

            // Level 2: APIs & Databases
            { id: 'api-design', label: 'API Design', category: 'skill', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: ['databases', 'authentication'] },
            { id: 'databases', label: 'Databases', category: 'technology', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: ['sql', 'nosql', 'indexing', 'replication'] },
            { id: 'sql', label: 'SQL Databases', category: 'technology', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: ['indexing', 'transactions'] },
            { id: 'nosql', label: 'NoSQL Databases', category: 'technology', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: ['sharding', 'consistency'] },

            // Level 3: Performance
            { id: 'caching', label: 'Caching', category: 'concept', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: ['redis', 'memcached'] },
            { id: 'indexing', label: 'Database Indexing', category: 'skill', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: ['query-optimization'] },
            { id: 'load-balancing', label: 'Load Balancing', category: 'concept', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: ['horizontal-scaling'] },

            // Level 4: Advanced
            { id: 'scalability', label: 'Scalability', category: 'concept', difficulty: 'advanced', mastery: 0, timeSpent: 0, connections: ['sharding', 'horizontal-scaling', 'microservices'] },
            { id: 'sharding', label: 'Database Sharding', category: 'skill', difficulty: 'advanced', mastery: 0, timeSpent: 0, connections: [] },
            { id: 'microservices', label: 'Microservices', category: 'concept', difficulty: 'advanced', mastery: 0, timeSpent: 0, connections: ['message-queues', 'service-mesh'] },
            { id: 'message-queues', label: 'Message Queues', category: 'technology', difficulty: 'advanced', mastery: 0, timeSpent: 0, connections: ['event-driven'] },

            // Supporting concepts
            { id: 'authentication', label: 'Authentication', category: 'concept', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: [] },
            { id: 'replication', label: 'Replication', category: 'concept', difficulty: 'advanced', mastery: 0, timeSpent: 0, connections: [] },
            { id: 'transactions', label: 'Transactions', category: 'concept', difficulty: 'advanced', mastery: 0, timeSpent: 0, connections: [] },
            { id: 'consistency', label: 'Consistency Models', category: 'concept', difficulty: 'advanced', mastery: 0, timeSpent: 0, connections: [] },
            { id: 'redis', label: 'Redis', category: 'technology', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: [] },
            { id: 'memcached', label: 'Memcached', category: 'technology', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: [] },
            { id: 'horizontal-scaling', label: 'Horizontal Scaling', category: 'concept', difficulty: 'advanced', mastery: 0, timeSpent: 0, connections: [] },
            { id: 'service-mesh', label: 'Service Mesh', category: 'technology', difficulty: 'advanced', mastery: 0, timeSpent: 0, connections: [] },
            { id: 'event-driven', label: 'Event-Driven Architecture', category: 'concept', difficulty: 'advanced', mastery: 0, timeSpent: 0, connections: [] },
            { id: 'query-optimization', label: 'Query Optimization', category: 'skill', difficulty: 'advanced', mastery: 0, timeSpent: 0, connections: [] },
        ],
        edges: [
            { source: 'http', target: 'api-design', type: 'prerequisite', strength: 0.9 },
            { source: 'dns', target: 'cdn', type: 'related', strength: 0.6 },
            { source: 'dns', target: 'load-balancing', type: 'related', strength: 0.5 },
            { source: 'cdn', target: 'caching', type: ' builds-on', strength: 0.8 },
            { source: 'api-design', target: 'databases', type: 'prerequisite', strength: 0.7 },
            { source: 'api-design', target: 'authentication', type: 'related', strength: 0.8 },
            { source: 'databases', target: 'sql', type: ' builds-on', strength: 0.9 },
            { source: 'databases', target: 'nosql', type: ' builds-on', strength: 0.9 },
            { source: 'sql', target: 'indexing', type: ' builds-on', strength: 0.8 },
            { source: 'sql', target: 'transactions', type: ' builds-on', strength: 0.9 },
            { source: 'nosql', target: 'sharding', type: ' builds-on', strength: 0.8 },
            { source: 'nosql', target: 'consistency', type: ' builds-on', strength: 0.9 },
            { source: 'caching', target: 'redis', type: ' builds-on', strength: 0.9 },
            { source: 'caching', target: 'memcached', type: 'related', strength: 0.7 },
            { source: 'indexing', target: 'query-optimization', type: ' builds-on', strength: 0.8 },
            { source: 'load-balancing', target: 'horizontal-scaling', type: ' builds-on', strength: 0.9 },
            { source: 'caching', target: 'scalability', type: 'related', strength: 0.7 },
            { source: 'databases', target: 'replication', type: ' builds-on', strength: 0.8 },
            { source: 'scalability', target: 'sharding', type: ' builds-on', strength: 0.9 },
            { source: 'scalability', target: 'horizontal-scaling', type: ' builds-on', strength: 0.9 },
            { source: 'scalability', target: 'microservices', type: 'related', strength: 0.6 },
            { source: 'microservices', target: 'message-queues', type: ' builds-on', strength: 0.8 },
            { source: 'message-queues', target: 'event-driven', type: ' builds-on', strength: 0.9 },
            { source: 'microservices', target: 'service-mesh', type: 'related', strength: 0.7 },
        ],
    },

    'devops': {
        id: 'devops',
        name: 'DevOps & Cloud Infrastructure',
        description: 'Master CI/CD, containers, and cloud platforms',
        estimatedHours: 60,
        modules: ['git', 'docker', 'kubernetes', 'ci-cd', 'cloud-aws'],
        nodes: [
            // Git & Version Control
            { id: 'git-basics', label: 'Git Basics', category: 'technology', difficulty: 'beginner', mastery: 0, timeSpent: 0, connections: ['git-branching', 'git-workflows'] },
            { id: 'git-branching', label: 'Git Branching', category: 'skill', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: ['git-workflows'] },
            { id: 'git-workflows', label: 'Git Workflows', category: 'skill', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: ['ci-cd'] },

            // Containers
            { id: 'docker', label: 'Docker', category: 'technology', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: ['dockerfiles', 'docker-compose'] },
            { id: 'dockerfiles', label: 'Dockerfile Best Practices', category: 'skill', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: ['docker-compose', 'container-registry'] },
            { id: 'docker-compose', label: 'Docker Compose', category: 'technology', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: ['container-orchestration'] },
            { id: 'container-registry', label: 'Container Registries', category: 'technology', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: ['ci-cd'] },

            // Orchestration
            { id: 'kubernetes', label: 'Kubernetes', category: 'technology', difficulty: 'advanced', mastery: 0, timeSpent: 0, connections: ['k8s-deployments', 'k8s-services', 'helm'] },
            { id: 'k8s-deployments', label: 'K8s Deployments', category: 'skill', difficulty: 'advanced', mastery: 0, timeSpent: 0, connections: ['k8s-services', 'k8s-config'] },
            { id: 'k8s-services', label: 'K8s Services & Networking', category: 'skill', difficulty: 'advanced', mastery: 0, timeSpent: 0, connections: ['k8s-ingress'] },
            { id: 'k8s-config', label: 'ConfigMaps & Secrets', category: 'skill', difficulty: 'advanced', mastery: 0, timeSpent: 0, connections: [] },
            { id: 'k8s-ingress', label: 'Ingress Controllers', category: 'skill', difficulty: 'advanced', mastery: 0, timeSpent: 0, connections: [] },
            { id: 'helm', label: 'Helm Charts', category: 'technology', difficulty: 'advanced', mastery: 0, timeSpent: 0, connections: [] },

            // CI/CD
            { id: 'ci-cd', label: 'CI/CD Pipelines', category: 'concept', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: ['github-actions', 'jenkins'] },
            { id: 'github-actions', label: 'GitHub Actions', category: 'technology', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: [] },
            { id: 'jenkins', label: 'Jenkins', category: 'technology', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: [] },

            // Cloud
            { id: 'cloud-basics', label: 'Cloud Fundamentals', category: 'concept', difficulty: 'beginner', mastery: 0, timeSpent: 0, connections: ['cloud-aws', 'cloud-networking'] },
            { id: 'cloud-aws', label: 'AWS Services', category: 'technology', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: ['ec2', 's3', 'rds', 'lambda'] },
            { id: 'cloud-networking', label: 'Cloud Networking', category: 'concept', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: ['vpc', 'load-balancing'] },
            { id: 'ec2', label: 'EC2 & Compute', category: 'technology', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: [] },
            { id: 's3', label: 'S3 & Storage', category: 'technology', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: [] },
            { id: 'rds', label: 'RDS & Databases', category: 'technology', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: [] },
            { id: 'lambda', label: 'Lambda & Serverless', category: 'technology', difficulty: 'advanced', mastery: 0, timeSpent: 0, connections: [] },
            { id: 'vpc', label: 'VPC & Networking', category: 'concept', difficulty: 'advanced', mastery: 0, timeSpent: 0, connections: [] },
            { id: 'load-balancing', label: 'Load Balancing', category: 'concept', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: [] },
            { id: 'container-orchestration', label: 'Container Orchestration', category: 'concept', difficulty: 'advanced', mastery: 0, timeSpent: 0, connections: [] },
        ],
        edges: [
            { source: 'git-basics', target: 'git-branching', type: 'prerequisite', strength: 0.9 },
            { source: 'git-branching', target: 'git-workflows', type: ' builds-on', strength: 0.8 },
            { source: 'git-workflows', target: 'ci-cd', type: 'prerequisite', strength: 0.9 },
            { source: 'docker', target: 'dockerfiles', type: ' builds-on', strength: 0.9 },
            { source: 'docker', target: 'docker-compose', type: ' builds-on', strength: 0.8 },
            { source: 'dockerfiles', target: 'container-registry', type: 'related', strength: 0.7 },
            { source: 'docker-compose', target: 'container-orchestration', type: ' builds-on', strength: 0.9 },
            { source: 'container-registry', target: 'ci-cd', type: 'related', strength: 0.8 },
            { source: 'kubernetes', target: 'k8s-deployments', type: ' builds-on', strength: 0.9 },
            { source: 'kubernetes', target: 'k8s-services', type: ' builds-on', strength: 0.9 },
            { source: 'kubernetes', target: 'helm', type: 'related', strength: 0.7 },
            { source: 'k8s-deployments', target: 'k8s-config', type: 'related', strength: 0.8 },
            { source: 'k8s-services', target: 'k8s-ingress', type: ' builds-on', strength: 0.8 },
            { source: 'ci-cd', target: 'github-actions', type: 'related', strength: 0.8 },
            { source: 'ci-cd', target: 'jenkins', type: 'related', strength: 0.7 },
            { source: 'cloud-basics', target: 'cloud-aws', type: ' builds-on', strength: 0.9 },
            { source: 'cloud-basics', target: 'cloud-networking', type: ' builds-on', strength: 0.9 },
            { source: 'cloud-aws', target: 'ec2', type: 'related', strength: 0.9 },
            { source: 'cloud-aws', target: 's3', type: 'related', strength: 0.9 },
            { source: 'cloud-aws', target: 'rds', type: 'related', strength: 0.8 },
            { source: 'cloud-aws', target: 'lambda', type: 'related', strength: 0.7 },
            { source: 'cloud-networking', target: 'vpc', type: ' builds-on', strength: 0.9 },
            { source: 'cloud-networking', target: 'load-balancing', type: 'related', strength: 0.8 },
            { source: 'docker', target: 'kubernetes', type: 'prerequisite', strength: 0.9 },
            { source: 'ci-cd', target: 'kubernetes', type: 'related', strength: 0.8 },
        ],
    },

    'backend': {
        id: 'backend',
        name: 'Backend Development',
        description: 'Master server-side programming and APIs',
        estimatedHours: 50,
        modules: ['programming-basics', 'apis', 'databases', 'authentication', 'performance'],
        nodes: [
            // Programming
            { id: 'programming-basics', label: 'Programming Basics', category: 'concept', difficulty: 'beginner', mastery: 0, timeSpent: 0, connections: ['data-structures', 'algorithms'] },
            { id: 'data-structures', label: 'Data Structures', category: 'concept', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: ['algorithms', 'complexity'] },
            { id: 'algorithms', label: 'Algorithms', category: 'skill', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: ['complexity'] },
            { id: 'complexity', label: 'Time & Space Complexity', category: 'concept', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: [] },

            // APIs
            { id: 'rest-apis', label: 'REST APIs', category: 'skill', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: ['graphql', 'error-handling'] },
            { id: 'graphql', label: 'GraphQL', category: 'technology', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: [] },
            { id: 'error-handling', label: 'Error Handling', category: 'skill', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: ['logging'] },
            { id: 'logging', label: 'Logging & Monitoring', category: 'concept', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: [] },

            // Databases
            { id: 'sql-basics', label: 'SQL Basics', category: 'technology', difficulty: 'beginner', mastery: 0, timeSpent: 0, connections: ['orm', 'query-building'] },
            { id: 'orm', label: 'ORMs', category: 'technology', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: ['query-building'] },
            { id: 'query-building', label: 'Query Building', category: 'skill', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: ['migrations'] },
            { id: 'migrations', label: 'Database Migrations', category: 'skill', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: [] },

            // Auth
            { id: 'authentication', label: 'Authentication', category: 'concept', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: ['jwt', 'oauth'] },
            { id: 'jwt', label: 'JWT Tokens', category: 'technology', difficulty: 'intermediate', mastery: 0, timeSpent: 0, connections: [] },
            { id: 'oauth', label: 'OAuth 2.0', category: 'concept', difficulty: 'advanced', mastery: 0, timeSpent: 0, connections: [] },

            // Performance
            { id: 'caching-strategies', label: 'Caching Strategies', category: 'concept', difficulty: 'advanced', mastery: 0, timeSpent: 0, connections: ['rate-limiting'] },
            { id: 'rate-limiting', label: 'Rate Limiting', category: 'skill', difficulty: 'advanced', mastery: 0, timeSpent: 0, connections: [] },
            { id: 'async-processing', label: 'Async Processing', category: 'concept', difficulty: 'advanced', mastery: 0, timeSpent: 0, connections: ['message-queues'] },
            { id: 'message-queues', label: 'Message Queues', category: 'technology', difficulty: 'advanced', mastery: 0, timeSpent: 0, connections: [] },
        ],
        edges: [
            { source: 'programming-basics', target: 'data-structures', type: 'prerequisite', strength: 0.9 },
            { source: 'programming-basics', target: 'algorithms', type: 'prerequisite', strength: 0.9 },
            { source: 'data-structures', target: 'algorithms', type: ' builds-on', strength: 0.9 },
            { source: 'data-structures', target: 'complexity', type: ' builds-on', strength: 0.9 },
            { source: 'algorithms', target: 'complexity', type: ' builds-on', strength: 0.9 },
            { source: 'rest-apis', target: 'graphql', type: 'related', strength: 0.6 },
            { source: 'rest-apis', target: 'error-handling', type: 'related', strength: 0.8 },
            { source: 'error-handling', target: 'logging', type: 'related', strength: 0.8 },
            { source: 'sql-basics', target: 'orm', type: ' builds-on', strength: 0.8 },
            { source: 'sql-basics', target: 'query-building', type: ' builds-on', strength: 0.9 },
            { source: 'orm', target: 'query-building', type: 'related', strength: 0.8 },
            { source: 'query-building', target: 'migrations', type: 'related', strength: 0.7 },
            { source: 'authentication', target: 'jwt', type: ' builds-on', strength: 0.9 },
            { source: 'authentication', target: 'oauth', type: ' builds-on', strength: 0.9 },
            { source: 'caching-strategies', target: 'rate-limiting', type: 'related', strength: 0.7 },
            { source: 'async-processing', target: 'message-queues', type: ' builds-on', strength: 0.9 },
        ],
    },
};

/**
 * Calculate mastery score for a node based on user activity
 */
export function calculateMastery(
    nodeId: string,
    quizScores: Record<string, number>,
    timeSpent: Record<string, number>,
    completedLessons: string[]
): number {
    const quizScore = quizScores[nodeId] || 0;
    const time = timeSpent[nodeId] || 0;
    const completed = completedLessons.includes(nodeId) ? 100 : 0;

    // Weighted average
    return Math.min(100, Math.round(
        (quizScore * 0.4) +
        (Math.min(time / 60, 100) * 0.3) +
        (completed * 0.3)
    ));
}

/**
 * Get recommended next nodes based on current mastery
 */
export function getRecommendedNextNodes(
    graph: KnowledgeGraph,
    currentMastery: Record<string, number>
): KnowledgeNode[] {
    const recommended: Array<{ node: KnowledgeNode; score: number }> = [];

    for (const node of graph.nodes) {
        // Skip nodes that are already mastered
        if ((currentMastery[node.id] || 0) >= 80) continue;

        // Check if prerequisites are met
        const prereqs = graph.edges
            .filter(e => e.target === node.id && e.type === 'prerequisite')
            .map(e => e.source);

        const prereqMastery = prereqs.every(id => (currentMastery[id] || 0) >= 50);
        if (!prereqs.length || prereqMastery) {
            // Score based on mastery gap and time investment
            const masteryGap = 100 - (currentMastery[node.id] || 0);
            const priority = node.difficulty === 'intermediate' ? 1.2 : 1;
            recommended.push({
                node,
                score: masteryGap * priority,
            });
        }
    }

    return recommended
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(r => r.node);
}

/**
 * Find learning gaps (nodes user is struggling with)
 */
export function findLearningGaps(
    graph: KnowledgeGraph,
    currentMastery: Record<string, number>
): { node: KnowledgeNode; issues: string[] }[] {
    const gaps: Array<{ node: KnowledgeNode; issues: string[] }> = [];

    for (const node of graph.nodes) {
        const mastery = currentMastery[node.id] || 0;
        if (mastery < 50) {
            const issues: string[] = [];

            // Check prerequisites
            const prereqs = graph.edges
                .filter(e => e.target === node.id && e.type === 'prerequisite')
                .map(e => e.source);

            const weakPrereqs = prereqs.filter(id => (currentMastery[id] || 0) < 50);
            if (weakPrereqs.length > 0) {
                issues.push(`Weak prerequisites: ${weakPrereqs.join(', ')}`);
            }

            if (issues.length > 0) {
                gaps.push({ node, issues });
            }
        }
    }

    return gaps;
}

/**
 * Get learning statistics
 */
export function getLearningStats(
    graph: KnowledgeGraph,
    currentMastery: Record<string, number>
): {
    overallProgress: number;
    byCategory: Record<string, { mastered: number; learning: number; notStarted: number }>;
    byDifficulty: Record<string, { mastered: number; learning: number; notStarted: number }>;
    totalNodes: number;
    masteredCount: number;
    learningCount: number;
} {
    const byCategory: Record<string, { mastered: number; learning: number; notStarted: number }> = {};
    const byDifficulty: Record<string, { mastered: number; learning: number; notStarted: number }> = {};

    let masteredCount = 0;
    let learningCount = 0;

    for (const node of graph.nodes) {
        const mastery = currentMastery[node.id] || 0;

        // Initialize category
        if (!byCategory[node.category]) {
            byCategory[node.category] = { mastered: 0, learning: 0, notStarted: 0 };
        }
        // Initialize difficulty
        if (!byDifficulty[node.difficulty]) {
            byDifficulty[node.difficulty] = { mastered: 0, learning: 0, notStarted: 0 };
        }

        if (mastery >= 80) {
            byCategory[node.category].mastered++;
            byDifficulty[node.difficulty].mastered++;
            masteredCount++;
        } else if (mastery > 0) {
            byCategory[node.category].learning++;
            byDifficulty[node.difficulty].learning++;
            learningCount++;
        } else {
            byCategory[node.category].notStarted++;
            byDifficulty[node.difficulty].notStarted++;
        }
    }

    const totalNodes = graph.nodes.length;
    const overallProgress = totalNodes > 0
        ? Math.round((masteredCount / totalNodes) * 100)
        : 0;

    return {
        overallProgress,
        byCategory,
        byDifficulty,
        totalNodes,
        masteredCount,
        learningCount,
    };
}
