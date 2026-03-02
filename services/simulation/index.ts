import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const app = express();
const PORT = process.env.PORT || 3003;
const WS_PORT = parseInt(process.env.WS_PORT || '3005', 10);

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

// In-memory simulation store (use Redis in production)
const simulations = new Map();

// Simulation types
interface Component {
    id: string;
    type: 'server' | 'database' | 'cache' | 'queue' | 'cdn' | 'loadbalancer';
    name: string;
    capacity: number;
    currentLoad: number;
    health: number;
}

interface SimulationState {
    id: string;
    userId: string;
    components: Component[];
    users: number;
    requestsPerSecond: number;
    latency: number;
    errorRate: number;
    cost: number;
    bottlenecks: string[];
    createdAt: Date;
    updatedAt: Date;
}

// Request schemas
const createSimulationSchema = z.object({
    userId: z.string(),
    components: z.array(z.object({
        type: z.enum(['server', 'database', 'cache', 'queue', 'cdn', 'loadbalancer']),
        name: z.string(),
        capacity: z.number().positive(),
    })),
});

const updateSimulationSchema = z.object({
    users: z.number().min(1).optional(),
    requestsPerSecond: z.number().min(0).optional(),
});

// Helper functions
function calculateMetrics(components: Component[], users: number, rps: number) {
    let totalLatency = 0;
    let totalErrorRate = 0;
    const bottlenecks: string[] = [];
    
    for (const comp of components) {
        const load = (rps / comp.capacity) * 100;
        comp.currentLoad = load;
        
        if (load > 80) {
            bottlenecks.push(`${comp.name} at ${load.toFixed(0)}% capacity`);
        }
        
        // Calculate latency based on load
        const latencyFactor = load > 90 ? 3 : load > 70 ? 2 : 1;
        totalLatency += latencyFactor * 10;
        
        // Calculate error rate
        if (load > 95) {
            totalErrorRate += (load - 95) * 0.1;
        }
    }
    
    // Calculate cost (simplified)
    const computeCost = components.filter(c => c.type === 'server').length * 50;
    const dbCost = components.filter(c => c.type === 'database').length * 100;
    const cacheCost = components.filter(c => c.type === 'cache').length * 30;
    const networkCost = (users / 1000) * 5;
    
    return {
        latency: Math.round(totalLatency / (components.length || 1)),
        errorRate: Math.min(totalErrorRate, 10),
        cost: computeCost + dbCost + cacheCost + networkCost,
        bottlenecks,
    };
}

// Health checks
app.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        service: 'simulation-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        simulations: simulations.size,
    });
});

app.get('/ready', async (_req: Request, res: Response) => {
    res.json({ status: 'ready' });
});

// Create simulation
app.post('/api/simulations', async (req: Request, res: Response) => {
    try {
        const body = createSimulationSchema.parse(req.body);
        
        const components: Component[] = body.components.map((c, i) => ({
            id: uuidv4(),
            type: c.type,
            name: c.name,
            capacity: c.capacity,
            currentLoad: 0,
            health: 100,
        }));
        
        const simulation: SimulationState = {
            id: uuidv4(),
            userId: body.userId,
            components,
            users: 100,
            requestsPerSecond: 10,
            latency: 0,
            errorRate: 0,
            cost: 0,
            bottlenecks: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        
        const metrics = calculateMetrics(simulation.components, simulation.users, simulation.requestsPerSecond);
        simulation.latency = metrics.latency;
        simulation.errorRate = metrics.errorRate;
        simulation.cost = metrics.cost;
        simulation.bottlenecks = metrics.bottlenecks;
        
        simulations.set(simulation.id, simulation);
        
        logger.info('Simulation created', { id: simulation.id });
        
        res.status(201).json(simulation);
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Invalid request', details: error.errors });
        }
        logger.error('Failed to create simulation', { error: error.message });
        res.status(500).json({ error: 'Failed to create simulation' });
    }
});

// Get simulation
app.get('/api/simulations/:id', (req: Request, res: Response) => {
    const simulation = simulations.get(req.params.id);
    
    if (!simulation) {
        return res.status(404).json({ error: 'Simulation not found' });
    }
    
    res.json(simulation);
});

