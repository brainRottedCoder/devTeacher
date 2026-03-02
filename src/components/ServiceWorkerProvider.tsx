"use client";

import { useServiceWorker } from "@/hooks/useServiceWorker";

interface ServiceWorkerProviderProps {
    children: React.ReactNode;
}

export function ServiceWorkerProvider({ children }: ServiceWorkerProviderProps) {
    const { isReady, isOffline, version, updateAvailable, updateSW, syncNow } = useServiceWorker();

    return (
        <>
            {children}
            
            {/* Offline indicator */}
            {isOffline && (
                <div className="fixed bottom-4 left-4 z-50 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                    </svg>
                    <span className="text-sm font-medium">You are offline</span>
                    <button 
                        onClick={syncNow}
                        className="ml-2 text-xs bg-yellow-500 px-2 py-1 rounded hover:bg-yellow-400"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Update available notification */}
            {updateAvailable && (
                <div className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                    <span className="text-sm font-medium">New version available!</span>
                    <button 
                        onClick={updateSW}
                        className="ml-2 text-xs bg-white text-purple-600 px-2 py-1 rounded font-medium hover:bg-gray-100"
                    >
                        Update
                    </button>
                </div>
            )}

            {/* Debug info in development */}
            {process.env.NODE_ENV === "development" && isReady && version && (
                <div className="fixed top-2 right-2 z-50 text-xs text-gray-500 bg-gray-900/80 px-2 py-1 rounded">
                    SW: {version}
                </div>
            )}
        </>
    );
}

export default ServiceWorkerProvider;
