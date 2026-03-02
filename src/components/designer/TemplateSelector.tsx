"use client";

import { DESIGN_TEMPLATES, DesignTemplate } from "@/lib/designer/types";

interface TemplateSelectorProps {
    onSelectTemplate: (template: DesignTemplate) => void;
    selectedTemplateId: string | null;
}

export function TemplateSelector({ onSelectTemplate, selectedTemplateId }: TemplateSelectorProps) {
    const categories = [...new Set(DESIGN_TEMPLATES.map((t) => t.category))];

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-white/10">
                <h3 className="text-sm font-medium text-white">Templates</h3>
                <p className="text-xs text-gray-400 mt-1">Start with a pre-built architecture</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {categories.map((category) => (
                    <div key={category} className="mb-6">
                        <h4 className="text-xs font-medium text-gray-400 uppercase mb-3">
                            {category}
                        </h4>
                        <div className="space-y-2">
                            {DESIGN_TEMPLATES.filter((t) => t.category === category).map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => onSelectTemplate(template)}
                                    className={`w-full text-left p-3 rounded-xl border transition-all ${selectedTemplateId === template.id
                                            ? "border-purple-500 bg-purple-500/10"
                                            : "border-white/10 hover:border-white/20 hover:bg-white/5"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{template.thumbnail}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-white truncate">
                                                {template.name}
                                            </div>
                                            <div className="text-xs text-gray-400 truncate">
                                                {template.description}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-gray-400">
                                            {template.nodes.length} components
                                        </span>
                                        <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-gray-400">
                                            {template.edges.length} connections
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Custom template hint */}
            <div className="p-4 border-t border-white/10">
                <div className="glass-card p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">💡</span>
                        <span className="text-sm font-medium text-white">Start from Scratch</span>
                    </div>
                    <p className="text-xs text-gray-400">
                        Drag components from the library to create your own architecture design.
                    </p>
                </div>
            </div>
        </div>
    );
}