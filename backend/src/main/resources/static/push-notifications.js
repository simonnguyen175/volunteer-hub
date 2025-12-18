const API_BASE_URL = 'http://localhost:8080';
const VAPID_PUBLIC_KEY = 'BMtb7ZE8pjics63ZwaY_K7Uc3sEvbRJ4AOdDWmVoAeM-CRqfz6ZVNcsHVFmU5Z8gfWVyJ9_uKP99PGkG75pLS7w';

let notifications = [];

// Utility Functions
function showStatus(message, type = 'info') {
    const statusDiv = document.getElementById('status');
    statusDiv.className = `status ${type}`;
    statusDiv.textContent = message;
}

function getJWTToken() {
    const token = document.getElementById('jwtToken').value.trim();
    if (!token) throw new Error('JWT Token không được để trống');
    return token;
}

function getUserId() {
    const userId = document.getElementById('userId').value;
    if (!userId) throw new Error('User ID không được để trống');
    return parseInt(userId);
}

// Service Worker và Push Subscription
async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker không được hỗ trợ');
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('✅ Service Worker registered');

    // Listen for messages từ service worker
    navigator.serviceWorker.addEventListener('message', function(event) {
        if (event.data.type === 'NEW_NOTIFICATION') {
            console.log('📨 Received notification from SW:', event.data);
            addNotificationToList(event.data.data);
        }
    });

    return registration;
}

async function subscribeToPush(registration) {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        throw new Error('Notification permission bị từ chối');
    }

    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    return subscription;
}

async function sendSubscriptionToServer(subscription) {
    const token = getJWTToken();
    const userId = getUserId();

    const subscriptionObject = {
        endpoint: subscription.endpoint,
        p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
        auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth'))))
    };

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
        throw new Error(error.message || 'Lỗi lưu subscription');
    }
    return await response.json();
}

// Main functions
async function subscribeUser() {
    try {
        showStatus('⏳ Đang đăng ký...', 'info');

        const registration = await registerServiceWorker();
        const subscription = await subscribeToPush(registration);
        await sendSubscriptionToServer(subscription);
        await loadNotifications(); // Load existing notifications

        showStatus('✅ Đăng ký thành công!', 'success');
    } catch (error) {
        showStatus(`❌ Lỗi: ${error.message}`, 'error');
    }
}

async function testSendNotification() {
    try {
        const token = getJWTToken();
        const userId = getUserId();

        showStatus('⏳ Đang gửi...', 'info');

        const response = await fetch(`${API_BASE_URL}/notifications/push`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                userId: userId,
                content: `Test notification lúc ${new Date().toLocaleTimeString()}`,
                link: 'http://localhost:8080/test'
            })
        });

        if (response.ok) {
            showStatus('✅ Gửi thành công!', 'success');
        } else {
            const error = await response.json();
            throw new Error(error.message);
        }
    } catch (error) {
        showStatus(`❌ Lỗi: ${error.message}`, 'error');
    }
}

// Notification Management
async function loadNotifications() {
    try {
        const token = getJWTToken();
        const userId = getUserId();

        const response = await fetch(`${API_BASE_URL}/notifications/${userId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const result = await response.json();
            notifications = result.data || [];
            renderNotifications();
        }
    } catch (error) {
        console.error('Load notifications error:', error);
    }
}

function addNotificationToList(notificationData) {
    // Tạo notification object mới
    const newNotification = {
        id: Date.now(), // Temporary ID
        content: notificationData.body,
        link: notificationData.url,
        createdAt: new Date().toISOString(),
        isRead: false
    };

    // Thêm vào đầu danh sách
    notifications.unshift(newNotification);
    renderNotifications();

    // Reload từ server để có data chính xác
    setTimeout(() => loadNotifications(), 1000);
}

function renderNotifications() {
    const container = document.getElementById('notifications-list');

    if (!notifications || notifications.length === 0) {
        container.innerHTML = '<div class="no-notifications">Chưa có thông báo</div>';
        return;
    }

    const html = notifications.map(noti => `
        <div class="notification-item ${!noti.isRead ? 'unread' : ''}" data-id="${noti.id}">
            <div class="notification-content">${noti.content}</div>
            ${noti.link ? `<a href="${noti.link}" target="_blank" class="notification-link">👉 Xem chi tiết</a>` : ''}
            <div class="notification-time">⏰ ${new Date(noti.createdAt).toLocaleString()}</div>
            ${!noti.isRead ? '<button onclick="markAsRead(' + noti.id + ')" class="mark-read-btn">✓ Đánh dấu đã đọc</button>' : ''}
        </div>
    `).join('');

    container.innerHTML = html;
    updateUnreadCount();
}

async function markAsRead(notificationId) {
    try {
        const token = getJWTToken();

        const response = await fetch(`${API_BASE_URL}/notifications/read/${notificationId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            // Cập nhật local state
            const notification = notifications.find(n => n.id === notificationId);
            if (notification) {
                notification.isRead = true;
                renderNotifications();
            }
        }
    } catch (error) {
        console.error('Mark as read error:', error);
    }
}

function updateUnreadCount() {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    document.getElementById('unread-count').textContent = unreadCount > 0 ? `(${unreadCount} chưa đọc)` : '';
}

// Utility function
function urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
