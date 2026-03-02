"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { ArchitectureNodeData, COMPONENT_CONFIGS, ArchitectureComponentType } from "@/lib/designer/types";

interface ArchitectureNodeProps {
    data: ArchitectureNodeData;
    selected?: boolean;
}

function ArchitectureNodeComponent({ data, selected }: ArchitectureNodeProps) {
    const config = COMPONENT_CONFIGS[data.type as ArchitectureComponentType];

    return (
        <div
            className={`relative px-4 py-3 rounded-xl border-2 transition-all duration-200 ${selected
                    ? "border-purple-500 shadow-lg shadow-purple-500/30 scale-105"
                    : "border-white/20 hover:border-white/40"
                }`}
            style={{
                backgroundColor: `${data.color}15`,
                borderColor: selected ? data.color : `${data.color}40`,
            }}
        >
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-gray-600 !border-2 !border-white/50"
            />

            {/* Node Content */}
            <div className="flex items-center gap-3">
                <span className="text-2xl">{data.icon}</span>
                <div>
                    <div className="text-sm font-medium text-white">{data.label}</div>
                    <div className="text-xs text-gray-400">{config?.description?.slice(0, 30)}...</div>
                </div>
            </div>

            {/* Category badge */}
            <div
                className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded text-[10px] font-medium"
                style={{
                    backgroundColor: data.color,
                    color: "white",
                }}
            >
                {data.category}
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-gray-600 !border-2 !border-white/50"
            />
        </div>
    );
}

export const ArchitectureNode = memo(ArchitectureNodeComponent);