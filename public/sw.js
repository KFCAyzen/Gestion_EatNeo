const CACHE_NAME = 'eatneo-complete-v1.3';

// Ressources essentielles pour fonctionnement complet offline
const ESSENTIAL_RESOURCES = [
  '/',
  '/boissons',
  '/panier', 
  '/admin',
  '/historique',
  '/notifications',
  '/offline.html',
  '/manifest.json',
  '/logo.jpg',
  '/icon-192x192.png',
  '/icon-512x512.png',
  // Images principales du menu
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
  
  // Ignorer les domaines externes (Firebase, Analytics, etc.)
  const externalDomains = [
    'firebase.googleapis.com',
    'www.google-analytics.com', 
    'firestore.googleapis.com',
    'firebasestorage.googleapis.com'
  ];
  
  if (externalDomains.some(domain => url.hostname.includes(domain))) {
    return; // Laisser le navigateur gérer ces requêtes
  }
  
  if (url.origin !== self.location.origin) return;

  // Ne jamais intercepter les assets Next.js versionnes.
  // Sinon, un ancien cache peut casser les chunks (404 main-app.js/page.js/layout.css).
  if (url.pathname.startsWith('/_next/')) {
    return;
  }
  
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
            // Offline - servir page offline pour navigateurs anciens
            if (url.pathname !== '/') {
              return caches.match('/offline.html').then(offlinePage => {
                if (offlinePage) return offlinePage;
                return caches.match('/');
              });
            }
            return caches.match('/offline.html').then(offlinePage => {
              if (offlinePage) return offlinePage;
              return new Response('Offline', { status: 503 });
            });
          });
      })
  );
});
