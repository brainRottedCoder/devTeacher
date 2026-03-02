// Simulation Types for Scalability Simulator

export type ComponentType =
    | 'server'
    | 'database'
    | 'cache'
    | 'loadbalancer'
    | 'cdn'
    | 'queue'
    | 'storage'
    | 'shard'
    | 'replica'
    | 'edge-location'
    | 'origin';

export type ComponentStatus =
    | 'healthy'
    | 'warning'
    | 'critical'
    | 'failed';

export interface ComponentMetrics {
    cpu: number;           // 0-100%
    memory: number;        // 0-100%
    connections: number;   // active connections
    requestsPerSecond: number;
    latency: number;       // ms
    errorRate: number;     // 0-100%
}

export interface InfrastructureComponent {
    id: string;
    type: ComponentType;
    name: string;
    position: { x: number; y: number };
    config: ComponentConfig;
    metrics: ComponentMetrics;
    status: ComponentStatus;
    connections: string[]; // IDs of connected components
}

export interface ComponentConfig {
    // Server config
    instances?: number;
    cpuCores?: number;       // per instance
    memoryGB?: number;       // per instance

    // Database config
    databaseType?: 'postgres' | 'mysql' | 'mongodb' | 'redis';
    storageGB?: number;
    readReplicas?: number;

    // Cache config
    cacheSizeGB?: number;
    evictionPolicy?: 'lru' | 'lfu' | 'fifo';

    // Load Balancer config
    algorithm?: 'round-robin' | 'least-connections' | 'ip-hash';

    // CDN config
    edgeLocations?: number;

    // Queue config
    queueType?: 'rabbitmq' | 'kafka' | 'sqs';
    partitions?: number;

    // Storage config
    storageType?: 's3' | 'gcs' | 'azure-blob';
    redundancy?: 'standard' | 'high';
}

export interface SimulationState {
    users: number;
    requestsPerSecond: number;
    components: InfrastructureComponent[];
    globalMetrics: GlobalMetrics;
    bottlenecks: Bottleneck[];
    estimatedCost: CostEstimate;
    timestamp: number;
}

export interface GlobalMetrics {
    totalLatency: number;      // ms (average response time)
    throughput: number;        // requests/second
    errorRate: number;         // 0-100%
    availability: number;      // 0-100%
    cacheHitRate: number;      // 0-100%
}

export interface Bottleneck {
    componentId: string;
    componentName: string;
    type: 'cpu' | 'memory' | 'connections' | 'latency' | 'error-rate';
    severity: 'warning' | 'critical';
    message: string;
    suggestion: string;
}

export interface CostEstimate {
    compute: number;     // $/hour
    database: number;    // $/hour
    cache: number;       // $/hour
    network: number;     // $/hour
    storage: number;     // $/hour
    total: number;       // $/hour
    monthlyEstimate: number;  // $/month (730 hours)
}

export interface SimulationPreset {
    id: string;
    name: string;
    description: string;
    icon: string;
    initialComponents: InfrastructureComponent[];
    targetUsers: number;
}

// Default configurations
export const DEFAULT_COMPONENT_CONFIGS: Record<ComponentType, ComponentConfig> = {
    server: {
        instances: 1,
        cpuCores: 2,
        memoryGB: 4,
    },
    database: {
        databaseType: 'postgres',
        storageGB: 100,
        readReplicas: 0,
    },
    cache: {
        cacheSizeGB: 1,
        evictionPolicy: 'lru',
    },
    loadbalancer: {
        algorithm: 'round-robin',
    },
    cdn: {
        edgeLocations: 10,
    },
    queue: {
        queueType: 'rabbitmq',
        partitions: 1,
    },
    storage: {
        storageType: 's3',
        redundancy: 'standard',
    },
    // Advanced components
    shard: {
        databaseType: 'postgres',
        storageGB: 100,
        readReplicas: 0,
    },
    replica: {
        databaseType: 'postgres',
        storageGB: 50,
        readReplicas: 0,
    },
    'edge-location': {
        edgeLocations: 1,
    },
    origin: {
        instances: 1,
        cpuCores: 2,
        memoryGB: 4,
    },
};

