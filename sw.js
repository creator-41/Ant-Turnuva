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
