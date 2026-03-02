import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const app = express();
const PORT = process.env.PORT || 3002;

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabase: SupabaseClient;

if (supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
} else {
    console.warn('SUPABASE_SERVICE_ROLE_KEY not set - content service will have limited functionality');
}

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

// Request schemas
const createModuleSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    icon: z.string().optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    estimated_hours: z.number().positive().optional(),
    order_index: z.number().optional(),
});

const createLessonSchema = z.object({
    module_id: z.string().uuid(),
    title: z.string().min(1).max(200),
    content: z.string().optional(),
    content_type: z.enum(['text', 'video', 'interactive', 'quiz']).default('text'),
    duration_minutes: z.number().optional(),
    order_index: z.number().optional(),
    video_url: z.string().url().optional(),
});

const createQuizSchema = z.object({
    lesson_id: z.string().uuid(),
    question: z.string().min(1),
    options: z.array(z.string()).min(2).max(6),
    correct_answer: z.number().min(0),
    explanation: z.string().optional(),
    points: z.number().positive().default(10),
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        service: 'content-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

app.get('/ready', async (_req: Request, res: Response) => {
    if (!supabase) {
        return res.status(503).json({ status: 'not ready', reason: 'Database not connected' });
    }
    res.json({ status: 'ready' });
});

// ==================== MODULES ====================

// Get all modules
app.get('/api/modules', async (_req: Request, res: Response) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const { data, error } = await supabase
            .from('modules')
            .select('*')
            .order('order_index', { ascending: true });
        
        if (error) throw error;
        
        res.json(data || []);
    } catch (error: any) {
        logger.error('Failed to fetch modules', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch modules' });
    }
});

// Get single module with lessons
app.get('/api/modules/:id', async (req: Request, res: Response) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const { id } = req.params;
        
        const { data: module, error: moduleError } = await supabase
            .from('modules')
            .select('*')
            .eq('id', id)
            .single();
        
        if (moduleError) throw moduleError;
        
        const { data: lessons, error: lessonsError } = await supabase
            .from('lessons')
            .select('*')
            .eq('module_id', id)
            .order('order_index', { ascending: true });
        
        if (lessonsError) throw lessonsError;
        
        res.json({ ...module, lessons: lessons || [] });
    } catch (error: any) {
        logger.error('Failed to fetch module', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch module' });
    }
});

// Create module
app.post('/api/modules', async (req: Request, res: Response) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const body = createModuleSchema.parse(req.body);
        
        const { data, error } = await supabase
            .from('modules')
            .insert([{
                id: uuidv4(),
                ...body,
                created_at: new Date().toISOString(),
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        logger.info('Module created', { id: data.id });
        res.status(201).json(data);
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Invalid request', details: error.errors });
        }
        logger.error('Failed to create module', { error: error.message });
        res.status(500).json({ error: 'Failed to create module' });
    }
});

// Update module
app.patch('/api/modules/:id', async (req: Request, res: Response) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const { id } = req.params;
        const body = createModuleSchema.partial().parse(req.body);
        
        const { data, error } = await supabase
            .from('modules')
            .update(body)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        
        res.json(data);
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Invalid request', details: error.errors });
        }
        logger.error('Failed to update module', { error: error.message });
        res.status(500).json({ error: 'Failed to update module' });
    }
});

// Delete module
app.delete('/api/modules/:id', async (req: Request, res: Response) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const { id } = req.params;
        
        const { error } = await supabase
            .from('modules')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        res.json({ success: true });
    } catch (error: any) {
        logger.error('Failed to delete module', { error: error.message });
        res.status(500).json({ error: 'Failed to delete module' });
    }
});

// ==================== LESSONS ====================

// Get lessons for a module
app.get('/api/modules/:moduleId/lessons', async (req: Request, res: Response) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const { moduleId } = req.params;
        
        const { data, error } = await supabase
            .from('lessons')
            .select('*')
            .eq('module_id', moduleId)
            .order('order_index', { ascending: true });
        
        if (error) throw error;
        
        res.json(data || []);
    } catch (error: any) {
        logger.error('Failed to fetch lessons', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch lessons' });
    }
});

// Get single lesson
app.get('/api/lessons/:id', async (req: Request, res: Response) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const { id } = req.params;
        
        const { data, error } = await supabase
            .from('lessons')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        res.json(data);
    } catch (error: any) {
        logger.error('Failed to fetch lesson', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch lesson' });
    }
});

