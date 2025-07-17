const CACHE_NAME = 'acoof-cache-v1';

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  // Activate worker immediately
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      )
    ).then(() => {
      console.log('Claiming clients');
      return self.clients.claim(); // Take control of all pages
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 🔒 Ignore unsupported protocols like chrome-extension://
  if (url.protocol.startsWith('chrome-extension')) return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return fetch(event.request)
        .then((response) => {
          // Only cache valid responses
          if (
            response &&
            response.status === 200 &&
            response.type === 'basic'
          ) {
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => {
          return cache.match(event.request);
        });
    })
  );
});
