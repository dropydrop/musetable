// tests/unit/tarot.test.js — Tests unitaires du Tarot Africain
const test = require('node:test');
const assert = require('node:assert');
const {
  createTarotDeck, startGame, placerPari, jouerCarte, resolveTrick, endRound,
  getPublicState, canBid, areBidsComplete, getParieurs, isLastBidder, getBidInterdit
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
    tourIndex: 0
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
  assert.strictEqual(room.parisFaits['p0'], false);
});

test('getParieurs — commence après le dealer', () => {
  const room = makeTarotRoom(['Alice', 'Bob', 'Charlie']);
  startGame(room);
  // dealerIndex = 0 (Alice), parieurs = [Bob, Charlie, Alice]
  const parieurs = getParieurs(room);
  assert.strictEqual(parieurs[0], 'p1'); // Bob (après dealer)
  assert.strictEqual(parieurs[1], 'p2'); // Charlie
  assert.strictEqual(parieurs[2], 'p0'); // Alice (dealer, dernier)
});

test('isLastBidder — dealer est le dernier', () => {
  const room = makeTarotRoom(['Alice', 'Bob']);
  startGame(room);
  assert.ok(isLastBidder(room, 'p0')); // dealer
  assert.strictEqual(isLastBidder(room, 'p1'), false);
});

test('getBidInterdit — total actuel - nbCartes', () => {
  const room = makeTarotRoom(['Alice', 'Bob']);
  startGame(room);
  room.paris['p0'] = 2;
  const interdit = getBidInterdit(room);
  assert.strictEqual(interdit, 3); // 5 - 2 = 3
});

test('canBid — refus si pas son tour', () => {
  const room = makeTarotRoom(['Alice', 'Bob']);
  startGame(room);
  // tourIndex = 0, parieurs[0] = 'p1' (Bob)
  assert.strictEqual(canBid(room, 'p0', 2), false);
  assert.ok(canBid(room, 'p1', 2));
});

test('canBid — dernier parieur interdit', () => {
  const room = makeTarotRoom(['Alice', 'Bob']);
  startGame(room);
  // Simuler que tous sauf dealer ont parié
  room.paris['p1'] = 2;
  room.parisFaits['p1'] = true;
  room.tourIndex = 1;
  // Maintenant c'est au tour du dealer (p0), dernière position
  // Interdit = 5 - 2 = 3
  assert.strictEqual(canBid(room, 'p0', 3), false); // interdit
  assert.ok(canBid(room, 'p0', 2));                 // autorisé
  assert.ok(canBid(room, 'p0', 4));                 // autorisé
});

test('placerPari — valide et complet', () => {
  const room = makeTarotRoom(['Alice', 'Bob']);
  startGame(room);
  // Premier parieur : p1 (Bob)
  let r = placerPari(room, 'p1', 2);
  assert.ok(r.success);
  assert.strictEqual(room.paris['p1'], 2);
  assert.strictEqual(room.parisFaits['p1'], true);
  assert.strictEqual(room.phase, 'PARI');

  // Dernier parieur : p0 (Alice, dealer)
  r = placerPari(room, 'p0', 1);
  assert.ok(r.success);
  assert.strictEqual(room.phase, 'JEU'); // phase change
});

test('jouerCarte — enlève la main', () => {
  const room = makeTarotRoom(['Alice', 'Bob']);
  startGame(room);
  room.phase = 'JEU';
  room.tourIndex = 0; // Alice (p0) commence
  const mainLen = room.mains['p0'].length;
  const r = jouerCarte(room, 'p0', 0);
  assert.ok(r.success);
  assert.strictEqual(room.mains['p0'].length, mainLen - 1);
  assert.strictEqual(room.pliActuel.length, 1);
});

test('jouerCarte — pas son tour', () => {
  const room = makeTarotRoom(['Alice', 'Bob']);
  startGame(room);
  room.phase = 'JEU';
  room.tourIndex = 0; // Alice joue
  const r = jouerCarte(room, 'p1', 0); // Bob essaie
  assert.strictEqual(r.success, false);
  assert.strictEqual(r.error, 'Pas votre tour');
});

test('jouerCarte — index invalide', () => {
  const room = makeTarotRoom(['Alice', 'Bob']);
  startGame(room);
  room.phase = 'JEU';
  room.tourIndex = 0;
  const r = jouerCarte(room, 'p0', 99);
  assert.strictEqual(r.success, false);
});

test('resolveTrick — détermine le gagnant', () => {
  const room = makeTarotRoom(['Alice', 'Bob']);
  startGame(room);
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
  assert.strictEqual(room.vies['p0'], 10);
  assert.strictEqual(room.vies['p1'], 10);
});

test('getPublicState — contient les champs requis', () => {
  const room = makeTarotRoom(['Alice', 'Bob']);
  startGame(room);
  const state = getPublicState(room);
  assert.ok(state.phase);
  assert.ok(state.mains);
  assert.ok(state.paris);
  assert.ok(state.parisFaits);
  assert.ok(state.joueurs);
  assert.ok(Array.isArray(state.parieurs));
  assert.strictEqual(typeof state.bidActuel, 'string');
  assert.strictEqual(typeof state.interdit, 'number');
});
