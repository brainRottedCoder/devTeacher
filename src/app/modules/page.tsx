"use client";

import { useModules, Module } from "@/hooks/useModules";
import { useProgress } from "@/hooks/useProgress";
import { MainLayout } from "@/components/MainLayout";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  FileText,
  ArrowRight,
} from "lucide-react";

export default function ModulesPage() {
  const { data: modules, isLoading } = useModules();
  const { data: progress } = useProgress();
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "in-progress" | "completed" | "not-started"
  >("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isLoading || !mounted) {
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

  const modulesList = modules || [];
  const progressList = progress || [];

  const filteredModules = modulesList.filter((module: Module) => {
    const moduleProgress = progressList.filter(
      (p) => p.module_id === module.id
    );
    const isCompleted = moduleProgress.some((p) => p.status === "completed");
    const isInProgress =
      moduleProgress.some((p) => p.status === "in_progress") && !isCompleted;

    switch (filter) {
      case "completed":
        return isCompleted;
      case "in-progress":
        return isInProgress;
      case "not-started":
        return moduleProgress.length === 0;
      default:
        return true;
    }
  });

  const completedCount = modulesList.filter((m: Module) =>
    progressList.some(
      (p) => p.module_id === m.id && p.status === "completed"
    )
  ).length;
  const inProgressCount = modulesList.filter((m: Module) => {
    const mp = progressList.filter((p) => p.module_id === m.id);
    return (
      mp.some((p) => p.status === "in_progress") &&
      !mp.some((p) => p.status === "completed")
    );
  }).length;

  const filters = [
    { key: "all", label: "All Modules" },
    { key: "in-progress", label: "In Progress" },
    { key: "completed", label: "Completed" },
    { key: "not-started", label: "Not Started" },
  ] as const;

  return (
    <MainLayout>
      <div className="min-h-screen relative">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <div className="mb-8 opacity-0 animate-slide-up">
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-white tracking-tight mb-2">
              Learning <span className="text-gradient">Modules</span>
            </h1>
            <p className="text-slate-500 text-sm">
              Master system design through interactive lessons
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-8 stagger-children">
            <div className="stat-card text-center">
              <p className="text-2xl font-heading font-bold text-white">
                {modulesList.length}
              </p>
              <p className="text-[11px] text-slate-600">Total Modules</p>
            </div>
            <div className="stat-card text-center">
              <p className="text-2xl font-heading font-bold text-gradient">
                {completedCount}
              </p>
              <p className="text-[11px] text-slate-600">Completed</p>
            </div>
            <div className="stat-card text-center">
              <p className="text-2xl font-heading font-bold text-accent-cyan">
                {inProgressCount}
              </p>
              <p className="text-[11px] text-slate-600">In Progress</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-8">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-full text-xs font-heading font-medium transition-all duration-200 ${
                  filter === f.key
                    ? "bg-gradient-to-r from-accent-violet to-accent-indigo text-white shadow-lg shadow-accent-violet/20"
                    : "bg-surface-card text-slate-500 hover:text-white border border-white/[0.04] hover:border-white/[0.08]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Modules Grid */}
          {filteredModules.length === 0 ? (
            <div className="glass-card p-16 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-accent-violet/10 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-accent-violet" />
              </div>
              <h3 className="text-lg font-heading font-semibold text-white mb-2">
                No modules found
              </h3>
              <p className="text-slate-500 text-sm">
                Try changing the filter or check back later
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
              {filteredModules.map((module: Module, index: number) => {
                const mp = progressList.filter(
                  (p) => p.module_id === module.id
                );
                const isCompleted = mp.some(
                  (p) => p.status === "completed"
                );
                const isInProgress = mp.some(
                  (p) => p.status === "in_progress"
                );
                const pct = isCompleted ? 100 : mp.length > 0 ? 50 : 0;

                return (
                  <Link
                    key={module.id}
                    href={`/modules/${module.id}`}
                    className="group module-card"
                  >
                    {/* Status dot */}
                    <div
                      className={`absolute top-5 right-5 w-2.5 h-2.5 rounded-full ${
                        isCompleted
                          ? "bg-accent-emerald"
                          : isInProgress
                          ? "bg-accent-violet animate-pulse"
                          : "bg-slate-700"
                      }`}
                    />

                    {/* Background number */}
                    <div className="text-[80px] font-heading font-bold text-white/[0.02] absolute -right-2 -bottom-6 leading-none group-hover:text-white/[0.04] transition-colors duration-500">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="relative z-10">
                      <div
                        className={`w-10 h-10 rounded-xl mb-5 flex items-center justify-center ${
                          isCompleted
                            ? "bg-accent-emerald/10 text-accent-emerald"
                            : isInProgress
                            ? "bg-accent-violet/10 text-accent-violet"
                            : "bg-white/[0.04] text-slate-600"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <BookOpen className="w-5 h-5" />
                        )}
                      </div>

                      <h3 className="text-base font-heading font-bold text-white group-hover:text-accent-violet transition-colors mb-2">
                        {module.title}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-2 mb-5">
                        {module.description}
                      </p>

                      {/* Progress */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-accent-violet to-accent-indigo rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-600 font-mono">
                          {pct}%
                        </span>
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-2 mt-4 text-[11px] text-slate-600">
                        <FileText className="w-3.5 h-3.5" />
                        <span>
                          {(module as Module & { lessons?: unknown[] })
                            .lessons?.length || 0}{" "}
                          lessons
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
