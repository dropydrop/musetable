// api/handlers/free.js — Routes du mode libre
// Chaque fonction reçoit (room, body, res, games)

const { createShuffledDeck } = require('../game-logic/common.js');
const {
  drawCards,
  playCard,
  flipCard,
  pickupCard,
  flipHandCard,
  shuffleDeck,
  dealCards
} = require('../game-logic/free.js');

async function draw(room, body, res, games) {
  const { playerId, count } = body;
  const result = drawCards(room, playerId, count || 1);
  if (!result.success) { res.status(400).json(result); return; }
  res.status(200).json(result);
}

async function play(room, body, res, games) {
  const { playerId, cardIndex, faceUp } = body;
  const result = playCard(room, playerId, cardIndex, faceUp);
  if (!result.success) { res.status(400).json(result); return; }
  res.status(200).json(result);
}

async function flip(room, body, res, games) {
  const { cardIndex } = body;
  const result = flipCard(room, cardIndex);
  if (!result.success) { res.status(400).json(result); return; }
  res.status(200).json(result);
}

async function pickup(room, body, res, games) {
  const { playerId, cardIndex } = body;
  const result = pickupCard(room, playerId, cardIndex);
  if (!result.success) { res.status(400).json(result); return; }
  res.status(200).json(result);
}

function roll(room, body, res) {
  const count = body.count || room.diceCount || 1;
  const { rollDice } = require('../game-logic/free.js');
  const result = rollDice(count);
  room.lastDice = { results: result.results, count };
  res.status(200).json({ success: true, results: result.results });
}

function setDiceCount(room, body, res) {
  const count = body.count || 1;
  if (count < 1) { res.status(400).json({ success: false, error: 'Minimum 1 dé' }); return; }
  if (count > 6) { res.status(400).json({ success: false, error: 'Maximum 6 dés' }); return; }
  room.diceCount = count;
  res.status(200).json({ success: true, diceCount: count });
}

async function flipHand(room, body, res, games) {
  const { playerId, cardIndex } = body;
  const result = flipHandCard(room, playerId, cardIndex);
  if (!result.success) { res.status(400).json(result); return; }
  res.status(200).json(result);
}

async function reset(room, body, res, games) {
  room.deck = createShuffledDeck();
  room.table = [];
  room.lastDice = null;
  for (const p of Object.values(room.players)) {
    p.hand = [];
  }
  res.status(200).json({ success: true });
}

async function shuffle(room, body, res, games) {
  const result = shuffleDeck(room);
  res.status(200).json(result);
}

async function deal(room, body, res, games) {
  const { count } = body;
  const result = dealCards(room, count || 1);
  res.status(200).json(result);
}

module.exports = { draw, play, flip, pickup, roll, flipHand, reset, shuffle, deal, setDiceCount };
