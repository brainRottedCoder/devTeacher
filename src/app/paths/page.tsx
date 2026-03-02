"use client";

import { MainLayout } from "@/components/MainLayout";
import { useState, useCallback } from "react";
import { useCustomPaths, usePathBuilder, usePathTemplates, usePathRecommendations } from "@/hooks/useCustomPaths";
import { useAuth } from "@/hooks/useAuth";
import {
    Route,
    Plus,
    Search,
    Filter,
    Clock,
    BookOpen,
    CheckCircle2,
    Lock,
    Play,
    GripVertical,
    Trash2,
    ChevronUp,
    ChevronDown,
    Sparkles,
    Copy,
    Share2,
    MoreVertical,
    Loader2,
    X,
    Target,
    Zap,
} from "lucide-react";
import { PATH_ITEM_TYPES, PATH_STATUS_COLORS } from "@/types/custom-path.types";
import { ROLE_LABELS, ROLE_COLORS, ROLE_ICONS } from "@/types/learning-path.types";

type ViewType = "browse" | "create" | "my-paths";

export default function LearningPathsPage() {
    const { user } = useAuth();
    const [view, setView] = useState<ViewType>("browse");
    const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterRole, setFilterRole] = useState<string>("");

    const { paths, isLoading, createPath, deletePath } = useCustomPaths({ userId: user?.id });
    const { templates } = usePathTemplates({ role: filterRole || undefined });
    const { recommendations } = usePathRecommendations();
    const builder = usePathBuilder();

    const [newItemType, setNewItemType] = useState<"module" | "quiz" | "lab" | "project" | "assessment">("module");
    const [newItemId, setNewItemId] = useState("");
    const [newItemTitle, setNewItemTitle] = useState("");
    const [newItemMinutes, setNewItemMinutes] = useState(60);

    const handleAddItem = () => {
        if (!newItemId.trim()) return;
        builder.addItem({
            type: newItemType,
            item_id: newItemId,
            is_required: true,
            estimated_minutes: newItemMinutes,
            metadata: { title: newItemTitle || `${newItemType} ${builder.items.length + 1}` },
        });
        setNewItemId("");
        setNewItemTitle("");
        setNewItemMinutes(60);
    };

    const handleCreatePath = async () => {
        if (!builder.isValid) return;
        await createPath.mutateAsync({
            name: builder.name,
            description: builder.description,
            items: builder.items,
            is_public: false,
        });
        builder.reset();
        setView("my-paths");
    };

    const handleUseTemplate = (template: any) => {
        builder.setName(template.name);
        builder.setDescription(template.description);
        template.items.forEach((item: any) => {
            builder.addItem({
                type: item.type,
                item_id: item.item_id,
                is_required: item.is_required,
                estimated_minutes: item.estimated_minutes,
            });
        });
        setView("create");
    };

    const filteredPaths = paths.filter(path => {
        if (searchQuery && !path.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    return (
        <MainLayout>
            <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1">Learning Paths</h1>
                            <p className="text-gray-400">Create custom learning journeys tailored to your goals</p>
                        </div>
                        <button
                            onClick={() => {
                                builder.reset();
                                setView("create");
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium hover:from-violet-500 hover:to-indigo-500 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Create Path
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 p-1 bg-gray-800/50 rounded-xl w-fit mb-8">
                        {[
                            { id: "browse", label: "Browse Templates", icon: <Search className="w-4 h-4" /> },
                            { id: "my-paths", label: "My Paths", icon: <Route className="w-4 h-4" /> },
                            { id: "create", label: "Create New", icon: <Plus className="w-4 h-4" /> },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setView(tab.id as ViewType)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    view === tab.id
                                        ? "bg-violet-600 text-white shadow-lg"
                                        : "text-gray-400 hover:text-white"
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Browse View */}
                    {view === "browse" && (
                        <div>
                            {/* Recommendations */}
                            {recommendations.length > 0 && (
                                <div className="mb-8">
                                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-amber-400" />
                                        Recommended for You
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {recommendations.map((rec) => (
                                            <div key={rec.path_id} className="p-4 rounded-xl border border-violet-500/20 bg-violet-500/5">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h3 className="text-white font-semibold">{rec.path.name}</h3>
                                                    <span className="text-violet-400 text-sm">{Math.round(rec.relevance_score * 100)}% match</span>
                                                </div>
                                                <p className="text-gray-400 text-sm mb-3">{rec.reason}</p>
                                                <div className="flex items-center gap-2">
                                                    {rec.missing_skills.slice(0, 2).map((skill) => (
                                                        <span key={skill} className="px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400">
                                                            +{skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Filters */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="relative flex-1 max-w-xs">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Search templates..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm"
                                    />
                                </div>
                                <select
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}
                                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                                >
                                    <option value="">All Roles</option>
                                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Templates Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {templates.map((template) => (
                                    <div key={template.id} className="group rounded-xl border border-gray-800 bg-gray-900/50 p-5 hover:border-violet-500/30 transition-all">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="text-white font-semibold mb-1">{template.name}</h3>
                                                <p className="text-gray-500 text-sm line-clamp-2">{template.description}</p>
                                            </div>
                                            {template.is_popular && (
                                                <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400">Popular</span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 mb-4 text-sm text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                {template.estimated_hours}h
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <BookOpen className="w-3.5 h-3.5" />
                                                {template.items.length} items
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-1.5 mb-4">
                                            {template.outcomes.slice(0, 3).map((outcome, i) => (
                                                <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-gray-800 text-gray-400">
                                                    {outcome}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleUseTemplate(template)}
                                                className="flex-1 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
                                            >
                                                Use Template
                                            </button>
                                            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* My Paths View */}
                    {view === "my-paths" && (
                        <div>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                                </div>
                            ) : filteredPaths.length === 0 ? (
                                <div className="text-center py-20">
                                    <Route className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                    <h2 className="text-xl font-bold text-white mb-2">No learning paths yet</h2>
                                    <p className="text-gray-400 mb-6">Create your first custom learning path</p>
                                    <button
                                        onClick={() => setView("create")}
                                        className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
                                    >
                                        Create Path
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredPaths.map((path) => (
                                        <div key={path.id} className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 hover:border-violet-500/30 transition-all">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-lg font-semibold text-white">{path.name}</h3>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs ${path.is_public ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-400'}`}>
                                                            {path.is_public ? 'Public' : 'Private'}
                                                        </span>
                                                    </div>
                                                    {path.description && (
                                                        <p className="text-gray-400 text-sm mb-3">{path.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <BookOpen className="w-4 h-4" />
                                                            {path.items.length} items
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            {path.estimated_hours}h
                                                        </span>
                                                        {path.user_progress && (
                                                            <>
                                                                <span className={`px-2 py-0.5 rounded-full text-xs ${PATH_STATUS_COLORS[path.user_progress.status]}`}>
                                                                    {path.user_progress.status.replace('_', ' ')}
                                                                </span>
                                                                <span className="text-violet-400">{path.user_progress.total_progress}% complete</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {path.user_progress?.status !== 'completed' && (
                                                        <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors">
                                                            <Play className="w-4 h-4" />
                                                            {path.user_progress?.status === 'in_progress' ? 'Continue' : 'Start'}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => deletePath.mutate(path.id)}
                                                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Progress Items */}
                                            {path.user_progress && (
                                                <div className="mt-4 pt-4 border-t border-gray-800">
                                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                                        {path.items.map((item, index) => {
                                                            const progress = path.user_progress?.item_progress.find(p => p.item_id === item.id);
                                                            return (
                                                                <div
                                                                    key={item.id}
                                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg flex-shrink-0 ${
                                                                        progress?.status === 'completed' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                                                                        progress?.status === 'in_progress' ? 'bg-amber-500/10 border border-amber-500/20' :
                                                                        'bg-gray-800 border border-gray-700'
                                                                    }`}
                                                                >
                                                                    {progress?.status === 'completed' ? (
                                                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                                    ) : progress?.status === 'in_progress' ? (
                                                                        <Play className="w-4 h-4 text-amber-400" />
                                                                    ) : (
                                                                        <Lock className="w-4 h-4 text-gray-500" />
                                                                    )}
                                                                    <span className="text-sm text-white truncate max-w-24">
                                                                        {item.metadata?.title || `Item ${index + 1}`}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Create View */}
                    {view === "create" && (
                        <div className="grid grid-cols-3 gap-6">
                            {/* Builder Form */}
                            <div className="col-span-2 space-y-6">
                                <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
                                    <h2 className="text-lg font-bold text-white mb-4">Path Details</h2>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Path Name</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., Full-Stack Developer Journey"
                                                value={builder.name}
                                                onChange={(e) => builder.setName(e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Description</label>
                                            <textarea
                                                placeholder="Describe what learners will achieve..."
                                                value={builder.description}
                                                onChange={(e) => builder.setDescription(e.target.value)}
                                                rows={3}
                                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Add Item */}
                                <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
                                    <h2 className="text-lg font-bold text-white mb-4">Add Learning Item</h2>
                                    <div className="grid grid-cols-4 gap-3 mb-4">
                                        {PATH_ITEM_TYPES.map((type) => (
                                            <button
                                                key={type.value}
                                                onClick={() => setNewItemType(type.value)}
                                                className={`p-3 rounded-xl border transition-all ${
                                                    newItemType === type.value
                                                        ? 'border-violet-500 bg-violet-500/10'
                                                        : 'border-gray-700 hover:border-gray-600'
                                                }`}
                                            >
                                                <span className="text-xl mb-1 block">{type.icon}</span>
                                                <span className="text-xs text-white">{type.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <input
                                            type="text"
                                            placeholder="Item ID"
                                            value={newItemId}
                                            onChange={(e) => setNewItemId(e.target.value)}
                                            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Title"
                                            value={newItemTitle}
                                            onChange={(e) => setNewItemTitle(e.target.value)}
                                            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm"
                                        />
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                placeholder="Minutes"
                                                value={newItemMinutes}
                                                onChange={(e) => setNewItemMinutes(parseInt(e.target.value) || 60)}
                                                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm"
                                            />
                                            <button
                                                onClick={handleAddItem}
                                                disabled={!newItemId.trim()}
                                                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg disabled:opacity-50 transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Items List */}
                                <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-bold text-white">Path Items ({builder.items.length})</h2>
                                        <span className="text-gray-400 text-sm">{builder.totalHours} hours total</span>
                                    </div>
                                    {builder.items.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            Add items to your learning path
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {builder.items.map((item, index) => (
                                                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                                                    <GripVertical className="w-4 h-4 text-gray-500 cursor-grab" />
                                                    <span className="text-lg">
                                                        {PATH_ITEM_TYPES.find(t => t.value === item.type)?.icon}
                                                    </span>
                                                    <div className="flex-1">
                                                        <p className="text-white font-medium">
                                                            {item.metadata?.title || `Item ${index + 1}`}
                                                        </p>
                                                        <p className="text-gray-500 text-xs">
                                                            {item.type} • {item.estimated_minutes} min
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => builder.moveItem(item.id, 'up')}
                                                        disabled={index === 0}
                                                        className="p-1 text-gray-500 hover:text-white disabled:opacity-30"
                                                    >
                                                        <ChevronUp className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => builder.moveItem(item.id, 'down')}
                                                        disabled={index === builder.items.length - 1}
                                                        className="p-1 text-gray-500 hover:text-white disabled:opacity-30"
                                                    >
                                                        <ChevronDown className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => builder.removeItem(item.id)}
                                                        className="p-1 text-gray-500 hover:text-red-400"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-6">
                                <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 sticky top-6">
                                    <h3 className="text-lg font-bold text-white mb-4">Summary</h3>
                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Total Items</span>
                                            <span className="text-white font-medium">{builder.items.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Estimated Time</span>
                                            <span className="text-white font-medium">{builder.totalHours} hours</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <button
                                            onClick={handleCreatePath}
                                            disabled={!builder.isValid || createPath.isPending}
                                            className="w-full px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium rounded-xl disabled:opacity-50 transition-all"
                                        >
                                            {createPath.isPending ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Creating...
                                                </span>
                                            ) : (
                                                'Create Learning Path'
                                            )}
                                        </button>
                                        <button
                                            onClick={() => { builder.reset(); setView("browse"); }}
                                            className="w-full px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>

                                    {/* Quick Tips */}
                                    <div className="mt-6 pt-6 border-t border-gray-800">
                                        <h4 className="text-sm font-medium text-white mb-3">Tips</h4>
                                        <ul className="space-y-2 text-xs text-gray-500">
                                            <li className="flex items-start gap-2">
                                                <Target className="w-3.5 h-3.5 text-violet-400 mt-0.5" />
                                                Start with basics, progress to advanced
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <Zap className="w-3.5 h-3.5 text-amber-400 mt-0.5" />
                                                Mix modules with hands-on labs
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5" />
                                                Add assessments to track progress
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
