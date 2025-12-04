# PWA Expert

> **ID:** `pwa-expert`
> **Tier:** 2
> **Token Cost:** 6000
> **MCP Connections:** context7

## What This Skill Does

Master Progressive Web App development with modern service worker patterns, offline-first architecture, push notifications, and installability.

- Complete service worker lifecycle management
- Offline-first caching strategies (Cache First, Network First, Stale-While-Revalidate)
- Background sync for offline actions
- Push notification implementation with Web Push API
- Install prompts and A2HS handling
- Workbox integration for production PWAs
- App shell architecture
- IndexedDB for offline data storage

## When to Use

This skill is automatically loaded when:

- **Keywords:** pwa, service worker, offline, progressive web, workbox, manifest
- **File Types:** sw.js, service-worker.js, manifest.json, manifest.webmanifest
- **Directories:** /public, /static

## Core Capabilities

### 1. Service Worker Setup

Service workers are the backbone of PWAs, enabling offline functionality, push notifications, and background processing.

**Basic Service Worker Registration:**

```typescript
// src/lib/sw-register.ts
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          dispatchEvent(new CustomEvent('sw-update-available', {
            detail: { registration }
          }));
        }
      });
    });

    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000);

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

export function promptUserToUpdate(registration: ServiceWorkerRegistration): void {
  if (registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}
```

**Production Service Worker with Workbox:**

```typescript
// public/sw.js
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

const appShellHandler = new NetworkFirst({
  cacheName: 'app-shell',
  networkTimeoutSeconds: 3,
  plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
});

registerRoute(new NavigationRoute(appShellHandler));

registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font',
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 7 * 24 * 60 * 60, purgeOnQuotaError: true }),
    ],
  })
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 5 * 60 }),
    ],
  })
);

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```

**Best Practices:**
- Always use HTTPS (required for service workers)
- Implement proper cache versioning
- Use Workbox for production applications
- Handle service worker updates gracefully with user prompts
- Set appropriate cache expiration policies

**Gotchas:**
- Service workers only work on HTTPS (except localhost)
- Cache storage has quota limits (varies by browser)
- Service worker scope is determined by its location
- Updates require closing all tabs or using skipWaiting

### 2. Offline Functionality

Implement robust offline experiences with strategic caching and IndexedDB.

**Caching Strategies:**

```typescript
// src/lib/cache-strategies.ts
async function cacheFirst(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function networkFirst(request: Request, cacheName: string, timeoutMs = 3000): Promise<Response> {
  const cache = await caches.open(cacheName);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function staleWhileRevalidate(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });

  return cached || fetchPromise;
}
```

**IndexedDB for Offline Data:**

```typescript
// src/lib/offline-db.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineDB extends DBSchema {
  'pending-actions': {
    key: string;
    value: { id: string; action: string; payload: unknown; timestamp: number; retries: number };
    indexes: { 'by-timestamp': number };
  };
  'cached-data': {
    key: string;
    value: { key: string; data: unknown; timestamp: number; expiry: number };
  };
}

class OfflineStorage {
  private db: IDBPDatabase<OfflineDB> | null = null;

  async init(): Promise<void> {
    this.db = await openDB<OfflineDB>('pwa-offline-db', 1, {
      upgrade(db) {
        const pendingStore = db.createObjectStore('pending-actions', { keyPath: 'id' });
        pendingStore.createIndex('by-timestamp', 'timestamp');
        db.createObjectStore('cached-data', { keyPath: 'key' });
      },
    });
  }

  async queueAction(action: string, payload: unknown): Promise<string> {
    if (!this.db) await this.init();
    const id = crypto.randomUUID();
    await this.db!.put('pending-actions', { id, action, payload, timestamp: Date.now(), retries: 0 });
    return id;
  }

  async getPendingActions() {
    if (!this.db) await this.init();
    return this.db!.getAllFromIndex('pending-actions', 'by-timestamp');
  }

  async removeAction(id: string): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.delete('pending-actions', id);
  }

  async cacheData(key: string, data: unknown, ttlMs = 3600000): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put('cached-data', { key, data, timestamp: Date.now(), expiry: Date.now() + ttlMs });
  }

  async getCachedData<T>(key: string): Promise<T | null> {
    if (!this.db) await this.init();
    const entry = await this.db!.get('cached-data', key);
    if (!entry) return null;
    if (entry.expiry < Date.now()) {
      await this.db!.delete('cached-data', key);
      return null;
    }
    return entry.data as T;
  }
}

export const offlineStorage = new OfflineStorage();
```

