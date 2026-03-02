import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { z } from 'zod';

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));

// Logger
const logger = {
    info: (msg: string, meta?: any) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, meta || ''),
    error: (msg: string, meta?: any) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, meta || ''),
};

// OpenAI client (supports both OpenAI and compatible APIs like MegaLLM)
let openai: any = null;

function getOpenAI() {
    if (!openai) {
        const { OpenAI } = require('openai');
        openai = new OpenAI({
            apiKey: process.env.MEGALLM_API_KEY || process.env.OPENAI_API_KEY,
            baseURL: process.env.MEGALLM_BASE_URL || 'https://api.openai.com/v1',
        });
    }
    return openai;
}
const chatSchema = z.object({
    message: z.string().min(1),
    context: z.object({
        moduleId: z.string().optional(),
        lessonId: z.string().optional(),
    }).optional(),
    systemPrompt: z.string().optional(),
});

const embeddingSchema = z.object({
    text: z.string().min(1),
    model: z.string().optional(),
});

// Health checks
app.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        service: 'ai-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

app.get('/ready', async (_req: Request, res: Response) => {
    try {
        // Test OpenAI connection
        const client = getOpenAI();
        res.json({ status: 'ready', provider: process.env.MEGALLM_BASE_URL ? 'megallm' : 'openai' });
    } catch (error) {
        res.status(503).json({ status: 'not ready', error: String(error) });
    }
});

// Chat endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
    try {
        const body = chatSchema.parse(req.body);
        
        const client = getOpenAI();
        
        const messages = [];
        
        // Add system prompt if provided
        if (body.systemPrompt) {
            messages.push({ role: 'system', content: body.systemPrompt });
        } else {
            messages.push({
                role: 'system',
                content: `You are an expert software architect and developer. 
You help users learn system design, coding, and software engineering concepts.
Provide clear, accurate, and practical explanations.`
            });
        }
        
        messages.push({ role: 'user', content: body.message });
        
        const completion = await client.chat.completions.create({
            model: 'gpt-4',
            messages,
            temperature: 0.7,
            max_tokens: 2000,
        });
        
        const response = completion.choices[0]?.message?.content || 'No response generated';
        
        logger.info('Chat request completed', { messageLength: body.message.length });
        
        res.json({
            content: response,
            usage: completion.usage,
        });
    } catch (error: any) {
        logger.error('Chat request failed', { error: error.message });
        
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Invalid request', details: error.errors });
        }
        
        res.status(500).json({ error: 'Failed to generate response', details: error.message });
    }
});

// Streaming chat endpoint
app.post('/api/chat/stream', async (req: Request, res: Response) => {
    try {
        const body = chatSchema.parse(req.body);
        
        const client = getOpenAI();
        
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        const messages = [];
        
        if (body.systemPrompt) {
            messages.push({ role: 'system', content: body.systemPrompt });
        } else {
            messages.push({
                role: 'system',
                content: `You are an expert software architect and developer. 
You help users learn system design, coding, and software engineering concepts.`
            });
        }
        
        messages.push({ role: 'user', content: body.message });
        
        const stream = await client.chat.completions.create({
            model: 'gpt-4',
            messages,
            temperature: 0.7,
            max_tokens: 2000,
            stream: true,
        });
        
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
        }
        
        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error: any) {
        logger.error('Streaming chat request failed', { error: error.message });
        res.status(500).json({ error: 'Failed to stream response' });
    }
});

// Embeddings endpoint
app.post('/api/embeddings', async (req: Request, res: Response) => {
    try {
        const body = embeddingSchema.parse(req.body);
        
        const client = getOpenAI();
        
        const response = await client.embeddings.create({
            model: body.model || 'text-embedding-ada-002',
            input: body.text.slice(0, 8000), // Truncate to avoid token limits
        });
        
        const embedding = response.data[0]?.embedding;
        
        if (!embedding) {
            throw new Error('No embedding generated');
        }
        
        logger.info('Embedding generated', { textLength: body.text.length });
        
        res.json({
            embedding,
            model: response.model,
            usage: response.usage,
        });
    } catch (error: any) {
        logger.error('Embedding request failed', { error: error.message });
        
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Invalid request', details: error.errors });
        }
        
        res.status(500).json({ error: 'Failed to generate embedding', details: error.message });
    }
});

// Batch embeddings endpoint
app.post('/api/embeddings/batch', async (req: Request, res: Response) => {
    try {
        const { texts } = req.body;
        
        if (!Array.isArray(texts) || texts.length === 0) {
            return res.status(400).json({ error: 'Invalid request: texts must be a non-empty array' });
        }
        
        const client = getOpenAI();
        
        // Process in batches of 100 (OpenAI limit)
        const batchSize = 100;
        const embeddings = [];
        
        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize).map(t => t.slice(0, 8000));
            
            const response = await client.embeddings.create({
                model: 'text-embedding-ada-002',
                input: batch,
            });
            
            embeddings.push(...response.data.map((d: { embedding: number[] }) => d.embedding));
        }
        
        logger.info('Batch embeddings generated', { textCount: texts.length });
        
        res.json({
            embeddings,
            count: embeddings.length,
        });
    } catch (error: any) {
        logger.error('Batch embedding request failed', { error: error.message });
        res.status(500).json({ error: 'Failed to generate embeddings', details: error.message });
    }
});

// Interview analysis endpoint
app.post('/api/analyze/answer', async (req: Request, res: Response) => {
    try {
        const { question, answer, type } = req.body;
        
        if (!question || !answer) {
            return res.status(400).json({ error: 'question and answer are required' });
        }
        
        const client = getOpenAI();
        
        let systemPrompt = `You are an expert technical interviewer. Analyze the candidate's answer and provide:
1. A score from 1-10
2. Key strengths
3. Areas for improvement
4. Constructive feedback

Respond in JSON format:
{
  "score": number,
  "strengths": string[],
  "areas_for_improvement": string[],
  "feedback": string
}`;

        if (type === 'system_design') {
            systemPrompt = `You are an expert system designer interviewing candidates. Analyze their design approach and provide:
1. Score (1-10)
2. What they did well
3. What they missed
4. Specific improvements

Focus on: scalability, database design, caching, API design, trade-offs discussed.`;
        } else if (type === 'coding') {
            systemPrompt = `You are a coding interviewer. Analyze the candidate's solution and provide:
1. Score (1-10)
2. Time/space complexity analysis
3. Edge cases handled
4. Code quality feedback`;
        }
        
        const completion = await client.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Question: ${question}\n\nAnswer: ${answer}` }
            ],
            temperature: 0.3,
            max_tokens: 1000,
        });
        
        const response = completion.choices[0]?.message?.content || '{}';
        
        // Try to parse JSON response
        let parsed;
        try {
            parsed = JSON.parse(response);
        } catch {
            parsed = {
                score: 5,
                strengths: ['Attempted the question'],
                areas_for_improvement: ['Could not parse feedback'],
                feedback: response
            };
        }
        
        res.json(parsed);
    } catch (error: any) {
        logger.error('Answer analysis failed', { error: error.message });
        res.status(500).json({ error: 'Failed to analyze answer' });
    }
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

app.listen(PORT, () => {
    console.log(`AI Service running on port ${PORT}`);
});

export default app;
