const CACHE_NAME = 'eatneo-simple-v1.0';

// Ressources essentielles à mettre en cache
const ESSENTIAL_RESOURCES = [
  '/',
  '/boissons',
  '/panier', 
  '/admin',
  '/historique',
  '/notifications',
  '/manifest.json',
  '/logo.jpg',
  '/poulet_DG.jpg',
  '/fanta.jpg',
  '/reaktor.jpg'
];

// Installation - Cache les ressources essentielles
self.addEventListener('install', event => {
  console.log('SW Simple: Installation');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW Simple: Mise en cache des ressources essentielles');
        return cache.addAll(ESSENTIAL_RESOURCES);
      })
      .then(() => self.skipWaiting())
  );
});

// Activation
self.addEventListener('activate', event => {
  console.log('SW Simple: Activation');
  event.waitUntil(
    caches.keys().then(names => 
      Promise.all(
        names.map(name => 
          name !== CACHE_NAME ? caches.delete(name) : null
        )
      )
    ).then(() => self.clients.claim())
  );
});

// Gestion des requêtes - SIMPLE
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') return;
  
  const url = new URL(request.url);
  
  // Ignorer les domaines externes
  if (url.origin !== self.location.origin) return;
  
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log('SW Simple: Servi depuis le cache:', request.url);
          return cachedResponse;
        }
        
        // Pas en cache, essayer le réseau
        return fetch(request)
          .then(networkResponse => {
            // Mettre en cache si succès
            if (networkResponse.ok) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(request, responseClone));
            }
            return networkResponse;
          })
          .catch(() => {
            // Offline - servir la page d'accueil pour toutes les routes
            if (url.pathname !== '/') {
              console.log('SW Simple: Offline - redirection vers accueil');
              return caches.match('/');
            }
            
            // Fallback pour autres ressources
            return new Response('Offline', { 
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

console.log('SW Simple v1.0: Chargé');