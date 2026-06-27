// api/handlers/tarot.js — Routes du Tarot Africain

const {
  startGame, placerPari, jouerCarte, resolveTrick, endRound, getPublicState, areBidsComplete, areTricksComplete
} = require('../game-logic/tarot.js');

async function start(room, body, res, games) {
  const result = startGame(room);
  if (!result.success) { res.status(400).json(result); return; }
  res.status(200).json(result);
}

async function bid(room, body, res, games) {
  const { playerId, nb } = body;
  const r = placerPari(room, playerId, nb);
  if (!r.success) { res.status(400).json(r); return; }
  if (areBidsComplete(room)) room.phase = 'JEU';
  res.status(200).json({ success: true, phase: room.phase, paris: room.paris });
}

async function play(room, body, res, games) {
  const { playerId, cardIndex, excuseValue } = body;
  const r = jouerCarte(room, playerId, cardIndex, excuseValue);
  if (!r.success) { res.status(400).json(r); return; }
  res.status(200).json(r);
}

async function nextTrick(room, body, res, games) {
  const r = resolveTrick(room);
  if (!r.success) { res.status(400).json(r); return; }
  if (areTricksComplete(room)) {
    const end = endRound(room);
    res.status(200).json({ success: true, pli: r, phase: room.phase, roundEnd: end });
    return;
  }
  res.status(200).json({ success: true, pliResolu: r, phase: room.phase });
}

async function end(room, body, res, games) {
  const r = endRound(room);
  res.status(200).json(r);
}

async function state(room, body, res, games) {
  res.status(200).json({ success: true, gameState: getPublicState(room) });
}

module.exports = { start, bid, play, nextTrick, end, state };
