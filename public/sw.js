const CACHE_NAME = 'eatneo-hybrid-v7.0';
const STATIC_CACHE = 'eatneo-static-v7.0';
const DYNAMIC_CACHE = 'eatneo-dynamic-v7.0';

// Ressources complètes à télécharger
const ALL_RESOURCES = [
  '/', '/boissons', '/panier', '/admin', '/historique', '/notifications',
  '/manifest.json', '/logo.jpg', '/icon-192x192.png', '/icon-512x512.png',
  '/poulet_DG.jpg', '/fanta.jpg', '/reaktor.jpg', '/bouillon.jpeg', '/poulet_braisé.jpeg',
  '/poisson.jpeg', '/plantain-tapé.jpeg', '/taro.jpeg', '/ndolé.jpg', '/saucisse.jpg',
  '/panné.png', '/foie.jpg', '/barBraisé.jpeg', '/barCalada.jpeg', '/carpe.jpeg',
  '/thé-citron.jpeg', '/thé-menthe.jpeg', '/thé-vert.jpeg', '/tasse-lait.jpeg',
  '/omelette.jpeg', '/omelette-sardine.jpeg', '/omelette-saucisson.webp',
  '/poulet-yassa.jpeg', '/frite.jpeg', '/pomme-vapeur.webp', '/plantain-vapeur.jpeg',
  '/platain-frie.webp', '/Ndole-poisson-fume.jpg', '/pomme-poisson.jpeg',
  '/pomme-viande.jpeg', '/Riz-pilaf-au-Thermomix.jpg', '/rognons-de-boeuf.webp',
  '/emince-de-boeuf.jpeg', '/tripes.jpeg', '/eru.jpeg',
  '/icons8-utilisateur-50.png', '/icons8-profile-50.png', '/icons8-déconnexion-100.png',
  '/icons8-multiplier-100.png', '/icons8-poubelle-64.png', '/icons8-bar-alimentaire-50.png',
  '/icons8-food-bar-50.png', '/icons8-search-50.png', '/icons8-verre-à-vin-50.png',
  '/icons8-verre-à-vin2-50.png', '/icons8-shopping-cart-50.png',
  '/icons8-shopping-cart-50 (1).png', '/icons8-whatsapp-50.png',
  '/icons8-position-50.png', '/icons8-téléphone-50.png', '/icons8-nouveau-message-50.png',
  '/icons8-flèche-haut-100.png', '/icons8-facebook-100.png', '/icons8-tiktok-50.png',
  '/icons8-requirements-50.png', '/icons8-requirements-50 (1).png',
  '/icons8-passé-100.png', '/icons8-passé-100 (1).png', '/icons8-checklist-50.png',
  '/icons8-checklist-50 (1).png', '/icons8-arrière-50.png'
];

let isOnline = true;

// Installation - Téléchargement complet
self.addEventListener('install', event => {
  console.log('SW v7.0: Installation - Mode hybride online/offline');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        return Promise.allSettled(
          ALL_RESOURCES.map(async (resource) => {
            try {
              const response = await fetch(resource, { cache: 'no-cache' });
              if (response.ok) {
                await cache.put(resource, response);
                return true;
              }
            } catch (error) {
              console.warn('Cache failed:', resource);
            }
            return false;
          })
        );
      })
      .then(() => {
        console.log('SW: Application mise en cache - Prête offline');
        return self.skipWaiting();
      })
  );
});

// Activation
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(names => 
        Promise.all(names.map(name => 
          !name.includes('v7.0') ? caches.delete(name) : null
        ))
      ),
      self.clients.claim()
    ]).then(() => {
      console.log('SW v7.0: Activé - Mode hybride');
      startSyncProcess();
    })
  );
});

// Détection de connexion
function checkOnlineStatus() {
  return fetch('/manifest.json', { 
    method: 'HEAD',
    cache: 'no-cache',
    signal: AbortSignal.timeout(3000)
  })
  .then(() => {
    if (!isOnline) {
      isOnline = true;
      console.log('SW: Connexion rétablie - Synchronisation...');
      syncOfflineData();
    }
    return true;
  })
  .catch(() => {
    if (isOnline) {
      isOnline = false;
      console.log('SW: Mode offline détecté');
    }
    return false;
  });
}

// Synchronisation des données offline
async function syncOfflineData() {
  try {
    const clients = await self.clients.matchAll();
    
    for (const client of clients) {
      client.postMessage({
        type: 'SYNC_REQUEST',
        message: 'Synchronisation des données offline'
      });
    }
    
    console.log('SW: Demande de synchronisation envoyée aux clients');
  } catch (error) {
    console.error('SW: Erreur synchronisation:', error);
  }
}

// Processus de synchronisation périodique
function startSyncProcess() {
  // Vérifier la connexion toutes les 30 secondes
  setInterval(() => {
    checkOnlineStatus();
  }, 30000);
  
  // Vérification initiale
  checkOnlineStatus();
}

