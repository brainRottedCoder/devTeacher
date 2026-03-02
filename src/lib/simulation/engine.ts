// Simulation Engine - Core logic for scalability simulation

import {
    InfrastructureComponent,
    SimulationState,
    ComponentMetrics,
    ComponentStatus,
    Bottleneck,
    CostEstimate,
    GlobalMetrics,
    SIMULATION_CONSTANTS,
    ComponentType,
    GeographicRegion,
    GEOGRAPHIC_REGIONS,
    FailureInjection,
    ChaosScenario,
    CHAOS_SCENARIOS,
} from './types';

import {
    calculateInfrastructureCost,
    compareCloudProviders,
    CloudProvider
} from '@/lib/cloud-pricing';

export interface ExtendedSimulationState extends SimulationState {
    geographicRegions: GeographicRegion[];
    activeFailures: FailureInjection[];
    activeChaosScenarios: ChaosScenario[];
    geographicLatency: Record<string, number>; // regionId -> latency ms
    lastFailureEvent?: FailureEvent;
}

export interface FailureEvent {
    id: string;
    type: string;
    componentId?: string;
    timestamp: number;
    impact: number;
    description: string;
}

export class SimulationEngine {
    private state: ExtendedSimulationState;
    private cloudProvider: CloudProvider = 'aws'; // Default to AWS

    constructor(initialComponents: InfrastructureComponent[] = []) {
        this.state = {
            users: 100,
            requestsPerSecond: 10,
            components: initialComponents,
            globalMetrics: {
                totalLatency: 0,
                throughput: 0,
                errorRate: 0,
                availability: 100,
                cacheHitRate: 0,
            },
            bottlenecks: [],
            estimatedCost: {
                compute: 0,
                database: 0,
                cache: 0,
                network: 0,
                storage: 0,
                total: 0,
                monthlyEstimate: 0,
            },
            timestamp: Date.now(),
            // New advanced features
            geographicRegions: [...GEOGRAPHIC_REGIONS],
            activeFailures: [],
            activeChaosScenarios: [],
            geographicLatency: this.calculateGeographicLatency(),
        };
    }

    // Calculate geographic latency based on user distribution
    private calculateGeographicLatency(): Record<string, number> {
        const latency: Record<string, number> = {};
        for (const region of GEOGRAPHIC_REGIONS) {
            // Add some variance to make it realistic
            const variance = (Math.random() - 0.5) * 10;
            latency[region.id] = Math.max(5, region.latency + variance);
        }
        return latency;
    }

    // Set user count and recalculate
    setUsers(users: number): SimulationState {
        this.state.users = users;
        this.state.requestsPerSecond = users * SIMULATION_CONSTANTS.requestsPerUserPerSecond;
        return this.simulate();
    }

    // Add a component to the infrastructure
    addComponent(component: InfrastructureComponent): void {
        this.state.components.push(component);
        this.simulate();
    }

    // Remove a component
    removeComponent(componentId: string): void {
        this.state.components = this.state.components.filter(c => c.id !== componentId);
        // Remove connections to this component
        this.state.components.forEach(c => {
            c.connections = c.connections.filter(id => id !== componentId);
        });
        this.simulate();
    }

    // Update component configuration
    updateComponent(componentId: string, updates: Partial<InfrastructureComponent>): void {
        const component = this.state.components.find(c => c.id === componentId);
        if (component) {
            Object.assign(component, updates);
            this.simulate();
        }
    }

    // Connect two components
    connectComponents(fromId: string, toId: string): void {
        const from = this.state.components.find(c => c.id === fromId);
        if (from && !from.connections.includes(toId)) {
            from.connections.push(toId);
            this.simulate();
        }
    }