**React Hook for Online Status:**

```typescript
// src/hooks/useOnlineStatus.ts
import { useState, useEffect, useCallback } from 'react';

interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnline: Date | null;
}

export function useOnlineStatus(): OnlineStatus {
  const [status, setStatus] = useState<OnlineStatus>({
    isOnline: navigator.onLine,
    wasOffline: false,
    lastOnline: navigator.onLine ? new Date() : null,
  });

  const handleOnline = useCallback(() => {
    setStatus((prev) => ({ isOnline: true, wasOffline: !prev.isOnline, lastOnline: new Date() }));
  }, []);

  const handleOffline = useCallback(() => {
    setStatus((prev) => ({ ...prev, isOnline: false }));
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return status;
}
```

**Best Practices:**
- Implement optimistic UI updates for offline actions
- Show clear offline indicators to users
- Queue failed requests for retry with Background Sync API
- Use IndexedDB for structured offline data
- Implement conflict resolution for offline edits

**Gotchas:**
- Background Sync may not fire immediately
- IndexedDB is async and can be slow for large datasets
- Storage quota varies by device and browser
- iOS Safari has limited Background Sync support

### 3. Push Notifications

Implement web push notifications with proper permission handling.

**Push Notification Setup:**

```typescript
// src/lib/push-notifications.ts
class PushNotificationManager {
  private registration: ServiceWorkerRegistration | null = null;
  private vapidPublicKey: string;

  constructor(vapidPublicKey: string) {
    this.vapidPublicKey = vapidPublicKey;
  }

  async init(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push notifications not supported');
    }
    this.registration = await navigator.serviceWorker.ready;
  }

  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  async requestPermission(): Promise<NotificationPermission> {
    return await Notification.requestPermission();
  }

  async subscribe(): Promise<PushSubscription | null> {
    if (!this.registration) await this.init();
    const permission = await this.requestPermission();
    if (permission !== 'granted') return null;

    try {
      const subscription = await this.registration!.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
      });
      await this.sendSubscriptionToServer(subscription.toJSON());
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      throw error;
    }
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.registration) return false;
    const subscription = await this.registration.pushManager.getSubscription();
    if (!subscription) return false;
    return await subscription.unsubscribe();
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }

  private async sendSubscriptionToServer(subscription: any): Promise<void> {
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });
  }
}

export const pushManager = new PushNotificationManager(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!);
```

**Service Worker Push Handler:**

```typescript
// In service worker (sw.js)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const payload = event.data.json();

  const options = {
    body: payload.body,
    icon: payload.icon || '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: payload.tag || 'default',
    data: payload.data,
    actions: payload.actions,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
```

**Server-Side Push (Node.js):**

```typescript
// src/server/push-service.ts
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:admin@yourapp.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushNotification(
  subscription: any,
  payload: { title: string; body: string; url?: string }
): Promise<boolean> {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload), { TTL: 60 * 60 * 24 });
    return true;
  } catch (error: any) {
    if (error.statusCode === 410 || error.statusCode === 404) {
      // Subscription expired - remove from database
    }
    return false;
  }
}
```

**Best Practices:**
- Always ask permission in context (after user action)
- Provide value proposition before requesting permission
- Allow users to manage notification preferences
- Use notification tags to prevent duplicates

**Gotchas:**
- VAPID keys must match between client and server
- iOS Safari requires home screen install for push
- Permission denied is permanent until user changes settings

### 4. Install Prompts

Handle PWA installation with custom install prompts.

**Web App Manifest:**

```json
{
  "name": "My Progressive Web App",
  "short_name": "MyPWA",
  "description": "A powerful progressive web application",
  "start_url": "/?source=pwa",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable any" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable any" }
  ],
  "shortcuts": [{ "name": "New Task", "url": "/tasks/new?source=shortcut" }]
}
```

**Install Prompt Manager:**

```typescript
// src/lib/install-prompt.ts
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

class InstallPromptManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private listeners: Set<(canInstall: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredPrompt = e as BeforeInstallPromptEvent;
        this.notifyListeners(true);
      });

      window.addEventListener('appinstalled', () => {
        this.deferredPrompt = null;
        this.notifyListeners(false);
      });
    }
  }

  canInstall(): boolean { return this.deferredPrompt !== null; }

  isInstalled(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches;
  }

  async promptInstall(): Promise<string> {
    if (!this.deferredPrompt) return 'unavailable';
    await this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    this.notifyListeners(false);
    return outcome;
  }

  onCanInstallChange(callback: (canInstall: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(canInstall: boolean): void {
    this.listeners.forEach((listener) => listener(canInstall));
  }
}

export const installPrompt = new InstallPromptManager();
```

