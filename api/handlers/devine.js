// api/handlers/devine.js — Routes du jeu Devine Tête

const { startGame, startTurn, action, endTurn, nextTurn, getPublicState } = require('../game-logic/devine.js');

async function start(room, body, res, games) {
  const r = startGame(room, body);
  if (!r.success) { res.status(400).json(r); return; }
  res.status(200).json(r);
}

async function doStartTurn(room, body, res, games) {
  const r = startTurn(room);
  if (!r.success) { res.status(400).json(r); return; }
  res.status(200).json(r);
}

async function doAction(room, body, res, games) {
  const r = action(room, body);
  if (!r.success) { res.status(400).json(r); return; }
  res.status(200).json(r);
}

async function doEndTurn(room, body, res, games) {
  const r = endTurn(room);
  if (!r.success) { res.status(400).json(r); return; }
  res.status(200).json(r);
}

async function doNextTurn(room, body, res, games) {
  const r = nextTurn(room);
  if (!r.success) { res.status(400).json(r); return; }
  res.status(200).json(r);
}

async function state(room, body, res, games) {
  res.status(200).json({ success: true, gameState: getPublicState(room) });
}

module.exports = { start, doStartTurn, doAction, doEndTurn, doNextTurn, state };
