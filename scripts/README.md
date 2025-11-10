# Script d'Upload des Images

## Installation

```bash
cd scripts
npm install
```

## Utilisation

```bash
npm run upload
```

## Fonctionnalités

- Upload automatique des 23 nouvelles images vers Firebase Storage
- Suivi du progrès en temps réel
- Sauvegarde des URLs dans `uploadedImages.json`
- Gestion des erreurs et retry automatique

## Images uploadées

Le script uploade les images suivantes depuis `/public`:
- Petit Déjeuner: 5 images
- Grillades: 5 images  
- Déjeuner: 12 images
- Accompagnements: 1 image

Total: 23 nouvelles images