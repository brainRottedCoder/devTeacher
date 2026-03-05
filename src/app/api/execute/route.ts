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

// Language mapping for paiza.io API
const PAIZA_LANGUAGES: Record<string, string> = {
    javascript: "nodejs",
    typescript: "typescript",
    python: "python3",
    java: "java",
    c: "c",
    cpp: "cpp",
    go: "go",
    rust: "rust",
    ruby: "ruby",
    php: "php",
};

// Supported languages list (for GET endpoint)
const SUPPORTED_LANGUAGES: Record<string, { language: string; version: string }> = {
    javascript: { language: "javascript", version: "18.x" },
    typescript: { language: "typescript", version: "5.x" },
    python: { language: "python", version: "3.x" },
    java: { language: "java", version: "17" },
    c: { language: "c", version: "gcc" },
    cpp: { language: "c++", version: "gcc" },
    go: { language: "go", version: "1.x" },
    rust: { language: "rust", version: "1.x" },
    ruby: { language: "ruby", version: "3.x" },
    php: { language: "php", version: "8.x" },
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

interface ExecutionResponse {
    output: string;
    error?: string;
    executionTime: number;
    memory?: number;
    language: string;
}

// ── JavaScript in-process execution ───────────────────────────────────
function executeJavaScript(code: string): ExecutionResponse {
    const startTime = performance.now();
    let output = "";
    let error: string | undefined;

    try {
        const logs: string[] = [];
        const sandboxConsole = {
            log: (...args: unknown[]) => logs.push(args.map(formatValue).join(" ")),
            error: (...args: unknown[]) => logs.push(args.map(formatValue).join(" ")),
            warn: (...args: unknown[]) => logs.push(args.map(formatValue).join(" ")),
            info: (...args: unknown[]) => logs.push(args.map(formatValue).join(" ")),
            dir: (...args: unknown[]) => logs.push(args.map(formatValue).join(" ")),
            table: (...args: unknown[]) => logs.push(args.map(formatValue).join(" ")),
        };

        const origConsole = globalThis.console;
        try {
            Object.defineProperty(globalThis, "console", {
                value: sandboxConsole,
                writable: true,
                configurable: true,
            });
            const indirectEval = eval;
            indirectEval(code);
        } finally {
            Object.defineProperty(globalThis, "console", {
                value: origConsole,
                writable: true,
                configurable: true,
            });
        }

        output = logs.join("\n");
    } catch (err) {
        error = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    }

    return {
        output,
        error,
        executionTime: performance.now() - startTime,
        language: "javascript",
    };
}

function formatValue(value: unknown): string {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
        try {
            return JSON.stringify(value, null, 2);
        } catch {
            return String(value);
        }
    }
    return String(value);
}

// ── paiza.io API execution (all other languages) ─────────────────────
async function executeWithPaiza(
    code: string,
    language: string,
    stdin?: string
): Promise<ExecutionResponse> {
    const paizaLang = PAIZA_LANGUAGES[language.toLowerCase()];
    if (!paizaLang) {
        throw new Error(`Unsupported language: ${language}`);
    }

    // Step 1: Create the execution
    const createBody = new URLSearchParams();
    createBody.append("source_code", code);
    createBody.append("language", paizaLang);
    createBody.append("input", stdin || "");
    createBody.append("api_key", "guest");

    const createRes = await fetch("https://api.paiza.io/runners/create", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: createBody.toString(),
    });

    if (!createRes.ok) {
        throw new Error(`paiza.io create failed: ${createRes.status}`);
    }

    const createData = await createRes.json();
    const sessionId = createData.id;

    if (!sessionId) {
        throw new Error("paiza.io did not return a session ID");
    }

    // Step 2: Poll for completion (max 15 seconds)
    const startTime = Date.now();
    const timeout = 15000;
    let statusData: any;

    while (Date.now() - startTime < timeout) {
        await new Promise((r) => setTimeout(r, 500));

        const statusRes = await fetch(
            `https://api.paiza.io/runners/get_details?id=${sessionId}&api_key=guest`
        );

        if (!statusRes.ok) {
            throw new Error(`paiza.io status check failed: ${statusRes.status}`);
        }

        statusData = await statusRes.json();

        if (statusData.status === "completed") {
            break;
        }
    }

    if (!statusData || statusData.status !== "completed") {
        throw new Error("Execution timed out (15s limit)");
    }

    const stdout = statusData.stdout || "";
    const stderr = statusData.stderr || "";
    const buildStderr = statusData.build_stderr || "";
    const exitCode = statusData.exit_code;
    const buildExitCode = statusData.build_exit_code;
    const execTime = typeof statusData.time === "number" ? statusData.time * 1000 : 0;

    // Build error (compilation failed)
    if (buildExitCode !== null && buildExitCode !== 0 && buildStderr) {
        return {
            output: "",
            error: buildStderr,
            executionTime: execTime,
            language,
        };
    }

    // Runtime error
    if (exitCode !== 0 && stderr) {
        return {
            output: stdout,
            error: stderr,
            executionTime: execTime,
            language,
        };
    }

    return {
        output: stdout,
        error: stderr || undefined,
        executionTime: execTime,
        language,
    };
}

