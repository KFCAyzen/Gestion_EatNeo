const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const fs = require('fs');
const path = require('path');

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC0n-zUpXRsL9FG2dyqdk0oMuqq8lPch3E",
  authDomain: "menu-et-gestion-stock-ea-14886.firebaseapp.com",
  projectId: "menu-et-gestion-stock-ea-14886",
  storageBucket: "menu-et-gestion-stock-ea-14886.firebasestorage.app",
  messagingSenderId: "272091105731",
  appId: "1:272091105731:web:e51848386c3b424df6d576"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// Images des nouveaux plats à uploader
const newImages = [
  'spagetti-saute-simple.jpeg',
  'spagetti-saute-viande.jpeg',
  'crudité.jpeg',
  'salade-avocat-en-accompagnement-640x427.webp',
  'haricot-viande.jpeg',
  'porc-grille.jpeg',
  'boulettes.jpeg',
  'boulettes-pane.jpeg',
  'riz-saute-mbounga.jpeg',
  'riz-saute-viande.webp',
  'poulet-roti.jpeg',
  'poulet-sauce-jardiniere.jpeg',
  'poulet-sauce-basquaise.jpeg',
  'porc-roti.jpeg',
  'porc-sauce-basquaise.jpeg',
  'porc-a-la-moutarde.jpeg',
  'poisson-sauce-oignons.jpeg',
  'burger.jpeg',
  'poisson-a-l\'etouffee.jpeg',
  'gombo-couscous.jpeg',
  'legumes-saute.jpeg',
  'mbongo.jpeg',
  'baton-manioc.jpg'
];

async function uploadImage(imageName) {
  try {
    const publicPath = path.join(__dirname, '..', 'public', imageName);
    
    if (!fs.existsSync(publicPath)) {
      console.log(`❌ Image non trouvée: ${imageName}`);
      return null;
    }

    const imageBuffer = fs.readFileSync(publicPath);
    const storageRef = ref(storage, `images/${imageName}`);
    
    console.log(`📤 Upload de ${imageName}...`);
    const snapshot = await uploadBytes(storageRef, imageBuffer);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log(`✅ ${imageName} uploadé: ${downloadURL}`);
    return downloadURL;
  } catch (error) {
    console.error(`❌ Erreur upload ${imageName}:`, error.message);
    return null;
  }
}

async function uploadAllImages() {
  console.log('🚀 Début de l\'upload des images...\n');
  
  const results = {};
  let success = 0;
  let failed = 0;

  for (const imageName of newImages) {
    const url = await uploadImage(imageName);
    if (url) {
      results[imageName] = url;
      success++;
    } else {
      failed++;
    }
    
    // Pause pour éviter les limites de taux
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n📊 Résultats:`);
  console.log(`✅ Succès: ${success}`);
  console.log(`❌ Échecs: ${failed}`);
  
  // Sauvegarder les URLs
  const outputPath = path.join(__dirname, 'uploadedImages.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`💾 URLs sauvegardées dans: ${outputPath}`);
}

uploadAllImages().catch(console.error);