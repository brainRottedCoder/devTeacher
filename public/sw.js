/**
 * sudo make world - Service Worker
 * Enhanced with offline-first architecture and IndexedDB integration
 * 
 * Features:
 * - Multi-strategy caching
 * - IndexedDB integration for offline data
 * - Background sync for offline data
 * - Push notifications
 * - Offline queue for API requests
 * - Learning content caching
 */

const CACHE_NAME = 'sudomakeworld-v5';
const STATIC_CACHE = 'sudomakeworld-static-v5';
const DYNAMIC_CACHE = 'sudomakeworld-dynamic-v5';
const OFFLINE_QUEUE = 'sudomakeworld-offline-queue';

// IndexedDB configuration for service worker
const DB_NAME = 'sudomakeworld';
const DB_VERSION = 1;

// Static assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png',
    '/dashboard',
    '/community',
    '/modules',
    '/interview',
    '/simulate',
    '/labs',
    '/code',
    '/leaderboard',
    '/auth/login',
    '/auth/signup',
];

// Critical API endpoints to cache
const CRITICAL_API_ENDPOINTS = [
    '/api/modules',
    '/api/modules/',
    '/api/lessons/',
    '/api/progress',
    '/api/quizzes',
];

// Cache strategies for different routes
const CACHE_STRATEGIES = {
    networkFirst: ['/api/chat', '/api/ai/chat'],
    cacheFirst: ['/_next/static/', '/static/', '/fonts/', '/icons/'],
    staleWhileRevalidate: ['/modules', '/simulate', '/design', '/interview', '/labs', '/community'],
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE).then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS).catch(err => {
                    console.warn('[SW] Some static assets failed to cache:', err);
                });
            }),
            caches.open(DYNAMIC_CACHE),
            caches.open(OFFLINE_QUEUE),
            initServiceWorkerDB(),
        ])
    );
    self.skipWaiting();
    console.log('[SW] Installed');
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => !key.includes('v5'))
                    .map((key) => {
                        console.log('[SW] Deleting old cache:', key);
                        return caches.delete(key);
                    })
            );
        }).then(() => {
            console.log('[SW] Claiming clients');
            return self.clients.claim();
        })
    );
    console.log('[SW] Activated');
});

// Initialize IndexedDB for service worker
async function initServiceWorkerDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Create stores if they don't exist
            if (!db.objectStoreNames.contains('cachedModules')) {
                db.createObjectStore('cachedModules', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('cachedLessons')) {
                const lessonStore = db.createObjectStore('cachedLessons', { keyPath: 'id' });
                lessonStore.createIndex('moduleId', 'moduleId', { unique: false });
            }
            if (!db.objectStoreNames.contains('offlineQueue')) {
                const queueStore = db.createObjectStore('offlineQueue', { keyPath: 'id', autoIncrement: true });
                queueStore.createIndex('type', 'type', { unique: false });
            }
            if (!db.objectStoreNames.contains('userProgress')) {
                const progressStore = db.createObjectStore('userProgress', { keyPath: 'id', autoIncrement: true });
                progressStore.createIndex('moduleId', 'moduleId', { unique: false });
            }
        };
    });
}

// Fetch event - handle requests with appropriate strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests for standard caching
    if (request.method !== 'GET') {
        // Queue offline requests for API calls, but NOT AI endpoints
        // AI endpoints (chat, design generate) must hit the real server
        if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/ai/')) {
            event.respondWith(queueOfflineRequest(request));
            return;
        }
        return;
    }

    // Skip cross-origin requests except for fonts and images
    if (url.origin !== self.location.origin) {
        if (!url.pathname.match(/\.(woff2?|ttf|otf|eot)$/) && 
            !url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/)) {
            return;
        }
    }

    // Apply caching strategies based on URL path
    // Skip AI endpoints entirely — they should never be cached or cloned
    if (url.pathname.startsWith('/api/ai/')) {
        return;
    }

    if (url.pathname.startsWith('/api/chat')) {
        event.respondWith(networkFirstWithIDB(request));
        return;
    }

    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request));
        return;
    }

    if (url.pathname.startsWith('/_next/static/') ||
        url.pathname.startsWith('/static/') ||
        url.pathname.startsWith('/fonts/') ||
        url.pathname.startsWith('/icons/')) {
        event.respondWith(cacheFirst(request));
        return;
    }

    if (CACHE_STRATEGIES.staleWhileRevalidate.some(path => url.pathname.startsWith(path))) {
        event.respondWith(staleWhileRevalidate(request));
        return;
    }

    // Default: network first with cache fallback
    event.respondWith(networkFirstWithCacheFallback(request));
});

