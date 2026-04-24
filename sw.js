const CACHE_NAME = 'expense-tracker-v5';
const ASSETS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/transactions.html',
  '/budget.html',
  '/dashboard',
  '/transactions',
  '/budget',
  '/css/style.css',
  '/js/auth.js',
  '/js/dashboard.js',
  '/js/transactions.js',
  '/js/budget.js',
  '/js/theme.js'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    }).catch(err => {})
  );
});

self.addEventListener('fetch', event => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;
  
  // Don't intercept API calls
  if (event.request.url.includes('/api/')) return;

  const url = new URL(event.request.url);

  // STRATEGY: Network Only for HTML/Navigations
  // This ensures View Transitions and logins never get stuck on broken cached versions.
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html') || !url.pathname.includes('.')) {
    return; // Browser handles these normally
  }

  // STRATEGY: Cache First for static assets (CSS, JS, Images)
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(fetchRes => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, fetchRes.clone());
          return fetchRes;
        });
      });
    }).catch(() => {
      // Final fallback for missing assets
      return new Response('Asset not found', { status: 404 });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim()) // Become available to all pages immediately
  );
});
