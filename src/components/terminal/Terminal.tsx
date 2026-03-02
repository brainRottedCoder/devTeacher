"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    Terminal as TerminalIcon,
    ChevronRight,
    Trash2,
    Copy,
    Check,
    RefreshCw,
    Play,
    Box,
    Cloud,
    Cpu
} from "lucide-react";
import { createSession, executeCommand, getCommandSuggestions, TerminalSession, CommandResult } from "@/lib/terminal/simulator";

interface TerminalProps {
    type?: 'bash' | 'docker' | 'kubernetes' | 'cloud';
    onCommand?: (command: string, output: string) => void;
    readOnly?: boolean;
    initialCommands?: string[];
}

export function Terminal({ type = 'bash', onCommand, readOnly = false, initialCommands = [] }: TerminalProps) {
    const [session, setSession] = useState<TerminalSession>(() => createSession(type));
    const [input, setInput] = useState("");
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [copied, setCopied] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const terminalRef = useRef<HTMLDivElement>(null);
    const historyInput = useRef<string[]>([]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [session.history]);

    // Focus input on click
    const handleTerminalClick = useCallback(() => {
        inputRef.current?.focus();
    }, []);

    // Execute initial commands
    useEffect(() => {
        if (initialCommands.length > 0) {
            const runInitial = async () => {
                let currentSession = createSession(type);
                for (const cmd of initialCommands) {
                    const result: CommandResult = executeCommand(currentSession, cmd);
                    currentSession = { ...currentSession };
                    if (onCommand) {
                        onCommand(cmd, result.output || result.error || "");
                    }
                }
                setSession(currentSession);
            };
            runInitial();
        }
    }, [type, initialCommands, onCommand]);

    // Handle command execution
    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || readOnly) return;

        // Add to input history
        historyInput.current = [input, ...historyInput.current.slice(0, 49)];
        setHistoryIndex(-1);

        // Create a new session object to trigger React state update
        const newSession = { ...session };
        const result: CommandResult = executeCommand(newSession, input);

        // Notify parent
        if (onCommand) {
            onCommand(input, result.output || result.error || "");
        }

        // Update session state with the modified session
        setSession({ ...newSession });
        setInput("");
        setSuggestions([]);
    }, [input, session, onCommand, readOnly]);

    // Handle history navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "ArrowUp") {
            e.preventDefault();
            const newIndex = historyIndex < historyInput.current.length - 1 ? historyIndex + 1 : historyIndex;
            setHistoryIndex(newIndex);
            setInput(historyInput.current[newIndex] || "");
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            const newIndex = historyIndex > 0 ? historyIndex - 1 : -1;
            setHistoryIndex(newIndex);
            setInput(historyInput.current[newIndex] || "");
        } else if (e.key === "Tab") {
            e.preventDefault();
            if (suggestions.length > 0) {
                setInput(suggestions[0]);
                setSuggestions([]);
            }
        } else if (e.key === "c" && e.ctrlKey) {
            // Ctrl+C - cancel current input
            setInput("");
            setSuggestions([]);
        }
    }, [historyIndex, suggestions]);

    // Update suggestions on input change
    useEffect(() => {
        if (input.trim()) {
            const newSuggestions = getCommandSuggestions(session, input);
            setSuggestions(newSuggestions);
        } else {
            setSuggestions([]);
        }
    }, [input, session]);

    // Copy terminal output
    const copyOutput = useCallback(() => {
        const text = session.history
            .map(line => line.content)
            .join("\n");
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [session.history]);

    // Clear terminal
    const clearTerminal = useCallback(() => {
        setSession(createSession(type));
        historyInput.current = [];
        setHistoryIndex(-1);
    }, [type]);

    // Get icon based on type
    const getTypeIcon = () => {
        switch (type) {
            case 'docker': return <Box className="w-4 h-4" />;
            case 'kubernetes': return <Cpu className="w-4 h-4" />;
            case 'cloud': return <Cloud className="w-4 h-4" />;
            default: return <TerminalIcon className="w-4 h-4" />;
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0a0f] rounded-xl border border-white/10 overflow-hidden">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-surface-deep border-b border-white/10">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-gray-400">
                        {getTypeIcon()}
                        <span className="text-sm font-medium uppercase">{type}</span>
                    </div>
                    <span className="text-xs text-gray-500">{session.workingDir}</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={copyOutput}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                        title="Copy output"
                    >
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={clearTerminal}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                        title="Clear terminal"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Terminal Output */}
            <div
                ref={terminalRef}
                onClick={handleTerminalClick}
                className="flex-1 overflow-y-auto p-4 font-mono text-sm"
            >
                {session.history.map((line, index) => (
                    <div key={index} className={`mb-1 whitespace-pre-wrap ${line.type === 'input' ? 'text-green-400' :
                        line.type === 'error' ? 'text-red-400' :
                            line.type === 'system' ? 'text-blue-400' :
                                'text-gray-300'
                        }`}>
                        {line.type === 'input' && (
                            <span className="text-green-500 mr-2">$</span>
                        )}
                        {line.content}
                    </div>
                ))}
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
                <div className="px-4 py-1 bg-surface-deep border-t border-white/5">
                    <div className="flex flex-wrap gap-2">
                        {suggestions.slice(0, 5).map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setInput(suggestion);
                                    setSuggestions([]);
                                    inputRef.current?.focus();
                                }}
                                className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area */}
            {!readOnly && (
                <form onSubmit={handleSubmit} className="border-t border-white/10">
                    <div className="flex items-center px-4 py-3 bg-surface-deep">
                        <span className="text-green-500 mr-2 font-mono">$</span>
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 bg-transparent text-white font-mono text-sm outline-none"
                            placeholder="Type a command..."
                            autoComplete="off"
                            spellCheck={false}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim()}
                            className="ml-2 p-1.5 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

// Mini Terminal for inline use
export function MiniTerminal({ command, type = 'bash' }: { command?: string; type?: 'bash' | 'docker' | 'kubernetes' | 'cloud' }) {
    const [output, setOutput] = useState<string>("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (command) {
            setLoading(true);
            const session = createSession(type);
            const result = executeCommand(session, command);
            setOutput(result.output || result.error || "");
            setLoading(false);
        }
    }, [command, type]);

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-gray-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">Running...</span>
            </div>
        );
    }

    return (
        <div className="bg-surface-deep rounded-lg p-3 font-mono text-sm">
            <div className="text-green-400 mb-1">$ {command}</div>
            <div className="text-gray-300 whitespace-pre-wrap">{output}</div>
        </div>
    );
}

export default Terminal;
