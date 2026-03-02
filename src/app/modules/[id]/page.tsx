"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, Loader2, Clock, BookOpen, CheckCircle, Users, Zap, Trophy } from "lucide-react";
import { useModule } from "@/hooks/useModules";
import { useProgress, useUpdateProgress } from "@/hooks/useProgress";
import { useAuth } from "@/hooks/useAuth";
import { MainLayout } from "@/components/MainLayout";

export default function ModuleDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { user, isAuthenticated } = useAuth();
  const { data: moduleData, isLoading, error } = useModule(id);
  const { data: progressData } = useProgress();
  const updateProgress = useUpdateProgress();

  const currentModule = moduleData;
  const lessons = moduleData?.lessons || [];

  const moduleProgress = progressData?.find(p => p.module_id === id);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen relative">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center animate-pulse">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <p className="text-gray-400">Loading module...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !currentModule) {
    return notFound();
  }

  const totalLessons = lessons.length;
  const totalMinutes = lessons.reduce((sum, lesson) => sum + (lesson.estimated_minutes || 15), 0);

  const completedLessons = progressData?.filter(p =>
    p.module_id === id && p.status === 'completed'
  ).length || 0;

  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const handleStartLesson = () => {
    if (isAuthenticated && lessons.length > 0) {
      updateProgress.mutate({
        module_id: id,
        lesson_id: lessons[0].id,
        status: 'in_progress',
      });
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen relative">
        {/* Background effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-20 right-20 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-[300px] h-[300px] bg-cyan-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* Hero Section */}
          <div className="border-b border-purple-500/10 bg-[#0a0a0f]/50 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-8">
              {/* Back link */}
              <Link
                href="/modules"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
              >
                <ArrowLeft size={18} />
                <span>Back to Modules</span>
              </Link>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Main content */}
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {currentModule.category}
                    </span>
                    <DifficultyBadge difficulty={currentModule.difficulty} />
                  </div>

                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    {currentModule.title}
                  </h1>
                  <p className="text-lg text-gray-400 mb-6">
                    {currentModule.description}
                  </p>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-6 mb-6">
                    <div className="flex items-center gap-2 text-gray-400">
                      <BookOpen size={18} className="text-cyan-400" />
                      <span>{totalLessons} lessons</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock size={18} className="text-purple-400" />
                      <span>~{Math.ceil(totalMinutes / 60)} hours</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Users size={18} className="text-pink-400" />
                      <span>12.5k enrolled</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {totalLessons > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Your Progress</span>
                        <span className="text-sm font-medium text-gradient">{progressPercentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {completedLessons} of {totalLessons} lessons completed
                      </p>
                    </div>
                  )}

                  {/* CTA Button */}
                  {lessons.length > 0 && (
                    <Link
                      href={`/modules/${id}/lessons/${lessons[0].slug}`}
                      onClick={handleStartLesson}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/25"
                    >
                      <Play size={18} />
                      {completedLessons > 0 ? 'Continue Learning' : 'Start Learning'}
                    </Link>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  {/* Skills you'll gain */}
                  <div className="glass-card p-4">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Zap size={16} className="text-yellow-400" />
                      Skills you&apos;ll gain
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {['System Design', 'Scalability', 'Architecture', 'Databases', 'Caching'].map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-1 text-xs rounded-lg bg-white/5 text-gray-300 border border-white/10"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Certificate */}
                  <div className="glass-card p-4">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Trophy size={16} className="text-yellow-400" />
                      Certificate
                    </h3>
                    <p className="text-sm text-gray-400 mb-3">
                      Earn a certificate upon completion
                    </p>
                    <div className="w-full h-16 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 flex items-center justify-center">
                      <span className="text-gradient font-semibold">Azmuth</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Course Content */}
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl">
              <div className="glass-card p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <BookOpen size={20} className="text-cyan-400" />
                  Course Content
                </h2>

                {lessons.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                      <BookOpen size={24} className="text-gray-400" />
                    </div>
                    <p className="text-gray-400">No content available yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lessons.map((lesson: any, index: number) => {
                      const lessonProgress = progressData?.find(
                        p => p.lesson_id === lesson.id
                      );
                      const isCompleted = lessonProgress?.status === 'completed';
                      const isInProgress = lessonProgress?.status === 'in_progress';

                      return (
                        <Link
                          key={lesson.id}
                          href={`/modules/${id}/lessons/${lesson.slug}`}
                          onClick={() => {
                            if (isAuthenticated) {
                              updateProgress.mutate({
                                module_id: id,
                                lesson_id: lesson.id,
                                status: 'in_progress',
                              });
                            }
                          }}
                          className="group flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-white/10 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all ${isCompleted
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25'
                              : isInProgress
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                                : 'bg-white/5 text-gray-400 group-hover:bg-white/10'
                              }`}>
                              {isCompleted ? (
                                <CheckCircle size={18} />
                              ) : (
                                index + 1
                              )}
                            </div>
                            <div>
                              <span className="text-white font-medium group-hover:text-gradient transition-all">
                                {lesson.title}
                              </span>
                              <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                <Clock size={12} />
                                {lesson.estimated_minutes || 15} min
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {isInProgress && !isCompleted && (
                              <span className="px-2 py-1 text-xs rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                In Progress
                              </span>
                            )}
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:bg-purple-500/20 transition-all">
                              <Play size={14} />
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const config = {
    beginner: { color: "from-green-500 to-emerald-500", bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
    intermediate: { color: "from-yellow-500 to-orange-500", bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
    advanced: { color: "from-red-500 to-pink-500", bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  };

  const style = config[difficulty as keyof typeof config] || config.beginner;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text} border ${style.border}`}>
      {difficulty}
    </span>
  );
}
