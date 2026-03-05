import { useState, useEffect, useRef } from "react";
import { InterviewSession, AnswerRequest, TranscriptEntry } from "@/types/interview-session.types";

export function useInterviewSession() {
    const [session, setSession] = useState<InterviewSession | null>(null);
    const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
    const [isSessionActive, setIsSessionActive] = useState(false);

    // Refs to always have the latest values (avoids stale closures)
    const sessionRef = useRef<InterviewSession | null>(null);
    const currentQuestionRef = useRef<string | null>(null);

    useEffect(() => { sessionRef.current = session; }, [session]);
    useEffect(() => { currentQuestionRef.current = currentQuestion; }, [currentQuestion]);

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

            console.log("[Interview] Raw API response:", JSON.stringify(data));
            console.log("[Interview] data.session:", data.session);
            console.log("[Interview] data.session?.id:", data.session?.id);

            // The API might return the session directly or nested
            const sessionData = data.session || data;
            
            if (!sessionData?.id) {
                console.error("[Interview] Session data missing 'id' field:", sessionData);
                throw new Error("Session created but missing ID. Cannot proceed.");
            }

            console.log("[Interview] Setting session with id:", sessionData.id);
            setSession(sessionData);
            sessionRef.current = sessionData; // Sync ref immediately
            setIsSessionActive(true);
            setTranscripts([]);

            // Get first question
            const questions = await generateFirstQuestion(companyId, interviewType, difficulty);
            if (questions.length > 0) {
                setCurrentQuestion(questions[0]);
                currentQuestionRef.current = questions[0]; // Sync ref immediately
            } else {
                // Fallback question if parsing fails
                const fallback = "Tell me about a challenging technical problem you've solved recently and how you approached it.";
                setCurrentQuestion(fallback);
                currentQuestionRef.current = fallback;
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

    // Answer a question — accepts session ID and question text explicitly from caller
    // to avoid all stale closure / ref issues
    const answerQuestion = async (answer: string, explicitSessionId?: string, explicitQuestion?: string) => {
        // Use explicit params if provided, fall back to refs, then state
        const sessionId = explicitSessionId || sessionRef.current?.id || session?.id;
        const questionText = explicitQuestion || currentQuestionRef.current || currentQuestion;
        
        console.log("Submitting answer:", { sessionId, questionText: questionText?.substring(0, 30), answerLength: answer.length });

        // Validate session and question exist
        if (!sessionId) {
            setError("No active session. Please start a new interview.");
            return null;
        }

        if (!questionText) {
            setError("No current question. Please wait for the question to load.");
            return null;
        }

        // Basic client-side validation for better UX
        if (!answer.trim()) {
            setError("Please enter an answer");
            return null;
        }

        if (answer.trim().length < 10) {
            setError("Please provide a more detailed answer (at least 10 characters)");
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            const request: AnswerRequest = {
                session_id: sessionId,
                question: questionText,
                response: answer.trim(),
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
                question: questionText || "",
                response: answer,
                feedback: data.feedback,
                score: data.score,
                suggested_answer: data.suggested_answer,
                followUpQuestions: data.transcript?.follow_up_questions,
            };
            setTranscripts((prev) => [...prev, transcriptEntry]);

            // Check if session is completed
            if (data.session_completed) {
                setIsSessionActive(false);
                setCurrentQuestion(null);
                currentQuestionRef.current = null;
                const completedSession = session ? { ...session, status: "completed" } : null;
                setSession(completedSession as InterviewSession | null);
                sessionRef.current = completedSession as InterviewSession | null;
                
                // Complete session on backend
                await completeSession();
                
                return {
                    ...data,
                    sessionCompleted: true
                };
            }

            // Set next question if available
            if (data.follow_up_question) {
                setCurrentQuestion(data.follow_up_question);
                currentQuestionRef.current = data.follow_up_question;
            } else {
                // No more questions, end session
                setIsSessionActive(false);
                setCurrentQuestion(null);
                currentQuestionRef.current = null;
                await completeSession();
            }

            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to process answer";
            setError(errorMessage);
            console.error("Error in answerQuestion:", err);
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
        const prompt = `Generate 3-5 interview questions for a ${interviewType} interview at a top tech company with ${difficulty} difficulty. Focus on real-world scenarios and practical knowledge. Return the questions as a numbered list.`;

        try {
            // Get auth token for the AI chat API
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();
            const { data: { session: authSession } } = await supabase.auth.getSession();
            // Note: getSession() on the client is fine for getting the token.
            // The Supabase warning is about server-side usage.
            const token = authSession?.access_token;

            if (!token) {
                return [
                    "Tell me about a time when you had to make a technical decision under pressure.",
                    "How would you design a scalable system for handling 1 million requests per second?",
                    "Explain a complex technical concept to a non-technical person.",
                    "Describe a project where you had to optimize performance."
                ];
            }

            const response = await fetch("/api/ai/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
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
    const parseQuestions = (text: string): string[] => {
        const lines = text.split('\n');
        const questions = lines
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('```'))
            // Match numbered lines like "1." or "1)" or lines ending with "?"
            .filter(line => line.match(/^\d+[.)\s]/) || line.includes('?'))
            // Clean up the numbering prefix
            .map(line => line.replace(/^\d+[.)\s]+/, '').trim())
            .filter(line => line.length > 10); // Filter out too-short lines

        if (questions.length === 0) {
            // Fallback: if regex didn't match, just take non-empty lines that look like questions
            return lines
                .map(line => line.trim())
                .filter(line => line.length > 20 && !line.startsWith('```') && !line.startsWith('#'))
                .slice(0, 5);
        }

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
