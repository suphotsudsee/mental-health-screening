// Basic pass-through service worker: keeps the app installable without altering fetches.
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // No caching; rely on network/HTTP cache.
});