// Create lesson
app.post('/api/lessons', async (req: Request, res: Response) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const body = createLessonSchema.parse(req.body);
        
        const { data, error } = await supabase
            .from('lessons')
            .insert([{
                id: uuidv4(),
                ...body,
                created_at: new Date().toISOString(),
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        logger.info('Lesson created', { id: data.id });
        res.status(201).json(data);
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Invalid request', details: error.errors });
        }
        logger.error('Failed to create lesson', { error: error.message });
        res.status(500).json({ error: 'Failed to create lesson' });
    }
});

// Update lesson
app.patch('/api/lessons/:id', async (req: Request, res: Response) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const { id } = req.params;
        const body = createLessonSchema.partial().parse(req.body);
        
        const { data, error } = await supabase
            .from('lessons')
            .update(body)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        
        res.json(data);
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Invalid request', details: error.errors });
        }
        logger.error('Failed to update lesson', { error: error.message });
        res.status(500).json({ error: 'Failed to update lesson' });
    }
});

// Delete lesson
app.delete('/api/lessons/:id', async (req: Request, res: Response) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const { id } = req.params;
        
        const { error } = await supabase
            .from('lessons')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        res.json({ success: true });
    } catch (error: any) {
        logger.error('Failed to delete lesson', { error: error.message });
        res.status(500).json({ error: 'Failed to delete lesson' });
    }
});

// ==================== QUIZZES ====================

// Get quizzes for a lesson
app.get('/api/lessons/:lessonId/quizzes', async (req: Request, res: Response) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const { lessonId } = req.params;
        
        const { data, error } = await supabase
            .from('quizzes')
            .select('*')
            .eq('lesson_id', lessonId)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        // Don't expose correct answers in list
        const sanitized = (data || []).map(({ correct_answer, ...rest }) => rest);
        res.json(sanitized);
    } catch (error: any) {
        logger.error('Failed to fetch quizzes', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch quizzes' });
    }
});

// Create quiz question
app.post('/api/quizzes', async (req: Request, res: Response) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const body = createQuizSchema.parse(req.body);
        
        const { data, error } = await supabase
            .from('quizzes')
            .insert([{
                id: uuidv4(),
                ...body,
                created_at: new Date().toISOString(),
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        // Don't return correct answer
        const { correct_answer, ...sanitized } = data;
        
        logger.info('Quiz created', { id: data.id });
        res.status(201).json(sanitized);
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Invalid request', details: error.errors });
        }
        logger.error('Failed to create quiz', { error: error.message });
        res.status(500).json({ error: 'Failed to create quiz' });
    }
});

// Submit quiz answer (check correctness)
app.post('/api/quizzes/:id/answer', async (req: Request, res: Response) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const { id } = req.params;
        const { answer } = req.body;
        
        if (typeof answer !== 'number') {
            return res.status(400).json({ error: 'Answer must be a number (option index)' });
        }
        
        const { data, error } = await supabase
            .from('quizzes')
            .select('correct_answer, explanation, points')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        const isCorrect = answer === data.correct_answer;
        
        res.json({
            correct: isCorrect,
            explanation: data.explanation,
            points: isCorrect ? data.points : 0,
        });
    } catch (error: any) {
        logger.error('Failed to check answer', { error: error.message });
        res.status(500).json({ error: 'Failed to check answer' });
    }
});

// Delete quiz
app.delete('/api/quizzes/:id', async (req: Request, res: Response) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const { id } = req.params;
        
        const { error } = await supabase
            .from('quizzes')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        res.json({ success: true });
    } catch (error: any) {
        logger.error('Failed to delete quiz', { error: error.message });
        res.status(500).json({ error: 'Failed to delete quiz' });
    }
});

// ==================== SEARCH ====================

// Search content
app.get('/api/search', async (req: Request, res: Response) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const { q } = req.query;
        
        if (!q || typeof q !== 'string') {
            return res.status(400).json({ error: 'Search query required' });
        }
        
        // Search modules
        const { data: modules } = await supabase
            .from('modules')
            .select('*')
            .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
            .limit(10);
        
        // Search lessons
        const { data: lessons } = await supabase
            .from('lessons')
            .select('*')
            .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
            .limit(20);
        
        res.json({
            modules: modules || [],
            lessons: lessons || [],
            total: (modules?.length || 0) + (lessons?.length || 0),
        });
    } catch (error: any) {
        logger.error('Failed to search', { error: error.message });
        res.status(500).json({ error: 'Failed to search' });
    }
});

// Error handler
app.use((err: Error, _req: Request, res: Response) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

app.listen(PORT, () => {
    console.log(`Content Service running on port ${PORT}`);
});

export default app;
