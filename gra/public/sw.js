const CACHE='eklamerka-v1';
const ROOT=new URL('./',self.registration.scope);
const HOME=new URL('./',ROOT).pathname;
const CORE=['./','manifest.webmanifest','icon.svg'].map(path=>new URL(path,ROOT).pathname);
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE))));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return res}).catch(()=>caches.match(HOME))))});
