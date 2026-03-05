"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
    useCodeExecution,
    CODE_TEMPLATES,
    LANGUAGE_DISPLAY_NAMES,
    ExecutionResult,
} from "@/hooks/useCodeExecution";

// Dynamically import Monaco to avoid SSR issues
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

// Map our language names to Monaco language IDs
const MONACO_LANGUAGE_MAP: Record<string, string> = {
    javascript: "javascript",
    typescript: "typescript",
    python: "python",
    java: "java",
    c: "c",
    cpp: "cpp",
    go: "go",
    rust: "rust",
    ruby: "ruby",
    php: "php",
};

interface CodeEditorProps {
    initialLanguage?: string;
    initialCode?: string;
    showOutput?: boolean;
}

export function CodeEditor({
    initialLanguage = "javascript",
    initialCode,
    showOutput = true,
}: CodeEditorProps) {
    const [language, setLanguage] = useState(initialLanguage);
    const [code, setCode] = useState(initialCode || CODE_TEMPLATES[initialLanguage] || "");
    const [input, setInput] = useState("");
    const [showInput, setShowInput] = useState(false);

    const { executeCode, isExecuting, result, error, clearResult } = useCodeExecution({ requireAuth: false });

    const handleLanguageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const newLang = e.target.value;
        setLanguage(newLang);
        if (!code || Object.values(CODE_TEMPLATES).some(t => t === code)) {
            setCode(CODE_TEMPLATES[newLang] || "");
        }
    }, [code]);

    const handleRun = useCallback(async () => {
        await executeCode(code, language, input);
    }, [code, language, input, executeCode]);

    const handleClear = useCallback(() => {
        setCode(CODE_TEMPLATES[language] || "");
        setInput("");
        clearResult();
    }, [language, clearResult]);

    const handleResetTemplate = useCallback(() => {
        setCode(CODE_TEMPLATES[language] || "");
        clearResult();
    }, [language, clearResult]);

    const supportedLanguages = Object.keys(LANGUAGE_DISPLAY_NAMES);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Language:
                    </label>
                    <select
                        value={language}
                        onChange={handleLanguageChange}
                        className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                        {supportedLanguages.map((lang) => (
                            <option key={lang} value={lang}>
                                {LANGUAGE_DISPLAY_NAMES[lang]}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleResetTemplate}
                        className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Reset
                    </button>
                    <button
                        onClick={handleClear}
                        className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Clear
                    </button>
                    <button
                        onClick={() => setShowInput(!showInput)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${showInput
                            ? "bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                    >
                        Input
                    </button>
                    <button
                        onClick={handleRun}
                        disabled={isExecuting || !code.trim()}
                        className="px-4 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
                    >
                        {isExecuting ? (
                            <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Running...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                                Run
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Monaco Code Editor */}
            <div className="flex-1 min-h-[300px]">
                <Editor
                    height="100%"
                    language={MONACO_LANGUAGE_MAP[language] || "plaintext"}
                    value={code}
                    onChange={(value) => setCode(value || "")}
                    theme="vs-dark"
                    options={{
                        fontSize: 14,
                        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                        fontLigatures: true,
                        minimap: { enabled: true, maxColumn: 80 },
                        lineNumbers: "on",
                        roundedSelection: true,
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                        automaticLayout: true,
                        tabSize: 4,
                        insertSpaces: true,
                        cursorBlinking: "smooth",
                        cursorSmoothCaretAnimation: "on",
                        smoothScrolling: true,
                        padding: { top: 16, bottom: 16 },
                        suggest: { showWords: true },
                        bracketPairColorization: { enabled: true },
                        renderLineHighlight: "all",
                        renderWhitespace: "selection",
                    }}
                    loading={
                        <div className="flex items-center justify-center h-full bg-gray-900">
                            <div className="flex items-center gap-3 text-gray-400">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span className="text-sm">Loading editor...</span>
                            </div>
                        </div>
                    }
                />
            </div>

            {/* Input Section */}
            {showInput && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Standard Input (optional):
                    </label>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Enter input for your program..."
                        className="w-full h-20 px-3 py-2 font-mono text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                    />
                </div>
            )}

            {/* Output Section */}
            {showOutput && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Output
                        </span>
                        {result && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {(result.executionTime ?? 0).toFixed(2)}ms
                                {result.memory ? ` • ${(result.memory / 1024).toFixed(0)}KB` : ''}
                            </span>
                        )}
                    </div>
                    <div className="p-4 bg-gray-900 min-h-[120px] max-h-[200px] overflow-auto">
                        {isExecuting ? (
                            <div className="flex items-center gap-2 text-gray-400">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span className="text-sm">Executing...</span>
                            </div>
                        ) : result ? (
                            <div>
                                {result.output && (
                                    <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
                                        {result.output}
                                    </pre>
                                )}
                                {result.error && (
                                    <pre className="text-red-400 font-mono text-sm whitespace-pre-wrap mt-2">
                                        {result.error}
                                    </pre>
                                )}
                                {!result.output && !result.error && (
                                    <span className="text-gray-500 text-sm">No output</span>
                                )}
                            </div>
                        ) : error ? (
                            <pre className="text-red-400 font-mono text-sm whitespace-pre-wrap">
                                {error.message}
                            </pre>
                        ) : (
                            <span className="text-gray-500 text-sm">
                                Click {'"'}Run{'"'} to execute your code
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default CodeEditor;