// Network first strategy - try network, fallback to cache
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) return cached;

        return createOfflineResponse(request);
    }
}

// Network first with IndexedDB integration
async function networkFirstWithIDB(request) {
    const url = new URL(request.url);

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());

            // Cache modules/lessons data in IndexedDB
            if (url.pathname.includes('/api/modules') || url.pathname.includes('/api/lessons')) {
                try {
                    const data = await response.clone().json();
                    await cacheDataInIDB(url.pathname, data);
                } catch (e) {
                    // Not JSON, skip IDB caching
                }
            }
        }
        return response;
    } catch (error) {
        // Try to get from cache first
        const cached = await caches.match(request);
        if (cached) return cached;

        // Try to get from IndexedDB
        if (url.pathname.includes('/api/modules') || url.pathname.includes('/api/lessons')) {
            const idbData = await getDataFromIDB(url.pathname);
            if (idbData) {
                return new Response(JSON.stringify(idbData), {
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        }

        return createOfflineResponse(request);
    }
}

// Cache data in IndexedDB
async function cacheDataInIDB(path, data) {
    try {
        const db = await initServiceWorkerDB();
        const tx = db.transaction(['cachedModules', 'cachedLessons'], 'readwrite');

        if (path.includes('/api/modules') && Array.isArray(data)) {
            const store = tx.objectStore('cachedModules');
            for (const module of data) {
                store.put({ ...module, cachedAt: Date.now() });
            }
        } else if (path.includes('/api/lessons') && Array.isArray(data)) {
            const store = tx.objectStore('cachedLessons');
            for (const lesson of data) {
                store.put({ ...lesson, cachedAt: Date.now() });
            }
        }

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (error) {
        console.warn('[SW] IDB cache error:', error);
    }
}

// Get data from IndexedDB
async function getDataFromIDB(path) {
    try {
        const db = await initServiceWorkerDB();
        
        return new Promise((resolve, reject) => {
            if (path.includes('/api/modules')) {
                const tx = db.transaction('cachedModules', 'readonly');
                const store = tx.objectStore('cachedModules');
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } else if (path.includes('/api/lessons')) {
                const tx = db.transaction('cachedLessons', 'readonly');
                const store = tx.objectStore('cachedLessons');
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } else {
                resolve(null);
            }
        });
    } catch (error) {
        console.warn('[SW] IDB get error:', error);
        return null;
    }
}

// Cache first strategy - try cache, fallback to network
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) {
        // Update cache in background
        updateCacheInBackground(request);
        return cached;
    }

    try {
        const response = await fetch(request);
        // Only cache successful responses
        if (response.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        // Don't fail for missing chunks - return a placeholder response
        if (request.url.includes('/_next/static/chunks/')) {
            console.log('[SW] Chunk not found, skipping cache:', request.url);
            // Return an empty response for missing chunks to prevent errors
            return new Response('', { status: 404, statusText: 'Not Found' });
        }
        return createOfflineResponse(request);
    }
}

// Stale while revalidate - return cached, update in background
async function staleWhileRevalidate(request) {
    const cached = await caches.match(request);

    const fetchPromise = fetch(request).then((response) => {
        if (response.ok) {
            caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, response.clone());
            });
        }
        return response;
    }).catch(() => cached);

    return cached || fetchPromise;
}

