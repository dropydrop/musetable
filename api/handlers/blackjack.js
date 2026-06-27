// api/handlers/blackjack.js — Routes Blackjack
// Extraites de api/index.js
// Chaque fonction reçoit (room, body, res, games) et gère sa réponse

const {
  calculateScore,
  nextTurn,
  checkGameFinished,
  MISE_PAR_DEFAUT
} = require('../game-logic/blackjack.js');

/**
 * POST /api/start-game — distribue 2 cartes à chaque joueur
 * Vérifie blackjack naturel (21 en 2 cartes) → fin instantanée
 */
async function startGame(room, body, res, games) {
  if (Object.keys(room.players).length === 0) { res.status(400).json({ success: false, error: 'Aucun joueur' }); return; }
  if (room.phase !== 'waiting') { res.status(400).json({ success: false, error: 'Partie déjà commencée' }); return; }

  for (const [, p] of Object.entries(room.players)) {
    p.hand = [];
    p.score = 0;
    p.isActive = true;
    p.stand = false;
    p.resultat = null;
    p.gain = null;
    if (p.solde === undefined) p.solde = 100;
    p.mise = room.miseParDefaut || MISE_PAR_DEFAUT;
    if (p.mise > p.solde) p.mise = Math.max(1, Math.floor(p.solde / 2));
  }

  for (const [, p] of Object.entries(room.players)) {
    p.hand.push(room.deck.pop());
    p.hand.push(room.deck.pop());
    p.score = calculateScore(p.hand);
  }

  room.phase = 'playing';
  room.playerOrder = Object.keys(room.players);
  room.turnIndex = 0;
  room.currentTurn = room.playerOrder[0];
  room.winners = null;
  room.result = null;

  // Vérifier blackjack naturel (21 en 2 cartes) — par ID, pas par nom
  const bjEntries = Object.entries(room.players)
    .filter(([, p]) => p.score === 21 && p.hand.length === 2);
  const bjIds = bjEntries.map(([id]) => id);

  if (bjEntries.length >= 1) {
    room.phase = 'finished';
    const miseRef = room.miseParDefaut || MISE_PAR_DEFAUT;
    if (bjEntries.length === 1) {
      const bjId = bjIds[0];
      room.winners = [room.players[bjId].name];
      room.result = 21;
      for (const [id, p] of Object.entries(room.players)) {
        const m = p.mise || miseRef;
        if (id === bjId) {
          const gain = m;
          p.solde = (p.solde || 100) + gain;
          p.resultat = 'gagné';
          p.gain = gain;
        } else {
          p.solde = (p.solde || 100) - m;
          p.resultat = 'perdu';
          p.gain = -m;
        }
        p.mise = 0;
      }
    } else {
      room.winners = bjEntries.map(([, p]) => p.name);
      room.result = 21;
      for (const [, p] of Object.entries(room.players)) {
        p.resultat = null;
        p.gain = null;
        p.mise = 0;
      }
    }
    res.status(200).json({ success: true, blackjack: true, winners: room.winners, push: bjEntries.length > 1 });
    return;
  }

  res.status(200).json({ success: true });
}

/**
 * POST /api/hit — pioche une carte
 * Auto-stand si score >= 21 (bust ou blackjack pendant le jeu)
 */
async function hit(room, body, res, games) {
  const { playerId } = body;
  if (room.phase !== 'playing') { res.status(400).json({ success: false, error: 'Partie pas en cours' }); return; }
  if (room.currentTurn !== playerId) { res.status(400).json({ success: false, error: 'Pas votre tour' }); return; }

  const player = room.players[playerId];
  if (!player) { res.status(404).json({ success: false, error: 'Joueur introuvable' }); return; }

  player.hand.push(room.deck.pop());
  player.score = calculateScore(player.hand);

  if (player.score >= 21) {
    player.isActive = false;
    player.stand = true;
    nextTurn(room);
  }

  res.status(200).json({ success: true, score: player.score });
}

