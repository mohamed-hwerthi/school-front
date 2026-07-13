// Kill-switch service worker.
// Any previously installed SW (ecolenet-v1, v2, …) will fetch this file on
// the next page load, install it, and the activate handler below will wipe
// every cache + unregister itself, then force-reload all open tabs.
// After that one reload, no SW intercepts requests anymore until we ship a
// fresh PWA build with a real fetch handler again.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.map((n) => caches.delete(n))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => clients.forEach((client) => client.navigate(client.url)))
  );
});
