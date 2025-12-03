// Service Worker for Push Notifications
const CACHE_NAME = 'ai-foodies-v1';
const urlsToCache = [
  '/',
  '/style.css',
  '/script.js'
];

self.addEventListener('install', (event) => {
  console.log('🛠️ Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
});

self.addEventListener('push', (event) => {
  console.log('📱 Push notification received');
  
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: data.tag || 'new-order',
    timestamp: data.timestamp ? new Date(data.timestamp).getTime() : Date.now(),
    data: data.data,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'view',
        title: 'View Order'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('📱 Notification clicked');
  event.notification.close();

  if (event.action === 'view') {
    // Focus on the admin dashboard
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes('/') && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  } else if (event.action === 'dismiss') {
    // Notification dismissed, do nothing
    console.log('Notification dismissed');
  } else {
    // Default click behavior
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes('/') && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
async function initializeServiceWorker() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
            // Make sure the path is correct - should be '/sw.js' if in public folder
            const registration = await navigator.serviceWorker.register('/sw.js');
            serviceWorkerRegistration = registration;
            console.log('✅ Service Worker registered');
            
            // Initialize push notifications only if admin is logged in
            if (isAdminLoggedIn) {
                await initializePushNotifications();
            }
        } catch (error) {
            console.log('❌ Service Worker registration failed:', error);
        }
    } else {
        console.log('ℹ️ Service Worker or Push Manager not supported');
    }
}
