import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { Pool } from 'pg';
import Redis from 'ioredis';

const app = express();
const PORT = process.env.PORT || 3005;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));

app.get('/health', async (_req: Request, res: Response) => {
    try {
        await pool.query('SELECT 1');
        await redis.ping();
        res.json({
            status: 'healthy',
            service: 'community-service',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: String(error),
        });
    }
});

app.get('/designs', async (req: Request, res: Response) => {
    try {
        const { sortBy = 'trending', limit = '20', offset = '0' } = req.query;
        
        const cacheKey = `designs:${sortBy}:${limit}:${offset}`;
        const cached = await redis.get(cacheKey);
        
        if (cached) {
            return res.json(JSON.parse(cached));
        }

        let orderBy = 'ORDER BY is_featured DESC, likes_count DESC';
        switch (sortBy) {
            case 'newest':
                orderBy = 'ORDER BY created_at DESC';
                break;
            case 'most_liked':
                orderBy = 'ORDER BY likes_count DESC';
                break;
            case 'most_discussed':
                orderBy = 'ORDER BY comments_count DESC';
                break;
        }

        const result = await pool.query(`
            SELECT d.*, u.name as user_name, u.avatar_url as user_avatar
            FROM shared_designs d
            LEFT JOIN users u ON d.user_id = u.id
            WHERE d.is_public = true
            ${orderBy}
            LIMIT $1 OFFSET $2
        `, [parseInt(limit as string), parseInt(offset as string)]);

        await redis.setex(cacheKey, 60, JSON.stringify(result.rows));
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching designs:', error);
        res.status(500).json({ error: 'Failed to fetch designs' });
    }
});

app.get('/designs/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        await pool.query('UPDATE shared_designs SET views_count = views_count + 1 WHERE id = $1', [id]);
        
        const result = await pool.query(`
            SELECT d.*, u.name as user_name, u.avatar_url as user_avatar
            FROM shared_designs d
            LEFT JOIN users u ON d.user_id = u.id
            WHERE d.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Design not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching design:', error);
        res.status(500).json({ error: 'Failed to fetch design' });
    }
});

app.post('/designs', async (req: Request, res: Response) => {
    try {
        const { user_id, title, description, design_data, difficulty, tags } = req.body;
        
        const result = await pool.query(`
            INSERT INTO shared_designs (user_id, title, description, design_data, difficulty, tags)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [user_id, title, description, JSON.stringify(design_data), difficulty || 'medium', tags || []]);

        await redis.del('designs:*');
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating design:', error);
        res.status(500).json({ error: 'Failed to create design' });
    }
});

app.get('/discussions', async (req: Request, res: Response) => {
    try {
        const { category, limit = '20', offset = '0' } = req.query;
        
        let query = `
            SELECT d.*, u.name as user_name, u.avatar_url as user_avatar
            FROM discussions d
            LEFT JOIN users u ON d.user_id = u.id
        `;
        const params: any[] = [];
        
        if (category) {
            query += ' WHERE d.category = $1';
            params.push(category);
        }
        
        query += ' ORDER BY d.is_pinned DESC, d.is_hot DESC, d.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
        params.push(parseInt(limit as string), parseInt(offset as string));
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching discussions:', error);
        res.status(500).json({ error: 'Failed to fetch discussions' });
    }
});

app.get('/discussions/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        await pool.query('UPDATE discussions SET views_count = views_count + 1 WHERE id = $1', [id]);
        
        const discussionResult = await pool.query(`
            SELECT d.*, u.name as user_name, u.avatar_url as user_avatar
            FROM discussions d
            LEFT JOIN users u ON d.user_id = u.id
            WHERE d.id = $1
        `, [id]);

        if (discussionResult.rows.length === 0) {
            return res.status(404).json({ error: 'Discussion not found' });
        }

        const repliesResult = await pool.query(`
            SELECT r.*, u.name as user_name, u.avatar_url as user_avatar
            FROM discussion_replies r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.discussion_id = $1
            ORDER BY r.created_at ASC
        `, [id]);

        res.json({
            ...discussionResult.rows[0],
            replies: repliesResult.rows,
        });
    } catch (error) {
        console.error('Error fetching discussion:', error);
        res.status(500).json({ error: 'Failed to fetch discussion' });
    }
});

