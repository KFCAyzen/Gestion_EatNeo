const CACHE_NAME = 'eatneo-hybrid-v7.4';
const STATIC_CACHE = 'eatneo-static-v7.4';
const DYNAMIC_CACHE = 'eatneo-dynamic-v7.4';

// Base Firebase Storage
const FIREBASE_BASE = 'https://firebasestorage.googleapis.com/v0/b/menu-et-gestion-stock-ea-14886.firebasestorage.app/o/images%2F';

// Images Firebase à mettre en cache
const FIREBASE_IMAGES = [
  'bouillon.jpeg', 'poulet_braisé.jpeg', 'poisson.jpeg', 'plantain-tapé.jpeg', 'taro.jpeg',
  'ndolé.jpg', 'saucisse.jpg', 'panné.png', 'foie.jpg', 'barBraisé.jpeg', 'barCalada.jpeg',
  'carpe.jpeg', 'thé-citron.jpeg', 'thé-menthe.jpeg', 'thé-vert.jpeg', 'tasse-lait.jpeg',
  'omelette.jpeg', 'omelette-sardine.jpeg', 'omelette-saucisson.webp', 'poulet-yassa.jpeg',
  'frite.jpeg', 'pomme-vapeur.webp', 'plantain-vapeur.jpeg', 'platain-frie.webp',
  'Ndole-poisson-fume.jpg', 'pomme-poisson.jpeg', 'pomme-viande.jpeg', 'Riz-pilaf-au-Thermomix.jpg',
  'rognons-de-boeuf.webp', 'emince-de-boeuf.jpeg', 'tripes.jpeg', 'eru.jpeg'
].map(img => `${FIREBASE_BASE}${encodeURIComponent(img)}?alt=media`);

// Ressources complètes à télécharger
const ALL_RESOURCES = [
  '/', '/boissons', '/panier', '/admin', '/historique', '/notifications',
  '/manifest.json', '/logo.jpg', '/icon-192x192.png', '/icon-512x512.png',
  '/poulet_DG.jpg', '/fanta.jpg', '/reaktor.jpg',
  '/icons8-utilisateur-50.png', '/icons8-profile-50.png', '/icons8-déconnexion-100.png',
  '/icons8-multiplier-100.png', '/icons8-poubelle-64.png', '/icons8-bar-alimentaire-50.png',
  '/icons8-food-bar-50.png', '/icons8-search-50.png', '/icons8-verre-à-vin-50.png',
  '/icons8-verre-à-vin2-50.png', '/icons8-shopping-cart-50.png',
  '/icons8-shopping-cart-50 (1).png', '/icons8-whatsapp-50.png',
  '/icons8-position-50.png', '/icons8-téléphone-50.png', '/icons8-nouveau-message-50.png',
  '/icons8-flèche-haut-100.png', '/icons8-facebook-100.png', '/icons8-tiktok-50.png',
  '/icons8-requirements-50.png', '/icons8-requirements-50 (1).png',
  '/icons8-passé-100.png', '/icons8-passé-100 (1).png', '/icons8-checklist-50.png',
  '/icons8-checklist-50 (1).png', '/icons8-arrière-50.png',
  ...FIREBASE_IMAGES
];

let isOnline = true;

// Installation - Téléchargement complet avec indicateur
self.addEventListener('install', event => {
  console.log('SW v7.4: Installation - Mode hybride online/offline');
  
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      let completed = 0;
      const total = ALL_RESOURCES.length;
      
      // Notifier le début de l'installation
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'INSTALL_START',
          total: total
        });
      });
      
      const results = await Promise.allSettled(
        ALL_RESOURCES.map(async (resource) => {
          try {
            const response = await fetch(resource, { cache: 'no-cache' });
            if (response.ok) {
              await cache.put(resource, response.clone());
              completed++;
              
              // Notifier le progrès
              const clients = await self.clients.matchAll();
              clients.forEach(client => {
                client.postMessage({
                  type: 'INSTALL_PROGRESS',
                  completed: completed,
                  total: total,
                  resource: resource
                });
              });
              
              return true;
            }
          } catch (error) {
            console.warn('Cache failed:', resource);
          }
          return false;
        })
      );
      
      // Notifier la fin de l'installation
      const finalClients = await self.clients.matchAll();
      finalClients.forEach(client => {
        client.postMessage({
          type: 'INSTALL_COMPLETE',
          completed: completed,
          total: total
        });
      });
      
      console.log('SW: Application mise en cache - Prête offline');
      return self.skipWaiting();
    })()
  );
});

