// Converted data from types.ts to CommonJS format

const menuItems = [
  {
    id: 1,
    nom: "Poulet DG",
    prix: "4000 FCFA",
    image: "/poulet_DG.jpg",
    description: "Poulet frit mijoté avec plantains mûrs, légumes et épices.",
    catégorie: ["Plats principaux", "Plats chaud"],
    filtre: ["Plats principaux", "Plats chaud"],
  },
  {
    id: 2,
    nom: "Pomme sauté à la viande de boeuf",
    prix: "3000 FCFA",
    image: "/pomme-viande.jpeg",
    description: "Pommes de terre sautées accompagnées de viande de boeuf.",
    catégorie: ["Plats principaux", "Plats chaud"],
    filtre: ["Plats principaux", "Plats chaud"],
  },
  {
    id: 3,
    nom: "Poulet Braisé",
    prix: "4000 FCFA",
    image: "/poulet_braisé.jpeg",
    description: "Poulet mariné et grillé au feu de bois, tendre et savoureux.",
    catégorie: ["Grillades & Poêlés", "Plats chaud"],
    filtre: ["Grillades & Poêlés", "Plats chaud"],
  },
  {
    id: 4,
    nom: "Taro Sauce Jaune",
    prix: "2500 FCFA",
    image: "/taro.jpeg",
    description: "Taro pilé accompagné d'une sauce jaune aux épices et huile de palme.",
    catégorie: ["Plats principaux", "Spécialitées du dimanche", "Plats traditionnels"],
    filtre: ["Plats principaux", "Spécialitées du dimanche", "Plats traditionnels"],
  },
  {
    id: 5,
    nom: "Eru",
    prix: "2500 FCFA",
    image: "/eru.jpeg",
    description: "Plat traditionnel à base de feuilles d'okok et waterleaf.",
    catégorie: ["Spécialitées du dimanche", "Plats chaud", "Plats traditionnels", "Plats principaux"],
    filtre: ["Spécialitées du dimanche", "Plats chaud", "Plats traditionnels", "Plats principaux"],
  }
];

const drinksItems = [
  {
    id: 129,
    nom: "Le cuivre",
    prix: "5000 FCFA",
    image: "/cuivre-blanc.jpg",
    catégorie: ["Vins Blanc"],
    filtre: ["Vins Blanc"],
  },
  {
    id: 128,
    nom: "Tour Cantelou",
    prix: "5000 FCFA",
    image: "/cantelou.jpeg",
    catégorie: ["Vins Blanc"],
    filtre: ["Vins Blanc"],
  },
  {
    id: 127,
    nom: "Isabelle De France",
    prix: "6000 FCFA",
    image: "/isabelle-de-france.jpeg",
    catégorie: ["Vins Blanc"],
    filtre: ["Vins Blanc"],
  }
];

const menuItemsUniq = menuItems.map((item) => ({
  ...item,
  id: `P-${String(item.id)}`,
}));

const drinksItemsUniq = drinksItems.map((item) => ({
  ...item,
  id: `B-${String(item.id)}`,
}));

module.exports = { menuItemsUniq, drinksItemsUniq };