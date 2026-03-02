"use client";

import { useState } from "react";
import { AnalysisResult } from "@/lib/designer/analyzer";

interface AnalysisPanelProps {
    analysis: AnalysisResult | null;
    isAnalyzing: boolean;
    onReanalyze: () => void;
}

export default function AnalysisPanel({
    analysis,
    isAnalyzing,
    onReanalyze,
}: AnalysisPanelProps) {
    const [activeTab, setActiveTab] = useState<"issues" | "suggestions" | "cost">("issues");
    const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
    const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);

    // Early return states
    if (!analysis && !isAnalyzing) {
        return (
            <div className="w-96 bg-slate-900/50 border-l border-slate-700/50 p-4 flex flex-col items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                        <svg
                            className="w-8 h-8 text-cyan-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">AI Architecture Review</h3>
                    <p className="text-slate-400 text-sm mb-4">
                        Add components to your design and click &ldquo;Analyze&rdquo; to get AI-powered feedback
                    </p>
                    <button
                        onClick={onReanalyze}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                        Analyze Design
                    </button>
                </div>
            </div>
        );
    }

    if (isAnalyzing) {
        return (
            <div className="w-96 bg-slate-900/50 border-l border-slate-700/50 p-4 flex flex-col items-center justify-center">
                <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Analyzing Architecture...</h3>
                <p className="text-slate-400 text-sm text-center">
                    Our AI is reviewing your design for issues, bottlenecks, and improvement opportunities
                </p>
            </div>
        );
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-400";
        if (score >= 60) return "text-yellow-400";
        if (score >= 40) return "text-orange-400";
        return "text-red-400";
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "critical":
                return "bg-red-500/20 border-red-500/50 text-red-400";
            case "warning":
                return "bg-yellow-500/20 border-yellow-500/50 text-yellow-400";
            case "info":
                return "bg-blue-500/20 border-blue-500/50 text-blue-400";
            default:
                return "bg-slate-500/20 border-slate-500/50 text-slate-400";
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high":
                return "bg-red-500/20 text-red-400";
            case "medium":
                return "bg-yellow-500/20 text-yellow-400";
            case "low":
                return "bg-green-500/20 text-green-400";
            default:
                return "bg-slate-500/20 text-slate-400";
        }
    };

    // If we reach here but analysis is null, show a message
    if (!analysis) {
        return (
            <div className="w-96 bg-slate-900/50 border-l border-slate-700/50 p-4 flex flex-col items-center justify-center">
                <p className="text-slate-400">No analysis data available</p>
            </div>
        );
    }

    return (
        <div className="w-96 bg-slate-900/50 border-l border-slate-700/50 flex flex-col h-full overflow-hidden">
            {/* Header with Score */}
            <div className="p-4 border-b border-slate-700/50">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white">Architecture Review</h3>
                    <button
                        onClick={onReanalyze}
                        className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                        title="Reanalyze"
                    >
                        <svg
                            className="w-5 h-5 text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                    </button>
                </div>

                {/* Score Circle */}
                <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20">
                        <svg className="w-20 h-20 transform -rotate-90">
                            <circle
                                cx="40"
                                cy="40"
                                r="36"
                                stroke="currentColor"
                                strokeWidth="6"
                                fill="none"
                                className="text-slate-700"
                            />
                            <circle
                                cx="40"
                                cy="40"
                                r="36"
                                stroke="currentColor"
                                strokeWidth="6"
                                fill="none"
                                strokeDasharray={`${((analysis?.overallScore ?? 0) / 100) * 226} 226`}
                                className={getScoreColor(analysis?.overallScore ?? 0)}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-2xl font-bold ${getScoreColor(analysis?.overallScore ?? 0)}`}>
                                {analysis?.overallScore ?? 0}
                            </span>
                        </div>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-slate-300 line-clamp-3">{analysis?.summary ?? ''}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-700/50">
                <button
                    onClick={() => setActiveTab("issues")}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "issues"
                        ? "text-cyan-400 border-b-2 border-cyan-400"
                        : "text-slate-400 hover:text-white"
                        }`}
                >
                    Issues ({analysis?.issues?.length ?? 0})
                </button>
                <button
                    onClick={() => setActiveTab("suggestions")}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "suggestions"
                        ? "text-cyan-400 border-b-2 border-cyan-400"
                        : "text-slate-400 hover:text-white"
                        }`}
                >
                    Suggestions ({analysis?.suggestions?.length ?? 0})
                </button>
                <button
                    onClick={() => setActiveTab("cost")}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "cost"
                        ? "text-cyan-400 border-b-2 border-cyan-400"
                        : "text-slate-400 hover:text-white"
                        }`}
                >
                    Cost
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === "issues" && analysis && (
                    <div className="space-y-3">
                        {analysis.issues.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-green-400 font-medium">No issues found!</p>
                                <p className="text-slate-400 text-sm">Your architecture looks good</p>
                            </div>
                        ) : (
                            analysis.issues.map((issue) => (
                                <div
                                    key={issue.id}
                                    className={`rounded-lg border ${getSeverityColor(issue.severity)} overflow-hidden`}
                                >
                                    <button
                                        onClick={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
                                        className="w-full p-3 text-left"
                                    >
                                        <div className="flex items-start gap-2">
                                            <span className="text-xs uppercase font-semibold px-2 py-0.5 rounded bg-slate-800/50">
                                                {issue.severity}
                                            </span>
                                            <span className="flex-1 font-medium">{issue.title}</span>
                                            <svg
                                                className={`w-5 h-5 transition-transform ${expandedIssue === issue.id ? "rotate-180" : ""
                                                    }`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </button>
                                    {expandedIssue === issue.id && (
                                        <div className="px-3 pb-3 pt-0 border-t border-slate-700/30">
                                            <p className="text-sm text-slate-300 mt-2">{issue.description}</p>
                                            <div className="mt-3 p-2 bg-slate-800/50 rounded text-sm">
                                                <p className="text-slate-400 text-xs uppercase mb-1">Recommendation</p>
                                                <p className="text-slate-200">{issue.recommendation}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === "suggestions" && analysis && (
                    <div className="space-y-3">
                        {analysis.suggestions.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-slate-400">No suggestions available</p>
                            </div>
                        ) : (
                            analysis.suggestions.map((suggestion) => (
                                <div
                                    key={suggestion.id}
                                    className="rounded-lg border border-slate-700/50 bg-slate-800/30 overflow-hidden"
                                >
                                    <button
                                        onClick={() =>
                                            setExpandedSuggestion(expandedSuggestion === suggestion.id ? null : suggestion.id)
                                        }
                                        className="w-full p-3 text-left"
                                    >
                                        <div className="flex items-start gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(suggestion.priority)}`}>
                                                {suggestion.priority}
                                            </span>
                                            <span className="flex-1 font-medium text-white">{suggestion.title}</span>
                                            <svg
                                                className={`w-5 h-5 text-slate-400 transition-transform ${expandedSuggestion === suggestion.id ? "rotate-180" : ""
                                                    }`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </button>
                                    {expandedSuggestion === suggestion.id && (
                                        <div className="px-3 pb-3 pt-0 border-t border-slate-700/30">
                                            <p className="text-sm text-slate-300 mt-2">{suggestion.description}</p>
                                            <div className="mt-3 flex gap-4 text-xs">
                                                <div>
                                                    <span className="text-slate-400">Impact:</span>
                                                    <span className="text-green-400 ml-1">{suggestion.impact}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400">Effort:</span>
                                                    <span className="text-cyan-400 ml-1">{suggestion.effort}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === "cost" && analysis && (
                    <div className="space-y-4">
                        <div className="text-center p-4 rounded-lg bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20">
                            <p className="text-slate-400 text-sm mb-1">Estimated Monthly Cost</p>
                            <p className="text-3xl font-bold text-white">
                                ${analysis.costEstimate.monthlyEstimate}
                                <span className="text-lg text-slate-400">/mo</span>
                            </p>
                        </div>

                        <div className="space-y-2">
                            <CostBar label="Compute" amount={analysis.costEstimate.compute} total={analysis.costEstimate.total} color="bg-cyan-500" />
                            <CostBar label="Database" amount={analysis.costEstimate.database} total={analysis.costEstimate.total} color="bg-purple-500" />
                            <CostBar label="Network" amount={analysis.costEstimate.network} total={analysis.costEstimate.total} color="bg-green-500" />
                            <CostBar label="Storage" amount={analysis.costEstimate.storage} total={analysis.costEstimate.total} color="bg-yellow-500" />
                            <CostBar label="Other" amount={analysis.costEstimate.other} total={analysis.costEstimate.total} color="bg-pink-500" />
                        </div>

                        <div className="text-xs text-slate-500 mt-4">
                            <p>* Estimates are based on average cloud pricing (AWS/GCP/Azure)</p>
                            <p>* Actual costs may vary based on usage and region</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function CostBar({
    label,
    amount,
    total,
    color,
}: {
    label: string;
    amount: number;
    total: number;
    color: string;
}) {
    const percentage = total > 0 ? (amount / total) * 100 : 0;

    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">{label}</span>
                <span className="text-white">${amount}</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${percentage}%` }} />
            </div>
        </div>
    );
}
