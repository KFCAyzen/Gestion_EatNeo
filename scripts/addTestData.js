// Script pour ajouter des données fictives de test
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAOqVW5zQw5v5v5v5v5v5v5v5v5v5v5v5v",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Données fictives pour les commandes (25 commandes)
const commandesFictives = [
  {
    clientNom: "Dupont", clientPrenom: "Jean", localisation: "Table 5",
    items: [{ nom: "Ndolé", quantité: 2, prix: "2500 FCFA" }, { nom: "Coca-Cola", quantité: 1, prix: "500 FCFA" }],
    total: 5500, statut: "livree", dateCommande: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000))
  },
  {
    clientNom: "Mballa", clientPrenom: "Marie", localisation: "Table 12",
    items: [{ nom: "Poulet DG", quantité: 1, prix: "3000 FCFA" }, { nom: "Jus d'orange", quantité: 2, prix: "800 FCFA" }],
    total: 3800, statut: "en_preparation", dateCommande: Timestamp.fromDate(new Date(Date.now() - 1 * 60 * 60 * 1000))
  },
  {
    clientNom: "Nkomo", clientPrenom: "Paul", localisation: "Table 3",
    items: [{ nom: "Koki", quantité: 3, prix: "1500 FCFA" }, { nom: "Bière Castel", quantité: 2, prix: "1200 FCFA" }],
    total: 4500, statut: "prete", dateCommande: Timestamp.fromDate(new Date(Date.now() - 30 * 60 * 1000))
  },
  {
    clientNom: "Fotso", clientPrenom: "Claire", localisation: "Table 8",
    items: [{ nom: "Eru", quantité: 1, prix: "2000 FCFA" }, { nom: "Vin rouge", quantité: 1, prix: "5000 FCFA" }],
    total: 7000, statut: "livree", dateCommande: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000))
  },
  {
    clientNom: "Biya", clientPrenom: "André", localisation: "Table 15",
    items: [{ nom: "Poisson braisé", quantité: 2, prix: "4000 FCFA" }, { nom: "Eau minérale", quantité: 3, prix: "900 FCFA" }],
    total: 4900, statut: "en_attente", dateCommande: Timestamp.fromDate(new Date(Date.now() - 15 * 60 * 1000))
  },
  {
    clientNom: "Kamga", clientPrenom: "Sylvie", localisation: "Table 7",
    items: [{ nom: "Sauce arachide", quantité: 1, prix: "2200 FCFA" }, { nom: "Fanta", quantité: 2, prix: "1000 FCFA" }],
    total: 3200, statut: "livree", dateCommande: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000))
  },
  {
    clientNom: "Tchoumi", clientPrenom: "Robert", localisation: "Table 2",
    items: [{ nom: "Mbongo tchobi", quantité: 1, prix: "2800 FCFA" }, { nom: "Bière 33 Export", quantité: 1, prix: "600 FCFA" }],
    total: 3400, statut: "en_preparation", dateCommande: Timestamp.fromDate(new Date(Date.now() - 45 * 60 * 1000))
  },
  {
    clientNom: "Essomba", clientPrenom: "Françoise", localisation: "Table 11",
    items: [{ nom: "Plantain sauté", quantité: 2, prix: "1800 FCFA" }, { nom: "Jus de gingembre", quantité: 1, prix: "700 FCFA" }],
    total: 2500, statut: "prete", dateCommande: Timestamp.fromDate(new Date(Date.now() - 20 * 60 * 1000))
  },
  {
    clientNom: "Mendo", clientPrenom: "Charles", localisation: "Table 6",
    items: [{ nom: "Kondre", quantité: 1, prix: "2500 FCFA" }, { nom: "Vin de palme", quantité: 1, prix: "1500 FCFA" }],
    total: 4000, statut: "livree", dateCommande: Timestamp.fromDate(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000))
  },
  {
    clientNom: "Atangana", clientPrenom: "Berthe", localisation: "Table 9",
    items: [{ nom: "Porc aux légumes", quantité: 1, prix: "3500 FCFA" }, { nom: "Coca-Cola", quantité: 2, prix: "1000 FCFA" }],
    total: 4500, statut: "en_attente", dateCommande: Timestamp.fromDate(new Date(Date.now() - 10 * 60 * 1000))
  },
  {
    clientNom: "Owona", clientPrenom: "Michel", localisation: "Table 4",
    items: [{ nom: "Sangah", quantité: 2, prix: "3000 FCFA" }, { nom: "Bière Mutzig", quantité: 1, prix: "650 FCFA" }],
    total: 3650, statut: "livree", dateCommande: Timestamp.fromDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000))
  },
  {
    clientNom: "Bella", clientPrenom: "Aminata", localisation: "Table 14",
    items: [{ nom: "Couscous de manioc", quantité: 1, prix: "2000 FCFA" }, { nom: "Jus d'ananas", quantité: 1, prix: "800 FCFA" }],
    total: 2800, statut: "en_preparation", dateCommande: Timestamp.fromDate(new Date(Date.now() - 35 * 60 * 1000))
  },
  {
    clientNom: "Ngono", clientPrenom: "Patrice", localisation: "Table 1",
    items: [{ nom: "Bœuf sauté", quantité: 1, prix: "3200 FCFA" }, { nom: "Eau gazeuse", quantité: 2, prix: "800 FCFA" }],
    total: 4000, statut: "prete", dateCommande: Timestamp.fromDate(new Date(Date.now() - 25 * 60 * 1000))
  },
  {
    clientNom: "Feudjio", clientPrenom: "Nadège", localisation: "Table 10",
    items: [{ nom: "Taro pilé", quantité: 2, prix: "2400 FCFA" }, { nom: "Bissap", quantité: 1, prix: "600 FCFA" }],
    total: 3000, statut: "livree", dateCommande: Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
  },
  {
    clientNom: "Mba", clientPrenom: "Olivier", localisation: "Table 13",
    items: [{ nom: "Poisson au curry", quantité: 1, prix: "2700 FCFA" }, { nom: "Bière Castel", quantité: 2, prix: "1200 FCFA" }],
    total: 3900, statut: "en_attente", dateCommande: Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000))
  },
  {
    clientNom: "Ebogo", clientPrenom: "Célestine", localisation: "Table 16",
    items: [{ nom: "Macabo bouilli", quantité: 3, prix: "1500 FCFA" }, { nom: "Jus de bissap", quantité: 2, prix: "1200 FCFA" }],
    total: 2700, statut: "livree", dateCommande: Timestamp.fromDate(new Date(Date.now() - 8 * 24 * 60 * 60 * 1000))
  },
  {
    clientNom: "Fouda", clientPrenom: "Emmanuel", localisation: "Table 18",
    items: [{ nom: "Crevettes grillées", quantité: 1, prix: "4500 FCFA" }, { nom: "Vin blanc", quantité: 1, prix: "6000 FCFA" }],
    total: 10500, statut: "en_preparation", dateCommande: Timestamp.fromDate(new Date(Date.now() - 50 * 60 * 1000))
  },
  {
    clientNom: "Nana", clientPrenom: "Georgette", localisation: "Table 20",
    items: [{ nom: "Igname pilée", quantité: 2, prix: "2000 FCFA" }, { nom: "Jus de goyave", quantité: 1, prix: "750 FCFA" }],
    total: 2750, statut: "prete", dateCommande: Timestamp.fromDate(new Date(Date.now() - 40 * 60 * 1000))
  },
  {
    clientNom: "Talla", clientPrenom: "Serge", localisation: "Table 17",
    items: [{ nom: "Cabri sauté", quantité: 1, prix: "4000 FCFA" }, { nom: "Bière Guinness", quantité: 1, prix: "800 FCFA" }],
    total: 4800, statut: "livree", dateCommande: Timestamp.fromDate(new Date(Date.now() - 9 * 24 * 60 * 60 * 1000))
  },
  {
    clientNom: "Mvondo", clientPrenom: "Jacqueline", localisation: "Table 19",
    items: [{ nom: "Salade de fruits", quantité: 2, prix: "1600 FCFA" }, { nom: "Eau minérale", quantité: 3, prix: "900 FCFA" }],
    total: 2500, statut: "en_attente", dateCommande: Timestamp.fromDate(new Date(Date.now() - 8 * 60 * 1000))
  },
  {
    clientNom: "Abanda", clientPrenom: "Thierry", localisation: "Table 21",
    items: [{ nom: "Okok", quantité: 1, prix: "2300 FCFA" }, { nom: "Jus de mangue", quantité: 2, prix: "1400 FCFA" }],
    total: 3700, statut: "livree", dateCommande: Timestamp.fromDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000))
  },
  {
    clientNom: "Ekotto", clientPrenom: "Rosine", localisation: "Table 22",
    items: [{ nom: "Miondo", quantité: 2, prix: "2800 FCFA" }, { nom: "Bière Heineken", quantité: 1, prix: "900 FCFA" }],
    total: 3700, statut: "en_preparation", dateCommande: Timestamp.fromDate(new Date(Date.now() - 55 * 60 * 1000))
  },
  {
    clientNom: "Onana", clientPrenom: "Didier", localisation: "Table 23",
    items: [{ nom: "Poulet aux épices", quantité: 1, prix: "3300 FCFA" }, { nom: "Coca-Cola", quantité: 1, prix: "500 FCFA" }],
    total: 3800, statut: "prete", dateCommande: Timestamp.fromDate(new Date(Date.now() - 18 * 60 * 1000))
  },
  {
    clientNom: "Manga", clientPrenom: "Solange", localisation: "Table 24",
    items: [{ nom: "Beignets haricots", quantité: 4, prix: "2000 FCFA" }, { nom: "Thé au lait", quantité: 2, prix: "800 FCFA" }],
    total: 2800, statut: "livree", dateCommande: Timestamp.fromDate(new Date(Date.now() - 11 * 24 * 60 * 60 * 1000))
  },
  {
    clientNom: "Zobo", clientPrenom: "Alain", localisation: "Table 25",
    items: [{ nom: "Escargots sauce", quantité: 1, prix: "3800 FCFA" }, { nom: "Vin rouge", quantité: 1, prix: "5500 FCFA" }],
    total: 9300, statut: "en_attente", dateCommande: Timestamp.fromDate(new Date(Date.now() - 12 * 60 * 1000))
  }
];

