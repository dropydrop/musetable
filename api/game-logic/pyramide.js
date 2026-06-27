// game-logic/pyramide.js — Logique du jeu Pyramide
// 6 joueurs max, pyramide 4+3+2+1 cartes, multiplicateur par ligne

function getLigne(index) {
  if (index <= 3) return 1;
  if (index <= 6) return 2;
  if (index <= 8) return 3;
  return 4;
}

function getMultiplicateur(ligne) {
  return ligne === 4 ? 4 : ligne; // ligne 4 = cul sec = ×4
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

  // Distribution alternée : 1 carte à chaque joueur × 4 tours
  room.phase = 'distribution';
  room.tourDistribution = 0; // 0..3

  for (const id of ids) {
    room.players[id].hand = [];
    room.players[id].score = 0;
    room.players[id].cartesVisibles = true;
  }

  // Distribuer une première carte à chaque joueur (tour 0)
  for (const id of ids) {
    room.players[id].hand.push(deck.pop());
  }

  return {
    success: true,
    phase: 'distribution',
    tourDistribution: 0,
    totalTours: 4,
    joueurActif: ids[0],
    pyramide: room.pyramide.map(c => ({ suit: c.suit, value: c.value, faceUp: c.faceUp })),
    indexActif: 0
  };
}

function distribuerSuivant(room) {
  const ids = room.playerOrder;
  const tour = room.tourDistribution;
  const cartesDansMain = room.players[ids[0]].hand.length;
  const maxCartes = tour + 1; // au tour 0 → 1 carte, tour 1 → 2 cartes, etc.

  if (cartesDansMain >= 4) {
    // Déjà 4 cartes, on passe au jeu
    // Retourner toutes les cartes face cachée
    for (const id of ids) {
      room.players[id].cartesVisibles = false;
    }
    room.phase = 'playing';
    room.pyramide[0].faceUp = true;
    return {
      success: true,
      phase: 'playing',
      indexActif: 0,
      joueurActif: ids[0],
      memoFini: true
    };
  }

  // Vérifier si tout le monde a reçu sa carte pour ce tour
  const tousRecu = ids.every(id => room.players[id].hand.length >= maxCartes);
  if (tousRecu) {
    room.tourDistribution++;
    if (room.tourDistribution >= 4) {
      // Fin de distribution
      for (const id of ids) {
        room.players[id].cartesVisibles = false;
      }
      room.phase = 'playing';
      room.pyramide[0].faceUp = true;
      return {
        success: true,
        phase: 'playing',
        indexActif: 0,
        joueurActif: ids[0],
        memoFini: true
      };
    }
    // Distribuer la carte suivante à chaque joueur
    for (const id of ids) {
      room.players[id].hand.push(room.deck.pop());
    }
    return {
      success: true,
      phase: 'distribution',
      tourDistribution: room.tourDistribution,
      totalTours: 4,
      joueurActif: ids[0]
    };
  }

  // Tout le monde a déjà reçu pour ce tour
  return {
    success: true,
    phase: 'distribution',
    tourDistribution: room.tourDistribution,
    totalTours: 4,
    joueurActif: ids[0]
  };
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
    phase: 'playing'
  };
}

function getPublicState(room) {
  const lignes = (room.pyramide || []).map((_, i) => getLigne(i));
  const multiplicateurs = (room.pyramide || []).map((_, i) => getMultiplicateur(getLigne(i)));

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
    joueurActif: room.playerOrder ? room.playerOrder[room.activePlayerIndex || 0] : null,
    joueurActifIndex: room.activePlayerIndex || 0,
    playerOrder: room.playerOrder || []
  };
}

module.exports = { startGame, distribuerSuivant, flipCard, matchCard, nextCard, getPublicState, getLigne, getMultiplicateur };
