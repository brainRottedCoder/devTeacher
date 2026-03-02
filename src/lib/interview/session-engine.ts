/**
 * Interview Session Engine
 * 
 * Complete flow management for AI Mock Interviews:
 * - Question sequencing engine
 * - Session state machine
 * - Scoring pipeline
 * - Final feedback report generation
 */

import { sendChatMessage } from "@/lib/megallm";
import {
    INTERVIEWER_ANALYZE_ANSWER_PROMPT,
    INTERVIEWER_FOLLOW_UP_PROMPT,
    INTERVIEWER_GENERATE_QUESTIONS_PROMPT,
    INTERVIEWER_OVERALL_FEEDBACK_PROMPT
} from "@/lib/prompts";
import { createClient } from "@supabase/supabase-js";

// Types
export type InterviewStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type InterviewDifficulty = 'easy' | 'medium' | 'hard';
export type InterviewType = 'system_design' | 'coding' | 'behavioral';

export interface QuestionSequence {
    questions: InterviewQuestion[];
    currentIndex: number;
    completedQuestions: CompletedQuestion[];
    isComplete: boolean;
}

export interface InterviewQuestion {
    id: string;
    title: string;
    content: string;
    type: InterviewType;
    difficulty: InterviewDifficulty;
    hints: string[];
    topics: string[];
    companyId?: string;
}

export interface CompletedQuestion {
    question: InterviewQuestion;
    userAnswer: string;
    aiFeedback: QuestionFeedback;
    timeSpentSeconds: number;
    followUpQuestions: string[];
}

export interface QuestionFeedback {
    score: number; // 1-10
    strengths: string[];
    areasForImprovement: string[];
    feedback: string;
    suggestedFollowUps: string[];
}

export interface SessionReport {
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
    interviewType: InterviewType;
    difficulty: InterviewDifficulty;
    generatedAt: string;
}

export interface QuestionBreakdown {
    question: string;
    score: number;
    feedback: string;
    topics: string[];
}

// Session State Machine
export class InterviewSessionEngine {
    private status: InterviewStatus = 'pending';
    private questionSequence: QuestionSequence | null = null;
    private sessionId: string | null = null;
    private startTime: number = 0;
    private currentQuestionStartTime: number = 0;
    
    // Configuration
    private maxQuestions: number = 5;
    private timePerQuestion: number = 300; // 5 minutes default
    
    constructor(config?: { maxQuestions?: number; timePerQuestion?: number }) {
        if (config?.maxQuestions) this.maxQuestions = config.maxQuestions;
        if (config?.timePerQuestion) this.timePerQuestion = config.timePerQuestion;
    }
    
    // State transitions
    start(sessionId: string): void {
        this.sessionId = sessionId;
        this.status = 'in_progress';
        this.startTime = Date.now();
    }
    
    complete(): void {
        this.status = 'completed';
    }
    
    cancel(): void {
        this.status = 'cancelled';
    }
    
    getStatus(): InterviewStatus {
        return this.status;
    }
    
    // Question Sequencing Engine
    async generateQuestionSequence(
        companyId?: string,
        interviewType: InterviewType = 'system_design',
        difficulty: InterviewDifficulty = 'medium'
    ): Promise<QuestionSequence> {
        const prompt = INTERVIEWER_GENERATE_QUESTIONS_PROMPT(
            companyId || 'general',
            interviewType,
            difficulty
        );
        
        try {
            const response = await sendChatMessage({ message: prompt });
            const questions = this.parseQuestions(response.content, interviewType, difficulty);
            
            this.questionSequence = {
                questions,
                currentIndex: 0,
                completedQuestions: [],
                isComplete: false
            };
            
            return this.questionSequence;
        } catch (error) {
            console.error("Error generating questions:", error);
            // Return default questions as fallback
            return this.getDefaultQuestions(interviewType, difficulty);
        }
    }
    
