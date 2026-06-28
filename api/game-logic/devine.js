// game-logic/devine.js — Logique du jeu Devine Tête

const CATEGORIES = {
  'Célébrités': [
    'Brad Pitt', 'Leonardo DiCaprio', 'Johnny Depp', 'Will Smith', 
    'Tom Cruise', 'Dwayne Johnson', 'Scarlett Johansson', 'Angelina Jolie',
    'Jennifer Lawrence', 'Margot Robbie', 'Ryan Reynolds', 'Chris Hemsworth',
    'Robert Downey Jr', 'Keanu Reeves', 'Morgan Freeman', 'Denzel Washington',
    'Al Pacino', 'Robert De Niro', 'Jack Nicholson', 'Clint Eastwood',
    'Meryl Streep', 'Cate Blanchett', 'Natalie Portman', 'Emma Watson',
    'Daniel Radcliffe', 'Zendaya', 'Timothée Chalamet', 'Tom Holland',
    'Millie Bobby Brown', 'Adele', 'Beyoncé', 'Taylor Swift',
    'Rihanna', 'Eminem', 'Jay-Z', 'Michael Jordan',
    'LeBron James', 'Kylian Mbappé', 'Lionel Messi', 'Cristiano Ronaldo'
  ],
  'Pop-culture': [
    'Zidane', 'Harry Potter', 'Mickey Mouse', 'Spider-Man',
    'Donald Trump', 'Mozart', 'Napoléon', 'La Joconde',
    'Tour Eiffel', 'Mont Blanc', 'Colisée', 'Seine',
    'dragon', 'vampire', 'fantôme', 'pingouin',
    'requin', 'paresseux', 'éléphant', 'vache',
    'cactus', 'avion', 'fusée', 'château',
    'guitare', 'piano', 'Soleil', 'Lune',
    'arc-en-ciel', 'micro-ondes', 'plage', 'Titanic',
    'Jurassic Park', 'Star Wars', 'Batman'
  ],
  'Histoire': [
    'Jules César', 'Cléopâtre', 'Charlemagne', 'Jeanne d\'Arc',
    'Louis XIV', 'Marie-Antoinette', 'Victor Hugo', 'Charles de Gaulle',
    'Albert Einstein', 'Marie Curie', 'Nelson Mandela', 'Martin Luther King',
    'Gandhi', 'Christophe Colomb', 'Vasco de Gama', 'Magellan',
    'Alexandre le Grand', 'Hannibal', 'Spartacus', 'Attila',
    'Gengis Khan', 'Marco Polo', 'Galilée', 'Copernic',
    'Descartes', 'Voltaire', 'Rousseau', 'Robespierre',
    'Danton', 'Che Guevara'
  ],
  'Animaux': [
    'lion', 'tigre', 'ours', 'loup',
    'renard', 'cerf', 'sanglier', 'lièvre',
    'écureuil', 'castor', 'loutre', 'blaireau',
    'hérisson', 'chauve-souris', 'dauphin', 'baleine',
    'orque', 'phoque', 'morse', 'girafe',
    'zèbre', 'rhinocéros', 'hippopotame', 'crocodile',
    'alligator', 'serpent', 'lézard', 'tortue',
    'aigle', 'hibou', 'chouette', 'pélican',
    'flamant rose', 'manchot', 'kangourou'
  ],
  'Métiers': [
    'médecin', 'avocat', 'architecte', 'ingénieur',
    'professeur', 'chercheur', 'pilote', 'marin',
    'soldat', 'policier', 'pompier', 'menuisier',
    'électricien', 'plombier', 'maçon', 'peintre',
    'sculpteur', 'écrivain', 'poète', 'compositeur',
    'chef cuisinier', 'boulanger', 'pâtissier', 'boucher',
    'charcutier', 'poissonnier', 'primeur', 'fleuriste',
    'jardinier', 'paysan'
  ],
  'Objets': [
    'téléphone', 'ordinateur', 'tablette', 'casque',
    'montre', 'lunettes', 'parapluie', 'valise',
    'sac', 'lampe', 'canapé', 'fauteuil',
    'table', 'chaise', 'lit', 'armoire',
    'étagère', 'miroir', 'horloge', 'pendule',
    'agenda', 'stylo', 'crayon', 'gomme',
    'règle', 'compas', 'équerre', 'rapporteur',
    'thermomètre', 'balance'
  ],
  'Nature': [
    'nuage', 'orage', 'tempête', 'ouragan',
    'cyclone', 'tornade', 'tsunami', 'séisme',
    'avalanche', 'éboulement', 'volcan', 'éruption',
    'cascade', 'geyser', 'glacier', 'dune',
    'oasis', 'désert', 'jungle', 'forêt',
    'rivière', 'fleuve', 'lac', 'mer',
    'océan', 'île', 'archipel', 'péninsule',
    'cap', 'détroit'
  ],
  'Divers': [
    'bateau', 'voilier', 'sous-marin', 'hélicoptère',
    'montgolfière', 'parachute', 'trampoline', 'balançoire',
    'toboggan', 'manège', 'phare', 'clocher',
    'église', 'cathédrale', 'mosquée', 'temple',
    'pagode', 'gratte-ciel', 'immeuble', 'villa',
    'manoir', 'cabane', 'yourte', 'igloo',
    'tipi', 'château-fort', 'donjon', 'rempart',
    'bastille', 'arc de triomphe'
  ]
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
    config: room.config || { timerPerTour: 45, motsParTour: 6 },
    guesserId: room.guesserId,
    guesserName,
    timerRestant,
    motCourant,
    categorie,
    indexActuel: room.indexActuel,
    totalMots: room.config?.motsParTour || 6,
    scores: room.scores || {},
    winner,
    playerOrder: room.playerOrder || []
  };
}

module.exports = { startGame, startTurn, action, endTurn, nextTurn, getPublicState, CATEGORIES, MOTS };