// ── POST /api/execute ────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");

        let userId: string | null = null;

        // Authentication is optional
        if (authHeader) {
            const token = authHeader.replace("Bearer ", "");
            const {
                data: { user },
                error: authError,
            } = await getSupabase().auth.getUser(token);

            if (!authError && user) {
                userId = user.id;
            }
        }

        // Rate limit authenticated users
        if (userId && !checkRateLimit(userId)) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Please try again later." },
                { status: 429 }
            );
        }

        const { code, language, input } = await request.json();

        if (!code || typeof code !== "string") {
            return NextResponse.json({ error: "Code is required" }, { status: 400 });
        }

        if (!language || typeof language !== "string") {
            return NextResponse.json({ error: "Language is required" }, { status: 400 });
        }

        const langKey = language.toLowerCase();
        if (!PAIZA_LANGUAGES[langKey]) {
            return NextResponse.json(
                {
                    error: `Unsupported language. Supported: ${Object.keys(PAIZA_LANGUAGES).join(", ")}`,
                },
                { status: 400 }
            );
        }

        // Security checks — block dangerous system-level operations
        const dangerousPatterns = [
            /require\s*\(\s*['"]child_process['"]\s*\)/,
            /require\s*\(\s*['"]fs['"]\s*\)/,
            /import\s+.*from\s+['"]child_process['"]/,
            /import\s+.*from\s+['"]fs['"]/,
            /exec\s*\(/,
            /spawn\s*\(/,
            /import\s+os\b/,
            /import\s+subprocess/,
            /Runtime\.getRuntime\(\)/,
            /ProcessBuilder/,
        ];

        // Skip eval/Function check for JS since we use eval ourselves
        for (const pattern of dangerousPatterns) {
            if (pattern.test(code)) {
                return NextResponse.json(
                    { error: "Code execution blocked: potentially dangerous operation detected" },
                    { status: 400 }
                );
            }
        }

        let result: ExecutionResponse;

        // Execute JavaScript in-process for instant feedback
        if (langKey === "javascript") {
            result = executeJavaScript(code);
        } else {
            // All other languages via paiza.io
            result = await executeWithPaiza(code, langKey, input);
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Code execution error:", error);

        return NextResponse.json(
            {
                output: "",
                error: error instanceof Error ? error.message : "Internal server error",
                executionTime: 0,
                language: "unknown",
            },
            { status: 500 }
        );
    }
}

// ── GET /api/execute — list supported languages ──────────────────────
export async function GET() {
    const languages = Object.entries(SUPPORTED_LANGUAGES).map(([key, value]) => ({
        id: key,
        ...value,
    }));

    return NextResponse.json({
        languages,
        engine: "paiza.io (JavaScript runs in-process)",
    });
}
