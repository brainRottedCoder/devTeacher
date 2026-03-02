"use client";

import { MainLayout } from "@/components/MainLayout";
import { useKnowledgeGraph } from "@/hooks/useKnowledgeGraph";
import { useEffect, useState } from "react";
import {
    Network,
    ChevronRight,
    Target,
    TrendingUp,
    AlertTriangle,
    BookOpen,
    Clock,
    Zap,
    Award,
    RefreshCw,
    Settings,
    Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function KnowledgeGraphPage() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [graphData, setGraphData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedPathId, setSelectedPathId] = useState("system-design");

    const {
        learningPath,
        graph,
        currentMastery,
        stats,
        recommendations,
        learningGaps,
        selectedNode,
        availablePaths,
        nodesByCategory,
        nodesByDifficulty,
        updateMastery,
        changePath,
        setSelectedNode,
    } = useKnowledgeGraph({ pathId: selectedPathId });

        useEffect(() => {
            setIsLoading(true);
            async function fetchKnowledgeGraph() {
                if (!user) {
                    setIsLoading(false);
                    return;
                }

                try {
                    const res = await fetch(`/api/knowledge-graph?pathId=${selectedPathId}&userId=${user.id}`);
                    if (res.ok) {
                        const data = await res.json();
                        setGraphData(data);
                    }
                } catch (err) {
                    console.error("Failed to fetch knowledge graph:", err);
                } finally {
                    setIsLoading(false);
                }
            }

            fetchKnowledgeGraph();
        }, [user, selectedPathId]);

    const handlePathChange = (pathId: string) => {
        setSelectedPathId(pathId);
        changePath(pathId);
    };

    const handleNodeClick = (node: any) => {
        setSelectedNode(node);
    };

    const getMasteryColor = (mastery: number) => {
        if (mastery >= 80) return "bg-emerald-500";
        if (mastery >= 50) return "bg-amber-500";
        if (mastery > 0) return "bg-blue-500";
        return "bg-gray-600";
    };

    const getMasteryLabel = (mastery: number) => {
        if (mastery >= 80) return "Mastered";
        if (mastery >= 50) return "Learning";
        if (mastery > 0) return "Started";
        return "Not Started";
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "beginner": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
            case "intermediate": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
            case "advanced": return "bg-red-500/20 text-red-400 border-red-500/30";
            default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case "concept": return "bg-violet-500/20 text-violet-400 border-violet-500/30";
            case "technology": return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
            case "skill": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
            case "module": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
            default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
        }
    };

    return (
        <MainLayout>
            <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl">
                                <Network className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-1">Knowledge Graph</h1>
                                <p className="text-gray-400">Visualize your learning journey and track concept mastery</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                                <RefreshCw className="w-5 h-5" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                                <Settings className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Path Selector */}
                    <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                        {availablePaths.map((path) => (
                            <button
                                key={path.id}
                                onClick={() => handlePathChange(path.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                                    selectedPathId === path.id
                                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                                        : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                                }`}
                            >
                                {path.name}
                                <span className="text-xs opacity-70">({path.nodeCount})</span>
                            </button>
                        ))}
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Main Graph Area */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Stats Overview */}
                                {stats && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="rounded-xl bg-gray-900/50 border border-gray-800 p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Target className="w-4 h-4 text-violet-400" />
                                                <span className="text-gray-400 text-sm">Progress</span>
                                            </div>
                                            <p className="text-2xl font-bold text-white">{stats.overallProgress}%</p>
                                        </div>
                                        <div className="rounded-xl bg-gray-900/50 border border-gray-800 p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Award className="w-4 h-4 text-emerald-400" />
                                                <span className="text-gray-400 text-sm">Mastered</span>
                                            </div>
                                            <p className="text-2xl font-bold text-white">{stats.masteredCount}</p>
                                        </div>
                                        <div className="rounded-xl bg-gray-900/50 border border-gray-800 p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <TrendingUp className="w-4 h-4 text-amber-400" />
                                                <span className="text-gray-400 text-sm">Learning</span>
                                            </div>
                                            <p className="text-2xl font-bold text-white">{stats.learningCount}</p>
                                        </div>
                                        <div className="rounded-xl bg-gray-900/50 border border-gray-800 p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <BookOpen className="w-4 h-4 text-cyan-400" />
                                                <span className="text-gray-400 text-sm">Total</span>
                                            </div>
                                            <p className="text-2xl font-bold text-white">{stats.totalNodes}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Knowledge Graph Visualization */}
                                <div className="rounded-xl bg-gray-900/50 border border-gray-800 p-6">
                                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <Network className="w-5 h-5 text-violet-400" />
                                        Concept Map
                                    </h2>

                                    {/* Node Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {graph?.nodes.map((node: any) => (
                                            <button
                                                key={node.id}
                                                onClick={() => handleNodeClick(node)}
                                                className={`relative p-3 rounded-lg border transition-all text-left ${
                                                    selectedNode?.id === node.id
                                                        ? "border-violet-500 bg-violet-500/10"
                                                        : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                                                }`}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <span className={`text-xs px-1.5 py-0.5 rounded ${getCategoryColor(node.category)}`}>
                                                        {node.category}
                                                    </span>
                                                    <span className={`text-xs px-1.5 py-0.5 rounded ${getDifficultyColor(node.difficulty)}`}>
                                                        {node.difficulty}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium text-white mb-2 line-clamp-2">{node.label}</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${getMasteryColor(currentMastery[node.id] || 0)} transition-all`}
                                                            style={{ width: `${currentMastery[node.id] || 0}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-gray-400">{currentMastery[node.id] || 0}%</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Recommendations */}
                                {recommendations && recommendations.length > 0 && (
                                    <div className="rounded-xl bg-gray-900/50 border border-gray-800 p-6">
                                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                            <Zap className="w-5 h-5 text-amber-400" />
                                            Recommended Next Steps
                                        </h2>
                                        <div className="space-y-3">
                                            {recommendations.slice(0, 5).map((node: any) => (
                                                <div
                                                    key={node.id}
                                                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-violet-500/30 transition-colors cursor-pointer"
                                                >
                                                    <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                                                        <ChevronRight className="w-5 h-5 text-violet-400" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-white font-medium">{node.label}</p>
                                                        <p className="text-gray-400 text-sm capitalize">{node.category} • {node.difficulty}</p>
                                                    </div>
                                                    <span className={`text-xs px-2 py-1 rounded ${getDifficultyColor(node.difficulty)}`}>
                                                        Start
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-6">
                                {/* Selected Node Details */}
                                {selectedNode ? (
                                    <div className="rounded-xl bg-gray-900/50 border border-gray-800 p-6">
                                        <h3 className="text-lg font-bold text-white mb-4">Node Details</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-white font-medium text-lg">{selectedNode.label}</p>
                                                <div className="flex gap-2 mt-2">
                                                    <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(selectedNode.category)}`}>
                                                        {selectedNode.category}
                                                    </span>
                                                    <span className={`text-xs px-2 py-1 rounded ${getDifficultyColor(selectedNode.difficulty)}`}>
                                                        {selectedNode.difficulty}
                                                    </span>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-400">Mastery</span>
                                                    <span className={`font-medium ${getMasteryColor(selectedNode.mastery).replace("bg-", "text-").replace("-500", "-400")}`}>
                                                        {getMasteryLabel(selectedNode.mastery)}
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${getMasteryColor(selectedNode.mastery)} transition-all`}
                                                        style={{ width: `${selectedNode.mastery}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {selectedNode.connections && selectedNode.connections.length > 0 && (
                                                <div>
                                                    <p className="text-gray-400 text-sm mb-2">Connected Topics</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {selectedNode.connections.map((connId: string) => {
                                                            const connNode = graph?.nodes.find((n: any) => n.id === connId);
                                                            return connNode ? (
                                                                <button
                                                                    key={connId}
                                                                    onClick={() => setSelectedNode(connNode)}
                                                                    className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                                                                >
                                                                    {connNode.label}
                                                                </button>
                                                            ) : null;
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            <button className="w-full px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors">
                                                Start Learning
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-xl bg-gray-900/50 border border-gray-800 p-6 text-center">
                                        <Network className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                        <p className="text-gray-400">Select a node to view details</p>
                                    </div>
                                )}

                                {/* Learning Gaps */}
                                {learningGaps && learningGaps.length > 0 && (
                                    <div className="rounded-xl bg-gray-900/50 border border-amber-500/20 p-6">
                                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                                            Learning Gaps
                                        </h3>
                                        <div className="space-y-3">
                                            {learningGaps.slice(0, 3).map((gap: any) => (
                                                <div key={gap.node.id} className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                                    <p className="text-white font-medium text-sm mb-1">{gap.node.label}</p>
                                                    <p className="text-amber-400 text-xs">{gap.issues.join(", ")}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Progress by Category */}
                                {stats?.byCategory && (
                                    <div className="rounded-xl bg-gray-900/50 border border-gray-800 p-6">
                                        <h3 className="text-lg font-bold text-white mb-4">Progress by Category</h3>
                                        <div className="space-y-3">
                                            {Object.entries(stats.byCategory).map(([category, data]: [string, any]) => (
                                                <div key={category}>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-gray-400 capitalize">{category}</span>
                                                        <span className="text-white">{data.mastered}/{data.mastered + data.learning + data.notStarted}</span>
                                                    </div>
                                                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden flex">
                                                        <div className="h-full bg-emerald-500" style={{ width: `${(data.mastered / (data.mastered + data.learning + data.notStarted || 1)) * 100}%` }} />
                                                        <div className="h-full bg-amber-500" style={{ width: `${(data.learning / (data.mastered + data.learning + data.notStarted || 1)) * 100}%` }} />
                                                        <div className="h-full bg-gray-600" style={{ width: `${(data.notStarted / (data.mastered + data.learning + data.notStarted || 1)) * 100}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
                                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Mastered</span>
                                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Learning</span>
                                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-600" /> Not Started</span>
                                        </div>
                                    </div>
                                )}

                                {/* Learning Path Info */}
                                {learningPath && (
                                    <div className="rounded-xl bg-gray-900/50 border border-gray-800 p-6">
                                        <h3 className="text-lg font-bold text-white mb-4">Path Info</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Path</span>
                                                <span className="text-white font-medium">{learningPath.name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400 flex items-center gap-1">
                                                    <Clock className="w-4 h-4" /> Est. Time
                                                </span>
                                                <span className="text-white">{learningPath.estimatedHours}h</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400 flex items-center gap-1">
                                                    <BookOpen className="w-4 h-4" /> Concepts
                                                </span>
                                                <span className="text-white">{learningPath.nodes.length}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
