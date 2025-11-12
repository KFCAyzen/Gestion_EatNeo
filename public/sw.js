const CACHE_NAME = 'eatneo-v3.0';
const STATIC_CACHE = 'eatneo-static-v3.0';
const DYNAMIC_CACHE = 'eatneo-dynamic-v3.0';
const OFFLINE_CACHE = 'eatneo-offline-v3.0';

// Ressources critiques pour le fonctionnement hors ligne
const CORE_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.jpg',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/offline.html'
];

// Toutes les pages de l'application
const APP_PAGES = [
  '/',
  '/boissons',
  '/panier',
  '/admin',
  '/historique',
  '/notifications'
];

// Ressources CSS et JS critiques
const STATIC_RESOURCES = [
  '/styles/index.css',
  '/styles/App.css',
  '/styles/SplashScreen.css',
  '/styles/UniversalHeader.css',
  '/styles/AdminPage.css',
  '/styles/CartPage.css',
  '/styles/NotificationsPage.css'
];

// Images du menu et icônes
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

// Toutes les ressources à mettre en cache lors de l'installation
const ALL_CACHE_RESOURCES = [
  ...CORE_ASSETS,
  ...APP_PAGES,
  ...STATIC_RESOURCES,
  ...MENU_IMAGES
];



// Installation du Service Worker - Cache TOUT lors de l'installation
self.addEventListener('install', event => {
  console.log('Service Worker: Installation démarrée - Mise en cache de toutes les ressources');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Mise en cache de', ALL_CACHE_RESOURCES.length, 'ressources');
        
        // Essayer de mettre en cache toutes les ressources
        return Promise.allSettled(
          ALL_CACHE_RESOURCES.map(async (resource) => {
            try {
              const response = await fetch(resource, { 
                cache: 'no-cache',
                mode: 'cors',
                credentials: 'same-origin'
              });
              
              if (response.ok) {
                await cache.put(resource, response);
                console.log('Cached:', resource);
              } else {
                console.warn('Failed to fetch:', resource, response.status);
              }
            } catch (error) {
              console.warn('Error caching:', resource, error.message);
            }
          })
        );
      })
      .then((results) => {
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        console.log(`Service Worker: Installation terminée - ${successful} ressources mises en cache, ${failed} échecs`);
        
        // Forcer l'activation immédiate
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Erreur d\'installation:', error);
        // Continuer même en cas d'erreur
        return self.skipWaiting();
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Activation démarrée');
  
  event.waitUntil(
    Promise.all([
      // Nettoyer les anciens caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!cacheName.includes('v3.0')) {
              console.log('Service Worker: Suppression ancien cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Prendre le contrôle immédiatement
      self.clients.claim()
    ])
    .then(() => {
      console.log('Service Worker: Activation terminée - Application prête hors ligne');
      
      // Notifier tous les clients que l'app est prête
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_READY',
            message: 'Application prête pour utilisation hors ligne'
          });
        });
      });
    })
  );
});


  
  // Cache First pour toutes les ressources mises en cache
  if (ALL_CACHE_RESOURCES.some(resource => url.pathname === resource)) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            return response;
          }
          
          // Si pas en cache, essayer le réseau
          return fetch(request)
            .then(networkResponse => {
              if (networkResponse.ok) {
                caches.open(STATIC_CACHE)
                  .then(cache => cache.put(request, networkResponse.clone()));
              }
              return networkResponse;
            })
            .catch(() => {
              // Fallback pour les ressources critiques
              if (url.pathname === '/') {
                return new Response(`
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <title>EAT NEO - Hors Ligne</title>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                  </head>
                  <body>
                    <div style="text-align: center; padding: 50px; font-family: Arial;">
                      <h1>EAT NEO</h1>
                      <p>Application disponible hors ligne</p>
                      <p>Chargement en cours...</p>
                      <script>window.location.reload();</script>
                    </div>
                  </body>
                  </html>
                `, { 
                  status: 200,
                  headers: { 'Content-Type': 'text/html' }
                });
              }
              return new Response('Resource not available offline', { status: 503 });
            });
        })
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
        
        return fetch(request, { 
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000) // Timeout de 5 secondes
        })
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
              return caches.match('/').then(response => {
                if (response) return response;
                // Retourner une page offline basique
                return new Response(`
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <title>EAT NEO - Mode Hors Ligne</title>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                      body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                      .offline { color: #2e7d32; }
                    </style>
                  </head>
                  <body>
                    <div class="offline">
                      <h1>EAT NEO</h1>
                      <p>Mode hors ligne activé</p>
                      <p>L'application fonctionne avec les données locales</p>
                      <button onclick="window.location.reload()">Actualiser</button>
                    </div>
                  </body>
                  </html>
                `, { 
                  status: 200,
                  headers: { 'Content-Type': 'text/html' }
                });
              });
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

// Gestion des messages des clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Pré-chargement des ressources critiques
self.addEventListener('fetch', event => {
  // Intercepter les requêtes pour les ressources critiques
  if (event.request.destination === 'document') {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          
          return fetch(event.request)
            .then(networkResponse => {
              // Mettre en cache les nouvelles pages
              if (networkResponse.ok) {
                caches.open(STATIC_CACHE)
                  .then(cache => cache.put(event.request, networkResponse.clone()));
              }
              return networkResponse;
            })
            .catch(() => {
              // Retourner la page offline si disponible
              return caches.match('/offline.html')
                .then(offlineResponse => {
                  return offlineResponse || new Response(
                    'Application hors ligne - Veuillez réessayer plus tard',
                    { status: 503, statusText: 'Service Unavailable' }
                  );
                });
            });
        })
    );
    return;
  }
  
  // Continuer avec la logique existante pour les autres requêtes
  const { request } = event;
  const url = new URL(request.url);
  
  if (request.method !== 'GET') return;

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