// Activation
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(names => 
        Promise.all(names.map(name => 
          !name.includes('v7.4') ? caches.delete(name) : null
        ))
      ),
      self.clients.claim()
    ]).then(() => {
      console.log('SW v7.4: Activé - Mode hybride');
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

// Synchronisation des données offline et nouveaux articles
async function syncOfflineData() {
  try {
    const clients = await self.clients.matchAll();
    
    // Synchroniser les nouveaux articles et images
    await syncNewMenuItems();
    
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

// Synchroniser les nouveaux articles du menu
async function syncNewMenuItems() {
  try {
    console.log('SW: Synchronisation des nouveaux articles...');
    
    // Récupérer les articles depuis Firebase
    const response = await fetch('https://firestore.googleapis.com/v1/projects/menu-et-gestion-stock-ea-14886/databases/(default)/documents/menu/articles', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log('SW: Impossible de récupérer les articles, utilisation du cache');
      return;
    }
    
    const data = await response.json();
    const articles = data.documents || [];
    
    // Extraire les nouvelles images à mettre en cache
    const newImages = [];
    const cache = await caches.open(STATIC_CACHE);
    
    for (const article of articles) {
      const fields = article.fields || {};
      const imageUrl = fields.image?.stringValue;
      
      if (imageUrl && (imageUrl.includes('firebasestorage.googleapis.com') || imageUrl.startsWith('/'))) {
        // Vérifier si l'image n'est pas déjà en cache
        const cachedImage = await cache.match(imageUrl);
        if (!cachedImage) {
          newImages.push(imageUrl);
        }
      }
    }
    
    // Mettre en cache les nouvelles images
    if (newImages.length > 0) {
      console.log(`SW: Mise en cache de ${newImages.length} nouvelles images`);
      
      const imagePromises = newImages.map(async (imageUrl) => {
        try {
          const imageResponse = await fetch(imageUrl);
          if (imageResponse.ok) {
            await cache.put(imageUrl, imageResponse.clone());
            console.log(`SW: Image mise en cache: ${imageUrl}`);
          }
        } catch (error) {
          console.warn(`SW: Erreur cache image ${imageUrl}:`, error);
        }
      });
      
      await Promise.allSettled(imagePromises);
      
      // Notifier les clients des nouvelles images
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'NEW_IMAGES_CACHED',
          count: newImages.length,
          images: newImages
        });
      });
    }
    
  } catch (error) {
    console.error('SW: Erreur synchronisation articles:', error);
  }
}

