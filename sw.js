const CACHE_NAME = 'kpi-tracker-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    // Never cache API requests (keep live data live)
    if (e.request.url.includes('/api/data')) return;
    
    e.respondWith(
        caches.match(e.request).then(response => response || fetch(e.request))
    );
});