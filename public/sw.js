// No private HTML or map tiles are cached. This worker supplies installation and foreground notifications.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',()=>{});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(self.clients.matchAll({type:'window'}).then(windows=>windows.length?windows[0].focus():self.clients.openWindow('/')))});
