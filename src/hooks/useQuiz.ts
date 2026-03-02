"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
}

export interface Quiz {
    id: string;
    lesson_id: string;
    title: string;
    questions: QuizQuestion[];
    passing_score: number;
}

export interface QuizAttempt {
    id: string;
    quiz_id: string;
    score: number;
    passed: boolean;
    results: {
        questionId: string;
        userAnswer: number;
        correctAnswer: number;
        isCorrect: boolean;
        explanation: string;
    }[];
    totalQuestions: number;
    correctCount: number;
}

interface QuizResponse {
    quiz: Quiz | null;
}

async function fetchQuiz(lessonId: string): Promise<Quiz | null> {
    const response = await fetch(`/api/quizzes?lesson_id=${lessonId}`);
    if (!response.ok) {
        if (response.status === 404) {
            return null;
        }
        throw new Error("Failed to fetch quiz");
    }
    const data: QuizResponse = await response.json();
    return data.quiz;
}

interface SubmitAttemptParams {
    quiz_id: string;
    answers: number[];
}

async function submitQuizAttempt(params: SubmitAttemptParams): Promise<QuizAttempt> {
    const response = await fetch("/api/quizzes", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        throw new Error("Failed to submit quiz attempt");
    }
    const data = await response.json();
    return data.attempt;
}

export function useQuiz(lessonId: string) {
    return useQuery({
        queryKey: ["quiz", lessonId],
        queryFn: () => fetchQuiz(lessonId),
        enabled: !!lessonId,
        staleTime: 5 * 60 * 1000,
    });
}

export function useSubmitQuizAttempt() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: submitQuizAttempt,
        onSuccess: (data) => {
            // Invalidate quiz attempts cache
            queryClient.invalidateQueries({ queryKey: ["quizAttempts"] });
        },
    });
}
