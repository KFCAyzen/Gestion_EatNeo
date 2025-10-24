# Guide de Déploiement - PAULINA HÔTEL

## 🚀 Déploiement sur Vercel

### 1. Variables d'environnement à configurer sur Vercel

Dans les paramètres de votre projet Vercel, ajoutez ces variables :

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC0n-zUpXRsL9FG2dyqdk0oMuqq8lPch3E
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=menu-et-gestion-stock-ea-14886.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=menu-et-gestion-stock-ea-14886
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=menu-et-gestion-stock-ea-14886.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=272091105731
NEXT_PUBLIC_FIREBASE_APP_ID=1:272091105731:web:e51848386c3b424df6d576
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-JBP1PZWH4P
```

### 2. Configuration Firebase

✅ **Votre base de données Firebase est déjà configurée pour la production**
- Firestore Database : `menu-et-gestion-stock-ea-14886`
- Storage : `menu-et-gestion-stock-ea-14886.firebasestorage.app`
- Authentication : Activé

### 3. Fonctionnalités en production

✅ **Ce qui fonctionnera parfaitement :**
- Affichage des plats et boissons (avec fallback local)
- Système de panier
- Commandes WhatsApp
- Sauvegarde des commandes dans Firebase
- Interface d'administration
- Gestion des stocks
- Upload d'images
- Authentification admin

### 4. Optimisations pour la production

Le projet inclut :
- **Fallback intelligent** : Si Firebase met du temps, les données locales s'affichent
- **Timeout de 3 secondes** : Évite les spinners infinis
- **Images optimisées** : Next.js Image component
- **Analytics Vercel** : Suivi des performances
- **Build optimisé** : Code splitting automatique

### 5. Commandes de déploiement

```bash
# Build de production
npm run build

# Démarrage en production
npm run start

# Développement
npm run dev
```

## 🔧 Maintenance

### Mise à jour des données
- Les données Firebase se synchronisent automatiquement
- L'admin peut ajouter/modifier les articles via l'interface
- Les images sont stockées dans Firebase Storage

### Monitoring
- Utilisez Vercel Analytics pour surveiller les performances
- Firebase Console pour les données et l'authentification
- Logs Vercel pour le debugging

## 📱 Fonctionnalités

- ✅ Menu interactif avec recherche et filtres
- ✅ Panier avec gestion des quantités
- ✅ Commandes via WhatsApp
- ✅ Interface d'administration sécurisée
- ✅ Gestion des stocks en temps réel
- ✅ Upload d'images
- ✅ Historique des commandes
- ✅ Responsive design
- ✅ PWA ready