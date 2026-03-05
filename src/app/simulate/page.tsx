"use client";

import { useState, useCallback, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { SimulationCanvas } from "@/components/simulation/SimulationCanvas";
import { MetricsPanel } from "@/components/simulation/MetricsPanel";
import { UserLoadSlider } from "@/components/simulation/UserLoadSlider";
import {
    SimulationEngine,
    createComponent,
    PRESET_ARCHITECTURES,
} from "@/lib/simulation/engine";
import {
    InfrastructureComponent,
    ComponentType,
    SimulationState,
} from "@/lib/simulation/types";
import { Zap } from "lucide-react";

export default function SimulatorPage() {
    const [engine] = useState(() => new SimulationEngine());
    const [state, setState] = useState<SimulationState>(() => engine.getState());
    const [selectedComponent, setSelectedComponent] =
        useState<InfrastructureComponent | null>(null);
    const [selectedPreset, setSelectedPreset] = useState<string>("simple");

    // Initialize with preset
    useEffect(() => {
        loadPreset("simple");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadPreset = useCallback(
        (presetKey: string) => {
            const preset = PRESET_ARCHITECTURES[presetKey as keyof typeof PRESET_ARCHITECTURES];
            if (!preset) return;

            // Reset engine
            engine.reset();

            // Add components and store their IDs
            const componentIds: string[] = [];
            preset.components.forEach((comp, index) => {
                const component = createComponent(comp.type, comp.position);
                component.name = `${component.name} ${index + 1}`;
                engine.addComponent(component);
                componentIds.push(component.id);
            });

            // Add connections using numeric indices from the preset
            preset.connections.forEach(([fromKey, toKey]) => {
                // Parse the index from strings like 'server-0', 'database-0'
                const fromIndex = parseInt(fromKey.split('-')[1] || '0');
                const toIndex = parseInt(toKey.split('-')[1] || '0');

                if (componentIds[fromIndex] && componentIds[toIndex]) {
                    engine.connectComponents(componentIds[fromIndex], componentIds[toIndex]);
                }
            });

            setSelectedPreset(presetKey);
            setSelectedComponent(null);
            setState(engine.setUsers(state.users));
        },
        [engine, state.users]
    );

    const handleUsersChange = useCallback(
        (users: number) => {
            setState(engine.setUsers(users));
        },
        [engine]
    );

    const handleAddComponent = useCallback(
        (type: ComponentType, position: { x: number; y: number }) => {
            const component = createComponent(type, position);
            engine.addComponent(component);
            setState(engine.getState());
        },
        [engine]
    );

    const handleMoveComponent = useCallback(
        (id: string, position: { x: number; y: number }) => {
            engine.updateComponent(id, { position });
            setState(engine.getState());
        },
        [engine]
    );

    const handleDeleteComponent = useCallback(
        (id: string) => {
            engine.removeComponent(id);
            if (selectedComponent?.id === id) {
                setSelectedComponent(null);
            }
            setState(engine.getState());
        },
        [engine, selectedComponent]
    );

    const handleSelectComponent = useCallback(
        (component: InfrastructureComponent | null) => {
            setSelectedComponent(component);
        },
        []
    );

    return (
        <MainLayout>
            <div className="min-h-screen relative">
                <div className="relative z-10">
                    {/* Header */}
                    <div className="border-b border-white/[0.04] bg-surface-deep/50 backdrop-blur-sm">
                        <div className="max-w-full mx-auto px-4 sm:px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-indigo flex items-center justify-center shadow-lg shadow-accent-cyan/20">
                                        <Zap className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-heading font-bold text-white tracking-tight">
                                            Scalability <span className="text-gradient-cool">Simulator</span>
                                        </h1>
                                        <p className="text-xs text-slate-500">
                                            Learn how systems scale from 100 to 1M users
                                        </p>
                                    </div>
                                </div>

                                {/* Preset selector */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500 hidden sm:inline">Architecture:</span>
                                    <div className="flex gap-1">
                                        {Object.entries(PRESET_ARCHITECTURES).map(([key, preset]) => (
                                            <button
                                                key={key}
                                                onClick={() => loadPreset(key)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-heading font-medium transition-all ${selectedPreset === key
                                                    ? "bg-gradient-to-r from-accent-violet to-accent-indigo text-white shadow-lg shadow-accent-violet/20"
                                                    : "bg-white/[0.04] text-slate-500 hover:bg-white/[0.06] hover:text-white border border-white/[0.06]"
                                                    }`}
                                            >
                                                {preset.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main content - Full screen layout */}
                    <div className="flex h-[calc(100vh-85px)] overflow-hidden">
                        {/* Left sidebar - Controls */}
                        <div className="w-[320px] lg:w-[340px] border-r border-white/[0.08] bg-surface-deep/80 backdrop-blur-xl shadow-[4px_0_24px_rgba(0,0,0,0.5)] z-10 flex flex-col overflow-hidden flex-shrink-0">
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                <div className="bg-white/[0.02] p-4 rounded-xl border border-white/[0.05] shadow-inner">
                                    <UserLoadSlider users={state.users} onChange={handleUsersChange} />
                                </div>

                                {/* Instructions */}
                                <div className="glass-card p-4">
                                    <h3 className="text-xs font-heading font-semibold text-white mb-3">
                                        How to Use
                                    </h3>
                                    <ul className="space-y-2 text-[11px] text-slate-500">
                                        <li className="flex items-start gap-2">
                                            <span className="text-accent-violet font-heading font-bold">1.</span>
                                            <span>Right-click on canvas to add components</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-accent-cyan font-heading font-bold">2.</span>
                                            <span>Drag components to reposition them</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-accent-rose font-heading font-bold">3.</span>
                                            <span>Click a component to see details</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-accent-amber font-heading font-bold">4.</span>
                                            <span>Use the slider to simulate user load</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-accent-emerald font-heading font-bold">5.</span>
                                            <span>Watch for bottlenecks as load increases</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* Component legend */}
                                <div className="bg-white/[0.02] p-4 rounded-xl border border-white/[0.05] shadow-inner">
                                    <h3 className="text-xs font-heading font-semibold text-white mb-3">
                                        Component Types
                                    </h3>
                                    <div className="space-y-2.5">
                                        {Object.entries({
                                            server: { icon: "🖥️", name: "Server", desc: "Handles requests" },
                                            database: { icon: "🗄️", name: "Database", desc: "Stores data" },
                                            cache: { icon: "⚡", name: "Cache", desc: "Fast access layer" },
                                            loadbalancer: { icon: "⚖️", name: "Load Balancer", desc: "Distributes traffic" },
                                            cdn: { icon: "🌍", name: "CDN", desc: "Edge delivery" },
                                        }).map(([key, info]) => (
                                            <div
                                                key={key}
                                                className="flex items-center gap-2.5 text-[11px]"
                                            >
                                                <span className="text-base">{info.icon}</span>
                                                <div>
                                                    <span className="text-white font-medium">{info.name}</span>
                                                    <span className="text-slate-600 ml-1">— {info.desc}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Center - Canvas */}
                        <div className="flex-1 relative overflow-hidden">
                            <SimulationCanvas
                                components={state.components}
                                selectedComponent={selectedComponent}
                                onSelectComponent={handleSelectComponent}
                                onAddComponent={handleAddComponent}
                                onMoveComponent={handleMoveComponent}
                                onDeleteComponent={handleDeleteComponent}
                            />

                            {/* Right sidebar - Metrics */}
                            <div className="w-[340px] lg:w-[360px] border-l border-white/[0.08] bg-surface-deep/80 backdrop-blur-xl shadow-[-4px_0_24px_rgba(0,0,0,0.5)] z-10 flex flex-col overflow-hidden flex-shrink-0 absolute right-0 top-0 bottom-0">
                                <div className="flex-1 overflow-y-auto p-4">
                                    <MetricsPanel
                                        globalMetrics={state.globalMetrics}
                                        estimatedCost={state.estimatedCost}
                                        bottlenecks={state.bottlenecks}
                                        selectedComponent={selectedComponent}
                                        users={state.users}
                                        requestsPerSecond={state.requestsPerSecond}
                                    />
                                </div>
                            
                                {/* Learning insights */}
                                <div className="p-4 border-t border-white/[0.08] bg-white/[0.01]">
                                    <h3 className="text-sm font-heading font-bold text-white mb-3 flex items-center gap-2">
                                        <span className="text-lg">🎯</span> Learning Insights
                                    </h3>
                                    <div className="flex flex-col gap-3">
                                        <InsightCard
                                            title="Single Point of Failure"
                                            description="If you only have one server, it becomes a bottleneck at high load. Add more servers behind a load balancer."
                                            type={state.components.filter((c) => c.type === "server").length === 1 ? "warning" : "success"}
                                        />
                                        <InsightCard
                                            title="Database Scaling"
                                            description="Databases often become the bottleneck. Consider read replicas or caching to reduce load."
                                            type={
                                                state.bottlenecks.some((b) => b.componentId.includes("database"))
                                                    ? "warning"
                                                    : "success"
                                            }
                                        />
                                        <InsightCard
                                            title="Cost Efficiency"
                                            description={`At ${state.users.toLocaleString()} users, your cost is ${(
                                                state.estimatedCost.total * 1000
                                            ).toFixed(2)} per 1000 requests.`}
                                            type="info"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}

function InsightCard({
    title,
    description,
    type,
}: {
    title: string;
    description: string;
    type: "success" | "warning" | "info";
}) {
    const colors = {
        success: "border-accent-emerald/15 bg-accent-emerald/[0.04]",
        warning: "border-accent-amber/15 bg-accent-amber/[0.04]",
        info: "border-accent-cyan/15 bg-accent-cyan/[0.04]",
    };

    const icons = {
        success: "✅",
        warning: "⚠️",
        info: "💡",
    };

    return (
        <div className={`p-4 rounded-xl border ${colors[type]}`}>
            <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">{icons[type]}</span>
                <span className="text-xs font-heading font-semibold text-white">{title}</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">{description}</p>
        </div>
    );
}