// Données fictives pour les ingrédients (30 ingrédients)
const ingredientsFictifs = [
  { nom: "Riz", quantite: 15, unite: "kg", seuilAlerte: 5 },
  { nom: "Poulet", quantite: 3, unite: "kg", seuilAlerte: 5 },
  { nom: "Poisson", quantite: 8, unite: "kg", seuilAlerte: 3 },
  { nom: "Oignons", quantite: 2, unite: "kg", seuilAlerte: 3 },
  { nom: "Tomates", quantite: 12, unite: "kg", seuilAlerte: 4 },
  { nom: "Pommes de terre", quantite: 20, unite: "kg", seuilAlerte: 8 },
  { nom: "Plantains", quantite: 25, unite: "pièces", seuilAlerte: 10 },
  { nom: "Viande de bœuf", quantite: 6, unite: "kg", seuilAlerte: 4 },
  { nom: "Arachides", quantite: 1, unite: "kg", seuilAlerte: 2 },
  { nom: "Huile de palme", quantite: 5, unite: "L", seuilAlerte: 2 },
  { nom: "Sel", quantite: 3, unite: "kg", seuilAlerte: 1 },
  { nom: "Épinards", quantite: 4, unite: "kg", seuilAlerte: 2 },
  { nom: "Manioc", quantite: 18, unite: "kg", seuilAlerte: 6 },
  { nom: "Ignames", quantite: 22, unite: "kg", seuilAlerte: 8 },
  { nom: "Macabo", quantite: 14, unite: "kg", seuilAlerte: 5 },
  { nom: "Taro", quantite: 10, unite: "kg", seuilAlerte: 4 },
  { nom: "Haricots", quantite: 7, unite: "kg", seuilAlerte: 3 },
  { nom: "Maïs", quantite: 16, unite: "kg", seuilAlerte: 6 },
  { nom: "Crevettes", quantite: 2, unite: "kg", seuilAlerte: 1 },
  { nom: "Cabri", quantite: 4, unite: "kg", seuilAlerte: 2 },
  { nom: "Porc", quantite: 8, unite: "kg", seuilAlerte: 3 },
  { nom: "Escargots", quantite: 3, unite: "kg", seuilAlerte: 1 },
  { nom: "Piment", quantite: 2, unite: "kg", seuilAlerte: 1 },
  { nom: "Gingembre", quantite: 1, unite: "kg", seuilAlerte: 0.5 },
  { nom: "Ail", quantite: 2, unite: "kg", seuilAlerte: 0.5 },
  { nom: "Persil", quantite: 1, unite: "kg", seuilAlerte: 0.3 },
  { nom: "Coriandre", quantite: 0.8, unite: "kg", seuilAlerte: 0.3 },
  { nom: "Huile végétale", quantite: 8, unite: "L", seuilAlerte: 3 },
  { nom: "Farine de blé", quantite: 12, unite: "kg", seuilAlerte: 4 },
  { nom: "Sucre", quantite: 6, unite: "kg", seuilAlerte: 2 }
];

