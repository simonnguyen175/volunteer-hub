import { API_BASE_URL } from "../config/api";

// VAPID public key from your backend WebPushConfig
const VAPID_PUBLIC_KEY = 'BMtb7ZE8pjics63ZwaY_K7Uc3sEvbRJ4AOdDWmVoAeM-CRqfz6ZVNcsHVFmU5Z8gfWVyJ9_uKP99PGkG75pLS7w';

// Convert base64 to Uint8Array for applicationServerKey
function urlB64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Check if push notifications are supported
export function isPushSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// Get current notification permission status
export function getNotificationPermission(): NotificationPermission {
    return Notification.permission;
}

// Register service worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker not supported');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registered:', registration.scope);
        return registration;
    } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
        return null;
    }
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
        console.warn('Notifications not supported');
        return 'denied';
    }

    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
}

// Subscribe to push notifications
export async function subscribeToPush(registration: ServiceWorkerRegistration): Promise<PushSubscription | null> {
    try {
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource
        });
        console.log('✅ Push subscription created:', subscription);
        return subscription;
    } catch (error) {
        console.error('❌ Push subscription failed:', error);
        return null;
    }
}

// Send subscription to backend
export async function sendSubscriptionToServer(
    subscription: PushSubscription, 
    userId: number, 
    token: string
): Promise<boolean> {
    try {
        const p256dhKey = subscription.getKey('p256dh');
        const authKey = subscription.getKey('auth');

        if (!p256dhKey || !authKey) {
            console.error('Missing subscription keys');
            return false;
        }

        const subscriptionObject = {
            endpoint: subscription.endpoint,
            p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dhKey))),
            auth: btoa(String.fromCharCode(...new Uint8Array(authKey)))
        };

        console.log('Sending subscription to server for user:', userId);

        const response = await fetch(`${API_BASE_URL}/notifications/subscribe/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(subscriptionObject)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Failed to save subscription:', error);
            return false;
        }

        console.log('✅ Subscription saved to server');
        return true;
    } catch (error) {
        console.error('❌ Error sending subscription to server:', error);
        return false;
    }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush(): Promise<boolean> {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
            await subscription.unsubscribe();
            console.log('✅ Unsubscribed from push notifications');
            return true;
        }
        return false;
    } catch (error) {
        console.error('❌ Error unsubscribing:', error);
        return false;
    }
}

// Main function to setup push notifications for a user
export async function setupPushNotifications(userId: number, token: string): Promise<boolean> {
    if (!isPushSupported()) {
        console.warn('Push notifications not supported in this browser');
        return false;
    }

    try {
        // 1. Register service worker
        const registration = await registerServiceWorker();
        if (!registration) return false;

        // 2. Request permission
        const permission = await requestNotificationPermission();
        if (permission !== 'granted') {
            console.warn('Notification permission not granted');
            return false;
        }

        // 3. Subscribe to push
        const subscription = await subscribeToPush(registration);
        if (!subscription) return false;

        // 4. Send subscription to server
        const success = await sendSubscriptionToServer(subscription, userId, token);
        return success;
    } catch (error) {
        console.error('❌ Error setting up push notifications:', error);
        return false;
    }
}

// Listen for push messages from service worker
export function onPushMessage(callback: (data: { title: string; body: string; url: string }) => void): () => void {
    const handler = (event: MessageEvent) => {
        if (event.data?.type === 'NEW_NOTIFICATION') {
            console.log('📨 Received push notification:', event.data.data);
            callback(event.data.data);
        }
    };

    navigator.serviceWorker.addEventListener('message', handler);

    // Return cleanup function
    return () => {
        navigator.serviceWorker.removeEventListener('message', handler);
    };
}
