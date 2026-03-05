"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface ExecutionResult {
    output: string;
    error?: string;
    executionTime: number;
    memory?: number;
    language: string;
}

interface UseCodeExecutionOptions {
    onError?: (error: Error) => void;
    /** If true, requires authentication to execute code. Default: true */
    requireAuth?: boolean;
}

export function useCodeExecution(options: UseCodeExecutionOptions = {}) {
    const [isExecuting, setIsExecuting] = useState(false);
    const [result, setResult] = useState<ExecutionResult | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const requireAuth = options.requireAuth !== false; // Default to true

    const executeCode = useCallback(
        async (code: string, language: string, input?: string) => {
            setIsExecuting(true);
            setError(null);
            setResult(null);

            try {
                const supabase = createClient();
                let accessToken: string | null = null;

                if (requireAuth) {
                    const {
                        data: { session },
                    } = await supabase.auth.getSession();

                    if (!session?.access_token) {
                        throw new Error("Please log in to run code.");
                    }
                    accessToken = session.access_token;
                }

                const response = await fetch("/api/execute", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    },
                    body: JSON.stringify({
                        code,
                        language,
                        input,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Failed to execute code");
                }

                const data: ExecutionResult = await response.json();
                setResult(data);

                if (data.error) {
                    setError(new Error(data.error));
                    options.onError?.(new Error(data.error));
                }

                return data;
            } catch (err) {
                const error = err instanceof Error ? err : new Error("Unknown error");
                setError(error);
                options.onError?.(error);
                throw error;
            } finally {
                setIsExecuting(false);
            }
        },
        [options, requireAuth]
    );

    const clearResult = useCallback(() => {
        setResult(null);
        setError(null);
    }, []);

    return {
        executeCode,
        isExecuting,
        result,
        error,
        clearResult,
    };
}

// Default code templates for each language
export const CODE_TEMPLATES: Record<string, string> = {
    javascript: `// JavaScript - Hello World
console.log("Hello, World!");

// Try writing your own code below
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log(doubled);
`,
    python: `# Python - Hello World
print("Hello, World!")

# Try writing your own code below
numbers = [1, 2, 3, 4, 5]
doubled = [n * 2 for n in numbers]
print(doubled)
`,
    java: `// Java - Hello World
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        int[] numbers = {1, 2, 3, 4, 5};
        for (int n : numbers) {
            System.out.print(n * 2 + " ");
        }
    }
}
`,
    c: `// C - Hello World
#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    
    int numbers[] = {1, 2, 3, 4, 5};
    for (int i = 0; i < 5; i++) {
        printf("%d ", numbers[i] * 2);
    }
    return 0;
}
`,
    cpp: `// C++ - Hello World
#include <iostream>
#include <vector>

int main() {
    std::cout << "Hello, World!" << std::endl;
    
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    for (int n : numbers) {
        std::cout << n * 2 << " ";
    }
    return 0;
}
`,
    go: `// Go - Hello World
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
    
    numbers := []int{1, 2, 3, 4, 5}
    for _, n := range numbers {
        fmt.Print(n * 2, " ")
    }
}
`,
    rust: `// Rust - Hello World
fn main() {
    println!("Hello, World!");
    
    let numbers = vec![1, 2, 3, 4, 5];
    for n in numbers {
        print!("{} ", n * 2);
    }
}
`,
    ruby: `# Ruby - Hello World
puts "Hello, World!"

numbers = [1, 2, 3, 4, 5]
doubled = numbers.map { |n| n * 2 }
puts doubled.join(" ")
`,
    php: `<?php
// PHP - Hello World
echo "Hello, World!\n";

$numbers = [1, 2, 3, 4, 5];
$doubled = array_map(fn($n) => $n * 2, $numbers);
echo implode(" ", $doubled);
`,
    typescript: `// TypeScript - Hello World
const message: string = "Hello, World!";
console.log(message);

const numbers: number[] = [1, 2, 3, 4, 5];
const doubled: number[] = numbers.map(n => n * 2);
console.log(doubled);
`,
};

export const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
    javascript: "JavaScript (Node.js)",
    python: "Python 3",
    java: "Java",
    c: "C (GCC)",
    cpp: "C++ (GCC)",
    go: "Go",
    rust: "Rust",
    ruby: "Ruby",
    php: "PHP",
    typescript: "TypeScript",
};
