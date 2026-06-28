// game-logic/devine.js — Logique du jeu Devine Tête

const CATEGORIES = {
  'Pop-culture': ['Zidane', 'Harry Potter', 'Mickey Mouse', 'Spider-Man', 'Donald Trump', 'Mozart', 'Napoléon', 'La Joconde', 'Le Président', 'La Tour Eiffel', 'Le Mont Blanc', 'Le Colisée', 'La Seine', 'Un dragon', 'Un vampire', 'Un fantôme', 'Un pingouin', 'Un requin', 'Un paresseux', 'Un éléphant', 'Une vache', 'Un cactus', 'Un avion', 'Une fusée', 'Un château', 'Une guitare', 'Un piano', 'Le Soleil', 'La Lune', 'Un arc-en-ciel', 'Micro-ondes', 'La plage'],
  'Histoire': ['Jules César', 'Cléopâtre', 'Charlemagne', 'Jeanne d\'Arc', 'Louis XIV', 'Marie-Antoinette', 'Napoléon Bonaparte', 'Victor Hugo', 'Charles de Gaulle', 'Albert Einstein', 'Marie Curie', 'Nelson Mandela', 'Martin Luther King', 'Gandhi', 'Christophe Colomb', 'Vasco de Gama', 'Magellan', 'Alexandre le Grand', 'Hannibal', 'Spartacus', 'Attila', 'Gengis Khan', 'Marco Polo', 'Galilée', 'Copernic', 'Descartes', 'Voltaire', 'Rousseau', 'Robespierre', 'Danton'],
  'Animaux': ['Un lion', 'Un tigre', 'Un ours', 'Un loup', 'Un renard', 'Un cerf', 'Un sanglier', 'Un lièvre', 'Un écureuil', 'Un castor', 'Une loutre', 'Un blaireau', 'Un hérisson', 'Une chauve-souris', 'Un dauphin', 'Une baleine', 'Un orque', 'Un phoque', 'Un morse', 'Un éléphant', 'Une girafe', 'Un zèbre', 'Un rhinocéros', 'Un hippopotame', 'Un crocodile', 'Un alligator', 'Un serpent', 'Un lézard', 'Une tortue', 'Un aigle'],
  'Métiers': ['Un médecin', 'Un avocat', 'Un architecte', 'Un ingénieur', 'Un professeur', 'Un chercheur', 'Un pilote', 'Un marin', 'Un soldat', 'Un policier', 'Un pompier', 'Un menuisier', 'Un électricien', 'Un plombier', 'Un maçon', 'Un peintre', 'Un sculpteur', 'Un écrivain', 'Un poète', 'Un compositeur', 'Un chef', 'Un boulanger', 'Un pâtissier', 'Un boucher', 'Un charcutier', 'Un poissonnier', 'Un primeur', 'Un fleuriste', 'Un jardinier', 'Un paysan'],
  'Objets': ['Un téléphone', 'Un ordinateur', 'Une tablette', 'Un casque', 'Une montre', 'Des lunettes', 'Un parapluie', 'Une valise', 'Un sac', 'Une lampe', 'Un canapé', 'Un fauteuil', 'Une table', 'Une chaise', 'Un lit', 'Une armoire', 'Une étagère', 'Un miroir', 'Une horloge', 'Une pendule', 'Un agenda', 'Un stylo', 'Un crayon', 'Une gomme', 'Une règle', 'Un compas', 'Une équerre', 'Un rapporteur', 'Un thermomètre', 'Une balance'],
  'Divers': ['Un nuage', 'Un orage', 'Une tempête', 'Un ouragan', 'Un cyclone', 'Une tornade', 'Un tsunami', 'Un séisme', 'Une avalanche', 'Un éboulement', 'Un volcan', 'Une éruption', 'Une cascade', 'Un geyser', 'Un glacier', 'Une dune', 'Une oasis', 'Un désert', 'Une jungle', 'Une forêt', 'Une rivière', 'Un fleuve', 'Un lac', 'Une mer', 'Un océan', 'Une île', 'Un archipel', 'Une péninsule', 'Un cap', 'Un détroit', 'Un isthme', 'Un canal', 'Un pont', 'Un tunnel', 'Une route', 'Un chemin', 'Une allée', 'Une cour', 'Un jardin', 'Un parc', 'Un tremplin', 'Un balcon', 'Une terrasse', 'Un grenier', 'Une cave', 'Un escalier', 'Un ascenseur', 'Un toboggan']
};

const MOTS = Object.values(CATEGORIES).flat();

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getCategorie(mot) {
  for (const [cat, mots] of Object.entries(CATEGORIES)) {
    if (mots.includes(mot)) return cat;
  }
  return 'Divers';
}

