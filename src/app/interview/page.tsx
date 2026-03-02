"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { useCompanies, useQuestions, useStudyPlans } from "@/hooks/useInterview";
import {
    QUESTION_TYPES,
    DIFFICULTY_LEVELS,
    Company,
    InterviewQuestion,
    QuestionType,
    DifficultyLevel
} from "@/types/interview.types";
import { Plus, Calendar, Target, Clock, CheckCircle, XCircle, Loader2, TrendingUp, BookOpen, BarChart3, ChevronRight } from "lucide-react";

export default function InterviewPage() {
    const [activeTab, setActiveTab] = useState<"browse" | "practice" | "study-plan">("browse");
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [selectedQuestion, setSelectedQuestion] = useState<InterviewQuestion | null>(null);
    const [filters, setFilters] = useState({
        type: "" as QuestionType | "",
        difficulty: "" as DifficultyLevel | "",
    });

    const { companies, loading: companiesLoading } = useCompanies();
    const { questions, loading: questionsLoading, total } = useQuestions({
        companyId: selectedCompany?.id,
        type: filters.type || undefined,
        difficulty: filters.difficulty || undefined,
        limit: 20,
    });

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "easy": return "text-green-400 bg-green-400/10 border-green-400/20";
            case "medium": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
            case "hard": return "text-red-400 bg-red-400/10 border-red-400/20";
            default: return "text-gray-400 bg-gray-400/10 border-gray-400/20";
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "system_design": return "System Design";
            case "coding": return "Coding";
            case "behavioral": return "Behavioral";
            default: return type;
        }
    };

    return (
        <MainLayout>
            <div className="min-h-screen relative">
                {/* Background effects */}
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute top-20 left-40 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-40 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10">
                    {/* Header */}
                    <div className="border-b border-blue-500/10 bg-[#0a0a0f]/50 backdrop-blur-sm">
                        <div className="container mx-auto px-4 py-6">
                            <h1 className="text-3xl font-bold text-white mb-2">
                                Interview Preparation Hub
                            </h1>
                            <p className="text-gray-400">
                                Practice with real interview questions from top tech companies
                            </p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-white/10 bg-[#0a0a0f]/30">
                        <div className="container mx-auto px-4">
                            <div className="flex gap-1">
                                {[
                                    { id: "browse", label: "Browse Questions", icon: "📚" },
                                    { id: "practice", label: "Practice Mode", icon: "🎯" },
                                    { id: "study-plan", label: "Study Plan", icon: "📅" },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                        className={`px-6 py-4 text-sm font-medium transition-colors relative ${activeTab === tab.id
                                            ? "text-blue-400"
                                            : "text-gray-400 hover:text-white"
                                            }`}
                                    >
                                        <span className="mr-2">{tab.icon}</span>
                                        {tab.label}
                                        {activeTab === tab.id && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="container mx-auto px-4 py-8">
                        {activeTab === "browse" && (
                            <div className="flex gap-8">
                                {/* Companies Sidebar */}
                                <div className="w-72 flex-shrink-0">
                                    <div className="bg-[#0a0a0f]/50 border border-white/10 rounded-xl p-4">
                                        <h3 className="text-lg font-semibold text-white mb-4">Companies</h3>
                                        {companiesLoading ? (
                                            <div className="space-y-2">
                                                {[...Array(5)].map((_, i) => (
                                                    <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <button
                                                    onClick={() => setSelectedCompany(null)}
                                                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${!selectedCompany
                                                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                                        : "hover:bg-white/5 text-gray-300"
                                                        }`}
                                                >
                                                    All Companies
                                                </button>
                                                {companies.map((company) => (
                                                    <button
                                                        key={company.id}
                                                        onClick={() => setSelectedCompany(company)}
                                                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${selectedCompany?.id === company.id
                                                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                                            : "hover:bg-white/5 text-gray-300"
                                                            }`}
                                                    >
                                                        {company.logo_url ? (
                                                            <img
                                                                src={company.logo_url}
                                                                alt={company.name}
                                                                className="w-6 h-6 rounded"
                                                            />
                                                        ) : (
                                                            <div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center text-xs">
                                                                {company.name[0]}
                                                            </div>
                                                        )}
                                                        <span className="truncate">{company.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Questions List */}
                                <div className="flex-1">
                                    {/* Filters */}
                                    <div className="flex gap-4 mb-6">
                                        <select
                                            value={filters.type}
                                            onChange={(e) => setFilters(f => ({ ...f, type: e.target.value as QuestionType | "" }))}
                                            className="bg-[#0a0a0f] border border-white/10 rounded-lg px-4 py-2 text-white"
                                        >
                                            <option value="">All Types</option>
                                            {QUESTION_TYPES.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={filters.difficulty}
                                            onChange={(e) => setFilters(f => ({ ...f, difficulty: e.target.value as DifficultyLevel | "" }))}
                                            className="bg-[#0a0a0f] border border-white/10 rounded-lg px-4 py-2 text-white"
                                        >
                                            <option value="">All Difficulties</option>
                                            {DIFFICULTY_LEVELS.map(level => (
                                                <option key={level.value} value={level.value}>{level.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Questions */}
                                    {questionsLoading ? (
                                        <div className="space-y-4">
                                            {[...Array(5)].map((_, i) => (
                                                <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
                                            ))}
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-gray-400 mb-4">{total} questions found</p>
                                            <div className="space-y-4">
                                                {questions.map((question) => (
                                                    <div
                                                        key={question.id}
                                                        onClick={() => setSelectedQuestion(question)}
                                                        className="bg-[#0a0a0f]/50 border border-white/10 rounded-xl p-5 hover:border-blue-500/30 transition-colors cursor-pointer"
                                                    >
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                                                                    {question.difficulty}
                                                                </span>
                                                                <span className="px-2 py-1 rounded text-xs bg-white/5 text-gray-400">
                                                                    {getTypeLabel(question.type)}
                                                                </span>
                                                            </div>
                                                            {question.company && (
                                                                <span className="text-sm text-gray-400">{question.company.name}</span>
                                                            )}
                                                        </div>
                                                        <h3 className="text-lg font-medium text-white mb-2">{question.title}</h3>
                                                        <p className="text-gray-400 text-sm line-clamp-2">{question.content}</p>
                                                        {question.topics && question.topics.length > 0 && (
                                                            <div className="flex gap-2 mt-3">
                                                                {question.topics.slice(0, 3).map((topic) => (
                                                                    <span key={topic} className="px-2 py-1 rounded text-xs bg-purple-500/10 text-purple-400">
                                                                        {topic}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "practice" && (
                            <div className="text-center py-20">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                                    <span className="text-4xl">🎯</span>
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-4">Practice Mode</h2>
                                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                                    Choose your practice style to prepare for your next interview.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <button
                                        onClick={() => setActiveTab("browse")}
                                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium"
                                    >
                                        Browse Questions
                                    </button>
                                    <button
                                        onClick={() => window.location.href = '/interview/session'}
                                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-cyan-500 text-white rounded-lg font-medium"
                                    >
                                        AI Mock Interview
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === "study-plan" && (
                            <StudyPlanTab />
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}

// Study Plan Tab Component
function StudyPlanTab() {
    const { plans, loading: plansLoading, refetch } = useStudyPlans();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/leaderboard');
            const data = await response.json();
            // Just get user stats if available
            if (data.leaderboard && data.leaderboard.length > 0) {
                setStats({
                    totalInterviews: data.leaderboard.length,
                    avgScore: Math.round(data.leaderboard.reduce((acc: number, u: any) => acc + (u.score || 0), 0) / data.leaderboard.length)
                });
            }
        } catch (e) {
            console.error('Error fetching stats:', e);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const getProgressColor = (progress: number) => {
        if (progress >= 80) return 'text-green-400';
        if (progress >= 50) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-5 h-5 text-green-400" />;
            case 'in_progress':
                return <Clock className="w-5 h-5 text-yellow-400" />;
            default:
                return <XCircle className="w-5 h-5 text-gray-400" />;
        }
    };

    return (
        <div>
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-[#0a0a0f]/50 border border-white/10 rounded-xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Target className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Active Plans</p>
                            <p className="text-2xl font-bold text-white">{plans?.filter(p => p.status === 'active').length || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#0a0a0f]/50 border border-white/10 rounded-xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Completed</p>
                            <p className="text-2xl font-bold text-white">{plans?.filter(p => p.status === 'completed').length || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#0a0a0f]/50 border border-white/10 rounded-xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Total Sessions</p>
                            <p className="text-2xl font-bold text-white">{stats?.totalInterviews || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#0a0a0f]/50 border border-white/10 rounded-xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Avg Score</p>
                            <p className="text-2xl font-bold text-white">{stats?.avgScore || 0}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Study Plans */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Your Study Plans</h2>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-cyan-500 text-white rounded-lg font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Create Plan
                </button>
            </div>

            {plansLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                </div>
            ) : plans && plans.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className="bg-[#0a0a0f]/50 border border-white/10 rounded-xl p-5 hover:border-blue-500/30 transition-colors cursor-pointer"
                            onClick={() => setSelectedPlan(plan)}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="text-lg font-medium text-white mb-1">{plan.name}</h3>
                                    {plan.company && (
                                        <p className="text-sm text-gray-400">{plan.company.name}</p>
                                    )}
                                </div>
                                {getStatusIcon(plan.status)}
                            </div>
                            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{plan.description}</p>
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Calendar className="w-4 h-4" />
                                    <span>{plan.duration_weeks} weeks</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400">
                                    <BookOpen className="w-4 h-4" />
                                    <span>{plan.questions_per_day}/day</span>
                                </div>
                            </div>
                            {plan.items && (
                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="text-gray-400">Progress</span>
                                        <span className={getProgressColor(Math.round((plan.items.filter((i: any) => i.status === 'completed').length / plan.items.length) * 100))}>
                                            {Math.round((plan.items.filter((i: any) => i.status === 'completed').length / plan.items.length) * 100)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-800 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-green-500 to-cyan-500 h-2 rounded-full transition-all"
                                            style={{ width: `${Math.round((plan.items.filter((i: any) => i.status === 'completed').length / plan.items.length) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-[#0a0a0f]/30 rounded-xl border border-white/10">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No Study Plans Yet</h3>
                    <p className="text-gray-400 mb-6">Create a personalized study plan to track your interview preparation</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-cyan-500 text-white rounded-lg font-medium"
                    >
                        Create Your First Plan
                    </button>
                </div>
            )}

            {/* Create Plan Modal */}
            {showCreateModal && (
                <CreatePlanModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => {
                        setShowCreateModal(false);
                        refetch();
                    }}
                />
            )}

            {/* Plan Details Modal */}
            {selectedPlan && (
                <PlanDetailsModal
                    plan={selectedPlan}
                    onClose={() => setSelectedPlan(null)}
                />
            )}
        </div>
    );
}

// Create Plan Modal Component
function CreatePlanModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const { companies } = useCompanies();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        target_company_id: '',
        duration_weeks: 4,
        questions_per_day: 2,
        question_ids: [] as string[]
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { questions } = useQuestions({ limit: 50 });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/interview/plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                onCreated();
            }
        } catch (error) {
            console.error('Error creating plan:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-white mb-6">Create Study Plan</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Plan Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 bg-surface-deep border border-white/10 rounded-xl text-white"
                            placeholder="e.g., Google SWE Prep"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 bg-surface-deep border border-white/10 rounded-xl text-white"
                            placeholder="What do you want to achieve?"
                            rows={3}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Target Company</label>
                        <select
                            value={formData.target_company_id}
                            onChange={(e) => setFormData({ ...formData, target_company_id: e.target.value })}
                            className="w-full px-4 py-3 bg-surface-deep border border-white/10 rounded-xl text-white"
                        >
                            <option value="">Any Company</option>
                            {companies.map((company) => (
                                <option key={company.id} value={company.id}>{company.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Duration (weeks)</label>
                            <input
                                type="number"
                                value={formData.duration_weeks}
                                onChange={(e) => setFormData({ ...formData, duration_weeks: parseInt(e.target.value) })}
                                className="w-full px-4 py-3 bg-surface-deep border border-white/10 rounded-xl text-white"
                                min={1}
                                max={12}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Questions/Day</label>
                            <input
                                type="number"
                                value={formData.questions_per_day}
                                onChange={(e) => setFormData({ ...formData, questions_per_day: parseInt(e.target.value) })}
                                className="w-full px-4 py-3 bg-surface-deep border border-white/10 rounded-xl text-white"
                                min={1}
                                max={10}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Select Questions</label>
                        <div className="max-h-48 overflow-y-auto border border-white/10 rounded-xl p-2">
                            {questions.map((q) => (
                                <label key={q.id} className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.question_ids.includes(q.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setFormData({ ...formData, question_ids: [...formData.question_ids, q.id] });
                                            } else {
                                                setFormData({ ...formData, question_ids: formData.question_ids.filter(id => id !== q.id) });
                                            }
                                        }}
                                        className="w-4 h-4 rounded border-gray-600"
                                    />
                                    <span className="text-white text-sm truncate">{q.title}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-white/10 text-gray-400 rounded-xl hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-cyan-500 text-white rounded-xl font-medium disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Create Plan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Plan Details Modal Component
function PlanDetailsModal({ plan, onClose }: { plan: any; onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">{plan.name}</h2>
                        {plan.company && <p className="text-gray-400">{plan.company.name}</p>}
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>
                <p className="text-gray-400 mb-6">{plan.description}</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-surface-deep rounded-xl p-4">
                        <p className="text-gray-400 text-sm">Duration</p>
                        <p className="text-xl font-bold text-white">{plan.duration_weeks} weeks</p>
                    </div>
                    <div className="bg-surface-deep rounded-xl p-4">
                        <p className="text-gray-400 text-sm">Daily Questions</p>
                        <p className="text-xl font-bold text-white">{plan.questions_per_day}</p>
                    </div>
                </div>

                {plan.items && (
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Questions</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {plan.items.map((item: any, index: number) => (
                                <div key={item.id} className="flex items-center gap-3 p-3 bg-surface-deep rounded-xl">
                                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-gray-400">
                                        {index + 1}
                                    </span>
                                    {item.question ? (
                                        <span className="text-white flex-1">{item.question.title}</span>
                                    ) : (
                                        <span className="text-gray-500 flex-1">Question {index + 1}</span>
                                    )}
                                    {item.status === 'completed' ? (
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                    ) : (
                                        <Clock className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex gap-4 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border border-white/10 text-gray-400 rounded-xl hover:text-white"
                    >
                        Close
                    </button>
                    <button
                        onClick={() => window.location.href = '/interview/session'}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-cyan-500 text-white rounded-xl font-medium"
                    >
                        Start Practice
                    </button>
                </div>
            </div>
        </div>
    );
}
