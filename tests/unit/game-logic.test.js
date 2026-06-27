// tests/unit/game-logic.test.js — Tests unitaires de la logique métier
const test = require('node:test');
const assert = require('node:assert');

const { createShuffledDeck } = require('../../api/game-logic/common.js');
const { calculateScore, nextTurn, checkGameFinished } = require('../../api/game-logic/blackjack.js');

// --- createShuffledDeck ---

test('createShuffledDeck — genère 52 cartes uniques', () => {
  const deck = createShuffledDeck();
  assert.strictEqual(deck.length, 52);

  // Vérifier qu'il n'y a pas de doublons
  const keys = deck.map(c => `${c.suit}-${c.value}`);
  assert.strictEqual(new Set(keys).size, 52);
});

test('createShuffledDeck — contient les 4 couleurs x 13 valeurs', () => {
  const deck = createShuffledDeck();
  const suits = ['S', 'H', 'D', 'C'];
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  for (const suit of suits) {
    for (const value of values) {
      assert.ok(deck.some(c => c.suit === suit && c.value === value),
        `Carte manquante : ${suit}-${value}`);
    }
  }
});

test('createShuffledDeck — deux appels donnent des ordres différents (probabiliste)', () => {
  const d1 = createShuffledDeck();
  const d2 = createShuffledDeck();
  const same = d1.every((c, i) => c.suit === d2[i].suit && c.value === d2[i].value);
  assert.ok(!same, 'Deux mélanges ne devraient pas produire le même ordre');
});

// --- calculateScore ---

test('calculateScore — cartes numériques', () => {
  const hand = [
    { suit: 'S', value: '2' },
    { suit: 'H', value: '5' }
  ];
  assert.strictEqual(calculateScore(hand), 7);
});

test('calculateScore — figures valent 10', () => {
  const hand = [
    { suit: 'C', value: 'J' },
    { suit: 'D', value: 'Q' }
  ];
  assert.strictEqual(calculateScore(hand), 20);
});

test('calculateScore — As + 10 = Blackjack (21)', () => {
  const hand = [
    { suit: 'S', value: 'A' },
    { suit: 'H', value: '10' }
  ];
  assert.strictEqual(calculateScore(hand), 21);
});

test('calculateScore — As + figure = Blackjack (21)', () => {
  const hand = [
    { suit: 'D', value: 'A' },
    { suit: 'C', value: 'K' }
  ];
  assert.strictEqual(calculateScore(hand), 21);
});

test('calculateScore — As compte 1 si 11 ferait bust', () => {
  const hand = [
    { suit: 'S', value: 'A' },
    { suit: 'H', value: '9' },
    { suit: 'D', value: '5' }
  ];
  // A=11 → 25 bust → A=1 → 15
  assert.strictEqual(calculateScore(hand), 15);
});

test('calculateScore — deux As : 1 + 11 = 12', () => {
  const hand = [
    { suit: 'S', value: 'A' },
    { suit: 'H', value: 'A' }
  ];
  assert.strictEqual(calculateScore(hand), 12);
});

test('calculateScore — deux As + bust : 1 + 1 = 2', () => {
  const hand = [
    { suit: 'S', value: 'A' },
    { suit: 'H', value: 'A' },
    { suit: 'D', value: 'K' }
  ];
  // A=11 + A=11 + 10 = 32 → A=1+11+10=22 → A=1+1+10=12
  assert.strictEqual(calculateScore(hand), 12);
});

test('calculateScore — bust > 21', () => {
  const hand = [
    { suit: 'S', value: 'K' },
    { suit: 'H', value: 'Q' },
    { suit: 'D', value: '5' }
  ];
  assert.strictEqual(calculateScore(hand), 25);
});

test('calculateScore — main vide = 0', () => {
  assert.strictEqual(calculateScore([]), 0);
});

// --- nextTurn ---

test('nextTurn — passe au joueur suivant', () => {
  const room = {
    playerOrder: ['a', 'b', 'c'],
    turnIndex: 0,
    currentTurn: 'a',
    players: {
      a: { name: 'Alice', isActive: true, stand: false },
      b: { name: 'Bob', isActive: true, stand: false },
      c: { name: 'Charlie', isActive: true, stand: false }
    },
    phase: 'playing',
    winners: null,
    result: null
  };

  nextTurn(room);
  assert.strictEqual(room.turnIndex, 1);
  assert.strictEqual(room.currentTurn, 'b');
});