function startGame(room, body) {
  const timerPerTour = parseInt(body?.timerPerTour) || 45;
  const motsParTour = parseInt(body?.motsParTour) || 6;

  if (![30, 45, 60].includes(timerPerTour)) return { success: false, error: 'timerPerTour invalide (30/45/60)' };
  if (![4, 6, 8, 10].includes(motsParTour)) return { success: false, error: 'motsParTour invalide (4/6/8/10)' };

  room.phase = 'TURN_START';

  if (![30, 45, 60].includes(timerPerTour)) return { success: false, error: 'timerPerTour invalide (30/45/60)' };
  if (![4, 6, 8, 10].includes(motsParTour)) return { success: false, error: 'motsParTour invalide (4/6/8/10)' };

  room.phase = 'TURN_START';
  room.config = { timerPerTour, motsParTour };
  room.playerOrder = Object.keys(room.players);
  room.tourIndex = 0;
  room.guesserId = room.playerOrder[0] || null;
  room.scores = {};
  for (const id of room.playerOrder) {
    room.scores[id] = { trouve: 0, passe: 0, mots: [] };
  }
  room.mots = [];
  room.indexActuel = 0;
  room.timestampDebutTour = null;
  room.historique = [];

  return { success: true };
}

function startTurn(room) {
  if (room.phase !== 'TURN_START') return { success: false, error: 'Mauvaise phase' };

  room.mots = shuffle([...MOTS]).slice(0, room.config.motsParTour);
  room.indexActuel = 0;
  room.timestampDebutTour = Date.now();
  room.phase = 'TURN_PLAYING';

  return { success: true, mot: room.mots[0] };
}

function action(room, body) {
  if (room.phase !== 'TURN_PLAYING') return { success: false, error: 'Pas en phase de jeu' };

  const { actionType } = body;
  if (!actionType || !['TROUVE', 'PASSE'].includes(actionType)) {
    return { success: false, error: 'Action invalide (TROUVE ou PASSE)' };
  }

  // Vérifier expiration du timer
  const elapsed = (Date.now() - room.timestampDebutTour) / 1000;
  if (elapsed >= room.config.timerPerTour) {
    room.phase = 'TURN_DONE';
    return { success: true, phase: 'TURN_DONE', timeout: true };
  }

  const mot = room.mots[room.indexActuel];
  if (!mot) return { success: false, error: 'Plus de mots' };

  const guesserScore = room.scores[room.guesserId];
  if (actionType === 'TROUVE') guesserScore.trouve++;
  else guesserScore.passe++;

  guesserScore.mots.push({ mot, resultat: actionType === 'TROUVE' ? 'TROUVÉ' : 'PASSÉ' });
  room.indexActuel++;

  if (room.indexActuel >= room.config.motsParTour) {
    room.phase = 'TURN_DONE';
    return { success: true, phase: 'TURN_DONE' };
  }

  return { success: true, mot: room.mots[room.indexActuel] };
}

function endTurn(room) {
  if (room.phase !== 'TURN_PLAYING' && room.phase !== 'TURN_DONE') {
    return { success: false, error: 'Mauvaise phase' };
  }
  room.phase = 'TURN_DONE';
  return { success: true };
}

function nextTurn(room) {
  if (room.phase !== 'TURN_DONE') return { success: false, error: 'Pas en TURN_DONE' };

  room.tourIndex++;
  if (room.tourIndex >= room.playerOrder.length) {
    room.phase = 'ALL_DONE';
    return { success: true, phase: 'ALL_DONE' };
  }

  room.guesserId = room.playerOrder[room.tourIndex];
  room.phase = 'TURN_START';
  return { success: true, phase: 'TURN_START', guesserId: room.guesserId };
}

function getPublicState(room) {
  const players = {};
  if (room.players) {
    for (const [id, p] of Object.entries(room.players)) {
      players[id] = { name: p.name };
    }
  }

  let timerRestant = 0;
  if (room.phase === 'TURN_PLAYING' && room.timestampDebutTour) {
    const elapsed = Math.floor((Date.now() - room.timestampDebutTour) / 1000);
    timerRestant = Math.max(0, room.config.timerPerTour - elapsed);
    // Auto-end turn if timer expired
    if (timerRestant <= 0) {
      room.phase = 'TURN_DONE';
    }
  }

  const guesserName = room.guesserId && players[room.guesserId] ? players[room.guesserId].name : null;

  let winner = null;
  if (room.phase === 'ALL_DONE' && room.playerOrder.length > 1) {
    let bestId = null;
    let bestScore = -1;
    for (const id of room.playerOrder) {
      const s = room.scores[id];
      if (s && s.trouve > bestScore) {
        bestScore = s.trouve;
        bestId = id;
      }
    }
    if (bestId && bestScore > 0) winner = bestId;
  }

  const motCourant = room.phase === 'TURN_PLAYING' && room.indexActuel < room.mots.length
    ? room.mots[room.indexActuel] : null;

  const categorie = motCourant ? getCategorie(motCourant) : null;

  return {
    gameType: room.gameType,
    players,
    phase: room.phase,
    config: room.config || { timerPerTour: 45, motsParTour: 8 },
    guesserId: room.guesserId,
    guesserName,
    timerRestant,
    motCourant,
    categorie,
    indexActuel: room.indexActuel,
    totalMots: room.config?.motsParTour || 8,
    scores: room.scores || {},
    winner,
    playerOrder: room.playerOrder || []
  };
}

module.exports = { startGame, startTurn, action, endTurn, nextTurn, getPublicState, MOTS };
