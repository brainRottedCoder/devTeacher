'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import {
    Trophy,
    Target,
    Clock,
    Star,
    TrendingUp,
    BookOpen,
    CheckCircle,
    AlertCircle,
    ArrowRight,
    Download,
    RefreshCw,
    Home,
    Share2
} from 'lucide-react';

interface QuestionBreakdown {
    question: string;
    score: number;
    feedback: string;
    topics: string[];
}

interface SessionReport {
    sessionId: string;
    overallScore: number;
    totalQuestions: number;
    completedQuestions: number;
    totalTimeSeconds: number;
    averageScore: number;
    strengths: string[];
    areasForImprovement: string[];
    detailedFeedback: string;
    nextSteps: string[];
    questionBreakdown: QuestionBreakdown[];
    companyFocus?: string;
    interviewType: string;
    difficulty: string;
    generatedAt: string;
}

// Wrap the page in Suspense since useSearchParams requires it for static export
export default function InterviewFeedbackPage() {
    return (
        <Suspense fallback={
            <MainLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading feedback...</p>
                    </div>
                </div>
            </MainLayout>
        }>
            <FeedbackContent />
        </Suspense>
    );
}

function FeedbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    
    const sessionId = searchParams.get('sessionId');
    const [report, setReport] = useState<SessionReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'next-steps'>('overview');

    useEffect(() => {
        if (!sessionId) {
            setReport(getEmptyReport());
            setLoading(false);
            return;
        }
        fetchReport(sessionId);
    }, [sessionId]);

    const fetchReport = async (id: string) => {
        try {
            setLoading(true);
            
            // Use session_id parameter to match the API
            const response = await fetch(`/api/interview/feedback?session_id=${encodeURIComponent(id)}`);
            
            if (!response.ok) {
                console.error('Feedback API error:', response.status);
                setReport(getEmptyReport());
                setLoading(false);
                return;
            }
            
            const data = await response.json();
            
            // Check if we have valid session data
            if (data.session && data.transcripts && data.transcripts.length > 0) {
                // Transform API response to SessionReport format
                setReport(transformToSessionReport(data));
            } else if (data.error) {
                console.error('Feedback API error:', data.error);
                // If session exists but no transcripts, still show the session data
                if (data.session) {
                    setReport(transformToSessionReport(data));
                } else {
                    setReport(getEmptyReport());
                }
            } else {
                // No session found - could be a demo or test session
                // Try to construct a report from whatever data we have
                setReport(transformToSessionReport(data));
            }
        } catch (error) {
            console.error('Error fetching report:', error);
            setReport(getEmptyReport());
        } finally {
            setLoading(false);
        }
    };

    const transformToSessionReport = (data: any): SessionReport => {
        const transcripts = data.transcripts || [];
        
        // If no transcripts, create a default report
        if (transcripts.length === 0) {
            // If we have a session but no transcripts, it might be a new session
            if (data.session) {
                return {
                    sessionId: data.session?.id || 'unknown',
                    overallScore: data.session?.score || 0,
                    totalQuestions: data.statistics?.total_questions || 0,
                    completedQuestions: 0,
                    totalTimeSeconds: 0,
                    averageScore: data.statistics?.average_score || 0,
                    strengths: data.ai_feedback?.strengths || [],
                    areasForImprovement: data.ai_feedback?.weaknesses || [],
                    detailedFeedback: data.ai_feedback || 'Complete your interview to see detailed feedback.',
                    nextSteps: data.recommendations || ['Start practicing with mock interviews'],
                    questionBreakdown: [],
                    companyFocus: data.session?.company?.name,
                    interviewType: data.session?.interview_type || 'system_design',
                    difficulty: data.session?.difficulty || 'medium',
                    generatedAt: new Date().toISOString(),
                };
            }
            // Return mock if no session at all
            return getEmptyReport();
        }
        
        const questionBreakdown = transcripts.map((t: any, index: number) => ({
            question: t.question || `Question ${index + 1}`,
            score: (t.score || 5) * 10,
            feedback: t.feedback || 'No feedback available',
            topics: extractTopics(t.question || ''),
        }));

        return {
            sessionId: data.session?.id || 'unknown',
            overallScore: data.session?.score || data.statistics?.average_score || 0,
            totalQuestions: data.statistics?.total_questions || transcripts.length,
            completedQuestions: transcripts.length,
            totalTimeSeconds: 0,
            averageScore: data.statistics?.average_score || 0,
            // Use AI feedback if available, otherwise generate from transcripts
            strengths: data.ai_feedback?.strengths || generateStrengthsFromTranscripts(transcripts),
            areasForImprovement: data.ai_feedback?.weaknesses || generateWeaknessesFromTranscripts(transcripts),
            detailedFeedback: typeof data.ai_feedback === 'string' ? data.ai_feedback : data.ai_feedback?.detailed_feedback || generateDetailedFeedback(transcripts),
            nextSteps: data.recommendations || generateNextSteps(data.statistics?.average_score || 0),
            questionBreakdown,
            companyFocus: data.session?.company?.name,
            interviewType: data.session?.interview_type || 'system_design',
            difficulty: data.session?.difficulty || 'medium',
            generatedAt: new Date().toISOString(),
        };
    };

    // Helper functions to generate feedback from transcripts when AI feedback is not available
    const generateStrengthsFromTranscripts = (transcripts: any[]): string[] => {
        const strengths: string[] = [];
        const highScoring = transcripts.filter((t: any) => (t.score || 5) >= 7);
        
        if (highScoring.length > 0) {
            strengths.push(`Strong performance in ${highScoring.length} out of ${transcripts.length} questions`);
        }
        if (transcripts.some((t: any) => t.response && t.response.length > 100)) {
            strengths.push('Provided detailed explanations');
        }
        if (strengths.length === 0) {
            strengths.push('Completed the interview successfully');
            strengths.push('Demonstrated willingness to practice');
        }
        return strengths;
    };

    const generateWeaknessesFromTranscripts = (transcripts: any[]): string[] => {
        const weaknesses: string[] = [];
        const lowScoring = transcripts.filter((t: any) => (t.score || 5) < 6);
        
        if (lowScoring.length > 0) {
            weaknesses.push(`Focus on improving ${lowScoring.length} areas with lower scores`);
        }
        const shortAnswers = transcripts.filter((t: any) => !t.response || t.response.length < 50);
        if (shortAnswers.length > 0) {
            weaknesses.push('Provide more detailed answers with examples');
        }
        if (weaknesses.length === 0) {
            weaknesses.push('Continue practicing to improve consistency');
        }
        return weaknesses;
    };

    const generateDetailedFeedback = (transcripts: any[]): string => {
        const avgScore = transcripts.reduce((sum: number, t: any) => sum + (t.score || 5), 0) / transcripts.length;
        
        if (avgScore >= 8) {
            return `Excellent performance! You demonstrated strong understanding across ${transcripts.length} questions. Keep up the great work and continue challenging yourself with more complex scenarios.`;
        } else if (avgScore >= 6) {
            return `Good progress! You showed solid understanding in many areas. Focus on providing more detailed explanations and considering edge cases in your solutions.`;
        } else {
            return `Keep practicing! Focus on understanding the fundamental concepts and try to provide more comprehensive answers. Consider breaking down problems more systematically.`;
        }
    };

    const generateNextSteps = (avgScore: number): string[] => {
        if (avgScore >= 80) {
            return [
                'Practice with harder difficulty questions',
                'Try company-specific interview formats',
                'Focus on maintaining consistency'
            ];
        } else if (avgScore >= 60) {
            return [
                'Review system design fundamentals',
                'Practice thinking out loud',
                'Focus on scalability considerations'
            ];
        } else {
            return [
                'Start with basic system design concepts',
                'Practice common interview patterns',
                'Review distributed systems fundamentals'
            ];
        }
    };

    const extractTopics = (question: string): string[] => {
        const topics: string[] = [];
        const lower = question.toLowerCase();
        if (lower.includes('scale')) topics.push('scalability');
        if (lower.includes('database') || lower.includes('data')) topics.push('database');
        if (lower.includes('cache')) topics.push('caching');
        if (lower.includes('load balanc')) topics.push('load balancing');
        if (lower.includes('microservice')) topics.push('microservices');
        if (lower.includes('api')) topics.push('api design');
        if (lower.includes('algorithm')) topics.push('algorithms');
        return topics.length > 0 ? topics : ['general'];
    };

    const getEmptyReport = (): SessionReport => ({
        sessionId: 'unknown',
        overallScore: 0,
        totalQuestions: 0,
        completedQuestions: 0,
        totalTimeSeconds: 0,
        averageScore: 0,
        strengths: [],
        areasForImprovement: [],
        detailedFeedback: 'No interview data available.',
        nextSteps: [],
        questionBreakdown: [],
        interviewType: 'Unknown',
        difficulty: 'Unknown',
        generatedAt: new Date().toISOString()
    });

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'bg-green-500/20 border-green-500/30';
        if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/30';
        return 'bg-red-500/20 border-red-500/30';
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const getGrade = (score: number) => {
        if (score >= 90) return { letter: 'A+', label: 'Excellent' };
        if (score >= 80) return { letter: 'A', label: 'Great' };
        if (score >= 70) return { letter: 'B+', label: 'Good' };
        if (score >= 60) return { letter: 'B', label: 'Fair' };
        if (score >= 50) return { letter: 'C', label: 'Needs Work' };
        return { letter: 'D', label: 'Keep Practicing' };
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-400">Generating your report...</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (!report) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                        <p className="text-xl text-gray-300 mb-4">Report not found</p>
                        <button
                            onClick={() => router.push('/interview')}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
                        >
                            Back to Interview
                        </button>
                    </div>
                </div>
            </MainLayout>
        );
    }

    const grade = getGrade(report.overallScore);

    return (
        <MainLayout>
            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 border-2 border-blue-500/30 mb-4">
                        <Trophy className="h-12 w-12 text-yellow-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Interview Complete!</h1>
                    <p className="text-gray-400">
                        {report.interviewType === 'system_design' ? 'System Design' : report.interviewType} Interview
                        {report.companyFocus && ` • ${report.companyFocus}`}
                    </p>
                </div>

                {/* Score Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className={`p-6 rounded-2xl border ${getScoreBg(report.overallScore)} text-center`}>
                        <p className="text-gray-400 text-sm mb-2">Overall Score</p>
                        <div className="text-5xl font-bold mb-2">
                            <span className={getScoreColor(report.overallScore)}>{report.overallScore}</span>
                            <span className="text-2xl text-gray-500">/100</span>
                        </div>
                        <div className={`inline-block px-4 py-1 rounded-full text-lg font-semibold ${getScoreColor(report.overallScore)} bg-black/20`}>
                            Grade: {grade.letter}
                        </div>
                    </div>
                    <div className="p-6 rounded-2xl border border-gray-700/50 bg-gray-800/30 text-center">
                        <Clock className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm mb-1">Total Time</p>
                        <p className="text-2xl font-bold text-white">{formatTime(report.totalTimeSeconds)}</p>
                    </div>
                    <div className="p-6 rounded-2xl border border-gray-700/50 bg-gray-800/30 text-center">
                        <BookOpen className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm mb-1">Questions</p>
                        <p className="text-2xl font-bold text-white">
                            {report.completedQuestions}/{report.totalQuestions}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto">
                    {(['overview', 'details', 'next-steps'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                                activeTab === tab
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                        >
                            {tab === 'overview' && 'Overview'}
                            {tab === 'details' && 'Question Details'}
                            {tab === 'next-steps' && 'Next Steps'}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-green-400" />
                                    Your Strengths
                                </h3>
                                <ul className="space-y-2">
                                    {report.strengths.map((strength, i) => (
                                        <li key={i} className="flex items-start gap-2 text-gray-300">
                                            <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                                            {strength}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                    <Target className="h-5 w-5 text-yellow-400" />
                                    Areas for Improvement
                                </h3>
                                <ul className="space-y-2">
                                    {report.areasForImprovement.map((area, i) => (
                                        <li key={i} className="flex items-start gap-2 text-gray-300">
                                            <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                            {area}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3">Detailed Feedback</h3>
                                <div className="bg-gray-900/50 rounded-lg p-4 text-gray-300 whitespace-pre-line">
                                    {report.detailedFeedback}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'details' && (
                        <div className="space-y-4">
                            {report.questionBreakdown.map((q, i) => (
                                <div key={i} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="font-medium text-white">{q.question}</h4>
                                        <span className={`font-bold ${getScoreColor(q.score)}`}>{q.score}/100</span>
                                    </div>
                                    <p className="text-gray-400 text-sm mb-3">{q.feedback}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {q.topics.map((topic, j) => (
                                            <span key={j} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">{topic}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'next-steps' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white mb-4">Recommended Next Steps</h3>
                            <div className="grid gap-3">
                                {report.nextSteps.map((step, i) => (
                                    <div key={i} className="flex items-center gap-3 p-4 bg-gray-900/50 rounded-lg border border-gray-700/30">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">{i + 1}</div>
                                        <p className="text-gray-300">{step}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                                <h4 className="font-semibold text-white mb-2">Pro Tip</h4>
                                <p className="text-gray-400 text-sm">
                                    Practice with our study plans to improve your skills. 
                                    Focus on the areas identified above and track your progress over time.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-4 mt-8 justify-center">
                    <button onClick={() => router.push('/interview')} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors">
                        <RefreshCw className="h-5 w-5" /> Practice Again
                    </button>
                    <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors">
                        <Home className="h-5 w-5" /> Go to Dashboard
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors">
                        <Download className="h-5 w-5" /> Download Report
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors">
                        <Share2 className="h-5 w-5" /> Share Results
                    </button>
                </div>
            </div>
        </MainLayout>
    );
}
