// tests/unit/devine.test.js — Tests unitaires du jeu Devine Tête
const test = require('node:test');
const assert = require('node:assert');
const { startGame, startTurn, action, endTurn, nextTurn, getPublicState, MOTS } = require('../../api/game-logic/devine.js');

function makeDevineRoom(players) {
  const p = {};
  for (const name of players) {
    const id = 'id_' + name;
    p[id] = { name };
  }
  return {
    gameType: 'devine',
    players: p,
    phase: 'waiting',
    config: { timerPerTour: 45, motsParTour: 8 },
    playerOrder: [],
    tourIndex: 0,
    guesserId: null,
    scores: {},
    mots: [],
    indexActuel: 0,
    timestampDebutTour: null
  };
}

test('startGame — initialise la config avec les valeurs par défaut', () => {
  const room = makeDevineRoom(['Alice']);
  const r = startGame(room, {});
  assert.ok(r.success);
  assert.strictEqual(room.phase, 'TURN_START');
  assert.strictEqual(room.config.timerPerTour, 45);
  assert.strictEqual(room.config.motsParTour, 6);
  assert.strictEqual(room.guesserId, 'id_Alice');
  assert.deepStrictEqual(Object.keys(room.scores), ['id_Alice']);
});

test('startGame — utilise les valeurs du body', () => {
  const room = makeDevineRoom(['Alice']);
  const r = startGame(room, { timerPerTour: 30, motsParTour: 4 });
  assert.ok(r.success);
  assert.strictEqual(room.config.timerPerTour, 30);
  assert.strictEqual(room.config.motsParTour, 4);
});

test('startGame — rejette timerPerTour invalide', () => {
  const room = makeDevineRoom(['Alice']);
  const r = startGame(room, { timerPerTour: 99 });
  assert.ok(!r.success);
});

test('startGame — rejette motsParTour invalide', () => {
  const room = makeDevineRoom(['Alice']);
  const r = startGame(room, { motsParTour: 99 });
  assert.ok(!r.success);
});

test('startGame — plusieurs joueurs', () => {
  const room = makeDevineRoom(['Alice', 'Bob', 'Carol']);
  const r = startGame(room, {});
  assert.ok(r.success);
  assert.strictEqual(room.playerOrder.length, 3);
  assert.strictEqual(room.guesserId, 'id_Alice');
  assert.deepStrictEqual(Object.keys(room.scores), ['id_Alice', 'id_Bob', 'id_Carol']);
});

test('startTurn — phase TURN_START → TURN_PLAYING', () => {
  const room = makeDevineRoom(['Alice']);
  startGame(room, {});
  const r = startTurn(room);
  assert.ok(r.success);
  assert.strictEqual(room.phase, 'TURN_PLAYING');
  assert.ok(r.mot);
  assert.strictEqual(room.indexActuel, 0);
  assert.strictEqual(room.mots.length, 6);
});

test('startTurn — échoue si mauvaise phase', () => {
  const room = makeDevineRoom(['Alice']);
  startGame(room, {});
  room.phase = 'TURN_PLAYING';
  const r = startTurn(room);
  assert.ok(!r.success);
});

test('action — TROUVE incrémente le score', () => {
  const room = makeDevineRoom(['Alice']);
  startGame(room, { motsParTour: 4 });
  startTurn(room);
  const r = action(room, { actionType: 'TROUVE' });
  assert.ok(r.success);
  assert.strictEqual(room.scores['id_Alice'].trouve, 1);
  assert.strictEqual(room.indexActuel, 1);
});

test('action — PASSE incrémente le compteur', () => {
  const room = makeDevineRoom(['Alice']);
  startGame(room, { motsParTour: 4 });
  startTurn(room);
  const r = action(room, { actionType: 'PASSE' });
  assert.ok(r.success);
  assert.strictEqual(room.scores['id_Alice'].passe, 1);
  assert.strictEqual(room.indexActuel, 1);
});

