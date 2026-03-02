"use client";

import { useEffect, useState } from "react";
import { UserAchievement } from "@/types/achievements.types";
import { BADGE_ICONS, CATEGORY_COLORS } from "@/types/achievements.types";

interface AchievementToastProps {
    achievement: UserAchievement;
    xpReward?: number;
    onClose: () => void;
}

function SingleToast({ achievement, xpReward = 50, onClose }: AchievementToastProps) {
    const [visible, setVisible] = useState(false);
    const ach = achievement.achievement;

    useEffect(() => {
        // Animate in
        const inTimer = setTimeout(() => setVisible(true), 50);
        // Animate out after 5s
        const outTimer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 400);
        }, 5000);
        return () => { clearTimeout(inTimer); clearTimeout(outTimer); };
    }, [onClose]);

    if (!ach) return null;

    const icon = BADGE_ICONS[ach.name] || ach.icon || "🏆";
    const colorClass = CATEGORY_COLORS[ach.category] || "bg-violet-500/20 text-violet-400 border-violet-500/30";

    return (
        <div
            className={`
                flex items-center gap-4 px-5 py-4 rounded-2xl border backdrop-blur-sm shadow-2xl
                bg-gray-900/95 border-white/10 min-w-[300px] max-w-[380px]
                transition-all duration-400 ease-out
                ${visible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"}
            `}
        >
            {/* Icon */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 border ${colorClass}`}>
                {icon}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">
                        Achievement Unlocked!
                    </p>
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full border border-amber-500/30">
                        +{xpReward} XP
                    </span>
                </div>
                <p className="text-white font-semibold text-sm leading-tight">{ach.name}</p>
                <p className="text-gray-400 text-xs mt-0.5 truncate">{ach.description}</p>
            </div>

            {/* Close */}
            <button
                onClick={() => { setVisible(false); setTimeout(onClose, 400); }}
                className="text-gray-600 hover:text-gray-400 transition-colors flex-shrink-0 text-sm"
            >
                ✕
            </button>
        </div>
    );
}

interface AchievementToastContainerProps {
    newlyUnlocked: UserAchievement[];
}

export function AchievementToast({ newlyUnlocked }: AchievementToastContainerProps) {
    const [queue, setQueue] = useState<UserAchievement[]>([]);

    useEffect(() => {
        if (newlyUnlocked.length > 0) {
            setQueue(newlyUnlocked);
        }
    }, [newlyUnlocked]);

    const removeFirst = () => {
        setQueue((prev) => prev.slice(1));
    };

    if (queue.length === 0) return null;

    const XP_BY_CATEGORY: Record<string, number> = {
        learning: 50, streak: 75, quiz: 60,
        interview: 100, design: 80, community: 120,
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
            {queue.slice(0, 3).map((ua) => (
                <div key={ua.id} className="pointer-events-auto">
                    <SingleToast
                        achievement={ua}
                        xpReward={XP_BY_CATEGORY[ua.achievement?.category || "learning"] || 50}
                        onClose={removeFirst}
                    />
                </div>
            ))}
        </div>
    );
}