    private parseQuestions(content: string, type: InterviewType, difficulty: InterviewDifficulty): InterviewQuestion[] {
        const questions: InterviewQuestion[] = [];
        
        // Try to parse as JSON
        try {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
                return parsed.map((q, index) => ({
                    id: q.id || `q-${index}`,
                    title: q.title || 'Question',
                    content: q.content || q.question || '',
                    type,
                    difficulty: q.difficulty || difficulty,
                    hints: q.hints || [],
                    topics: q.topics || [],
                    companyId: q.company_id
                }));
            }
        } catch {
            // Not JSON, try to parse from text
        }
        
        // Fallback: extract questions from text
        const lines = content.split('\n');
        let currentQuestion: Partial<InterviewQuestion> = {};
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.match(/^\d+[.\)]\s/)) {
                if (currentQuestion.content) {
                    questions.push({
                        id: `q-${questions.length}`,
                        title: currentQuestion.title || `Question ${questions.length + 1}`,
                        content: currentQuestion.content,
                        type,
                        difficulty,
                        hints: currentQuestion.hints || [],
                        topics: currentQuestion.topics || []
                    });
                }
                currentQuestion = { content: trimmed.replace(/^\d+[.\)]\s/, '') };
            } else if (trimmed.toLowerCase().startsWith('title:')) {
                currentQuestion.title = trimmed.replace(/title:\s*/i, '');
            } else if (currentQuestion.content) {
                currentQuestion.content += ' ' + trimmed;
            }
        }
        
        // Add last question
        if (currentQuestion.content) {
            questions.push({
                id: `q-${questions.length}`,
                title: currentQuestion.title || `Question ${questions.length + 1}`,
                content: currentQuestion.content,
                type,
                difficulty,
                hints: currentQuestion.hints || [],
                topics: currentQuestion.topics || []
            });
        }
        
        // Ensure we have at least some questions
        if (questions.length === 0) {
            return this.getDefaultQuestions(type, difficulty).questions;
        }
        
        return questions.slice(0, this.maxQuestions);
    }
    
    private getDefaultQuestions(type: InterviewType, difficulty: InterviewDifficulty): QuestionSequence {
        const defaults: InterviewQuestion[] = [
            {
                id: 'q-1',
                title: 'Introduce Yourself',
                content: 'Tell me about yourself and why you are interested in this role.',
                type: 'behavioral',
                difficulty: 'easy',
                hints: ['Use STAR method', 'Keep it concise', 'Focus on relevant experience'],
                topics: ['communication', 'self-awareness']
            },
            {
                id: 'q-2',
                title: 'Design a URL Shortener',
                content: 'Design a URL shortening service like bit.ly. How would you handle millions of users?',
                type: 'system_design',
                difficulty: 'medium',
                hints: ['Consider the data model', 'Think about caching', 'Handle high traffic'],
                topics: ['databases', 'caching', 'scalability']
            },
            {
                id: 'q-3',
                title: 'Technical Challenge',
                content: 'Given an array of integers, find the maximum subarray sum.',
                type: 'coding',
                difficulty: 'medium',
                hints: ['Dynamic programming approach', 'Kadane\'s algorithm'],
                topics: ['algorithms', 'dynamic_programming']
            },
            {
                id: 'q-4',
                title: 'Leadership Scenario',
                content: 'Tell me about a time you had to manage a difficult team situation.',
                type: 'behavioral',
                difficulty: 'medium',
                hints: ['Be specific', 'Show accountability', 'Demonstrate growth'],
                topics: ['leadership', 'conflict_resolution']
            },
            {
                id: 'q-5',
                title: 'System Design - Chat App',
                content: 'Design a real-time chat application like WhatsApp. How would you handle message delivery?',
                type: 'system_design',
                difficulty: 'hard',
                hints: ['WebSocket vs polling', 'Message queuing', 'Encryption'],
                topics: ['real_time', 'websockets', 'databases']
            }
        ];
        
        // Filter by type
        const filtered = type === 'behavioral' || type === 'coding' || type === 'system_design'
            ? defaults.filter(q => q.type === type || q.type === 'behavioral')
            : defaults;
        
        return {
            questions: filtered.slice(0, this.maxQuestions),
            currentIndex: 0,
            completedQuestions: [],
            isComplete: false
        };
    }
    
    // Get current question
    getCurrentQuestion(): InterviewQuestion | null {
        if (!this.questionSequence) return null;
        return this.questionSequence.questions[this.questionSequence.currentIndex] || null;
    }
    
    // Answer a question and get AI feedback
    async answerQuestion(answer: string): Promise<{
        feedback: QuestionFeedback;
        nextQuestion: InterviewQuestion | null;
        isComplete: boolean;
    }> {
        if (!this.questionSequence) {
            throw new Error("No active question sequence");
        }
        
        const currentQ = this.getCurrentQuestion();
        if (!currentQ) {
            throw new Error("No current question");
        }
        
        const timeSpent = this.currentQuestionStartTime 
            ? Math.floor((Date.now() - this.currentQuestionStartTime) / 1000)
            : this.timePerQuestion;
        
        // Get AI feedback
        const feedback = await this.getQuestionFeedback(currentQ, answer);
        
        // Get follow-up questions
        const followUps = await this.generateFollowUps(currentQ, answer);
        
        // Store completed question
        const completedQuestion: CompletedQuestion = {
            question: currentQ,
            userAnswer: answer,
            aiFeedback: feedback,
            timeSpentSeconds: timeSpent,
            followUpQuestions: followUps
        };
        
        this.questionSequence.completedQuestions.push(completedQuestion);
        
        // Move to next question
        this.questionSequence.currentIndex++;
        
        // Check if complete
        const isComplete = 
            this.questionSequence.currentIndex >= this.questionSequence.questions.length ||
            this.questionSequence.completedQuestions.length >= this.maxQuestions;
        
        this.questionSequence.isComplete = isComplete;
        
        if (isComplete) {
            this.complete();
        }
        
        return {
            feedback,
            nextQuestion: isComplete ? null : this.getCurrentQuestion(),
            isComplete
        };
    }
    
    // Scoring Pipeline
    private async getQuestionFeedback(question: InterviewQuestion, answer: string): Promise<QuestionFeedback> {
        const prompt = INTERVIEWER_ANALYZE_ANSWER_PROMPT(question.content, answer);
        
        try {
            const response = await sendChatMessage({ message: prompt });
            return this.parseFeedback(response.content);
        } catch (error) {
            console.error("Error getting feedback:", error);
            return this.getDefaultFeedback();
        }
    }
    
    private parseFeedback(content: string): QuestionFeedback {
        // Try to parse JSON
        try {
            const parsed = JSON.parse(content);
            return {
                score: Math.max(1, Math.min(10, parsed.score || 5)),
                strengths: parsed.strengths || [],
                areasForImprovement: parsed.areas_for_improvement || [],
                feedback: parsed.feedback || content,
                suggestedFollowUps: parsed.suggested_follow_ups || []
            };
        } catch {
            // Extract score from text
            const scoreMatch = content.match(/\d+(\.\d+)?/);
            const score = scoreMatch 
                ? Math.max(1, Math.min(10, parseFloat(scoreMatch[0])))
                : 5;
            
            return {
                score,
                strengths: this.extractList(content, ['good', 'great', 'excellent', 'strong', 'well']),
                areasForImprovement: this.extractList(content, ['improve', 'need', 'should', 'could', 'weak']),
                feedback: content.substring(0, 500),
                suggestedFollowUps: []
            };
        }
    }
    
    private extractList(text: string, keywords: string[]): string[] {
        const sentences = text.split(/[.!?]/);
        return sentences
            .filter(s => keywords.some(k => s.toLowerCase().includes(k)))
            .slice(0, 3)
            .map(s => s.trim());
    }
    
    private getDefaultFeedback(): QuestionFeedback {
        return {
            score: 5,
            strengths: ['Attempted the question'],
            areasForImprovement: ['Need more practice'],
            feedback: 'Unable to analyze answer due to technical issues.',
            suggestedFollowUps: []
        };
    }
    
    private async generateFollowUps(question: InterviewQuestion, answer: string): Promise<string[]> {
        const prompt = INTERVIEWER_FOLLOW_UP_PROMPT(question.content, answer);
        
        try {
            const response = await sendChatMessage({ message: prompt });
            const lines = response.content.split('\n');
            return lines
                .filter(l => l.trim().match(/^\?|^[a-z]/))
                .slice(0, 2)
                .map(l => l.replace(/^[-\d.]\s*/, '').trim());
        } catch {
            return [];
        }
    }
    
    // Generate Final Report
    async generateReport(sessionId: string): Promise<SessionReport> {
        if (!this.questionSequence) {
            throw new Error("No completed session");
        }
        
        const completedQuestions = this.questionSequence.completedQuestions;
        const totalTime = Math.floor((Date.now() - this.startTime) / 1000);
        
        // Calculate scores
        const scores = completedQuestions.map(q => q.aiFeedback.score);
        const averageScore = scores.length > 0 
            ? scores.reduce((a, b) => a + b, 0) / scores.length 
            : 0;
        
        // Aggregate strengths and areas
        const allStrengths = completedQuestions.flatMap(q => q.aiFeedback.strengths);
        const allAreas = completedQuestions.flatMap(q => q.aiFeedback.areasForImprovement);
        
        // Get overall feedback from AI
        let detailedFeedback = '';
        try {
            const prompt = INTERVIEWER_OVERALL_FEEDBACK_PROMPT(
                completedQuestions.map(q => ({
                    question: q.question.title,
                    answer: q.userAnswer,
                    score: q.aiFeedback.score
                }))
            );
            const response = await sendChatMessage({ message: prompt });
            detailedFeedback = response.content;
        } catch {
            detailedFeedback = `You completed ${completedQuestions.length} questions with an average score of ${averageScore.toFixed(1)}/10.`;
        }
        
        return {
            sessionId,
            overallScore: Math.round(averageScore * 10), // 0-100 scale
            totalQuestions: this.questionSequence.questions.length,
            completedQuestions: completedQuestions.length,
            totalTimeSeconds: totalTime,
            averageScore: Math.round(averageScore * 10),
            strengths: [...new Set(allStrengths)].slice(0, 5),
            areasForImprovement: [...new Set(allAreas)].slice(0, 5),
            detailedFeedback,
            nextSteps: this.generateNextSteps(averageScore),
            questionBreakdown: completedQuestions.map(q => ({
                question: q.question.title,
                score: q.aiFeedback.score * 10,
                feedback: q.aiFeedback.feedback.substring(0, 200),
                topics: q.question.topics
            })),
            interviewType: completedQuestions[0]?.question.type || 'system_design',
            difficulty: completedQuestions[0]?.question.difficulty || 'medium',
            generatedAt: new Date().toISOString()
        };
    }
    
    private generateNextSteps(averageScore: number): string[] {
        if (averageScore >= 8) {
            return [
                'Great job! Focus on maintaining your skills',
                'Practice with more advanced system design questions',
                'Consider mock interviews with real peers'
            ];
        } else if (averageScore >= 6) {
            return [
                'Review the areas identified for improvement',
                'Practice system design fundamentals',
                'Try more behavioral interview questions'
            ];
        } else {
            return [
                'Focus on understanding core system design concepts',
                'Practice coding problems daily',
                'Review common behavioral questions'
            ];
        }
    }
    
    // Progress tracking
    getProgress(): { current: number; total: number; percentage: number } {
        if (!this.questionSequence) {
            return { current: 0, total: this.maxQuestions, percentage: 0 };
        }
        
        const current = this.questionSequence.completedQuestions.length;
        const total = this.maxQuestions;
        return {
            current,
            total,
            percentage: Math.round((current / total) * 100)
        };
    }
}

// Factory function
export function createInterviewSession(config?: { maxQuestions?: number; timePerQuestion?: number }) {
    return new InterviewSessionEngine(config);
}

export default InterviewSessionEngine;
