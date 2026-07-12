const CACHE_NAME = 'nexa-vault-v2';
const ASSETS_TO_CACHE = [
  '/login.html',
  '/dashboard.html',
  '/request-citizenship.html',
  '/frontend/wallet.html',
  '/frontend/wallet.js',
  '/frontend/stateManager.js',
  '/assets/Logo.png',
  '/assets/world.png',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;500;600&display=swap'
];

// Install: Cache UI Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: Cleanup & Claim
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
    })
  );
  self.clients.claim();
});

// Fetch: Offline Vault Experience
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API Requests: Network-First with Cache Fallback for 'Offline Balance'
  if (url.pathname.includes('/api/v1/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && request.method === 'GET') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static Assets: Cache-First
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  );
});
