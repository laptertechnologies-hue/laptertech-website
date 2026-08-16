// Self-deactivating Service Worker
// Purges all caches and unregisters itself to ensure real-time loading from network

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          return caches.delete(key);
        })
      );
    }).then(() => {
      return self.registration.unregister();
    }).then(() => {
      return self.clients.matchAll();
    }).then((clients) => {
      clients.forEach(client => client.navigate(client.url));
    })
  );
});

self.addEventListener('fetch', (e) => {
  // Always fetch from network directly without caching
  e.respondWith(fetch(e.request));
});
