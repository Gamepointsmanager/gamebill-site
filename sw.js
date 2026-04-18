const CACHE = 'sweepadmin-vs-v1';
const BASE = './';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll([
        BASE,
        BASE + 'index.html'
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache successful responses
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then(cache => {
            cache.put(e.request, clone);
          });
        }
        return res;
      })
      .catch(() => {
        // Try cache first
        return caches.match(e.request).then(cached => {
          // If not found, fallback to index.html (useful for SPAs / offline)
          return cached || caches.match(BASE + 'index.html');
        });
      })
  );
});