/**
 * POST /api/stand — passe le tour
 */
async function stand(room, body, res, games) {
  const { playerId } = body;
  if (room.phase !== 'playing') { res.status(400).json({ success: false, error: 'Partie pas en cours' }); return; }
  if (room.currentTurn !== playerId) { res.status(400).json({ success: false, error: 'Pas votre tour' }); return; }

  const player = room.players[playerId];
  if (!player) { res.status(404).json({ success: false, error: 'Joueur introuvable' }); return; }

  player.stand = true;
  player.isActive = false;
  nextTurn(room);

  res.status(200).json({ success: true });
}

/**
 * POST /api/double — tire 1 carte + stand automatique (2 cartes max), double la mise
 */
async function double(room, body, res, games) {
  const { playerId } = body;
  if (room.phase !== 'playing') { res.status(400).json({ success: false, error: 'Partie pas en cours' }); return; }
  if (room.currentTurn !== playerId) { res.status(400).json({ success: false, error: 'Pas votre tour' }); return; }

  const player = room.players[playerId];
  if (!player) { res.status(404).json({ success: false, error: 'Joueur introuvable' }); return; }

  if (player.hand.length !== 2) { res.status(400).json({ success: false, error: 'Double uniquement sur les 2 premières cartes' }); return; }

  player.hand.push(room.deck.pop());
  player.score = calculateScore(player.hand);
  player.mise = (player.mise || MISE_PAR_DEFAUT) * 2;
  player.stand = true;
  player.isActive = false;
  nextTurn(room);

  res.status(200).json({ success: true, score: player.score, mise: player.mise });
}

/**
 * POST /api/blackjack/redeal — redistribue sans reset des soldes
 */
async function redeal(room, body, res, games) {
  room.phase = 'playing';
  room.deck = require('../game-logic/common.js').createShuffledDeck();
  room.turnIndex = 0;
  room.playerOrder = Object.keys(room.players);
  room.currentTurn = room.playerOrder[0];
  room.winners = null;
  room.result = null;

  for (const [, p] of Object.entries(room.players)) {
    p.hand = [];
    p.score = 0;
    p.isActive = true;
    p.stand = false;
    p.resultat = null;
    p.gain = null;
    p.mise = room.miseParDefaut || MISE_PAR_DEFAUT;
    if (p.mise > p.solde) p.mise = Math.max(1, Math.floor(p.solde / 2));
  }

  for (const [, p] of Object.entries(room.players)) {
    p.hand.push(room.deck.pop());
    p.hand.push(room.deck.pop());
    p.score = calculateScore(p.hand);
  }

  // Vérifier blackjack naturel — par ID
  const bjEntries = Object.entries(room.players)
    .filter(([, p]) => p.score === 21 && p.hand.length === 2);
  const bjIds = bjEntries.map(([id]) => id);

  if (bjEntries.length >= 1) {
    room.phase = 'finished';
    const miseRef = room.miseParDefaut || MISE_PAR_DEFAUT;
    if (bjEntries.length === 1) {
      const bjId = bjIds[0];
      room.winners = [room.players[bjId].name];
      room.result = 21;
      for (const [id, p] of Object.entries(room.players)) {
        const m = p.mise || miseRef;
        if (id === bjId) {
          const gain = m;
          p.solde = (p.solde || 100) + gain;
          p.resultat = 'gagné';
          p.gain = gain;
        } else {
          p.solde = (p.solde || 100) - m;
          p.resultat = 'perdu';
          p.gain = -m;
        }
        p.mise = 0;
      }
    } else {
      room.winners = bjEntries.map(([, p]) => p.name);
      room.result = 21;
      for (const [, p] of Object.entries(room.players)) {
        p.resultat = null;
        p.gain = null;
        p.mise = 0;
      }
    }
    res.status(200).json({ success: true, blackjack: true, winners: room.winners, push: bjEntries.length > 1 });
    return;
  }

  res.status(200).json({ success: true });
}

module.exports = { startGame, hit, stand, double, redeal };
