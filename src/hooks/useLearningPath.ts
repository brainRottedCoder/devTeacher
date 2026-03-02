"use client";

import { useState, useEffect, useCallback } from "react";
import { LearningPath, UserLearningPath } from "@/types/learning-path.types";

export function useLearningPath() {
    const [paths, setPaths] = useState<LearningPath[]>([]);
    const [userPaths, setUserPaths] = useState<UserLearningPath[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPaths = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/learning-paths");
            if (res.ok) {
                const data = await res.json();
                setPaths(data.paths || []);
                setUserPaths(data.userPaths || []);
            }
        } catch (error) {
            console.error("Error fetching learning paths:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const enrollInPath = useCallback(async (pathId: string) => {
        try {
            const res = await fetch("/api/learning-paths", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pathId }),
            });
            if (res.ok) {
                const data = await res.json();
                setUserPaths((prev) => [...prev, data.userPath]);
                return data.userPath;
            }
        } catch (error) {
            console.error("Error enrolling in path:", error);
        }
        return null;
    }, []);

    const updatePathStatus = useCallback(async (userPathId: string, status: string) => {
        try {
            const res = await fetch("/api/learning-paths", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: userPathId, status }),
            });
            if (res.ok) {
                setUserPaths((prev) =>
                    prev.map((up) => (up.id === userPathId ? { ...up, status: status as any } : up))
                );
            }
        } catch (error) {
            console.error("Error updating path:", error);
        }
    }, []);

    useEffect(() => {
        fetchPaths();
    }, [fetchPaths]);

    const activePath = userPaths.find((up) => up.status === "active");

    return {
        paths,
        userPaths,
        activePath,
        isLoading,
        enrollInPath,
        updatePathStatus,
        refetch: fetchPaths,
    };
}
