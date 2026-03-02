"use client";

import { MainLayout } from "@/components/MainLayout";
import { useState, useEffect } from "react";
import { useCertifications, useCertificationExam } from "@/hooks/useCertifications";
import { useAuth } from "@/hooks/useAuth";
import {
    Award,
    Download,
    CheckCircle2,
    Lock,
    Clock,
    BookOpen,
    Star,
    FileText,
    ArrowRight,
    Play,
    ChevronRight,
    ChevronLeft,
    AlertCircle,
    Loader2,
    Trophy,
} from "lucide-react";

const DIFFICULTY_COLORS = {
    beginner: "text-green-400 bg-green-500/20",
    intermediate: "text-amber-400 bg-amber-500/20",
    advanced: "text-red-400 bg-red-500/20",
};

export default function CertificationsPage() {
    const { user } = useAuth();
    const { certifications, userCertifications, isLoading, startExam, downloadCertificate } = useCertifications({ userId: user?.id });
    const [selectedCert, setSelectedCert] = useState<string | null>(null);
    const [showExam, setShowExam] = useState(false);
    const [examId, setExamId] = useState<string | null>(null);

    const handleStartExam = async (certificationId: string) => {
        try {
            const exam = await startExam.mutateAsync(certificationId);
            setExamId(exam.id);
            setShowExam(true);
            setSelectedCert(certificationId);
        } catch (error) {
            console.error('Failed to start exam:', error);
        }
    };

    const handleDownload = async (certificationId: string) => {
        try {
            await downloadCertificate(certificationId);
        } catch (error) {
            console.error('Failed to download:', error);
        }
    };

    if (showExam && examId && selectedCert) {
        return <ExamView examId={examId} certId={selectedCert} onClose={() => { setShowExam(false); setExamId(null); }} />;
    }

    return (
        <MainLayout>
            <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
                <div className="pt-12 pb-8 px-4 max-w-6xl mx-auto">
                    <div className="flex items-center gap-3 mb-2">
                        <Award className="w-8 h-8 text-amber-400" />
                        <h1 className="text-3xl font-bold text-white">Certifications</h1>
                    </div>
                    <p className="text-gray-400">Earn certificates by completing modules, labs, and assessments</p>
                </div>

                <div className="max-w-6xl mx-auto px-4 mb-8">
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: "Available", value: certifications?.length || 0, icon: <FileText className="w-5 h-5 text-violet-400" /> },
                            { label: "In Progress", value: 0 /* Assuming 0 since Attempts not fetched here directly */, icon: <Clock className="w-5 h-5 text-amber-400" /> },
                            { label: "Earned", value: userCertifications?.filter(c => c.issued_at).length || 0, icon: <Trophy className="w-5 h-5 text-green-400" /> },
                        ].map((stat) => (
                            <div key={stat.label} className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 flex items-center gap-3">
                                {stat.icon}
                                <div>
                                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                                    <div className="text-xs text-gray-500">{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-4 pb-20 space-y-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                        </div>
                    ) : (
                        certifications?.map((cert) => {
                            const userCert = userCertifications?.find(uc => uc.cert_id === cert.id);
                            const isExpanded = selectedCert === cert.id;
                            const canTakeExam = true; // Temporary simplification, user can take exam anytime
                            const hasPassed = !!userCert?.issued_at;

                            return (
                                <div
                                    key={cert.id}
                                    className={`rounded-2xl border ${hasPassed ? 'border-emerald-500/30' : 'border-gray-800'} bg-gray-900/80 overflow-hidden transition-all`}
                                >
                                    <div
                                        className="p-6 cursor-pointer"
                                        onClick={() => setSelectedCert(isExpanded ? null : cert.id)}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-xl bg-gradient-to-br ${(cert as any).color || 'from-violet-600 to-violet-800'} text-white text-2xl flex items-center justify-center w-14 h-14`}>
                                                {(cert as any).icon || '🏆'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="text-lg font-bold text-white">{cert.title}</h3>
                                                    {hasPassed && (
                                                        <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400">Earned</span>
                                                    )}
                                                    {canTakeExam && !hasPassed && (
                                                        <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400">Ready for Exam</span>
                                                    )}
                                                    <span className={`px-2 py-0.5 rounded-full text-xs ${DIFFICULTY_COLORS[cert.difficulty.toLowerCase() as keyof typeof DIFFICULTY_COLORS]}`}>
                                                        {cert.difficulty}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-400 mb-3">{cert.description}</p>

                                                <div className="mb-3">
                                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                                        <span>Requirements</span>
                                                        <span>{hasPassed ? '100%' : '0%'}</span>
                                                    </div>
                                                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${hasPassed ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 w-full' : 'bg-transparent'}`}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span>{cert.time_limit_minutes || '--'} min exam</span>
                                                    <span>•</span>
                                                    <span>{cert.question_count || '--'} questions</span>
                                                    <span>•</span>
                                                    <span>Pass: {cert.passing_score}%</span>
                                                </div>
                                            </div>
                                            <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="px-6 pb-6 border-t border-gray-800">
                                            <h4 className="text-sm font-medium text-gray-300 mt-4 mb-3">Requirements</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                                                {cert.requirements?.map((req) => (
                                                    <div key={req.id} className="flex items-center gap-2 text-sm">
                                                        <Lock className="w-4 h-4 text-gray-600 shrink-0" />
                                                        <span className="text-gray-400">{req.label}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex gap-3">
                                                {hasPassed ? (
                                                    <button
                                                        onClick={() => handleDownload(cert.id)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-sm font-medium rounded-xl transition-all"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        Download Certificate
                                                    </button>
                                                ) : canTakeExam ? (
                                                    <button
                                                        onClick={() => handleStartExam(cert.id)}
                                                        disabled={startExam.isPending}
                                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50"
                                                    >
                                                        {startExam.isPending ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Play className="w-4 h-4" />
                                                        )}
                                                        Start Exam
                                                    </button>
                                                ) : (
                                                    <button
                                                        disabled
                                                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-500 text-sm font-medium rounded-xl cursor-not-allowed"
                                                    >
                                                        <Lock className="w-4 h-4" />
                                                        Complete Requirements
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </MainLayout>
    );
}

function ExamView({ examId, certId, onClose }: { examId: string; certId: string; onClose: () => void }) {
    const { completeExam, downloadCertificate } = useCertifications();
    const {
        exam,
        questions,
        currentQuestion,
        currentQuestionIndex,
        totalQuestions,
        answers,
        answeredCount,
        progress,
        isLoading,
        isSubmitting,
        setIsSubmitting,
        setAnswer,
        nextQuestion,
        prevQuestion,
        jumpToQuestion,
    } = useCertificationExam(examId);

    if (isLoading) {
        return (
            <MainLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Certification Exam</h1>
                            <p className="text-gray-400 text-sm">Question {currentQuestionIndex + 1} of {totalQuestions}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-white border border-gray-700 rounded-lg transition-colors"
                        >
                            Exit Exam
                        </button>
                    </div>

                    <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{answeredCount}/{totalQuestions} answered</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                        {questions.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => jumpToQuestion(index)}
                                className={`w-8 h-8 rounded-lg text-xs font-medium flex-shrink-0 transition-colors ${index === currentQuestionIndex
                                    ? 'bg-violet-600 text-white'
                                    : answers[questions[index].id]
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    }`}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>

                    <div className="rounded-2xl border border-gray-800 bg-gray-900/80 p-8">
                        <h2 className="text-lg font-semibold text-white mb-6">
                            {currentQuestion?.question}
                        </h2>

                        {currentQuestion?.type === 'multiple_choice' && (
                            <div className="space-y-3">
                                {currentQuestion.options?.map((option, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setAnswer(currentQuestion.id, String(index))}
                                        className={`w-full text-left p-4 rounded-xl border transition-all ${answers[currentQuestion.id] === String(index)
                                            ? 'border-violet-500 bg-violet-500/10 text-white'
                                            : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600'
                                            }`}
                                    >
                                        <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                                        {option}
                                    </button>
                                ))}
                            </div>
                        )}

                        {currentQuestion?.type === 'fill_blank' && (
                            <textarea
                                value={answers[currentQuestion?.id] || ''}
                                onChange={(e) => setAnswer(currentQuestion?.id || '', e.target.value)}
                                className="w-full h-32 p-4 bg-gray-800 border border-gray-700 rounded-xl text-white resize-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                placeholder="Type your answer..."
                            />
                        )}
                    </div>

                    <div className="flex items-center justify-between mt-6">
                        <button
                            onClick={prevQuestion}
                            disabled={currentQuestionIndex === 0}
                            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </button>

                        {currentQuestionIndex === totalQuestions - 1 ? (
                            <button
                                onClick={async () => {
                                    setIsSubmitting(true);
                                    try {
                                        const result = await completeExam.mutateAsync({ attemptId: examId, certId, answers });
                                        if (result.passed) {
                                            alert(`Passed! Score: ${result.score}%`);
                                            // Optional: trigger download automatically or let user click download from main page
                                            onClose();
                                        } else {
                                            alert(`Failed. Score: ${result.score}%. You need 80% to pass.`);
                                            onClose();
                                        }
                                    } catch (e: any) {
                                        alert(e.message || 'Failed to submit exam');
                                    } finally {
                                        setIsSubmitting(false);
                                    }
                                }}
                                disabled={isSubmitting || answeredCount < totalQuestions}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl disabled:opacity-50 transition-colors"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                Submit Exam
                            </button>
                        ) : (
                            <button
                                onClick={nextQuestion}
                                disabled={currentQuestionIndex === totalQuestions - 1}
                                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl disabled:opacity-50 transition-colors"
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
