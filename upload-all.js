const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc } = require("firebase/firestore");
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

// Import data from types.ts (converted to JS format)
const { menuItemsUniq, drinksItemsUniq } = require('./data-complete.js');

async function uploadAllImages() {
  console.log("📸 Uploading all images...");
  const publicPath = path.join(__dirname, "public");
  const files = fs.readdirSync(publicPath).filter(file => 
    file.match(/\.(jpg|jpeg|png|webp|gif)$/i)
  );
  
  const uploadedImages = {};
  
  for (const file of files) {
    try {
      const filePath = path.join(publicPath, file);
      const fileBuffer = fs.readFileSync(filePath);
      
      const storageRef = ref(storage, `images/${file}`);
      await uploadBytes(storageRef, fileBuffer);
      const downloadURL = await getDownloadURL(storageRef);
      
      uploadedImages[file] = downloadURL;
      console.log(`✅ ${file}`);
      
    } catch (error) {
      console.error(`❌ ${file}: ${error.message}`);
    }
  }
  
  return uploadedImages;
}

async function uploadMenuItems(uploadedImages) {
  console.log("🍽️ Uploading menu items...");
  
  for (const item of menuItemsUniq) {
    try {
      const imageName = item.image.replace(/^\//, '');
      const firebaseImageUrl = uploadedImages[imageName] || item.image;
      
      await setDoc(doc(db, "menuItems", item.id), {
        ...item,
        image: firebaseImageUrl,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`✅ ${item.nom}`);
    } catch (error) {
      console.error(`❌ ${item.nom}: ${error.message}`);
    }
  }
}

async function uploadDrinks(uploadedImages) {
  console.log("🍺 Uploading drinks...");
  
  for (const item of drinksItemsUniq) {
    try {
      const imageName = item.image.replace(/^\//, '');
      const firebaseImageUrl = uploadedImages[imageName] || item.image;
      
      await setDoc(doc(db, "drinksItems", item.id), {
        ...item,
        image: firebaseImageUrl,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`✅ ${item.nom}`);
    } catch (error) {
      console.error(`❌ ${item.nom}: ${error.message}`);
    }
  }
}

async function main() {
  try {
    console.log("🚀 Starting complete Firebase upload...");
    
    const uploadedImages = await uploadAllImages();
    await uploadMenuItems(uploadedImages);
    await uploadDrinks(uploadedImages);
    
    console.log("🎉 All data uploaded successfully!");
    
  } catch (error) {
    console.error("💥 Upload failed:", error.message);
  }
}

main();