test('nextTurn — dernier joueur déclenche checkGameFinished', () => {
  const room = {
    playerOrder: ['a', 'b'],
    turnIndex: 1,
    currentTurn: 'b',
    players: {
      a: { name: 'Alice', hand: [{ suit: 'S', value: 'K' }, { suit: 'H', value: 'Q' }], score: 20, isActive: false, stand: true, solde: 100, mise: 10 },
      b: { name: 'Bob', hand: [{ suit: 'S', value: 'A' }, { suit: 'H', value: '9' }], score: 20, isActive: false, stand: true, solde: 100, mise: 10 }
    },
    phase: 'playing',
    winners: null,
    result: null
  };

  nextTurn(room);
  assert.strictEqual(room.turnIndex, 2);
  assert.strictEqual(room.currentTurn, null);
  assert.strictEqual(room.phase, 'finished');
  assert.ok(room.winners.length > 0);
  // Push : pas de mouvement de solde
  assert.strictEqual(room.players.a.solde, 100);
  assert.strictEqual(room.players.b.solde, 100);
});

// --- checkGameFinished ---

test('checkGameFinished — meilleur score gagne', () => {
  const room = {
    players: {
      a: { name: 'Alice', hand: [{ suit: 'S', value: 'K' }, { suit: 'H', value: 'Q' }], score: 20, isActive: false, stand: true, solde: 100, mise: 10 },
      b: { name: 'Bob', hand: [{ suit: 'S', value: 'A' }, { suit: 'H', value: '8' }], score: 19, isActive: false, stand: true, solde: 100, mise: 10 }
    },
    phase: 'playing',
    winners: null,
    result: null
  };

  checkGameFinished(room);
  assert.strictEqual(room.phase, 'finished');
  assert.deepStrictEqual(room.winners, ['Alice']);
  assert.strictEqual(room.result, 20);
  assert.strictEqual(room.players.a.solde, 110); // +10 (mise de Bob)
  assert.strictEqual(room.players.a.resultat, 'gagné');
  assert.strictEqual(room.players.a.gain, 10);
  assert.strictEqual(room.players.b.solde, 90);  // -10
  assert.strictEqual(room.players.b.resultat, 'perdu');
  assert.strictEqual(room.players.b.gain, -10);
  assert.strictEqual(room.players.a.mise, 0);
  assert.strictEqual(room.players.b.mise, 0);
});

test('checkGameFinished — égalité entre deux joueurs (push)', () => {
  const room = {
    players: {
      a: { name: 'Alice', hand: [{ suit: 'S', value: 'K' }, { suit: 'H', value: 'Q' }], score: 20, isActive: false, stand: true, solde: 100, mise: 10 },
      b: { name: 'Bob', hand: [{ suit: 'D', value: 'K' }, { suit: 'C', value: 'Q' }], score: 20, isActive: false, stand: true, solde: 100, mise: 10 }
    },
    phase: 'playing',
    winners: null,
    result: null
  };

  checkGameFinished(room);
  assert.strictEqual(room.phase, 'finished');
  assert.ok(room.winners.includes('Alice'));
  assert.ok(room.winners.includes('Bob'));
  assert.strictEqual(room.result, 20);
  // Push : pas de mouvement
  assert.strictEqual(room.players.a.solde, 100);
  assert.strictEqual(room.players.b.solde, 100);
  assert.strictEqual(room.players.a.resultat, null);
  assert.strictEqual(room.players.a.gain, null);
  assert.strictEqual(room.players.a.mise, 0);
});

