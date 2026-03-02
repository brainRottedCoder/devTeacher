'use client';

import { useState, Suspense, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useInterviewSession } from '@/hooks/useInterviewSession';
import { useVoiceInterview } from '@/hooks/useVoiceInterview';
import { MainLayout } from '@/components/MainLayout';
import { Mic, MicOff, Volume2, VolumeX, Send, Loader2, AlertCircle } from 'lucide-react';

function InterviewContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated } = useAuth();

    const companyId = searchParams.get('company') || undefined;
    const interviewType = (searchParams.get('type') as 'system_design' | 'coding' | 'behavioral') || 'system_design';
    const difficulty = (searchParams.get('difficulty') as 'easy' | 'medium' | 'hard') || 'medium';

    const {
        session,
        transcripts,
        isLoading,
        error,
        currentQuestion,
        isSessionActive,
        startSession,
        answerQuestion,
        cancelSession,
    } = useInterviewSession();

    const {
        isListening,
        isSpeaking,
        isSupported,
        error: voiceError,
        interimTranscript,
        startListening,
        stopListening,
        speak,
        stopSpeaking,
    } = useVoiceInterview({
        onTranscript: (text, isFinal) => {
            if (isFinal && text) {
                setAnswer(prev => prev + ' ' + text);
            }
        },
        language: 'en-US',
    });

    const [answer, setAnswer] = useState('');
    const [isAnswering, setIsAnswering] = useState(false);
    const [voiceMode, setVoiceMode] = useState(false);
    const answerRef = useRef(answer);

    useEffect(() => {
        answerRef.current = answer;
    }, [answer]);

    const handleStart = async () => {
        await startSession(companyId, interviewType, difficulty);
    };

    const handleSubmitAnswer = async () => {
        const currentAnswer = answerRef.current;
        if (!currentAnswer.trim() || !isSessionActive) return;

        setIsAnswering(true);
        const result = await answerQuestion(currentAnswer);

        if (result) {
            setAnswer('');
            if (voiceMode && result.feedback) {
                await speak(result.feedback);
            }
        }

        setIsAnswering(false);
    };

    const toggleVoiceMode = () => {
        if (voiceMode) {
            stopListening();
            stopSpeaking();
        }
        setVoiceMode(!voiceMode);
    };

    const handleVoiceInput = useCallback(() => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }, [isListening, startListening, stopListening]);

    const handleEndSession = async () => {
        if (confirm('Are you sure you want to end the interview?')) {
            stopSpeaking();
            stopListening();
            await cancelSession();
            router.push('/interview');
        }
    };

    if (isSessionActive && currentQuestion) {
        return (
            <MainLayout>
                <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
                    <div className="max-w-3xl mx-auto px-4 py-8">
                        <div className="rounded-2xl border border-white/[0.06] bg-surface-card p-8">
                            {/* Header */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h1 className="text-2xl font-bold text-white">
                                        AI Mock Interview
                                    </h1>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={toggleVoiceMode}
                                            className={`p-2 rounded-lg transition-colors ${
                                                voiceMode
                                                    ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                                                    : 'bg-white/[0.04] text-gray-400 hover:text-white'
                                            }`}
                                            title={voiceMode ? 'Disable voice mode' : 'Enable voice mode'}
                                        >
                                            {voiceMode ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                                        </button>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            voiceMode ? 'bg-violet-500/20 text-violet-400' : 'bg-gray-800 text-gray-400'
                                        }`}>
                                            {voiceMode ? 'Voice Mode' : 'Text Mode'}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-gray-400">
                                    {companyId ? 'Company-specific interview' : 'General technical interview'}
                                </p>
                            </div>

                            {/* Progress */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-400">Question {transcripts.length + 1}</span>
                                    <span className={`text-sm font-medium ${
                                        isSessionActive ? 'text-emerald-400' : 'text-gray-400'
                                    }`}>
                                        {isSessionActive ? 'In Progress' : 'Completed'}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-2">
                                    <div
                                        className="bg-gradient-to-r from-violet-600 to-indigo-600 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${((transcripts.length + 1) / 5) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Current Question */}
                            <div className="mb-8">
                                <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-6">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                                            <span className="text-violet-400 text-sm font-bold">Q</span>
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-white mb-2">
                                                {currentQuestion}
                                            </h2>
                                            <p className="text-gray-400 text-sm">
                                                Take your time to think through your answer. Be clear and structured.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Voice Controls */}
                            {voiceMode && isSupported.recognition && (
                                <div className="mb-6">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleVoiceInput}
                                            disabled={!isSessionActive || isAnswering || isSpeaking}
                                            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                                                isListening
                                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                                                    : 'bg-violet-500/20 text-violet-400 border border-violet-500/30 hover:bg-violet-500/30'
                                            } disabled:opacity-50`}
                                        >
                                            {isListening ? (
                                                <>
                                                    <MicOff className="w-5 h-5" />
                                                    Listening...
                                                </>
                                            ) : (
                                                <>
                                                    <Mic className="w-5 h-5" />
                                                    Start Speaking
                                                </>
                                            )}
                                        </button>
                                        {isSpeaking && (
                                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                <Volume2 className="w-5 h-5 animate-pulse" />
                                                AI Speaking...
                                            </div>
                                        )}
                                    </div>
                                    {interimTranscript && (
                                        <div className="mt-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                                            <p className="text-gray-400 text-sm">
                                                <span className="text-gray-500">Hearing: </span>
                                                {interimTranscript}
                                            </p>
                                        </div>
                                    )}
                                    {(voiceError || !isSupported.recognition) && (
                                        <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                            <p className="text-amber-400 text-sm flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4" />
                                                {voiceError || 'Voice input not supported in this browser'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Answer Input */}
                            <div className="mb-6">
                                <textarea
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    placeholder={voiceMode ? "Your voice input will appear here, or type manually..." : "Type your answer here..."}
                                    rows={6}
                                    className="w-full px-4 py-3 bg-surface-deep border border-white/[0.06] rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 resize-none"
                                    disabled={!isSessionActive || isAnswering}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                <button
                                    onClick={handleSubmitAnswer}
                                    disabled={!isSessionActive || !answer.trim() || isAnswering}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 transition-all"
                                >
                                    {isAnswering ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            Submit Answer
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleEndSession}
                                    disabled={!isSessionActive || isAnswering}
                                    className="px-6 py-3 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                                >
                                    End Interview
                                </button>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                                    <p className="text-red-400 text-sm flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        {error}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Transcript */}
                        {transcripts.length > 0 && (
                            <div className="mt-8 rounded-2xl border border-white/[0.06] bg-surface-card p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Interview Transcript</h3>
                                <div className="space-y-4 max-h-60 overflow-y-auto">
                                    {transcripts.map((transcript, index) => (
                                        <div key={index} className="p-4 rounded-xl bg-surface-deep border border-white/[0.04]">
                                            <div className="text-sm font-medium text-violet-400 mb-2">
                                                Question {index + 1}
                                            </div>
                                            <p className="text-gray-300 mb-3">{transcript.question}</p>
                                            <div className="text-sm font-medium text-gray-400 mb-2">Your Answer</div>
                                            <p className="text-gray-300 mb-3">{transcript.response}</p>
                                            {transcript.feedback && (
                                                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                                    <div className="text-sm font-medium text-emerald-400 mb-2">Feedback</div>
                                                    <p className="text-emerald-300 text-sm">{transcript.feedback}</p>
                                                    {transcript.score && (
                                                        <div className="mt-2 text-sm text-emerald-400">
                                                            Score: {transcript.score}/10
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center px-4">
                <div className="max-w-md w-full">
                    <div className="rounded-2xl border border-white/[0.06] bg-surface-card p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-violet-500/20 flex items-center justify-center">
                            <Mic className="w-8 h-8 text-violet-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-4">AI Mock Interview</h1>
                        <p className="text-gray-400 mb-6">
                            Practice with voice-enabled AI interviews. Get real-time feedback on your answers.
                        </p>

                        <div className="p-4 rounded-xl bg-surface-deep border border-white/[0.04] mb-6">
                            <div className="grid grid-cols-2 gap-4 text-left">
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Type</div>
                                    <div className="text-sm text-white capitalize">
                                        {interviewType === 'system_design' ? 'System Design' : interviewType}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Difficulty</div>
                                    <div className="text-sm text-white capitalize">{difficulty}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Duration</div>
                                    <div className="text-sm text-white">20-30 min</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Questions</div>
                                    <div className="text-sm text-white">5-7</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleStart}
                                disabled={!isAuthenticated || isLoading}
                                className="w-full px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 transition-all"
                            >
                                {isLoading ? 'Preparing...' : 'Start Interview'}
                            </button>
                            <button
                                onClick={() => router.push('/interview')}
                                className="w-full px-6 py-3 border border-white/[0.06] text-gray-400 rounded-xl hover:text-white hover:border-white/20 transition-all"
                            >
                                Back to Interview Prep
                            </button>
                        </div>

                        {error && (
                            <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}

export default function InterviewSessionPage() {
    return (
        <Suspense fallback={
            <MainLayout>
                <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                </div>
            </MainLayout>
        }>
            <InterviewContent />
        </Suspense>
    );
}
