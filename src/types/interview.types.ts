// Interview Preparation Types

export interface Company {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    description: string | null;
    focus_areas: string[];
    difficulty_level: 'easy' | 'medium' | 'hard';
    created_at: string;
    updated_at: string;
}

export interface InterviewQuestion {
    id: string;
    company_id: string;
    type: QuestionType;
    difficulty: DifficultyLevel;
    title: string;
    content: string;
    hints: string[] | null;
    sample_answer: SampleAnswer | null;
    topics: string[];
    created_at: string;
    updated_at: string;
    // Joined fields
    company?: Company;
}

export interface SampleAnswer {
    summary: string;
    key_points: string[];
    example_code?: string;
    time_estimate?: string;
}

export type QuestionType = 'system_design' | 'coding' | 'behavioral';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface StudyPlan {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    target_company_id: string | null;
    duration_weeks: number;
    questions_per_day: number;
    status: 'active' | 'completed' | 'paused';
    created_at: string;
    updated_at: string;
    // Joined fields
    company?: Company;
    items?: StudyPlanItem[];
}

export interface StudyPlanItem {
    id: string;
    plan_id: string;
    question_id: string;
    day_number: number;
    status: 'pending' | 'completed' | 'skipped';
    completed_at: string | null;
    user_notes: string | null;
    created_at: string;
    // Joined fields
    question?: InterviewQuestion;
}

export interface QuestionAttempt {
    id: string;
    user_id: string;
    question_id: string;
    attempt_number: number;
    user_answer: string | null;
    time_spent_seconds: number | null;
    was_correct: boolean | null;
    feedback: Record<string, unknown> | null;
    created_at: string;
    // Joined fields
    question?: InterviewQuestion;
}

// API Request/Response types
export interface GetQuestionsParams {
    companyId?: string;
    type?: QuestionType;
    difficulty?: DifficultyLevel;
    topic?: string;
    limit?: number;
    offset?: number;
}

export interface CreateStudyPlanRequest {
    name: string;
    description?: string;
    target_company_id?: string;
    duration_weeks: number;
    questions_per_day: number;
    question_ids: string[];
}

export interface SubmitAnswerRequest {
    question_id: string;
    user_answer: string;
    time_spent_seconds: number;
}

export interface SubmitAnswerResponse {
    success: boolean;
    was_correct: boolean | null;
    feedback: {
        score: number;
        summary: string;
        improvements: string[];
        sample_answer?: SampleAnswer;
    };
}

// Filter options for UI
export const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
    { value: 'system_design', label: 'System Design' },
    { value: 'coding', label: 'Coding' },
    { value: 'behavioral', label: 'Behavioral' },
];

export const DIFFICULTY_LEVELS: { value: DifficultyLevel; label: string; color: string }[] = [
    { value: 'easy', label: 'Easy', color: 'text-green-400' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-400' },
    { value: 'hard', label: 'Hard', color: 'text-red-400' },
];

export const TOPICS = [
    'databases',
    'caching',
    'scalability',
    'api_design',
    'microservices',
    'data_structures',
    'algorithms',
    'hash_tables',
    'linked_lists',
    'arrays',
    'trees',
    'graphs',
    'dynamic_programming',
    'communication',
    'leadership',
    'problem_solving',
    'teamwork',
    'customer_obsession',
];