test('action — fin du tour → TURN_DONE', () => {
  const room = makeDevineRoom(['Alice']);
  startGame(room, { motsParTour: 4 });
  startTurn(room);
  for (let i = 0; i < 3; i++) action(room, { actionType: 'TROUVE' });
  const r = action(room, { actionType: 'TROUVE' });
  assert.strictEqual(r.phase, 'TURN_DONE');
  assert.strictEqual(room.phase, 'TURN_DONE');
});

test('action — action invalide → erreur', () => {
  const room = makeDevineRoom(['Alice']);
  startGame(room, {});
  startTurn(room);
  const r = action(room, { actionType: 'INVALIDE' });
  assert.ok(!r.success);
});

test('action — pas en phase TURN_PLAYING → erreur', () => {
  const room = makeDevineRoom(['Alice']);
  startGame(room, {});
  const r = action(room, { actionType: 'TROUVE' });
  assert.ok(!r.success);
});

test('endTurn — force TURN_DONE', () => {
  const room = makeDevineRoom(['Alice']);
  startGame(room, {});
  startTurn(room);
  const r = endTurn(room);
  assert.ok(r.success);
  assert.strictEqual(room.phase, 'TURN_DONE');
});

test('nextTurn — passe au joueur suivant', () => {
  const room = makeDevineRoom(['Alice', 'Bob']);
  startGame(room, {});
  room.phase = 'TURN_DONE';
  const r = nextTurn(room);
  assert.ok(r.success);
  assert.strictEqual(r.phase, 'TURN_START');
  assert.strictEqual(room.guesserId, 'id_Bob');
  assert.strictEqual(room.tourIndex, 1);
});

test('nextTurn — dernier joueur → ALL_DONE', () => {
  const room = makeDevineRoom(['Alice', 'Bob']);
  startGame(room, {});
  room.phase = 'TURN_DONE';
  nextTurn(room);
  room.phase = 'TURN_DONE';
  const r = nextTurn(room);
  assert.ok(r.success);
  assert.strictEqual(r.phase, 'ALL_DONE');
  assert.strictEqual(room.phase, 'ALL_DONE');
});

test('nextTurn — échoue si pas TURN_DONE', () => {
  const room = makeDevineRoom(['Alice']);
  startGame(room, {});
  const r = nextTurn(room);
  assert.ok(!r.success);
});

test('getPublicState — contient les champs requis', () => {
  const room = makeDevineRoom(['Alice', 'Bob']);
  startGame(room, { motsParTour: 4 });
  startTurn(room);
  action(room, { actionType: 'TROUVE' });
  const state = getPublicState(room);
  assert.ok(state.phase);
  assert.strictEqual(state.guesserId, 'id_Alice');
  assert.strictEqual(state.guesserName, 'Alice');
  assert.strictEqual(typeof state.timerRestant, 'number');
  assert.ok(state.motCourant);
  assert.ok(state.categorie);
  assert.strictEqual(state.indexActuel, 1);
  assert.strictEqual(state.totalMots, 4);
  assert.ok(state.scores['id_Alice']);
  assert.strictEqual(state.scores['id_Alice'].trouve, 1);
});

test('getPublicState — motCourant null en TURN_START', () => {
  const room = makeDevineRoom(['Alice']);
  startGame(room, {});
  const state = getPublicState(room);
  assert.strictEqual(state.motCourant, null);
});

test('getPublicState — winner en ALL_DONE avec plusieurs joueurs', () => {
  const room = makeDevineRoom(['Alice', 'Bob']);
  startGame(room, { motsParTour: 4 });
  room.scores['id_Alice'].trouve = 5;
  room.scores['id_Bob'].trouve = 3;
  room.phase = 'ALL_DONE';
  const state = getPublicState(room);
  assert.strictEqual(state.phase, 'ALL_DONE');
  assert.strictEqual(state.winner, 'id_Alice');
});

test('getPublicState — winner null en solo', () => {
  const room = makeDevineRoom(['Alice']);
  startGame(room, { motsParTour: 4 });
  room.scores['id_Alice'].trouve = 5;
  const state = getPublicState(room);
  assert.strictEqual(state.winner, null);
});

test('MOTS — liste complète (200)', () => {
  assert.ok(Array.isArray(MOTS));
  assert.strictEqual(MOTS.length, 200);
});
