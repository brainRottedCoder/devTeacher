"use client";

import {
    GlobalMetrics,
    CostEstimate,
    Bottleneck,
    InfrastructureComponent,
    COMPONENT_INFO,
} from "@/lib/simulation/types";

interface MetricsPanelProps {
    globalMetrics: GlobalMetrics;
    estimatedCost: CostEstimate;
    bottlenecks: Bottleneck[];
    selectedComponent: InfrastructureComponent | null;
    users: number;
    requestsPerSecond: number;
}

export function MetricsPanel({
    globalMetrics,
    estimatedCost,
    bottlenecks,
    selectedComponent,
    users,
    requestsPerSecond,
}: MetricsPanelProps) {
    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
                <h2 className="text-lg font-bold text-white">System Metrics</h2>
                <p className="text-sm text-gray-400">Real-time performance data</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* User Load */}
                <div className="glass-card p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Current Load</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            Live
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gradient">
                            {users.toLocaleString()}
                        </span>
                        <span className="text-gray-400">users</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        {requestsPerSecond.toFixed(1)} requests/second
                    </p>
                </div>

                {/* Global Metrics */}
                <div className="glass-card p-4">
                    <h3 className="text-sm font-medium text-white mb-3">Performance</h3>
                    <div className="space-y-3">
                        <MetricBar
                            label="Latency"
                            value={globalMetrics.totalLatency}
                            unit="ms"
                            max={500}
                            color="cyan"
                        />
                        <MetricBar
                            label="Throughput"
                            value={globalMetrics.throughput}
                            unit="req/s"
                            max={requestsPerSecond}
                            color="purple"
                        />
                        <MetricBar
                            label="Error Rate"
                            value={globalMetrics.errorRate}
                            unit="%"
                            max={100}
                            color="red"
                            inverse
                        />
                        <MetricBar
                            label="Availability"
                            value={globalMetrics.availability}
                            unit="%"
                            max={100}
                            color="green"
                        />
                    </div>
                </div>

                {/* Cost Estimation */}
                <div className="glass-card p-4">
                    <h3 className="text-sm font-medium text-white mb-3">Cost Estimation</h3>
                    <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-2xl font-bold text-gradient">
                            ${estimatedCost.total.toFixed(2)}
                        </span>
                        <span className="text-gray-400">/hour</span>
                    </div>
                    <div className="text-sm text-gray-400 mb-3">
                        ~${estimatedCost.monthlyEstimate.toFixed(0)}/month
                    </div>
                    <div className="space-y-2 text-xs">
                        <CostRow label="Compute" value={estimatedCost.compute} color="purple" />
                        <CostRow label="Database" value={estimatedCost.database} color="blue" />
                        <CostRow label="Cache" value={estimatedCost.cache} color="red" />
                        <CostRow label="Network" value={estimatedCost.network} color="cyan" />
                        <CostRow label="Storage" value={estimatedCost.storage} color="yellow" />
                    </div>
                </div>

                {/* Bottlenecks */}
                {bottlenecks.length > 0 && (
                    <div className="glass-card p-4 border-red-500/20">
                        <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            Bottlenecks Detected
                        </h3>
                        <div className="space-y-2">
                            {bottlenecks.map((bottleneck, index) => (
                                <div
                                    key={index}
                                    className={`p-2 rounded-lg text-xs ${bottleneck.severity === "critical"
                                            ? "bg-red-500/10 border border-red-500/20"
                                            : "bg-yellow-500/10 border border-yellow-500/20"
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span
                                            className={`font-medium ${bottleneck.severity === "critical"
                                                    ? "text-red-400"
                                                    : "text-yellow-400"
                                                }`}
                                        >
                                            {bottleneck.componentName}
                                        </span>
                                        <span
                                            className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${bottleneck.severity === "critical"
                                                    ? "bg-red-500/20 text-red-400"
                                                    : "bg-yellow-500/20 text-yellow-400"
                                                }`}
                                        >
                                            {bottleneck.type}
                                        </span>
                                    </div>
                                    <p className="text-gray-400">{bottleneck.message}</p>
                                    <p className="text-gray-500 mt-1 italic">
                                        💡 {bottleneck.suggestion}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Selected Component Details */}
                {selectedComponent && (
                    <div className="glass-card p-4">
                        <h3 className="text-sm font-medium text-white mb-3">
                            {COMPONENT_INFO[selectedComponent.type].icon} {selectedComponent.name}
                        </h3>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Status</span>
                                <StatusBadge status={selectedComponent.status} />
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">CPU</span>
                                <span
                                    className={
                                        selectedComponent.metrics.cpu > 80
                                            ? "text-red-400"
                                            : selectedComponent.metrics.cpu > 60
                                                ? "text-yellow-400"
                                                : "text-green-400"
                                    }
                                >
                                    {selectedComponent.metrics.cpu.toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Memory</span>
                                <span
                                    className={
                                        selectedComponent.metrics.memory > 80
                                            ? "text-red-400"
                                            : selectedComponent.metrics.memory > 60
                                                ? "text-yellow-400"
                                                : "text-green-400"
                                    }
                                >
                                    {selectedComponent.metrics.memory.toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Latency</span>
                                <span className="text-cyan-400">
                                    {selectedComponent.metrics.latency.toFixed(1)}ms
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Connections</span>
                                <span className="text-purple-400">
                                    {selectedComponent.metrics.connections.toLocaleString()}
                                </span>
                            </div>
                            {selectedComponent.metrics.errorRate > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Error Rate</span>
                                    <span className="text-red-400">
                                        {selectedComponent.metrics.errorRate.toFixed(2)}%
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function MetricBar({
    label,
    value,
    unit,
    max,
    color,
    inverse = false,
}: {
    label: string;
    value: number;
    unit: string;
    max: number;
    color: string;
    inverse?: boolean;
}) {
    const percentage = Math.min(100, (value / max) * 100);
    const colorClasses: Record<string, string> = {
        cyan: "from-cyan-500 to-blue-500",
        purple: "from-purple-500 to-pink-500",
        red: "from-red-500 to-orange-500",
        green: "from-green-500 to-emerald-500",
    };

    const isWarning = inverse ? value > 5 : value > 80;
    const isCritical = inverse ? value > 10 : value > 95;

    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">{label}</span>
                <span
                    className={`text-xs font-medium ${isCritical
                            ? "text-red-400"
                            : isWarning
                                ? "text-yellow-400"
                                : "text-white"
                        }`}
                >
                    {typeof value === "number" && value % 1 !== 0
                        ? value.toFixed(1)
                        : value}
                    {unit}
                </span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                    className={`h-full bg-gradient-to-r ${colorClasses[color]} rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

function CostRow({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color: string;
}) {
    const dotColors: Record<string, string> = {
        purple: "bg-purple-500",
        blue: "bg-blue-500",
        red: "bg-red-500",
        cyan: "bg-cyan-500",
        yellow: "bg-yellow-500",
    };

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${dotColors[color]}`} />
                <span className="text-gray-400">{label}</span>
            </div>
            <span className="text-white">${value.toFixed(3)}/hr</span>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<
        string,
        { bg: string; text: string; border: string }
    > = {
        healthy: {
            bg: "bg-green-500/10",
            text: "text-green-400",
            border: "border-green-500/20",
        },
        warning: {
            bg: "bg-yellow-500/10",
            text: "text-yellow-400",
            border: "border-yellow-500/20",
        },
        critical: {
            bg: "bg-orange-500/10",
            text: "text-orange-400",
            border: "border-orange-500/20",
        },
        failed: {
            bg: "bg-red-500/10",
            text: "text-red-400",
            border: "border-red-500/20",
        },
    };

    const style = config[status] || config.healthy;

    return (
        <span
            className={`px-2 py-0.5 rounded-full text-[10px] uppercase ${style.bg} ${style.text} border ${style.border}`}
        >
            {status}
        </span>
    );
}