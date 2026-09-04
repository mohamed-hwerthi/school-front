/**
 * Enregistrement du service worker (PWA).
 * Appele une fois depuis main.tsx, en production uniquement.
 */
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;

  // Quand un nouveau SW prend la main, les assets deja charges par la page
  // peuvent ne plus correspondre au bundle servi. On recharge une seule fois —
  // le garde evite la boucle de rechargement si l'activation se repete.
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Applique la mise a jour des qu'elle est prete, sans attendre que
        // tous les onglets soient fermes.
        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              installing.postMessage('SKIP_WAITING');
            }
          });
        });
      })
      .catch((error) => {
        console.warn('SW registration failed:', error);
      });
  });
}

/**
 * Desinscrit tout service worker et vide les caches.
 * Appele en dev pour qu'un SW d'une session precedente ne serve pas un
 * ancien bundle a la place du serveur Vite.
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
