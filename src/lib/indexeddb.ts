/**
 * IndexedDB Wrapper for Offline Support
 * 
 * Provides offline-first data storage with sync capabilities:
 * - Chat messages
 * - User progress
 * - Learning modules content
 * - Pending sync queue
 */

import { ChatMessage } from "@/hooks/useChat";

const DB_NAME = "sudomakeworld";
const DB_VERSION = 1;

export interface OfflineChatMessage {
    id?: number;
    role: "user" | "assistant";
    content: string;
    context?: {
        moduleId?: string;
        lessonId?: string;
        moduleTitle?: string;
        lessonTitle?: string;
    };
    createdAt: number;
    synced: boolean;
}

export interface OfflineProgress {
    id?: number;
    moduleId: string;
    lessonId?: string;
    completed: boolean;
    progressPercentage: number;
    lastAccessed: number;
    synced: boolean;
}

export interface OfflineModule {
    id: string;
    title: string;
    description: string;
    content: any;
    category: string;
    difficulty: string;
    cachedAt: number;
}

export interface SyncQueueItem {
    id?: number;
    type: "chat" | "progress" | "achievement";
    action: "create" | "update" | "delete";
    data: any;
    timestamp: number;
    retries: number;
}

type DBSchema = {
    chatMessages: OfflineChatMessage;
    progress: OfflineProgress;
    modules: OfflineModule;
    syncQueue: SyncQueueItem;
};

type StoreName = keyof DBSchema;

// Database initialization
let dbInstance: IDBDatabase | null = null;

export async function initDB(): Promise<IDBDatabase> {
    if (dbInstance) return dbInstance;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error("[IndexedDB] Failed to open database:", request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            dbInstance = request.result;
            console.log("[IndexedDB] Database initialized");
            resolve(request.result);
        };

        request.onerror = () => {
            console.error("[IndexedDB] Upgrade needed");
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            console.log("[IndexedDB] Creating/upgrading schema");

            // Chat messages store
            if (!db.objectStoreNames.contains("chatMessages")) {
                const chatStore = db.createObjectStore("chatMessages", { keyPath: "id", autoIncrement: true });
                chatStore.createIndex("synced", "synced", { unique: false });
                chatStore.createIndex("createdAt", "createdAt", { unique: false });
            }

            // Progress store
            if (!db.objectStoreNames.contains("progress")) {
                const progressStore = db.createObjectStore("progress", { keyPath: "id", autoIncrement: true });
                progressStore.createIndex("moduleId", "moduleId", { unique: false });
                progressStore.createIndex("synced", "synced", { unique: false });
            }

            // Modules cache store
            if (!db.objectStoreNames.contains("modules")) {
                const modulesStore = db.createObjectStore("modules", { keyPath: "id" });
                modulesStore.createIndex("cachedAt", "cachedAt", { unique: false });
            }

            // Sync queue store
            if (!db.objectStoreNames.contains("syncQueue")) {
                const syncStore = db.createObjectStore("syncQueue", { keyPath: "id", autoIncrement: true });
                syncStore.createIndex("type", "type", { unique: false });
                syncStore.createIndex("timestamp", "timestamp", { unique: false });
            }
        };
    });
}

// Generic CRUD operations
async function getStore(storeName: StoreName, mode: IDBTransactionMode = "readonly"): Promise<IDBObjectStore> {
    const db = await initDB();
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
}

