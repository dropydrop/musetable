// tests/unit/tarot.test.js — Tests unitaires du Tarot Africain
const test = require('node:test');
const assert = require('node:assert');
const {
  createTarotDeck, startGame, placerPari, jouerCarte, resolveTrick, endRound, isBidValid
} = require('../../api/game-logic/tarot.js');

function makeTarotRoom(joueurs) {
  const p = {};
  for (const nom of joueurs) {
    const id = 'p' + Object.keys(p).length;
    p[id] = { name: nom, hand: [] };
  }
  return {
    players: p,
    phase: 'waiting',
    dealerIndex: 0,
    cartesDistribuees: 5,
    paris: {},
    mains: {},
    pliActuel: [],
    plisGagnes: {},
    joueurs: Object.keys(p),
    parisPhase: { debut: 0, fin: Object.keys(p).length - 1, index: 0 }
  };
}

test('createTarotDeck — 22 cartes (0 à 21)', () => {
  const deck = createTarotDeck();
  assert.strictEqual(deck.length, 22);
  assert.ok(deck.includes(0));
  assert.ok(deck.includes(21));
});

test('startGame — échoue avec moins de 2 joueurs', () => {
  const room = makeTarotRoom(['Alice']);
  const r = startGame(room);
  assert.strictEqual(r.success, false);
});

test('startGame — distribue les cartes et phase PARI', () => {
  const room = makeTarotRoom(['Alice', 'Bob', 'Charlie']);
  const r = startGame(room);
  assert.ok(r.success);
  assert.strictEqual(room.phase, 'PARI');
  assert.strictEqual(room.mains['p0'].length, 5);
  assert.strictEqual(room.mains['p1'].length, 5);
  assert.strictEqual(room.mains['p2'].length, 5);
});

test('isBidValid — dernier joueur contraint', () => {
  const room = makeTarotRoom(['Alice', 'Bob']);
  startGame(room);
  room.paris['p0'] = 2;
  room.parisPhase.fin = 'p1';
  // Dernier joueur : total des paris (2) + nb != 5
  assert.strictEqual(isBidValid(room, 'p1', 3), false); // 2+3=5 == 5, interdit
  assert.ok(isBidValid(room, 'p1', 2));               // 2+2=4 != 5, OK
  assert.ok(isBidValid(room, 'p1', 4));               // 2+4=6 != 5, OK
});

test('placerPari — valide et complet', () => {
  const room = makeTarotRoom(['Alice', 'Bob']);
  startGame(room);
  let r = placerPari(room, 'p0', 2);
  assert.ok(r.success);
  assert.strictEqual(room.paris['p0'], 2);
  r = placerPari(room, 'p1', 3);
  assert.ok(r.success);
});

test('jouerCarte — enlève la main', () => {
  const room = makeTarotRoom(['Alice', 'Bob']);
  startGame(room);
  const mainLen = room.mains['p0'].length;
  const r = jouerCarte(room, 'p0', 0);
  assert.ok(r.success);
  assert.strictEqual(room.mains['p0'].length, mainLen - 1);
  assert.strictEqual(room.pliActuel.length, 1);
});

test('jouerCarte — index invalide', () => {
  const room = makeTarotRoom(['Alice', 'Bob']);
  startGame(room);
  const r = jouerCarte(room, 'p0', 99);
  assert.strictEqual(r.success, false);
});

test('resolveTrick — détermine le gagnant', () => {
  const room = makeTarotRoom(['Alice', 'Bob']);
  startGame(room);
  // Simuler un pli
  room.pliActuel = [
    { playerId: 'p0', carte: 5, excuseValue: null },
    { playerId: 'p1', carte: 12, excuseValue: null }
  ];
  const r = resolveTrick(room);
  assert.ok(r.success);
  assert.strictEqual(r.gagnant, 'p1');
  assert.strictEqual(r.gagneAvec, 12);
  assert.strictEqual(room.pliActuel.length, 0);
  assert.strictEqual(room.plisGagnes['p1'], 1);
});

test('resolveTrick — Excuse à 22 gagne', () => {
  const room = makeTarotRoom(['Alice', 'Bob']);
  startGame(room);
  room.pliActuel = [
    { playerId: 'p0', carte: 0, excuseValue: 22 },
    { playerId: 'p1', carte: 21, excuseValue: null }
  ];
  const r = resolveTrick(room);
  assert.ok(r.success);
  assert.strictEqual(r.gagnant, 'p0');
});

test('endRound — calcule les vies', () => {
  const room = makeTarotRoom(['Alice', 'Bob']);
  startGame(room);
  room.paris = { 'p0': 2, 'p1': 3 };
  room.plisGagnes = { 'p0': 2, 'p1': 3 };
  const r = endRound(room);
  assert.strictEqual(r.phase, 'SCORE');
  assert.strictEqual(room.vies['p0'], 10); // |2-2| = 0, 10-0 = 10
  assert.strictEqual(room.vies['p1'], 10); // |3-3| = 0, 10-0 = 10
});
