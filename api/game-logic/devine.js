// game-logic/devine.js — Logique du jeu Devine Tête

const CATEGORIES = {
  'Pop-culture': ['Zidane', 'Harry Potter', 'Mickey Mouse', 'Spider-Man', 'Donald Trump', 'Mozart', 'Napoléon', 'La Joconde', 'Le Président', 'La Tour Eiffel', 'Le Mont Blanc', 'Le Colisée', 'La Seine', 'Un dragon', 'Un vampire', 'Un fantôme', 'Un pingouin', 'Un requin', 'Un paresseux', 'Un éléphant', 'Une vache', 'Un cactus', 'Un avion', 'Une fusée', 'Un château', 'Une guitare', 'Un piano', 'Le Soleil', 'La Lune', 'Un arc-en-ciel', 'Micro-ondes', 'La plage'],
  'Histoire': ['Jules César', 'Cléopâtre', 'Charlemagne', 'Jeanne d\'Arc', 'Louis XIV', 'Marie-Antoinette', 'Napoléon Bonaparte', 'Victor Hugo', 'Charles de Gaulle', 'Albert Einstein', 'Marie Curie', 'Nelson Mandela', 'Martin Luther King', 'Gandhi', 'Christophe Colomb', 'Vasco de Gama', 'Magellan', 'Alexandre le Grand', 'Hannibal', 'Spartacus', 'Attila', 'Gengis Khan', 'Marco Polo', 'Galilée', 'Copernic', 'Descartes', 'Voltaire', 'Rousseau', 'Robespierre', 'Danton'],
  'Animaux': ['Un lion', 'Un tigre', 'Un ours', 'Un loup', 'Un renard', 'Un cerf', 'Un sanglier', 'Un lièvre', 'Un écureuil', 'Un castor', 'Une loutre', 'Un blaireau', 'Un hérisson', 'Une chauve-souris', 'Un dauphin', 'Une baleine', 'Un orque', 'Un phoque', 'Un morse', 'Un éléphant', 'Une girafe', 'Un zèbre', 'Un rhinocéros', 'Un hippopotame', 'Un crocodile', 'Un alligator', 'Un serpent', 'Un lézard', 'Une tortue', 'Un aigle'],
  'Métiers': ['Un médecin', 'Un avocat', 'Un architecte', 'Un ingénieur', 'Un professeur', 'Un chercheur', 'Un pilote', 'Un marin', 'Un soldat', 'Un policier', 'Un pompier', 'Un menuisier', 'Un électricien', 'Un plombier', 'Un maçon', 'Un peintre', 'Un sculpteur', 'Un écrivain', 'Un poète', 'Un compositeur', 'Un chef', 'Un boulanger', 'Un pâtissier', 'Un boucher', 'Un charcutier', 'Un poissonnier', 'Un primeur', 'Un fleuriste', 'Un jardinier', 'Un paysan'],
  'Objets': ['Un téléphone', 'Un ordinateur', 'Une tablette', 'Un casque', 'Une montre', 'Des lunettes', 'Un parapluie', 'Une valise', 'Un sac', 'Une lampe', 'Un canapé', 'Un fauteuil', 'Une table', 'Une chaise', 'Un lit', 'Une armoire', 'Une étagère', 'Un miroir', 'Une horloge', 'Une pendule', 'Un agenda', 'Un stylo', 'Un crayon', 'Une gomme', 'Une règle', 'Un compas', 'Une équerre', 'Un rapporteur', 'Un thermomètre', 'Une balance'],
  'Divers': ['Un nuage', 'Un orage', 'Une tempête', 'Un ouragan', 'Un cyclone', 'Une tornade', 'Un tsunami', 'Un séisme', 'Une avalanche', 'Un éboulement', 'Un volcan', 'Une éruption', 'Une cascade', 'Un geyser', 'Un glacier', 'Une dune', 'Une oasis', 'Un désert', 'Une jungle', 'Une forêt', 'Une rivière', 'Un fleuve', 'Un lac', 'Une mer', 'Un océan', 'Une île', 'Un archipel', 'Une péninsule', 'Un cap', 'Un détroit', 'Un isthme', 'Un canal', 'Un pont', 'Un tunnel', 'Une route', 'Un chemin', 'Une allée', 'Une cour', 'Un jardin', 'Un parc']
};

const MOTS = Object.values(CATEGORIES).flat();

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function startGame(room) {
  room.phase = 'playing';
  room.mots = shuffle([...MOTS]).slice(0, 30);
  room.indexActuel = 0;
  room.score = 0;
  room.passes = 0;
  room.timer = 60;
  room.historique = [];
  room.timestampDebut = Date.now();
  return { success: true, mot: room.mots[0], total: room.mots.length };
}

function action(room, actionType) {
  if (room.phase !== 'playing') return { success: false, error: 'Partie terminée' };

  const mot = room.mots[room.indexActuel];
  if (!mot) return { success: false, error: 'Plus de mots' };

  const resultat = actionType === 'TROUVE' ? 'TROUVÉ' : 'PASSÉ';
  if (actionType === 'TROUVE') room.score++;
  if (actionType === 'PASSE') room.passes++;

  room.historique.push({ mot, resultat });
  room.indexActuel++;

  if (room.indexActuel >= room.mots.length) {
    room.phase = 'finished';
    return { success: true, mot: null, score: room.score, passes: room.passes, phase: 'finished' };
  }

  return { success: true, mot: room.mots[room.indexActuel], score: room.score, passes: room.passes, phase: 'playing' };
}

function getPublicState(room) {
  const tempsEcoule = room.timestampDebut ? Math.floor((Date.now() - room.timestampDebut) / 1000) : 0;
  const tempsRestant = Math.max(0, (room.timer || 60) - tempsEcoule);

  const players = {};
  if (room.players) {
    for (const [id, p] of Object.entries(room.players)) {
      players[id] = { name: p.name };
    }
  }

  return {
    gameType: room.gameType,
    players,
    phase: room.phase,
    motCourant: room.indexActuel < (room.mots || []).length ? room.mots[room.indexActuel] : null,
    indexActuel: room.indexActuel,
    totalMots: (room.mots || []).length,
    score: room.score || 0,
    passes: room.passes || 0,
    timer: tempsRestant,
    historique: room.historique || []
  };
}

module.exports = { startGame, action, getPublicState, MOTS };
