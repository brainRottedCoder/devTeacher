"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
    ReactFlow,
    Controls,
    Background,
    MiniMap,
    addEdge,
    useNodesState,
    useEdgesState,
    Connection,
    Node,
    Edge,
    BackgroundVariant,
    ReactFlowProvider,
    useReactFlow,
    NodeChange,
    EdgeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { MainLayout } from "@/components/MainLayout";
import { ArchitectureNode } from "@/components/designer/ArchitectureNode";
import { ComponentLibrary } from "@/components/designer/ComponentLibrary";
import { TemplateSelector } from "@/components/designer/TemplateSelector";
import AnalysisPanel from "@/components/designer/AnalysisPanel";
import { ScalabilityTestPanel } from "@/components/designer/ScalabilityTestPanel";
import { useCollaboration, useDesignComments } from "@/hooks/useCollaboration";
import { useAuth } from "@/hooks/useAuth";
import {
    LayoutGrid,
    Search,
    Download,
    Trash2,
    Zap,
    Users,
    MessageSquare,
    X,
    Send,
    Crown,
    Eye,
    User,
    CheckCircle2,
    Loader2,
    Share2,
    Copy,
    Link2,
    History,
    ChevronRight,
    Sparkles,
} from "lucide-react";
import {
    ArchitectureComponentType,
    COMPONENT_CONFIGS,
    DesignTemplate,
} from "@/lib/designer/types";
import { AnalysisResult, analyzeArchitecture } from "@/lib/designer/analyzer";