// Component display names and icons
export const COMPONENT_INFO: Record<ComponentType, { name: string; icon: string; color: string }> = {
    server: { name: 'Application Server', icon: '🖥️', color: '#8b5cf6' },
    database: { name: 'Database', icon: '🗄️', color: '#3b82f6' },
    cache: { name: 'Cache (Redis)', icon: '⚡', color: '#ef4444' },
    loadbalancer: { name: 'Load Balancer', icon: '⚖️', color: '#10b981' },
    cdn: { name: 'CDN', icon: '🌍', color: '#f59e0b' },
    queue: { name: 'Message Queue', icon: '📨', color: '#ec4899' },
    storage: { name: 'Object Storage', icon: '📦', color: '#06b6d4' },
    // Advanced simulation components
    shard: { name: 'Database Shard', icon: '🔱', color: '#6366f1' },
    replica: { name: 'Read Replica', icon: '📖', color: '#14b8a6' },
    'edge-location': { name: 'Edge Location', icon: '📡', color: '#f97316' },
    origin: { name: 'Origin Server', icon: '🏢', color: '#84cc16' },
};

// User load levels for the slider (extended for 100M simulation)
export const USER_LEVELS = [
    { value: 100, label: '100', description: 'Small startup' },
    { value: 1000, label: '1K', description: 'Growing product' },
    { value: 10000, label: '10K', description: 'Established product' },
    { value: 100000, label: '100K', description: 'Popular service' },
    { value: 1000000, label: '1M', description: 'Scale challenge' },
    { value: 10000000, label: '10M', description: 'Large scale' },
    { value: 100000000, label: '100M', description: 'Massive scale' },
];

// Geographic regions for latency simulation
export interface GeographicRegion {
    id: string;
    name: string;
    code: string;
    latency: number; // Base latency to this region (ms)
    users: number; // Percentage of users in this region
}

export const GEOGRAPHIC_REGIONS: GeographicRegion[] = [
    { id: 'us-east', name: 'US East (N. Virginia)', code: 'us-east-1', latency: 10, users: 25 },
    { id: 'us-west', name: 'US West (Oregon)', code: 'us-west-2', latency: 15, users: 20 },
    { id: 'eu-west', name: 'EU (Ireland)', code: 'eu-west-1', latency: 80, users: 15 },
    { id: 'eu-central', name: 'EU (Frankfurt)', code: 'eu-central-1', latency: 85, users: 10 },
    { id: 'ap-south', name: 'Asia Pacific (Mumbai)', code: 'ap-south-1', latency: 150, users: 10 },
    { id: 'ap-northeast', name: 'Asia Pacific (Tokyo)', code: 'ap-northeast-1', latency: 120, users: 8 },
    { id: 'ap-southeast', name: 'Asia Pacific (Singapore)', code: 'ap-southeast-1', latency: 140, users: 7 },
    { id: 'sa-east', name: 'South America (São Paulo)', code: 'sa-east-1', latency: 180, users: 5 },
];

// Failure injection types
export type FailureType =
    | 'server-crash'
    | 'server-restart'
    | 'database-failure'
    | 'cache-failure'
    | 'network-partition'
    | 'latency-spike'
    | 'ddos-attack'
    | 'disk-full'
    | 'memory-leak';

export interface FailureInjection {
    id: string;
    type: FailureType;
    targetComponentId?: string;
    targetComponentType?: ComponentType;
    probability: number; // 0-100%
    duration: number; // seconds
    intensity: number; // 0-100%
    description: string;
    isActive: boolean;
    triggeredAt?: number;
}

export interface ChaosScenario {
    id: string;
    name: string;
    description: string;
    failures: FailureInjection[];
    difficulty: 'easy' | 'medium' | 'hard';
    recommendedFor: string[];
}

