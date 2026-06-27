// tests/unit/pyramide.test.js — Tests unitaires du jeu Pyramide
const test = require('node:test');
const assert = require('node:assert');
const {
  startGame, distribuerCarte, memoriser, flipCard, matchCard, nextCard,
  getPublicState, getLigne, getMultiplicateur, getPyramideInfos
} = require('../../api/game-logic/pyramide.js');

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

test('getMultiplicateur — ligne 4 = 4, sinon = ligne', () => {
  assert.strictEqual(getMultiplicateur(1), 1);
  assert.strictEqual(getMultiplicateur(2), 2);
  assert.strictEqual(getMultiplicateur(3), 3);
  assert.strictEqual(getMultiplicateur(4), 4);
});

test('getPyramideInfos — retourne ligne et gorgees', () => {
  assert.deepStrictEqual(getPyramideInfos(0), { ligne: 1, gorgees: 1, position: 0 });
  assert.deepStrictEqual(getPyramideInfos(4), { ligne: 2, gorgees: 2, position: 0 });
  assert.deepStrictEqual(getPyramideInfos(9), { ligne: 4, gorgees: 4, position: 0 });
});

test('startGame — échoue avec moins de 2 joueurs', () => {
  const room = makePyramideRoom(['Alice']);
  const r = startGame(room);
  assert.strictEqual(r.success, false);
});

test('startGame — échoue avec plus de 6 joueurs', () => {
  const room = makePyramideRoom(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
  const r = startGame(room);
  assert.strictEqual(r.success, false);
});

test('startGame — 4 joueurs acceptés', () => {
  const room = makePyramideRoom(['A', 'B', 'C', 'D']);
  const r = startGame(room);
  assert.ok(r.success);
});

test('startGame — 6 joueurs acceptés', () => {
  const room = makePyramideRoom(['A', 'B', 'C', 'D', 'E', 'F']);
  const r = startGame(room);
  assert.ok(r.success);
});

test('startGame — phase distribution, aucune carte, ni pyramide', () => {
  const room = makePyramideRoom(['Alice', 'Bob']);
  const r = startGame(room);
  assert.ok(r.success);
  assert.strictEqual(room.phase, 'distribution');
  assert.strictEqual(room.tourDistribution, 1);
  assert.strictEqual(room.players['p0'].hand.length, 0);
  assert.strictEqual(room.players['p1'].hand.length, 0);
  assert.strictEqual(room.pyramide.length, 0);
});

test('distribuerCarte — distribution séquentielle puis mémorisation', () => {
  const room = makePyramideRoom(['Alice', 'Bob']);
  startGame(room);
  assert.strictEqual(room.phase, 'distribution');

  // 2 joueurs × 4 cartes = 8 distributions
  for (let i = 0; i < 7; i++) {
    const r = distribuerCarte(room);
    assert.ok(r.success);
    assert.strictEqual(r.fini, false);
  }

  // Après 8 distributions, la phase passe en memorisation
  const r = distribuerCarte(room);
  assert.ok(r.success);
  assert.strictEqual(r.fini, true);
  assert.strictEqual(room.phase, 'memorisation');
  assert.strictEqual(room.players['p0'].hand.length, 4);
  assert.strictEqual(room.players['p1'].hand.length, 4);

  // Mémoriser → construit la pyramide, phase = jeu
  const mem = memoriser(room);
  assert.ok(mem.success);
  assert.strictEqual(room.phase, 'jeu');
  assert.strictEqual(room.pyramide.length, 10);
  assert.ok(room.pyramide[0].faceUp);
});

test('flipCard — retourne la carte active', () => {
  const room = makePyramideRoom(['Alice', 'Bob']);
  startGame(room);
  memoriser(room);
  room.indexActif = 1;
  room.pyramide[1].faceUp = false;
  const r = flipCard(room);
  assert.ok(r.success);
  assert.strictEqual(r.index, 1);
  assert.ok(room.pyramide[1].faceUp);
});

test('nextCard — avance dans la pyramide', () => {
  const room = makePyramideRoom(['Alice', 'Bob']);
  startGame(room);
  memoriser(room);
  const r = nextCard(room);
  assert.ok(r.success);
  assert.strictEqual(r.indexActif, 1);
  assert.strictEqual(room.indexActif, 1);
});

test('nextCard — termine quand fin de pyramide', () => {
  const room = makePyramideRoom(['Alice', 'Bob']);
  startGame(room);
  memoriser(room);
  room.indexActif = 9;
  const r = nextCard(room);
  assert.strictEqual(r.phase, 'finished');
});

test('matchCard — valeurs correspondantes', () => {
  const room = makePyramideRoom(['Alice', 'Bob']);
  startGame(room);
  memoriser(room);
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
  memoriser(room);
  room.pyramide[0] = { suit: 'S', value: '7', faceUp: true };
  room.players['p0'].hand = [{ suit: 'H', value: 'K' }];
  const r = matchCard(room, 'p0', 0);
  assert.strictEqual(r.success, false);
});

test('getPublicState — retourne l\'état', () => {
  const room = makePyramideRoom(['Alice', 'Bob']);
  startGame(room);
  const state = getPublicState(room);
  assert.strictEqual(state.phase, 'distribution');
  assert.strictEqual(state.tourDistribution, 1);
  assert.strictEqual(typeof state.joueurDistribution, 'string');
});
