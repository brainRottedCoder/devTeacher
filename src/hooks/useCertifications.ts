import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Certification,
    UserCertification,
    CertificationExam,
    CertificationProgress,
    ExamQuestion,
} from '@/types/certification.types';

interface UseCertificationsOptions {
    userId?: string;
}

export function useCertifications(options: UseCertificationsOptions = {}) {
    const queryClient = useQueryClient();

    const { data: certifications, isLoading: loadingCertifications } = useQuery<Certification[]>({
        queryKey: ['certifications'],
        queryFn: async () => {
            const res = await fetch('/api/certifications');
            if (!res.ok) throw new Error('Failed to fetch certifications');
            return res.json();
        },
    });

    const { data: userCertifications, isLoading: loadingUserCerts } = useQuery<UserCertification[]>({
        queryKey: ['user-certifications', options.userId],
        queryFn: async () => {
            if (!options.userId) return [];
            const res = await fetch('/api/certifications/my');
            if (!res.ok) throw new Error('Failed to fetch user certifications');
            return res.json();
        },
        enabled: !!options.userId,
    });

    const { data: progress, isLoading: loadingProgress } = useQuery<CertificationProgress>({
        queryKey: ['certification-progress', options.userId],
        queryFn: async () => {
            const res = await fetch(`/api/certifications/progress`);
            if (!res.ok) throw new Error('Failed to fetch progress');
            return res.json();
        },
        enabled: !!options.userId,
    });

    const getCertificationProgress = useCallback((certificationId: string): CertificationProgress | null => {
        if (!certifications || !userCertifications) return null;

        const certification = certifications.find(c => c.id === certificationId);
        const userCert = userCertifications.find(uc => uc.cert_id === certificationId);

        if (!certification) return null;

        return {
            certification,
            userCertification: userCert || null,
            requirementProgress: certification.requirements?.map(req => ({
                requirement: req,
                current_value: 0,
                is_met: false,
            })) || [],
        };
    }, [certifications, userCertifications]);

    const startExam = useMutation({
        mutationFn: async (certificationId: string) => {
            const res = await fetch('/api/certifications/exam/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ certificationId }),
            });
            if (!res.ok) throw new Error('Failed to start exam');
            return res.json() as Promise<CertificationExam>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-certifications'] });
        },
    });

    const submitAnswer = useCallback((examId: string, questionId: string, answer: string) => {
        // Now handled locally in useCertificationExam hook
    }, []);

    const completeExam = useMutation({
        mutationFn: async ({ attemptId, certId, answers }: { attemptId: string; certId: string; answers: any }) => {
            const res = await fetch(`/api/certifications/${certId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attemptId, answers }),
            });
            if (!res.ok) throw new Error('Failed to complete exam');
            return res.json() as Promise<{ score: number; passed: boolean; certificate?: any; message: string }>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-certifications'] });
            queryClient.invalidateQueries({ queryKey: ['certification-progress'] });
        },
    });

    const downloadCertificate = useCallback(async (certificationId: string) => {
        const res = await fetch(`/api/certifications/${certificationId}/download`);
        if (!res.ok) throw new Error('Failed to download certificate');

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificate-${certificationId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
    }, []);

    return {
        certifications,
        userCertifications,
        progress,
        isLoading: loadingCertifications || loadingUserCerts || loadingProgress,
        getCertificationProgress,
        startExam,
        submitAnswer,
        completeExam,
        downloadCertificate,
    };
}

export function useCertificationExam(examId: string | null) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: exam, isLoading } = useQuery<CertificationExam>({
        queryKey: ['exam', examId],
        queryFn: async () => {
            if (!examId) throw new Error('No exam ID');
            const res = await fetch(`/api/certifications/exam/${examId}`);
            if (!res.ok) throw new Error('Failed to fetch exam');
            return res.json();
        },
        enabled: !!examId,
    });

    const questions = exam?.questions || [];
    const currentQuestion = questions[currentQuestionIndex];
    const totalQuestions = questions.length;
    const answeredCount = Object.keys(answers).length;
    const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

    const setAnswer = useCallback((questionId: string, answer: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    }, []);

    const nextQuestion = useCallback(() => {
        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    }, [currentQuestionIndex, totalQuestions]);

    const prevQuestion = useCallback(() => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    }, [currentQuestionIndex]);

    const jumpToQuestion = useCallback((index: number) => {
        if (index >= 0 && index < totalQuestions) {
            setCurrentQuestionIndex(index);
        }
    }, [totalQuestions]);

    return {
        exam,
        questions,
        currentQuestion,
        currentQuestionIndex,
        totalQuestions,
        answers,
        answeredCount,
        progress,
        timeRemaining,
        setTimeRemaining,
        isLoading,
        isSubmitting,
        setIsSubmitting,
        setAnswer,
        nextQuestion,
        prevQuestion,
        jumpToQuestion,
    };
}
