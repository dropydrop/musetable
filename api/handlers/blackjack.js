// api/handlers/blackjack.js — Routes Blackjack
// Extraites de api/index.js
// Chaque fonction reçoit (room, body, res, games) et gère sa réponse

const {
  calculateScore,
  nextTurn,
  checkGameFinished
} = require('../../game-logic/blackjack.js');

/**
 * POST /api/start-game — distribue 2 cartes à chaque joueur
 */
async function startGame(room, body, res, games) {
  if (Object.keys(room.players).length === 0) { res.status(400).json({ success: false, error: 'Aucun joueur' }); return; }
  if (room.phase !== 'waiting') { res.status(400).json({ success: false, error: 'Partie déjà commencée' }); return; }

  for (const p of Object.values(room.players)) {
    p.hand.push(room.deck.pop());
    p.hand.push(room.deck.pop());
    p.score = calculateScore(p.hand);
    p.isActive = true;
    p.stand = false;
  }

  room.phase = 'playing';
  room.playerOrder = Object.keys(room.players);
  room.turnIndex = 0;
  room.currentTurn = room.playerOrder[0];
  res.status(200).json({ success: true });
}

/**
 * POST /api/hit — pioche une carte
 */
async function hit(room, body, res, games) {
  const { playerId } = body;
  if (room.phase !== 'playing') { res.status(400).json({ success: false, error: 'Partie pas en cours' }); return; }
  if (room.currentTurn !== playerId) { res.status(400).json({ success: false, error: 'Pas votre tour' }); return; }

  const player = room.players[playerId];
  if (!player) { res.status(404).json({ success: false, error: 'Joueur introuvable' }); return; }

  player.hand.push(room.deck.pop());
  player.score = calculateScore(player.hand);

  if (player.score > 21) {
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
 * POST /api/double — tire 1 carte + stand automatique (2 cartes max)
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
  player.stand = true;
  player.isActive = false;
  nextTurn(room);

  res.status(200).json({ success: true, score: player.score });
}

module.exports = { startGame, hit, stand, double };
