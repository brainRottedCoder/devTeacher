"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Clock, BookOpen, Lightbulb } from "lucide-react";
import { useModule, Lesson } from "@/hooks/useModules";
import { useProgress, useUpdateProgress } from "@/hooks/useProgress";
import { useQuiz } from "@/hooks/useQuiz";
import { MainLayout } from "@/components/MainLayout";
import { Quiz } from "@/components/Quiz";
import { AIChatWidget } from "@/components/chat/AIChatWidget";

export default function LessonPage({
    params
}: {
    params: { id: string; lessonId: string }
}) {
    const { id, lessonId } = params;
    const { data: moduleData, isLoading, error } = useModule(id);
    const { data: progressData } = useProgress();
    const updateProgress = useUpdateProgress();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const currentModule = moduleData;
    const lessons: Lesson[] = currentModule?.lessons || [];

    // Find current lesson by slug
    const currentLesson = lessons.find(l => l.slug === lessonId) || lessons[0];

    // Fetch quiz for this lesson
    const { data: quizData, isLoading: quizLoading } = useQuiz(currentLesson?.id || "");

    if (!mounted || isLoading) {
        return (
            <MainLayout>
                <div className="min-h-screen relative">
                    <div className="absolute inset-0 bg-grid opacity-20" />
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center animate-pulse">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                            <p className="text-gray-400">Loading lesson...</p>
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (error || !currentModule || !currentLesson) {
        return (
            <MainLayout>
                <div className="min-h-screen relative">
                    <div className="absolute inset-0 bg-grid opacity-20" />
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="glass-card p-8 text-center max-w-md">
                            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">!</span>
                            </div>
                            <p className="text-red-400 mb-4">Failed to load lesson</p>
                            <Link href="/modules" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors">
                                <ArrowLeft size={16} />
                                Back to Modules
                            </Link>
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    // Calculate current lesson index
    const currentIndex = lessons.findIndex(l => l.slug === currentLesson.slug);
    const totalLessons = lessons.length;
    const currentLessonNum = currentIndex + 1;

    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < totalLessons - 1;

    const goToPrev = () => {
        if (hasPrev) {
            const prevLesson = lessons[currentIndex - 1];
            window.location.href = `/modules/${id}/lessons/${prevLesson.slug}`;
        }
    };

    const goToNext = () => {
        if (hasNext) {
            const nextLesson = lessons[currentIndex + 1];
            window.location.href = `/modules/${id}/lessons/${nextLesson.slug}`;
        }
    };

    const progressPercentage = Math.round((currentLessonNum / totalLessons) * 100);

    const handleComplete = () => {
        updateProgress.mutate({
            module_id: id,
            lesson_id: currentLesson.id,
            status: hasNext ? 'in_progress' : 'completed',
        });

        if (hasNext) {
            goToNext();
        }
    };

    // Find lesson progress
    const lessonProgress = progressData?.find(p => p.lesson_id === currentLesson.id);
    const isCompleted = lessonProgress?.status === 'completed';

    return (
        <MainLayout hideFooter>
            <div className="min-h-screen relative">
                {/* Background effects */}
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute top-20 right-40 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 left-40 w-[300px] h-[300px] bg-cyan-600/10 rounded-full blur-3xl" />
                </div>

                {/* Header */}
                <div className="sticky top-16 z-40 border-b border-purple-500/10 bg-[#0a0a0f]/80 backdrop-blur-lg">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between gap-4">
                            <Link
                                href={`/modules/${id}`}
                                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors flex-shrink-0"
                            >
                                <ArrowLeft size={18} />
                                <span className="text-sm hidden sm:inline">Back to Module</span>
                            </Link>

                            <div className="flex-1 max-w-lg">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-gray-400">Lesson {currentLessonNum} of {totalLessons}</span>
                                    <span className="text-xs text-gradient font-medium">{progressPercentage}%</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-gray-400 flex-shrink-0">
                                <Clock size={14} />
                                <span className="text-sm">{currentLesson.estimated_minutes || 15} min</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                    <div className="container mx-auto px-4 py-8">
                        <div className="max-w-4xl mx-auto">
                            {/* Lesson Header */}
                            <div className="mb-8 slide-up">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/25">
                                        {currentLessonNum}
                                    </div>
                                    <div className="px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                        {currentModule.title}
                                    </div>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold text-white">
                                    {currentLesson.title}
                                </h1>
                            </div>

                            {/* Lesson Content */}
                            <div className="glass-card p-6 md:p-8 mb-8 slide-up">
                                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-purple-500/10">
                                    <BookOpen size={18} className="text-purple-400" />
                                    <span className="text-white font-medium">Lesson Content</span>
                                </div>
                                {currentLesson.content ? (
                                    <div className="prose prose-invert prose-lg max-w-none">
                                        <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                            {currentLesson.content}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                                            <BookOpen size={24} className="text-gray-400" />
                                        </div>
                                        <p className="text-gray-400 italic">
                                            Content coming soon...
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Key Takeaways */}
                            <div className="glass-card p-6 mb-8 slide-up">
                                <div className="flex items-center gap-2 mb-4">
                                    <Lightbulb size={18} className="text-yellow-400" />
                                    <span className="text-white font-medium">Key Takeaways</span>
                                </div>
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-3 text-gray-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                                        <span>Understanding the core concepts is essential for building scalable systems</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-gray-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 flex-shrink-0" />
                                        <span>Practice implementing these patterns in real-world scenarios</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-gray-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-2 flex-shrink-0" />
                                        <span>Use the AI assistant to clarify any doubts</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Navigation */}
                            <div className="flex items-center justify-between pt-6 border-t border-purple-500/10 mb-8 slide-up">
                                <button
                                    onClick={goToPrev}
                                    disabled={!hasPrev}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${hasPrev
                                            ? "text-gray-400 hover:text-white hover:bg-white/5 border border-white/10 hover:border-white/20"
                                            : "text-gray-600 cursor-not-allowed border border-white/5"
                                        }`}
                                >
                                    <ArrowLeft size={18} />
                                    <span>Previous</span>
                                </button>

                                <button
                                    onClick={handleComplete}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/25"
                                >
                                    {isCompleted ? "Completed" : hasNext ? "Complete & Next" : "Complete"}
                                    {isCompleted ? <CheckCircle size={18} /> : hasNext ? <ArrowRight size={18} /> : <CheckCircle size={18} />}
                                </button>
                            </div>

                            {/* Quiz Section */}
                            {quizData && !quizLoading && (
                                <div className="glass-card p-6 mb-8 slide-up">
                                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-sm">
                                            ?
                                        </span>
                                        Quiz: Test Your Knowledge
                                    </h2>
                                    <Quiz
                                        quiz={quizData}
                                        lessonId={currentLesson.id}
                                        onComplete={(passed) => {
                                            if (passed) {
                                                handleComplete();
                                            }
                                        }}
                                    />
                                </div>
                            )}

                            {/* AI Chat Widget */}
                            <AIChatWidget
                                moduleId={id}
                                moduleTitle={currentModule.title}
                                lessonId={currentLesson.id}
                                lessonTitle={currentLesson.title}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
