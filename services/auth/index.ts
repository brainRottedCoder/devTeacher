import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabase: SupabaseClient;

if (supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
}

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request ID middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
    req.headers['x-request-id'] = req.headers['x-request-id'] || 
        `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    next();
});

// Logger
const logger = {
    info: (msg: string, meta?: any) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, meta || ''),
    error: (msg: string, meta?: any) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, meta || ''),
};

// Request schemas
const updateProfileSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    avatar_url: z.string().url().optional(),
    bio: z.string().max(500).optional(),
    github_url: z.string().url().optional().optional(),
    linkedin_url: z.string().url().optional().optional(),
    website_url: z.string().url().optional().optional(),
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        service: 'auth-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

app.get('/ready', async (_req: Request, res: Response) => {
    if (!supabase) {
        return res.status(503).json({ status: 'not ready', reason: 'Database not configured' });
    }
    try {
        res.json({ status: 'ready' });
    } catch (error) {
        res.status(503).json({ status: 'not ready', error: String(error) });
    }
});

// ==================== TOKEN VALIDATION ====================

// Validate JWT token and return user info
app.post('/api/validate-token', async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ error: 'Token required' });
        }
        
        if (!supabase) {
            return res.status(503).json({ error: 'Auth service not configured' });
        }
        
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token', valid: false });
        }
        
        // Get user profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        
        res.json({
            valid: true,
            user: {
                id: user.id,
                email: user.email,
                ...profile,
            },
        });
    } catch (error: any) {
        logger.error('Token validation failed', { error: error.message });
        res.status(500).json({ error: 'Token validation failed' });
    }
});

// ==================== USER PROFILES ====================

// Get user profile
app.get('/api/users/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        if (!supabase) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error || !profile) {
            // Return basic user info if profile doesn't exist
            const { data: { user } } = await supabase.auth.admin.getUserById(id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            return res.json({
                id: user.id,
                email: user.email,
                name: user.email?.split('@')[0],
            });
        }
        
        res.json(profile);
    } catch (error: any) {
        logger.error('Failed to fetch profile', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Update user profile
app.patch('/api/users/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const body = updateProfileSchema.parse(req.body);
        
        if (!supabase) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const { data, error } = await supabase
            .from('profiles')
            .update({
                ...body,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        
        res.json(data);
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Invalid request', details: error.errors });
        }
        logger.error('Failed to update profile', { error: error.message });
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// ==================== USER ACTIVITY ====================

// Record user activity (for streaks, achievements)
app.post('/api/users/:id/activity', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { activity_type, metadata } = req.body;
        
        if (!supabase) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const { data, error } = await supabase
            .from('user_activities')
            .insert([{
                user_id: id,
                activity_type,
                metadata: metadata || {},
                created_at: new Date().toISOString(),
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        res.status(201).json(data);
    } catch (error: any) {
        logger.error('Failed to record activity', { error: error.message });
        res.status(500).json({ error: 'Failed to record activity' });
    }
});

// Get user activity streak
app.get('/api/users/:id/streak', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        if (!supabase) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        // Get recent activities
        const { data: activities } = await supabase
            .from('user_activities')
            .select('created_at')
            .eq('user_id', id)
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false });
        
        if (!activities || activities.length === 0) {
            return res.json({ streak: 0, longest_streak: 0 });
        }
        
        // Calculate streak
        const uniqueDays = new Set(
            activities.map(a => new Date(a.created_at).toISOString().split('T')[0])
        );
        
        const sortedDays = Array.from(uniqueDays).sort().reverse();
        
        let streak = 0;
        let longestStreak = 0;
        let currentStreak = 0;
        const today = new Date().toISOString().split('T')[0];
        
        for (let i = 0; i < sortedDays.length; i++) {
            const day = sortedDays[i];
            const expectedDay = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            
            if (day === today || day === expectedDay) {
                currentStreak++;
                streak = currentStreak;
            } else {
                longestStreak = Math.max(longestStreak, currentStreak);
                currentStreak = 0;
            }
        }
        
        longestStreak = Math.max(longestStreak, currentStreak);
        
        res.json({
            streak,
            longest_streak: longestStreak,
            active_days: uniqueDays.size,
        });
    } catch (error: any) {
        logger.error('Failed to get streak', { error: error.message });
        res.status(500).json({ error: 'Failed to get streak' });
    }
});

// ==================== SESSIONS ====================

// Get user's active sessions
app.get('/api/users/:id/sessions', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        if (!supabase) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('user_id', id)
            .eq('is_active', true)
            .gte('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        res.json(data || []);
    } catch (error: any) {
        logger.error('Failed to fetch sessions', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

// ==================== INVITATIONS ====================

// Generate invite code
app.post('/api/invites', async (req: Request, res: Response) => {
    try {
        const { user_id, max_uses = 1 } = req.body;
        
        if (!supabase) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const invite_code = uuidv4().slice(0, 8).toUpperCase();
        
        const { data, error } = await supabase
            .from('invites')
            .insert([{
                code: invite_code,
                created_by: user_id,
                max_uses,
                used_count: 0,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        res.status(201).json(data);
    } catch (error: any) {
        logger.error('Failed to create invite', { error: error.message });
        res.status(500).json({ error: 'Failed to create invite' });
    }
});

// Validate invite code
app.get('/api/invites/:code', async (req: Request, res: Response) => {
    try {
        const { code } = req.params;
        
        if (!supabase) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const { data, error } = await supabase
            .from('invites')
            .select('*')
            .eq('code', code.toUpperCase())
            .single();
        
        if (error || !data) {
            return res.status(404).json({ error: 'Invite not found', valid: false });
        }
        
        if (new Date(data.expires_at) < new Date()) {
            return res.status(400).json({ error: 'Invite expired', valid: false });
        }
        
        if (data.used_count >= data.max_uses) {
            return res.status(400).json({ error: 'Invite already used', valid: false });
        }
        
        res.json({ valid: true, invite: data });
    } catch (error: any) {
        logger.error('Failed to validate invite', { error: error.message });
        res.status(500).json({ error: 'Failed to validate invite' });
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
    console.log(`Auth Service running on port ${PORT}`);
});

export default app;
