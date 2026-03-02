"use client";

import { MainLayout } from "@/components/MainLayout";
import { useState } from "react";
import { useSharedDesigns, useDiscussions, useLeaderboard, useCommunityStats, useCreateDiscussion, useLike } from "@/hooks/useCommunity";
import Link from "next/link";
import {
    Users,
    Share2,
    MessageSquare,
    Trophy,
    ArrowRight,
    Clock,
    Plus,
    Heart,
    Eye,
    TrendingUp,
    Loader2,
} from "lucide-react";
import { DISCUSSION_CATEGORIES, DESIGN_DIFFICULTY_LABELS } from "@/types/community.types";

export default function CommunityPage() {
    const [activeTab, setActiveTab] = useState<"designs" | "discussions" | "leaderboard">("designs");
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [sortBy, setSortBy] = useState<string>("trending");
    const [showNewDiscussion, setShowNewDiscussion] = useState(false);

    const { designs, isLoading: loadingDesigns } = useSharedDesigns({ sortBy, limit: 20 });
    const { discussions, isLoading: loadingDiscussions } = useDiscussions({ category: selectedCategory as any, limit: 20 });
    const { leaderboard, isLoading: loadingLeaderboard } = useLeaderboard('month');
    const { stats } = useCommunityStats();
    const createDiscussion = useCreateDiscussion();
    const like = useLike();

    const [newDiscussion, setNewDiscussion] = useState({
        title: '',
        content: '',
        category: 'general' as const,
        tags: '',
    });

    const handleCreateDiscussion = async () => {
        if (!newDiscussion.title || !newDiscussion.content) return;
        
        await createDiscussion.mutateAsync({
            title: newDiscussion.title,
            content: newDiscussion.content,
            category: newDiscussion.category,
            tags: newDiscussion.tags.split(',').map(t => t.trim()).filter(Boolean),
        });
        
        setNewDiscussion({ title: '', content: '', category: 'general', tags: '' });
        setShowNewDiscussion(false);
    };

    const handleLike = async (type: 'design' | 'discussion' | 'reply', id: string) => {
        await like.mutateAsync({ type, id });
    };

    return (
        <MainLayout>
            <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
                <div className="pt-12 pb-8 px-4 max-w-6xl mx-auto">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="w-8 h-8 text-violet-400" />
                        <h1 className="text-3xl font-bold text-white">Community</h1>
                    </div>
                    <p className="text-gray-400">Share designs, discuss architecture, and compete with peers</p>
                </div>

                {stats && (
                    <div className="max-w-6xl mx-auto px-4 mb-8">
                        <div className="grid grid-cols-4 gap-4">
                            {[
                                { label: "Designs", value: stats.totalDesigns, icon: <Share2 className="w-5 h-5 text-violet-400" /> },
                                { label: "Discussions", value: stats.totalDiscussions, icon: <MessageSquare className="w-5 h-5 text-amber-400" /> },
                                { label: "Members", value: stats.totalUsers, icon: <Users className="w-5 h-5 text-emerald-400" /> },
                                { label: "Active Today", value: stats.activeToday, icon: <TrendingUp className="w-5 h-5 text-cyan-400" /> },
                            ].map((stat) => (
                                <div key={stat.label} className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 flex items-center gap-3">
                                    {stat.icon}
                                    <div>
                                        <div className="text-xl font-bold text-white">{stat.value.toLocaleString()}</div>
                                        <div className="text-xs text-gray-500">{stat.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="max-w-6xl mx-auto px-4 mb-8">
                    <div className="flex gap-1 p-1 bg-gray-800/50 rounded-xl w-fit">
                        {([
                            { id: "designs", label: "Shared Designs", icon: <Share2 className="w-4 h-4" /> },
                            { id: "discussions", label: "Discussions", icon: <MessageSquare className="w-4 h-4" /> },
                            { id: "leaderboard", label: "Leaderboard", icon: <Trophy className="w-4 h-4" /> },
                        ] as const).map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    activeTab === tab.id
                                        ? "bg-violet-600 text-white shadow-lg"
                                        : "text-gray-400 hover:text-white"
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-4 pb-20">
                    {activeTab === "designs" && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm text-gray-400">{designs.length} shared designs</p>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white"
                                    >
                                        <option value="trending">Trending</option>
                                        <option value="newest">Newest</option>
                                        <option value="most_liked">Most Liked</option>
                                        <option value="most_discussed">Most Discussed</option>
                                    </select>
                                    <button className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors">
                                        <Plus className="w-4 h-4" />
                                        Share Design
                                    </button>
                                </div>
                            </div>

                            {loadingDesigns ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {designs.map((design) => (
                                        <Link key={design.id} href={`/community/design/${design.id}`}>
                                            <div className="group p-5 rounded-xl border border-gray-800 bg-gray-900/50 hover:border-violet-500/30 transition-all cursor-pointer">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-semibold text-white group-hover:text-violet-300 transition-colors mb-1">
                                                            {design.title}
                                                        </h3>
                                                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                                                            <span>by <span className="text-gray-400">{design.user?.name || 'Anonymous'}</span></span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {getTimeAgo(design.created_at)}
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded-full text-xs ${DESIGN_DIFFICULTY_LABELS[design.difficulty]?.bg || ''} ${DESIGN_DIFFICULTY_LABELS[design.difficulty]?.color || ''}`}>
                                                                {design.difficulty}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {design.tags.map((tag) => (
                                                                <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-gray-800 text-gray-400">
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <Heart className="w-4 h-4" />
                                                            {design.likes_count}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <MessageSquare className="w-4 h-4" />
                                                            {design.comments_count}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Eye className="w-4 h-4" />
                                                            {design.views_count}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "discussions" && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white"
                                    >
                                        <option value="">All Categories</option>
                                        {DISCUSSION_CATEGORIES.map((cat) => (
                                            <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={() => setShowNewDiscussion(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    New Discussion
                                </button>
                            </div>

                            {showNewDiscussion && (
                                <div className="mb-6 p-6 rounded-xl border border-violet-500/30 bg-violet-500/5">
                                    <h3 className="text-lg font-semibold text-white mb-4">Start a Discussion</h3>
                                    <input
                                        type="text"
                                        placeholder="Discussion title..."
                                        value={newDiscussion.title}
                                        onChange={(e) => setNewDiscussion({ ...newDiscussion, title: e.target.value })}
                                        className="w-full mb-3 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500"
                                    />
                                    <textarea
                                        placeholder="Share your thoughts..."
                                        value={newDiscussion.content}
                                        onChange={(e) => setNewDiscussion({ ...newDiscussion, content: e.target.value })}
                                        className="w-full mb-3 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 h-24 resize-none"
                                    />
                                    <div className="flex gap-3 mb-4">
                                        <select
                                            value={newDiscussion.category}
                                            onChange={(e) => setNewDiscussion({ ...newDiscussion, category: e.target.value as any })}
                                            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                                        >
                                            {DISCUSSION_CATEGORIES.map((cat) => (
                                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="Tags (comma separated)"
                                            value={newDiscussion.tags}
                                            onChange={(e) => setNewDiscussion({ ...newDiscussion, tags: e.target.value })}
                                            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleCreateDiscussion}
                                            disabled={createDiscussion.isPending}
                                            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg disabled:opacity-50 transition-colors"
                                        >
                                            {createDiscussion.isPending ? 'Creating...' : 'Create Discussion'}
                                        </button>
                                        <button
                                            onClick={() => setShowNewDiscussion(false)}
                                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {loadingDiscussions ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {discussions.map((discussion) => (
                                        <Link key={discussion.id} href={`/community/discussion/${discussion.id}`}>
                                            <div className="group p-5 rounded-xl border border-gray-800 bg-gray-900/50 hover:border-violet-500/30 transition-all cursor-pointer">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {discussion.is_hot && (
                                                                <span className="px-2 py-0.5 rounded-full text-xs bg-orange-500/20 text-orange-400">🔥 Hot</span>
                                                            )}
                                                            {discussion.is_pinned && (
                                                                <span className="px-2 py-0.5 rounded-full text-xs bg-violet-500/20 text-violet-400">📌 Pinned</span>
                                                            )}
                                                            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-800 text-gray-400">
                                                                {DISCUSSION_CATEGORIES.find(c => c.value === discussion.category)?.label || discussion.category}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-base font-medium text-white group-hover:text-violet-300 transition-colors">
                                                            {discussion.title}
                                                        </h3>
                                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                                            <span>by <span className="text-gray-400">{discussion.user?.name || 'Anonymous'}</span></span>
                                                            <span>{getTimeAgo(discussion.created_at)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                                        <span>{discussion.replies_count} replies</span>
                                                        <span>{discussion.views_count} views</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "leaderboard" && (
                        <div>
                            <p className="text-sm text-gray-400 mb-6">Top developers this month</p>
                            {loadingLeaderboard ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                                </div>
                            ) : (
                                <div className="rounded-xl border border-gray-800 overflow-hidden bg-gray-900/50">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-800">
                                                <th className="text-left text-sm font-medium text-gray-400 px-6 py-4 w-16">Rank</th>
                                                <th className="text-left text-sm font-medium text-gray-400 px-4 py-4">Developer</th>
                                                <th className="text-right text-sm font-medium text-gray-400 px-4 py-4">Score</th>
                                                <th className="text-right text-sm font-medium text-gray-400 px-6 py-4">Streak</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {leaderboard.map((entry) => (
                                                <tr key={entry.user_id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                                                    <td className="px-6 py-4 text-lg">
                                                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                                                                {entry.user?.name?.[0]?.toUpperCase() || '?'}
                                                            </div>
                                                            <span className="text-sm font-medium text-white">{entry.user?.name || 'Anonymous'}</span>
                                                            {entry.user?.badges?.map((badge, i) => (
                                                                <span key={i} className="text-sm" title={badge.name}>{badge.icon}</span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="text-right px-4 py-4">
                                                        <span className="text-sm text-violet-400 font-mono">{entry.score.toLocaleString()}</span>
                                                        {entry.change > 0 && (
                                                            <span className="ml-2 text-xs text-green-400">↑{entry.change}</span>
                                                        )}
                                                        {entry.change < 0 && (
                                                            <span className="ml-2 text-xs text-red-400">↓{Math.abs(entry.change)}</span>
                                                        )}
                                                    </td>
                                                    <td className="text-right px-6 py-4">
                                                        <span className="text-sm text-amber-400">🔥 {entry.streak}d</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
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

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}
