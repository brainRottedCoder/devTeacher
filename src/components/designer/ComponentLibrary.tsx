"use client";

import { useState } from "react";
import {
    ArchitectureComponentType,
    ArchitectureComponentCategory,
    COMPONENT_LIBRARY,
    COMPONENT_CONFIGS,
} from "@/lib/designer/types";

interface ComponentLibraryProps {
    onDragStart: (type: ArchitectureComponentType, config: typeof COMPONENT_CONFIGS[ArchitectureComponentType]) => void;
}

export function ComponentLibrary({ onDragStart }: ComponentLibraryProps) {
    const [expandedCategory, setExpandedCategory] = useState<ArchitectureComponentCategory | null>('server');

    const toggleCategory = (category: ArchitectureComponentCategory) => {
        setExpandedCategory(expandedCategory === category ? null : category);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-white/10">
                <h3 className="text-sm font-medium text-white">Component Library</h3>
                <p className="text-xs text-gray-400 mt-1">Drag components to canvas</p>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {Object.entries(COMPONENT_LIBRARY).map(([category, data]) => (
                    <div key={category} className="mb-2">
                        <button
                            onClick={() => toggleCategory(category as ArchitectureComponentCategory)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <span className="text-sm font-medium text-white">{data.label}</span>
                            <svg
                                className={`w-4 h-4 text-gray-400 transition-transform ${expandedCategory === category ? "rotate-180" : ""
                                    }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {expandedCategory === category && (
                            <div className="mt-1 space-y-1 pl-2">
                                {data.components.map((componentType) => {
                                    const config = COMPONENT_CONFIGS[componentType];
                                    return (
                                        <div
                                            key={componentType}
                                            draggable
                                            onDragStart={(e) => {
                                                e.dataTransfer.setData("componentType", componentType);
                                                onDragStart(componentType, config);
                                            }}
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-grab hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
                                            style={{ borderLeftColor: config.color, borderLeftWidth: "3px" }}
                                        >
                                            <span className="text-lg">{config.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm text-white truncate">{config.label}</div>
                                                <div className="text-xs text-gray-500 truncate">{config.description}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Tips */}
            <div className="p-4 border-t border-white/10">
                <h4 className="text-xs font-medium text-gray-400 mb-2">Tips</h4>
                <ul className="space-y-1 text-xs text-gray-500">
                    <li>• Drag components to add</li>
                    <li>• Connect by dragging handles</li>
                    <li>• Click to select & configure</li>
                    <li>• Delete with Backspace key</li>
                </ul>
            </div>
        </div>
    );
}