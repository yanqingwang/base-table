// Minimal service worker — satisfies Chrome PWA installability (needs a fetch handler).
self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (event) {
  // Pass-through network strategy. Caching can be added later if offline use is desired.
  event.respondWith(fetch(event.request));
});
