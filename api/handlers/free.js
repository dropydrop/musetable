// api/handlers/free.js — Routes du mode libre
// Chaque fonction reçoit (room, body, res, games)

const { rollDice: doRoll, createShuffledDeck } = require('../../game-logic/common.js');
const {
  drawCards,
  playCard,
  flipCard,
  pickupCard,
  shuffleDeck,
  dealCards
} = require('../../game-logic/free.js');

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

async function roll(room, body, res, games) {
  const { count, faces } = body;
  const result = doRoll(count || 1, faces || 6);
  room.lastDice = result;
  res.status(200).json(result);
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

module.exports = { draw, play, flip, pickup, roll, shuffle, deal };
