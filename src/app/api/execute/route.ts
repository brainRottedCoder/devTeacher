import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Lazy-initialize Supabase client (avoids build-time crash)
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
    if (!_supabase) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        _supabase = createClient(supabaseUrl, supabaseServiceKey);
    }
    return _supabase;
}

// Piston API - Free and open source code execution
const PISTON_API_URL = "https://emkc.org/api/v2/piston";

// Supported languages and their Piston runtimes
const SUPPORTED_LANGUAGES: Record<string, { language: string; version: string }> = {
    javascript: { language: "javascript", version: "18.15.0" },
    python: { language: "python", version: "3.10.0" },
    java: { language: "java", version: "15.0.2" },
    c: { language: "c", version: "10.2.0" },
    cpp: { language: "c++", version: "10.2.0" },
    go: { language: "go", version: "1.16.2" },
    rust: { language: "rust", version: "1.68.2" },
    ruby: { language: "ruby", version: "3.0.1" },
    php: { language: "php", version: "8.2.8" },
    typescript: { language: "typescript", version: "5.0.3" },
};

// Rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30;
const RATE_LIMIT_WINDOW = 60 * 1000;

function checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userLimit = rateLimitMap.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
        rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return true;
    }

    if (userLimit.count >= RATE_LIMIT) {
        return false;
    }

    userLimit.count++;
    return true;
}

interface ExecutionRequest {
    code: string;
    language: string;
    input?: string;
}

interface ExecutionResponse {
    output: string;
    error?: string;
    executionTime: number;
    memory?: number;
    language: string;
}

async function executeWithPiston(
    code: string,
    language: string,
    version: string,
    stdin?: string
): Promise<ExecutionResponse> {
    try {
        const response = await fetch(`${PISTON_API_URL}/execute`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                language: language,
                version: version,
                files: [
                    {
                        name: getFileName(language),
                        content: code,
                    },
                ],
                stdin: stdin || "",
                args: [],
                compile_timeout: 10000,
                run_timeout: 5000,
                compile_memory_limit: -1,
                run_memory_limit: -1,
            }),
        });

        if (!response.ok) {
            throw new Error(`Piston API error: ${response.status}`);
        }

        const result = await response.json();

        const runResult = result.run;
        const compileResult = result.compile;

        // Check for compilation errors
        if (compileResult && compileResult.code !== 0) {
            return {
                output: "",
                error: compileResult.stderr || compileResult.output || "Compilation error",
                executionTime: 0,
                language,
            };
        }

        // Check for runtime errors
        if (runResult.code !== 0) {
            return {
                output: runResult.stdout || "",
                error: runResult.stderr || runResult.output || "Runtime error",
                executionTime: runResult.time ? parseFloat(runResult.time) * 1000 : 0,
                memory: runResult.memory ? Math.round(runResult.memory / 1024) : undefined,
                language,
            };
        }

        // Success
        return {
            output: runResult.stdout || "",
            error: runResult.stderr || undefined,
            executionTime: runResult.time ? parseFloat(runResult.time) * 1000 : 0,
            memory: runResult.memory ? Math.round(runResult.memory / 1024) : undefined,
            language,
        };
    } catch (error) {
        throw new Error(
            error instanceof Error ? error.message : "Failed to execute code"
        );
    }
}

function getFileName(language: string): string {
    const extensions: Record<string, string> = {
        javascript: "main.js",
        python: "main.py",
        java: "Main.java",
        c: "main.c",
        cpp: "main.cpp",
        go: "main.go",
        rust: "main.rs",
        ruby: "main.rb",
        php: "main.php",
        typescript: "main.ts",
    };
    return extensions[language] || "main.txt";
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");

        if (!authHeader) {
            return NextResponse.json(
                { error: "Authorization header required" },
                { status: 401 }
            );
        }

        const token = authHeader.replace("Bearer ", "");

        const { data: { user }, error: authError } = await getSupabase().auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json(
                { error: "Invalid or expired token" },
                { status: 401 }
            );
        }

        if (!checkRateLimit(user.id)) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Please try again later." },
                { status: 429 }
            );
        }

        const body: ExecutionRequest = await request.json();
        const { code, language, input } = body;

        if (!code || typeof code !== "string") {
            return NextResponse.json(
                { error: "Code is required" },
                { status: 400 }
            );
        }

        if (!language || typeof language !== "string") {
            return NextResponse.json(
                { error: "Language is required" },
                { status: 400 }
            );
        }

        const langConfig = SUPPORTED_LANGUAGES[language.toLowerCase()];

        if (!langConfig) {
            return NextResponse.json(
                {
                    error: `Unsupported language. Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(", ")}`,
                },
                { status: 400 }
            );
        }

        // Security checks - block dangerous patterns
        const dangerousPatterns = [
            /require\s*\(\s*['"]child_process['"]\s*\)/,
            /require\s*\(\s*['"]fs['"]\s*\)/,
            /import\s+.*from\s+['"]child_process['"]/,
            /import\s+.*from\s+['"]fs['"]/,
            /exec\s*\(/,
            /spawn\s*\(/,
            /eval\s*\(/,
            /Function\s*\(/,
            /import\s+os/,
            /import\s+sys/,
            /import\s+subprocess/,
            /Runtime\.getRuntime\(\)/,
            /ProcessBuilder/,
        ];

        for (const pattern of dangerousPatterns) {
            if (pattern.test(code)) {
                return NextResponse.json(
                    { error: "Code execution blocked: potentially dangerous operation detected" },
                    { status: 400 }
                );
            }
        }

        // Execute code using Piston
        const result = await executeWithPiston(
            code,
            langConfig.language,
            langConfig.version,
            input
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error("Code execution error:", error);

        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Internal server error",
                output: "",
                executionTime: 0,
            },
            { status: 500 }
        );
    }
}

// Get supported languages
export async function GET() {
    const languages = Object.entries(SUPPORTED_LANGUAGES).map(([key, value]) => ({
        id: key,
        ...value,
    }));

    return NextResponse.json({
        languages,
        engine: "Piston",
        apiUrl: PISTON_API_URL,
    });
}
