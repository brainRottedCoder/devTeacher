"use client";

import { MainLayout } from "@/components/MainLayout";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
    ArrowLeft,
    MessageSquare,
    Heart,
    Eye,
    Clock,
    CheckCircle2,
    Send,
    Loader2,
    Pin,
    Flame,
    User,
    Edit2,
    Trash2,
} from "lucide-react";
import Link from "next/link";
import { DISCUSSION_CATEGORIES, DiscussionCategory } from "@/types/community.types";
import { useUpdateDiscussion, useDeleteDiscussion } from "@/hooks/useCommunity";

interface Reply {
    id: string;
    discussion_id: string;
    user_id: string;
    parent_id: string | null;
    content: string;
    likes_count: number;
    is_accepted_answer: boolean;
    created_at: string;
    user: {
        id: string;
        name: string | null;
        avatar_url: string | null;
    } | null;
    replies?: Reply[];
}

interface Discussion {
    id: string;
    user_id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
    replies_count: number;
    views_count: number;
    is_pinned: boolean;
    is_hot: boolean;
    created_at: string;
    user: {
        id: string;
        name: string | null;
        avatar_url: string | null;
    } | null;
    replies: Reply[];
}

export default function DiscussionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const discussionId = params.id as string;
    const queryClient = useQueryClient();
    const { user } = useAuth();
    
    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ title: "", content: "", category: "general" as DiscussionCategory, tags: "" });

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [replyContent, setReplyContent] = useState("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);

    const updateDiscussion = useUpdateDiscussion();
    const deleteDiscussion = useDeleteDiscussion();

    const { data: discussion, isLoading } = useQuery<Discussion>({
        queryKey: ["discussion", discussionId],
        queryFn: async () => {
            const res = await fetch(`/api/community/discussions/${discussionId}`);
            if (!res.ok) throw new Error("Failed to fetch discussion");
            return res.json();
        },
    });

    const createReply = useMutation({
        mutationFn: async (data: { content: string; parentId?: string }) => {
            const res = await fetch("/api/community/discussions/replies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    discussionId,
                    content: data.content,
                    parentId: data.parentId,
                }),
            });
            if (!res.ok) throw new Error("Failed to create reply");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["discussion", discussionId] });
            setReplyContent("");
            setReplyingTo(null);
        },
    });

    const likeMutation = useMutation({
        mutationFn: async (replyId: string) => {
            const res = await fetch("/api/community/like", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "reply", id: replyId }),
            });
            if (!res.ok) throw new Error("Failed to like");
            return res.json();
        },
    });

    const handleReply = () => {
        if (!replyContent.trim()) return;
        createReply.mutate({ content: replyContent, parentId: replyingTo || undefined });
    };

    const handleEditStart = () => {
        if (!discussion) return;
        setEditData({
            title: discussion.title,
            content: discussion.content,
            category: discussion.category as DiscussionCategory,
            tags: discussion.tags.join(", ")
        });
        setIsEditing(true);
    };

    const handleEditSubmit = async () => {
        if (!editData.title.trim() || !editData.content.trim()) return;
        try {
            await updateDiscussion.mutateAsync({
                id: discussionId,
                title: editData.title,
                content: editData.content,
                category: editData.category,
                tags: editData.tags.split(",").map(t => t.trim()).filter(Boolean)
            });
            setIsEditing(false);
        } catch (error: any) {
            alert(error.message || "Failed to update discussion");
        }
    };

    const handleDelete = async () => {
        try {
            await deleteDiscussion.mutateAsync(discussionId);
            setShowDeleteModal(false);
            router.push("/community");
        } catch (error: any) {
            alert(error.message || "Failed to delete discussion");
            setShowDeleteModal(false);
        }
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

    if (!discussion) {
        return (
            <MainLayout>
                <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-white mb-2">Discussion not found</h2>
                        <Link href="/community" className="text-violet-400 hover:text-violet-300">
                            Back to Community
                        </Link>
                    </div>
                </div>
            </MainLayout>
        );
    }

    const categoryLabel = DISCUSSION_CATEGORIES.find((c) => c.value === discussion.category)?.label || discussion.category;

    return (
        <MainLayout>
            <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <Link
                        href="/community"
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Community
                    </Link>

                    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 mb-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-2">
                                {discussion.is_pinned && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-violet-500/20 text-violet-400">
                                        <Pin className="w-3 h-3" />
                                        Pinned
                                    </span>
                                )}
                                {discussion.is_hot && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-500/20 text-orange-400">
                                        <Flame className="w-3 h-3" />
                                        Hot
                                    </span>
                                )}
                                <span className="px-2 py-0.5 rounded-full text-xs bg-gray-800 text-gray-400">
                                    {categoryLabel}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Eye className="w-4 h-4" />
                                    {discussion.views_count}
                                </span>
                                <span className="flex items-center gap-1">
                                    <MessageSquare className="w-4 h-4" />
                                    {discussion.replies_count}
                                </span>
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold text-white mb-4">{discussion.title}</h1>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-medium">
                                {discussion.user?.name?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
                            </div>
                            <div className="flex-1">
                                <div className="text-white font-medium">{discussion.user?.name || "Anonymous"}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {getTimeAgo(discussion.created_at)}
                                </div>
                            </div>
                            {user && user.id === discussion.user_id && (
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={handleEditStart}
                                        className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
                                        title="Edit Discussion"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => setShowDeleteModal(true)}
                                        className="p-2 bg-gray-800 hover:bg-red-900/40 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                                        title="Delete Discussion"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="mb-6 p-4 rounded-xl border border-violet-500/30 bg-gray-800/50">
                                <input
                                    type="text"
                                    value={editData.title}
                                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                    className="w-full mb-3 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                                    placeholder="Discussion Title"
                                />
                                <div className="flex gap-3 mb-3">
                                    <select
                                        value={editData.category}
                                        onChange={(e) => setEditData({ ...editData, category: e.target.value as DiscussionCategory })}
                                        className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                                    >
                                        {DISCUSSION_CATEGORIES.map((cat) => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        value={editData.tags}
                                        onChange={(e) => setEditData({ ...editData, tags: e.target.value })}
                                        className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                                        placeholder="Tags (comma separated)"
                                    />
                                </div>
                                <textarea
                                    value={editData.content}
                                    onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                                    className="w-full mb-3 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white h-32 resize-none"
                                    placeholder="Share your thoughts..."
                                />
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleEditSubmit}
                                        disabled={updateDiscussion.isPending}
                                        className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg disabled:opacity-50 transition-colors"
                                    >
                                        {updateDiscussion.isPending ? "Saving..." : "Save Changes"}
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="prose prose-invert max-w-none">
                                    <p className="text-gray-300 whitespace-pre-wrap">{discussion.content}</p>
                                </div>

                                {discussion.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-4">
                                        {discussion.tags.map((tag) => (
                                            <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-gray-800 text-gray-400">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="mb-6 p-4 rounded-xl border border-gray-800 bg-gray-900/50">
                        <h3 className="text-sm font-medium text-white mb-3">
                            {replyingTo ? "Reply to comment" : "Add a reply"}
                        </h3>
                        <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Share your thoughts..."
                            rows={3}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none"
                        />
                        <div className="flex items-center gap-3 mt-3">
                            <button
                                onClick={handleReply}
                                disabled={!replyContent.trim() || createReply.isPending}
                                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                <Send className="w-4 h-4" />
                                {createReply.isPending ? "Posting..." : "Post Reply"}
                            </button>
                            {replyingTo && (
                                <button
                                    onClick={() => setReplyingTo(null)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">
                            {discussion.replies?.length || 0} Replies
                        </h3>

                        {discussion.replies?.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No replies yet. Be the first to respond!</p>
                        ) : (
                            discussion.replies?.map((reply) => (
                                <ReplyItem
                                    key={reply.id}
                                    reply={reply}
                                    onReply={(id) => {
                                        setReplyingTo(id);
                                    }}
                                    onLike={() => likeMutation.mutate(reply.id)}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-2">Delete Discussion</h3>
                        <p className="text-gray-400 mb-6">
                            Are you sure you want to delete this discussion? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={deleteDiscussion.isPending}
                                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleteDiscussion.isPending}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2"
                            >
                                {deleteDiscussion.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}

function ReplyItem({
    reply,
    onReply,
    onLike,
    depth = 0,
}: {
    reply: Reply;
    onReply: (id: string) => void;
    onLike: () => void;
    depth?: number;
}) {
    return (
        <div className={`${depth > 0 ? "ml-8 border-l border-gray-800 pl-4" : ""}`}>
            <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/30">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                            {reply.user?.name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                        </div>
                        <div>
                            <span className="text-white font-medium text-sm">{reply.user?.name || "Anonymous"}</span>
                            {reply.is_accepted_answer && (
                                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400">
                                    <CheckCircle2 className="w-3 h-3 inline mr-1" />
                                    Accepted
                                </span>
                            )}
                        </div>
                    </div>
                    <span className="text-xs text-gray-500">{getTimeAgo(reply.created_at)}</span>
                </div>

                <p className="text-gray-300 text-sm mb-3">{reply.content}</p>

                <div className="flex items-center gap-4">
                    <button
                        onClick={onLike}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors"
                    >
                        <Heart className="w-3.5 h-3.5" />
                        {reply.likes_count}
                    </button>
                    <button
                        onClick={() => onReply(reply.id)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-violet-400 transition-colors"
                    >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Reply
                    </button>
                </div>
            </div>

            {reply.replies?.map((nestedReply) => (
                <ReplyItem
                    key={nestedReply.id}
                    reply={nestedReply}
                    onReply={onReply}
                    onLike={onLike}
                    depth={depth + 1}
                />
            ))}
        </div>
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
