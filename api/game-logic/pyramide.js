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
  room.pyramide = buildPyramide(deck);
  room.indexActif = 0;
  room.pyramide[0].faceUp = true;

  room.phase = 'distribution';
  room.tourDistribution = 0;
  room.indexDistribution = 0;

  for (const id of ids) {
    room.players[id].hand = [];
    room.players[id].score = 0;
  }

  // 1 carte au premier joueur
  room.players[ids[0]].hand.push(deck.pop());
  room.indexDistribution = 1;

  return { success: true, phase: 'distribution', tourDistribution: 0 };
}

function distribuerSuivant(room) {
  const ids = room.playerOrder;
  const idx = room.indexDistribution;

  if (idx >= ids.length) {
    // Tour terminé
    room.tourDistribution++;
    room.indexDistribution = 0;
    if (room.tourDistribution >= 4) {
      return { success: true, phase: 'distribution', complete: true, tourDistribution: 4 };
    }
    return { success: true, phase: 'distribution', tourDistribution: room.tourDistribution };
  }

  // Distribuer 1 carte au joueur courant
  room.players[ids[idx]].hand.push(room.deck.pop());
  room.indexDistribution = idx + 1;
  return { success: true, phase: 'distribution', tourDistribution: room.tourDistribution };
}

function memoriser(room) {
  room.phase = 'jeu';
  room.pyramide[0].faceUp = true;
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

  const idxDist = room.indexDistribution;
  const ids = room.playerOrder || [];
  let joueurDist = null;
  if (room.phase === 'distribution') {
    if (idxDist < ids.length) {
      joueurDist = room.players[ids[idxDist]] ? room.players[ids[idxDist]].name : null;
    } else {
      joueurDist = ids.length > 0 && room.players[ids[0]] ? room.players[ids[0]].name : null;
    }
  }

  return {
    phase: room.phase,
    pyramide: (room.pyramide || []).map(c => ({
      suit: c.suit, value: c.value, faceUp: c.faceUp
    })),
    indexActif: room.indexActif || 0,
    lignes,
    multiplicateurs,
    tourDistribution: room.tourDistribution || 0,
    totalTours: 4,
    joueurDistribution: joueurDist,
    joueurActif: room.playerOrder ? room.playerOrder[room.activePlayerIndex || 0] : null,
    joueurActifIndex: room.activePlayerIndex || 0,
    playerOrder: room.playerOrder || []
  };
}

module.exports = {
  startGame, distribuerSuivant, memoriser, flipCard, matchCard, nextCard,
  getPublicState, getLigne, getMultiplicateur, getPyramideInfos
};
