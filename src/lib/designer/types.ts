// Architecture Designer Types

import { Node, Edge } from '@xyflow/react';

// Component categories for the designer
export type ArchitectureComponentCategory =
    | 'server'
    | 'database'
    | 'cache'
    | 'infrastructure'
    | 'service'
    | 'client';

// Specific component types within each category
export type ArchitectureComponentType =
    // Servers
    | 'web-server'
    | 'api-server'
    | 'app-server'
    | 'microservice'
    // Databases
    | 'postgres'
    | 'mysql'
    | 'mongodb'
    | 'redis'
    | 'cassandra'
    | 'dynamodb'
    // Cache
    | 'cache-layer'
    | 'cdn'
    // Infrastructure
    | 'load-balancer'
    | 'api-gateway'
    | 'message-queue'
    | 'reverse-proxy'
    // Services
    | 'lambda'
    | 'container'
    | 'kubernetes'
    // Client
    | 'web-client'
    | 'mobile-client'
    | 'iot-device';

// Component configuration
export interface ArchitectureComponentConfig {
    // Display
    label: string;
    icon: string;
    color: string;
    category: ArchitectureComponentCategory;

    // Capabilities
    canConnectTo: ArchitectureComponentType[];
    maxConnections: number;

    // Default settings
    defaultPort?: number;
    description: string;
}

// Node data for React Flow
export interface ArchitectureNodeData {
    [key: string]: unknown;
    type: ArchitectureComponentType;
    label: string;
    icon: string;
    color: string;
    category: ArchitectureComponentCategory;
    config: Record<string, any>;
    description?: string;
}

// Custom node type for React Flow
export type ArchitectureNode = Node<ArchitectureNodeData>;

// Custom edge type
export type ArchitectureEdge = Edge<{
    label?: string;
    animated?: boolean;
    style?: React.CSSProperties;
}>;

// Design template
export interface DesignTemplate {
    id: string;
    name: string;
    description: string;
    thumbnail: string;
    category: 'social' | 'streaming' | 'ecommerce' | 'saas' | 'custom' | 'marketplace';
    nodes: ArchitectureNode[];
    edges: ArchitectureEdge[];
}

// Saved design
export interface SavedDesign {
    id: string;
    userId: string;
    name: string;
    description?: string;
    nodes: ArchitectureNode[];
    edges: ArchitectureEdge[];
    createdAt: string;
    updatedAt: string;
    isPublic: boolean;
}

// Component library definition
export const COMPONENT_LIBRARY: Record<ArchitectureComponentCategory, {
    label: string;
    components: ArchitectureComponentType[];
}> = {
    server: {
        label: 'Servers',
        components: ['web-server', 'api-server', 'app-server', 'microservice'],
    },
    database: {
        label: 'Databases',
        components: ['postgres', 'mysql', 'mongodb', 'redis', 'cassandra', 'dynamodb'],
    },
    cache: {
        label: 'Cache & CDN',
        components: ['cache-layer', 'cdn'],
    },
    infrastructure: {
        label: 'Infrastructure',
        components: ['load-balancer', 'api-gateway', 'message-queue', 'reverse-proxy'],
    },
    service: {
        label: 'Services',
        components: ['lambda', 'container', 'kubernetes'],
    },
    client: {
        label: 'Clients',
        components: ['web-client', 'mobile-client', 'iot-device'],
    },
};