    // Main simulation logic
    simulate(): ExtendedSimulationState {
        const { components, requestsPerSecond } = this.state;

        // Reset bottlenecks
        this.state.bottlenecks = [];

        // Calculate metrics for each component
        components.forEach(component => {
            component.metrics = this.calculateComponentMetrics(component, requestsPerSecond);
            component.status = this.determineComponentStatus(component.metrics);
            this.detectBottlenecks(component);
        });

        // Calculate global metrics
        this.state.globalMetrics = this.calculateGlobalMetrics();

        // Apply failure impact from chaos engineering
        const failureImpact = this.calculateFailureImpact();
        this.state.globalMetrics.errorRate = Math.min(100,
            this.state.globalMetrics.errorRate + failureImpact.errorRateIncrease);
        this.state.globalMetrics.totalLatency += failureImpact.latencyIncrease;
        this.state.globalMetrics.availability = Math.max(0,
            this.state.globalMetrics.availability - failureImpact.availabilityDecrease);

        // Add geographic latency to total
        const weightedLatency = this.getWeightedAverageLatency();
        this.state.globalMetrics.totalLatency += weightedLatency;

        // Calculate costs
        this.state.estimatedCost = this.calculateCosts();

        this.state.timestamp = Date.now();

        return { ...this.state };
    }

    // Calculate metrics for a specific component
    private calculateComponentMetrics(
        component: InfrastructureComponent,
        totalRps: number
    ): ComponentMetrics {
        const { config, type } = component;
        const consts = SIMULATION_CONSTANTS;

        switch (type) {
            case 'loadbalancer':
                return this.calculateLoadBalancerMetrics(config, totalRps);
            case 'server':
                return this.calculateServerMetrics(config, totalRps);
            case 'database':
                return this.calculateDatabaseMetrics(config, totalRps);
            case 'cache':
                return this.calculateCacheMetrics(config, totalRps);
            case 'cdn':
                return this.calculateCDNMetrics(config, totalRps);
            case 'queue':
                return this.calculateQueueMetrics(config, totalRps);
            case 'storage':
                return this.calculateStorageMetrics(config, totalRps);
            default:
                return this.getDefaultMetrics();
        }
    }

    private calculateLoadBalancerMetrics(config: any, rps: number): ComponentMetrics {
        const maxRps = 100000; // Load balancers can handle lots of connections
        const utilization = Math.min(100, (rps / maxRps) * 100);

        return {
            cpu: utilization * 0.3, // LB is CPU efficient
            memory: utilization * 0.2,
            connections: rps,
            requestsPerSecond: rps,
            latency: SIMULATION_CONSTANTS.networkLatency + (utilization > 80 ? 5 : 0),
            errorRate: utilization > 95 ? (utilization - 95) * 2 : 0,
        };
    }

