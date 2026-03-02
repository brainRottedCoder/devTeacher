"use client";

import { useQuery } from "@tanstack/react-query";

export interface Lesson {
    id: string;
    module_id: string;
    title: string;
    slug: string;
    content: string;
    order_index: number;
    estimated_minutes: number;
    is_published: boolean;
}

export interface Module {
    id: string;
    title: string;
    slug: string;
    description: string;
    icon: string;
    category: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    estimated_minutes: number;
    order_index: number;
    is_premium: boolean;
    is_published: boolean;
}

export interface ModuleWithLessons extends Module {
    lessons: Lesson[];
}

interface ModulesResponse {
    modules: Module[];
}

interface ModuleResponse {
    module: Module;
    lessons: Lesson[];
}

async function fetchModules(): Promise<Module[]> {
    const response = await fetch("/api/modules");
    if (!response.ok) {
        throw new Error("Failed to fetch modules");
    }
    const data: ModulesResponse = await response.json();
    return data.modules;
}

async function fetchModule(id: string): Promise<ModuleWithLessons> {
    const response = await fetch(`/api/modules/${id}`);
    if (!response.ok) {
        throw new Error("Failed to fetch module");
    }
    const data: ModuleResponse = await response.json();
    return { ...data.module, lessons: data.lessons };
}

export function useModules() {
    return useQuery({
        queryKey: ["modules"],
        queryFn: fetchModules,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function useModule(id: string) {
    return useQuery({
        queryKey: ["module", id],
        queryFn: () => fetchModule(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
}
