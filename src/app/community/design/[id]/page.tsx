"use client";

import { MainLayout } from "@/components/MainLayout";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    Heart,
    MessageSquare,
    Eye,
    Clock,
    Send,
    Loader2,
    Download,
    Share2,
    Copy,
    CheckCircle2,
    User,
    BarChart3,
    Zap,
} from "lucide-react";
import Link from "next/link";
import { DESIGN_DIFFICULTY_LABELS } from "@/types/community.types";
import {
    ReactFlow,
    Controls,
    Background,
    BackgroundVariant,
    ReactFlowProvider,
    useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArchitectureNode } from "@/components/designer/ArchitectureNode";

interface Comment {
    id: string;
    design_id: string;
    user_id: string;
    content: string;
    parent_id: string | null;
    likes_count: number;
    created_at: string;
    user: {
        id: string;
        name: string | null;
        avatar_url: string | null;
    } | null;
}

interface SharedDesign {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    design_data: {
        nodes: any[];
        edges: any[];
        name?: string;
        analysis?: {
            score: number;
            issues: string[];
            recommendations: string[];
            estimatedCost?: {
                monthly: number;
                breakdown: Record<string, number>;
            };
        };
    };
    preview_image: string | null;
    difficulty: "easy" | "medium" | "hard";
    tags: string[];
    likes_count: number;
    comments_count: number;
    views_count: number;
    is_featured: boolean;
    created_at: string;
    user: {
        id: string;
        name: string | null;
        avatar_url: string | null;
    } | null;
    comments: Comment[];
}

const nodeTypes = {
    architecture: ArchitectureNode,
};

function DesignViewer({ designData }: { designData: SharedDesign["design_data"] }) {
    const { fitView } = useReactFlow();

    return (
        <div className="h-[400px] rounded-xl border border-gray-800 overflow-hidden">
            <ReactFlow
                nodes={designData.nodes || []}
                edges={designData.edges || []}
                nodeTypes={nodeTypes}
                fitView
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                className="bg-[#0a0a0f]"
            >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#333" />
                <Controls className="!bg-[#1a1a2e] !border-white/10 !rounded-lg" showInteractive={false} />
            </ReactFlow>
        </div>
    );
}

