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
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  // Network falling back to cache strategy
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return fetch(event.request)
        .then((response) => {
          // If the response is valid, cache it and return it
          if (response.status === 200) {
            cache.put(event.request.url, response.clone());
          }
          return response;
        })
        .catch(() => {
          // If the network fails, try to serve from cache
          return cache.match(event.request);
        });
    })
  );
});
