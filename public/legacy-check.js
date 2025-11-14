// Détection précoce des navigateurs legacy
(function() {
  'use strict';
  
  // Vérifications de base
  var isLegacy = false;
  var userAgent = navigator.userAgent;
  
  // Android 4.x et versions antérieures
  if (/Android [1-4]\./.test(userAgent)) {
    isLegacy = true;
  }
  
  // Chrome très ancien
  if (/Chrome\/[1-3][0-9]\./.test(userAgent)) {
    isLegacy = true;
  }
  
  // Vérifications de fonctionnalités
  if (typeof Promise === 'undefined' || 
      typeof fetch === 'undefined' ||
      typeof Symbol === 'undefined' ||
      !Array.prototype.find ||
      !Object.assign) {
    isLegacy = true;
  }
  
  if (isLegacy) {
    console.log('Navigateur legacy détecté:', userAgent);
    
    // Ajouter une classe au body
    document.documentElement.className += ' legacy-browser';
    
    // Polyfills essentiels
    if (!Array.prototype.find) {
      Array.prototype.find = function(predicate) {
        for (var i = 0; i < this.length; i++) {
          if (predicate(this[i], i, this)) {
            return this[i];
          }
        }
        return undefined;
      };
    }
    
    if (!Object.assign) {
      Object.assign = function(target) {
        for (var i = 1; i < arguments.length; i++) {
          var source = arguments[i];
          for (var key in source) {
            if (source.hasOwnProperty(key)) {
              target[key] = source[key];
            }
          }
        }
        return target;
      };
    }
    
    // Fallback pour localStorage
    if (typeof localStorage === 'undefined') {
      window.localStorage = {
        getItem: function() { return null; },
        setItem: function() {},
        removeItem: function() {},
        clear: function() {}
      };
    }
    
    // Désactiver les animations CSS pour améliorer les performances
    var style = document.createElement('style');
    style.textContent = 
      '.legacy-browser * { transition: none !important; animation-duration: 0s !important; }' +
      '.legacy-browser .spinner { border: 2px solid #ccc; border-top: 2px solid #2e7d32; border-radius: 50%; width: 20px; height: 20px; }';
    document.head.appendChild(style);
    
    // Afficher un message de chargement simple
    var loadingDiv = document.createElement('div');
    loadingDiv.id = 'legacy-loading';
    loadingDiv.style.cssText = 
      'position: fixed; top: 0; left: 0; width: 100%; height: 100%; ' +
      'background: #2e7d32; color: white; display: flex; flex-direction: column; ' +
      'align-items: center; justify-content: center; z-index: 9999; font-family: Arial, sans-serif;';
    
    loadingDiv.innerHTML = 
      '<div style="text-align: center;">' +
      '<h1 style="margin-bottom: 20px;">EAT NEO</h1>' +
      '<div class="spinner" style="margin: 20px auto; border: 2px solid #ccc; border-top: 2px solid white; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite;"></div>' +
      '<p>Chargement en cours...</p>' +
      '<p style="font-size: 12px; margin-top: 20px; opacity: 0.8;">Mode compatibilité activé</p>' +
      '</div>';
    
    document.body.appendChild(loadingDiv);
    
    // Supprimer le loading après 3 secondes
    setTimeout(function() {
      var loading = document.getElementById('legacy-loading');
      if (loading) {
        loading.style.display = 'none';
      }
    }, 3000);
  }
})();