test('checkGameFinished — tous bust = tout le monde perd sa mise', () => {
  const room = {
    players: {
      a: { name: 'Alice', hand: [{ suit: 'S', value: 'K' }, { suit: 'H', value: 'Q' }, { suit: 'D', value: '5' }], score: 25, isActive: false, stand: true, solde: 100, mise: 10 },
      b: { name: 'Bob', hand: [{ suit: 'S', value: 'K' }, { suit: 'H', value: 'Q' }, { suit: 'D', value: '6' }], score: 26, isActive: false, stand: true, solde: 100, mise: 10 }
    },
    phase: 'playing',
    winners: null,
    result: null
  };

  checkGameFinished(room);
  assert.strictEqual(room.phase, 'finished');
  assert.strictEqual(room.winners[0], 'Personne (tous ont dépassé 21)');
  assert.strictEqual(room.result, 0);
  // Tous bust → tous perdent leur mise
  assert.strictEqual(room.players.a.solde, 90);
  assert.strictEqual(room.players.b.solde, 90);
  assert.strictEqual(room.players.a.mise, 0);
  assert.strictEqual(room.players.a.resultat, 'perdu');
  assert.strictEqual(room.players.a.gain, -10);
});

test('checkGameFinished — joueurs encore actifs = pas fini', () => {
  const room = {
    players: {
      a: { name: 'Alice', hand: [{ suit: 'S', value: 'K' }, { suit: 'H', value: 'Q' }], score: 20, isActive: true, stand: false, solde: 100, mise: 10 },
      b: { name: 'Bob', hand: [{ suit: 'S', value: 'A' }, { suit: 'H', value: '8' }], score: 19, isActive: false, stand: true, solde: 100, mise: 10 }
    },
    phase: 'playing',
    winners: null,
    result: null
  };

  checkGameFinished(room);
  assert.strictEqual(room.phase, 'playing');
  assert.strictEqual(room.winners, null);
});

test('checkGameFinished — aucun joueur = pas de changement', () => {
  const room = {
    players: {},
    phase: 'playing',
    winners: null,
    result: null
  };

  checkGameFinished(room);
  assert.strictEqual(room.phase, 'playing');
  assert.strictEqual(room.winners, null);
});

// --- Cas limites Blackjack ---

test('nextTurn — auto-stand du joueur suivant si le précédent a bust', () => {
  const room = {
    playerOrder: ['a', 'b'],
    turnIndex: 0,
    currentTurn: 'a',
    players: {
      a: { name: 'Alice', hand: [{ suit: 'S', value: 'K' }, { suit: 'H', value: 'Q' }, { suit: 'D', value: '5' }], score: 25, isActive: false, stand: true, solde: 100, mise: 10 },
      b: { name: 'Bob', hand: [{ suit: 'S', value: 'A' }, { suit: 'H', value: '8' }], score: 19, isActive: true, stand: false, solde: 100, mise: 10 }
    },
    phase: 'playing',
    winners: null,
    result: null,
    miseParDefaut: 10
  };

  nextTurn(room);
  // Bob auto-stand car Alice a bust
  assert.strictEqual(room.players.b.stand, true);
  assert.strictEqual(room.players.b.isActive, false);
  // Partie finie car tout le monde est done
  assert.strictEqual(room.phase, 'finished');
  assert.deepStrictEqual(room.winners, ['Bob']);
  assert.strictEqual(room.players.b.solde, 110); // Bob gagne (+10)
  assert.strictEqual(room.players.b.resultat, 'gagné');
  assert.strictEqual(room.players.b.gain, 10);
  assert.strictEqual(room.players.a.solde, 90);  // Alice perd (-10)
  assert.strictEqual(room.players.a.resultat, 'perdu');
  assert.strictEqual(room.players.a.gain, -10);
});

test('calculateScore — As + As + As + As = 14 (1+1+1+11)', () => {
  const hand = [
    { suit: 'S', value: 'A' },
    { suit: 'H', value: 'A' },
    { suit: 'D', value: 'A' },
    { suit: 'C', value: 'A' }
  ];
  assert.strictEqual(calculateScore(hand), 14);
});

test('calculateScore — As + As + 9 = 21 (1+11+9)', () => {
  const hand = [
    { suit: 'S', value: 'A' },
    { suit: 'H', value: 'A' },
    { suit: 'D', value: '9' }
  ];
  assert.strictEqual(calculateScore(hand), 21);
});

test('calculateScore — 10 + 10 + 2 = 22 bust', () => {
  const hand = [
    { suit: 'S', value: '10' },
    { suit: 'H', value: '10' },
    { suit: 'D', value: '2' }
  ];
  assert.strictEqual(calculateScore(hand), 22);
});
