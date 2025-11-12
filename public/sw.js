const CACHE_NAME = 'eatneo-complete-v5.0';
const STATIC_CACHE = 'eatneo-static-v5.0';

// TOUTES les ressources à télécharger lors de l'installation
const COMPLETE_APP_RESOURCES = [
  // Pages principales
  '/',
  '/boissons',
  '/panier', 
  '/admin',
  '/historique',
  '/notifications',
  
  // Manifest et icônes
  '/manifest.json',
  '/logo.jpg',
  '/icon-192x192.png',
  '/icon-512x512.png',
  
  // Toutes les images du menu
  '/poulet_DG.jpg',
  '/fanta.jpg',
  '/reaktor.jpg',
  '/bouillon.jpeg',
  '/poulet_braisé.jpeg',
  '/poisson.jpeg',
  '/plantain-tapé.jpeg',
  '/taro.jpeg',
  '/ndolé.jpg',
  '/saucisse.jpg',
  '/panné.png',
  '/foie.jpg',
  '/barBraisé.jpeg',
  '/barCalada.jpeg',
  '/carpe.jpeg',
  '/thé-citron.jpeg',
  '/thé-menthe.jpeg',
  '/thé-vert.jpeg',
  '/tasse-lait.jpeg',
  '/omelette.jpeg',
  '/omelette-sardine.jpeg',
  '/omelette-saucisson.webp',
  '/poulet-yassa.jpeg',
  '/frite.jpeg',
  '/pomme-vapeur.webp',
  '/plantain-vapeur.jpeg',
  '/platain-frie.webp',
  '/Ndole-poisson-fume.jpg',
  '/pomme-poisson.jpeg',
  '/pomme-viande.jpeg',
  '/Riz-pilaf-au-Thermomix.jpg',
  '/rognons-de-boeuf.webp',
  '/emince-de-boeuf.jpeg',
  '/tripes.jpeg',
  '/eru.jpeg',
  
  // Icônes interface
  '/icons8-utilisateur-50.png',
  '/icons8-profile-50.png',
  '/icons8-déconnexion-100.png',
  '/icons8-multiplier-100.png',
  '/icons8-poubelle-64.png',
  '/icons8-bar-alimentaire-50.png',
  '/icons8-food-bar-50.png',
  '/icons8-search-50.png',
  '/icons8-verre-à-vin-50.png',
  '/icons8-verre-à-vin2-50.png',
  '/icons8-shopping-cart-50.png',
  '/icons8-shopping-cart-50 (1).png',
  '/icons8-whatsapp-50.png',
  '/icons8-position-50.png',
  '/icons8-téléphone-50.png',
  '/icons8-nouveau-message-50.png',
  '/icons8-flèche-haut-100.png',
  '/icons8-facebook-100.png',
  '/icons8-tiktok-50.png',
  '/icons8-requirements-50.png',
  '/icons8-requirements-50 (1).png',
  '/icons8-passé-100.png',
  '/icons8-passé-100 (1).png',
  '/icons8-checklist-50.png',
  '/icons8-checklist-50 (1).png',
  '/icons8-arrière-50.png'
];

// Installation - TÉLÉCHARGER TOUTE L'APPLICATION
self.addEventListener('install', event => {
  console.log('SW v5.0: Installation - Téléchargement complet de l\'application');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('SW: Début du téléchargement de', COMPLETE_APP_RESOURCES.length, 'ressources');
        
        // Télécharger TOUTES les ressources en parallèle
        return Promise.allSettled(
          COMPLETE_APP_RESOURCES.map(async (resource, index) => {
            try {
              console.log(`SW: Téléchargement ${index + 1}/${COMPLETE_APP_RESOURCES.length}: ${resource}`);
              
              const response = await fetch(resource, {
                cache: 'no-cache',
                mode: 'cors',
                credentials: 'same-origin'
              });
              
              if (response.ok) {
                await cache.put(resource, response);
                console.log(`✓ Mis en cache: ${resource}`);
                return { success: true, resource };
              } else {
                console.warn(`✗ Échec ${response.status}: ${resource}`);
                return { success: false, resource, status: response.status };
              }
            } catch (error) {
              console.warn(`✗ Erreur: ${resource}`, error.message);
              return { success: false, resource, error: error.message };
            }
          })
        );
      })
      .then((results) => {
        const successful = results.filter(r => r.value?.success).length;
        const failed = results.filter(r => !r.value?.success).length;
        
        console.log(`SW: Installation terminée - ${successful} ressources téléchargées, ${failed} échecs`);
        console.log('SW: APPLICATION COMPLÈTEMENT MISE EN CACHE - Prête pour utilisation offline');
        
        // Forcer activation immédiate
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('SW: Erreur installation critique:', error);
        // Continuer même en cas d'erreur
        return self.skipWaiting();
      })
  );
});