async function getAll<T>(storeName: StoreName): Promise<T[]> {
    const store = await getStore(storeName);
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getByIndex<T>(storeName: StoreName, indexName: string, value: any): Promise<T[]> {
    const store = await getStore(storeName);
    const index = store.index(indexName);
    return new Promise((resolve, reject) => {
        const request = index.getAll(value);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function add<T>(storeName: StoreName, data: T): Promise<number> {
    const store = await getStore(storeName, "readwrite");
    return new Promise((resolve, reject) => {
        const request = store.add(data);
        request.onsuccess = () => resolve(request.result as number);
        request.onerror = () => reject(request.error);
    });
}

async function put<T>(storeName: StoreName, data: T): Promise<void> {
    const store = await getStore(storeName, "readwrite");
    return new Promise((resolve, reject) => {
        const request = store.put(data);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function clear(storeName: StoreName): Promise<void> {
    const store = await getStore(storeName, "readwrite");
    return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// ============ Chat Messages ============

export async function saveChatMessageOffline(message: Omit<OfflineChatMessage, "id" | "synced">): Promise<number> {
    return add("chatMessages", {
        ...message,
        synced: false,
        createdAt: Date.now(),
    });
}

export async function getOfflineChatMessages(): Promise<OfflineChatMessage[]> {
    return getAll<OfflineChatMessage>("chatMessages");
}

export async function getUnsyncedChatMessages(): Promise<OfflineChatMessage[]> {
    return getByIndex<OfflineChatMessage>("chatMessages", "synced", false);
}

export async function markChatMessageSynced(id: number): Promise<void> {
    const store = await getStore("chatMessages", "readwrite");
    return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => {
            const data = request.result;
            if (data) {
                data.synced = true;
                store.put(data).onsuccess = () => resolve();
                store.put(data).onerror = () => reject(request.error);
            } else {
                resolve();
            }
        };
        request.onerror = () => reject(request.error);
    });
}

// ============ Progress ============

export async function saveProgressOffline(progress: Omit<OfflineProgress, "id" | "synced">): Promise<number> {
    return add("progress", {
        ...progress,
        synced: false,
    });
}

export async function getOfflineProgress(): Promise<OfflineProgress[]> {
    return getAll<OfflineProgress>("progress");
}

export async function getUnsyncedProgress(): Promise<OfflineProgress[]> {
    return getByIndex<OfflineProgress>("progress", "synced", false);
}

// ============ Modules Cache ============

export async function cacheModuleOffline(module: OfflineModule): Promise<void> {
    return put("modules", {
        ...module,
        cachedAt: Date.now(),
    });
}

export async function getCachedModules(): Promise<OfflineModule[]> {
    return getAll<OfflineModule>("modules");
}

export async function getCachedModule(id: string): Promise<OfflineModule | undefined> {
    const store = await getStore("modules");
    return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// ============ Sync Queue ============

export async function addToSyncQueue(item: Omit<SyncQueueItem, "id" | "timestamp" | "retries">): Promise<number> {
    return add("syncQueue", {
        ...item,
        timestamp: Date.now(),
        retries: 0,
    });
}

export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
    return getAll<SyncQueueItem>("syncQueue");
}

export async function removeSyncItem(id: number): Promise<void> {
    const store = await getStore("syncQueue", "readwrite");
    return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function incrementSyncRetry(id: number): Promise<void> {
    const store = await getStore("syncQueue", "readwrite");
    return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => {
            const data = request.result;
            if (data) {
                data.retries += 1;
                store.put(data).onsuccess = () => resolve();
                store.put(data).onerror = () => reject(request.error);
            } else {
                resolve();
            }
        };
        request.onerror = () => reject(request.error);
    });
}

// ============ Network & Sync ============

export function isOnline(): boolean {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
}

export async function syncOfflineData(): Promise<{ success: number; failed: number }> {
    if (!isOnline()) {
        console.log("[Sync] Offline, skipping sync");
        return { success: 0, failed: 0 };
    }

    console.log("[Sync] Starting sync...");
    let success = 0;
    let failed = 0;

    // Sync chat messages
    const unsyncedMessages = await getUnsyncedChatMessages();
    for (const msg of unsyncedMessages) {
        try {
            const res = await fetch("/api/chat/history", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    role: msg.role,
                    content: msg.content,
                    context: msg.context,
                }),
            });
            if (res.ok && msg.id) {
                await markChatMessageSynced(msg.id);
                success++;
            } else {
                failed++;
            }
        } catch (error) {
            console.error("[Sync] Failed to sync message:", error);
            failed++;
        }
    }

    // Sync progress
    const unsyncedProgress = await getUnsyncedProgress();
    for (const prog of unsyncedProgress) {
        try {
            const res = await fetch("/api/progress", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(prog),
            });
            if (res.ok) {
                // Mark as synced - would need similar function
                success++;
            } else {
                failed++;
            }
        } catch (error) {
            console.error("[Sync] Failed to sync progress:", error);
            failed++;
        }
    }

    console.log(`[Sync] Complete: ${success} success, ${failed} failed`);
    return { success, failed };
}

// Listen for online/offline events
if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
        console.log("[Network] Back online - syncing data");
        syncOfflineData();
    });

    window.addEventListener("offline", () => {
        console.log("[Network] Gone offline - data will sync when back online");
    });
}

export default {
    initDB,
    isOnline,
    syncOfflineData,
    // Chat
    saveChatMessageOffline,
    getOfflineChatMessages,
    // Progress
    saveProgressOffline,
    getOfflineProgress,
    // Modules
    cacheModuleOffline,
    getCachedModules,
    getCachedModule,
    // Sync
    addToSyncQueue,
    getPendingSyncItems,
};
