const CACHE_NAME = 'eatneo-v1.2';
const STATIC_CACHE = 'eatneo-static-v1.2';
const DYNAMIC_CACHE = 'eatneo-dynamic-v1.2';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.jpg',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/_next/static/css/app/layout.css',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/main.js'
];

// Installation du Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Stratégie de cache
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') return;
  
  // Stratégie Cache First pour les assets statiques
  if (STATIC_ASSETS.some(asset => request.url.includes(asset))) {
    event.respondWith(
      caches.match(request)
        .then(response => response || fetch(request))
    );
    return;
  }
  
  // Stratégie Network First pour les données Firebase
  if (request.url.includes('firestore.googleapis.com')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then(cache => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }
  
  // Stratégie Stale While Revalidate pour le reste
  event.respondWith(
    caches.match(request)
      .then(response => {
        const fetchPromise = fetch(request)
          .then(networkResponse => {
            caches.open(DYNAMIC_CACHE)
              .then(cache => cache.put(request, networkResponse.clone()));
            return networkResponse;
          });
        return response || fetchPromise;
      })
  );
});

// Gestion des notifications push
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'Nouvelle notification EAT NEO',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'eatneo-notification',
    data: data.data || {},
    actions: [
      {
        action: 'view',
        title: 'Voir',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Fermer'
      }
    ],
    requireInteraction: true,
    vibrate: [200, 100, 200]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'EAT NEO', options)
  );
});

// Gestion des clics sur notifications
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      clients.openWindow('/notifications')
    );
  }
});

// Synchronisation en arrière-plan
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});

// Fonction de synchronisation des données hors ligne
async function syncOfflineData() {
  try {
    const offlineOrders = await getOfflineOrders();
    for (const order of offlineOrders) {
      await sendOrderToServer(order);
      await removeOfflineOrder(order.id);
    }
  } catch (error) {
    console.error('Erreur lors de la synchronisation:', error);
  }
}

// Récupérer les commandes hors ligne
async function getOfflineOrders() {
  const cache = await caches.open('offline-orders');
  const requests = await cache.keys();
  const orders = [];
  
  for (const request of requests) {
    const response = await cache.match(request);
    const order = await response.json();
    orders.push(order);
  }
  
  return orders;
}

// Envoyer une commande au serveur
async function sendOrderToServer(order) {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(order)
  });
  
  if (!response.ok) {
    throw new Error('Erreur lors de l\'envoi de la commande');
  }
  
  return response.json();
}

// Supprimer une commande hors ligne
async function removeOfflineOrder(orderId) {
  const cache = await caches.open('offline-orders');
  await cache.delete(`/offline-order/${orderId}`);
}