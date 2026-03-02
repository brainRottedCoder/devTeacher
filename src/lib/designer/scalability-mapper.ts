// Architecture to Simulation Mapper
// Maps architecture designer components to simulation components

import { Node, Edge } from '@xyflow/react';
import {
    InfrastructureComponent,
    ComponentType,
    ComponentConfig,
    ComponentStatus,
    SimulationState
} from '@/lib/simulation/types';
import { ArchitectureNodeData } from './types';

// Map designer component types to simulation component types
function mapToSimulationType(designerType: string): ComponentType {
    const typeMap: Record<string, ComponentType> = {
        'web-server': 'server',
        'api-server': 'server',
        'app-server': 'server',
        'microservice': 'server',
        'lambda': 'server',
        'container': 'server',
        'kubernetes': 'server',
        'postgres': 'database',
        'mysql': 'database',
        'mongodb': 'database',
        'cassandra': 'database',
        'dynamodb': 'database',
        'redis': 'cache',
        'cache-layer': 'cache',
        'cdn': 'cdn',
        'load-balancer': 'loadbalancer',
        'api-gateway': 'loadbalancer',
        'reverse-proxy': 'loadbalancer',
        'message-queue': 'queue',
        'web-client': 'server',
        'mobile-client': 'server',
        'iot-device': 'server',
    };
    return typeMap[designerType] || 'server';
}

// Map designer config to simulation config
function mapToSimulationConfig(
    designerType: string,
    config: Record<string, any>
): ComponentConfig {
    const baseConfig: ComponentConfig = {};

    // Server configurations
    if (['web-server', 'api-server', 'app-server', 'microservice'].includes(designerType)) {
        baseConfig.instances = config.instances || 1;
        baseConfig.cpuCores = config.cpuCores || 2;
        baseConfig.memoryGB = config.memoryGB || 4;
    }

    // Database configurations
    if (['postgres', 'mysql', 'mongodb'].includes(designerType)) {
        baseConfig.databaseType = designerType as 'postgres' | 'mysql' | 'mongodb';
        baseConfig.storageGB = config.storageGB || 100;
        baseConfig.readReplicas = config.readReplicas || 0;
    }

    // Cache configurations
    if (designerType === 'redis' || designerType === 'cache-layer') {
        baseConfig.cacheSizeGB = config.cacheSizeGB || 10;
        baseConfig.evictionPolicy = config.evictionPolicy || 'lru';
    }

    // CDN configurations
    if (designerType === 'cdn') {
        baseConfig.edgeLocations = config.edgeLocations || 10;
    }

    // Queue configurations
    if (designerType === 'message-queue') {
        baseConfig.queueType = 'kafka';
        baseConfig.partitions = config.partitions || 10;
    }

    return baseConfig;
}

// Convert React Flow nodes and edges to simulation components
export function architectureToSimulation(
    nodes: Node[],
    edges: Edge[]
): InfrastructureComponent[] {
    return nodes.map((node) => {
        const data = node.data as ArchitectureNodeData;

        return {
            id: node.id,
            type: mapToSimulationType(data.type),
            name: data.label,
            position: node.position,
            config: mapToSimulationConfig(data.type, data.config || {}),
            metrics: {
                cpu: 0,
                memory: 0,
                connections: 0,
                requestsPerSecond: 0,
                latency: 0,
                errorRate: 0,
            },
            status: 'healthy',
            connections: edges
                .filter(e => e.source === node.id)
                .map(e => e.target),
        };
    });
}

// Run simulation with given user count
export function runScalabilityTest(
    nodes: Node[],
    edges: Edge[],
    userCount: number
): SimulationState {
    const components = architectureToSimulation(nodes, edges);

    // Simple simulation calculation
    const requestsPerSecond = userCount * 0.1; // 0.1 RPS per user

    // Calculate metrics for each component
    const processedComponents = components.map(component => {
        const metrics = calculateMetrics(component, requestsPerSecond, components);
        return {
            ...component,
            metrics,
            status: determineStatus(metrics),
        };
    });

    // Calculate global metrics
    const globalMetrics = calculateGlobalMetrics(processedComponents, userCount);

    // Detect bottlenecks
    const bottlenecks = detectBottlenecks(processedComponents);

    // Calculate costs
    const estimatedCost = calculateCosts(processedComponents, userCount);

    return {
        users: userCount,
        requestsPerSecond,
        components: processedComponents,
        globalMetrics,
        bottlenecks,
        estimatedCost,
        timestamp: Date.now(),
    };
}

