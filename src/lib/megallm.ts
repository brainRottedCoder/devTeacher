import OpenAI from "openai";
import { LEARNING_ASSISTANT_SYSTEM_PROMPT } from "./prompts";

const MEGALLM_BASE_URL = "https://ai.megallm.io/v1";
const MEGALLM_MODEL = "openai-gpt-oss-120b";

// Create OpenAI client configured for MegaLLM
export function createMegallmClient(apiKey?: string) {
    return new OpenAI({
        apiKey: apiKey || process.env.MEGALLM_API_KEY || "",
        baseURL: MEGALLM_BASE_URL,
    });
}

export interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface ChatRequest {
    message: string;
    context?: {
        moduleId?: string;
        lessonId?: string;
        moduleTitle?: string;
        lessonTitle?: string;
    };
    history?: ChatMessage[];
}

export interface ChatResponse {
    content: string;
    usage?: {
        input_tokens: number;
        output_tokens: number;
    };
}

// Send a chat message to MegaLLM
export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    const client = createMegallmClient();

    // Build conversation messages
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    // Add system prompt
    messages.push({
        role: "system",
        content: LEARNING_ASSISTANT_SYSTEM_PROMPT,
    });

    // Add previous messages if provided
    if (request.history && request.history.length > 0) {
        for (const msg of request.history.slice(-10)) { // Limit to last 10 messages
            if (msg.role !== "system") {
                messages.push({
                    role: msg.role,
                    content: msg.content,
                });
            }
        }
    }

    // Add context if available
    let contextInfo = "";
    if (request.context?.moduleTitle) {
        contextInfo += `\nCurrent Module: ${request.context.moduleTitle}`;
    }
    if (request.context?.lessonTitle) {
        contextInfo += `\nCurrent Lesson: ${request.context.lessonTitle}`;
    }

    // Add the current message with context
    const userMessage = contextInfo
        ? `${request.message}\n\n${contextInfo}`
        : request.message;

    messages.push({
        role: "user",
        content: userMessage,
    });

    try {
        const response = await client.chat.completions.create({
            model: MEGALLM_MODEL,
            messages,
            max_tokens: 2048,
            temperature: 0.7,
        });

        return {
            content: response.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.",
            usage: {
                input_tokens: response.usage?.prompt_tokens || 0,
                output_tokens: response.usage?.completion_tokens || 0,
            },
        };
    } catch (error) {
        console.error("MegaLLM API Error:", error);
        throw new Error(
            error instanceof Error ? error.message : "Failed to get response from AI"
        );
    }
}

// Streaming chat (for real-time responses)
export async function* sendChatMessageStream(
    request: ChatRequest
): AsyncGenerator<string, void, unknown> {
    const client = createMegallmClient();

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    messages.push({
        role: "system",
        content: LEARNING_ASSISTANT_SYSTEM_PROMPT,
    });

    if (request.history && request.history.length > 0) {
        for (const msg of request.history.slice(-10)) {
            if (msg.role !== "system") {
                messages.push({
                    role: msg.role,
                    content: msg.content,
                });
            }
        }
    }

    let contextInfo = "";
    if (request.context?.moduleTitle) {
        contextInfo += `\nCurrent Module: ${request.context.moduleTitle}`;
    }
    if (request.context?.lessonTitle) {
        contextInfo += `\nCurrent Lesson: ${request.context.lessonTitle}`;
    }

    const userMessage = contextInfo
        ? `${request.message}\n\n${contextInfo}`
        : request.message;

    messages.push({
        role: "user",
        content: userMessage,
    });

    const stream = await client.chat.completions.create({
        model: MEGALLM_MODEL,
        messages,
        max_tokens: 2048,
        temperature: 0.7,
        stream: true,
    });

    for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
            yield content;
        }
    }
}
