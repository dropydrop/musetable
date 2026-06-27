// api/handlers/devine.js — Routes du jeu Devine Tête

const { startGame, action, getPublicState } = require('../game-logic/devine.js');

async function start(room, body, res, games) {
  const r = startGame(room);
  if (!r.success) { res.status(400).json(r); return; }
  res.status(200).json(r);
}

async function doAction(room, body, res, games) {
  const { actionType } = body;
  if (!actionType || !['TROUVE', 'PASSE'].includes(actionType)) {
    res.status(400).json({ success: false, error: 'Action invalide (TROUVE ou PASSE)' });
    return;
  }
  const r = action(room, actionType);
  if (!r.success) { res.status(400).json(r); return; }
  res.status(200).json(r);
}

async function state(room, body, res, games) {
  res.status(200).json({ success: true, gameState: getPublicState(room) });
}

module.exports = { start, doAction, state };
