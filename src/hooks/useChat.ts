"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface ChatContext {
    moduleId?: string;
    lessonId?: string;
    moduleTitle?: string;
    lessonTitle?: string;
}

interface UseChatOptions {
    context?: ChatContext;
    onError?: (error: Error) => void;
    streaming?: boolean;
    persistHistory?: boolean;
}

// Persist a message to the DB (fire-and-forget)
async function persistMessage(role: string, content: string, context?: ChatContext) {
    try {
        await fetch("/api/chat/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role, content, context }),
        });
    } catch {
        // Silent fail — persistence is non-critical
    }
}

export function useChat(options: UseChatOptions = {}) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const shouldPersist = options.persistHistory !== false;

    // Load chat history on mount
    useEffect(() => {
        if (!shouldPersist || historyLoaded) return;

        async function loadHistory() {
            try {
                const res = await fetch("/api/chat/history?limit=50");
                if (res.ok) {
                    const data = await res.json();
                    if (data.messages && data.messages.length > 0) {
                        const loaded: ChatMessage[] = data.messages.map((m: any) => ({
                            role: m.role as "user" | "assistant",
                            content: m.content,
                        }));
                        setMessages(loaded);
                    }
                }
            } catch {
                // Silent fail
            } finally {
                setHistoryLoaded(true);
            }
        }

        loadHistory();
    }, [shouldPersist, historyLoaded]);

    // Non-streaming send message
    const sendMessage = useCallback(
        async (content: string) => {
            const userMessage: ChatMessage = {
                role: "user",
                content,
            };
            setMessages((prev) => [...prev, userMessage]);
            setIsLoading(true);
            setError(null);

            // Persist user message
            if (shouldPersist) persistMessage("user", content, options.context);

            abortControllerRef.current = new AbortController();

            try {
                const supabase = createClient();

                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (!session?.access_token) {
                    throw new Error("Not authenticated. Please log in to use the chat.");
                }

                const response = await fetch("/api/ai/chat", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                        message: content,
                        context: options.context,
                        history: messages.slice(-10),
                    }),
                    signal: abortControllerRef.current.signal,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Failed to get response");
                }

                const data = await response.json();

                const assistantMessage: ChatMessage = {
                    role: "assistant",
                    content: data.content,
                };
                setMessages((prev) => [...prev, assistantMessage]);

                // Persist assistant message
                if (shouldPersist) persistMessage("assistant", data.content, options.context);

                return data;
            } catch (err) {
                if (err instanceof Error && err.name === "AbortError") {
                    return;
                }

                const error = err instanceof Error ? err : new Error("Unknown error");
                setError(error);
                options.onError?.(error);
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        [messages, options, shouldPersist]
    );

    // Streaming send message
    const sendStreamingMessage = useCallback(
        async (content: string) => {
            const userMessage: ChatMessage = {
                role: "user",
                content,
            };
            setMessages((prev) => [...prev, userMessage]);
            setIsLoading(true);
            setError(null);

            // Persist user message
            if (shouldPersist) persistMessage("user", content, options.context);

            // Add placeholder for assistant message
            const assistantPlaceholder: ChatMessage = {
                role: "assistant",
                content: "",
            };
            setMessages((prev) => [...prev, assistantPlaceholder]);

            abortControllerRef.current = new AbortController();

            try {
                const supabase = createClient();

                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (!session?.access_token) {
                    throw new Error("Not authenticated. Please log in to use the chat.");
                }

                const response = await fetch("/api/ai/chat/stream", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                        message: content,
                        context: options.context,
                        history: messages.slice(-10),
                    }),
                    signal: abortControllerRef.current.signal,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Failed to get response");
                }

                if (!response.body) {
                    throw new Error("No response body");
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let fullContent = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split("\n");

                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            try {
                                const data = JSON.parse(line.slice(6));

                                if (data.error) {
                                    throw new Error(data.error);
                                }

                                if (data.content) {
                                    fullContent += data.content;
                                    // Update the last message (assistant placeholder)
                                    setMessages((prev) => {
                                        const newMessages = [...prev];
                                        const lastMessage = newMessages[newMessages.length - 1];
                                        if (lastMessage?.role === "assistant") {
                                            lastMessage.content = fullContent;
                                        }
                                        return newMessages;
                                    });
                                }
                            } catch (e) {
                                // Skip invalid JSON
                            }
                        }
                    }
                }

                // Persist the final assistant message
                if (shouldPersist && fullContent) {
                    persistMessage("assistant", fullContent, options.context);
                }

                return { content: fullContent };
            } catch (err) {
                if (err instanceof Error && err.name === "AbortError") {
                    return;
                }

                const error = err instanceof Error ? err : new Error("Unknown error");
                setError(error);
                options.onError?.(error);

                // Remove the placeholder message on error
                setMessages((prev) => prev.slice(0, -1));
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        [messages, options, shouldPersist]
    );

    const clearMessages = useCallback(async () => {
        setMessages([]);
        setError(null);
        // Clear DB history too
        if (shouldPersist) {
            try {
                await fetch("/api/chat/history", { method: "DELETE" });
            } catch {
                // Silent fail
            }
        }
    }, [shouldPersist]);

    const cancelRequest = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsLoading(false);
        }
    }, []);

    // Use streaming by default if not specified
    const send = options.streaming === false ? sendMessage : sendStreamingMessage;

    return {
        messages,
        isLoading,
        error,
        historyLoaded,
        sendMessage: send,
        sendStreamingMessage,
        sendNonStreamingMessage: sendMessage,
        clearMessages,
        cancelRequest,
    };
}
