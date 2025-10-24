import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { menuItemsUniq, drinksItemsUniq } from "./components/types";

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
  const publicPath = join(__dirname, "public");
  const files = readdirSync(publicPath).filter(file => 
    file.match(/\.(jpg|jpeg|png|webp|gif)$/i)
  );
  
  const uploadedImages: Record<string, string> = {};
  
  for (const file of files) {
    try {
      const filePath = join(publicPath, file);
      const fileBuffer = readFileSync(filePath);
      
      const cleanFileName = file
        .replace(/[àáâãäå]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/[&]/g, '-')
        .replace(/[ñ]/g, 'n');
      
      const storageRef = ref(storage, `images/${cleanFileName}`);
      await uploadBytes(storageRef, fileBuffer);
      const downloadURL = await getDownloadURL(storageRef);
      
      uploadedImages[file] = downloadURL;
      console.log(`✅ ${file} -> ${downloadURL}`);
      
    } catch (error) {
      console.error(`❌ Error uploading ${file}:`, error);
    }
  }
  
  return uploadedImages;
}

async function uploadMenuData(uploadedImages: Record<string, string>) {
  console.log("🍽️ Uploading menu items...");
  
  for (const item of menuItemsUniq) {
    try {
      const imageName = item.image.replace(/^\//, '');
      const firebaseImageUrl = uploadedImages[imageName] || item.image;
      
      const menuItem = {
        ...item,
        image: firebaseImageUrl,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(doc(db, "menuItems", String(item.id)), menuItem);
      console.log(`✅ Menu item: ${item.nom}`);
      
    } catch (error) {
      console.error(`❌ Error uploading menu item ${item.nom}:`, error);
    }
  }
}

async function uploadDrinksData(uploadedImages: Record<string, string>) {
  console.log("🍺 Uploading drinks...");
  
  for (const item of drinksItemsUniq) {
    try {
      const imageName = item.image.replace(/^\//, '');
      const firebaseImageUrl = uploadedImages[imageName] || item.image;
      
      const drinkItem = {
        ...item,
        image: firebaseImageUrl,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(doc(db, "drinksItems", String(item.id)), drinkItem);
      console.log(`✅ Drink: ${item.nom}`);
      
    } catch (error) {
      console.error(`❌ Error uploading drink ${item.nom}:`, error);
    }
  }
}

async function main() {
  try {
    console.log("🚀 Starting Firebase upload...");
    
    const uploadedImages = await uploadImages();
    await uploadMenuData(uploadedImages);
    await uploadDrinksData(uploadedImages);
    
    console.log("🎉 Upload completed successfully!");
    
  } catch (error) {
    console.error("💥 Upload failed:", error);
  }
}

main();