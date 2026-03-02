import { useState, useEffect } from "react";
import { InterviewSession, AnswerRequest, TranscriptEntry } from "@/types/interview-session.types";

export function useInterviewSession() {
    const [session, setSession] = useState<InterviewSession | null>(null);
    const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
    const [isSessionActive, setIsSessionActive] = useState(false);

    // Start a new interview session
    const startSession = async (
        companyId?: string,
        interviewType: 'system_design' | 'coding' | 'behavioral' = 'system_design',
        difficulty: 'easy' | 'medium' | 'hard' = 'medium'
    ) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/interview/sessions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    company_id: companyId,
                    interview_type: interviewType,
                    difficulty: difficulty,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to start interview session");
            }

            setSession(data.session);
            setIsSessionActive(true);
            setTranscripts([]);

            // Get first question
            const questions = await generateFirstQuestion(companyId, interviewType, difficulty);
            if (questions.length > 0) {
                setCurrentQuestion(questions[0]);
            }

            return data.session;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to start interview";
            setError(errorMessage);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    // Answer a question
    const answerQuestion = async (answer: string) => {
        if (!session || !currentQuestion) {
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            const request: AnswerRequest = {
                session_id: session.id,
                question: currentQuestion,
                response: answer,
            };

            const response = await fetch("/api/interview/transcript", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(request),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to process answer");
            }

            // Update transcripts with proper typing
            const transcriptEntry: TranscriptEntry = {
                question: currentQuestion,
                response: answer,
                feedback: data.transcript?.feedback,
                score: data.transcript?.score,
                followUpQuestions: data.transcript?.follow_up_questions,
            };
            setTranscripts((prev) => [...prev, transcriptEntry]);

            // Set next question
            if (data.follow_up_question) {
                setCurrentQuestion(data.follow_up_question);
            } else {
                // No more questions, end session
                setIsSessionActive(false);
                setCurrentQuestion(null);
                await completeSession();
            }

            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to process answer";
            setError(errorMessage);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    // Complete the interview session
    const completeSession = async () => {
        if (!session) {
            return;
        }

        setIsLoading(true);

        try {
            // Calculate overall score
            const score = await calculateOverallScore(transcripts);

            // Update session status and score
            const response = await fetch("/api/interview/sessions", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: session.id,
                    status: "completed",
                    score: score,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update session status");
            }

            const data = await response.json();
            setSession(data.session);
        } catch (err) {
            console.error("Error completing session:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Cancel the interview session
    const cancelSession = async () => {
        if (!session) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/interview/sessions", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: session.id,
                    status: "cancelled",
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to cancel session");
            }

            const data = await response.json();
            setSession(data.session);
            setIsSessionActive(false);
            setCurrentQuestion(null);
        } catch (err) {
            console.error("Error cancelling session:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Load interview session from ID
    const loadSession = async (sessionId: string) => {
        setIsLoading(true);
        setError(null);

        try {
            // First, check if we have active sessions in localStorage
            const savedSession = localStorage.getItem(`interview-session-${sessionId}`);
            if (savedSession) {
                const parsedSession = JSON.parse(savedSession);
                setSession(parsedSession);
                setIsSessionActive(parsedSession.status === "in_progress");
                setCurrentQuestion(parsedSession.currentQuestion || null);

                const savedTranscripts = localStorage.getItem(`interview-transcripts-${sessionId}`);
                if (savedTranscripts) {
                    setTranscripts(JSON.parse(savedTranscripts));
                }
            }

            // Also try to load from server
            const response = await fetch("/api/interview/sessions", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to load interview sessions");
            }

            const data = await response.json();
            const serverSession = data.sessions.find((s: any) => s.id === sessionId);

            if (serverSession) {
                setSession(serverSession);
                setIsSessionActive(serverSession.status === "in_progress");

                // Load transcripts from server
                const transcriptsResponse = await fetch(`/api/interview/transcript?session_id=${sessionId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (transcriptsResponse.ok) {
                    const transcriptsData = await transcriptsResponse.json();
                    setTranscripts(transcriptsData.transcripts);
                }
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to load session";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to generate first question
    const generateFirstQuestion = async (
        companyId?: string,
        interviewType?: string,
        difficulty?: string
    ) => {
        const prompt = `
Generate 3-5 interview questions for a ${interviewType} interview at a top tech company with ${difficulty} difficulty.

Focus on real-world scenarios and practical knowledge.
Return the questions as a numbered list.
`;

        try {
            const response = await fetch("/api/ai/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: prompt,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to generate questions");
            }

            const data = await response.json();
            return parseQuestions(data.content);
        } catch (err) {
            console.error("Error generating first question:", err);
            return [
                "Tell me about a time when you had to make a technical decision under pressure.",
                "How would you design a scalable system for handling 1 million requests per second?",
                "Explain a complex technical concept to a non-technical person.",
                "Describe a project where you had to optimize performance."
            ];
        }
    };

    // Helper function to calculate overall score from transcripts
    const calculateOverallScore = async (transcripts: TranscriptEntry[]) => {
        if (transcripts.length === 0) return 0;

        const scores = transcripts.map(t => (t.score ?? 5) * 10);
        const average = scores.reduce((a, b) => a + b, 0) / scores.length;

        return Math.round(average); // 0-100 scale
    };

    // Helper function to parse questions from AI response
    const parseQuestions = (text: string) => {
        const lines = text.split('\n');
        const questions = lines
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('```'))
            .filter(line => line.match(/^\d+\.|\?\s*$|Question:/));

        return questions;
    };

    // Save session to localStorage for persistence
    useEffect(() => {
        if (session) {
            localStorage.setItem(`interview-session-${session.id}`, JSON.stringify({
                ...session,
                currentQuestion: currentQuestion
            }));
        }
    }, [session, currentQuestion]);

    // Save transcripts to localStorage
    useEffect(() => {
        if (session && transcripts.length > 0) {
            localStorage.setItem(`interview-transcripts-${session.id}`, JSON.stringify(transcripts));
        }
    }, [transcripts, session]);

    return {
        session,
        transcripts,
        isLoading,
        error,
        currentQuestion,
        isSessionActive,
        startSession,
        answerQuestion,
        completeSession,
        cancelSession,
        loadSession,
        setError,
    };
}
