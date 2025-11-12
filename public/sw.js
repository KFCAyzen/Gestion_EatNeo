const CACHE_NAME = 'eatneo-simple-v1.0';

// Ressources essentielles
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

// Installation
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ESSENTIAL_RESOURCES))
      .then(() => self.skipWaiting())
  );
});

// Activation
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names => 
      Promise.all(names.map(name => 
        name !== CACHE_NAME ? caches.delete(name) : null
      ))
    ).then(() => self.clients.claim())
  );
});

// Gestion des requêtes
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;
        
        return fetch(event.request)
          .then(response => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => {
            // Offline - servir accueil pour toutes les routes
            if (url.pathname !== '/') {
              return caches.match('/');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});