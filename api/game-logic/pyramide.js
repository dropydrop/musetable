// game-logic/pyramide.js — Logique du jeu Pyramide
// 4 joueurs max, pyramide 4+3+2+1 cartes, multiplicateur par ligne

function getLigne(index) {
  if (index <= 3) return 1;
  if (index <= 6) return 2;
  if (index <= 8) return 3;
  return 4;
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
  if (ids.length > 4) return { success: false, error: 'Maximum 4 joueurs' };

  room.phase = 'playing';
  room.activePlayerIndex = 0;
  room.playerOrder = ids.slice();

  const deck = createShuffledDeck();
  room.pyramide = buildPyramide(deck);
  room.indexActif = 0;

  for (const id of ids) {
    const hand = [];
    for (let i = 0; i < 4; i++) {
      hand.push(deck.pop());
    }
    room.players[id].hand = hand;
    room.players[id].score = 0;
  }

  room.pyramide[0].faceUp = true;

  return {
    success: true,
    pyramide: room.pyramide.map(c => ({ suit: c.suit, value: c.value, faceUp: c.faceUp })),
    indexActif: 0,
    lignes: room.pyramide.map((_, i) => getLigne(i))
  };
}

function flipCard(room) {
  const idx = room.indexActif;
  if (idx >= room.pyramide.length) return { success: false, error: 'Pyramide terminée' };

  room.pyramide[idx].faceUp = true;
  return {
    success: true,
    carte: { suit: room.pyramide[idx].suit, value: room.pyramide[idx].value, faceUp: true },
    index: idx,
    ligne: getLigne(idx),
    multiplicateur: getLigne(idx)
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

  // Avancer au joueur suivant (tourne en rond)
  room.activePlayerIndex = (room.activePlayerIndex + 1) % room.playerOrder.length;

  // Retourner la carte suivante
  room.pyramide[room.indexActif].faceUp = true;

  return {
    success: true,
    indexActif: room.indexActif,
    ligne: getLigne(room.indexActif),
    multiplicateur: getLigne(room.indexActif),
    joueurActif: room.playerOrder[room.activePlayerIndex],
    phase: 'playing'
  };
}

function getPublicState(room) {
  return {
    phase: room.phase,
    pyramide: (room.pyramide || []).map(c => ({
      suit: c.suit, value: c.value, faceUp: c.faceUp
    })),
    indexActif: room.indexActif || 0,
    lignes: (room.pyramide || []).map((_, i) => getLigne(i)),
    joueurActif: room.playerOrder ? room.playerOrder[room.activePlayerIndex || 0] : null
  };
}

module.exports = { startGame, flipCard, matchCard, nextCard, getPublicState, getLigne };
