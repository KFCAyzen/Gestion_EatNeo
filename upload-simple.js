const { initializeApp } = require("firebase/app");
const { getFirestore, collection, doc, setDoc } = require("firebase/firestore");
const { getStorage, ref, uploadBytes, getDownloadURL } = require("firebase/storage");
const fs = require("fs");
const path = require("path");

const firebaseConfig = {
  apiKey: "AIzaSyC0n-zUpXRsL9FG2dyqdk0oMuqq8lPch3E",
  authDomain: "menu-et-gestion-stock-ea-14886.firebaseapp.com",
  projectId: "menu-et-gestion-stock-ea-14886",
  storageBucket: "menu-et-gestion-stock-ea-14886.firebasestorage.app",
  messagingSenderId: "272091105731",
  appId: "1:272091105731:web:e51848386c3b424df6d576",
  measurementId: "G-JBP1PZWH4P"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

async function uploadImages() {
  console.log("📸 Uploading images...");
  const publicPath = path.join(__dirname, "public");
  const files = fs.readdirSync(publicPath).filter(file => 
    file.match(/\.(jpg|jpeg|png|webp|gif)$/i)
  );
  
  const uploadedImages = {};
  
  for (const file of files.slice(0, 5)) { // Test avec 5 images d'abord
    try {
      const filePath = path.join(publicPath, file);
      const fileBuffer = fs.readFileSync(filePath);
      
      const storageRef = ref(storage, `images/${file}`);
      await uploadBytes(storageRef, fileBuffer);
      const downloadURL = await getDownloadURL(storageRef);
      
      uploadedImages[file] = downloadURL;
      console.log(`✅ ${file}`);
      
    } catch (error) {
      console.error(`❌ Error uploading ${file}:`, error.message);
    }
  }
  
  return uploadedImages;
}

async function uploadMenuData() {
  console.log("🍽️ Uploading sample menu items...");
  
  const sampleItems = [
    {
      id: "P-1",
      nom: "Poulet DG",
      prix: "4000 FCFA",
      image: "/poulet_DG.jpg",
      description: "Poulet frit mijoté avec plantains mûrs, légumes et épices.",
      catégorie: ["Plats principaux", "Plats chaud"],
      filtre: ["Plats principaux", "Plats chaud"],
    },
    {
      id: "P-2",
      nom: "Pomme sauté à la viande de boeuf",
      prix: "3000 FCFA",
      image: "/pomme-viande.jpeg",
      description: "Pommes de terre sautées accompagnées de viande de boeuf.",
      catégorie: ["Plats principaux", "Plats chaud"],
      filtre: ["Plats principaux", "Plats chaud"],
    }
  ];
  
  for (const item of sampleItems) {
    try {
      await setDoc(doc(db, "menuItems", item.id), {
        ...item,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`✅ Menu item: ${item.nom}`);
    } catch (error) {
      console.error(`❌ Error uploading menu item ${item.nom}:`, error.message);
    }
  }
}

async function testConnection() {
  try {
    console.log("🔍 Testing Firestore connection...");
    const testDoc = doc(db, "test", "connection");
    await setDoc(testDoc, { timestamp: new Date(), status: "connected" });
    console.log("✅ Firestore connection successful!");
    return true;
  } catch (error) {
    console.error("❌ Firestore connection failed:", error.message);
    return false;
  }
}

async function main() {
  try {
    console.log("🚀 Starting Firebase upload...");
    
    const isConnected = await testConnection();
    if (!isConnected) {
      console.log("Please activate Firestore in Firebase Console first!");
      return;
    }
    
    await uploadImages();
    await uploadMenuData();
    
    console.log("🎉 Upload completed!");
    
  } catch (error) {
    console.error("💥 Upload failed:", error.message);
  }
}

main();