// Component configurations
export const COMPONENT_CONFIGS: Record<ArchitectureComponentType, ArchitectureComponentConfig> = {
    // Servers
    'web-server': {
        label: 'Web Server',
        icon: '🖥️',
        color: '#8b5cf6',
        category: 'server',
        canConnectTo: ['api-server', 'app-server', 'load-balancer', 'reverse-proxy', 'cdn'],
        maxConnections: 10,
        description: 'Serves static content and handles HTTP requests',
    },
    'api-server': {
        label: 'API Server',
        icon: '🔌',
        color: '#3b82f6',
        category: 'server',
        canConnectTo: ['postgres', 'mysql', 'mongodb', 'redis', 'cache-layer', 'message-queue', 'api-gateway'],
        maxConnections: 20,
        description: 'RESTful or GraphQL API endpoint',
    },
    'app-server': {
        label: 'App Server',
        icon: '⚙️',
        color: '#10b981',
        category: 'server',
        canConnectTo: ['postgres', 'mysql', 'mongodb', 'cache-layer', 'message-queue'],
        maxConnections: 15,
        description: 'Application logic server',
    },
    'microservice': {
        label: 'Microservice',
        icon: '🔷',
        color: '#06b6d4',
        category: 'server',
        canConnectTo: ['postgres', 'mongodb', 'redis', 'message-queue', 'api-gateway'],
        maxConnections: 10,
        description: 'Independent service component',
    },

    // Databases
    'postgres': {
        label: 'PostgreSQL',
        icon: '🐘',
        color: '#336791',
        category: 'database',
        canConnectTo: ['api-server', 'app-server', 'microservice'],
        maxConnections: 50,
        defaultPort: 5432,
        description: 'Relational database with ACID compliance',
    },
    'mysql': {
        label: 'MySQL',
        icon: '🗄️',
        color: '#00758f',
        category: 'database',
        canConnectTo: ['api-server', 'app-server'],
        maxConnections: 50,
        defaultPort: 3306,
        description: 'Popular relational database',
    },
    'mongodb': {
        label: 'MongoDB',
        icon: '🍃',
        color: '#47a248',
        category: 'database',
        canConnectTo: ['api-server', 'app-server', 'microservice'],
        maxConnections: 100,
        defaultPort: 27017,
        description: 'NoSQL document database',
    },
    'redis': {
        label: 'Redis',
        icon: '⚡',
        color: '#dc382d',
        category: 'database',
        canConnectTo: ['api-server', 'app-server', 'microservice', 'cache-layer'],
        maxConnections: 100,
        defaultPort: 6379,
        description: 'In-memory cache and message broker',
    },
    'cassandra': {
        label: 'Cassandra',
        icon: '📊',
        color: '#1287b1',
        category: 'database',
        canConnectTo: ['app-server', 'microservice'],
        maxConnections: 100,
        defaultPort: 9042,
        description: 'Distributed NoSQL database',
    },
    'dynamodb': {
        label: 'DynamoDB',
        icon: '📦',
        color: '#4053d6',
        category: 'database',
        canConnectTo: ['lambda', 'api-server', 'microservice'],
        maxConnections: 100,
        description: 'AWS managed NoSQL database',
    },

    // Cache
    'cache-layer': {
        label: 'Cache Layer',
        icon: '💾',
        color: '#f59e0b',
        category: 'cache',
        canConnectTo: ['api-server', 'app-server', 'microservice', 'redis'],
        maxConnections: 50,
        description: 'Caching layer for improved performance',
    },
    'cdn': {
        label: 'CDN',
        icon: '🌍',
        color: '#f97316',
        category: 'cache',
        canConnectTo: ['web-server', 'load-balancer', 'web-client'],
        maxConnections: 100,
        description: 'Content delivery network',
    },

    // Infrastructure
    'load-balancer': {
        label: 'Load Balancer',
        icon: '⚖️',
        color: '#22c55e',
        category: 'infrastructure',
        canConnectTo: ['web-server', 'api-server', 'app-server', 'cdn'],
        maxConnections: 50,
        description: 'Distributes traffic across servers',
    },
    'api-gateway': {
        label: 'API Gateway',
        icon: '🚪',
        color: '#a855f7',
        category: 'infrastructure',
        canConnectTo: ['api-server', 'microservice', 'lambda', 'web-client'],
        maxConnections: 100,
        description: 'API management and routing',
    },
    'message-queue': {
        label: 'Message Queue',
        icon: '📨',
        color: '#ec4899',
        category: 'infrastructure',
        canConnectTo: ['api-server', 'app-server', 'microservice', 'lambda'],
        maxConnections: 50,
        description: 'Async message processing',
    },
    'reverse-proxy': {
        label: 'Reverse Proxy',
        icon: '🔄',
        color: '#6366f1',
        category: 'infrastructure',
        canConnectTo: ['web-server', 'api-server', 'load-balancer'],
        maxConnections: 30,
        description: 'Request routing and SSL termination',
    },

    // Services
    'lambda': {
        label: 'Lambda',
        icon: 'λ',
        color: '#ff9900',
        category: 'service',
        canConnectTo: ['api-gateway', 'dynamodb', 'message-queue'],
        maxConnections: 20,
        description: 'Serverless function',
    },
    'container': {
        label: 'Container',
        icon: '📦',
        color: '#2496ed',
        category: 'service',
        canConnectTo: ['kubernetes', 'load-balancer', 'api-gateway'],
        maxConnections: 10,
        description: 'Docker container',
    },
    'kubernetes': {
        label: 'Kubernetes',
        icon: '☸️',
        color: '#326ce5',
        category: 'service',
        canConnectTo: ['container', 'load-balancer', 'api-gateway'],
        maxConnections: 100,
        description: 'Container orchestration',
    },

    // Clients
    'web-client': {
        label: 'Web Client',
        icon: '🌐',
        color: '#64748b',
        category: 'client',
        canConnectTo: ['cdn', 'load-balancer', 'api-gateway', 'reverse-proxy'],
        maxConnections: 1000,
        description: 'Web browser client',
    },
    'mobile-client': {
        label: 'Mobile Client',
        icon: '📱',
        color: '#64748b',
        category: 'client',
        canConnectTo: ['cdn', 'api-gateway', 'load-balancer'],
        maxConnections: 1000,
        description: 'Mobile app client',
    },
    'iot-device': {
        label: 'IoT Device',
        icon: '📡',
        color: '#64748b',
        category: 'client',
        canConnectTo: ['api-gateway', 'message-queue'],
        maxConnections: 10000,
        description: 'IoT device client',
    },
};

