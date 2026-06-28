// game-logic/devine.js — Logique du jeu Devine Tête

const CATEGORIES = {
  'Célébrités': [
    // Acteurs
    'Brad Pitt', 'Leonardo DiCaprio', 'Johnny Depp', 'Will Smith',
    'Tom Cruise', 'Dwayne Johnson', 'Scarlett Johansson', 'Angelina Jolie',
    'Jennifer Lawrence', 'Margot Robbie', 'Ryan Reynolds', 'Chris Hemsworth',
    'Robert Downey Jr', 'Keanu Reeves', 'Morgan Freeman', 'Denzel Washington',
    'Al Pacino', 'Robert De Niro', 'Meryl Streep', 'Emma Watson',
    'Tom Holland', 'Zendaya', 'Hugh Jackman', 'Ryan Gosling',
    'Anne Hathaway', 'Joaquin Phoenix', 'Christian Bale', 'Sandra Bullock',
    'Julia Roberts', 'George Clooney', 'Matt Damon',
    // Chanteurs
    'Adele', 'Beyoncé', 'Taylor Swift', 'Rihanna',
    'Eminem', 'Jay-Z', 'Lady Gaga', 'Shakira',
    'Ed Sheeran', 'Bruno Mars', 'Billie Eilish', 'Dua Lipa',
    // Sportifs
    'Michael Jordan', 'LeBron James', 'Kylian Mbappé', 'Lionel Messi',
    'Cristiano Ronaldo', 'Serena Williams', 'Rafael Nadal', 'Roger Federer',
    'Usain Bolt', 'Zinedine Zidane', 'Neymar', 'Novak Djokovic'
  ],
  'Pop-culture': [
    // Personnages
    'Mickey Mouse', 'Spider-Man', 'Batman', 'Superman',
    'Wonder Woman', 'Iron Man', 'Captain America', 'Thor',
    'Deadpool', 'Wolverine', 'Indiana Jones', 'James Bond',
    'Luke Skywalker', 'Darth Vader', 'Harry Potter', 'Hermione',
    'Gandalf', 'King Kong', 'Godzilla',
    // Films et œuvres
    'Star Wars', 'Jurassic Park', 'Titanic', 'Avatar',
    'Inception', 'Pulp Fiction', 'The Matrix', 'Forrest Gump',
    'Gladiator', 'Interstellar', 'Back to the Future',
    // Lieux et monuments
    'Tour Eiffel', 'Mont Blanc', 'Colisée', 'Amazonie',
    'Sahara', 'Himalaya', 'Grand Canyon', 'Mont-Saint-Michel',
    'Château de Versailles', 'Machu Picchu',
    // Mythiques
    'dragon', 'vampire', 'fantôme', 'licorne',
    'phénix', 'troll', 'yeti', 'centaure',
    // Jeux vidéo
    'Mario', 'Sonic', 'Pikachu', 'Pokémon',
    'Zelda', 'Minecraft', 'Tetris'
  ],
  'Histoire': [
    'Jules César', 'Cléopâtre', 'Charlemagne', 'Jeanne d\'Arc',
    'Louis XIV', 'Marie-Antoinette', 'Victor Hugo', 'Charles de Gaulle',
    'Albert Einstein', 'Marie Curie', 'Nelson Mandela', 'Martin Luther King',
    'Gandhi', 'Christophe Colomb', 'Magellan', 'Alexandre le Grand',
    'Spartacus', 'Gengis Khan', 'Marco Polo', 'Galilée',
    'Copernic', 'Descartes', 'Voltaire', 'Rousseau',
    'Robespierre', 'Napoléon', 'Louis XVI', 'Henri IV',
    'François 1er', 'Molière', 'Léonard de Vinci', 'Pasteur',
    'Lavoisier', 'Beethoven', 'Mozart',
    // Événements
    'Révolution française', 'Empire romain', 'Égypte antique', 'Moyen-Âge',
    'Renaissance', 'Siècle des Lumières', 'Guerre froide',
    // Explorateurs
    'Vasco de Gama', 'Hannibal', 'Attila', 'Che Guevara',
    'Périclès', 'Auguste', 'Leonidas', 'Catherine II',
    'Élisabeth Ire', 'Pierre le Grand',
    'Pablo Picasso', 'Van Gogh', 'La Joconde'
  ],
  'Animaux': [
    // Mammifères
    'lion', 'tigre', 'ours', 'loup',
    'renard', 'cerf', 'sanglier', 'lièvre',
    'écureuil', 'castor', 'hérisson', 'kangourou',
    'koala', 'panda', 'paresseux', 'rat',
    'souris', 'lapin', 'hamster',
    // Mammifères marins
    'dauphin', 'baleine', 'orque', 'phoque',
    // Reptiles et amphibiens
    'crocodile', 'serpent', 'lézard', 'tortue',
    'crapaud', 'salamandre',
    // Oiseaux
    'aigle', 'hibou', 'chouette', 'pélican',
    'flamant rose', 'manchot', 'corbeau', 'perroquet',
    // Insectes
    'papillon', 'libellule', 'coccinelle', 'abeille',
    'fourmi', 'araignée',
    // Exotiques
    'girafe', 'zèbre', 'rhinocéros', 'hippopotame',
    'éléphant', 'chimpanzé', 'gorille', 'chauve-souris',
    'lama', 'alpaga', 'dromadaire', 'chameau'
  ],
  'Métiers': [
    // Classiques
    'médecin', 'avocat', 'architecte', 'ingénieur',
    'professeur', 'chercheur', 'pilote', 'marin',
    'soldat', 'policier', 'pompier', 'menuisier',
    'électricien', 'plombier', 'maçon', 'peintre',
    'sculpteur', 'écrivain',
    // Artistiques
    'poète', 'compositeur', 'chanteur', 'acteur',
    'cinéaste', 'photographe', 'danseur', 'musicien',
    // Bouche
    'chef cuisinier', 'boulanger', 'pâtissier', 'boucher',
    'fleuriste', 'primeur',
    // Soin
    'vétérinaire', 'dentiste', 'infirmier', 'pharmacien',
    'sage-femme',
    // Services
    'jardinier', 'paysan', 'facteur', 'coiffeur',
    'bibliothécaire', 'gardien', 'juge', 'notaire',
    // Métiers rares
    'astronaute', 'détective', 'plongeur', 'pompiste',
    'interprète', 'traducteur', 'archéologue', 'géologue',
    'courrier', 'livreur', 'serrurier'
  ],
  'Objets': [
    // Électronique
    'téléphone', 'ordinateur', 'tablette', 'casque',
    'montre', 'appareil photo', 'imprimante', 'télévision',
    // Meubles
    'canapé', 'fauteuil', 'table', 'chaise',
    'lit', 'armoire', 'étagère', 'bureau',
    'commode', 'bibliothèque',
    // Ustensiles
    'parapluie', 'valise', 'sac', 'lampe',
    'stylo', 'crayon', 'ciseaux', 'marteau',
    'tournevis', 'clé',
    // Maison
    'horloge', 'miroir', 'cadre', 'vase',
    'bougie', 'coussin', 'tapis', 'rideau',
    // Instruments
    'règle', 'compas', 'thermomètre', 'balance',
    'télescope', 'microscope', 'jumelles', 'boussole',
    'fermeture éclair', 'agrafeuse', 'punaise', 'trombone',
    'éponge', 'serpillière', 'balai', 'poubelle', 'boîte',
    'ficelle', 'corde'
  ],
  'Nature': [
    // Phénomènes
    'nuage', 'orage', 'tempête', 'arc-en-ciel',
    'tonnerre', 'éclair', 'pluie', 'neige',
    'brume', 'vent', 'soleil', 'lune',
    // Reliefs
    'volcan', 'cascade', 'glacier', 'dune',
    'oasis', 'désert', 'montagne', 'plage',
    // Écosystèmes
    'forêt', 'rivière', 'fleuve', 'lac',
    'mer', 'océan', 'île', 'jungle',
    // Géographie simple
    'vallée', 'plaine', 'colline', 'rocher',
    'source', 'étang', 'crique', 'grotte',
    'falaise', 'pré', 'champ', 'verger',
    // Espace
    'étoile', 'planète', 'comète', 'galaxie',
    'lever du soleil', 'coucher du soleil', 'aube', 'crépuscule',
    'écume', 'marée', 'vague', 'sable', 'coquillage',
    'corail', 'algue'
  ],
  'Nourriture': [
    // Plats
    'pizza', 'burger', 'sushi', 'croissant',
    'baguette', 'crêpe', 'paella', 'tartiflette',
    'raclette', 'fondue', 'lasagnes', 'couscous',
    'tacos', 'sandwich', 'salade',
    // Fruits
    'pomme', 'banane', 'fraise', 'citron',
    'orange', 'raisin', 'pastèque', 'ananas',
    'mangue', 'kiwi', 'pêche', 'cerise',
    // Légumes
    'tomate', 'carotte', 'brocoli', 'salade',
    'champignon', 'maïs', 'petit pois',
    // Desserts
    'tarte', 'gâteau', 'glace', 'mousse',
    'macaron', 'mille-feuille', 'crème brûlée',
    // Boissons
    'café', 'thé', 'chocolat chaud', 'limonade',
    'jus d\'orange', 'eau pétillante',
    'soda', 'milkshake', 'smoothie', 'sirop',
    'confiture', 'miel', 'beurre', 'fromage'
  ],
  'Divers': [
    // Véhicules
    'bateau', 'voilier', 'sous-marin', 'hélicoptère',
    'montgolfière', 'parachute', 'trampoline',
    // Bâtiments
    'phare', 'église', 'cathédrale', 'mosquée',
    'gratte-ciel', 'villa', 'manoir', 'cabane',
    'château-fort', 'igloo',
    // Monuments
    'pyramide', 'arc de triomphe', 'statue', 'obélisque',
    'colonne', 'pont', 'tour',
    // Sports
    'football', 'basketball', 'tennis', 'volleyball',
    'natation', 'escalade', 'vélo', 'ski',
    'surf', 'équitation',
    // Loisirs
    'balançoire', 'manège', 'toboggan', 'cerf-volant',
    'jeu de société', 'puzzle', 'dé', 'carte',
    'instrument', 'masque', 'déguisement', 'chapeau',
    'gant', 'écharpe', 'ceinture', 'bague',
    'collier', 'marionnette', 'harmonica', 'accordéon',
    'scie'
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
  room.mots = shuffle([...MOTS]).slice(0, room.config.motsParTour);
  room.indexActuel = 0;
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
