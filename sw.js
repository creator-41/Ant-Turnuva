self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch { data = { body: event.data ? event.data.text() : '' }; }

  const title = data.title || 'ANT Fantezi Lig';
  const options = {
    body: data.body || '',
    icon: data.icon || '/logo.png',
    badge: data.badge || '/logo.png',
    data: { url: data.url || 'https://antturnuva.com.tr/' },
    tag: data.tag || 'ant-fantezi-lig',
    renotify: true
  };
  event.waitUntil((async () => {
    await self.registration.showNotification(title, options);
    try {
      if (self.navigator && 'setAppBadge' in self.navigator) await self.navigator.setAppBadge(1);
    } catch (_) {}
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  try {
    if (self.navigator && 'clearAppBadge' in self.navigator) self.navigator.clearAppBadge();
    else if (self.navigator && 'setAppBadge' in self.navigator) self.navigator.setAppBadge(0);
  } catch (_) {}
  const targetUrl = event.notification.data?.url || 'https://antturnuva.com.tr/';
  event.waitUntil((async () => {
    const windows = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if ('focus' in client) {
        await client.navigate(targetUrl);
        return client.focus();
      }
    }
    return clients.openWindow(targetUrl);
  })());
});


// ANT Offline: sadece offline.html ve logo.png cache'lenir. index.html cache'lenmez.
const ANT_OFFLINE_CACHE = 'ant-offline-v3';
const ANT_OFFLINE_URL = '/offline.html';

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(ANT_OFFLINE_CACHE);
    await cache.addAll([ANT_OFFLINE_URL, '/logo.png']);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(k => k.startsWith('ant-offline-') && k !== ANT_OFFLINE_CACHE)
      .map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  if (url.origin === self.location.origin &&
      (url.pathname === '/offline.html' || url.pathname === '/logo.png')) {
    event.respondWith((async () => {
      const cached = await caches.match(request, {ignoreSearch:true});
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(ANT_OFFLINE_CACHE);
          await cache.put(request, response.clone());
        }
        return response;
      } catch (_) {
        return Response.error();
      }
    })());
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try { return await fetch(request); }
      catch (_) {
        const cache = await caches.open(ANT_OFFLINE_CACHE);
        return (await cache.match(ANT_OFFLINE_URL)) || Response.error();
      }
    })());
  }
});
