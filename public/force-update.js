// Force cache invalidation
const CACHE_VERSION = Date.now();
console.log('Cache version:', CACHE_VERSION);

// Clear all caches
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      caches.delete(name);
    });
  });
}

// Force reload if version mismatch
const currentVersion = localStorage.getItem('app-version');
const newVersion = '1.0.' + CACHE_VERSION;

if (currentVersion !== newVersion) {
  localStorage.setItem('app-version', newVersion);
  if (currentVersion) {
    window.location.reload(true);
  }
}