// game-logic/pyramide.js — Logique du jeu Pyramide
// 6 joueurs max, pyramide 4+3+2+1 cartes, multiplicateur par ligne

function getLigne(index) {
  if (index <= 3) return 1;
  if (index <= 6) return 2;
  if (index <= 8) return 3;
  return 4;
}

function getMultiplicateur(ligne) {
  return ligne === 4 ? 4 : ligne;
}

function getPyramideInfos(index) {
  if (index <= 3) return { ligne: 1, gorgees: 1, position: index };
  if (index <= 6) return { ligne: 2, gorgees: 2, position: index - 4 };
  if (index <= 8) return { ligne: 3, gorgees: 3, position: index - 7 };
  return { ligne: 4, gorgees: 4, position: 0 };
}

const { createShuffledDeck } = require('./common.js');

function buildPyramide(deck) {
  const pyramide = [];
  for (let i = 0; i < 10; i++) {
    pyramide.push({ ...deck.pop(), faceUp: false });
  }
  return pyramide;
}

function startGame(room) {
  const ids = Object.keys(room.players);
  if (ids.length < 2) return { success: false, error: 'Minimum 2 joueurs requis' };
  if (ids.length > 6) return { success: false, error: 'Maximum 6 joueurs' };

  const deck = createShuffledDeck();
  room.deck = deck;
  room.playerOrder = ids.slice();
  room.activePlayerIndex = 0;

  room.phase = 'distribution';
  room.tourDistribution = 1;
  room.joueurDistributionIndex = 0;

  for (const id of ids) {
    room.players[id].hand = [];
    room.players[id].score = 0;
  }

  return { success: true };
}

function distribuerCarte(room) {
  const joueurs = Object.keys(room.players);

  if (room.phase !== 'distribution') return { success: false, error: 'Pas en phase distribution' };
  if (room.joueurDistributionIndex >= joueurs.length) return { success: false, error: 'Tour terminé, veuillez continuer' };

  const idx = room.joueurDistributionIndex;
  room.players[joueurs[idx]].hand.push(room.deck.pop());
  room.joueurDistributionIndex++;

  // Vérifier fin de tour
  if (room.joueurDistributionIndex >= joueurs.length) {
    room.tourDistribution++;
    room.joueurDistributionIndex = 0;

    // Vérifier si tous les joueurs ont 4 cartes
    if (room.players[joueurs[0]].hand.length >= 4) {
      room.phase = 'memorisation';
      return { success: true, fini: true };
    }
  }

  return { success: true, fini: false };
}

function memoriser(room) {
  // Construire la pyramide avec le reste du deck
  room.pyramide = buildPyramide(room.deck);
  room.indexActif = 0;
  room.pyramide[0].faceUp = true;
  room.phase = 'jeu';
  return { success: true, phase: 'jeu' };
}

function flipCard(room) {
  const idx = room.indexActif;
  if (idx >= room.pyramide.length) return { success: false, error: 'Pyramide terminée' };

  room.pyramide[idx].faceUp = true;
  const ligne = getLigne(idx);
  const multiplicateur = getMultiplicateur(ligne);
  return {
    success: true,
    carte: { suit: room.pyramide[idx].suit, value: room.pyramide[idx].value, faceUp: true },
    index: idx,
    ligne,
    gorgees: multiplicateur
  };
}

function matchCard(room, playerId, handIndex) {
  const player = room.players[playerId];
  if (!player) return { success: false, error: 'Joueur introuvable' };

  const idx = room.indexActif;
  if (idx >= room.pyramide.length) return { success: false, error: 'Pyramide terminée' };
  if (handIndex < 0 || handIndex >= player.hand.length) return { success: false, error: 'Carte main invalide' };

  const pyramideCarte = room.pyramide[idx];
  const handCarte = player.hand[handIndex];

  if (pyramideCarte.value !== handCarte.value) return { success: false, error: 'Les valeurs ne correspondent pas' };

  player.hand.splice(handIndex, 1);
  player.score++;
  return { success: true, matchValue: pyramideCarte.value, mainRestante: player.hand.length };
}

function nextCard(room) {
  room.indexActif++;
  if (room.indexActif >= room.pyramide.length) {
    room.phase = 'finished';
    return { success: true, phase: 'finished' };
  }

  room.activePlayerIndex = (room.activePlayerIndex + 1) % room.playerOrder.length;
  room.pyramide[room.indexActif].faceUp = true;

  const ligne = getLigne(room.indexActif);
  const multiplicateur = getMultiplicateur(ligne);
  return {
    success: true,
    indexActif: room.indexActif,
    ligne,
    gorgees: multiplicateur,
    joueurActif: room.playerOrder[room.activePlayerIndex],
    phase: 'jeu'
  };
}

function getPublicState(room) {
  const lignes = (room.pyramide || []).map((_, i) => getLigne(i));
  const multiplicateurs = (room.pyramide || []).map((_, i) => getMultiplicateur(getLigne(i)));

  const ids = room.playerOrder || [];
  let joueurDist = null;
  if (room.phase === 'distribution') {
    const idx = room.joueurDistributionIndex;
    if (idx < ids.length) {
      joueurDist = room.players[ids[idx]] ? room.players[ids[idx]].name : null;
    }
  }

  const players = {};
  if (room.players) {
    for (const [id, p] of Object.entries(room.players)) {
      players[id] = { name: p.name, hand: p.hand };
    }
  }

  return {
    gameType: room.gameType,
    phase: room.phase,
    players,
    pyramide: (room.pyramide || []).map(c => ({
      suit: c.suit, value: c.value, faceUp: c.faceUp
    })),
    indexActif: room.indexActif || 0,
    lignes,
    multiplicateurs,
    tourDistribution: room.tourDistribution || 1,
    totalTours: 4,
    joueurDistribution: joueurDist,
    joueurActif: room.playerOrder ? room.playerOrder[room.activePlayerIndex || 0] : null,
    joueurActifIndex: room.activePlayerIndex || 0,
    playerOrder: room.playerOrder || []
  };
}

module.exports = {
  startGame, distribuerCarte, memoriser, flipCard, matchCard, nextCard,
  getPublicState, getLigne, getMultiplicateur, getPyramideInfos
};