// Données fictives pour les mouvements de stock (20 mouvements)
const mouvementsFictifs = [
  { item: "Coca-Cola", type: "sortie", quantite: 5, unite: "unités", stockAvant: 15, stockApres: 10, description: "Vente client - Commande #001", categorie: "boissons", date: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)) },
  { item: "Bière Castel", type: "entree", quantite: 20, unite: "unités", stockAvant: 5, stockApres: 25, description: "Réapprovisionnement fournisseur", categorie: "boissons", date: Timestamp.fromDate(new Date(Date.now() - 4 * 60 * 60 * 1000)) },
  { item: "Riz", type: "sortie", quantite: 2, unite: "kg", stockAvant: 17, stockApres: 15, description: "Utilisation cuisine - Ndolé", categorie: "ingredients", date: Timestamp.fromDate(new Date(Date.now() - 1 * 60 * 60 * 1000)) },
  { item: "Poulet", type: "sortie", quantite: 3, unite: "kg", stockAvant: 6, stockApres: 3, description: "Préparation Poulet DG", categorie: "ingredients", date: Timestamp.fromDate(new Date(Date.now() - 3 * 60 * 60 * 1000)) },
  { item: "Jus d'orange", type: "ajustement", quantite: 2, unite: "unités", stockAvant: 12, stockApres: 10, description: "Correction inventaire", categorie: "boissons", date: Timestamp.fromDate(new Date(Date.now() - 6 * 60 * 60 * 1000)) },
  { item: "Tomates", type: "entree", quantite: 8, unite: "kg", stockAvant: 4, stockApres: 12, description: "Livraison marché central", categorie: "ingredients", date: Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 60 * 1000)) },
  { item: "Plantains", type: "sortie", quantite: 10, unite: "pièces", stockAvant: 35, stockApres: 25, description: "Préparation plantain sauté", categorie: "ingredients", date: Timestamp.fromDate(new Date(Date.now() - 7 * 60 * 60 * 1000)) },
  { item: "Bière 33 Export", type: "entree", quantite: 15, unite: "unités", stockAvant: 8, stockApres: 23, description: "Commande distributeur", categorie: "boissons", date: Timestamp.fromDate(new Date(Date.now() - 8 * 60 * 60 * 1000)) },
  { item: "Viande de bœuf", type: "sortie", quantite: 2, unite: "kg", stockAvant: 8, stockApres: 6, description: "Préparation bœuf sauté", categorie: "ingredients", date: Timestamp.fromDate(new Date(Date.now() - 9 * 60 * 60 * 1000)) },
  { item: "Manioc", type: "entree", quantite: 12, unite: "kg", stockAvant: 6, stockApres: 18, description: "Achat producteur local", categorie: "ingredients", date: Timestamp.fromDate(new Date(Date.now() - 10 * 60 * 60 * 1000)) },
  { item: "Jus de gingembre", type: "sortie", quantite: 3, unite: "unités", stockAvant: 8, stockApres: 5, description: "Vente clients", categorie: "boissons", date: Timestamp.fromDate(new Date(Date.now() - 11 * 60 * 60 * 1000)) },
  { item: "Crevettes", type: "ajustement", quantite: 1, unite: "kg", stockAvant: 3, stockApres: 2, description: "Perte - produit avarié", categorie: "ingredients", date: Timestamp.fromDate(new Date(Date.now() - 12 * 60 * 60 * 1000)) },
  { item: "Ignames", type: "entree", quantite: 15, unite: "kg", stockAvant: 7, stockApres: 22, description: "Réapprovisionnement hebdomadaire", categorie: "ingredients", date: Timestamp.fromDate(new Date(Date.now() - 13 * 60 * 60 * 1000)) },
  { item: "Vin rouge", type: "sortie", quantite: 2, unite: "unités", stockAvant: 12, stockApres: 10, description: "Commandes clients", categorie: "boissons", date: Timestamp.fromDate(new Date(Date.now() - 14 * 60 * 60 * 1000)) },
  { item: "Porc", type: "entree", quantite: 5, unite: "kg", stockAvant: 3, stockApres: 8, description: "Livraison boucherie", categorie: "ingredients", date: Timestamp.fromDate(new Date(Date.now() - 15 * 60 * 60 * 1000)) },
  { item: "Bissap", type: "sortie", quantite: 4, unite: "unités", stockAvant: 10, stockApres: 6, description: "Ventes de la journée", categorie: "boissons", date: Timestamp.fromDate(new Date(Date.now() - 16 * 60 * 60 * 1000)) },
  { item: "Haricots", type: "entree", quantite: 5, unite: "kg", stockAvant: 2, stockApres: 7, description: "Achat grossiste", categorie: "ingredients", date: Timestamp.fromDate(new Date(Date.now() - 17 * 60 * 60 * 1000)) },
  { item: "Eau minérale", type: "sortie", quantite: 12, unite: "unités", stockAvant: 30, stockApres: 18, description: "Consommation clients", categorie: "boissons", date: Timestamp.fromDate(new Date(Date.now() - 18 * 60 * 60 * 1000)) },
  { item: "Huile de palme", type: "ajustement", quantite: 1, unite: "L", stockAvant: 6, stockApres: 5, description: "Correction stock physique", categorie: "ingredients", date: Timestamp.fromDate(new Date(Date.now() - 19 * 60 * 60 * 1000)) },
  { item: "Farine de blé", type: "entree", quantite: 8, unite: "kg", stockAvant: 4, stockApres: 12, description: "Commande mensuelle", categorie: "ingredients", date: Timestamp.fromDate(new Date(Date.now() - 20 * 60 * 60 * 1000)) }
];

