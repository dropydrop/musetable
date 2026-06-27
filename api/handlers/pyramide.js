// api/handlers/pyramide.js — Routes du jeu Pyramide

const { startGame, flipCard, matchCard, nextCard, getPublicState } = require('../game-logic/pyramide.js');

async function start(room, body, res, games) {
  const r = startGame(room);
  if (!r.success) { res.status(400).json(r); return; }
  res.status(200).json(r);
}

async function flip(room, body, res, games) {
  const r = flipCard(room);
  if (!r.success) { res.status(400).json(r); return; }
  res.status(200).json(r);
}

async function match(room, body, res, games) {
  const { playerId, handIndex } = body;
  const r = matchCard(room, playerId, handIndex);
  if (!r.success) { res.status(400).json(r); return; }
  res.status(200).json(r);
}

async function next(room, body, res, games) {
  const r = nextCard(room);
  if (!r.success) { res.status(400).json(r); return; }
  res.status(200).json(r);
}

async function state(room, body, res, games) {
  res.status(200).json({ success: true, gameState: getPublicState(room) });
}

module.exports = { start, flip, match, next, state };
