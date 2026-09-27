// Service Worker for E-Klamerka 3D PWA
const CACHE = 'eklamerka-v0.4.0-1790538429912';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './child-boy.svg',
  './child-girl.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      try {
        const response = await fetch('./index.html', { cache: 'reload' });
        if (response.ok) {
          const html = await response.clone().text();
          const assetMatches = [...html.matchAll(/["'](\.\/assets\/[^"']+)["']/g)].map(m => m[1]);
          await cache.put('./index.html', response);
          await cache.addAll([...new Set([...CORE_ASSETS, ...assetMatches])]);
        }
      } catch (err) {
        console.warn('SW pre-cache fallback:', err);
      }
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => {
          if (k.startsWith('eklamerka-') && k !== CACHE) {
            console.log('Purging old PWA cache:', k);
            return caches.delete(k);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Navigation: Network-First with timeout -> Cache fallback
  if (request.mode === 'navigate' || request.url.endsWith('/index.html') || request.url.endsWith('/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return await caches.match('./index.html');
        })
    );
    return;
  }

  // Static Assets (/assets/): Stale-While-Revalidate / Cache-First with Background Update
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => null);

      return cached || fetchPromise;
    })
  );
});