// Données fictives pour les notifications (15 notifications)
const notificationsFictives = [
  { type: "stock_alert", title: "Stock faible - Poulet", message: "Le stock de poulet est en dessous du seuil d'alerte (3 kg restants)", priority: "high", read: false, date: Timestamp.fromDate(new Date(Date.now() - 1 * 60 * 60 * 1000)) },
  { type: "new_order", title: "Nouvelle commande", message: "Commande #005 reçue de André Biya", priority: "medium", read: false, date: Timestamp.fromDate(new Date(Date.now() - 15 * 60 * 1000)) },
  { type: "stock_alert", title: "Stock faible - Arachides", message: "Le stock d'arachides est critique (1 kg restant)", priority: "high", read: true, date: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)) },
  { type: "stock_alert", title: "Stock critique - Crevettes", message: "Stock de crevettes très bas (2 kg restants)", priority: "high", read: false, date: Timestamp.fromDate(new Date(Date.now() - 30 * 60 * 1000)) },
  { type: "new_order", title: "Commande urgente", message: "Commande #017 - Table 18 - Crevettes grillées", priority: "high", read: false, date: Timestamp.fromDate(new Date(Date.now() - 50 * 60 * 1000)) },
  { type: "system", title: "Sauvegarde effectuée", message: "Sauvegarde automatique des données terminée", priority: "low", read: true, date: Timestamp.fromDate(new Date(Date.now() - 3 * 60 * 60 * 1000)) },
  { type: "stock_alert", title: "Réapprovisionnement - Gingembre", message: "Stock de gingembre à renouveler (1 kg restant)", priority: "medium", read: false, date: Timestamp.fromDate(new Date(Date.now() - 4 * 60 * 60 * 1000)) },
  { type: "new_order", title: "Commande groupe", message: "Commande #022 - Table 22 - Miondo (2 portions)", priority: "medium", read: true, date: Timestamp.fromDate(new Date(Date.now() - 55 * 60 * 1000)) },
  { type: "stock_alert", title: "Stock faible - Coriandre", message: "Coriandre en rupture imminente (0.8 kg restant)", priority: "medium", read: false, date: Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 60 * 1000)) },
  { type: "system", title: "Mise à jour menu", message: "Nouveau plat ajouté: Escargots sauce", priority: "low", read: true, date: Timestamp.fromDate(new Date(Date.now() - 6 * 60 * 60 * 1000)) },
  { type: "new_order", title: "Commande spéciale", message: "Commande #025 - Escargots sauce + Vin rouge", priority: "medium", read: false, date: Timestamp.fromDate(new Date(Date.now() - 12 * 60 * 1000)) },
  { type: "stock_alert", title: "Alerte stock - Persil", message: "Stock de persil insuffisant (1 kg restant)", priority: "medium", read: true, date: Timestamp.fromDate(new Date(Date.now() - 7 * 60 * 60 * 1000)) },
  { type: "system", title: "Rapport journalier", message: "Rapport des ventes du jour généré automatiquement", priority: "low", read: true, date: Timestamp.fromDate(new Date(Date.now() - 8 * 60 * 60 * 1000)) },
  { type: "new_order", title: "Commande dessert", message: "Commande #020 - Salade de fruits (2 portions)", priority: "low", read: true, date: Timestamp.fromDate(new Date(Date.now() - 8 * 60 * 1000)) },
  { type: "stock_alert", title: "Réapprovisionnement urgent", message: "Plusieurs ingrédients en stock critique", priority: "high", read: false, date: Timestamp.fromDate(new Date(Date.now() - 9 * 60 * 60 * 1000)) }
];

