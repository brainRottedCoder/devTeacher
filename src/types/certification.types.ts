export interface Certification {
    id: string;
    title: string;
    description: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    passing_score: number;
    time_limit_minutes?: number;
    created_at?: string;
    question_count?: number;
    requirements?: CertificationRequirement[];
}

export interface CertificationRequirement {
    id: string;
    type: 'module_complete' | 'quiz_score' | 'lab_complete' | 'interview_score' | 'design_create';
    label: string;
    target_value: number;
    metadata?: Record<string, any>;
}

export interface UserCertification {
    id: string;
    user_id: string;
    cert_id: string;
    attempt_id: string;
    verification_hash: string;
    issued_at: string;
    expires_at?: string;
    // Joined data
    certifications?: {
        title: string;
        difficulty: string;
        description: string;
    };
}

export interface CertificationExam {
    id: string;
    certificationId: string;
    certificationTitle?: string;
    questions: ExamQuestion[];
    totalQuestions?: number;
    timeLimit?: number;
    timeRemaining?: number;
    passingScore?: number;
    startedAt?: string;
}

export interface ExamQuestion {
    id: string;
    question: string;
    type: 'multiple_choice' | 'true_false' | 'fill_blank';
    options?: string[];
    points: number;
    order: number;
    // Note: correct_answer is not sent to client
}

export interface CertificationProgress {
    certification: Certification;
    userCertification: UserCertification | null;
    requirementProgress: RequirementProgress[];
}

export interface RequirementProgress {
    requirement: CertificationRequirement;
    current_value: number;
    is_met: boolean;
}

export interface CertificationAttempt {
    id: string;
    user_id: string;
    cert_id: string;
    score?: number;
    passed?: boolean;
    started_at: string;
    completed_at?: string;
    answers?: Record<string, string>;
    certifications?: {
        title: string;
        passing_score: number;
    };
}

export const CERTIFICATION_DIFFICULTY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    beginner: { label: 'Beginner', color: 'text-green-400', bg: 'bg-green-500/20' },
    intermediate: { label: 'Intermediate', color: 'text-amber-400', bg: 'bg-amber-500/20' },
    advanced: { label: 'Advanced', color: 'text-red-400', bg: 'bg-red-500/20' },
};
