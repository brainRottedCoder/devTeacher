export type InterviewStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type InterviewDifficulty = 'easy' | 'medium' | 'hard';

export interface InterviewSession {
    id: string;
    user_id: string;
    company_id?: string;
    interview_type: 'system_design' | 'coding' | 'behavioral';
    difficulty: InterviewDifficulty;
    status: InterviewStatus;
    questions_asked?: any[];
    user_responses?: any[];
    feedback?: any;
    score?: number;
    duration_seconds?: number;
    created_at: string;
    updated_at: string;
}

export interface InterviewTranscript {
    id: string;
    session_id: string;
    question: string;
    response?: string;
    follow_up_questions?: string[];
    feedback?: string;
    score?: number;
    suggested_answer?: string;
    timestamp: string;
}

export interface TranscriptEntry {
    question: string;
    response: string;
    feedback?: string;
    score?: number;
    suggested_answer?: string;
    followUpQuestions?: string[];
}

export interface InterviewRequest {
    company_id?: string;
    interview_type: 'system_design' | 'coding' | 'behavioral';
    difficulty?: InterviewDifficulty;
}

export interface AnswerRequest {
    session_id: string;
    question: string;
    response: string;
}

export interface InterviewFeedback {
    overall_score: number;
    strengths: string[];
    areas_for_improvement: string[];
    detailed_feedback: string;
    next_steps: string[];
}
