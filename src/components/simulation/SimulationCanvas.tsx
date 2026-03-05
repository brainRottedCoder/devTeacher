"use client";

import { useState, useCallback, useRef, memo } from "react";
import {
    InfrastructureComponent,
    ComponentType,
    COMPONENT_INFO,
    ComponentStatus,
} from "@/lib/simulation/types";

interface SimulationCanvasProps {
    components: InfrastructureComponent[];
    selectedComponent: InfrastructureComponent | null;
    onSelectComponent: (component: InfrastructureComponent | null) => void;
    onAddComponent: (type: ComponentType, position: { x: number; y: number }) => void;
    onMoveComponent: (id: string, position: { x: number; y: number }) => void;
    onDeleteComponent: (id: string) => void;
}

export const SimulationCanvas = memo(function SimulationCanvas({
    components,
    selectedComponent,
    onSelectComponent,
    onAddComponent,
    onMoveComponent,
    onDeleteComponent,
}: SimulationCanvasProps) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [draggedComponent, setDraggedComponent] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [showComponentMenu, setShowComponentMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

    const handleCanvasClick = useCallback((e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if clicked on empty space
        const clickedOnComponent = components.some(
            (c) =>
                x >= c.position.x &&
                x <= c.position.x + 120 &&
                y >= c.position.y &&
                y <= c.position.y + 80
        );

        if (!clickedOnComponent) {
            onSelectComponent(null);
        }
    }, [components, onSelectComponent]);

    const handleCanvasContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        setMenuPosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
        setShowComponentMenu(true);
    }, []);

    const handleComponentMouseDown = useCallback(
        (e: React.MouseEvent, component: InfrastructureComponent) => {
            e.stopPropagation();
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;

            setDraggedComponent(component.id);
            setDragOffset({
                x: e.clientX - rect.left - component.position.x,
                y: e.clientY - rect.top - component.position.y,
            });
            onSelectComponent(component);
        },
        [onSelectComponent]
    );

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!draggedComponent) return;
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;

            const x = Math.max(0, Math.min(rect.width - 120, e.clientX - rect.left - dragOffset.x));
            const y = Math.max(0, Math.min(rect.height - 80, e.clientY - rect.top - dragOffset.y));

            onMoveComponent(draggedComponent, { x, y });
        },
        [draggedComponent, dragOffset, onMoveComponent]
    );

    const handleMouseUp = useCallback(() => {
        setDraggedComponent(null);
    }, []);

    const handleAddComponent = useCallback(
        (type: ComponentType) => {
            onAddComponent(type, menuPosition);
            setShowComponentMenu(false);
        },
        [menuPosition, onAddComponent]
    );

    const getStatusColor = (status: ComponentStatus) => {
        switch (status) {
            case "healthy":
                return "border-green-500/50 shadow-green-500/20";
            case "warning":
                return "border-yellow-500/50 shadow-yellow-500/20";
            case "critical":
                return "border-orange-500/50 shadow-orange-500/20";
            case "failed":
                return "border-red-500/50 shadow-red-500/20";
            default:
                return "border-white/10";
        }
    };

    const getStatusGlow = (status: ComponentStatus) => {
        switch (status) {
            case "healthy":
                return "shadow-[0_0_20px_rgba(34,197,94,0.3)]";
            case "warning":
                return "shadow-[0_0_20px_rgba(234,179,8,0.3)]";
            case "critical":
                return "shadow-[0_0_20px_rgba(249,115,22,0.3)]";
            case "failed":
                return "shadow-[0_0_20px_rgba(239,68,68,0.3)]";
            default:
                return "";
        }
    };

    return (
        <div
            ref={canvasRef}
            className="relative w-full h-full bg-[#0a0a0f] rounded-xl overflow-hidden border border-white/10 select-none"
            onClick={handleCanvasClick}
            onContextMenu={handleCanvasContextMenu}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Grid background */}
            <div className="absolute inset-0 bg-grid opacity-30" />

            {/* Connection lines - simplified for performance */}
            <svg className="absolute inset-0 pointer-events-none w-full h-full">
                {components.map((component) =>
                    component.connections.map((targetId) => {
                        const target = components.find((c) => c.id === targetId);
                        if (!target) return null;

                        const x1 = component.position.x + 60;
                        const y1 = component.position.y + 40;
                        const x2 = target.position.x + 60;
                        const y2 = target.position.y + 40;

                        const rps = component.metrics.requestsPerSecond || 0;
                        const isActive = rps > 0;

                        return (
                            <line
                                key={`${component.id}-${targetId}`}
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke="url(#lineGradient)"
                                strokeWidth={isActive ? 2.5 : 1.5}
                                strokeDasharray={isActive ? "8, 4" : "4, 4"}
                                className={isActive ? "opacity-80" : "opacity-30"}
                            />
                        );
                    })
                )}
                <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Components */}
            {components.map((component) => {
                const info = COMPONENT_INFO[component.type];
                const isSelected = selectedComponent?.id === component.id;

                return (
                    <div
                        key={component.id}
                        className={`absolute cursor-move transition-all duration-200 ${isSelected ? "z-20" : "z-10"
                            }`}
                        style={{
                            left: component.position.x,
                            top: component.position.y,
                        }}
                        onMouseDown={(e) => handleComponentMouseDown(e, component)}
                    >
                        <div
                            className={`w-[120px] p-3 rounded-xl border-2 transition-all ${getStatusColor(
                                component.status
                            )} ${getStatusGlow(component.status)} ${isSelected ? "ring-2 ring-purple-500/50 scale-105" : "hover:scale-102"
                                }`}
                            style={{ backgroundColor: `${info.color}10` }}
                        >
                            {/* Component icon and name */}
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-2xl">{info.icon}</span>
                                <span className="text-xs font-medium text-white text-center truncate w-full">
                                    {component.name}
                                </span>
                            </div>

                            {/* Metrics bar */}
                            <div className="mt-2 space-y-1">
                                <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-gray-400">CPU</span>
                                    <span
                                        className={`font-medium ${component.metrics.cpu > 80
                                                ? "text-red-400"
                                                : component.metrics.cpu > 60
                                                    ? "text-yellow-400"
                                                    : "text-green-400"
                                            }`}
                                    >
                                        {component.metrics.cpu.toFixed(0)}%
                                    </span>
                                </div>
                                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${component.metrics.cpu > 80
                                                ? "bg-red-500"
                                                : component.metrics.cpu > 60
                                                    ? "bg-yellow-500"
                                                    : "bg-green-500"
                                            }`}
                                        style={{ width: `${Math.min(100, component.metrics.cpu)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Delete button (only for selected) */}
                        {isSelected && (
                            <button
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-400 transition-colors z-30"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteComponent(component.id);
                                }}
                            >
                                ×
                            </button>
                        )}
                    </div>
                );
            })}

            {/* Empty state */}
            {components.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🏗️</span>
                        </div>
                        <p className="text-gray-400 mb-2">No components yet</p>
                        <p className="text-gray-500 text-sm">Right-click to add components</p>
                    </div>
                </div>
            )}

            {/* Component menu */}
            {showComponentMenu && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowComponentMenu(false)}
                    />
                    <div
                        className="absolute z-50 glass-card p-2 min-w-[160px]"
                        style={{ left: menuPosition.x, top: menuPosition.y }}
                    >
                        <p className="text-xs text-gray-400 px-2 py-1 border-b border-white/10 mb-1">
                            Add Component
                        </p>
                        {Object.entries(COMPONENT_INFO).map(([type, info]) => (
                            <button
                                key={type}
                                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                                onClick={() => handleAddComponent(type as ComponentType)}
                            >
                                <span className="text-lg">{info.icon}</span>
                                <span className="text-sm text-white">{info.name}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
});