/**
 * Knowledge Graph Hook
 * Manages learning path progress and knowledge visualization
 */

import { useState, useCallback, useMemo } from 'react';
import {
    KnowledgeNode,
    KnowledgeEdge,
    KnowledgeGraph,
    LearningPath,
    KNOWLEDGE_GRAPH_TEMPLATES,
    getRecommendedNextNodes,
    findLearningGaps,
    getLearningStats,
    calculateMastery,
} from '@/lib/knowledge-graph';

interface UseKnowledgeGraphOptions {
    pathId?: string;
    initialMastery?: Record<string, number>;
}

export function useKnowledgeGraph(options: UseKnowledgeGraphOptions = {}) {
    const { pathId = 'system-design', initialMastery = {} } = options;

    const [currentPathId, setCurrentPathId] = useState(pathId);
    const [mastery, setMastery] = useState<Record<string, number>>(initialMastery);
    const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);

    // Get the current learning path
    const learningPath: LearningPath | undefined = useMemo(() => {
        return KNOWLEDGE_GRAPH_TEMPLATES[currentPathId];
    }, [currentPathId]);

    // Convert to KnowledgeGraph format
    const graph: KnowledgeGraph | null = useMemo(() => {
        if (!learningPath) return null;
        return {
            nodes: learningPath.nodes,
            edges: learningPath.edges,
        };
    }, [learningPath]);

    // Calculate current mastery for all nodes
    const currentMastery = useMemo(() => {
        if (!graph) return {};
        const result: Record<string, number> = {};
        for (const node of graph.nodes) {
            result[node.id] = mastery[node.id] ?? node.mastery;
        }
        return result;
    }, [graph, mastery]);

    // Get learning statistics
    const stats = useMemo(() => {
        if (!graph) return null;
        return getLearningStats(graph, currentMastery);
    }, [graph, currentMastery]);

    // Get recommended next nodes
    const recommendations = useMemo(() => {
        if (!graph) return [];
        return getRecommendedNextNodes(graph, currentMastery);
    }, [graph, currentMastery]);

    // Find learning gaps
    const learningGaps = useMemo(() => {
        if (!graph) return [];
        return findLearningGaps(graph, currentMastery);
    }, [graph, currentMastery]);

    // Update mastery for a node
    const updateMastery = useCallback((nodeId: string, newMastery: number) => {
        setMastery(prev => ({
            ...prev,
            [nodeId]: Math.max(0, Math.min(100, newMastery)),
        }));
    }, []);

    // Bulk update mastery (e.g., from quiz results)
    const bulkUpdateMastery = useCallback((updates: Record<string, number>) => {
        setMastery(prev => {
            const result = { ...prev };
            for (const [nodeId, value] of Object.entries(updates)) {
                result[nodeId] = Math.max(0, Math.min(100, value));
            }
            return result;
        });
    }, []);

    // Reset progress
    const resetProgress = useCallback(() => {
        setMastery({});
        setSelectedNode(null);
    }, []);

    // Change learning path
    const changePath = useCallback((newPathId: string) => {
        if (KNOWLEDGE_GRAPH_TEMPLATES[newPathId]) {
            setCurrentPathId(newPathId);
            setSelectedNode(null);
        }
    }, []);

    // Get nodes by category
    const nodesByCategory = useMemo(() => {
        if (!graph) return {};
        const result: Record<string, KnowledgeNode[]> = {};
        for (const node of graph.nodes) {
            if (!result[node.category]) {
                result[node.category] = [];
            }
            result[node.category].push(node);
        }
        return result;
    }, [graph]);

    // Get nodes by difficulty
    const nodesByDifficulty = useMemo(() => {
        if (!graph) return {};
        const result: Record<string, KnowledgeNode[]> = {};
        for (const node of graph.nodes) {
            if (!result[node.difficulty]) {
                result[node.difficulty] = [];
            }
            result[node.difficulty].push(node);
        }
        return result;
    }, [graph]);

    // Get available learning paths
    const availablePaths = useMemo(() => {
        return Object.values(KNOWLEDGE_GRAPH_TEMPLATES).map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            estimatedHours: p.estimatedHours,
            nodeCount: p.nodes.length,
        }));
    }, []);

    return {
        // Data
        learningPath,
        graph,
        currentMastery,
        stats,
        recommendations,
        learningGaps,
        selectedNode,

        // Paths
        currentPathId,
        availablePaths,

        // Groupings
        nodesByCategory,
        nodesByDifficulty,

        // Actions
        updateMastery,
        bulkUpdateMastery,
        resetProgress,
        changePath,
        setSelectedNode,
    };
}
