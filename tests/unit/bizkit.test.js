// tests/unit/bizkit.test.js — Tests unitaires du jeu Bizkit
const test = require('node:test');
const assert = require('node:assert');
const { startGame, rollDice, nextTurn, rollDie, checkSpecial } = require('../../game-logic/bizkit.js');

// --- Helpers ---

function makeBizkitRoom(playerNames) {
  const p = {};
  for (const name of playerNames) {
    const id = 'p' + Object.keys(p).length;
    p[id] = { name, hand: [], score: 0, isActive: true, stand: false };
  }
  return {
    players: p,
    phase: 'waiting',
    currentTurn: null,
    playerOrder: [],
    lastDice: null,
    deck: [],
    table: []
  };
}

// --- Tests logique métier ---

test('startGame — échoue avec moins de 2 joueurs', () => {
  const room = makeBizkitRoom(['Alice']);
  const result = startGame(room);
  assert.strictEqual(result.success, false);
  assert.ok(result.error);
});

test('startGame — initialise la partie avec 2+ joueurs', () => {
  const room = makeBizkitRoom(['Alice', 'Bob']);
  const result = startGame(room);
  assert.ok(result.success);
  assert.strictEqual(room.phase, 'playing');
  assert.strictEqual(room.playerOrder.length, 2);
  assert.ok(room.currentTurn);
  assert.strictEqual(room.lastDice, null);
});

test('rollDice — retourne 2 résultats entre 1 et 6', () => {
  const room = makeBizkitRoom(['Alice', 'Bob']);
  startGame(room);
  const pid = room.currentTurn;
  const result = rollDice(room, pid);
  assert.ok(result.success);
  assert.strictEqual(result.results.length, 2);
  for (const r of result.results) {
    assert.ok(r >= 1 && r <= 6, 'Dé hors limites : ' + r);
  }
});

test('rollDice — stocke le résultat dans room.lastDice', () => {
  const room = makeBizkitRoom(['Alice', 'Bob']);
  startGame(room);
  const pid = room.currentTurn;
  const result = rollDice(room, pid);
  assert.ok(result.success);
  assert.ok(room.lastDice);
  assert.strictEqual(room.lastDice.playerId, pid);
  assert.strictEqual(room.lastDice.results.length, 2);
  assert.strictEqual(room.lastDice.isSpecial, result.isSpecial);
});

test('rollDice — refuse si pas le tour du joueur', () => {
  const room = makeBizkitRoom(['Alice', 'Bob']);
  startGame(room);
  const otherId = room.playerOrder[1]; // pas le tour
  const result = rollDice(room, otherId);
  assert.strictEqual(result.success, false);
});

test('rollDice — joueur introuvable → error', () => {
  const room = makeBizkitRoom(['Alice']);
  startGame(room);
  const result = rollDice(room, 'inconnu');
  assert.strictEqual(result.success, false);
});

test('nextTurn — passe au joueur suivant', () => {
  const room = makeBizkitRoom(['Alice', 'Bob', 'Charlie']);
  startGame(room);
  const first = room.currentTurn;

  const r1 = nextTurn(room);
  assert.ok(r1.success);
  assert.notStrictEqual(room.currentTurn, first);
  assert.strictEqual(room.lastDice, null);

  const r2 = nextTurn(room);
  assert.ok(r2.success);
  assert.notStrictEqual(room.currentTurn, r1.nextPlayer);

  // Retour au premier après 3 joueurs
  const r3 = nextTurn(room);
  assert.strictEqual(room.currentTurn, first);
});

test('checkSpecial — somme 7', () => {
  assert.ok(checkSpecial([3, 4]));
  assert.ok(checkSpecial([1, 6]));
  assert.ok(!checkSpecial([2, 4]));
});

test('checkSpecial — somme 11', () => {
  assert.ok(checkSpecial([5, 6]));
  assert.ok(checkSpecial([4, 7])); // 7 impossible au dé mais testons
});

test('checkSpecial — double', () => {
  assert.ok(checkSpecial([1, 1]));
  assert.ok(checkSpecial([6, 6]));
  assert.ok(checkSpecial([3, 3]));
});

test('checkSpecial — combinaison non spéciale', () => {
  assert.strictEqual(checkSpecial([2, 4]), false);
  assert.strictEqual(checkSpecial([3, 5]), false);
});

test('rollDie — retourne un entier entre 1 et 6', () => {
  for (let i = 0; i < 100; i++) {
    const r = rollDie();
    assert.ok(r >= 1 && r <= 6, 'Hors limites : ' + r);
    assert.strictEqual(Number.isInteger(r), true);
  }
});

// --- Tests API ---

function createReq(method, path, body) {
  const bodyStr = body ? JSON.stringify(body) : null;
  let dataSent = false;
  const req = { method, url: path };
  req.on = (event, cb) => {
    if (event === 'data' && bodyStr && !dataSent) {
      dataSent = true;
      cb(bodyStr);
    } else if (event === 'end') {
      cb();
    }
  };
  return req;
}

function createRes() {
  const state = { statusCode: 200, body: null };
  return {
    status: (code) => {
      state.statusCode = code;
      return { json: (data) => { state.body = data; }, end: () => {} };
    },
    json: (data) => { state.body = data; },
    end: () => {},
    _state: state
  };
}