export default function DesignDetailPage() {
    const params = useParams();
    const designId = params.id as string;
    const queryClient = useQueryClient();

    const [commentContent, setCommentContent] = useState("");
    const [copied, setCopied] = useState(false);

    const { data: design, isLoading } = useQuery<SharedDesign>({
        queryKey: ["shared-design", designId],
        queryFn: async () => {
            const res = await fetch(`/api/community/designs/${designId}`);
            if (!res.ok) throw new Error("Failed to fetch design");
            return res.json();
        },
    });

    const createComment = useMutation({
        mutationFn: async (content: string) => {
            const res = await fetch("/api/community/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ designId, content }),
            });
            if (!res.ok) throw new Error("Failed to create comment");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["shared-design", designId] });
            setCommentContent("");
        },
    });

    const likeMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/community/like", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "design", id: designId }),
            });
            if (!res.ok) throw new Error("Failed to like");
            return res.json();
        },
    });

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExport = () => {
        if (!design) return;
        const blob = new Blob([JSON.stringify(design.design_data, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${design.title.toLowerCase().replace(/\s+/g, "-")}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return (
            <MainLayout>
                <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                </div>
            </MainLayout>
        );
    }

    if (!design) {
        return (
            <MainLayout>
                <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-white mb-2">Design not found</h2>
                        <Link href="/community" className="text-violet-400 hover:text-violet-300">
                            Back to Community
                        </Link>
                    </div>
                </div>
            </MainLayout>
        );
    }

    const difficultyStyle = DESIGN_DIFFICULTY_LABELS[design.difficulty];

    return (
        <MainLayout>
            <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <Link
                        href="/community"
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Community
                    </Link>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        {design.is_featured && (
                                            <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400 mb-2">
                                                ⭐ Featured
                                            </span>
                                        )}
                                        <h1 className="text-2xl font-bold text-white">{design.title}</h1>
                                    </div>
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm ${difficultyStyle.bg} ${difficultyStyle.color}`}
                                    >
                                        {difficultyStyle.label}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-medium">
                                        {design.user?.name?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <div className="text-white font-medium">{design.user?.name || "Anonymous"}</div>
                                        <div className="text-xs text-gray-500 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {getTimeAgo(design.created_at)}
                                        </div>
                                    </div>
                                </div>

                                {design.description && (
                                    <p className="text-gray-400 mb-4">{design.description}</p>
                                )}

                                <div className="flex items-center gap-4 mb-4">
                                    <button
                                        onClick={() => likeMutation.mutate()}
                                        className="flex items-center gap-1 text-gray-500 hover:text-red-400 transition-colors"
                                    >
                                        <Heart className="w-5 h-5" />
                                        {design.likes_count}
                                    </button>
                                    <span className="flex items-center gap-1 text-gray-500">
                                        <MessageSquare className="w-5 h-5" />
                                        {design.comments_count}
                                    </span>
                                    <span className="flex items-center gap-1 text-gray-500">
                                        <Eye className="w-5 h-5" />
                                        {design.views_count}
                                    </span>
                                </div>

                                {design.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {design.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="px-2 py-0.5 text-xs rounded-full bg-gray-800 text-gray-400"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
                                <ReactFlowProvider>
                                    <DesignViewer designData={design.design_data} />
                                </ReactFlowProvider>
                            </div>

                            {design.design_data.analysis && (
                                <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5 text-cyan-400" />
                                        Architecture Analysis
                                    </h3>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="p-3 rounded-lg bg-gray-800/50">
                                            <div className="text-sm text-gray-400">Score</div>
                                            <div className="text-2xl font-bold text-white">
                                                {design.design_data.analysis.score}/100
                                            </div>
                                        </div>
                                        {design.design_data.analysis.estimatedCost && (
                                            <div className="p-3 rounded-lg bg-gray-800/50">
                                                <div className="text-sm text-gray-400">Est. Monthly Cost</div>
                                                <div className="text-2xl font-bold text-emerald-400">
                                                    ${design.design_data.analysis.estimatedCost.monthly}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {design.design_data.analysis.issues.length > 0 && (
                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium text-amber-400 mb-2">Issues Found</h4>
                                            <ul className="space-y-1">
                                                {design.design_data.analysis.issues.map((issue, i) => (
                                                    <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                                                        <span className="text-amber-400">•</span>
                                                        {issue}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {design.design_data.analysis.recommendations.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-cyan-400 mb-2">Recommendations</h4>
                                            <ul className="space-y-1">
                                                {design.design_data.analysis.recommendations.map((rec, i) => (
                                                    <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                                                        <Zap className="w-3 h-3 text-cyan-400 mt-1 flex-shrink-0" />
                                                        {rec}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleExport}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Export JSON
                                </button>
                                <button
                                    onClick={handleCopyLink}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                                >
                                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                    {copied ? "Copied!" : "Copy Link"}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                                <h3 className="text-lg font-semibold text-white mb-4">Comments</h3>

                                <div className="mb-4">
                                    <textarea
                                        value={commentContent}
                                        onChange={(e) => setCommentContent(e.target.value)}
                                        placeholder="Add a comment..."
                                        rows={3}
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm resize-none"
                                    />
                                    <button
                                        onClick={() => createComment.mutate(commentContent)}
                                        disabled={!commentContent.trim() || createComment.isPending}
                                        className="mt-2 w-full px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Send className="w-4 h-4" />
                                        {createComment.isPending ? "Posting..." : "Post Comment"}
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {design.comments?.length === 0 ? (
                                        <p className="text-gray-500 text-sm text-center py-4">No comments yet</p>
                                    ) : (
                                        design.comments?.map((comment) => (
                                            <div key={comment.id} className="p-3 rounded-lg bg-gray-800/50">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center text-white text-xs">
                                                        {comment.user?.name?.[0]?.toUpperCase() || "?"}
                                                    </div>
                                                    <span className="text-white text-sm font-medium">
                                                        {comment.user?.name || "Anonymous"}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {getTimeAgo(comment.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-gray-300 text-sm">{comment.content}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}

function getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}
