/**
 * Register the service worker for PWA support.
 * Called once from main.tsx on application load (production only).
 */
export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration.scope);
        })
        .catch((error) => {
          console.warn('SW registration failed:', error);
        });
    });
  }
}

/**
 * Force-cleanup any previously registered service worker and its caches.
 * Runs immediately in dev so a stale SW from a prior session can no longer
 * intercept fetches and serve old bundles.
 */
export function unregisterServiceWorkerAndClearCaches(): void {
  if (typeof navigator === 'undefined') return;
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => Promise.all(registrations.map((r) => r.unregister())))
      .catch(() => undefined);
  }
  if (typeof caches !== 'undefined') {
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .catch(() => undefined);
  }
}