    private calculateServerMetrics(config: any, rps: number): ComponentMetrics {
        const instances = config.instances || 1;
        const cpuCores = config.cpuCores || 2;
        const memoryGB = config.memoryGB || 4;

        const totalCpuCores = instances * cpuCores;
        const totalMemory = instances * memoryGB;

        const maxRps = totalCpuCores * SIMULATION_CONSTANTS.requestsPerCpuCore;
        const memoryPerRequest = SIMULATION_CONSTANTS.memoryPerRequest; // MB

        const cpuUtilization = Math.min(100, (rps / maxRps) * 100);
        const memoryUsed = (rps * memoryPerRequest) / 1024; // GB
        const memoryUtilization = Math.min(100, (memoryUsed / totalMemory) * 100);

        const baseLatency = SIMULATION_CONSTANTS.serverLatency;
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

    private calculateDatabaseMetrics(config: any, rps: number): ComponentMetrics {
        const readReplicas = config.readReplicas || 0;
        const totalInstances = 1 + readReplicas;

        // Write queries go to primary, read queries can be distributed
        const writeRatio = 0.2; // 20% writes
        const readRatio = 0.8; // 80% reads

        const writeRps = rps * writeRatio;
        const readRps = rps * readRatio / (readReplicas + 1); // Distributed reads

        const maxQueriesPerInstance = SIMULATION_CONSTANTS.dbQueriesPerSecond;

        const primaryLoad = (writeRps + readRps) / maxQueriesPerInstance * 100;
        const replicaLoad = readRps / maxQueriesPerInstance * 100;

        const avgCpu = (primaryLoad + replicaLoad * readReplicas) / totalInstances;

        const connectionLimit = SIMULATION_CONSTANTS.dbConnectionsPerCore * 2; // Assume 2 cores
        const connectionUtilization = Math.min(100, (rps / connectionLimit) * 100);

        const baseLatency = SIMULATION_CONSTANTS.dbLatency;
        const queueLatency = avgCpu > 70 ? (avgCpu - 70) * 1 : 0;

        return {
            cpu: Math.min(100, avgCpu),
            memory: connectionUtilization * 0.5,
            connections: rps,
            requestsPerSecond: rps,
            latency: baseLatency + queueLatency,
            errorRate: avgCpu > 90 ? (avgCpu - 90) * 2 : 0,
        };
    }

    private calculateCacheMetrics(config: any, rps: number): ComponentMetrics {
        const cacheSizeGB = config.cacheSizeGB || 1;
        const hitRate = Math.min(95, SIMULATION_CONSTANTS.cacheHitRateBase + (cacheSizeGB - 1) * 2);

        // Only cache hits go to cache, misses go to DB
        const cacheRps = rps * (hitRate / 100);

        const maxCacheRps = 50000; // Redis can handle lots of ops
        const utilization = Math.min(100, (cacheRps / maxCacheRps) * 100);

        return {
            cpu: utilization * 0.2, // Cache is CPU efficient
            memory: Math.min(100, (rps * 0.001) / cacheSizeGB * 100), // Memory usage
            connections: cacheRps,
            requestsPerSecond: cacheRps,
            latency: SIMULATION_CONSTANTS.cacheLatency,
            errorRate: 0,
        };
    }

    private calculateCDNMetrics(config: any, rps: number): ComponentMetrics {
        const edgeLocations = config.edgeLocations || 10;

        // CDN handles static content, reduces origin load
        const cdnHitRate = 70; // 70% served from CDN
        const cdnRps = rps * (cdnHitRate / 100);

        const maxRpsPerEdge = 5000;
        const utilization = Math.min(100, (cdnRps / (edgeLocations * maxRpsPerEdge)) * 100);

        return {
            cpu: utilization * 0.1,
            memory: utilization * 0.1,
            connections: cdnRps,
            requestsPerSecond: cdnRps,
            latency: SIMULATION_CONSTANTS.cdnLatency / edgeLocations, // More edges = lower latency
            errorRate: 0,
        };
    }

    private calculateQueueMetrics(config: any, rps: number): ComponentMetrics {
        const partitions = config.partitions || 1;

        const maxMessagesPerPartition = 10000;
        const queueDepth = Math.min(100, (rps / (partitions * maxMessagesPerPartition)) * 100);

        return {
            cpu: queueDepth * 0.3,
            memory: queueDepth * 0.5,
            connections: rps,
            requestsPerSecond: rps,
            latency: 5 + queueDepth * 0.1,
            errorRate: queueDepth > 95 ? queueDepth - 95 : 0,
        };
    }

    private calculateStorageMetrics(config: any, rps: number): ComponentMetrics {
        const storageType = config.storageType || 's3';

        // Storage is usually not the bottleneck
        const maxOps = 5000;
        const utilization = Math.min(100, (rps / maxOps) * 100);

        return {
            cpu: utilization * 0.1,
            memory: utilization * 0.1,
            connections: rps,
            requestsPerSecond: rps,
            latency: 20,
            errorRate: 0,
        };
    }

    private getDefaultMetrics(): ComponentMetrics {
        return {
            cpu: 0,
            memory: 0,
            connections: 0,
            requestsPerSecond: 0,
            latency: 0,
            errorRate: 0,
        };
    }

    // Determine component status based on metrics
    private determineComponentStatus(metrics: ComponentMetrics): ComponentStatus {
        if (metrics.errorRate > 5 || metrics.cpu > 95 || metrics.memory > 95) {
            return 'failed';
        }
        if (metrics.errorRate > 1 || metrics.cpu > 85 || metrics.memory > 85) {
            return 'critical';
        }
        if (metrics.cpu > 70 || metrics.memory > 70 || metrics.latency > 100) {
            return 'warning';
        }
        return 'healthy';
    }

    // Detect bottlenecks for a component
    private detectBottlenecks(component: InfrastructureComponent): void {
        const { metrics, name, id } = component;

        // CPU bottleneck
        if (metrics.cpu > 80) {
            this.state.bottlenecks.push({
                componentId: id,
                componentName: name,
                type: 'cpu',
                severity: metrics.cpu > 90 ? 'critical' : 'warning',
                message: `CPU usage at ${metrics.cpu.toFixed(1)}%`,
                suggestion: metrics.cpu > 90
                    ? 'Add more server instances or upgrade CPU'
                    : 'Consider scaling soon to prevent performance degradation',
            });
        }

        // Memory bottleneck
        if (metrics.memory > 80) {
            this.state.bottlenecks.push({
                componentId: id,
                componentName: name,
                type: 'memory',
                severity: metrics.memory > 90 ? 'critical' : 'warning',
                message: `Memory usage at ${metrics.memory.toFixed(1)}%`,
                suggestion: 'Increase memory allocation or optimize memory usage',
            });
        }

        // Latency bottleneck
        if (metrics.latency > 100) {
            this.state.bottlenecks.push({
                componentId: id,
                componentName: name,
                type: 'latency',
                severity: metrics.latency > 500 ? 'critical' : 'warning',
                message: `High latency: ${metrics.latency.toFixed(0)}ms`,
                suggestion: 'Optimize queries, add caching, or scale horizontally',
            });
        }

        // Error rate bottleneck
        if (metrics.errorRate > 0) {
            this.state.bottlenecks.push({
                componentId: id,
                componentName: name,
                type: 'error-rate',
                severity: metrics.errorRate > 3 ? 'critical' : 'warning',
                message: `Error rate: ${metrics.errorRate.toFixed(2)}%`,
                suggestion: 'Scale immediately to handle load and reduce errors',
            });
        }
    }

    // Calculate global metrics
    private calculateGlobalMetrics(): GlobalMetrics {
        const { components, requestsPerSecond } = this.state;

        if (components.length === 0) {
            return {
                totalLatency: 0,
                throughput: 0,
                errorRate: 0,
                availability: 100,
                cacheHitRate: 0,
            };
        }

        // Calculate total latency (sum of component latencies in the critical path)
        const serverComponents = components.filter(c => c.type === 'server');
        const dbComponents = components.filter(c => c.type === 'database');
        const cacheComponents = components.filter(c => c.type === 'cache');
        const cdnComponents = components.filter(c => c.type === 'cdn');
        const lbComponents = components.filter(c => c.type === 'loadbalancer');

        let totalLatency = SIMULATION_CONSTANTS.networkLatency;

        // Add LB latency
        if (lbComponents.length > 0) {
            totalLatency += Math.max(...lbComponents.map(c => c.metrics.latency));
        }

        // Add server latency
        if (serverComponents.length > 0) {
            totalLatency += Math.max(...serverComponents.map(c => c.metrics.latency));
        }

        // Add DB latency (reduced by cache)
        const cacheHitRate = cacheComponents.length > 0
            ? Math.max(...cacheComponents.map(c => 80)) // Base cache hit rate
            : 0;

        if (dbComponents.length > 0) {
            const dbLatency = Math.max(...dbComponents.map(c => c.metrics.latency));
            totalLatency += dbLatency * (1 - cacheHitRate / 100);
        }

        // Calculate throughput (successful requests)
        const avgErrorRate = components.reduce((sum, c) => sum + c.metrics.errorRate, 0) / components.length;
        const throughput = requestsPerSecond * (1 - avgErrorRate / 100);

        // Calculate availability
        const failedComponents = components.filter(c => c.status === 'failed').length;
        const availability = failedComponents > 0
            ? Math.max(0, 100 - failedComponents * 20)
            : 100 - (components.filter(c => c.status === 'critical').length * 5);

        return {
            totalLatency,
            throughput,
            errorRate: avgErrorRate,
            availability: Math.max(0, Math.min(100, availability)),
            cacheHitRate: cacheHitRate,
        };
    }

    // Calculate costs using real cloud pricing
    private calculateCosts(): CostEstimate {
        const { components, requestsPerSecond } = this.state;

        // Convert components to the format expected by cloud pricing service
        const componentInputs = components.map(c => ({
            type: c.type,
            config: c.config,
            requestsPerSecond,
        }));

        // Use real cloud pricing
        const pricing = calculateInfrastructureCost(componentInputs, {
            provider: this.cloudProvider,
            region: 'us-east-1',
            currency: 'USD',
            monthlyHours: 730,
        });

        return pricing.totalCost;
    }

    // Set cloud provider for cost calculation
    setCloudProvider(provider: CloudProvider): void {
        this.cloudProvider = provider;
        this.simulate(); // Recalculate with new provider
    }

    // Get current cloud provider
    getCloudProvider(): CloudProvider {
        return this.cloudProvider;
    }

    // Compare costs across all providers
    compareAllProviders(): { aws: CostEstimate; gcp: CostEstimate; azure: CostEstimate } {
        const { components, requestsPerSecond } = this.state;

        const componentInputs = components.map(c => ({
            type: c.type,
            config: c.config,
            requestsPerSecond,
        }));

        return compareCloudProviders(componentInputs);
    }

    // Get current state
    getState(): ExtendedSimulationState {
        return { ...this.state };
    }

    // Reset simulation
    reset(): void {
        this.state = {
            users: 100,
            requestsPerSecond: 10,
            components: [],
            globalMetrics: {
                totalLatency: 0,
                throughput: 0,
                errorRate: 0,
                availability: 100,
                cacheHitRate: 0,
            },
            bottlenecks: [],
            estimatedCost: {
                compute: 0,
                database: 0,
                cache: 0,
                network: 0,
                storage: 0,
                total: 0,
                monthlyEstimate: 0,
            },
            timestamp: Date.now(),
            // Reset advanced features
            geographicRegions: [...GEOGRAPHIC_REGIONS],
            activeFailures: [],
            activeChaosScenarios: [],
            geographicLatency: this.calculateGeographicLatency(),
        };
    }

    // ========== Geographic Latency Methods ==========

    // Get geographic latency for all regions
    getGeographicLatency(): Record<string, number> {
        return this.state.geographicLatency;
    }

    // Calculate weighted average latency based on user distribution
    getWeightedAverageLatency(): number {
        let totalLatency = 0;
        let totalWeight = 0;

        for (const region of this.state.geographicRegions) {
            const latency = this.state.geographicLatency[region.id] || region.latency;
            totalLatency += latency * (region.users / 100);
            totalWeight += region.users;
        }

        return totalWeight > 0 ? totalLatency / (totalWeight / 100) : 0;
    }

    // Update user distribution across regions
    setUserDistribution(distribution: Record<string, number>): void {
        for (const [regionId, users] of Object.entries(distribution)) {
            const region = this.state.geographicRegions.find(r => r.id === regionId);
            if (region) {
                region.users = users;
            }
        }
        this.simulate();
    }

    // ========== Chaos Engineering Methods ==========

    // Get available chaos scenarios
    getChaosScenarios(): ChaosScenario[] {
        return CHAOS_SCENARIOS;
    }

    // Activate a chaos scenario
    activateChaosScenario(scenarioId: string): boolean {
        const scenario = CHAOS_SCENARIOS.find(s => s.id === scenarioId);
        if (!scenario) return false;

        // Check if already active
        if (this.state.activeChaosScenarios.find(s => s.id === scenarioId)) {
            return false;
        }

        // Activate all failures in the scenario
        const activatedFailures = scenario.failures.map(f => ({
            ...f,
            isActive: true,
            triggeredAt: Date.now(),
        }));

        this.state.activeChaosScenarios.push(scenario);
        this.state.activeFailures.push(...activatedFailures);

        // Trigger simulation update
        this.simulate();
        return true;
    }

    // Deactivate a chaos scenario
    deactivateChaosScenario(scenarioId: string): boolean {
        const scenarioIndex = this.state.activeChaosScenarios.findIndex(s => s.id === scenarioId);
        if (scenarioIndex === -1) return false;

        const scenario = this.state.activeChaosScenarios[scenarioIndex];

        // Remove associated failures
        const failureIds = new Set(scenario.failures.map(f => f.id));
        this.state.activeFailures = this.state.activeFailures.filter(f => !failureIds.has(f.id));

        // Remove scenario
        this.state.activeChaosScenarios.splice(scenarioIndex, 1);

        // Trigger simulation update
        this.simulate();
        return true;
    }

    // Get active chaos scenarios
    getActiveChaosScenarios(): ChaosScenario[] {
        return this.state.activeChaosScenarios;
    }

    // Get active failures
    getActiveFailures(): FailureInjection[] {
        return this.state.activeFailures;
    }

    // Calculate impact of active failures on metrics
    private calculateFailureImpact(): { errorRateIncrease: number; latencyIncrease: number; availabilityDecrease: number } {
        let errorRateIncrease = 0;
        let latencyIncrease = 0;
        let availabilityDecrease = 0;

        for (const failure of this.state.activeFailures) {
            const intensity = failure.intensity / 100;
            const duration = failure.duration;
            const elapsed = failure.triggeredAt ? (Date.now() - failure.triggeredAt) / 1000 : 0;

            // Only apply impact if within duration
            if (elapsed < duration) {
                switch (failure.type) {
                    case 'server-crash':
                    case 'database-failure':
                    case 'cache-failure':
                        errorRateIncrease += 100 * intensity;
                        availabilityDecrease += 100 * intensity;
                        break;
                    case 'server-restart':
                        errorRateIncrease += 50 * intensity;
                        latencyIncrease += 100 * intensity;
                        break;
                    case 'network-partition':
                        errorRateIncrease += 30 * intensity;
                        latencyIncrease += 200 * intensity;
                        break;
                    case 'latency-spike':
                        latencyIncrease += 500 * intensity;
                        break;
                    case 'ddos-attack':
                        errorRateIncrease += 95 * intensity;
                        availabilityDecrease += 90 * intensity;
                        break;
                    case 'disk-full':
                        errorRateIncrease += 40 * intensity;
                        latencyIncrease += 100 * intensity;
                        break;
                    case 'memory-leak':
                        latencyIncrease += 50 * intensity;
                        // Gradually increases over time
                        availabilityDecrease += (elapsed / duration) * 30 * intensity;
                        break;
                }
            }
        }

        return {
            errorRateIncrease: Math.min(100, errorRateIncrease),
            latencyIncrease,
            availabilityDecrease: Math.min(100, availabilityDecrease),
        };
    }

    // Get failure events history
    getFailureEvents(): FailureEvent[] {
        // This would be stored in a real implementation
        return [];
    }
}

// Helper function to create a default component
export function createComponent(
    type: ComponentType,
    position: { x: number; y: number },
    config?: any
): InfrastructureComponent {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
        id,
        type,
        name: getDefaultName(type),
        position,
        config: config || getDefaultConfig(type),
        metrics: {
            cpu: 0,
            memory: 0,
            connections: 0,
            requestsPerSecond: 0,
            latency: 0,
            errorRate: 0,
        },
        status: 'healthy',
        connections: [],
    };
}