function calculateMetrics(
    component: InfrastructureComponent,
    totalRps: number,
    allComponents: InfrastructureComponent[]
) {
    const { type, config } = component;

    switch (type) {
        case 'loadbalancer':
            return calculateLoadBalancerMetrics(totalRps);
        case 'server':
            return calculateServerMetrics(config, totalRps);
        case 'database':
            return calculateDatabaseMetrics(config, totalRps);
        case 'cache':
            return calculateCacheMetrics(config, totalRps);
        case 'cdn':
            return calculateCdnMetrics(config, totalRps);
        case 'queue':
            return calculateQueueMetrics(config, totalRps);
        default:
            return {
                cpu: 0,
                memory: 0,
                connections: 0,
                requestsPerSecond: 0,
                latency: 0,
                errorRate: 0,
            };
    }
}

function calculateLoadBalancerMetrics(rps: number) {
    const maxRps = 100000;
    const utilization = Math.min(100, (rps / maxRps) * 100);

    return {
        cpu: utilization * 0.3,
        memory: utilization * 0.2,
        connections: rps,
        requestsPerSecond: rps,
        latency: 2 + (utilization > 80 ? 5 : 0),
        errorRate: utilization > 95 ? (utilization - 95) * 2 : 0,
    };
}

function calculateServerMetrics(config: ComponentConfig, rps: number) {
    const instances = config.instances || 1;
    const cpuCores = config.cpuCores || 2;
    const memoryGB = config.memoryGB || 4;

    const totalCpuCores = instances * cpuCores;
    const maxRps = totalCpuCores * 500; // 500 RPS per core
    const memoryPerRequest = 0.001; // MB

    const cpuUtilization = Math.min(100, (rps / maxRps) * 100);
    const memoryUsed = (rps * memoryPerRequest) / 1024;
    const memoryUtilization = Math.min(100, (memoryUsed / memoryGB) * 100);

    const baseLatency = 50;
    const queueLatency = cpuUtilization > 70 ? (cpuUtilization - 70) * 0.5 : 0;

    return {
        cpu: cpuUtilization,
        memory: memoryUtilization,
        connections: rps,
        requestsPerSecond: rps,
        latency: baseLatency + queueLatency,
        errorRate: cpuUtilization > 90 ? (cpuUtilization - 90) : 0,
    };
}

function calculateDatabaseMetrics(config: ComponentConfig, rps: number) {
    const readReplicas = config.readReplicas || 0;
    const writeRatio = 0.2;
    const readRatio = 0.8;

    const writeRps = rps * writeRatio;
    const readRps = rps * readRatio / (readReplicas + 1);

    const maxQueriesPerInstance = 5000;
    const primaryLoad = (writeRps + readRps) / maxQueriesPerInstance * 100;
    const replicaLoad = readRps / maxQueriesPerInstance * 100;

    const avgCpu = readReplicas > 0
        ? (primaryLoad + replicaLoad * readReplicas) / (readReplicas + 1)
        : primaryLoad;

    return {
        cpu: Math.min(100, avgCpu),
        memory: Math.min(100, avgCpu * 0.7),
        connections: rps,
        requestsPerSecond: rps,
        latency: 10 + avgCpu * 0.1,
        errorRate: avgCpu > 90 ? (avgCpu - 90) * 2 : 0,
    };
}

function calculateCacheMetrics(config: ComponentConfig, rps: number) {
    const cacheSizeGB = config.cacheSizeGB || 10;
    const hitRatio = 0.8; // Simulated hit ratio

    const requestsThroughCache = rps * hitRatio;
    const requestsToBackend = rps * (1 - hitRatio);

    const maxRps = 50000;
    const utilization = Math.min(100, (requestsThroughCache / maxRps) * 100);

    return {
        cpu: utilization * 0.3,
        memory: Math.min(100, (cacheSizeGB / 20) * 100),
        connections: rps,
        requestsPerSecond: rps,
        latency: 1 + utilization * 0.02,
        errorRate: 0,
    };
}

function calculateCdnMetrics(config: ComponentConfig, rps: number) {
    const edgeLocations = config.edgeLocations || 10;
    const cachedRatio = 0.7;

    const cachedRequests = rps * cachedRatio;
    const originRequests = rps * (1 - cachedRatio);

    return {
        cpu: Math.min(100, (cachedRequests / (edgeLocations * 10000)) * 100),
        memory: 20,
        connections: rps,
        requestsPerSecond: rps,
        latency: 20 + (1 - cachedRatio) * 100, // Cache miss adds latency
        errorRate: 0,
    };
}

