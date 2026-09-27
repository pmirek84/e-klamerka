const CACHE='eklamerka-world-3d-v1';
self.addEventListener('install',event=>{event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  const response=await fetch('./index.html',{cache:'reload'});
  if(!response.ok)throw new Error('Missing app shell');
  const html=await response.clone().text();
  const assets=[...html.matchAll(/["'](\.\/assets\/[^"']+)["']/g)].map(match=>match[1]);
  await cache.put('./index.html',response);
  await cache.addAll(['./','./manifest.webmanifest','./icon.svg',...new Set(assets)]);
  await self.skipWaiting();
})());});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('eklamerka-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin)return;
  event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)));}return response;}).catch(async()=>{
    const match=await caches.match(request);if(match)return match;
    if(request.mode==='navigate')return await caches.match('./index.html');
    return Response.error();
  }));
});
