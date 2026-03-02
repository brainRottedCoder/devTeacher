"use client";

import { useState, useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
import {
    Activity,
    Users,
    Zap,
    AlertTriangle,
    DollarSign,
    TrendingUp,
    CheckCircle,
    XCircle,
    X,
    Play
} from 'lucide-react';
import { runScalabilityTest, TRAFFIC_SCALES, formatNumber, formatCurrency } from '@/lib/designer/scalability-mapper';
import { SimulationState, GlobalMetrics, Bottleneck, CostEstimate } from '@/lib/simulation/types';

interface ScalabilityTestPanelProps {
    nodes: Node[];
    edges: Edge[];
    onClose: () => void;
}

export function ScalabilityTestPanel({ nodes, edges, onClose }: ScalabilityTestPanelProps) {
    const [userCount, setUserCount] = useState<number>(1000);
    const [simulation, setSimulation] = useState<SimulationState | null>(null);
    const [isRunning, setIsRunning] = useState(false);

    const handleRunTest = useCallback(() => {
        setIsRunning(true);

        // Simulate calculation delay
        setTimeout(() => {
            const result = runScalabilityTest(nodes, edges, userCount);
            setSimulation(result);
            setIsRunning(false);
        }, 500);
    }, [nodes, edges, userCount]);

    const handleScaleChange = (value: number) => {
        setUserCount(value);
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0a0f]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-emerald to-accent-cyan flex items-center justify-center">
                        <Activity className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-heading font-semibold text-white">Scalability Test</h3>
                        <p className="text-xs text-slate-500">Test your architecture under load</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-500 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Traffic Selector */}
            <div className="p-4 border-b border-white/[0.06]">
                <label className="text-xs font-medium text-slate-400 mb-2 block">
                    Simulate User Traffic
                </label>
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                    {TRAFFIC_SCALES.map((scale) => (
                        <button
                            key={scale.value}
                            onClick={() => handleScaleChange(scale.value)}
                            className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${userCount === scale.value
                                ? 'bg-accent-emerald text-white shadow-lg shadow-accent-emerald/20'
                                : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.06] hover:text-white'
                                }`}
                        >
                            {scale.label}
                        </button>
                    ))}
                </div>

                {/* Custom slider */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Custom:</span>
                        <span className="text-sm font-semibold text-accent-emerald">
                            {formatNumber(userCount)} users
                        </span>
                    </div>
                    <input
                        type="range"
                        min={100}
                        max={100000000}
                        step={100}
                        value={userCount}
                        onChange={(e) => handleScaleChange(parseInt(e.target.value))}
                        className="w-full h-2 bg-white/[0.06] rounded-lg appearance-none cursor-pointer accent-accent-emerald"
                    />
                </div>

                <button
                    onClick={handleRunTest}
                    disabled={isRunning || nodes.length === 0}
                    className="w-full mt-4 px-4 py-2.5 rounded-lg bg-gradient-to-r from-accent-emerald to-accent-cyan text-white text-xs font-heading font-semibold shadow-lg shadow-accent-emerald/20 hover:shadow-accent-emerald/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isRunning ? (
                        <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Running Test...
                        </>
                    ) : (
                        <>
                            <Play className="w-3.5 h-3.5" />
                            Run Scalability Test
                        </>
                    )}
                </button>

                {nodes.length === 0 && (
                    <p className="text-xs text-amber-500 mt-2 text-center">
                        Add components to your architecture first
                    </p>
                )}
            </div>

            {/* Results */}
            {simulation && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Global Metrics */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp className="w-3 h-3" />
                            Performance Metrics
                        </h4>

                        <div className="grid grid-cols-2 gap-2">
                            <MetricCard
                                icon={<Activity className="w-3.5 h-3.5" />}
                                label="Latency"
                                value={`${simulation.globalMetrics.totalLatency.toFixed(0)}ms`}
                                status={simulation.globalMetrics.totalLatency > 200 ? 'warning' : 'good'}
                            />
                            <MetricCard
                                icon={<Zap className="w-3.5 h-3.5" />}
                                label="Throughput"
                                value={`${formatNumber(simulation.globalMetrics.throughput)}/s`}
                                status="good"
                            />
                            <MetricCard
                                icon={<AlertTriangle className="w-3.5 h-3.5" />}
                                label="Error Rate"
                                value={`${simulation.globalMetrics.errorRate.toFixed(1)}%`}
                                status={simulation.globalMetrics.errorRate > 1 ? 'warning' : 'good'}
                            />
                            <MetricCard
                                icon={<CheckCircle className="w-3.5 h-3.5" />}
                                label="Availability"
                                value={`${simulation.globalMetrics.availability.toFixed(1)}%`}
                                status={simulation.globalMetrics.availability < 99 ? 'warning' : 'good'}
                            />
                        </div>
                    </div>

                    {/* Cost Estimate */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <DollarSign className="w-3 h-3" />
                            Estimated Monthly Cost
                        </h4>

                        <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.06]">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-500">Total Estimate</span>
                                <span className="text-lg font-bold text-accent-emerald">
                                    {formatCurrency(simulation.estimatedCost.monthlyEstimate)}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Compute</span>
                                    <span className="text-white">${simulation.estimatedCost.compute.toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Database</span>
                                    <span className="text-white">${simulation.estimatedCost.database.toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Cache</span>
                                    <span className="text-white">${simulation.estimatedCost.cache.toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Network</span>
                                    <span className="text-white">${simulation.estimatedCost.network.toFixed(0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottlenecks */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <AlertTriangle className="w-3 h-3" />
                            Bottlenecks & Issues
                        </h4>

                        {simulation.bottlenecks.length === 0 ? (
                            <div className="bg-accent-emerald/10 rounded-lg p-3 border border-accent-emerald/20 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-accent-emerald flex-shrink-0" />
                                <p className="text-xs text-accent-emerald">
                                    No bottlenecks detected! Your architecture handles {formatNumber(userCount)} users well.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {simulation.bottlenecks.map((bottleneck, index) => (
                                    <BottleneckCard key={index} bottleneck={bottleneck} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Component Details */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Users className="w-3 h-3" />
                            Component Status
                        </h4>

                        <div className="space-y-2">
                            {simulation.components.map((component) => (
                                <ComponentStatusCard key={component.id} component={component} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function MetricCard({
    icon,
    label,
    value,
    status
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    status: 'good' | 'warning' | 'critical';
}) {
    const statusColors = {
        good: 'text-accent-emerald',
        warning: 'text-amber-500',
        critical: 'text-red-500',
    };

    return (
        <div className="bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.06]">
            <div className="flex items-center gap-1.5 mb-1">
                <span className={`${statusColors[status]}`}>{icon}</span>
                <span className="text-xs text-slate-500">{label}</span>
            </div>
            <p className={`text-sm font-semibold ${statusColors[status]}`}>{value}</p>
        </div>
    );
}

function BottleneckCard({ bottleneck }: { bottleneck: Bottleneck }) {
    const isCritical = bottleneck.severity === 'critical';

    return (
        <div className={`rounded-lg p-3 border ${isCritical
            ? 'bg-red-500/10 border-red-500/20'
            : 'bg-amber-500/10 border-amber-500/20'
            }`}>
            <div className="flex items-start gap-2">
                {isCritical ? (
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${isCritical ? 'text-red-400' : 'text-amber-400'}`}>
                        {bottleneck.componentName}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{bottleneck.message}</p>
                    <p className="text-xs text-slate-500 mt-1 italic">{bottleneck.suggestion}</p>
                </div>
            </div>
        </div>
    );
}

function ComponentStatusCard({ component }: { component: any }) {
    const statusColors = {
        healthy: 'bg-accent-emerald',
        warning: 'bg-amber-500',
        critical: 'bg-red-500',
        failed: 'bg-red-700',
    };

    return (
        <div className="bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${statusColors[component.status as keyof typeof statusColors]}`} />
                <span className="text-xs text-white truncate max-w-[120px]">{component.name}</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
                <div className="text-right">
                    <span className="text-slate-500">CPU</span>
                    <span className={`ml-1.5 font-medium ${component.metrics.cpu > 80 ? 'text-amber-500' : 'text-white'
                        }`}>
                        {component.metrics.cpu.toFixed(0)}%
                    </span>
                </div>
                <div className="text-right">
                    <span className="text-slate-500">Latency</span>
                    <span className={`ml-1.5 font-medium ${component.metrics.latency > 100 ? 'text-amber-500' : 'text-white'
                        }`}>
                        {component.metrics.latency.toFixed(0)}ms
                    </span>
                </div>
            </div>
        </div>
    );
}

export default ScalabilityTestPanel;