function calculateQueueMetrics(config: ComponentConfig, rps: number) {
    const partitions = config.partitions || 10;
    const maxRps = partitions * 1000;
    const utilization = Math.min(100, (rps / maxRps) * 100);

    return {
        cpu: utilization * 0.4,
        memory: utilization * 0.3,
        connections: rps,
        requestsPerSecond: rps,
        latency: 5 + utilization * 0.05,
        errorRate: utilization > 95 ? (utilization - 95) : 0,
    };
}

function determineStatus(metrics: any): ComponentStatus {
    if (metrics.errorRate > 10 || metrics.cpu > 95) return 'critical';
    if (metrics.errorRate > 5 || metrics.cpu > 80) return 'warning';
    return 'healthy';
}

function calculateGlobalMetrics(components: any[], users: number) {
    const latencies = components.map(c => c.metrics.latency);
    const totalLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length || 0;

    const errors = components.map(c => c.metrics.errorRate);
    const avgErrorRate = errors.reduce((a, b) => a + b, 0) / errors.length || 0;

    return {
        totalLatency,
        throughput: users * 0.1,
        errorRate: avgErrorRate,
        availability: Math.max(0, 100 - avgErrorRate),
        cacheHitRate: 75, // Simulated
    };
}

function detectBottlenecks(components: InfrastructureComponent[]) {
    const bottlenecks: any[] = [];

    components.forEach(component => {
        if (component.status === 'critical') {
            bottlenecks.push({
                componentId: component.id,
                componentName: component.name,
                type: 'cpu' as const,
                severity: 'critical' as const,
                message: `${component.name} is at ${component.metrics.cpu.toFixed(0)}% CPU utilization - scale immediately!`,
                suggestion: getRecommendation(component),
            });
        } else if (component.status === 'warning') {
            bottlenecks.push({
                componentId: component.id,
                componentName: component.name,
                type: 'cpu' as const,
                severity: 'warning' as const,
                message: `${component.name} is at ${component.metrics.cpu.toFixed(0)}% CPU utilization - consider scaling`,
                suggestion: getRecommendation(component),
            });
        }
    });

    return bottlenecks;
}

function getRecommendation(component: InfrastructureComponent): string {
    switch (component.type) {
        case 'server':
            return 'Add more instances or increase CPU cores';
        case 'database':
            return 'Add read replicas or optimize queries';
        case 'cache':
            return 'Increase cache size or add Redis cluster';
        case 'loadbalancer':
            return 'Consider using multiple load balancers';
        case 'queue':
            return 'Add more partitions or use message batching';
        default:
            return 'Review and optimize configuration';
    }
}

function calculateCosts(components: InfrastructureComponent[], users: number) {
    let compute = 0;
    let database = 0;
    let cache = 0;
    let network = 0;
    let storage = 0;

    components.forEach(component => {
        switch (component.type) {
            case 'server':
                compute += (component.config.instances || 1) * 50;
                break;
            case 'database':
                database += 100 + (component.config.readReplicas || 0) * 50;
                break;
            case 'cache':
                cache += 30;
                break;
            case 'cdn':
                network += users * 0.001;
                break;
            case 'queue':
                compute += 20;
                break;
        }
    });

    const total = compute + database + cache + network + storage;

    return {
        compute,
        database,
        cache,
        network,
        storage,
        total,
        monthlyEstimate: total * 730, // hours per month
    };
}

// Traffic scale levels for UI
export const TRAFFIC_SCALES = [
    { label: '100', value: 100, description: 'Startup' },
    { label: '1K', value: 1000, description: 'Small Business' },
    { label: '10K', value: 10000, description: 'Growing' },
    { label: '100K', value: 100000, description: 'Scale Up' },
    { label: '1M', value: 1000000, description: 'Enterprise' },
    { label: '10M', value: 10000000, description: 'Large Scale' },
    { label: '100M', value: 100000000, description: 'Massive' },
];

// Format number with suffix
export function formatNumber(num: number): string {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// Format currency
export function formatCurrency(amount: number): string {
    if (amount >= 1000) return '$' + (amount / 1000).toFixed(1) + 'K/mo';
    return '$' + amount.toFixed(2);
}