// Update simulation (e.g., change user load)
app.patch('/api/simulations/:id', (req: Request, res: Response) => {
    try {
        const simulation = simulations.get(req.params.id);
        
        if (!simulation) {
            return res.status(404).json({ error: 'Simulation not found' });
        }
        
        const body = updateSimulationSchema.parse(req.body);
        
        if (body.users !== undefined) simulation.users = body.users;
        if (body.requestsPerSecond !== undefined) simulation.requestsPerSecond = body.requestsPerSecond;
        
        const metrics = calculateMetrics(simulation.components, simulation.users, simulation.requestsPerSecond);
        simulation.latency = metrics.latency;
        simulation.errorRate = metrics.errorRate;
        simulation.cost = metrics.cost;
        simulation.bottlenecks = metrics.bottlenecks;
        simulation.updatedAt = new Date();
        
        res.json(simulation);
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Invalid request', details: error.errors });
        }
        logger.error('Failed to update simulation', { error: error.message });
        res.status(500).json({ error: 'Failed to update simulation' });
    }
});

// Add component to simulation
app.post('/api/simulations/:id/components', (req: Request, res: Response) => {
    try {
        const simulation = simulations.get(req.params.id);
        
        if (!simulation) {
            return res.status(404).json({ error: 'Simulation not found' });
        }
        
        const { type, name, capacity } = req.body;
        
        const component: Component = {
            id: uuidv4(),
            type,
            name,
            capacity,
            currentLoad: 0,
            health: 100,
        };
        
        simulation.components.push(component);
        simulation.updatedAt = new Date();
        
        // Recalculate
        const metrics = calculateMetrics(simulation.components, simulation.users, simulation.requestsPerSecond);
        simulation.latency = metrics.latency;
        simulation.errorRate = metrics.errorRate;
        simulation.cost = metrics.cost;
        simulation.bottlenecks = metrics.bottlenecks;
        
        res.status(201).json(simulation);
    } catch (error: any) {
        logger.error('Failed to add component', { error: error.message });
        res.status(500).json({ error: 'Failed to add component' });
    }
});

// Delete simulation
app.delete('/api/simulations/:id', (req: Request, res: Response) => {
    const deleted = simulations.delete(req.params.id);
    
    if (!deleted) {
        return res.status(404).json({ error: 'Simulation not found' });
    }
    
    res.json({ success: true });
});

// List user's simulations
app.get('/api/users/:userId/simulations', (req: Request, res: Response) => {
    const userSimulations = Array.from(simulations.values())
        .filter(s => s.userId === req.params.userId);
    
    res.json(userSimulations);
});

// WebSocket server for real-time simulation updates
const wss = new WebSocketServer({ port: WS_PORT });

wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '', `http://localhost:${WS_PORT}`);
    const simulationId = url.searchParams.get('simulation');
    
    if (!simulationId) {
        ws.close(1008, 'Simulation ID required');
        return;
    }
    
    const simulation = simulations.get(simulationId);
    if (!simulation) {
        ws.close(1008, 'Simulation not found');
        return;
    }
    
    logger.info('WebSocket connected', { simulationId });
    
    // Send initial state
    ws.send(JSON.stringify({ type: 'init', simulation }));
    
    // Send updates periodically
    const interval = setInterval(() => {
        if (ws.readyState !== WebSocket.OPEN) {
            clearInterval(interval);
            return;
        }
        
        // Simulate some changes
        simulation.users = Math.floor(simulation.users * (0.95 + Math.random() * 0.1));
        simulation.requestsPerSecond = Math.floor(simulation.requestsPerSecond * (0.95 + Math.random() * 0.1));
        
        const metrics = calculateMetrics(simulation.components, simulation.users, simulation.requestsPerSecond);
        simulation.latency = metrics.latency;
        simulation.errorRate = metrics.errorRate;
        simulation.cost = metrics.cost;
        simulation.bottlenecks = metrics.bottlenecks;
        
        ws.send(JSON.stringify({ type: 'update', simulation }));
    }, 2000);
    
    ws.on('close', () => {
        clearInterval(interval);
        logger.info('WebSocket disconnected', { simulationId });
    });
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            
            if (data.type === 'update_users') {
                simulation.users = data.users;
                simulation.requestsPerSecond = data.rps || simulation.users * 0.1;
                
                const metrics = calculateMetrics(simulation.components, simulation.users, simulation.requestsPerSecond);
                simulation.latency = metrics.latency;
                simulation.errorRate = metrics.errorRate;
                simulation.cost = metrics.cost;
                simulation.bottlenecks = metrics.bottlenecks;
            }
        } catch (e) {
            // Ignore invalid messages
        }
    });
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
    console.log(`Simulation Service running on port ${PORT}`);
    console.log(`WebSocket server running on port ${WS_PORT}`);
});

export default app;
