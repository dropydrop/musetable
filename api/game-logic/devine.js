// game-logic/devine.js — Logique du jeu Devine Tête
// Mots à deviner avec détection de mouvement (frontend)

const MOTS = [
  'Zidane', 'Micro-ondes', 'Harry Potter', 'Une vache',
  'Le Président', 'La Tour Eiffel', 'Un éléphant', 'Une guitare',
  'Le Soleil', 'Un avion', 'La Joconde', 'Un dragon',
  'Mickey Mouse', 'Un vampire', 'La Lune', 'Un piano',
  'Napoléon', 'Un fantôme', 'La plage', 'Un arc-en-ciel',
  'Spider-Man', 'Un pingouin', 'Le Mont Blanc', 'Une fusée',
  'Donald Trump', 'Un requin', 'Le Colisée', 'Un cactus',
  'Mozart', 'Un château', 'La Seine', 'Un paresseux'
];

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function startGame(room) {
  room.phase = 'playing';
  room.mots = shuffle([...MOTS]).slice(0, 15);
  room.indexActuel = 0;
  room.score = 0;
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

  room.historique.push({ mot, resultat });
  room.indexActuel++;

  if (room.indexActuel >= room.mots.length) {
    room.phase = 'finished';
    return { success: true, mot: null, score: room.score, phase: 'finished' };
  }

  return { success: true, mot: room.mots[room.indexActuel], score: room.score, phase: 'playing' };
}

function getPublicState(room) {
  const tempsEcoule = room.timestampDebut ? Math.floor((Date.now() - room.timestampDebut) / 1000) : 0;
  const tempsRestant = Math.max(0, (room.timer || 60) - tempsEcoule);

  return {
    phase: room.phase,
    motCourant: room.indexActuel < (room.mots || []).length ? room.mots[room.indexActuel] : null,
    indexActuel: room.indexActuel,
    totalMots: (room.mots || []).length,
    score: room.score || 0,
    timer: tempsRestant,
    historique: room.historique || []
  };
}

module.exports = { startGame, action, getPublicState, MOTS };