// Processus de synchronisation périodique
function startSyncProcess() {
  // Vérifier la connexion toutes les 30 secondes
  setInterval(() => {
    checkOnlineStatus();
  }, 30000);
  
  // Synchroniser les nouveaux articles toutes les 5 minutes quand online
  setInterval(() => {
    if (isOnline) {
      syncNewMenuItems();
    }
  }, 300000); // 5 minutes
  
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

  // 1. PAGES - Cache First avec fallback vers accueil
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
                  if (networkResponse.ok && networkResponse.body) {
                    const responseClone = networkResponse.clone();
                    caches.open(STATIC_CACHE)
                      .then(cache => cache.put(request, responseClone))
                      .catch(() => {});
                  }
                })
                .catch(() => {});
            }
            return cachedResponse;
          }
          
          // Si pas en cache, essayer le réseau
          return fetch(request)
            .then(networkResponse => {
              if (networkResponse.ok && networkResponse.body) {
                const responseClone = networkResponse.clone();
                caches.open(STATIC_CACHE)
                  .then(cache => cache.put(request, responseClone))
                  .catch(() => {});
              }
              return networkResponse;
            })
            .catch(() => {
              // Fallback vers la page d'accueil si elle est en cache
              if (url.pathname !== '/') {
                return caches.match('/')
                  .then(homeResponse => {
                    if (homeResponse) {
                      console.log(`SW: Redirection ${url.pathname} -> / (offline)`);
                      return homeResponse;
                    }
                    // Si même l'accueil n'est pas en cache, page offline minimale
                    return new Response(`
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <title>EAT NEO - Offline</title>
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                      </head>
                      <body style="font-family:Arial;text-align:center;padding:20px;background:#f5f5f5;">
                        <div style="max-width:400px;margin:0 auto;padding:40px 20px;background:white;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
                          <h1 style="color:#2e7d32;margin-bottom:20px;">🍽️ EAT NEO</h1>
                          <p style="color:#666;margin-bottom:30px;">Application en mode offline</p>
                          <button onclick="window.location.reload()" style="background:#2e7d32;color:white;border:none;padding:12px 24px;border-radius:6px;cursor:pointer;font-size:16px;">Réessayer</button>
                        </div>
                      </body>
                      </html>
                    `, { headers: { 'Content-Type': 'text/html' } });
                  });
              }
              
              // Pour la page d'accueil, page offline simple
              return new Response(`
                <!DOCTYPE html>
                <html>
                <head>
                  <title>EAT NEO - Offline</title>
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                </head>
                <body style="font-family:Arial;text-align:center;padding:20px;background:#f5f5f5;">
                  <div style="max-width:400px;margin:0 auto;padding:40px 20px;background:white;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
                    <h1 style="color:#2e7d32;margin-bottom:20px;">🍽️ EAT NEO</h1>
                    <p style="color:#666;margin-bottom:30px;">Application en mode offline</p>
                    <button onclick="window.location.reload()" style="background:#2e7d32;color:white;border:none;padding:12px 24px;border-radius:6px;cursor:pointer;font-size:16px;">Réessayer</button>
                  </div>
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

  // 3. IMAGES - Cache First avec fallback amélioré
  if (request.url.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/) || request.url.includes('firebasestorage.googleapis.com')) {
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          
          return fetch(request)
            .then(networkResponse => {
              if (networkResponse.ok && networkResponse.body) {
                const responseClone = networkResponse.clone();
                caches.open(STATIC_CACHE)
                  .then(cache => cache.put(request, responseClone))
                  .catch(() => {});
              }
              return networkResponse;
            })
            .catch(() => {
              // Fallback SVG pour images manquantes
              return new Response(`
                <svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150">
                  <rect width="200" height="150" fill="#f5f5f5" stroke="#ddd" stroke-width="2" rx="8"/>
                  <circle cx="100" cy="60" r="20" fill="#ccc"/>
                  <path d="M60 100 L100 80 L140 100 L180 90 L180 130 L20 130 Z" fill="#e0e0e0"/>
                  <text x="100" y="140" text-anchor="middle" fill="#999" font-size="12" font-family="Arial">Image offline</text>
                </svg>
              `, { 
                headers: { 'Content-Type': 'image/svg+xml' },
                status: 200
              });
            });
        })
    );
    return;
  }

  // 4. NEXT.JS ASSETS - Cache First avec gestion des chunks
  if (url.pathname.startsWith('/_next/') || request.url.match(/\.(css|js)$/)) {
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Mise à jour en arrière-plan sans cloner si offline
            if (isOnline) {
              fetch(request)
                .then(networkResponse => {
                  if (networkResponse.ok && networkResponse.body) {
                    const responseClone = networkResponse.clone();
                    caches.open(STATIC_CACHE)
                      .then(cache => cache.put(request, responseClone))
                      .catch(() => {});
                  }
                })
                .catch(() => {});
            }
            return cachedResponse;
          }
          
          // Si pas en cache, essayer le réseau
          return fetch(request)
            .then(networkResponse => {
              if (networkResponse.ok && networkResponse.body) {
                const responseClone = networkResponse.clone();
                caches.open(STATIC_CACHE)
                  .then(cache => cache.put(request, responseClone))
                  .catch(() => {});
              }
              return networkResponse;
            })
            .catch(() => {
              // Fallback pour chunks manquants
              const contentType = request.url.endsWith('.css') ? 'text/css' : 'application/javascript';
              const fallbackContent = request.url.endsWith('.css') 
                ? '/* Offline CSS fallback */'
                : '// Offline JS fallback - redirect to home\nif (typeof window !== "undefined") { window.location.href = "/"; }';
              
              return new Response(fallbackContent, { 
                headers: { 'Content-Type': contentType },
                status: 200
              });
            });
        })
    );
    return;
  }

  // 5. AUTRES REQUÊTES - Network First avec gestion des clones
  event.respondWith(
    fetch(request)
      .then(networkResponse => {
        if (networkResponse.ok && networkResponse.body) {
          const responseClone = networkResponse.clone();
          caches.open(DYNAMIC_CACHE)
            .then(cache => cache.put(request, responseClone))
            .catch(() => {});
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
  
  if (event.data?.type === 'SYNC_MENU') {
    // Synchronisation manuelle des articles
    syncNewMenuItems();
  }
  
  if (event.data?.type === 'CACHE_IMAGE') {
    // Mettre en cache une image spécifique
    const imageUrl = event.data.imageUrl;
    if (imageUrl) {
      caches.open(STATIC_CACHE)
        .then(cache => fetch(imageUrl))
        .then(response => {
          if (response.ok) {
            return caches.open(STATIC_CACHE).then(cache => 
              cache.put(imageUrl, response.clone())
            );
          }
        })
        .then(() => {
          console.log(`SW: Image mise en cache manuellement: ${imageUrl}`);
        })
        .catch(error => {
          console.error(`SW: Erreur cache manuel image:`, error);
        });
    }
  }
});

// Synchronisation en arrière-plan
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});

console.log('SW v7.4: Mode hybride - Online/Offline avec synchronisation');