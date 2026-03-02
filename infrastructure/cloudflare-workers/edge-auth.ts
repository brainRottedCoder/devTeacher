export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);
        
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Access-Control-Max-Age': '86400',
                },
            });
        }

        const authHeader = request.headers.get('Authorization');
        
        if (!authHeader) {
            const response = await fetch(request);
            return addCorsHeaders(response);
        }

        const token = authHeader.replace('Bearer ', '');
        
        try {
            const jwtParts = token.split('.');
            if (jwtParts.length !== 3) {
                throw new Error('Invalid JWT format');
            }
            
            const payload = JSON.parse(atob(jwtParts[1]));
            const now = Math.floor(Date.now() / 1000);
            
            if (payload.exp && payload.exp < now) {
                return new Response(JSON.stringify({ error: 'Token expired' }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            const modifiedRequest = new Request(request, {
                headers: {
                    ...Object.fromEntries(request.headers),
                    'X-User-Id': payload.sub || '',
                    'X-User-Email': payload.email || '',
                },
            });

            const response = await fetch(modifiedRequest);
            return addCorsHeaders(response);
        } catch (error) {
            console.error('Auth error:', error);
            return new Response(JSON.stringify({ error: 'Invalid token' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    },
};

function addCorsHeaders(response: Response): Response {
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return newResponse;
}

interface Env {
    JWT_SECRET: string;
}

interface ExecutionContext {
    waitUntil(promise: Promise<any>): void;
    passThroughOnException(): void;
}
