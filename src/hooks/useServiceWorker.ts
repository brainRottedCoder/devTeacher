"use client";

import { useState, useEffect, useCallback } from "react";

interface UseServiceWorkerReturn {
    isReady: boolean;
    isOffline: boolean;
    version: string | null;
    updateAvailable: boolean;
    registerSW: () => Promise<void>;
    updateSW: () => void;
    clearCache: () => Promise<void>;
    syncNow: () => Promise<void>;
    cacheModule: (module: any) => void;
    getCachedModules: () => Promise<any[]>;
}

export function useServiceWorker(): UseServiceWorkerReturn {
    const [isReady, setIsReady] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [version, setVersion] = useState<string | null>(null);
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

    // Send message to service worker and get response
    const getMessageResponse = useCallback((type: string, data?: any): Promise<any> => {
        return new Promise((resolve) => {
            if (!navigator.serviceWorker.controller) {
                resolve(null);
                return;
            }

            const channel = new MessageChannel();
            channel.port1.onmessage = (event) => {
                resolve(event.data);
            };

            navigator.serviceWorker.controller.postMessage(
                { type, data },
                [channel.port2]
            );
        });
    }, []);

    // Register service worker
    const registerSW = useCallback(async () => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
            console.warn("Service workers not supported");
            return;
        }

        try {
            const reg = await navigator.serviceWorker.register("/sw.js", {
                scope: "/",
            });

            console.log("[SW] Registered:", reg.scope);
            setRegistration(reg);
            setIsReady(true);

            // Get version
            const versionResponse = await getMessageResponse("getVersion");
            if (versionResponse) {
                setVersion(versionResponse.version);
            }

            // Check for updates
            reg.addEventListener("updatefound", () => {
                const newWorker = reg.installing;
                if (newWorker) {
                    newWorker.addEventListener("statechange", () => {
                        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                            setUpdateAvailable(true);
                        }
                    });
                }
            });

            // Listen for controller changes
            navigator.serviceWorker.addEventListener("controllerchange", () => {
                window.location.reload();
            });

            // Register for periodic sync if supported
            if ("periodicSync" in reg) {
                try {
                    await (reg as any).periodicSync.register("update-content");
                } catch (e) {
                    console.log("[SW] Periodic sync not available");
                }
            }

            // Register for background sync if supported
            if ("sync" in reg) {
                // Sync will be triggered automatically when online
            }

        } catch (error) {
            console.error("[SW] Registration failed:", error);
        }
    }, [getMessageResponse]);

    // Update service worker
    const updateSW = useCallback(() => {
        getMessageResponse("skipWaiting");
    }, [getMessageResponse]);

    // Clear cache
    const clearCache = useCallback(async () => {
        await getMessageResponse("clearCache");
        setVersion(null);
    }, [getMessageResponse]);

    // Force sync now
    const syncNow = useCallback(async () => {
        await getMessageResponse("syncNow");
    }, [getMessageResponse]);

    // Cache a module for offline use
    const cacheModule = useCallback((module: any) => {
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: "cacheModule",
                data: module,
            });
        }
    }, []);

    // Get cached modules
    const getCachedModules = useCallback(async (): Promise<any[]> => {
        const response = await getMessageResponse("getCachedModules");
        return response?.modules || [];
    }, [getMessageResponse]);

    // Listen for online/offline events
    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleOnline = () => {
            setIsOffline(false);
            // Trigger sync when back online
            syncNow();
        };

        const handleOffline = () => {
            setIsOffline(true);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Set initial state
        setIsOffline(!navigator.onLine);

        // Get initial offline status
        getMessageResponse("getOfflineStatus").then((response) => {
            if (response) {
                setIsOffline(response.offline);
            }
        });

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [getMessageResponse, syncNow]);

    // Register on mount
    useEffect(() => {
        registerSW();
    }, [registerSW]);

    return {
        isReady,
        isOffline,
        version,
        updateAvailable,
        registerSW,
        updateSW,
        clearCache,
        syncNow,
        cacheModule,
        getCachedModules,
    };
}

export default useServiceWorker;