function getDefaultName(type: ComponentType): string {
    const names: Record<ComponentType, string> = {
        server: 'App Server',
        database: 'Database',
        cache: 'Redis Cache',
        loadbalancer: 'Load Balancer',
        cdn: 'CDN',
        queue: 'Message Queue',
        storage: 'Object Storage',
        // Advanced components
        shard: 'Database Shard',
        replica: 'Read Replica',
        'edge-location': 'Edge Location',
        origin: 'Origin Server',
    };
    return names[type];
}

function getDefaultConfig(type: ComponentType): any {
    const configs: Record<ComponentType, any> = {
        server: { instances: 1, cpuCores: 2, memoryGB: 4 },
        database: { databaseType: 'postgres', storageGB: 100, readReplicas: 0 },
        cache: { cacheSizeGB: 1, evictionPolicy: 'lru' },
        loadbalancer: { algorithm: 'round-robin' },
        cdn: { edgeLocations: 10 },
        queue: { queueType: 'rabbitmq', partitions: 1 },
        storage: { storageType: 's3', redundancy: 'standard' },
        // Advanced components
        shard: { databaseType: 'postgres', storageGB: 100, readReplicas: 0, shardKey: 'user_id' },
        replica: { databaseType: 'postgres', storageGB: 50, readReplicas: 0 },
        'edge-location': { edgeLocations: 1, region: 'us-west-2' },
        origin: { instances: 1, cpuCores: 2, memoryGB: 4 },
    };
    return configs[type];
}