// Pre-built templates
export const DESIGN_TEMPLATES: DesignTemplate[] = [
    {
        id: 'twitter',
        name: 'Twitter-like Architecture',
        description: 'Social media platform with real-time feeds',
        thumbnail: '🐦',
        category: 'social',
        nodes: [
            { id: 'client-1', type: 'architecture', position: { x: 100, y: 100 }, data: { type: 'web-client', label: 'Web Client', icon: '🌐', color: '#64748b', category: 'client', config: {} } },
            { id: 'lb-1', type: 'architecture', position: { x: 300, y: 100 }, data: { type: 'load-balancer', label: 'Load Balancer', icon: '⚖️', color: '#22c55e', category: 'infrastructure', config: {} } },
            { id: 'api-1', type: 'architecture', position: { x: 500, y: 50 }, data: { type: 'api-server', label: 'API Server', icon: '🔌', color: '#3b82f6', category: 'server', config: {} } },
            { id: 'api-2', type: 'architecture', position: { x: 500, y: 150 }, data: { type: 'api-server', label: 'API Server', icon: '🔌', color: '#3b82f6', category: 'server', config: {} } },
            { id: 'redis-1', type: 'architecture', position: { x: 700, y: 50 }, data: { type: 'redis', label: 'Redis Cache', icon: '⚡', color: '#dc382d', category: 'database', config: {} } },
            { id: 'postgres-1', type: 'architecture', position: { x: 700, y: 150 }, data: { type: 'postgres', label: 'PostgreSQL', icon: '🐘', color: '#336791', category: 'database', config: {} } },
        ],
        edges: [
            { id: 'e1', source: 'client-1', target: 'lb-1' },
            { id: 'e2', source: 'lb-1', target: 'api-1' },
            { id: 'e3', source: 'lb-1', target: 'api-2' },
            { id: 'e4', source: 'api-1', target: 'redis-1' },
            { id: 'e5', source: 'api-2', target: 'redis-1' },
            { id: 'e6', source: 'api-1', target: 'postgres-1' },
            { id: 'e7', source: 'api-2', target: 'postgres-1' },
        ],
    },
    {
        id: 'netflix',
        name: 'Netflix-like Architecture',
        description: 'Video streaming platform with CDN',
        thumbnail: '🎬',
        category: 'streaming',
        nodes: [
            { id: 'client-1', type: 'architecture', position: { x: 100, y: 200 }, data: { type: 'web-client', label: 'Web Client', icon: '🌐', color: '#64748b', category: 'client', config: {} } },
            { id: 'cdn-1', type: 'architecture', position: { x: 300, y: 100 }, data: { type: 'cdn', label: 'CDN', icon: '🌍', color: '#f97316', category: 'cache', config: {} } },
            { id: 'gateway-1', type: 'architecture', position: { x: 300, y: 300 }, data: { type: 'api-gateway', label: 'API Gateway', icon: '🚪', color: '#a855f7', category: 'infrastructure', config: {} } },
            { id: 'api-1', type: 'architecture', position: { x: 500, y: 200 }, data: { type: 'api-server', label: 'API Server', icon: '🔌', color: '#3b82f6', category: 'server', config: {} } },
            { id: 'cache-1', type: 'architecture', position: { x: 700, y: 100 }, data: { type: 'cache-layer', label: 'Cache Layer', icon: '💾', color: '#f59e0b', category: 'cache', config: {} } },
            { id: 'db-1', type: 'architecture', position: { x: 700, y: 200 }, data: { type: 'cassandra', label: 'Cassandra', icon: '📊', color: '#1287b1', category: 'database', config: {} } },
            { id: 'queue-1', type: 'architecture', position: { x: 700, y: 300 }, data: { type: 'message-queue', label: 'Message Queue', icon: '📨', color: '#ec4899', category: 'infrastructure', config: {} } },
        ],
        edges: [
            { id: 'e1', source: 'client-1', target: 'cdn-1' },
            { id: 'e2', source: 'client-1', target: 'gateway-1' },
            { id: 'e3', source: 'gateway-1', target: 'api-1' },
            { id: 'e4', source: 'api-1', target: 'cache-1' },
            { id: 'e5', source: 'api-1', target: 'db-1' },
            { id: 'e6', source: 'api-1', target: 'queue-1' },
        ],
    },
    {
        id: 'ecommerce',
        name: 'E-commerce Architecture',
        description: 'Online store with microservices',
        thumbnail: '🛒',
        category: 'ecommerce',
        nodes: [
            { id: 'client-1', type: 'architecture', position: { x: 100, y: 200 }, data: { type: 'web-client', label: 'Web Client', icon: '🌐', color: '#64748b', category: 'client', config: {} } },
            { id: 'lb-1', type: 'architecture', position: { x: 300, y: 200 }, data: { type: 'load-balancer', label: 'Load Balancer', icon: '⚖️', color: '#22c55e', category: 'infrastructure', config: {} } },
            { id: 'api-1', type: 'architecture', position: { x: 500, y: 100 }, data: { type: 'microservice', label: 'Product Service', icon: '🔷', color: '#06b6d4', category: 'server', config: {} } },
            { id: 'api-2', type: 'architecture', position: { x: 500, y: 200 }, data: { type: 'microservice', label: 'Order Service', icon: '🔷', color: '#06b6d4', category: 'server', config: {} } },
            { id: 'api-3', type: 'architecture', position: { x: 500, y: 300 }, data: { type: 'microservice', label: 'User Service', icon: '🔷', color: '#06b6d4', category: 'server', config: {} } },
            { id: 'db-1', type: 'architecture', position: { x: 700, y: 100 }, data: { type: 'postgres', label: 'PostgreSQL', icon: '🐘', color: '#336791', category: 'database', config: {} } },
            { id: 'db-2', type: 'architecture', position: { x: 700, y: 200 }, data: { type: 'mongodb', label: 'MongoDB', icon: '🍃', color: '#47a248', category: 'database', config: {} } },
            { id: 'cache-1', type: 'architecture', position: { x: 700, y: 300 }, data: { type: 'redis', label: 'Redis', icon: '⚡', color: '#dc382d', category: 'database', config: {} } },
        ],
        edges: [
            { id: 'e1', source: 'client-1', target: 'lb-1' },
            { id: 'e2', source: 'lb-1', target: 'api-1' },
            { id: 'e3', source: 'lb-1', target: 'api-2' },
            { id: 'e4', source: 'lb-1', target: 'api-3' },
            { id: 'e5', source: 'api-1', target: 'db-1' },
            { id: 'e6', source: 'api-2', target: 'db-2' },
            { id: 'e7', source: 'api-3', target: 'cache-1' },
        ],
    },
    {
        id: 'uber',
        name: 'Uber-like Architecture',
        description: 'Real-time ride-sharing platform with geospatial services',
        thumbnail: '🚗',
        category: 'marketplace',
        nodes: [
            { id: 'mobile-1', type: 'architecture', position: { x: 100, y: 150 }, data: { type: 'mobile-client', label: 'Mobile App', icon: '📱', color: '#000000', category: 'client', config: {} } },
            { id: 'gateway-1', type: 'architecture', position: { x: 300, y: 150 }, data: { type: 'api-gateway', label: 'API Gateway', icon: '🚪', color: '#a855f7', category: 'infrastructure', config: {} } },
            { id: 'dispatch-1', type: 'architecture', position: { x: 500, y: 50 }, data: { type: 'microservice', label: 'Dispatch Service', icon: '🚕', color: '#06b6d4', category: 'server', config: {} } },
            { id: 'pricing-1', type: 'architecture', position: { x: 500, y: 150 }, data: { type: 'microservice', label: 'Pricing Service', icon: '💰', color: '#06b6d4', category: 'server', config: {} } },
            { id: 'driver-1', type: 'architecture', position: { x: 500, y: 250 }, data: { type: 'microservice', label: 'Driver Service', icon: '👤', color: '#06b6d4', category: 'server', config: {} } },
            { id: 'geo-1', type: 'architecture', position: { x: 700, y: 50 }, data: { type: 'cassandra', label: 'Geo Database', icon: '🗺️', color: '#1287b1', category: 'database', config: {} } },
            { id: 'redis-1', type: 'architecture', position: { x: 700, y: 150 }, data: { type: 'redis', label: 'Redis Cache', icon: '⚡', color: '#dc382d', category: 'database', config: {} } },
            { id: 'postgres-1', type: 'architecture', position: { x: 700, y: 250 }, data: { type: 'postgres', label: 'PostgreSQL', icon: '🐘', color: '#336791', category: 'database', config: {} } },
            { id: 'queue-1', type: 'architecture', position: { x: 500, y: 350 }, data: { type: 'message-queue', label: 'Event Bus', icon: '📨', color: '#ec4899', category: 'infrastructure', config: {} } },
        ],
        edges: [
            { id: 'e1', source: 'mobile-1', target: 'gateway-1' },
            { id: 'e2', source: 'gateway-1', target: 'dispatch-1' },
            { id: 'e3', source: 'gateway-1', target: 'pricing-1' },
            { id: 'e4', source: 'gateway-1', target: 'driver-1' },
            { id: 'e5', source: 'dispatch-1', target: 'geo-1' },
            { id: 'e6', source: 'dispatch-1', target: 'redis-1' },
            { id: 'e7', source: 'pricing-1', target: 'redis-1' },
            { id: 'e8', source: 'driver-1', target: 'redis-1' },
            { id: 'e9', source: 'driver-1', target: 'postgres-1' },
            { id: 'e10', source: 'dispatch-1', target: 'queue-1' },
            { id: 'e11', source: 'pricing-1', target: 'queue-1' },
        ],
    },
];