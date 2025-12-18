console.log('Service Worker: Script loaded');

self.addEventListener('install', function(event) {
    console.log('Service Worker: Installing...');
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    console.log('Service Worker: Activating...');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function(event) {
    console.log('🔔 Push event received:', event);

    let notificationData = {
        title: 'Thông báo mới!',
        body: 'Bạn có thông báo mới',
        url: '/'
    };

    if (event.data) {
        try {
            const data = event.data.json();
            console.log('📄 Push data:', data);

            notificationData = {
                title: data.title || 'Thông báo nè',
                body: data.body || 'Bạn có thông báo mới',
                url: data.url || '/'
            };
        } catch (error) {
            console.error('Error parsing push data:', error);
        }
    }

    // Gửi data đến main thread để cập nhật UI
    event.waitUntil(
        self.clients.matchAll().then(function(clients) {
            clients.forEach(function(client) {
                client.postMessage({
                    type: 'NEW_NOTIFICATION',
                    data: notificationData
                });
            });

            // Hiển thị system notification
            return self.registration.showNotification(notificationData.title, {
                body: notificationData.body,
                icon: '/icon-192x192.png',
                data: { url: notificationData.url },
                requireInteraction: true
            });
        })
    );
});

self.addEventListener('notificationclick', function(event) {
    console.log('🖱️ Notification clicked');
    event.notification.close();

    const urlToOpen = event.notification.data.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(function(clientList) {
            for (let client of clientList) {
                if (client.url.includes(self.location.origin)) {
                    client.navigate(urlToOpen);
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