const nodeTypes = {
    architecture: ArchitectureNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

function CollaboratorCursor({ x, y, name, color }: { x: number; y: number; name: string; color: string }) {
    return (
        <div
            className="absolute pointer-events-none z-50 transition-all duration-75"
            style={{ left: x, top: y }}
        >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                    d="M5.65 3.15l14.7 8.5-5.5 1.5-1.5 5.5-7.7-15.5z"
                    fill={color}
                    stroke="white"
                    strokeWidth="1.5"
                />
            </svg>
            <div
                className="absolute top-5 left-5 px-2 py-0.5 rounded text-xs text-white whitespace-nowrap"
                style={{ backgroundColor: color }}
            >
                {name}
            </div>
        </div>
    );
}

function DesignStudio() {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { screenToFlowPosition } = useReactFlow();
    const { user, session: authSession } = useAuth();

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [designName, setDesignName] = useState("Untitled Design");
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [isAiPowered, setIsAiPowered] = useState(false);
    const [showScalability, setShowScalability] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareForm, setShareForm] = useState({
        title: '',
        description: '',
        difficulty: 'medium' as 'easy' | 'medium' | 'hard',
        tags: '',
    });
    const [isSharing, setIsSharing] = useState(false);

    const [showCollaboration, setShowCollaboration] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState("");

    // AI Architecture Generator state
    const [showAiBar, setShowAiBar] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    const [contextMenu, setContextMenu] = useState<{
        id: string;
        top: number;
        left: number;
        type: 'node' | 'edge';
    } | null>(null);

    const designId = "design-demo";
    const {
        session,
        participants,
        cursors,
        isConnected,
        participantColor,
        joinSession,
        leaveSession,
        updateCursor,
        broadcastEvent,
    } = useCollaboration(designId);

    const { comments, addComment, resolveComment, replyToComment } = useDesignComments(designId);

    useEffect(() => {
        if (user && showCollaboration && !session) {
            joinSession(user.id, user.email?.split('@')[0] || 'User');
        }
    }, [user, showCollaboration, session, joinSession]);

    const onConnect = useCallback(
        (params: Connection) => {
            setEdges((eds) =>
                addEdge(
                    {
                        ...params,
                        animated: true,
                        style: { stroke: "#8b5cf6", strokeWidth: 2 },
                    },
                    eds
                )
            );
            if (isConnected) {
                broadcastEvent('edge_add', params);
            }
        },
        [setEdges, isConnected, broadcastEvent]
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const componentType = event.dataTransfer.getData("componentType") as ArchitectureComponentType;
            if (!componentType) return;

            const config = COMPONENT_CONFIGS[componentType];
            if (!config) return;

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node = {
                id: `${componentType}-${Date.now()}`,
                type: "architecture",
                position,
                data: {
                    type: componentType,
                    label: config.label,
                    icon: config.icon,
                    color: config.color,
                    category: config.category,
                    config: {},
                },
            };

            setNodes((nds) => [...nds, newNode]);

            if (isConnected) {
                broadcastEvent('node_add', newNode);
            }
        },
        [screenToFlowPosition, setNodes, isConnected, broadcastEvent]
    );

    const onNodeContextMenu = useCallback(
        (event: React.MouseEvent, node: Node) => {
            event.preventDefault();
            const bounds = reactFlowWrapper.current?.getBoundingClientRect();
            if (!bounds) return;
            setContextMenu({
                id: node.id,
                top: event.clientY - bounds.top,
                left: event.clientX - bounds.left,
                type: 'node',
            });
        },
        [setContextMenu]
    );

    const onEdgeContextMenu = useCallback(
        (event: React.MouseEvent, edge: Edge) => {
            event.preventDefault();
            const bounds = reactFlowWrapper.current?.getBoundingClientRect();
            if (!bounds) return;
            setContextMenu({
                id: edge.id,
                top: event.clientY - bounds.top,
                left: event.clientX - bounds.left,
                type: 'edge',
            });
        },
        [setContextMenu]
    );

    const onPaneClick = useCallback(() => setContextMenu(null), [setContextMenu]);

    const handleContextMenuDelete = useCallback(() => {
        if (contextMenu?.type === 'node') {
            setNodes((nds) => nds.filter((node) => node.id !== contextMenu.id));
            setEdges((eds) => eds.filter((edge) => edge.source !== contextMenu.id && edge.target !== contextMenu.id));
            if (isConnected) {
                broadcastEvent('node_delete', { id: contextMenu.id });
            }
        } else if (contextMenu?.type === 'edge') {
            setEdges((eds) => eds.filter((edge) => edge.id !== contextMenu.id));
            if (isConnected) {
                broadcastEvent('edge_delete', { id: contextMenu.id });
            }
        }
        setContextMenu(null);
    }, [contextMenu, setNodes, setEdges, isConnected, broadcastEvent]);

    const handleDisconnectNode = useCallback(() => {
        if (contextMenu?.type === 'node') {
            setEdges((eds) => eds.filter((edge) => edge.source !== contextMenu.id && edge.target !== contextMenu.id));
        }
        setContextMenu(null);
    }, [contextMenu, setEdges]);

    const onMouseMove = useCallback((event: React.MouseEvent) => {
        if (!isConnected || !session) return;

        const bounds = reactFlowWrapper.current?.getBoundingClientRect();
        if (!bounds) return;

        updateCursor('current-participant', {
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
        });
    }, [isConnected, session, updateCursor]);

    const handleSelectTemplate = useCallback(
        (template: DesignTemplate) => {
            setSelectedTemplateId(template.id);
            setDesignName(template.name);
            setNodes(template.nodes as Node[]);
            setEdges(template.edges as Edge[]);
        },
        [setNodes, setEdges]
    );

    const handleClearCanvas = useCallback(() => {
        setNodes([]);
        setEdges([]);
        setSelectedTemplateId(null);
        setDesignName("Untitled Design");
    }, [setNodes, setEdges]);

    const handleExportDesign = useCallback(() => {
        const design = {
            name: designName,
            nodes,
            edges,
            exportedAt: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(design, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${designName.toLowerCase().replace(/\s+/g, "-")}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [designName, nodes, edges]);

    const handleAnalyze = useCallback(async () => {
        setIsAnalyzing(true);
        setShowAnalysis(true);
        setIsAiPowered(false);
        try {
            // Try AI-powered analysis first
            const res = await fetch("/api/ai/design/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nodes, edges }),
            });

            let data: any;
            try { data = await res.json(); } catch { data = null; }

            if (res.ok && data && !data.fallbackToStatic && data.overallScore !== undefined) {
                setAnalysisResult(data as AnalysisResult);
                setIsAiPowered(true);
                return;
            }

            // Fallback to static analysis
            console.warn("AI analysis unavailable, using static analysis.", data?.error);
            const result = await analyzeArchitecture(nodes, edges);
            setAnalysisResult(result);
        } catch (error) {
            console.error("Analysis failed, using static fallback:", error);
            try {
                const result = await analyzeArchitecture(nodes, edges);
                setAnalysisResult(result);
            } catch (fallbackErr) {
                console.error("Static analysis also failed:", fallbackErr);
            }
        } finally {
            setIsAnalyzing(false);
        }
    }, [nodes, edges]);

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        await addComment.mutateAsync({ content: newComment });
        setNewComment("");
    };

    const handleShareDesign = () => {
        setShareForm({
            title: designName,
            description: '',
            difficulty: 'medium',
            tags: '',
        });
        setShowShareModal(true);
    };

    const handleShareToCommunity = async () => {
        if (!shareForm.title.trim()) return;
        setIsSharing(true);
        try {
            const response = await fetch('/api/community/designs', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(authSession?.access_token && { 'Authorization': `Bearer ${authSession.access_token}` })
                },
                body: JSON.stringify({
                    title: shareForm.title,
                    description: shareForm.description,
                    designData: {
                        nodes,
                        edges,
                        name: designName,
                        exportedAt: new Date().toISOString(),
                        analysis: analysisResult ? {
                            score: analysisResult.overallScore,
                            issues: analysisResult.issues.map(i => i.title),
                            recommendations: analysisResult.suggestions.map(s => s.title),
                            estimatedCost: {
                                monthly: analysisResult.costEstimate.monthlyEstimate,
                                breakdown: {
                                    compute: analysisResult.costEstimate.compute,
                                    database: analysisResult.costEstimate.database,
                                    network: analysisResult.costEstimate.network,
                                },
                            },
                        } : undefined,
                    },
                    difficulty: shareForm.difficulty,
                    tags: shareForm.tags.split(',').map(t => t.trim()).filter(Boolean),
                }),
            });
            
            if (response.ok) {
                const data = await response.json();
                setShowShareModal(false);
                window.open(`/community/design/${data.id}`, '_blank');
            }
        } catch (error) {
            console.error('Failed to share design:', error);
        } finally {
            setIsSharing(false);
        }
    };

    // Example prompts for the AI bar
    const AI_EXAMPLE_PROMPTS = [
        "Real-time chat app for 10M users",
        "E-commerce platform with payments",
        "Video streaming like YouTube",
        "IoT sensor data pipeline",
        "Social media with news feed",
    ];

    // AI Architecture Generate handler
    const handleAIGenerate = useCallback(async () => {
        if (!aiPrompt.trim() || isGenerating) return;
        setIsGenerating(true);
        setAiError(null);
        try {
            const res = await fetch("/api/ai/design/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: aiPrompt.trim() }),
            });

            let data: any;
            try {
                data = await res.json();
            } catch {
                setAiError("Received an invalid response. Please try again.");
                return;
            }

            // Detect service worker interference (returns {queued: true, offline: true})
            if (data.queued || data.offline) {
                console.warn("AI request was intercepted by service worker. Unregistering stale SW...");
                // Auto-fix: unregister the stale service worker
                if ("serviceWorker" in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const reg of registrations) {
                        await reg.unregister();
                    }
                }
                setAiError("Request was intercepted by an old cache. Please hard-refresh the page (Ctrl+Shift+R) and try again.");
                return;
            }

            if (!res.ok) {
                setAiError(data.error || "Failed to generate architecture.");
                return;
            }

            if (data.nodes && data.edges) {
                const rawNodes = Array.isArray(data.nodes) ? data.nodes : [];
                const rawEdges = Array.isArray(data.edges) ? data.edges : [];

                // Validate each node has required fields
                const validNodes = rawNodes.filter(
                    (n: any) =>
                        n.id &&
                        n.type === "architecture" &&
                        n.data?.type &&
                        n.data?.label &&
                        n.position?.x !== undefined &&
                        n.position?.y !== undefined
                );

                if (validNodes.length === 0) {
                    setAiError("AI couldn't generate valid components. Try a more specific prompt.");
                    return;
                }

                // Only keep edges that reference existing node IDs
                const nodeIds = new Set(validNodes.map((n: any) => n.id));
                const validEdges = rawEdges.filter(
                    (e: any) => e.source && e.target && nodeIds.has(e.source) && nodeIds.has(e.target)
                );

                // Spread overlapping nodes apart
                const MIN_DIST_X = 280;
                const MIN_DIST_Y = 120;
                for (let i = 0; i < validNodes.length; i++) {
                    for (let j = i + 1; j < validNodes.length; j++) {
                        const a = validNodes[i] as any;
                        const b = validNodes[j] as any;
                        const dx = Math.abs(a.position.x - b.position.x);
                        const dy = Math.abs(a.position.y - b.position.y);
                        if (dx < MIN_DIST_X && dy < MIN_DIST_Y) {
                            // Push the second node away
                            if (dx < MIN_DIST_X) {
                                b.position.x += (MIN_DIST_X - dx) * (b.position.x >= a.position.x ? 1 : -1);
                            }
                            if (dy < MIN_DIST_Y) {
                                b.position.y += (MIN_DIST_Y - dy) * (b.position.y >= a.position.y ? 1 : -1);
                            }
                        }
                    }
                }

                setNodes(validNodes as Node[]);
                setEdges(validEdges as Edge[]);
                setDesignName(`AI: ${aiPrompt.trim().slice(0, 40)}`);
                setSelectedTemplateId(null);
                setShowAiBar(false);
                setAiPrompt("");
            } else {
                console.error("AI response missing nodes/edges:", JSON.stringify(data).slice(0, 300));
                setAiError(data.error || "AI returned an unexpected response. Please try again.");
            }
        } catch (err) {
            console.error("AI generate error:", err);
            setAiError("Could not reach AI service. Check your connection and try again.");
        } finally {
            setIsGenerating(false);
        }
    }, [aiPrompt, setNodes, setEdges, isGenerating]);

    return (
        <MainLayout>
            <div className="min-h-screen relative">
                <div className="relative z-10">
                    {/* Header */}
                    <div className="border-b border-white/[0.04] bg-surface-deep/50 backdrop-blur-sm">
                        <div className="max-w-full mx-auto px-4 sm:px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-rose to-accent-violet flex items-center justify-center shadow-lg shadow-accent-rose/20">
                                        <LayoutGrid className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <input
                                            type="text"
                                            value={designName}
                                            onChange={(e) => setDesignName(e.target.value)}
                                            className="text-lg font-heading font-bold text-white bg-transparent border-none outline-none focus:ring-0 tracking-tight"
                                        />
                                        <div className="flex items-center gap-3">
                                            <p className="text-xs text-slate-500">
                                                Drag & drop architecture design studio
                                            </p>
                                            {isConnected && (
                                                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                                                    {participants.length} online
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Grouping */}
                                <div className="flex items-center gap-4 bg-white/[0.02] p-1.5 rounded-2xl border border-white/[0.05] shadow-inner backdrop-blur-md">
                                    <div className="flex items-center gap-1.5 pr-4 border-r border-white/[0.08]">
                                        {/* Collaboration Toggle */}
                                        <button
                                            onClick={() => setShowCollaboration(!showCollaboration)}
                                            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-300 flex items-center gap-2 ${
                                                showCollaboration
                                                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                                                    : "bg-transparent text-slate-400 hover:bg-white/[0.06] hover:text-white border border-transparent"
                                            }`}
                                        >
                                            <Users className="w-4 h-4" />
                                            Collaborate
                                        </button>

                                        <button
                                            onClick={() => setShowComments(!showComments)}
                                            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-300 flex items-center gap-2 relative ${
                                                showComments
                                                    ? "bg-violet-500/15 text-violet-400 border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                                                    : "bg-transparent text-slate-400 hover:bg-white/[0.06] hover:text-white border border-transparent"
                                            }`}
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                            Comments
                                            {comments.filter(c => !c.resolved).length > 0 && (
                                                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-500 text-white text-[10px] flex items-center justify-center ring-2 ring-surface-deep shadow-lg shadow-violet-500/30">
                                                    {comments.filter(c => !c.resolved).length}
                                                </span>
                                            )}
                                        </button>

                                        <button
                                            onClick={handleShareDesign}
                                            className="px-3.5 py-2 rounded-xl text-xs font-medium bg-transparent text-slate-400 hover:bg-white/[0.06] hover:text-white transition-all duration-300 flex items-center gap-2"
                                        >
                                            <Share2 className="w-4 h-4" />
                                            Share
                                        </button>
                                    </div>

                                    {/* Primary Actions */}
                                    <div className="flex items-center gap-2 pl-2">
                                        <button
                                            onClick={() => { setShowAiBar(!showAiBar); setAiError(null); }}
                                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 border ${
                                                showAiBar
                                                    ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                                                    : "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-white/10 shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)]"
                                            }`}
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            AI Generate
                                        </button>
                                        <button
                                            onClick={handleClearCanvas}
                                            className="p-2 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 border border-transparent transition-all duration-300"
                                            title="Clear Canvas"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={handleAnalyze}
                                            className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-accent-cyan to-accent-indigo text-white hover:opacity-90 transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] flex items-center gap-2 border border-white/10"
                                        >
                                            <Search className="w-4 h-4" /> Optimize
                                        </button>
                                        <button
                                            onClick={() => setShowScalability(true)}
                                            className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center gap-2 border border-white/10"
                                        >
                                            <Zap className="w-4 h-4" /> Scale Test
                                        </button>
                                        <button
                                            onClick={handleExportDesign}
                                            className="px-4 py-2 rounded-xl text-sm font-medium bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/[0.1] transition-all duration-300 flex items-center gap-2 hover:shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                                        >
                                            <Download className="w-4 h-4" /> Export
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main content */}
                    <div className="flex h-[calc(100vh-100px)]">
                        {/* Left sidebar - Templates */}
                        <div className="w-72 border-r border-white/[0.08] bg-surface-deep/80 backdrop-blur-xl shadow-[4px_0_24px_rgba(0,0,0,0.5)] z-10 flex flex-col">
                            <TemplateSelector
                                onSelectTemplate={handleSelectTemplate}
                                selectedTemplateId={selectedTemplateId}
                            />
                        </div>

                        {/* Center - Canvas */}
                        <div
                            className="flex-1 relative"
                            ref={reactFlowWrapper}
                            onMouseMove={onMouseMove}
                        >
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                onConnect={onConnect}
                                onDrop={onDrop}
                                onDragOver={onDragOver}
                                onNodeContextMenu={onNodeContextMenu}
                                onEdgeContextMenu={onEdgeContextMenu}
                                onPaneClick={onPaneClick}
                                nodeTypes={nodeTypes}
                                fitView
                                fitViewOptions={{ padding: 0.3 }}
                                snapToGrid
                                snapGrid={[15, 15]}
                                defaultEdgeOptions={{
                                    animated: true,
                                    style: { stroke: "#8b5cf6", strokeWidth: 2 },
                                }}
                                className="bg-[#0a0a0f]"
                            >
                                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#333" />
                                <Controls className="!bg-[#1a1a2e] !border-white/10 !rounded-lg" />
                                <MiniMap
                                    className="!bg-[#1a1a2e] !border-white/10 !rounded-lg"
                                    nodeColor="#8b5cf6"
                                    maskColor="rgba(0, 0, 0, 0.8)"
                                />
                            </ReactFlow>

                            {/* Context Menu */}
                            {contextMenu && (
                                <div
                                    className="absolute z-50 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl overflow-hidden py-1 min-w-[160px]"
                                    style={{ top: contextMenu.top, left: contextMenu.left }}
                                >
                                    {contextMenu.type === 'node' && (
                                        <>
                                            <button
                                                onClick={handleDisconnectNode}
                                                className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-2"
                                            >
                                                <X className="w-4 h-4" />
                                                Disconnect
                                            </button>
                                            <button
                                                onClick={handleContextMenuDelete}
                                                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete
                                            </button>
                                        </>
                                    )}
                                    {contextMenu.type === 'edge' && (
                                        <button
                                            onClick={handleContextMenuDelete}
                                            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete Edge
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Collaborator Cursors */}
                            {isConnected && Array.from(cursors.entries()).map(([id, pos]) => {
                                const participant = participants.find(p => p.id === id);
                                if (!participant) return null;
                                return (
                                    <CollaboratorCursor
                                        key={id}
                                        x={pos.x}
                                        y={pos.y}
                                        name={participant.user_name}
                                        color={participant.user_color}
                                    />
                                );
                            })}

                            {/* AI Command Bar Overlay */}
                            {showAiBar && (
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
                                    <div className="bg-[#12121e]/90 backdrop-blur-2xl rounded-2xl border border-amber-500/20 shadow-[0_8px_40px_rgba(245,158,11,0.15),0_0_0_1px_rgba(255,255,255,0.03)] p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                                <Sparkles className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-sm font-heading font-bold text-white">AI Architecture Generator</h3>
                                                <p className="text-[11px] text-slate-500">Describe your application and the AI will design the architecture</p>
                                            </div>
                                            <button
                                                onClick={() => { setShowAiBar(false); setAiError(null); }}
                                                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={aiPrompt}
                                                onChange={(e) => setAiPrompt(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === "Enter") handleAIGenerate(); }}
                                                placeholder="e.g. A scalable real-time chat application with 10M users..."
                                                className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all"
                                                disabled={isGenerating}
                                                autoFocus
                                            />
                                            <button
                                                onClick={handleAIGenerate}
                                                disabled={isGenerating || !aiPrompt.trim()}
                                                className="px-5 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all duration-300 flex items-center gap-2 border border-white/10"
                                            >
                                                {isGenerating ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Generating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-4 h-4" />
                                                        Generate
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        {!isGenerating && !aiError && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {AI_EXAMPLE_PROMPTS.map((example) => (
                                                    <button
                                                        key={example}
                                                        onClick={() => setAiPrompt(example)}
                                                        className="px-2.5 py-1 rounded-lg text-[11px] text-slate-400 bg-white/[0.04] border border-white/[0.06] hover:bg-amber-500/10 hover:text-amber-300 hover:border-amber-500/20 transition-all duration-200"
                                                    >
                                                        {example}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {aiError && (
                                            <p className="mt-2 text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                                                {aiError}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Empty state */}
                            {nodes.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.05)_0%,transparent_60%)]">
                                    <div className="text-center p-8 rounded-3xl bg-surface-deep/40 backdrop-blur-md border border-white/[0.05] shadow-2xl">
                                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/10 to-transparent border border-violet-500/20 flex items-center justify-center mx-auto mb-6 shadow-[inset_0_0_20px_rgba(139,92,246,0.1)]">
                                            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                                                <LayoutGrid className="w-5 h-5 text-violet-400" />
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-heading font-bold text-white mb-3">
                                            Design Your Architecture
                                        </h3>
                                        <p className="text-slate-400 text-sm max-w-[280px] mx-auto leading-relaxed">
                                            Drag components from the library or start with a predefined system template to build your infrastructure.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right sidebar */}
                        <div className="w-[340px] border-l border-white/[0.08] bg-surface-deep/80 backdrop-blur-xl shadow-[-4px_0_24px_rgba(0,0,0,0.5)] z-10 flex flex-col">
                            {showScalability ? (
                                <ScalabilityTestPanel
                                    nodes={nodes}
                                    edges={edges}
                                    onClose={() => setShowScalability(false)}
                                />
                            ) : showComments ? (
                                <div className="flex flex-col h-full">
                                    <div className="p-4 border-b border-white/[0.04]">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-heading font-semibold text-white">Comments</h3>
                                            <button
                                                onClick={() => setShowComments(false)}
                                                className="text-slate-500 hover:text-white"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Add Comment */}
                                    <div className="p-4 border-b border-white/[0.04]">
                                        <textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Leave your feedback..."
                                            rows={3}
                                            className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] rounded-xl text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                                        />
                                        <button
                                            onClick={handleAddComment}
                                            disabled={!newComment.trim() || addComment.isPending}
                                            className="mt-2 w-full px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                                        >
                                            <Send className="w-3 h-3" />
                                            Add Comment
                                        </button>
                                    </div>

                                    {/* Comments List */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                        {comments.length === 0 ? (
                                            <p className="text-slate-500 text-sm text-center py-8">
                                                No comments yet. Add feedback on the design.
                                            </p>
                                        ) : (
                                            comments.map((comment) => (
                                                <div
                                                    key={comment.id}
                                                    className={`p-3 rounded-lg border ${
                                                        comment.resolved
                                                            ? 'border-emerald-500/20 bg-emerald-500/5'
                                                            : 'border-white/[0.06] bg-surface-card'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xs">
                                                                {comment.user_name[0]}
                                                            </div>
                                                            <span className="text-white text-sm font-medium">{comment.user_name}</span>
                                                        </div>
                                                        {!comment.resolved && (
                                                            <button
                                                                onClick={() => resolveComment.mutate(comment.id)}
                                                                className="text-slate-500 hover:text-emerald-400"
                                                            >
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-slate-300 text-sm">{comment.content}</p>
                                                    {comment.resolved && (
                                                        <span className="text-emerald-400 text-xs mt-2 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            Resolved
                                                        </span>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ) : showCollaboration ? (
                                <div className="flex flex-col h-full">
                                    <div className="p-4 border-b border-white/[0.04]">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-heading font-semibold text-white">Collaboration</h3>
                                            <button
                                                onClick={() => setShowCollaboration(false)}
                                                className="text-slate-500 hover:text-white"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Session Status */}
                                    <div className="p-4 border-b border-white/[0.04]">
                                        {isConnected ? (
                                            <div className="flex items-center gap-2 text-emerald-400 text-sm">
                                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                Live session active
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => user && joinSession(user.id, user.email?.split('@')[0] || 'User')}
                                                className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Users className="w-4 h-4" />
                                                Start Live Session
                                            </button>
                                        )}
                                    </div>

                                    {/* Participants */}
                                    <div className="p-4">
                                        <h4 className="text-xs font-medium text-slate-500 mb-3">Participants ({participants.length})</h4>
                                        <div className="space-y-2">
                                            {participants.map((participant) => (
                                                <div key={participant.id} className="flex items-center gap-2">
                                                    <div
                                                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
                                                        style={{ backgroundColor: participant.user_color }}
                                                    >
                                                        {participant.user_name[0]}
                                                    </div>
                                                    <span className="text-white text-sm flex-1">{participant.user_name}</span>
                                                    {participant.user_id === session?.owner_id ? (
                                                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                                                    ) : (
                                                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                                                    )}
                                                    <div
                                                        className={`w-2 h-2 rounded-full ${
                                                            participant.is_active ? 'bg-emerald-400' : 'bg-slate-600'
                                                        }`}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Share Link */}
                                    <div className="mt-auto p-4 border-t border-white/[0.04]">
                                        <p className="text-xs text-slate-500 mb-2">Share this design</p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                readOnly
                                                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/design/${designId}`}
                                                className="flex-1 px-3 py-2 bg-surface-deep border border-white/[0.06] rounded-lg text-white text-xs"
                                            />
                                            <button
                                                onClick={handleShareDesign}
                                                className="p-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : showAnalysis ? (
                                <>
                                    <div className="flex-1 overflow-hidden">
                                    <AnalysisPanel
                                            analysis={analysisResult}
                                            isAnalyzing={isAnalyzing}
                                            onReanalyze={handleAnalyze}
                                            isAiPowered={isAiPowered}
                                        />
                                    </div>
                                    <button
                                        onClick={() => setShowAnalysis(false)}
                                        className="p-2.5 text-xs text-slate-500 hover:text-white border-t border-white/[0.04] transition-colors font-medium"
                                    >
                                        ← Back to Components
                                    </button>
                                </>
                            ) : (
                                <ComponentLibrary onDragStart={() => {}} />
                            )}
                        </div>
                    </div>
                </div>

                {showShareModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
                        <div className="bg-surface-deep/90 border border-white/[0.08] rounded-2xl p-8 w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-heading font-bold text-white mb-1">Share Design</h3>
                                    <p className="text-sm text-slate-400">Publish your architecture to the community</p>
                                </div>
                                <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                                    <input
                                        type="text"
                                        value={shareForm.title}
                                        onChange={(e) => setShareForm({ ...shareForm, title: e.target.value })}
                                        className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all placeholder-slate-600"
                                        placeholder="Give your design a catchy name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                                    <textarea
                                        value={shareForm.description}
                                        onChange={(e) => setShareForm({ ...shareForm, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] rounded-xl text-white resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all placeholder-slate-600"
                                        rows={4}
                                        placeholder="Explain the purpose and layout of your architecture..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Complexity</label>
                                        <div className="relative">
                                            <select
                                                value={shareForm.difficulty}
                                                onChange={(e) => setShareForm({ ...shareForm, difficulty: e.target.value as any })}
                                                className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                                            >
                                                <option value="easy">Beginner</option>
                                                <option value="medium">Intermediate</option>
                                                <option value="hard">Advanced</option>
                                            </select>
                                            <ChevronRight className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Tags</label>
                                        <input
                                            type="text"
                                            value={shareForm.tags}
                                            onChange={(e) => setShareForm({ ...shareForm, tags: e.target.value })}
                                            className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all placeholder-slate-600"
                                            placeholder="aws, microservices, scaling"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6 mt-6 border-t border-white/[0.08]">
                                    <button
                                        onClick={() => setShowShareModal(false)}
                                        className="flex-1 px-4 py-3 bg-white/[0.04] hover:bg-white/[0.08] text-white font-medium rounded-xl transition-all duration-300 border border-white/[0.05]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleShareToCommunity}
                                        disabled={!shareForm.title.trim() || isSharing}
                                        className="flex-[2] px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium rounded-xl disabled:opacity-50 transition-all duration-300 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] flex items-center justify-center gap-2 border border-white/10"
                                    >
                                        {isSharing ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Publishing...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                Publish Design
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

export default function DesignPage() {
    return (
        <ReactFlowProvider>
            <DesignStudio />
        </ReactFlowProvider>
    );
}