// Pre-defined chaos scenarios
export const CHAOS_SCENARIOS: ChaosScenario[] = [
    {
        id: 'single-server-failure',
        name: 'Single Server Failure',
        description: 'Simulates a server crashing and recovering',
        failures: [
            { id: 'f1', type: 'server-crash', targetComponentType: 'server', probability: 100, duration: 30, intensity: 100, description: 'Server crashes', isActive: false }
        ],
        difficulty: 'easy',
        recommendedFor: ['load-balancing', 'high-availability']
    },
    {
        id: 'database-outage',
        name: 'Database Outage',
        description: 'Simulates database becoming unavailable',
        failures: [
            { id: 'f2', type: 'database-failure', targetComponentType: 'database', probability: 100, duration: 60, intensity: 100, description: 'Database fails', isActive: false }
        ],
        difficulty: 'medium',
        recommendedFor: ['read-replicas', 'multi-az']
    },
    {
        id: 'network-partition',
        name: 'Network Partition',
        description: 'Simulates network issues between services',
        failures: [
            { id: 'f3', type: 'network-partition', probability: 100, duration: 45, intensity: 80, description: 'Network partition', isActive: false }
        ],
        difficulty: 'medium',
        recommendedFor: ['circuit-breakers', 'retries']
    },
    {
        id: 'ddos-attack',
        name: 'DDoS Attack',
        description: 'Simulates a distributed denial of service attack',
        failures: [
            { id: 'f4', type: 'ddos-attack', probability: 100, duration: 120, intensity: 100, description: 'DDoS attack', isActive: false }
        ],
        difficulty: 'hard',
        recommendedFor: ['rate-limiting', 'cdn', 'firewall']
    },
    {
        id: 'cache-failure',
        name: 'Cache Failure',
        description: 'Simulates Redis cache going down',
        failures: [
            { id: 'f5', type: 'cache-failure', targetComponentType: 'cache', probability: 100, duration: 30, intensity: 100, description: 'Cache fails', isActive: false }
        ],
        difficulty: 'easy',
        recommendedFor: ['cache-strategies', 'database-optimization']
    },
    {
        id: 'latency-injection',
        name: 'Latency Injection',
        description: 'Simulates high latency in network',
        failures: [
            { id: 'f6', type: 'latency-spike', probability: 100, duration: 60, intensity: 50, description: 'Network latency spike', isActive: false }
        ],
        difficulty: 'medium',
        recommendedFor: ['timeouts', 'async-processing']
    },
    {
        id: 'cascade-failure',
        name: 'Cascade Failure',
        description: 'Multiple failures cascading through the system',
        failures: [
            { id: 'f7', type: 'server-crash', targetComponentType: 'server', probability: 50, duration: 20, intensity: 100, description: 'Primary server crashes', isActive: false },
            { id: 'f8', type: 'server-crash', targetComponentType: 'server', probability: 30, duration: 20, intensity: 100, description: 'Secondary server crashes', isActive: false },
            { id: 'f9', type: 'database-failure', targetComponentType: 'database', probability: 20, duration: 30, intensity: 100, description: 'Database overloaded', isActive: false }
        ],
        difficulty: 'hard',
        recommendedFor: ['circuit-breakers', 'bulkheads', 'graceful-degradation']
    },
];

// Simulation constants
export const SIMULATION_CONSTANTS = {
    // Base metrics per user
    requestsPerUserPerSecond: 0.1,  // Each user makes ~1 request every 10 seconds

    // Server capacity
    requestsPerCpuCore: 500,        // Requests per second per CPU core
    memoryPerRequest: 0.5,          // MB per request

    // Database capacity
    dbConnectionsPerCore: 100,
    dbQueriesPerSecond: 1000,       // Per core

    // Cache
    cacheHitRateBase: 80,           // % base cache hit rate
    cacheMemoryPerItem: 0.001,      // MB per cached item

    // Latency baselines (ms)
    serverLatency: 5,
    dbLatency: 20,
    cacheLatency: 1,
    cdnLatency: 50,
    networkLatency: 10,

    // Cost estimates ($/hour)
    costPerCpuCore: 0.05,
    costPerGBMemory: 0.01,
    costPerGBStorage: 0.0001,
    costPerCacheGB: 0.05,
    costPerCDNEdge: 0.10,
    costPerNetworkGB: 0.01,
};
