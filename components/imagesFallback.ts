// Images avec fallback local si Firebase échoue
const pouletDg = '/poulet_DG.jpg';
const fanta = '/fanta.jpg';
const reaktor = '/reaktor.jpg';
const adminActif = '/icons8-utilisateur-50.png';
const admin = '/icons8-profile-50.png';
const logOut = '/icons8-déconnexion-100.png';
const cross = '/icons8-multiplier-100.png';
const trash = '/icons8-poubelle-64.png';
const food = '/icons8-bar-alimentaire-50.png';
const food2 = '/icons8-food-bar-50.png';
const search = '/icons8-search-50.png';
const glass = '/icons8-verre-à-vin-50.png';
const glass1 = '/icons8-verre-à-vin2-50.png';
const carts = '/icons8-shopping-cart-50.png';
const carts1 = '/icons8-shopping-cart-50 (1).png';
const whatsapp = '/icons8-whatsapp-50.png';
const loc = '/icons8-position-50.png';
const phone = '/icons8-téléphone-50.png';
const mail = '/icons8-nouveau-message-50.png';
const up = '/icons8-flèche-haut-100.png';
const facebook = '/icons8-facebook-100.png';
const tiktok = '/icons8-tiktok-50.png';
const gestionActif = '/icons8-requirements-50.png';
const gestion = '/icons8-requirements-50 (1).png';
const historiqueActif = '/icons8-passé-100.png';
const historique = '/icons8-passé-100 (1).png';
const commandesActif = '/icons8-checklist-50.png';
const commandes = '/icons8-checklist-50 (1).png';
const backArrow = '/icons8-arrière-50.png';

const STORAGE_BASE = 'https://firebasestorage.googleapis.com/v0/b/menu-et-gestion-stock-ea-14886.firebasestorage.app/o/images%2F';

function getImageUrl(filename: string, fallback?: string): string {
  return fallback || `${STORAGE_BASE}${encodeURIComponent(filename)}?alt=media`;
}

