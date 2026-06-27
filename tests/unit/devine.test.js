// tests/unit/devine.test.js — Tests unitaires du jeu Devine Tête
const test = require('node:test');
const assert = require('node:assert');
const { startGame, action, getPublicState, MOTS } = require('../../api/game-logic/devine.js');

function makeDevineRoom() {
  return {
    phase: 'waiting',
    mots: [],
    indexActuel: 0,
    score: 0,
    timer: 60,
    historique: [],
    timestampDebut: Date.now()
  };
}

test('startGame — initialise la partie', () => {
  const room = makeDevineRoom();
  const r = startGame(room);
  assert.ok(r.success);
  assert.strictEqual(room.phase, 'playing');
  assert.ok(Array.isArray(room.mots));
  assert.ok(room.mots.length > 0);
  assert.ok(r.mot);
  assert.strictEqual(typeof room.score, 'number');
});

test('MOTS — liste statique non vide', () => {
  assert.ok(Array.isArray(MOTS));
  assert.ok(MOTS.length >= 30);
});

test('action — TROUVE incrémente le score', () => {
  const room = makeDevineRoom();
  startGame(room);
  const r = action(room, 'TROUVE');
  assert.ok(r.success);
  assert.strictEqual(r.score, 1);
  assert.strictEqual(room.historique.length, 1);
  assert.strictEqual(room.historique[0].resultat, 'TROUVÉ');
});

test('action — PASSE ne change pas le score', () => {
  const room = makeDevineRoom();
  startGame(room);
  const r = action(room, 'PASSE');
  assert.ok(r.success);
  assert.strictEqual(r.score, 0);
  assert.strictEqual(room.historique[0].resultat, 'PASSÉ');
});

test('action — termine la partie après le dernier mot', () => {
  const room = makeDevineRoom();
  startGame(room);
  room.mots = ['un seul mot'];
  room.indexActuel = 0;
  const r = action(room, 'TROUVE');
  assert.strictEqual(r.phase, 'finished');
});

test('getPublicState — retourne l\'état correct', () => {
  const room = makeDevineRoom();
  startGame(room);
  const state = getPublicState(room);
  assert.ok(state.phase);
  assert.strictEqual(typeof state.score, 'number');
  assert.strictEqual(typeof state.timer, 'number');
});
