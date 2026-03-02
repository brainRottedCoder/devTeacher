/**
 * WebSocket Server for Real-Time Features
 * 
 * This server handles:
 * - Live simulation sharing
 * - Collaborative design sessions
 * - Real-time metrics updates
 * - Interview session broadcasting
 * 
 * Run with: npx tsx server/websocket.ts
 */

import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';

const PORT = process.env.WS_PORT || 3006;
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';

// Store connected clients
const clients = new Map<string, Set<WebSocket>>();
const simulationRooms = new Map<string, Set<WebSocket>>();
const collaborationRooms = new Map<string, Set<WebSocket>>();

interface WSMessage {
    type: string;
    payload: any;
    roomId?: string;
    userId?: string;
}

// Create HTTP server and WebSocket server
const server = createServer();
const wss = new WebSocketServer({ server });

// Health check endpoint
server.on('request', (req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    }
});

// Simple token validation (base64 encode userId for simplicity - use JWT in production)
function validateToken(token: string): { userId: string } | null {
    if (!token) return null;

    try {
        // In production, use proper JWT validation with jsonwebtoken
        // For now, accept base64-encoded user IDs or simple tokens
        const decoded = Buffer.from(token, 'base64').toString('utf-8');

        // If it looks like a UUID (user ID), accept it
        if (decoded.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            return { userId: decoded };
        }

        // For development, accept any non-empty token
        if (process.env.NODE_ENV !== 'production' && token.length > 0) {
            return { userId: decoded || 'anonymous' };
        }

        return null;
    } catch {
        return null;
    }
}

wss.on('connection', (ws: WebSocket, req) => {
    const url = new URL(req.url || '', `http://localhost:${PORT}`);
    const path = url.pathname;
    const token = url.searchParams.get('token');

    // Validate token
    const auth = validateToken(token || '');
    if (!auth) {
        console.log(`[WS] Rejected connection from ${req.socket.remoteAddress} - invalid token`);
        ws.close(4001, 'Authentication required');
        return;
    }

    // Store authenticated user with connection
    const userId = auth.userId;
    console.log(`[WS] Authenticated connection from ${req.socket.remoteAddress} (user: ${userId}) to ${path}`);

    // Send welcome message with auth status
    ws.send(JSON.stringify({
        type: 'connection_ack',
        payload: { message: 'Connected to sudo make world WebSocket server', authenticated: true, userId }
    }));

    ws.on('message', (data: Buffer) => {
        try {
            const message: WSMessage = JSON.parse(data.toString());
            handleMessage(ws, message);
        } catch (error) {
            console.error('[WS] Failed to parse message:', error);
            ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid message format' } }));
        }
    });

    ws.on('close', () => {
        console.log('[WS] Client disconnected');
        // Remove from all rooms
        removeFromAllRooms(ws);
    });

    ws.on('error', (error) => {
        console.error('[WS] Error:', error);
    });
});

function handleMessage(ws: WebSocket, message: WSMessage) {
    const { type, payload, roomId, userId } = message;

    switch (type) {
        // Simulation room management
        case 'join_simulation':
            joinRoom(ws, roomId!, simulationRooms, `simulation:${roomId}`);
            ws.send(JSON.stringify({
                type: 'room_joined',
                payload: { roomId, roomType: 'simulation' }
            }));
            break;

        case 'leave_simulation':
            leaveRoom(ws, roomId!, simulationRooms);
            break;

        case 'simulation_update':
            // Broadcast simulation updates to all in room
            broadcastToRoom(ws, roomId!, simulationRooms, {
                type: 'simulation_update',
                payload,
                userId,
                timestamp: Date.now()
            });
            break;

        // Collaboration room management
        case 'join_collaboration':
            joinRoom(ws, roomId!, collaborationRooms, `collab:${roomId}`);
            ws.send(JSON.stringify({
                type: 'room_joined',
                payload: { roomId, roomType: 'collaboration' }
            }));
            break;

        case 'leave_collaboration':
            leaveRoom(ws, roomId!, collaborationRooms);
            break;

        case 'design_update':
            broadcastToRoom(ws, roomId!, collaborationRooms, {
                type: 'design_update',
                payload,
                userId,
                timestamp: Date.now()
            });
            break;

        case 'cursor_position':
            broadcastToRoom(ws, roomId!, collaborationRooms, {
                type: 'cursor_position',
                payload: { ...payload, userId }
            }, ws); // Exclude sender
            break;

        // Interview session
        case 'join_interview':
            joinRoom(ws, roomId!, collaborationRooms, `interview:${roomId}`);
            break;

        case 'interview_feedback':
            broadcastToRoom(ws, roomId!, collaborationRooms, {
                type: 'interview_feedback',
                payload,
                timestamp: Date.now()
            });
            break;

        // Heartbeat
        case 'ping':
            ws.send(JSON.stringify({ type: 'pong', payload: { timestamp: Date.now() } }));
            break;

        default:
            console.log(`[WS] Unknown message type: ${type}`);
    }
}

function joinRoom(ws: WebSocket, roomId: string, rooms: Map<string, Set<WebSocket>>, clientKey: string) {
    // Remove from previous room if any
    removeFromAllRooms(ws);

    // Add to new room
    if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
    }
    rooms.get(roomId)!.add(ws);

    // Track which room this client is in
    clients.set(clientKey, rooms.get(roomId)!);

    console.log(`[WS] Client joined room: ${roomId} (${rooms.get(roomId)!.size} clients)`);
}

function leaveRoom(ws: WebSocket, roomId: string, rooms: Map<string, Set<WebSocket>>) {
    const room = rooms.get(roomId);
    if (room) {
        room.delete(ws);
        if (room.size === 0) {
            rooms.delete(roomId);
        }
        console.log(`[WS] Client left room: ${roomId}`);
    }
}

function removeFromAllRooms(ws: WebSocket) {
    // Remove from simulation rooms
    simulationRooms.forEach((clients, roomId) => {
        if (clients.has(ws)) {
            clients.delete(ws);
            if (clients.size === 0) {
                simulationRooms.delete(roomId);
            }
        }
    });

    // Remove from collaboration rooms
    collaborationRooms.forEach((clients, roomId) => {
        if (clients.has(ws)) {
            clients.delete(ws);
            if (clients.size === 0) {
                collaborationRooms.delete(roomId);
            }
        }
    });

    // Remove from tracking
    clients.forEach((_, key) => {
        clients.get(key)?.delete(ws);
    });
}

function broadcastToRoom(
    sender: WebSocket,
    roomId: string,
    rooms: Map<string, Set<WebSocket>>,
    message: any,
    exclude?: WebSocket
) {
    const room = rooms.get(roomId);
    if (!room) return;

    const messageStr = JSON.stringify(message);
    room.forEach((client) => {
        if (client !== exclude && client.readyState === WebSocket.OPEN) {
            client.send(messageStr);
        }
    });
}

// Start server
server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║     🚀 sudo make world WebSocket Server Running       ║
╠═══════════════════════════════════════════════════════╣
║  Port: ${PORT}                                           ║
║  Endpoints:                                           ║
║    • /health - Health check                           ║
║    • WS  - Real-time simulation & collaboration      ║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n[WS] Shutting down...');
    wss.close(() => {
        server.close(() => {
            console.log('[WS] Server closed');
            process.exit(0);
        });
    });
});