// Network first with cache fallback
async function networkFirstWithCacheFallback(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) return cached;

        // For documents, return offline page
        if (request.destination === 'document') {
            const offlinePage = await caches.match('/');
            if (offlinePage) return offlinePage;
        }

        return createOfflineResponse(request);
    }
}

// Create offline response
function createOfflineResponse(request) {
    if (request.url.includes('/api/')) {
        return new Response(
            JSON.stringify({
                error: 'You are offline',
                offline: true,
                queued: true,
                message: 'This request will be synced when you are back online'
            }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }

    return new Response('You are offline', { status: 503 });
}

// Update cache in background
async function updateCacheInBackground(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, response);
        }
    } catch (error) {
        // Silent fail for background updates
    }
}

// Queue offline request for later sync
async function queueOfflineRequest(request) {
    try {
        let body = null;
        try {
            body = await request.clone().json();
        } catch { }

        const queueItem = {
            url: request.url,
            method: request.method,
            headers: Object.fromEntries(request.headers.entries()),
            body,
            timestamp: Date.now(),
            type: getTypeFromUrl(request.url),
        };

        // Store in IndexedDB
        const db = await initServiceWorkerDB();
        const tx = db.transaction('offlineQueue', 'readwrite');
        const store = tx.objectStore('offlineQueue');
        store.add(queueItem);

        // Also store in cache for backup
        const cache = await caches.open(OFFLINE_QUEUE);
        const key = `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await cache.put(
            new Request(key),
            new Response(JSON.stringify(queueItem), {
                headers: { 'Content-Type': 'application/json' }
            })
        );

        // Trigger background sync
        if ('sync' in self.registration) {
            self.registration.sync.register('sync-offline-requests').catch(e => {
                console.log('[SW] Sync registration failed:', e);
            });
        }

        return new Response(
            JSON.stringify({ success: true, queued: true, offline: true }),
            { status: 202, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ error: 'Failed to queue request' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

// Determine type from URL
function getTypeFromUrl(url) {
    if (url.includes('/chat') || url.includes('/ai/')) return 'chat';
    if (url.includes('/progress')) return 'progress';
    if (url.includes('/modules') || url.includes('/lessons')) return 'content';
    return 'general';
}

// Background sync for offline requests
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync triggered:', event.tag);

    if (event.tag === 'sync-offline-requests') {
        event.waitUntil(syncOfflineRequests());
    } else if (event.tag === 'sync-progress') {
        event.waitUntil(syncProgress());
    }
});

// Sync queued offline requests
async function syncOfflineRequests() {
    try {
        const db = await initServiceWorkerDB();
        const tx = db.transaction('offlineQueue', 'readwrite');
        const store = tx.objectStore('offlineQueue');
        const request = store.getAll();

        request.onsuccess = async () => {
            const items = request.result;
            for (const item of items) {
                try {
                    const fetchResponse = await fetch(item.url, {
                        method: item.method,
                        headers: item.headers,
                        body: item.body ? JSON.stringify(item.body) : undefined,
                    });

                    if (fetchResponse.ok) {
                        // Remove from queue on success
                        const deleteTx = db.transaction('offlineQueue', 'readwrite');
                        deleteTx.objectStore('offlineQueue').delete(item.id);
                        console.log('[SW] Synced offline request:', item.url);
                    }
                } catch (error) {
                    console.error('[SW] Failed to sync request:', error);
                }
            }
        };
    } catch (error) {
        console.error('[SW] Sync error:', error);
        
        // Fallback to cache-based sync
        const cache = await caches.open(OFFLINE_QUEUE);
        const requests = await cache.keys();

        for (const request of requests) {
            try {
                const response = await cache.match(request);
                const data = await response.json();

                const fetchResponse = await fetch(data.url, {
                    method: data.method,
                    headers: data.headers,
                    body: data.body ? JSON.stringify(data.body) : undefined,
                });

                if (fetchResponse.ok) {
                    await cache.delete(request);
                    console.log('[SW] Synced offline request:', data.url);
                }
            } catch (error) {
                console.error('[SW] Failed to sync request:', error);
            }
        }
    }
}

// Sync progress data
async function syncProgress() {
    try {
        const db = await initServiceWorkerDB();
        const tx = db.transaction('userProgress', 'readonly');
        const store = tx.objectStore('userProgress');
        const request = store.getAll();

        request.onsuccess = async () => {
            const progressItems = request.result;
            for (const item of progressItems) {
                if (!item.synced) {
                    try {
                        const response = await fetch('/api/progress', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(item),
                        });

                        if (response.ok) {
                            // Mark as synced
                            const updateTx = db.transaction('userProgress', 'readwrite');
                            item.synced = true;
                            updateTx.objectStore('userProgress').put(item);
                        }
                    } catch (error) {
                        console.error('[SW] Progress sync failed:', error);
                    }
                }
            }
        };
    } catch (error) {
        console.error('[SW] Sync failed:', error);
    }
}

// Push notifications
self.addEventListener('push', (event) => {
    const data = event.data?.json() || {};

    const options = {
        body: data.body || 'New notification from sudo make world',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/',
            timestamp: Date.now(),
        },
        actions: [
            { action: 'open', title: 'Open' },
            { action: 'dismiss', title: 'Dismiss' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(
            data.title || 'sudo make world',
            options
        )
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    const url = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            return clients.openWindow(url);
        })
    );
});

// Message handler for client communication
self.addEventListener('message', (event) => {
    const { type, data } = event.data || {};

    switch (type) {
        case 'skipWaiting':
            self.skipWaiting();
            break;

        case 'getOfflineStatus':
            event.ports[0].postMessage({ offline: !navigator.onLine });
            break;

        case 'clearCache':
            event.waitUntil(
                caches.keys().then(keys =>
                    Promise.all(keys.map(key => caches.delete(key)))
                )
            );
            break;

        case 'getVersion':
            event.ports[0].postMessage({ version: CACHE_NAME });
            break;

        case 'cacheModule':
            // Cache module content from client
            event.waitUntil(cacheModuleContent(data));
            break;

        case 'getCachedModules':
            // Get cached modules
            event.waitUntil(getCachedModulesList(event.ports[0]));
            break;

        case 'syncNow':
            // Force immediate sync
            event.waitUntil(syncOfflineRequests());
            break;
    }
});

// Cache module content
async function cacheModuleContent(moduleData) {
    try {
        const db = await initServiceWorkerDB();
        const tx = db.transaction('cachedModules', 'readwrite');
        const store = tx.objectStore('cachedModules');
        store.put({
            ...moduleData,
            cachedAt: Date.now()
        });
        console.log('[SW] Cached module:', moduleData.id);
    } catch (error) {
        console.error('[SW] Failed to cache module:', error);
    }
}

// Get cached modules list
async function getCachedModulesList(port) {
    try {
        const db = await initServiceWorkerDB();
        const tx = db.transaction('cachedModules', 'readonly');
        const store = tx.objectStore('cachedModules');
        const request = store.getAll();

        request.onsuccess = () => {
            port.postMessage({ modules: request.result });
        };
        request.onerror = () => {
            port.postMessage({ modules: [], error: request.error });
        };
    } catch (error) {
        port.postMessage({ modules: [], error });
    }
}

// Periodic background sync
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'update-content') {
        event.waitUntil(updateCachedContent());
    }
});

async function updateCachedContent() {
    const urls = [
        '/api/modules',
    ];

    for (const url of urls) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                const cache = await caches.open(DYNAMIC_CACHE);
                await cache.put(url, response);
            }
        } catch { }
    }
}

console.log('[SW] Service Worker loaded');