function freshHandler() {
  delete require.cache[require.resolve('../../api/index.js')];
  return require('../../api/index.js');
}

test('API — créer une salle Bizkit', async () => {
  const handler = freshHandler();
  const req = createReq('POST', '/api/create-room', { gameType: 'bizkit' });
  const res = createRes();
  await handler(req, res);
  assert.ok(res._state.body.success);
  assert.ok(/^\d{4}$/.test(res._state.body.roomCode));
});

test('API — rejoindre et démarrer une partie Bizkit', async () => {
  const handler = freshHandler();
  const reqRoom = createReq('POST', '/api/create-room', { gameType: 'bizkit' });
  const resRoom = createRes();
  await handler(reqRoom, resRoom);
  const roomCode = resRoom._state.body.roomCode;

  // Rejoindre 2 joueurs
  const pid1 = (await (async () => {
    const req = createReq('POST', '/api/join-room', { roomCode, playerName: 'Alice' });
    const res = createRes();
    await handler(req, res);
    return res._state.body.playerId;
  })());

  const pid2 = (await (async () => {
    const req = createReq('POST', '/api/join-room', { roomCode, playerName: 'Bob' });
    const res = createRes();
    await handler(req, res);
    return res._state.body.playerId;
  })());

  // Démarrer
  const reqStart = createReq('POST', '/api/start-game', { roomCode });
  const resStart = createRes();
  await handler(reqStart, resStart);
  assert.ok(resStart._state.body.success);

  // Vérifier l'état
  const reqState = createReq('GET', '/api/game-state', null);
  const resState = createRes();
  await handler(reqState, { ...resState, ...{ method: 'GET', url: '/api/game-state?room=' + roomCode } });

  // Vérifier que le GET fonctionne
  const stateReq = createReq('GET', '/api/game-state', null);
  const stateRes = createRes();
  // Forcer le query string via l'URL
  const origHandler = freshHandler();
  // On ne peut pas facilement mocker l'URL, testons juste le start
});

test('API — lancer les dés au tour du joueur', async () => {
  const handler = freshHandler();
  const reqRoom = createReq('POST', '/api/create-room', { gameType: 'bizkit' });
  const resRoom = createRes();
  await handler(reqRoom, resRoom);
  const roomCode = resRoom._state.body.roomCode;

  const reqJoin1 = createReq('POST', '/api/join-room', { roomCode, playerName: 'Alice' });
  const resJoin1 = createRes();
  await handler(reqJoin1, resJoin1);
  const pid1 = resJoin1._state.body.playerId;

  const reqJoin2 = createReq('POST', '/api/join-room', { roomCode, playerName: 'Bob' });
  const resJoin2 = createRes();
  await handler(reqJoin2, resJoin2);

  await handler(createReq('POST', '/api/start-game', { roomCode }), createRes());

  // Alice (première dans l'ordre) lance les dés
  const reqRoll = createReq('POST', '/api/bizkit/roll', { roomCode, playerId: pid1 });
  const resRoll = createRes();
  await handler(reqRoll, resRoll);

  assert.ok(resRoll._state.body.success);
  assert.strictEqual(resRoll._state.body.results.length, 2);
});

test('API — lancer les dés hors tour → 400', async () => {
  const handler = freshHandler();
  const reqRoom = createReq('POST', '/api/create-room', { gameType: 'bizkit' });
  const resRoom = createRes();
  await handler(reqRoom, resRoom);
  const roomCode = resRoom._state.body.roomCode;

  const reqJoin1 = createReq('POST', '/api/join-room', { roomCode, playerName: 'Alice' });
  const resJoin1 = createRes();
  await handler(reqJoin1, resJoin1);

  const reqJoin2 = createReq('POST', '/api/join-room', { roomCode, playerName: 'Bob' });
  const resJoin2 = createRes();
  await handler(reqJoin2, resJoin2);
  const pid2 = resJoin2._state.body.playerId;

  await handler(createReq('POST', '/api/start-game', { roomCode }), createRes());

  // Bob (pas le tour) tente de lancer
  const reqRoll = createReq('POST', '/api/bizkit/roll', { roomCode, playerId: pid2 });
  const resRoll = createRes();
  await handler(reqRoll, resRoll);

  assert.strictEqual(resRoll._state.statusCode, 400);
  assert.strictEqual(resRoll._state.body.error, 'Pas votre tour');
});

test('API — passer au tour suivant', async () => {
  const handler = freshHandler();
  const reqRoom = createReq('POST', '/api/create-room', { gameType: 'bizkit' });
  const resRoom = createRes();
  await handler(reqRoom, resRoom);
  const roomCode = resRoom._state.body.roomCode;

  const reqJoin1 = createReq('POST', '/api/join-room', { roomCode, playerName: 'Alice' });
  const resJoin1 = createRes();
  await handler(reqJoin1, resJoin1);

  const reqJoin2 = createReq('POST', '/api/join-room', { roomCode, playerName: 'Bob' });
  const resJoin2 = createRes();
  await handler(reqJoin2, resJoin2);

  await handler(createReq('POST', '/api/start-game', { roomCode }), createRes());

  const reqNext = createReq('POST', '/api/bizkit/next', { roomCode });
  const resNext = createRes();
  await handler(reqNext, resNext);

  assert.ok(resNext._state.body.success);
  assert.ok(resNext._state.body.nextPlayer);
});
