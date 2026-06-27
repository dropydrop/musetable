// tests/unit/free.test.js — Tests unitaires du mode Libre
const test = require('node:test');
const assert = require('node:assert');
const { createShuffledDeck } = require('../../api/game-logic/common.js');
const {
  drawCards, playCard, flipCard, pickupCard, shuffleDeck, dealCards
} = require('../../api/game-logic/free.js');

// Helper : salle libre type
function makeFreeRoom(players) {
  const deck = createShuffledDeck();
  const p = {};
  for (const name of players) {
    const id = 'p' + Object.keys(p).length;
    p[id] = { name, hand: [] };
  }
  return { players: p, deck, table: [] };
}

test('drawCards — pioche X cartes du deck vers la main', () => {
  const room = makeFreeRoom(['Alice']);
  const pid = Object.keys(room.players)[0];
  assert.strictEqual(room.deck.length, 52);
  assert.strictEqual(room.players[pid].hand.length, 0);

  const result = drawCards(room, pid, 3);
  assert.ok(result.success);
  assert.strictEqual(result.cards.length, 3);
  assert.strictEqual(room.players[pid].hand.length, 3);
  assert.strictEqual(room.deck.length, 49);
});

test('drawCards — joueur introuvable → error', () => {
  const room = makeFreeRoom([]);
  const result = drawCards(room, 'inconnu', 1);
  assert.strictEqual(result.success, false);
  assert.ok(result.error);
});

test('playCard — pose une carte sur le plateau', () => {
  const room = makeFreeRoom(['Alice']);
  const pid = Object.keys(room.players)[0];
  drawCards(room, pid, 3);
  const handLen = room.players[pid].hand.length;

  const result = playCard(room, pid, 0, true);
  assert.ok(result.success);
  assert.ok(result.card.faceUp);
  assert.strictEqual(result.card.playedBy, pid);
  assert.strictEqual(room.players[pid].hand.length, handLen - 1);
  assert.strictEqual(room.table.length, 1);
});

test('playCard — face cachée', () => {
  const room = makeFreeRoom(['Alice']);
  const pid = Object.keys(room.players)[0];
  drawCards(room, pid, 1);
  const result = playCard(room, pid, 0, false);
  assert.ok(result.success);
  assert.strictEqual(result.card.faceUp, false);
});

test('playCard — index invalide → error', () => {
  const room = makeFreeRoom(['Alice']);
  const pid = Object.keys(room.players)[0];
  assert.strictEqual(playCard(room, pid, 99, true).success, false);
  assert.strictEqual(playCard(room, pid, -1, true).success, false);
});

test('flipCard — retourne une carte du plateau', () => {
  const room = makeFreeRoom(['Alice']);
  const pid = Object.keys(room.players)[0];
  drawCards(room, pid, 1);
  playCard(room, pid, 0, true);
  assert.strictEqual(room.table[0].faceUp, true);

  const result = flipCard(room, 0);
  assert.ok(result.success);
  assert.strictEqual(room.table[0].faceUp, false);

  flipCard(room, 0);
  assert.strictEqual(room.table[0].faceUp, true);
});

test('flipCard — index invalide → error', () => {
  const room = makeFreeRoom([]);
  assert.strictEqual(flipCard(room, 0).success, false);
  assert.strictEqual(flipCard(room, -1).success, false);
});

test('pickupCard — reprend une carte du plateau dans la main', () => {
  const room = makeFreeRoom(['Alice']);
  const pid = Object.keys(room.players)[0];
  drawCards(room, pid, 1);
  playCard(room, pid, 0, true);
  assert.strictEqual(room.table.length, 1);
  assert.strictEqual(room.players[pid].hand.length, 0);

  const result = pickupCard(room, pid, 0);
  assert.ok(result.success);
  assert.strictEqual(room.table.length, 0);
  assert.strictEqual(room.players[pid].hand.length, 1);
  // Vérifier que les propriétés temporaires sont nettoyées
  assert.strictEqual(result.card.faceUp, undefined);
  assert.strictEqual(result.card.playedBy, undefined);
});

test('pickupCard — index invalide → error', () => {
  const room = makeFreeRoom(['Alice']);
  const pid = Object.keys(room.players)[0];
  assert.strictEqual(pickupCard(room, pid, 0).success, false);
});

test('shuffleDeck — mélange la pioche', () => {
  const room = makeFreeRoom(['Alice']);
  const originalLen = room.deck.length;
  const result = shuffleDeck(room);
  assert.ok(result.success);
  assert.strictEqual(result.remaining, originalLen);
  assert.strictEqual(room.deck.length, 52);
});

test('dealCards — distribue X cartes à chaque joueur', () => {
  const room = makeFreeRoom(['Alice', 'Bob']);
  const result = dealCards(room, 3);
  assert.ok(result.success);
  assert.strictEqual(result.remaining, 52 - 6);

  for (const [, player] of Object.entries(room.players)) {
    assert.strictEqual(player.hand.length, 3);
  }
});

test('dealCards — count par défaut = 1', () => {
  const room = makeFreeRoom(['Alice']);
  const result = dealCards(room); // pas de count
  assert.ok(result.success);
  assert.strictEqual(result.dealt[Object.keys(room.players)[0]].cards.length, 1);
  assert.strictEqual(room.players[Object.keys(room.players)[0]].hand.length, 1);
});

test('drawCards — deck vide ne casse pas', () => {
  const room = makeFreeRoom(['Alice']);
  room.deck = []; // deck vide
  const pid = Object.keys(room.players)[0];
  const result = drawCards(room, pid, 5);
  assert.ok(result.success);
  assert.strictEqual(result.cards.length, 0);
  assert.strictEqual(result.remaining, 0);
});

test('playCard — joueur introuvable → error', () => {
  const room = makeFreeRoom(['Alice']);
  assert.strictEqual(playCard(room, 'x', 0, true).success, false);
});

test('pickupCard — joueur introuvable → error', () => {
  const room = makeFreeRoom(['Alice']);
  assert.strictEqual(pickupCard(room, 'x', 0).success, false);
});
