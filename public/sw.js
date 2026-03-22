const CACHE_NAME = 'chefscan-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-192x192-v2.png',
  '/pwa-512x512-v2.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// Background Sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-recipes') {
    console.log('Syncing recipes in background...');
    // Add sync logic here
  }
});

// Periodic Background Sync
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-recipes') {
    console.log('Periodic sync: updating recipes...');
    // Add periodic sync logic here
  }
});

// Push Notifications
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : { title: 'ChefScan', body: 'Nouvelle notification' };
  
  const options = {
    body: data.body,
    icon: '/pwa-192x192-v2.png',
    badge: '/pwa-192x192-v2.png'
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
