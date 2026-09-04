/**
 * Service worker EcoleNet.
 *
 * Un SW precedent servait des bundles perimes : il avait ete remplace par un
 * kill-switch. Les regles ci-dessous evitent de refaire la meme erreur.
 *
 *  1. Navigations (documents HTML) : reseau d'abord, cache en secours.
 *     index.html n'est JAMAIS servi depuis le cache tant que le reseau repond,
 *     donc l'utilisateur ne peut pas rester bloque sur un ancien bundle.
 *  2. Assets /assets/* : cache d'abord. Vite y met un hash de contenu dans le
 *     nom, donc une URL donnee est immuable — aucun risque de peremption.
 *  3. /api/* : jamais mis en cache. Les donnees scolaires doivent etre fraiches,
 *     et une reponse mise en cache fuiterait d'un compte a l'autre.
 *
 * Pense-bete : incrementer VERSION a chaque changement de ce fichier.
 */
const VERSION = 'ecolenet-v3';
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;
const OFFLINE_URL = '/index.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, '/manifest.json']))
      .then(() => self.skipWaiting())
      // Une install ratee (hors ligne au 1er chargement) ne doit pas bloquer.
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => !name.startsWith(VERSION))
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Origines tierces et API : on laisse passer sans intervenir.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // 1. Navigations — reseau d'abord.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(OFFLINE_URL, copy));
          return response;
        })
        .catch(() =>
          caches.match(OFFLINE_URL).then((cached) => cached || Response.error())
        )
    );
    return;
  }

  // 2. Assets hashes par Vite — cache d'abord, immuables.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          // Ne mettre en cache que les reponses completes et valides.
          if (response.ok && response.status === 200) {
            const copy = response.clone();
            caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // 3. Icones, polices, manifest — cache d'abord avec rafraichissement en fond.
  if (/\.(png|svg|ico|webp|woff2?)$/.test(url.pathname) || url.pathname === '/manifest.json') {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
