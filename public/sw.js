const CACHE_NAME = 'eatneo-v3.1';
const STATIC_CACHE = 'eatneo-static-v3.1';
const DYNAMIC_CACHE = 'eatneo-dynamic-v3.1';

// Ressources critiques
const CORE_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.jpg',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Pages de l'application
const APP_PAGES = [
  '/',
  '/boissons',
  '/panier',
  '/admin',
  '/historique',
  '/notifications'
];

// Ressources Next.js critiques
const NEXTJS_ASSETS = [
  '/_next/static/css/',
  '/_next/static/chunks/',
  '/_next/static/media/'
];

// Images du menu
const MENU_IMAGES = [
  '/poulet_DG.jpg', '/fanta.jpg', '/reaktor.jpg',
  '/bouillon.jpeg', '/poulet_braisé.jpeg', '/poisson.jpeg',
  '/plantain-tapé.jpeg', '/taro.jpeg', '/ndolé.jpg',
  '/saucisse.jpg', '/panné.png', '/foie.jpg',
  '/barBraisé.jpeg', '/barCalada.jpeg', '/carpe.jpeg',
  '/thé-citron.jpeg', '/thé-menthe.jpeg', '/thé-vert.jpeg',
  '/tasse-lait.jpeg', '/omelette.jpeg', '/omelette-sardine.jpeg',
  '/omelette-saucisson.webp', '/poulet-yassa.jpeg',
  '/frite.jpeg', '/pomme-vapeur.webp', '/plantain-vapeur.jpeg',
  '/platain-frie.webp', '/Ndole-poisson-fume.jpg',
  '/pomme-poisson.jpeg', '/pomme-viande.jpeg',
  '/Riz-pilaf-au-Thermomix.jpg', '/rognons-de-boeuf.webp',
  '/emince-de-boeuf.jpeg', '/tripes.jpeg', '/eru.jpeg'
];

// Installation
self.addEventListener('install', event => {
  console.log('SW: Installation v3.1');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        const allResources = [...CORE_ASSETS, ...MENU_IMAGES];
        return Promise.allSettled(
          allResources.map(async (resource) => {
            try {
              const response = await fetch(resource);
              if (response.ok) {
                await cache.put(resource, response);
              }
            } catch (error) {
              console.warn('Cache failed:', resource);
            }
          })
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activation
self.addEventListener('activate', event => {
  console.log('SW: Activation v3.1');
  
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!cacheName.includes('v3.1')) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Gestion des requêtes
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  if (request.method !== 'GET') return;
  
  // Pages de l'app - Cache First avec fallback
  if (APP_PAGES.includes(url.pathname)) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) return response;
          
          return fetch(request)
            .then(networkResponse => {
              if (networkResponse.ok) {
                caches.open(STATIC_CACHE)
                  .then(cache => cache.put(request, networkResponse.clone()));
              }
              return networkResponse;
            })
            .catch(() => {
              return caches.match('/').then(homeResponse => {
                return homeResponse || new Response(`
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <title>EAT NEO - Offline</title>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                      body { font-family: Arial; text-align: center; padding: 50px; color: #2e7d32; }
                      button { background: #4caf50; color: white; border: none; padding: 10px 20px; border-radius: 5px; }
                    </style>
                  </head>
                  <body>
                    <h1>EAT NEO</h1>
                    <p>Mode hors ligne</p>
                    <button onclick="window.location.href='/'">Accueil</button>
                  </body>
                  </html>
                `, { 
                  status: 200,
                  headers: { 'Content-Type': 'text/html' }
                });
              });
            });
        })
    );
    return;
  }

  // Images - Cache First
  if (request.url.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/)) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) return response;
          
          return fetch(request)
            .then(networkResponse => {
              if (networkResponse.ok) {
                caches.open(DYNAMIC_CACHE)
                  .then(cache => cache.put(request, networkResponse.clone()));
              }
              return networkResponse;
            })
            .catch(() => {
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#f0f0f0"/><text x="100" y="100" text-anchor="middle" fill="#999">Image</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            });
        })
    );
    return;
  }

  // Next.js assets - Cache First
  if (url.pathname.startsWith('/_next/') || 
      request.url.match(/\.(css|js|woff|woff2)$/)) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) return response;
          
          return fetch(request)
            .then(networkResponse => {
              if (networkResponse.ok) {
                caches.open(STATIC_CACHE)
                  .then(cache => cache.put(request, networkResponse.clone()));
              }
              return networkResponse;
            });
        })
    );
    return;
  }

  // Firebase/API - Network First
  if (request.url.includes('firestore.googleapis.com') || 
      request.url.includes('firebase') ||
      url.pathname.startsWith('/api/')) {
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
              new Response(JSON.stringify({ 
                offline: true, 
                message: 'Données locales' 
              }), {
                headers: { 'Content-Type': 'application/json' }
              })
            )
        )
    );
    return;
  }

  // Autres requêtes - Network First
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
            new Response('Offline', { status: 503 })
          )
      )
  );
});

// Messages
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});