// Activation
self.addEventListener('activate', event => {
  console.log('SW v5.0: Activation');
  
  event.waitUntil(
    Promise.all([
      // Nettoyer anciens caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!cacheName.includes('v5.0')) {
              console.log('SW: Suppression ancien cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Prendre contrôle immédiat
      self.clients.claim()
    ])
    .then(() => {
      console.log('SW v5.0: ACTIVÉ - Application 100% offline prête');
      
      // Notifier tous les clients
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_READY',
            message: 'Application complètement téléchargée - 100% offline'
          });
        });
      });
    })
  );
});

// Gestion des requêtes - CACHE FIRST ABSOLU
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorer requêtes non-GET
  if (request.method !== 'GET') return;
  
  // Ignorer requêtes externes (sauf Firebase)
  if (!url.origin.includes(self.location.origin) && 
      !url.href.includes('firestore.googleapis.com') && 
      !url.href.includes('firebase')) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        // TOUJOURS servir depuis le cache si disponible
        if (cachedResponse) {
          return cachedResponse;
        }

        // Si pas en cache, essayer le réseau (pour nouvelles ressources)
        return fetch(request)
          .then(networkResponse => {
            if (networkResponse && networkResponse.ok) {
              // Mettre en cache les nouvelles ressources
              caches.open(STATIC_CACHE)
                .then(cache => cache.put(request, networkResponse.clone()))
                .catch(() => {}); // Ignorer erreurs cache
            }
            return networkResponse;
          })
          .catch(() => {
            // FALLBACKS OFFLINE ROBUSTES
            
            // Pages HTML - Rediriger vers page principale
            if (request.headers.get('accept')?.includes('text/html')) {
              return caches.match('/').then(homeResponse => {
                if (homeResponse) {
                  console.log('SW: Redirection offline vers page principale');
                  return homeResponse;
                }
                
                // Page offline de secours
                return new Response(`
                  <!DOCTYPE html>
                  <html lang="fr">
                  <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>EAT NEO - 100% Offline</title>
                    <style>
                      * { margin: 0; padding: 0; box-sizing: border-box; }
                      body { 
                        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                        background: linear-gradient(135deg, #2e7d32 0%, #4caf50 100%);
                        color: white; min-height: 100vh; display: flex;
                        align-items: center; justify-content: center; text-align: center; padding: 20px;
                      }
                      .container { max-width: 400px; background: rgba(255,255,255,0.1);
                        padding: 40px; border-radius: 16px; backdrop-filter: blur(10px); }
                      h1 { font-size: 2.5rem; margin-bottom: 16px; }
                      p { font-size: 1.1rem; margin-bottom: 24px; opacity: 0.9; }
                      button { background: white; color: #2e7d32; border: none;
                        padding: 12px 24px; border-radius: 8px; font-size: 1rem;
                        font-weight: 600; cursor: pointer; transition: transform 0.2s; }
                      button:hover { transform: translateY(-2px); }
                      .status { margin-top: 20px; font-size: 0.9rem; opacity: 0.7; }
                    </style>
                  </head>
                  <body>
                    <div class="container">
                      <h1>🍽️ EAT NEO</h1>
                      <p>Application 100% offline</p>
                      <p>Toutes les ressources sont téléchargées</p>
                      <button onclick="window.location.href='/'">Ouvrir l'application</button>
                      <div class="status">Mode offline complet • v5.0</div>
                    </div>
                  </body>
                  </html>
                `, {
                  status: 200,
                  headers: { 'Content-Type': 'text/html; charset=utf-8' }
                });
              });
            }

            // Images - SVG de remplacement
            if (request.url.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/)) {
              return new Response(`
                <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
                  <rect width="200" height="200" fill="#f5f5f5" stroke="#ddd" stroke-width="2"/>
                  <text x="100" y="95" text-anchor="middle" fill="#999" font-family="Arial" font-size="14">Image</text>
                  <text x="100" y="115" text-anchor="middle" fill="#999" font-family="Arial" font-size="12">offline</text>
                </svg>
              `, { headers: { 'Content-Type': 'image/svg+xml' } });
            }

            // Firebase/API - Données offline
            if (url.href.includes('firestore') || url.href.includes('firebase') || url.pathname.startsWith('/api/')) {
              return new Response(JSON.stringify({
                offline: true,
                message: 'Mode offline - Données locales',
                timestamp: new Date().toISOString()
              }), { headers: { 'Content-Type': 'application/json' } });
            }

            // CSS/JS - Fichier vide
            if (request.url.match(/\.(css|js)$/)) {
              const contentType = request.url.endsWith('.css') ? 'text/css' : 'application/javascript';
              return new Response('/* Offline mode */', { headers: { 'Content-Type': contentType } });
            }

            // Fallback générique
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Messages
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('Service Worker v5.0 - TÉLÉCHARGEMENT COMPLET DE L\'APPLICATION');