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
        title: 'VolunteerHub',
        body: 'You have a new notification',
        url: '/'
    };

    if (event.data) {
        try {
            const data = event.data.json();
            console.log('📄 Push data:', data);

            notificationData = {
                title: data.title || 'VolunteerHub',
                body: data.body || 'You have a new notification',
                url: data.url || '/'
            };
        } catch (error) {
            console.error('Error parsing push data:', error);
        }
    }

    // Send data to main thread to update UI (bell icon)
    event.waitUntil(
        self.clients.matchAll().then(function(clients) {
            clients.forEach(function(client) {
                client.postMessage({
                    type: 'NEW_NOTIFICATION',
                    data: notificationData
                });
            });

            // Show system notification
            return self.registration.showNotification(notificationData.title, {
                body: notificationData.body,
                icon: '/volunteer-hub-icon.png',
                badge: '/volunteer-hub-badge.png',
                data: { url: notificationData.url },
                requireInteraction: true,
                vibrate: [200, 100, 200]
            });
        })
    );
});

self.addEventListener('notificationclick', function(event) {
    console.log('🖱️ Notification clicked');
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            // Try to focus an existing window
            for (let client of clientList) {
                if (client.url.includes(self.location.origin)) {
                    client.navigate(urlToOpen);
                    return client.focus();
                }
            }
            // Open new window if none found
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