// Données fictives pour les logs d'activité (20 logs)
const logsFictifs = [
  { action: "stock_update", description: "Stock de Coca-Cola mis à jour: 15 → 10 unités", user: "Admin", timestamp: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)), details: { item: "Coca-Cola", oldValue: 15, newValue: 10 } },
  { action: "order_status_change", description: "Commande #003 passée de 'en_preparation' à 'prete'", user: "Admin", timestamp: Timestamp.fromDate(new Date(Date.now() - 1 * 60 * 60 * 1000)), details: { orderId: "003", oldStatus: "en_preparation", newStatus: "prete" } },
  { action: "ingredient_added", description: "Nouvel ingrédient ajouté: Épinards (4 kg)", user: "Admin", timestamp: Timestamp.fromDate(new Date(Date.now() - 3 * 60 * 60 * 1000)), details: { ingredient: "Épinards", quantity: 4, unit: "kg" } },
  { action: "menu_item_added", description: "Nouveau plat ajouté: Escargots sauce (3800 FCFA)", user: "Admin", timestamp: Timestamp.fromDate(new Date(Date.now() - 4 * 60 * 60 * 1000)), details: { item: "Escargots sauce", price: 3800 } },
  { action: "stock_update", description: "Stock de Bière Castel mis à jour: 5 → 25 unités", user: "Admin", timestamp: Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 60 * 1000)), details: { item: "Bière Castel", oldValue: 5, newValue: 25 } },
  { action: "order_delivered", description: "Commande #001 livrée à Jean Dupont - Table 5", user: "Admin", timestamp: Timestamp.fromDate(new Date(Date.now() - 6 * 60 * 60 * 1000)), details: { orderId: "001", customer: "Jean Dupont", table: "Table 5" } },
  { action: "ingredient_deleted", description: "Ingrédient supprimé: Légumes avariés", user: "Admin", timestamp: Timestamp.fromDate(new Date(Date.now() - 7 * 60 * 60 * 1000)), details: { ingredient: "Légumes avariés" } },
  { action: "stock_adjustment", description: "Ajustement stock Crevettes: 3 → 2 kg (perte)", user: "Admin", timestamp: Timestamp.fromDate(new Date(Date.now() - 8 * 60 * 60 * 1000)), details: { item: "Crevettes", adjustment: -1, reason: "perte" } },
  { action: "order_status_change", description: "Commande #017 passée de 'en_attente' à 'en_preparation'", user: "Admin", timestamp: Timestamp.fromDate(new Date(Date.now() - 9 * 60 * 60 * 1000)), details: { orderId: "017", oldStatus: "en_attente", newStatus: "en_preparation" } },
  { action: "menu_item_updated", description: "Prix du Ndolé modifié: 2300 → 2500 FCFA", user: "Admin", timestamp: Timestamp.fromDate(new Date(Date.now() - 10 * 60 * 60 * 1000)), details: { item: "Ndolé", oldPrice: 2300, newPrice: 2500 } },
  { action: "stock_replenishment", description: "Réapprovisionnement Tomates: 4 → 12 kg", user: "Admin", timestamp: Timestamp.fromDate(new Date(Date.now() - 11 * 60 * 60 * 1000)), details: { item: "Tomates", quantity: 8, supplier: "Marché central" } },
  { action: "order_cancelled", description: "Commande #015 annulée par le client", user: "Admin", timestamp: Timestamp.fromDate(new Date(Date.now() - 12 * 60 * 60 * 1000)), details: { orderId: "015", reason: "Annulation client" } },
  { action: "ingredient_added", description: "Nouvel ingrédient: Sucre (6 kg)", user: "Admin", timestamp: Timestamp.fromDate(new Date(Date.now() - 13 * 60 * 60 * 1000)), details: { ingredient: "Sucre", quantity: 6, unit: "kg" } },
  { action: "stock_alert_resolved", description: "Alerte stock Haricots résolue après réapprovisionnement", user: "Admin", timestamp: Timestamp.fromDate(new Date(Date.now() - 14 * 60 * 60 * 1000)), details: { item: "Haricots", newStock: 7 } },
  { action: "order_status_change", description: "Commande #008 passée de 'prete' à 'livree'", user: "Admin", timestamp: Timestamp.fromDate(new Date(Date.now() - 15 * 60 * 60 * 1000)), details: { orderId: "008", oldStatus: "prete", newStatus: "livree" } },
  { action: "menu_item_visibility", description: "Plat 'Poisson au curry' masqué temporairement", user: "Admin", timestamp: Timestamp.fromDate(new Date(Date.now() - 16 * 60 * 60 * 1000)), details: { item: "Poisson au curry", visible: false } },
  { action: "stock_update", description: "Stock Eau minérale mis à jour: 30 → 18 unités", user: "Admin", timestamp: Timestamp.fromDate(new Date(Date.now() - 17 * 60 * 60 * 1000)), details: { item: "Eau minérale", oldValue: 30, newValue: 18 } },
  { action: "ingredient_threshold_updated", description: "Seuil d'alerte Riz modifié: 3 → 5 kg", user: "Admin", timestamp: Timestamp.fromDate(new Date(Date.now() - 18 * 60 * 60 * 1000)), details: { ingredient: "Riz", oldThreshold: 3, newThreshold: 5 } },
  { action: "order_delivered", description: "Commande #004 livrée à Claire Fotso - Table 8", user: "Admin", timestamp: Timestamp.fromDate(new Date(Date.now() - 19 * 60 * 60 * 1000)), details: { orderId: "004", customer: "Claire Fotso", table: "Table 8" } },
  { action: "system_backup", description: "Sauvegarde automatique des données effectuée", user: "System", timestamp: Timestamp.fromDate(new Date(Date.now() - 20 * 60 * 60 * 1000)), details: { backup_size: "2.3 MB", status: "success" } }
];