export const images = {
  adminActif: getImageUrl('icons8-utilisateur-50.png', adminActif),
  admin: getImageUrl('icons8-profile-50.png', admin),
  logOut: getImageUrl('icons8-deconnexion-100.png', logOut),
  cross: getImageUrl('icons8-multiplier-100.png', cross),
  fanta: getImageUrl('fanta.jpg', fanta),
  reaktor: getImageUrl('reaktor.jpg', reaktor),
  trash: getImageUrl('icons8-poubelle-64.png', trash),
  food: getImageUrl('icons8-bar-alimentaire-50.png', food),
  food2: getImageUrl('icons8-food-bar-50.png', food2),
  search: getImageUrl('icons8-search-50.png', search),
  glass: getImageUrl('icons8-verre-a-vin-50.png', glass),
  glass1: getImageUrl('icons8-verre-a-vin2-50.png', glass1),
  carts: getImageUrl('icons8-shopping-cart-50.png', carts),
  carts1: getImageUrl('icons8-shopping-cart-50%20(1).png', carts1),
  whatsapp: getImageUrl('icons8-whatsapp-50.png', whatsapp),
  loc: getImageUrl('icons8-position-50.png', loc),
  phone: getImageUrl('icons8-telephone-50.png', phone),
  mail: getImageUrl('icons8-nouveau-message-50.png', mail),
  up: getImageUrl('icons8-fleche-haut-100.png', up),
  facebook: getImageUrl('icons8-facebook-100.png', facebook),
  tiktok: getImageUrl('icons8-tiktok-50.png', tiktok),
  pouletDg: getImageUrl('poulet_DG.jpg', pouletDg),
  
  // Autres images sans fallback local (Firebase uniquement)
  martiniBlanc: getImageUrl('martini-blanc.jpeg'),
  martiniRouge: getImageUrl('martini-rouge-15-100-cl.jpg'),
  bouillon: getImageUrl('bouillon.jpeg'),
  pouletBraisé: getImageUrl('poulet_braisé.jpeg'),
  poissonBraisé: getImageUrl('poisson.jpeg'),
  tapé: getImageUrl('plantain-tapé.jpeg'),
  taro: getImageUrl('taro.jpeg'),
  ndolé: getImageUrl('ndolé.jpg'),
  saucisse: getImageUrl('saucisse.jpg'),
  pané: getImageUrl('panné.png'),
  foie: getImageUrl('foie.jpg'),
  barBraisé: getImageUrl('barBraisé.jpeg'),
  calada: getImageUrl('barCalada.jpeg'),
  carpe: getImageUrl('carpe.jpeg'),
  théCitron: getImageUrl('the-citron.jpeg'),
  théMenthe: getImageUrl('the-menthe.jpeg'),
  théVert: getImageUrl('the-vert.jpeg'),
  tasse: getImageUrl('tasse-lait.jpeg'),
  omlette: getImageUrl('omelette.jpeg'),
  omletteSardine: getImageUrl('omelette-sardine.jpeg'),
  omletteSaucisson: getImageUrl('omelette-saucisson.webp'),
  pouletYassa: getImageUrl('poulet-yassa.jpeg'),
  frite: getImageUrl('frite.jpeg'),
  pommeVapeur: getImageUrl('pomme-vapeur.webp'),
  plantainVapeur: getImageUrl('plantain-vapeur.jpeg'),
  plantainFrie: getImageUrl('platain-frie.webp'),
  ndoléFumé: getImageUrl('Ndole-poisson-fume.jpg'),
  pommePoisson: getImageUrl('pomme-poisson.jpeg'),
  pommeViande: getImageUrl('pomme-viande.jpeg'),
  pilaf: getImageUrl('Riz-pilaf-au-Thermomix.jpg'),
  rognon: getImageUrl('rognons-de-boeuf.webp'),
  émincé: getImageUrl('emince-de-boeuf.jpeg'),
  tripes: getImageUrl('tripes.jpeg'),
  eru: getImageUrl('eru.jpeg'),
  cuivre: getImageUrl('cuivre-rouge.jpeg'),
  cuivreBlanc: getImageUrl('cuivre-blanc.jpg'),
  cantelouBlanc: getImageUrl('cantelou.jpeg'),
  cantelouRouge: getImageUrl('cantelou-rouge.jpeg'),
  isabelle: getImageUrl('isabelle-de-france.jpeg'),
  calvetBlanc: getImageUrl('calvet.jpeg'),
  ballartBlanc: getImageUrl('ballart-rosé.png'),
  ballartrosé: getImageUrl('ballart-rosé.png'),
  ballartBordeaux: getImageUrl('ballart-bordeaux.jpeg'),
  louisBlanc: getImageUrl('eschenauer-blanc.jpg'),
  louisRouge: getImageUrl('louis-eschenauer-rouge.jpg'),
  moscato: getImageUrl('moscato-d-asti-doc-blanc.jpg'),
  hugo: getImageUrl('hugo-new.jpeg'),
  mia: getImageUrl('mia-rosé-new.jpeg'),
  antoine: getImageUrl('grand-antoine.jpeg'),
  chatron: getImageUrl('chartron-de-la-croix.jpeg'),
  merlot: getImageUrl('grand-sud-merlot.jpeg'),
  shiraz: getImageUrl('Shiraz_Cabernet.jpg'),
  rio: getImageUrl('Rio-Lindo-Syrah-2016-14.w610.h610.fill_.jpg'),
  castilla: getImageUrl('el-castilla.jpeg'),
  damati: getImageUrl('damati-new.jpeg'),
  villalta: getImageUrl('villalta-amarone.jpg'),
  chianti: getImageUrl('chianti.jpeg'),
  vincent: getImageUrl('charles-vincent.jpeg'),
  ruinart: getImageUrl('ruinart-r-de-ruinard.webp'),
  pataNegra: getImageUrl('pata-negra-new.webp'),
  imperialBlue: getImageUrl('imperial-blue_1.jpg'),
  black: getImageUrl('black.jpg'),
  ws: getImageUrl('WS-Blanc.jpg'),
  w1805: getImageUrl('1805.jpg'),
  eperon: getImageUrl('eperon.jpg'),
  bagpiper: getImageUrl('bagpiper-new.webp'),
  blackWhite: getImageUrl('black&white.jpeg'),
  baileys: getImageUrl('baileys.jpeg'),
  jameson: getImageUrl('jameson.jpeg'),
  redlabel: getImageUrl('red-label.jpeg'),
  hunting: getImageUrl('hunting-lodge.jpeg'),
  label5: getImageUrl('Label-5.webp'),
  lawsons: getImageUrl('william-lawson.jpeg'),
  edwards: getImageUrl('Sir-Edwards.webp'),
  glen: getImageUrl('Glen-Scanlan.jpg'),
  pastis51: getImageUrl('pastis-51.webp'),
  blackLabel: getImageUrl('black-label.jpeg'),
  grants: getImageUrl('grants.jpeg'),
  chivas12: getImageUrl('chivas.jpeg'),
  chivas18: getImageUrl('chivas-regal-18-ans.jpg'),
  singleton: getImageUrl('the-singleton.jpg'),
  goldLabel: getImageUrl('Johnnie-Walker-Gold-Label-Reserve-Blended-Scotch-Whisky-70cl.jpg'),
  jack: getImageUrl('jack-daniel.jpeg'),
  doubleBlack: getImageUrl('johnnie-walker-double-black-label-700-ml.jpg'),
  gold: getImageUrl('johnnie-walker-gold-label.webp'),
  bissap: getImageUrl('Bissap.jpg'),
  baobab: getImageUrl('baobab.jpeg'),
  fresco: getImageUrl('extrafresco.png'),
  maltaguinnes: getImageUrl('0-MALTA-guinnes.jpg'),
  xenergy: getImageUrl('3x-energy.jpeg'),
  export33: getImageUrl('33-export-65-cl.jpg'),
  beaufort: getImageUrl('beaufort.jpeg'),
  light: getImageUrl('beaufort-light.jpeg'),
  castel: getImageUrl('CASTEL-gMM.jpg'),
  chill: getImageUrl('chill.jpeg'),
  coca: getImageUrl('coca.jpeg'),
  djino: getImageUrl('djino.jpeg'),
  doppel: getImageUrl('DOPPEL-MUNICH-1.jpg'),
  frutas: getImageUrl('frutas-1.jpg'),
  petiteGuinnes: getImageUrl('guinness-foreign.jpg'),
  harp: getImageUrl('harp.jpeg'),
  ice: getImageUrl('ice.jpeg'),
  isenbeck: getImageUrl('isenbeck.jpeg'),
  kadji: getImageUrl('kadji.jpeg'),
  orangina: getImageUrl('Jus-orangina-1L-1.png'),
  orijin: getImageUrl('orijin.jpeg'),
  grandeGuinnes: getImageUrl('GUINNESS-1.jpg'),
  smooth: getImageUrl('smooth.jpg'),
  mutzig: getImageUrl('Mutzig_Bottle.jpg'),
  manyan: getImageUrl('manyan.webp'),
  powerMalt: getImageUrl('power-malt.jpg'),
  racine: getImageUrl('racine.jpeg'),
  spécialPamplemousse: getImageUrl('spécial-pamplemousse-plastique.jpeg'),
  topGrenadine: getImageUrl('top-grenadine.jpg'),
  topPlamplemousse: getImageUrl('top-pamplemousse.jpeg'),
  topAnanas: getImageUrl('top-ananas.jpeg'),
  vimto: getImageUrl('vimto.jpeg'),
  vanpurVanille: getImageUrl('vanpur-vanille.jpg'),
  vanpurCoffee: getImageUrl('vanpur-coffee.jpeg'),
  vody: getImageUrl('vody.webp'),
  topOrange: getImageUrl('top-orange.jpeg'),
  calvet: getImageUrl('calvet-rouge.jpeg'),
  elvino: getImageUrl('el-vino.jpg'),
  ginger: getImageUrl('zena-jus-de-gingembre-1l.jpg'),
  redbull: getImageUrl('redbull.webp'),
  bullet: getImageUrl('bullet.jpeg'),
  heineken: getImageUrl('heineken.jpg'),
  ceyssac: getImageUrl('ceyssac.jpeg'),
  bavaria: getImageUrl('bavaria.jpg'),
  yatch: getImageUrl('yatch.webp'),
  booster: getImageUrl('booster-new.jpeg'),
  gestionActif: getImageUrl('icons8-requirements-50.png', gestionActif),
  gestion: getImageUrl('icons8-requirements-50%20(1).png', gestion),
  historiqueActif: getImageUrl('icons8-passe-100.png', historiqueActif),
  historique: getImageUrl('icons8-passe-100%20(1).png', historique),
  commandesActif: getImageUrl('icons8-checklist-50.png', commandesActif),
  commandes: getImageUrl('icons8-checklist-50%20(1).png', commandes),
  backArrow: getImageUrl('icons8-arriere-50.png', backArrow)
};