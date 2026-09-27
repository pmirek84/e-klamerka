import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const templatePath = path.resolve(rootDir, 'template.html');
const indexPath = path.resolve(rootDir, 'index.html');
const pkgPath = path.resolve(rootDir, 'package.json');

if (fs.existsSync(templatePath)) {
  fs.copyFileSync(templatePath, indexPath);
  console.log('Restored index.html from template.html for Vite compilation.');
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const version = pkg.version || '0.4.0';
const buildTime = Date.now();
const cacheVersion = `eklamerka-v${version}-${buildTime}`;

const swTemplate = `// Service Worker for E-Klamerka 3D PWA
const CACHE = '${cacheVersion}';
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
          const assetMatches = [...html.matchAll(/["'](\\.\\/assets\\/[^"']+)["']/g)].map(m => m[1]);
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
`;

fs.writeFileSync(path.resolve(rootDir, 'sw.js'), swTemplate, 'utf8');
const publicDir = path.resolve(rootDir, 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.resolve(publicDir, 'sw.js'), swTemplate, 'utf8');

console.log(`Generated versioned Service Worker: ${cacheVersion}`);