// Fonction pour ajouter toutes les données
async function addTestData() {
  try {
    console.log("🚀 Ajout des données de test étendues...");

    // Ajouter les commandes (25)
    console.log("📦 Ajout de 25 commandes...");
    for (const commande of commandesFictives) {
      await addDoc(collection(db, 'commandes'), commande);
    }

    // Ajouter les ingrédients (30)
    console.log("🥕 Ajout de 30 ingrédients...");
    for (const ingredient of ingredientsFictifs) {
      await addDoc(collection(db, 'ingredients'), ingredient);
    }

    // Ajouter les mouvements de stock (20)
    console.log("📊 Ajout de 20 mouvements de stock...");
    for (const mouvement of mouvementsFictifs) {
      await addDoc(collection(db, 'mouvements_stock'), mouvement);
    }

    // Ajouter les notifications (15)
    console.log("🔔 Ajout de 15 notifications...");
    for (const notification of notificationsFictives) {
      await addDoc(collection(db, 'notifications'), notification);
    }

    // Ajouter les logs d'activité (20)
    console.log("📝 Ajout de 20 logs d'activité...");
    for (const log of logsFictifs) {
      await addDoc(collection(db, 'activity_logs'), log);
    }

    console.log("✅ Toutes les données de test étendues ont été ajoutées avec succès !");
    console.log("📊 Résumé: 25 commandes, 30 ingrédients, 20 mouvements, 15 notifications, 20 logs");

  } catch (error) {
    console.error("❌ Erreur lors de l'ajout des données:", error);
  }
}

export { addTestData };