**React Install Banner:**

```typescript
// src/components/install-banner.tsx
'use client';

import { useState, useEffect } from 'react';
import { installPrompt } from '@/lib/install-prompt';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';

export function InstallBanner() {
  const [canInstall, setCanInstall] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (installPrompt.isInstalled()) return;
    const dismissedUntil = localStorage.getItem('install-dismissed-until');
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil)) {
      setDismissed(true);
      return;
    }
    setCanInstall(installPrompt.canInstall());
    return installPrompt.onCanInstallChange(setCanInstall);
  }, []);

  const handleInstall = async () => {
    const outcome = await installPrompt.promptInstall();
    if (outcome === 'dismissed') handleDismiss();
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('install-dismissed-until', String(Date.now() + 7 * 24 * 60 * 60 * 1000));
  };

  if (dismissed || !canInstall) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-lg z-50">
      <div className="max-w-lg mx-auto flex items-center gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Install Our App</h3>
          <p className="text-xs text-muted-foreground">Get offline support and faster access</p>
        </div>
        <Button size="sm" onClick={handleInstall}>
          <Download className="w-4 h-4 mr-1" />
          Install
        </Button>
        <button onClick={handleDismiss} className="p-2 hover:bg-muted rounded-full">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
```

**Best Practices:**
- Delay install prompt until user has engaged
- Show value proposition before prompting
- Provide iOS-specific instructions

**Gotchas:**
- beforeinstallprompt only fires once per page load
- iOS Safari requires manual Add to Home Screen
- Install criteria vary by browser

## Real-World Examples

### Example 1: Offline-First Task Manager

```typescript
// src/app/tasks/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { offlineStorage } from '@/lib/offline-db';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  synced: boolean;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { isOnline } = useOnlineStatus();

  useEffect(() => { loadTasks(); }, []);
  useEffect(() => { if (isOnline) syncPendingChanges(); }, [isOnline]);

  async function loadTasks() {
    const cached = await offlineStorage.getCachedData<Task[]>('tasks');
    if (cached) setTasks(cached);

    if (navigator.onLine) {
      try {
        const response = await fetch('/api/tasks');
        const serverTasks = await response.json();
        setTasks(serverTasks);
        await offlineStorage.cacheData('tasks', serverTasks);
      } catch (error) {
        console.log('Using cached tasks');
      }
    }
  }

  async function addTask(title: string) {
    const newTask: Task = { id: crypto.randomUUID(), title, completed: false, synced: false };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    await offlineStorage.cacheData('tasks', updatedTasks);
    await offlineStorage.queueAction('CREATE_TASK', newTask);
  }

  async function syncPendingChanges() {
    const pending = await offlineStorage.getPendingActions();
    for (const action of pending) {
      try {
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.payload)
        });
        await offlineStorage.removeAction(action.id);
      } catch (error) {
        console.error('Sync failed');
      }
    }
    await loadTasks();
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      {!isOnline && <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded mb-4">Offline mode</div>}
      <ul className="space-y-2">
        {tasks.map((task) => (
          <li key={task.id} className="flex items-center gap-2 p-3 bg-card rounded-lg">
            <span>{task.title}</span>
            {!task.synced && <span className="ml-auto text-xs text-muted-foreground">Pending sync</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Example 2: News Reader with Cache Updates

```typescript
// src/hooks/useCacheUpdates.ts
import { useEffect } from 'react';

export function useCacheUpdates(onUpdate: (url: string) => void) {
  useEffect(() => {
    const channel = new BroadcastChannel('workbox');
    channel.addEventListener('message', (event) => {
      if (event.data.type === 'CACHE_UPDATED') onUpdate(event.data.payload.updatedURL);
    });
    return () => channel.close();
  }, [onUpdate]);
}
```

## Related Skills

- **nextjs-expert** - Next.js PWA integration
- **react-advanced** - React patterns for PWA components
- **caching-expert** - Advanced caching strategies
- **websocket-expert** - Real-time features in PWAs
- **a11y-expert** - Accessible PWA implementation

## Further Reading

- [Google PWA Documentation](https://web.dev/progressive-web-apps/)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications/)
- [PWA Builder](https://www.pwabuilder.com/)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
