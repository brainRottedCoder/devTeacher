import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    CustomLearningPath,
    LearningPathItem,
    UserPathProgress,
    PathTemplate,
    PathRecommendation,
} from '@/types/custom-path.types';

export function useCustomPaths(options: { userId?: string; template?: boolean } = {}) {
    const queryClient = useQueryClient();

    const params = new URLSearchParams();
    if (options.userId) params.append('userId', options.userId);
    if (options.template) params.append('template', 'true');

    const { data: paths, isLoading, error } = useQuery<CustomLearningPath[]>({
        queryKey: ['custom-paths', options.userId, options.template],
        queryFn: async () => {
            const res = await fetch(`/api/learning-paths/custom?${params}`);
            if (!res.ok) throw new Error('Failed to fetch paths');
            return res.json();
        },
    });

    const createPath = useMutation({
        mutationFn: async (data: {
            name: string;
            description?: string;
            items: LearningPathItem[];
            is_public?: boolean;
            target_role?: string;
            target_level?: string;
        }) => {
            const res = await fetch('/api/learning-paths/custom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create path');
            return res.json() as Promise<CustomLearningPath>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['custom-paths'] });
        },
    });

    const updatePath = useMutation({
        mutationFn: async (data: { id: string; [key: string]: any }) => {
            const res = await fetch('/api/learning-paths/custom', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update path');
            return res.json() as Promise<CustomLearningPath>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['custom-paths'] });
        },
    });

    const deletePath = useMutation({
        mutationFn: async (pathId: string) => {
            const res = await fetch(`/api/learning-paths/custom?id=${pathId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete path');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['custom-paths'] });
        },
    });

    return {
        paths: paths || [],
        isLoading,
        error,
        createPath,
        updatePath,
        deletePath,
    };
}

export function useCustomPath(pathId: string | null) {
    const { data: path, isLoading, error } = useQuery<CustomLearningPath>({
        queryKey: ['custom-path', pathId],
        queryFn: async () => {
            if (!pathId) throw new Error('No path ID');
            const res = await fetch(`/api/learning-paths/custom?id=${pathId}`);
            if (!res.ok) throw new Error('Failed to fetch path');
            return res.json();
        },
        enabled: !!pathId,
    });

    return { path, isLoading, error };
}

export function usePathTemplates(options: { role?: string; level?: string } = {}) {
    const params = new URLSearchParams();
    if (options.role) params.append('role', options.role);
    if (options.level) params.append('level', options.level);

    const { data: templates, isLoading } = useQuery<PathTemplate[]>({
        queryKey: ['path-templates', options.role, options.level],
        queryFn: async () => {
            const res = await fetch(`/api/learning-paths/templates?${params}`);
            if (!res.ok) throw new Error('Failed to fetch templates');
            return res.json();
        },
    });

    return { templates: templates || [], isLoading };
}

export function usePathRecommendations() {
    const { data: recommendations, isLoading } = useQuery<PathRecommendation[]>({
        queryKey: ['path-recommendations'],
        queryFn: async () => {
            const res = await fetch('/api/learning-paths/templates?type=recommendations');
            if (!res.ok) throw new Error('Failed to fetch recommendations');
            return res.json();
        },
    });

    return { recommendations: recommendations || [], isLoading };
}

export function usePathBuilder() {
    const [items, setItems] = useState<LearningPathItem[]>([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const addItem = useCallback((item: Omit<LearningPathItem, 'id' | 'order'>) => {
        const newItem: LearningPathItem = {
            ...item,
            id: `item-${Date.now()}`,
            order: items.length + 1,
        };
        setItems(prev => [...prev, newItem]);
    }, [items.length]);

    const removeItem = useCallback((itemId: string) => {
        setItems(prev => 
            prev.filter(item => item.id !== itemId)
                .map((item, index) => ({ ...item, order: index + 1 }))
        );
    }, []);

    const reorderItems = useCallback((fromIndex: number, toIndex: number) => {
        setItems(prev => {
            const newItems = [...prev];
            const [removed] = newItems.splice(fromIndex, 1);
            newItems.splice(toIndex, 0, removed);
            return newItems.map((item, index) => ({ ...item, order: index + 1 }));
        });
    }, []);

    const moveItem = useCallback((itemId: string, direction: 'up' | 'down') => {
        setItems(prev => {
            const index = prev.findIndex(item => item.id === itemId);
            if (index === -1) return prev;
            if (direction === 'up' && index === 0) return prev;
            if (direction === 'down' && index === prev.length - 1) return prev;

            const newItems = [...prev];
            const newIndex = direction === 'up' ? index - 1 : index + 1;
            [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
            return newItems.map((item, i) => ({ ...item, order: i + 1 }));
        });
    }, []);

    const reset = useCallback(() => {
        setItems([]);
        setName('');
        setDescription('');
    }, []);

    const totalHours = Math.ceil(items.reduce((sum, item) => sum + item.estimated_minutes, 0) / 60);

    return {
        items,
        name,
        description,
        setName,
        setDescription,
        addItem,
        removeItem,
        reorderItems,
        moveItem,
        reset,
        totalHours,
        isValid: name.trim().length > 0 && items.length > 0,
    };
}
