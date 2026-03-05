import { sendChatMessage } from "@/lib/megallm";
import {
    INTERVIEWER_ANALYZE_ANSWER_PROMPT,
    INTERVIEWER_FOLLOW_UP_PROMPT,
    INTERVIEWER_GENERATE_QUESTIONS_PROMPT,
    INTERVIEWER_OVERALL_FEEDBACK_PROMPT,
    INTERVIEWER_TARGETED_QUESTIONS_PROMPT
} from "@/lib/prompts";

export async function analyzeAnswer(question: string, answer: string): Promise<{
    score: number;
    feedback: string;
    suggested_answer?: string;
}> {
    const prompt = INTERVIEWER_ANALYZE_ANSWER_PROMPT(question, answer);

    try {
        const response = await sendChatMessage({ message: prompt });
        const analysis = parseAnalysis(response.content);
        return analysis;
    } catch (error) {
        console.error("Error analyzing answer:", error);
        return {
            score: 5,
            feedback: "Unable to analyze answer due to technical issues. Your answer shows basic understanding but could benefit from more details and examples.",
            suggested_answer: "The ideal answer would cover the core concepts, discuss trade-offs, and provide real-world examples."
        };
    }
}

export async function generateFollowUpQuestion(question: string, answer: string): Promise<string | null> {
    const prompt = INTERVIEWER_FOLLOW_UP_PROMPT(question, answer);

    try {
        const response = await sendChatMessage({ message: prompt });
        return response.content.trim() || null;
    } catch (error) {
        console.error("Error generating follow-up question:", error);
        return null;
    }
}

export async function generateInterviewQuestions(
    companyId: string,
    interviewType: string,
    difficulty: string = "medium"
): Promise<string[]> {
    const prompt = INTERVIEWER_GENERATE_QUESTIONS_PROMPT(companyId, interviewType, difficulty);

    try {
        const response = await sendChatMessage({ message: prompt });
        const questions = parseQuestions(response.content);
        return questions;
    } catch (error) {
        console.error("Error generating interview questions:", error);
        return [
            "Tell me about a time when you had to make a technical decision under pressure.",
            "How would you design a scalable system for handling 1 million requests per second?",
            "Explain a complex technical concept to a non-technical person.",
            "Describe a project where you had to optimize performance."
        ];
    }
}

export async function generateOverallFeedback(sessions: any[]): Promise<any> {
    const prompt = INTERVIEWER_OVERALL_FEEDBACK_PROMPT(sessions);

    try {
        const response = await sendChatMessage({ message: prompt });
        
        let jsonStr = response.content.trim();
        // Remove markdown formatting if the LLM adds it despite instructions
        if (jsonStr.startsWith('\`\`\`json')) {
            jsonStr = jsonStr.substring(7);
            if (jsonStr.endsWith('\`\`\`')) {
                jsonStr = jsonStr.substring(0, jsonStr.length - 3);
            }
        }
        
        try {
             return JSON.parse(jsonStr);
        } catch (parseError) {
             console.error("Error parsing JSON feedback:", parseError, "Raw output:", response.content);
             return {
                 detailed_feedback: response.content.trim(),
                 strengths: ["Completed the comprehensive technical interview portion."],
                 weaknesses: ["AI response failed to structure properly, could not extract distinct weaknesses."],
                 recommendations: ["Focus on continuing your practice with mock interviews."],
                 study_topics: ["System Design Architecture Overview"]
             };
        }
    } catch (error) {
        console.error("Error generating overall feedback:", error);
        return {
            detailed_feedback: "Your interview shows strong technical understanding. Continue practicing with real-world scenarios and focus on system design patterns.",
            strengths: ["Strong problem solving approach", "Good communication skills under pressure"],
            weaknesses: ["Provide more structure to your answers", "Focus on detailing edge cases"],
            recommendations: ["Review common architectural patterns", "Practice thinking out loud"],
            study_topics: ["Scalability considerations", "Data modeling tradeoffs"]
        };
    }
}

export async function generateTargetedQuestionsFeedback(
    weakAreas: string[],
    interviewType: string,
    difficulty: string
): Promise<string[]> {
    const prompt = INTERVIEWER_TARGETED_QUESTIONS_PROMPT(weakAreas, interviewType, difficulty);

    try {
        const response = await sendChatMessage({ message: prompt });
        
        let jsonStr = response.content.trim();
        if (jsonStr.startsWith('\`\`\`json')) {
            jsonStr = jsonStr.substring(7);
            if (jsonStr.endsWith('\`\`\`')) {
                jsonStr = jsonStr.substring(0, jsonStr.length - 3);
            }
        }
        
        try {
            const questions = JSON.parse(jsonStr);
            if (Array.isArray(questions)) {
                return questions.slice(0, 5);
            }
            throw new Error("Parsed result is not an array");
        } catch (parseError) {
             console.error("Error parsing targeted questions JSON:", parseError);
             return [
                "How would you design a URL shortening service like bit.ly?",
                "Design a distributed cache system.",
                "How would you handle millions of concurrent connections?",
             ];
        }
    } catch (error) {
        console.error("Error generating targeted questions:", error);
        return [
            "How would you design a URL shortening service like bit.ly?",
            "Design a distributed cache system.",
            "How would you handle millions of concurrent connections?",
        ];
    }
}

function parseAnalysis(response: string): { score: number; feedback: string; suggested_answer?: string } {
    try {
        let jsonStr = response.trim();
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.substring(7);
            if (jsonStr.endsWith('```')) {
                jsonStr = jsonStr.substring(0, jsonStr.length - 3);
            }
        }
        
        // Try to parse JSON first
        const parsed = JSON.parse(jsonStr);
        return {
            score: Math.max(1, Math.min(10, parsed.score || 5)),
            feedback: parsed.feedback || "Answer shows basic understanding but could be more detailed.",
            suggested_answer: parsed.suggested_answer
        };
    } catch {
        // If not JSON, extract score from text
        const scoreMatch = response.match(/\d+(\.\d+)?/);
        const score = scoreMatch ? Math.max(1, Math.min(10, parseFloat(scoreMatch[0]))) : 5;

        return {
            score,
            feedback: response.trim(),
            suggested_answer: "Could not retrieve a suggested answer. Please follow structured formats like the STAR method (Situation, Task, Action, Result)."
        };
    }
}

function parseQuestions(response: string): string[] {
    const lines = response.split('\n');
    const questions = lines
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('```'))
        .filter(line => line.match(/^\d+\.|\?\s*$|Question:/));

    if (questions.length === 0) {
        return [
            "Tell me about a time when you had to make a technical decision under pressure.",
            "How would you design a scalable system for handling 1 million requests per second?",
            "Explain a complex technical concept to a non-technical person.",
            "Describe a project where you had to optimize performance."
        ];
    }

    return questions;
}

export async function calculateScore(transcripts: any[]): Promise<number> {
    if (transcripts.length === 0) return 0;

    const scores = transcripts.map(t => t.score || 5);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;

    return Math.round(average * 10); // 0-100 scale
}
