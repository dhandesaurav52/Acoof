const CACHE_NAME = 'acoof-v1';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return fetch(event.request).then(response => {
        if (response.status === 200) {
          cache.put(event.request, response.clone());
        }
        return response;
      }).catch(() => {
        return caches.match(event.request);
      });
    })
  );
});
