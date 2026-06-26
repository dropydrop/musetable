// api/handlers/bizkit.js — Routes du jeu Bizkit
// Chaque fonction reçoit (room, body, res, games)

const { startGame: doStart, rollDice, nextTurn } = require('../../game-logic/bizkit.js');

async function startGame(room, body, res, games) {
  const result = doStart(room);
  if (!result.success) { res.status(400).json(result); return; }
  res.status(200).json(result);
}

async function roll(room, body, res, games) {
  const { playerId } = body;
  const result = rollDice(room, playerId);
  if (!result.success) { res.status(400).json(result); return; }
  res.status(200).json({ success: true, results: result.results, isSpecial: result.isSpecial });
}

async function next(room, body, res, games) {
  const result = nextTurn(room);
  if (!result.success) { res.status(400).json(result); return; }
  res.status(200).json(result);
}

module.exports = { startGame, roll, next };
