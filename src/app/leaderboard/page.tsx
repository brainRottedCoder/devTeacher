"use client";

import { MainLayout } from "@/components/MainLayout";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useAchievements } from "@/hooks/useAchievements";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import {
    Trophy, Flame, Zap, Shield, Star, Medal,
    Crown, ChevronUp, Eye, EyeOff, User
} from "lucide-react";

const LEVEL_TITLES: Record<number, string> = {
    1: "Novice", 2: "Apprentice", 3: "Learner", 4: "Developer",
    5: "Engineer", 7: "Senior Dev", 10: "Architect", 15: "Tech Lead",
    20: "Staff Eng", 30: "Principal",
};

function getLevelTitle(level: number): string {
    const keys = Object.keys(LEVEL_TITLES).map(Number).sort((a, b) => b - a);
    return LEVEL_TITLES[keys.find((k) => level >= k) || 1];
}

function RankBadge({ rank }: { rank: number }) {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="text-sm font-mono text-gray-500 w-5 text-center">#{rank}</span>;
}

export default function LeaderboardPage() {
    const { entries, currentUserRank, isLoading, refetch } = useLeaderboard();
    const { leaderboardVisible, refetch: refetchAchievements } = useAchievements();
    const { user } = useAuth();
    const [toggling, setToggling] = useState(false);
    const [isVisible, setIsVisible] = useState(leaderboardVisible);
    const [displayNameInput, setDisplayNameInput] = useState("");
    const [savingName, setSavingName] = useState(false);

    const toggleVisibility = async () => {
        setToggling(true);
        try {
            const res = await fetch("/api/user/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ leaderboard_visible: !isVisible }),
            });
            if (res.ok) {
                setIsVisible(!isVisible);
                refetch();
                refetchAchievements();
            }
        } finally {
            setToggling(false);
        }
    };

    const saveDisplayName = async () => {
        if (!displayNameInput.trim()) return;
        setSavingName(true);
        try {
            await fetch("/api/user/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ display_name: displayNameInput.trim() }),
            });
            refetch();
        } finally {
            setSavingName(false);
            setDisplayNameInput("");
        }
    };

    return (
        <MainLayout>
            <div className="min-h-screen relative">
                <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8">

                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <Trophy className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-heading font-bold text-white">Leaderboard</h1>
                                <p className="text-slate-500 text-sm">Top learners ranked by XP</p>
                            </div>
                        </div>
                    </div>

                    {/* Your Stats + Opt-in card */}
                    {user && (
                        <div className="glass-card p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="flex items-center gap-3 flex-1">
                                <div className="w-9 h-9 rounded-full bg-accent-violet/20 flex items-center justify-center">
                                    <User className="w-4 h-4 text-accent-violet" />
                                </div>
                                <div>
                                    <p className="text-white text-sm font-medium">
                                        {user.email?.split("@")[0]}
                                    </p>
                                    {currentUserRank ? (
                                        <p className="text-accent-amber text-xs">Your rank: #{currentUserRank}</p>
                                    ) : (
                                        <p className="text-slate-500 text-xs">
                                            {isVisible ? "You are on the leaderboard" : "Hidden from leaderboard"}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Display name input */}
                            <div className="flex items-center gap-2">
                                <input
                                    value={displayNameInput}
                                    onChange={(e) => setDisplayNameInput(e.target.value)}
                                    placeholder="Set display name…"
                                    className="text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-slate-600 w-36 focus:outline-none focus:border-accent-violet/40"
                                    maxLength={30}
                                    onKeyDown={(e) => e.key === "Enter" && saveDisplayName()}
                                />
                                {displayNameInput && (
                                    <button
                                        onClick={saveDisplayName}
                                        disabled={savingName}
                                        className="text-xs px-3 py-2 bg-accent-violet/20 text-accent-violet rounded-lg border border-accent-violet/30 hover:bg-accent-violet/30 transition-colors"
                                    >
                                        {savingName ? "…" : "Save"}
                                    </button>
                                )}
                            </div>

                            {/* Visibility toggle */}
                            <button
                                onClick={toggleVisibility}
                                disabled={toggling}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border transition-all ${isVisible
                                        ? "bg-accent-emerald/10 text-accent-emerald border-accent-emerald/30 hover:bg-accent-emerald/20"
                                        : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
                                    }`}
                            >
                                {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                {isVisible ? "Visible" : "Hidden"}
                            </button>
                        </div>
                    )}

                    {/* Leaderboard table */}
                    <div className="glass-card overflow-hidden">
                        {/* Table header */}
                        <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-white/[0.06] text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                            <div className="col-span-1">Rank</div>
                            <div className="col-span-4">Developer</div>
                            <div className="col-span-2 text-right">Level</div>
                            <div className="col-span-2 text-right">XP</div>
                            <div className="col-span-2 text-right">Streak</div>
                            <div className="col-span-1 text-right">Badges</div>
                        </div>

                        {/* Loading */}
                        {isLoading && (
                            <div className="py-16 flex items-center justify-center">
                                <div className="w-8 h-8 border-2 border-white/10 border-t-accent-violet rounded-full animate-spin" />
                            </div>
                        )}

                        {/* Empty */}
                        {!isLoading && entries.length === 0 && (
                            <div className="py-16 text-center">
                                <Trophy className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                                <p className="text-slate-500 text-sm">No public entries yet.</p>
                                <p className="text-slate-600 text-xs mt-1">Be the first! Toggle your visibility above.</p>
                            </div>
                        )}

                        {/* Rows */}
                        {!isLoading && entries.map((entry) => (
                            <div
                                key={entry.rank}
                                className={`grid grid-cols-12 gap-2 px-5 py-3.5 border-b border-white/[0.04] items-center transition-colors hover:bg-white/[0.02] ${entry.is_current_user ? "bg-accent-violet/5 border-l-2 border-l-accent-violet" : ""
                                    } ${entry.rank <= 3 ? "bg-amber-500/[0.03]" : ""}`}
                            >
                                {/* Rank */}
                                <div className="col-span-1 flex items-center">
                                    <RankBadge rank={entry.rank} />
                                </div>

                                {/* Name */}
                                <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-violet/30 to-accent-indigo/30 flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs text-accent-violet font-bold">
                                            {entry.display_name[0].toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-sm font-medium truncate ${entry.is_current_user ? "text-accent-violet" : "text-white"}`}>
                                            {entry.display_name}
                                            {entry.is_current_user && <span className="text-xs ml-1 text-slate-500">(you)</span>}
                                        </p>
                                        <p className="text-[10px] text-slate-600">{getLevelTitle(entry.level)}</p>
                                    </div>
                                </div>

                                {/* Level */}
                                <div className="col-span-2 text-right">
                                    <span className="text-xs font-mono text-slate-300">Lv.{entry.level}</span>
                                </div>

                                {/* XP */}
                                <div className="col-span-2 text-right flex items-center justify-end gap-1">
                                    <Zap className="w-3 h-3 text-amber-400" />
                                    <span className="text-sm font-mono font-bold text-amber-400">{entry.xp.toLocaleString()}</span>
                                </div>

                                {/* Streak */}
                                <div className="col-span-2 text-right flex items-center justify-end gap-1">
                                    <Flame className="w-3 h-3 text-orange-400" />
                                    <span className="text-xs text-orange-300">{entry.streak}d</span>
                                </div>

                                {/* Badges */}
                                <div className="col-span-1 text-right">
                                    <span className="text-xs text-slate-400">{entry.badge_count}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <p className="text-center text-slate-600 text-xs mt-4">
                        Only users who opt-in are shown. Privacy is the default.
                    </p>
                </div>
            </div>
        </MainLayout>
    );
}
