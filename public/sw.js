const CACHE_NAME = 'eatneo-v2.0';
const STATIC_CACHE = 'eatneo-static-v2.0';
const DYNAMIC_CACHE = 'eatneo-dynamic-v2.0';
const OFFLINE_CACHE = 'eatneo-offline-v2.0';

const CORE_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.jpg',
  '/icon-192x192.png'
];

const MENU_IMAGES = [
  '/poulet_DG.jpg', '/fanta.jpg', '/reaktor.jpg', '/icons8-utilisateur-50.png',
  '/icons8-profile-50.png', '/icons8-déconnexion-100.png', '/icons8-multiplier-100.png',
  '/icons8-poubelle-64.png', '/icons8-bar-alimentaire-50.png', '/icons8-food-bar-50.png',
  '/icons8-search-50.png', '/icons8-verre-à-vin-50.png', '/icons8-verre-à-vin2-50.png',
  '/icons8-shopping-cart-50.png', '/icons8-shopping-cart-50 (1).png', '/icons8-whatsapp-50.png',
  '/icons8-position-50.png', '/icons8-téléphone-50.png', '/icons8-nouveau-message-50.png',
  '/icons8-flèche-haut-100.png', '/icons8-facebook-100.png', '/icons8-tiktok-50.png',
  '/icons8-requirements-50.png', '/icons8-requirements-50 (1).png', '/icons8-passé-100.png',
  '/icons8-passé-100 (1).png', '/icons8-checklist-50.png', '/icons8-checklist-50 (1).png',
  '/icons8-arrière-50.png', '/bouillon.jpeg', '/poulet_braisé.jpeg', '/poisson.jpeg',
  '/plantain-tapé.jpeg', '/taro.jpeg', '/ndolé.jpg', '/saucisse.jpg', '/panné.png',
  '/foie.jpg', '/barBraisé.jpeg', '/barCalada.jpeg', '/carpe.jpeg', '/thé-citron.jpeg',
  '/thé-menthe.jpeg', '/thé-vert.jpeg', '/tasse-lait.jpeg', '/omelette.jpeg',
  '/omelette-sardine.jpeg', '/omelette-saucisson.webp', '/poulet-yassa.jpeg',
  '/frite.jpeg', '/pomme-vapeur.webp', '/plantain-vapeur.jpeg', '/platain-frie.webp',
  '/Ndole-poisson-fume.jpg', '/pomme-poisson.jpeg', '/pomme-viande.jpeg',
  '/Riz-pilaf-au-Thermomix.jpg', '/rognons-de-boeuf.webp', '/emince-de-boeuf.jpeg',
  '/tripes.jpeg', '/eru.jpeg'
];

const PAGES = [
  '/admin', '/boissons', '/historique', '/logs', '/notifications', '/panier'
];

// Installation du Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => cache.addAll(CORE_ASSETS)),
      caches.open(DYNAMIC_CACHE).then(cache => cache.addAll(MENU_IMAGES)),
      caches.open(OFFLINE_CACHE).then(cache => cache.addAll(PAGES))
    ])
    .then(() => self.skipWaiting())
    .catch(error => console.error('Cache install error:', error))
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

// Stratégie de cache optimisée
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  if (request.method !== 'GET') return;
  
  // Cache First pour assets critiques
  if (CORE_ASSETS.some(asset => url.pathname === asset) || 
      MENU_IMAGES.some(img => url.pathname === img)) {
    event.respondWith(
      caches.match(request)
        .then(response => response || fetch(request)
          .then(networkResponse => {
            caches.open(STATIC_CACHE)
              .then(cache => cache.put(request, networkResponse.clone()));
            return networkResponse;
          })
          .catch(() => new Response('Offline', { status: 503 }))
        )
    );
    return;
  }
  
  // Cache First pour toutes les images
  if (request.url.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/)) {
    event.respondWith(
      caches.match(request)
        .then(response => response || fetch(request)
          .then(networkResponse => {
            caches.open(DYNAMIC_CACHE)
              .then(cache => cache.put(request, networkResponse.clone()));
            return networkResponse;
          })
        )
    );
    return;
  }
  
  // Network First avec fallback pour Firebase
  if (request.url.includes('firestore.googleapis.com') || 
      request.url.includes('firebase')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            caches.open(DYNAMIC_CACHE)
              .then(cache => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => 
          caches.match(request)
            .then(response => response || 
              new Response(JSON.stringify({ offline: true }), {
                headers: { 'Content-Type': 'application/json' }
              })
            )
        )
    );
    return;
  }
  
  // Cache First pour pages et API
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) return response;
        
        return fetch(request)
          .then(networkResponse => {
            if (networkResponse.ok) {
              caches.open(OFFLINE_CACHE)
                .then(cache => cache.put(request, networkResponse.clone()));
            }
            return networkResponse;
          })
          .catch(() => {
            // Fallback pour pages
            if (url.pathname.startsWith('/')) {
              return caches.match('/').then(response => 
                response || new Response('App offline', { 
                  status: 503,
                  headers: { 'Content-Type': 'text/html' }
                })
              );
            }
            return new Response('Offline', { status: 503 });
          });
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

// Synchronisation optimisée
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  try {
    const offlineData = await getAllOfflineData();
    for (const item of offlineData) {
      await syncDataItem(item);
    }
  } catch (error) {
    console.error('Sync error:', error);
  }
}

async function getAllOfflineData() {
  const data = [];
  const clients = await self.clients.matchAll();
  
  for (const client of clients) {
    try {
      const storage = await client.postMessage({ type: 'GET_OFFLINE_DATA' });
      if (storage) data.push(...storage);
    } catch (e) {}
  }
  
  return data;
}

async function syncDataItem(item) {
  try {
    if (item.key?.includes('order')) {
      await syncOrder(item.data);
    }
  } catch (error) {
    console.error('Item sync error:', error);
  }
}

async function syncOrder(order) {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  });
  
  if (!response.ok) {
    throw new Error('Order sync failed');
  }
  
  return response.json();
}