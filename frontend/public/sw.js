console.log('Service Worker: Script loaded');

// Helper function to strip HTML tags from text
function stripHtmlTags(html) {
    if (!html) return '';
    // Remove HTML tags but preserve the text content
    return html.replace(/<[^>]*>/g, '');
}

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
        bodyWithHtml: 'You have a new notification', // Keep original HTML for frontend
        url: '/'
    };

    if (event.data) {
        try {
            const data = event.data.json();
            console.log('📄 Push data:', data);

            const bodyWithHtml = data.body || 'You have a new notification';
            notificationData = {
                title: data.title || 'VolunteerHub',
                body: stripHtmlTags(bodyWithHtml), // Strip HTML for browser notification
                bodyWithHtml: bodyWithHtml, // Keep original HTML for frontend
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
                    data: {
                        title: notificationData.title,
                        body: notificationData.bodyWithHtml, // Send HTML version to frontend
                        url: notificationData.url
                    }
                });
            });

            // Show system notification with stripped HTML
            return self.registration.showNotification(notificationData.title, {
                body: notificationData.body, // Use stripped version for browser notification
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
