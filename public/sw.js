const CACHE_NAME = 'eat-neo-v1';
const urlsToCache = [
  '/',
  '/boissons',
  '/panier',
  '/logo.jpg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});

// Gestion des notifications push
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/notifications')
  );
});

self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/logo.jpg',
      badge: '/logo.jpg',
      tag: 'eat-neo-notification',
      data: data.data || {}
    };
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});