app.post('/discussions', async (req: Request, res: Response) => {
    try {
        const { user_id, title, content, category, tags } = req.body;
        
        const result = await pool.query(`
            INSERT INTO discussions (user_id, title, content, category, tags)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [user_id, title, content, category, tags || []]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating discussion:', error);
        res.status(500).json({ error: 'Failed to create discussion' });
    }
});

app.post('/discussions/replies', async (req: Request, res: Response) => {
    try {
        const { discussion_id, user_id, content, parent_id } = req.body;
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const replyResult = await client.query(`
                INSERT INTO discussion_replies (discussion_id, user_id, content, parent_id)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `, [discussion_id, user_id, content, parent_id || null]);
            
            await client.query(`
                UPDATE discussions 
                SET replies_count = replies_count + 1, last_reply_at = NOW()
                WHERE id = $1
            `, [discussion_id]);
            
            await client.query('COMMIT');
            res.status(201).json(replyResult.rows[0]);
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error creating reply:', error);
        res.status(500).json({ error: 'Failed to create reply' });
    }
});

app.post('/like', async (req: Request, res: Response) => {
    try {
        const { user_id, type, id } = req.body;
        
        const existingResult = await pool.query(`
            SELECT id FROM likes 
            WHERE user_id = $1 AND likeable_type = $2 AND likeable_id = $3
        `, [user_id, type, id]);

        if (existingResult.rows.length > 0) {
            await pool.query('DELETE FROM likes WHERE id = $1', [existingResult.rows[0].id]);
            
            const tableMap: Record<string, string> = {
                'design': 'shared_designs',
                'discussion': 'discussions',
                'reply': 'discussion_replies',
                'comment': 'design_comments',
            };
            
            await pool.query(`UPDATE ${tableMap[type]} SET likes_count = GREATEST(0, likes_count - 1) WHERE id = $1`, [id]);
            
            res.json({ liked: false });
        } else {
            await pool.query(`
                INSERT INTO likes (user_id, likeable_type, likeable_id)
                VALUES ($1, $2, $3)
            `, [user_id, type, id]);
            
            const tableMap: Record<string, string> = {
                'design': 'shared_designs',
                'discussion': 'discussions',
                'reply': 'discussion_replies',
                'comment': 'design_comments',
            };
            
            await pool.query(`UPDATE ${tableMap[type]} SET likes_count = likes_count + 1 WHERE id = $1`, [id]);
            
            res.json({ liked: true });
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({ error: 'Failed to toggle like' });
    }
});

app.get('/leaderboard', async (req: Request, res: Response) => {
    try {
        const { timeframe = 'month' } = req.query;
        
        const cacheKey = `leaderboard:${timeframe}`;
        const cached = await redis.get(cacheKey);
        
        if (cached) {
            return res.json(JSON.parse(cached));
        }

        const result = await pool.query(`
            SELECT us.*, u.name as user_name, u.avatar_url as user_avatar,
                   ROW_NUMBER() OVER (ORDER BY us.score DESC) as rank
            FROM user_scores us
            LEFT JOIN users u ON us.user_id = u.id
            ORDER BY us.score DESC
            LIMIT 50
        `);

        await redis.setex(cacheKey, 300, JSON.stringify(result.rows));
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

app.get('/stats', async (req: Request, res: Response) => {
    try {
        const cacheKey = 'community:stats';
        const cached = await redis.get(cacheKey);
        
        if (cached) {
            return res.json(JSON.parse(cached));
        }

        const [designsResult, discussionsResult, usersResult] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM shared_designs'),
            pool.query('SELECT COUNT(*) FROM discussions'),
            pool.query('SELECT COUNT(*) FROM user_scores'),
        ]);

        const stats = {
            totalDesigns: parseInt(designsResult.rows[0].count),
            totalDiscussions: parseInt(discussionsResult.rows[0].count),
            totalUsers: parseInt(usersResult.rows[0].count),
            activeToday: Math.floor(parseInt(usersResult.rows[0].count) * 0.1),
        };

        await redis.setex(cacheKey, 60, JSON.stringify(stats));
        res.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

app.listen(PORT, () => {
    console.log(`Community Service running on port ${PORT}`);
});

export default app;
