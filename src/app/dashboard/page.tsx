"use client";

import { useAuth } from "@/hooks/useAuth";
import { useModules, Module } from "@/hooks/useModules";
import { useProgress, UserProgress } from "@/hooks/useProgress";
import { useAchievements } from "@/hooks/useAchievements";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { AchievementToast } from "@/components/gamification/AchievementToast";
import { MainLayout } from "@/components/MainLayout";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Flame,
  BookOpen,
  TrendingUp,
  Shield,
  Sparkles,
  ArrowRight,
  Clock,
  Code2,
  Terminal,
  CheckCircle2,
  User,
  Zap,
  Trophy,
} from "lucide-react";

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: progressData, isLoading: progressLoading } = useProgress();
  const { data: modulesData, isLoading: modulesLoading } = useModules();
  const {
    userAchievements,
    newlyUnlocked,
    xp,
    level,
    xpProgressPct,
    currentStreak: serverStreak,
    isLoading: achievementsLoading,
  } = useAchievements();
  const { currentUserRank } = useLeaderboard();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (authLoading || progressLoading || modulesLoading || achievementsLoading || !mounted) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="relative">
            <div className="w-14 h-14 border-[3px] border-white/[0.06] rounded-full" />
            <div className="absolute inset-0 w-14 h-14 border-[3px] border-transparent border-t-accent-violet rounded-full animate-spin" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="glass-card p-10 text-center max-w-sm">
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-accent-violet/10 flex items-center justify-center">
              <User className="w-7 h-7 text-accent-violet" />
            </div>
            <h2 className="text-xl font-heading font-bold text-white mb-2">
              Sign in to continue
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Access your personalized learning dashboard
            </p>
            <Link href="/auth/login" className="btn-primary inline-flex">
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const progress = progressData || [];
  const modules = modulesData || [];

  const completedModuleIds = new Set(
    progress
      .filter((p: UserProgress) => p.status === "completed")
      .map((p: UserProgress) => p.module_id)
  );
  const completedModules = completedModuleIds.size;
  const totalModules = modules.length;

  const inProgressModules = new Set(
    progress
      .filter((p: UserProgress) => p.status === "in_progress")
      .map((p: UserProgress) => p.module_id)
  ).size;

  const totalLessonsViewed = progress.length;
  const avgProgress =
    totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  const recentActivity = progress.slice(0, 5);

  const calculateStreak = () => {
    if (progress.length === 0) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activityDates = [
      ...new Set(progress.map((p: UserProgress) => new Date(p.updated_at).toDateString())),
    ]
      .map((d) => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime());
    if (activityDates.length === 0) return 0;
    const last = activityDates[0];
    last.setHours(0, 0, 0, 0);
    if (
      Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)) > 1
    )
      return 0;
    let streak = 1;
    for (let i = 1; i < activityDates.length; i++) {
      const diff = Math.floor(
        (activityDates[i - 1].getTime() - activityDates[i].getTime()) /
        (1000 * 60 * 60 * 24)
      );
      if (diff === 1) streak++;
      else break;
    }
    return streak;
  };

  const currentStreak = serverStreak > 0 ? serverStreak : calculateStreak();
  const badgeCount = userAchievements.length;

  return (
    <>
      <AchievementToast newlyUnlocked={newlyUnlocked} />
      <MainLayout>
        <div className="min-h-screen relative">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Greeting */}
            <div className="mb-8 opacity-0 animate-slide-up">
              <div className="flex items-center gap-4 mb-1">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent-violet to-accent-indigo flex items-center justify-center shadow-lg shadow-accent-violet/20">
                  <span className="text-white text-sm font-heading font-bold">
                    {user.email?.[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-heading font-bold text-white tracking-tight">
                    Welcome back,{" "}
                    <span className="text-gradient">
                      {user.email?.split("@")[0]}
                    </span>
                  </h1>
                  <p className="text-slate-500 text-sm">
                    Continue your learning journey
                  </p>
                </div>
              </div>
            </div>

            {/* Bento Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8 stagger-children">
              <BentoStat
                icon={<Flame className="w-4 h-4" />}
                label="Day Streak"
                value={currentStreak.toString()}
                color="amber"
                pulse={currentStreak > 0}
              />
              <BentoStat
                icon={<BookOpen className="w-4 h-4" />}
                label="Modules"
                value={`${completedModules}/${totalModules}`}
                color="violet"
              />
              <BentoStat
                icon={<TrendingUp className="w-4 h-4" />}
                label="Progress"
                value={`${avgProgress}%`}
                color="emerald"
              />
              <BentoStat
                icon={<Shield className="w-4 h-4" />}
                label="Lessons"
                value={totalLessonsViewed.toString()}
                color="cyan"
              />
              <BentoStat
                icon={<Sparkles className="w-4 h-4" />}
                label="Badges"
                value={badgeCount.toString()}
                color="rose"
              />
              <BentoStat
                icon={<Trophy className="w-4 h-4" />}
                label="Rank"
                value={currentUserRank ? `#${currentUserRank}` : "—"}
                color="amber"
              />
            </div>

            {/* XP Progress Bar */}
            <div className="glass-card p-4 mb-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-medium text-amber-400">Level {level}</span>
                  <span className="text-xs text-slate-600 ml-1">{xp} XP total</span>
                </div>
                <Link href="/leaderboard" className="text-[11px] text-accent-violet hover:text-accent-violet/80 transition-colors flex items-center gap-1">
                  View leaderboard <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="w-full h-2 bg-white/[0.04] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700"
                  style={{ width: `${xpProgressPct}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-slate-600">{xpProgressPct}% to Lv.{level + 1}</span>
                <span className="text-[10px] text-slate-600">{level * 100 - xp % 100} XP needed</span>
              </div>
            </div>

            {/* Main Grid */}
            <div className="grid lg:grid-cols-3 gap-5">
              {/* Learning Path */}
              <div className="lg:col-span-2">
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-heading font-bold text-white">
                      Your Learning Path
                    </h2>
                    <Link
                      href="/modules"
                      className="text-accent-violet hover:text-accent-violet/80 text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      View all <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {modules.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-accent-violet/10 flex items-center justify-center">
                        <BookOpen className="w-7 h-7 text-accent-violet" />
                      </div>
                      <p className="text-slate-500 text-sm">
                        No modules available yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {modules.slice(0, 5).map((module: Module, index: number) => {
                        const mp = progress.filter(
                          (p: UserProgress) => p.module_id === module.id
                        );
                        const isCompleted = mp.some(
                          (p: UserProgress) => p.status === "completed"
                        );
                        const isInProgress = mp.some(
                          (p: UserProgress) => p.status === "in_progress"
                        );
                        const pct = isCompleted ? 100 : mp.length > 0 ? 50 : 0;

                        return (
                          <Link
                            key={module.id}
                            href={`/modules/${module.id}`}
                            className="group flex items-center gap-4 p-4 rounded-xl bg-surface-card/50 border border-white/[0.04] hover:border-accent-violet/15 transition-all duration-300"
                          >
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-heading font-bold transition-all ${isCompleted
                                ? "bg-accent-emerald/10 text-accent-emerald"
                                : isInProgress
                                  ? "bg-accent-violet/10 text-accent-violet"
                                  : "bg-white/[0.04] text-slate-600"
                                }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <span>{index + 1}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm text-white truncate group-hover:text-accent-violet transition-colors">
                                {module.title}
                              </h3>
                              <p className="text-xs text-slate-600 truncate">
                                {module.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="w-20 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-accent-violet to-accent-indigo rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[11px] text-slate-600 w-8 text-right font-mono">
                                {pct}%
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-5">
                {/* Recent Activity */}
                <div className="glass-card p-6">
                  <h3 className="font-heading font-semibold text-white text-sm mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent-violet" />
                    Recent Activity
                  </h3>
                  {recentActivity.length === 0 ? (
                    <p className="text-slate-600 text-xs">
                      No activity yet. Start learning!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {recentActivity.map((item: UserProgress) => (
                        <div key={item.id} className="flex items-start gap-3">
                          <div
                            className={`w-1.5 h-1.5 mt-1.5 rounded-full ${item.status === "completed"
                              ? "bg-accent-emerald"
                              : "bg-accent-violet"
                              }`}
                          />
                          <div>
                            <p className="text-xs text-slate-300">
                              Lesson {item.status}
                            </p>
                            <p className="text-[11px] text-slate-600">
                              {new Date(item.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="glass-card p-6">
                  <h3 className="font-heading font-semibold text-white text-sm mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    <Link
                      href="/modules"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-accent-violet to-accent-indigo rounded-xl font-heading font-semibold text-white text-sm hover:shadow-lg hover:shadow-accent-violet/20 transition-all hover:-translate-y-0.5"
                    >
                      <BookOpen className="w-4 h-4" />
                      Browse Modules
                    </Link>
                    <Link
                      href="/code"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-surface-card border border-white/[0.06] rounded-xl font-heading font-medium text-accent-violet text-sm hover:border-accent-violet/20 transition-all"
                    >
                      <Code2 className="w-4 h-4" />
                      Code Playground
                    </Link>
                    <Link
                      href="/simulate"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-surface-card border border-white/[0.06] rounded-xl font-heading font-medium text-accent-cyan text-sm hover:border-accent-cyan/20 transition-all"
                    >
                      <Terminal className="w-4 h-4" />
                      Simulator
                    </Link>
                    <Link
                      href="/leaderboard"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-surface-card border border-white/[0.06] rounded-xl font-heading font-medium text-amber-400 text-sm hover:border-amber-400/20 transition-all"
                    >
                      <Trophy className="w-4 h-4" />
                      Leaderboard
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </>
  );
}

function BentoStat({
  icon,
  label,
  value,
  color,
  pulse,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "amber" | "violet" | "emerald" | "cyan" | "rose";
  pulse?: boolean;
}) {
  const colorMap = {
    amber: { bg: "bg-accent-amber/10", text: "text-accent-amber" },
    violet: { bg: "bg-accent-violet/10", text: "text-accent-violet" },
    emerald: { bg: "bg-accent-emerald/10", text: "text-accent-emerald" },
    cyan: { bg: "bg-accent-cyan/10", text: "text-accent-cyan" },
    rose: { bg: "bg-accent-rose/10", text: "text-accent-rose" },
  };
  const c = colorMap[color];

  return (
    <div className="stat-card">
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`w-7 h-7 rounded-lg ${c.bg} flex items-center justify-center ${c.text}`}
        >
          {icon}
        </div>
      </div>
      <p className={`text-xl font-heading font-bold text-white ${pulse ? "animate-pulse" : ""}`}>
        {value}
      </p>
      <p className="text-[11px] text-slate-600 mt-0.5">{label}</p>
    </div>
  );
}