// Preset architectures
export const PRESET_ARCHITECTURES = {
    simple: {
        name: 'Simple Architecture',
        description: 'Basic single-server setup',
        components: [
            { type: 'server' as ComponentType, position: { x: 300, y: 200 } },
            { type: 'database' as ComponentType, position: { x: 500, y: 200 } },
        ],
        connections: [['server-0', 'database-0']],
    },
    scalable: {
        name: 'Scalable Architecture',
        description: 'Load-balanced with cache',
        components: [
            { type: 'loadbalancer' as ComponentType, position: { x: 150, y: 200 } },
            { type: 'server' as ComponentType, position: { x: 300, y: 150 } },
            { type: 'server' as ComponentType, position: { x: 300, y: 250 } },
            { type: 'cache' as ComponentType, position: { x: 450, y: 100 } },
            { type: 'database' as ComponentType, position: { x: 500, y: 200 } },
        ],
        connections: [
            ['loadbalancer-0', 'server-0'],
            ['loadbalancer-0', 'server-1'],
            ['server-0', 'cache-0'],
            ['server-1', 'cache-0'],
            ['server-0', 'database-0'],
            ['server-1', 'database-0'],
        ],
    },
    enterprise: {
        name: 'Enterprise Architecture',
        description: 'Full production setup with CDN',
        components: [
            { type: 'cdn' as ComponentType, position: { x: 100, y: 200 } },
            { type: 'loadbalancer' as ComponentType, position: { x: 250, y: 200 } },
            { type: 'server' as ComponentType, position: { x: 400, y: 150 } },
            { type: 'server' as ComponentType, position: { x: 400, y: 250 } },
            { type: 'cache' as ComponentType, position: { x: 550, y: 100 } },
            { type: 'database' as ComponentType, position: { x: 600, y: 200 } },
            { type: 'queue' as ComponentType, position: { x: 550, y: 300 } },
            { type: 'storage' as ComponentType, position: { x: 700, y: 200 } },
        ],
        connections: [
            ['cdn-0', 'loadbalancer-0'],
            ['loadbalancer-0', 'server-0'],
            ['loadbalancer-0', 'server-1'],
            ['server-0', 'cache-0'],
            ['server-1', 'cache-0'],
            ['server-0', 'database-0'],
            ['server-1', 'database-0'],
            ['server-0', 'queue-0'],
            ['server-1', 'queue-0'],
            ['server-0', 'storage-0'],
            ['server-1', 'storage-0'],
        ],
    },
    // Advanced scenarios
    sharded: {
        name: 'Sharded Database',
        description: 'Horizontal scaling with database sharding',
        components: [
            { type: 'loadbalancer' as ComponentType, position: { x: 100, y: 200 } },
            { type: 'server' as ComponentType, position: { x: 250, y: 150 } },
            { type: 'server' as ComponentType, position: { x: 250, y: 250 } },
            { type: 'shard' as ComponentType, position: { x: 450, y: 100 } },
            { type: 'shard' as ComponentType, position: { x: 450, y: 200 } },
            { type: 'shard' as ComponentType, position: { x: 450, y: 300 } },
            { type: 'cache' as ComponentType, position: { x: 350, y: 200 } },
        ],
        connections: [
            ['loadbalancer-0', 'server-0'],
            ['loadbalancer-0', 'server-1'],
            ['server-0', 'cache-0'],
            ['server-1', 'cache-0'],
            ['server-0', 'shard-0'],
            ['server-0', 'shard-1'],
            ['server-1', 'shard-1'],
            ['server-1', 'shard-2'],
        ],
    },
    multiRegion: {
        name: 'Multi-Region Deployment',
        description: 'Global distribution with edge locations',
        components: [
            { type: 'cdn' as ComponentType, position: { x: 50, y: 200 } },
            { type: 'edge-location' as ComponentType, position: { x: 150, y: 100 } },
            { type: 'edge-location' as ComponentType, position: { x: 150, y: 200 } },
            { type: 'edge-location' as ComponentType, position: { x: 150, y: 300 } },
            { type: 'loadbalancer' as ComponentType, position: { x: 280, y: 200 } },
            { type: 'server' as ComponentType, position: { x: 400, y: 150 } },
            { type: 'server' as ComponentType, position: { x: 400, y: 250 } },
            { type: 'origin' as ComponentType, position: { x: 550, y: 150 } },
            { type: 'origin' as ComponentType, position: { x: 550, y: 250 } },
            { type: 'database' as ComponentType, position: { x: 680, y: 200 } },
            { type: 'cache' as ComponentType, position: { x: 600, y: 100 } },
        ],
        connections: [
            ['cdn-0', 'edge-location-0'],
            ['cdn-0', 'edge-location-1'],
            ['cdn-0', 'edge-location-2'],
            ['edge-location-0', 'loadbalancer-0'],
            ['edge-location-1', 'loadbalancer-0'],
            ['edge-location-2', 'loadbalancer-0'],
            ['loadbalancer-0', 'server-0'],
            ['loadbalancer-0', 'server-1'],
            ['server-0', 'origin-0'],
            ['server-1', 'origin-1'],
            ['origin-0', 'cache-0'],
            ['origin-1', 'cache-0'],
            ['origin-0', 'database-0'],
            ['origin-1', 'database-0'],
        ],
    },
    cacheWarming: {
        name: 'Cache Warming Strategy',
        description: 'Optimized caching with preloading',
        components: [
            { type: 'loadbalancer' as ComponentType, position: { x: 100, y: 200 } },
            { type: 'server' as ComponentType, position: { x: 250, y: 150 } },
            { type: 'server' as ComponentType, position: { x: 250, y: 250 } },
            { type: 'cache' as ComponentType, position: { x: 400, y: 100 }, config: { cacheSizeGB: 4, preloadKeys: 10000 } },
            { type: 'database' as ComponentType, position: { x: 450, y: 200 } },
            { type: 'queue' as ComponentType, position: { x: 400, y: 300 } },
        ],
        connections: [
            ['loadbalancer-0', 'server-0'],
            ['loadbalancer-0', 'server-1'],
            ['server-0', 'cache-0'],
            ['server-1', 'cache-0'],
            ['server-0', 'database-0'],
            ['server-1', 'database-0'],
            ['server-0', 'queue-0'],
            ['server-1', 'queue-0'],
        ],
    },
};