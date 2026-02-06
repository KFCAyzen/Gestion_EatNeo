// Force cache invalidation based on a stable app version
const meta = document.querySelector('meta[name="app-version"]');
const APP_VERSION = (meta && meta.content) ? meta.content : 'dev';

// Skip force-update in dev to avoid reload loops
if (APP_VERSION === 'dev') {
  console.log('Force update disabled in dev mode.');
} else {
  const currentVersion = localStorage.getItem('app-version');

  if (currentVersion !== APP_VERSION) {
    localStorage.setItem('app-version', APP_VERSION);

    // Clear all caches only when version changes
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }

    if (currentVersion) {
      window.location.reload();
    }
  }
}