// Gestion des requêtes - HYBRIDE
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  if (request.method !== 'GET') return;
  
  // Ignorer domaines externes (sauf Firebase)
  if (!url.origin.includes(self.location.origin) && 
      !url.href.includes('firestore.googleapis.com') && 
      !url.href.includes('firebase')) {
    return;
  }

  // STRATÉGIES PAR TYPE DE RESSOURCE

  // 1. PAGES - Cache First avec mise à jour en arrière-plan
  if (url.pathname === '/' || 
      ['/boissons', '/panier', '/admin', '/historique', '/notifications'].includes(url.pathname)) {
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          // Servir depuis le cache immédiatement
          if (cachedResponse) {
            // Mise à jour en arrière-plan si online
            if (isOnline) {
              fetch(request)
                .then(networkResponse => {
                  if (networkResponse.ok) {
                    caches.open(STATIC_CACHE)
                      .then(cache => cache.put(request, networkResponse.clone()));
                  }
                })
                .catch(() => {});
            }
            return cachedResponse;
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
              return new Response(`
                <!DOCTYPE html>
                <html>
                <head><title>EAT NEO - Offline</title></head>
                <body style="font-family:Arial;text-align:center;padding:50px;background:#2e7d32;color:white;">
                  <h1>🍽️ EAT NEO</h1>
                  <p>Mode offline - Redirection vers l'accueil</p>
                  <script>setTimeout(() => window.location.href='/', 2000);</script>
                </body>
                </html>
              `, { headers: { 'Content-Type': 'text/html' } });
            });
        })
    );
    return;
  }

  // 2. FIREBASE - Network First avec cache de secours
  if (url.href.includes('firestore.googleapis.com') || url.href.includes('firebase')) {
    event.respondWith(
      fetch(request, { signal: AbortSignal.timeout(5000) })
        .then(networkResponse => {
          if (networkResponse.ok) {
            // Mettre en cache les réponses Firebase
            caches.open(DYNAMIC_CACHE)
              .then(cache => cache.put(request, networkResponse.clone()));
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback vers cache ou données offline
          return caches.match(request)
            .then(cachedResponse => {
              if (cachedResponse) return cachedResponse;
              
              return new Response(JSON.stringify({
                offline: true,
                message: 'Données Firebase non disponibles - Mode offline',
                timestamp: new Date().toISOString()
              }), {
                headers: { 'Content-Type': 'application/json' }
              });
            });
        })
    );
    return;
  }

  // 3. IMAGES - Cache First
  if (request.url.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/)) {
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          
          return fetch(request)
            .then(networkResponse => {
              if (networkResponse.ok) {
                caches.open(DYNAMIC_CACHE)
                  .then(cache => cache.put(request, networkResponse.clone()));
              }
              return networkResponse;
            })
            .catch(() => {
              return new Response(`
                <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
                  <rect width="200" height="200" fill="#f0f0f0" stroke="#ccc"/>
                  <text x="100" y="100" text-anchor="middle" fill="#999" font-size="14">Offline</text>
                </svg>
              `, { headers: { 'Content-Type': 'image/svg+xml' } });
            });
        })
    );
    return;
  }

  // 4. NEXT.JS ASSETS - Cache First avec mise à jour
  if (url.pathname.startsWith('/_next/') || request.url.match(/\.(css|js)$/)) {
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Mise à jour en arrière-plan
            if (isOnline) {
              fetch(request)
                .then(networkResponse => {
                  if (networkResponse.ok) {
                    caches.open(STATIC_CACHE)
                      .then(cache => cache.put(request, networkResponse.clone()));
                  }
                })
                .catch(() => {});
            }
            return cachedResponse;
          }
          
          return fetch(request)
            .then(networkResponse => {
              if (networkResponse.ok) {
                caches.open(STATIC_CACHE)
                  .then(cache => cache.put(request, networkResponse.clone()));
              }
              return networkResponse;
            })
            .catch(() => {
              const contentType = request.url.endsWith('.css') ? 'text/css' : 'application/javascript';
              return new Response('/* Offline fallback */', { 
                headers: { 'Content-Type': contentType } 
              });
            });
        })
    );
    return;
  }

  // 5. AUTRES REQUÊTES - Network First
  event.respondWith(
    fetch(request)
      .then(networkResponse => {
        if (networkResponse.ok) {
          caches.open(DYNAMIC_CACHE)
            .then(cache => cache.put(request, networkResponse.clone()));
        }
        return networkResponse;
      })
      .catch(() => 
        caches.match(request)
          .then(response => response || 
            new Response('Offline', { status: 503 })
          )
      )
  );
});

// Messages des clients
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data?.type === 'SYNC_COMPLETE') {
    console.log('SW: Synchronisation terminée par le client');
  }
  
  if (event.data?.type === 'CHECK_ONLINE') {
    checkOnlineStatus().then(online => {
      event.ports[0]?.postMessage({ online });
    });
  }
});

// Synchronisation en arrière-plan
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});

console.log('SW v7.0: Mode hybride - Online/Offline avec synchronisation');