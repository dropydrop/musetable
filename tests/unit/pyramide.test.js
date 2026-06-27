// tests/unit/pyramide.test.js — Tests unitaires du jeu Pyramide
const test = require('node:test');
const assert = require('node:assert');
const { startGame, flipCard, matchCard, nextCard, getPublicState, getLigne } = require('../../api/game-logic/pyramide.js');

function makePyramideRoom(joueurs) {
  const p = {};
  for (const nom of joueurs) {
    const id = 'p' + Object.keys(p).length;
    p[id] = { name: nom, hand: [], score: 0 };
  }
  return {
    players: p,
    phase: 'waiting',
    playerOrder: Object.keys(p),
    activePlayerIndex: 0,
    pyramide: [],
    indexActif: 0,
    deck: []
  };
}

test('getLigne — index corrects', () => {
  assert.strictEqual(getLigne(0), 1);
  assert.strictEqual(getLigne(3), 1);
  assert.strictEqual(getLigne(4), 2);
  assert.strictEqual(getLigne(6), 2);
  assert.strictEqual(getLigne(7), 3);
  assert.strictEqual(getLigne(8), 3);
  assert.strictEqual(getLigne(9), 4);
});

test('startGame — échoue avec moins de 2 joueurs', () => {
  const room = makePyramideRoom(['Alice']);
  const r = startGame(room);
  assert.strictEqual(r.success, false);
});

test('startGame — échoue avec plus de 4 joueurs', () => {
  const room = makePyramideRoom(['A', 'B', 'C', 'D', 'E']);
  const r = startGame(room);
  assert.strictEqual(r.success, false);
});

test('startGame — distribue 4 cartes + pyramide 10', () => {
  const room = makePyramideRoom(['Alice', 'Bob']);
  const r = startGame(room);
  assert.ok(r.success);
  assert.strictEqual(room.players['p0'].hand.length, 4);
  assert.strictEqual(room.players['p1'].hand.length, 4);
  assert.strictEqual(room.pyramide.length, 10);
  assert.strictEqual(room.indexActif, 0);
  assert.strictEqual(room.pyramide[0].faceUp, true);
});

test('flipCard — retourne la carte active', () => {
  const room = makePyramideRoom(['Alice', 'Bob']);
  startGame(room);
  assert.strictEqual(room.pyramide[0].faceUp, true);
  // Avancer puis flipper
  nextCard(room);
  room.pyramide[1].faceUp = false;
  const r = flipCard(room);
  assert.ok(r.success);
  assert.strictEqual(r.index, 1);
  assert.ok(room.pyramide[1].faceUp);
});

test('nextCard — avance dans la pyramide', () => {
  const room = makePyramideRoom(['Alice', 'Bob']);
  startGame(room);
  const r = nextCard(room);
  assert.ok(r.success);
  assert.strictEqual(r.indexActif, 1);
  assert.strictEqual(room.indexActif, 1);
});

test('nextCard — termine quand fin de pyramide', () => {
  const room = makePyramideRoom(['Alice', 'Bob']);
  startGame(room);
  room.indexActif = 9;
  const r = nextCard(room);
  assert.strictEqual(r.phase, 'finished');
});

test('matchCard — valeurs correspondantes', () => {
  const room = makePyramideRoom(['Alice', 'Bob']);
  startGame(room);
  // Forcer la pyramide et la main à avoir la même valeur
  room.pyramide[0] = { suit: 'S', value: '7', faceUp: true };
  room.players['p0'].hand = [{ suit: 'H', value: '7' }];
  const r = matchCard(room, 'p0', 0);
  assert.ok(r.success);
  assert.strictEqual(r.matchValue, '7');
  assert.strictEqual(room.players['p0'].hand.length, 0);
});

test('matchCard — valeurs différentes → erreur', () => {
  const room = makePyramideRoom(['Alice', 'Bob']);
  startGame(room);
  room.pyramide[0] = { suit: 'S', value: '7', faceUp: true };
  room.players['p0'].hand = [{ suit: 'H', value: 'K' }];
  const r = matchCard(room, 'p0', 0);
  assert.strictEqual(r.success, false);
});

test('getPublicState — retourne l\'état', () => {
  const room = makePyramideRoom(['Alice', 'Bob']);
  startGame(room);
  const state = getPublicState(room);
  assert.ok(state.phase);
  assert.strictEqual(state.pyramide.length, 10);
  assert.strictEqual(typeof state.indexActif, 'number');
});
