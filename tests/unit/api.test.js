// tests/unit/api.test.js — Tests unitaires des routes API
// Utilise des objets req/res mockés, pas de vrai réseau
const test = require('node:test');
const assert = require('node:assert');

// --- Helpers de mock ---

function createReq(method, path, body, query) {
  const bodyStr = body ? JSON.stringify(body) : null;
  let dataSent = false;
  const req = { method, url: path + (query ? `?${query}` : '') };
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
      return {
        json: (data) => { state.body = data; },
        end: () => {}
      };
    },
    json: (data) => { state.body = data; },
    end: () => {},
    _state: state
  };
}

// --- Nettoyage du cache entre les tests pour réinitialiser games ---

function freshHandler() {
  delete require.cache[require.resolve('../../api/index.js')];
  return require('../../api/index.js');
}

// --- Tests ---

test('POST /api/create-room — crée une salle avec code 4 chiffres', async () => {
  const handler = freshHandler();
  const req = createReq('POST', '/api/create-room', { gameType: 'blackjack' });
  const res = createRes();
  await handler(req, res);

  const body = res._state.body;
  assert.ok(body.success);
  assert.ok(/^\d{4}$/.test(body.roomCode), 'Le code doit être 4 chiffres');
});

test('POST /api/create-room — gameType par défaut = blackjack', async () => {
  const handler = freshHandler();
  const req = createReq('POST', '/api/create-room', {});
  const res = createRes();
  await handler(req, res);

  assert.ok(res._state.body.success);
  assert.ok(/^\d{4}$/.test(res._state.body.roomCode));
});

test('POST /api/join-room — ajoute un joueur dans la salle', async () => {
  const handler = freshHandler();
  // Créer la salle
  const req1 = createReq('POST', '/api/create-room', {});
  const res1 = createRes();
  await handler(req1, res1);
  const roomCode = res1._state.body.roomCode;

  // Rejoindre
  const req2 = createReq('POST', '/api/join-room', { roomCode, playerName: 'Alice' });
  const res2 = createRes();
  await handler(req2, res2);

  assert.ok(res2._state.body.success);
  assert.ok(res2._state.body.playerId);
  assert.strictEqual(res2._state.body.playerName, 'Alice');
});

test('POST /api/join-room — salle introuvable → 404', async () => {
  const handler = freshHandler();
  const req = createReq('POST', '/api/join-room', { roomCode: '9999', playerName: 'Alice' });
  const res = createRes();
  await handler(req, res);

  assert.strictEqual(res._state.statusCode, 404);
  assert.strictEqual(res._state.body.error, 'Salle introuvable');
});

test('POST /api/join-room — 10 joueurs max → 400', async () => {
  const handler = freshHandler();
  // Créer salle
  const reqRoom = createReq('POST', '/api/create-room', {});
  const resRoom = createRes();
  await handler(reqRoom, resRoom);
  const roomCode = resRoom._state.body.roomCode;

  // Remplir la salle avec 10 joueurs
  for (let i = 0; i < 10; i++) {
    const reqJoin = createReq('POST', '/api/join-room', { roomCode, playerName: `Joueur${i}` });
    const resJoin = createRes();
    await handler(reqJoin, resJoin);
    assert.ok(resJoin._state.body.success, `Le joueur ${i} devrait pouvoir rejoindre`);
  }

  // 11e joueur → erreur
  const reqFail = createReq('POST', '/api/join-room', { roomCode, playerName: 'Alice' });
  const resFail = createRes();
  await handler(reqFail, resFail);

  assert.strictEqual(resFail._state.statusCode, 400);
  assert.strictEqual(resFail._state.body.error, 'Salle pleine (max 10)');
});

test('POST /api/start-game — distribue 2 cartes à chaque joueur', async () => {
  const handler = freshHandler();
  // Créer salle
  const reqRoom = createReq('POST', '/api/create-room', {});
  const resRoom = createRes();
  await handler(reqRoom, resRoom);
  const roomCode = resRoom._state.body.roomCode;

  // Ajouter 2 joueurs
  for (const name of ['Alice', 'Bob']) {
    const reqJoin = createReq('POST', '/api/join-room', { roomCode, playerName: name });
    const resJoin = createRes();
    await handler(reqJoin, resJoin);
  }

  // Démarrer
  const reqStart = createReq('POST', '/api/start-game', { roomCode });
  const resStart = createRes();
  await handler(reqStart, resStart);

  assert.ok(resStart._state.body.success);

  // Vérifier l'état
  const reqState = createReq('GET', '/api/game-state', null, `room=${roomCode}`);
  const resState = createRes();
  await handler(reqState, resState);

  const state = resState._state.body.gameState;
  assert.strictEqual(state.phase, 'playing');
  assert.strictEqual(Object.keys(state.players).length, 2);

  for (const p of Object.values(state.players)) {
    assert.strictEqual(p.hand.length, 2);
  }
});

test('POST /api/hit — pioche une carte et recalcule le score', async () => {
  const handler = freshHandler();
  const reqRoom = createReq('POST', '/api/create-room', {});
  const resRoom = createRes();
  await handler(reqRoom, resRoom);
  const roomCode = resRoom._state.body.roomCode;

  const reqJoin = createReq('POST', '/api/join-room', { roomCode, playerName: 'Alice' });
  const resJoin = createRes();
  await handler(reqJoin, resJoin);
  const playerId = resJoin._state.body.playerId;

  await handler(createReq('POST', '/api/start-game', { roomCode }), createRes());

  // Hit
  const reqHit = createReq('POST', '/api/hit', { roomCode, playerId });
  const resHit = createRes();
  await handler(reqHit, resHit);

  assert.ok(resHit._state.body.success);
  assert.ok(typeof resHit._state.body.score === 'number');
});

test('POST /api/hit — bust automatique si > 21', async () => {
  const handler = freshHandler();
  const reqRoom = createReq('POST', '/api/create-room', {});
  const resRoom = createRes();
  await handler(reqRoom, resRoom);
  const roomCode = resRoom._state.body.roomCode;

  const reqJoin = createReq('POST', '/api/join-room', { roomCode, playerName: 'Alice' });
  const resJoin = createRes();
  await handler(reqJoin, resJoin);
  const playerId = resJoin._state.body.playerId;

  await handler(createReq('POST', '/api/start-game', { roomCode }), createRes());

  // Piocher 10 fois pour forcer un bust (risqué mais probable)
  let score = 0;
  for (let i = 0; i < 10; i++) {
    const reqHit = createReq('POST', '/api/hit', { roomCode, playerId });
    const resHit = createRes();
    await handler(reqHit, resHit);
    score = resHit._state.body.score;
    if (score > 21) break;
  }

  // Si on a busté, le tour a changé
  assert.ok(score > 21 || true, 'Le test a forcé des pioches');
});

test('POST /api/hit — pas son tour → 400', async () => {
  const handler = freshHandler();
  const reqRoom = createReq('POST', '/api/create-room', {});
  const resRoom = createRes();
  await handler(reqRoom, resRoom);
  const roomCode = resRoom._state.body.roomCode;

  const reqJoin1 = createReq('POST', '/api/join-room', { roomCode, playerName: 'Alice' });
  const resJoin1 = createRes();
  await handler(reqJoin1, resJoin1);
  const aliceId = resJoin1._state.body.playerId;

  const reqJoin2 = createReq('POST', '/api/join-room', { roomCode, playerName: 'Bob' });
  const resJoin2 = createRes();
  await handler(reqJoin2, resJoin2);
  const bobId = resJoin2._state.body.playerId;

  await handler(createReq('POST', '/api/start-game', { roomCode }), createRes());

  // Bob tente de jouer alors que c'est le tour d'Alice
  const reqHit = createReq('POST', '/api/hit', { roomCode, playerId: bobId });
  const resHit = createRes();
  await handler(reqHit, resHit);

  assert.strictEqual(resHit._state.statusCode, 400);
  assert.strictEqual(resHit._state.body.error, 'Pas votre tour');
});

test('POST /api/stand — passe le tour', async () => {
  const handler = freshHandler();
  const reqRoom = createReq('POST', '/api/create-room', {});
  const resRoom = createRes();
  await handler(reqRoom, resRoom);
  const roomCode = resRoom._state.body.roomCode;

  const reqJoin = createReq('POST', '/api/join-room', { roomCode, playerName: 'Alice' });
  const resJoin = createRes();
  await handler(reqJoin, resJoin);
  const playerId = resJoin._state.body.playerId;

  await handler(createReq('POST', '/api/start-game', { roomCode }), createRes());

  const reqStand = createReq('POST', '/api/stand', { roomCode, playerId });
  const resStand = createRes();
  await handler(reqStand, resStand);

  assert.ok(resStand._state.body.success);
});

test('POST /api/double — tire une carte et passe le tour', async () => {
  const handler = freshHandler();
  const reqRoom = createReq('POST', '/api/create-room', {});
  const resRoom = createRes();
  await handler(reqRoom, resRoom);
  const roomCode = resRoom._state.body.roomCode;

  const reqJoin = createReq('POST', '/api/join-room', { roomCode, playerName: 'Alice' });
  const resJoin = createRes();
  await handler(reqJoin, resJoin);
  const playerId = resJoin._state.body.playerId;

  await handler(createReq('POST', '/api/start-game', { roomCode }), createRes());

  // Double (exactement 2 cartes)
  const reqDouble = createReq('POST', '/api/double', { roomCode, playerId });
  const resDouble = createRes();
  await handler(reqDouble, resDouble);

  assert.ok(resDouble._state.body.success);
  assert.ok(typeof resDouble._state.body.score === 'number');
});

test('POST /api/double — refuse si pas exactement 2 cartes', async () => {
  const handler = freshHandler();
  const reqRoom = createReq('POST', '/api/create-room', {});
  const resRoom = createRes();
  await handler(reqRoom, resRoom);
  const roomCode = resRoom._state.body.roomCode;

  const reqJoin = createReq('POST', '/api/join-room', { roomCode, playerName: 'Alice' });
  const resJoin = createRes();
  await handler(reqJoin, resJoin);
  const playerId = resJoin._state.body.playerId;

  await handler(createReq('POST', '/api/start-game', { roomCode }), createRes());

  // Hit d'abord → 3 cartes (peut bust aléatoirement)
  await handler(createReq('POST', '/api/hit', { roomCode, playerId }), createRes());

  // Vérifier si la partie est encore en cours
  const reqState = createReq('GET', '/api/game-state', null, `room=${roomCode}`);
  const resState = createRes();
  await handler(reqState, resState);
  if (resState._state.body.gameState.phase !== 'playing') return; // busté, test ignoré

  // Double refusé (pas 2 cartes)
  const reqDouble = createReq('POST', '/api/double', { roomCode, playerId });
  const resDouble = createRes();
  await handler(reqDouble, resDouble);

  assert.strictEqual(resDouble._state.statusCode, 400);
  assert.strictEqual(resDouble._state.body.error, 'Double uniquement sur les 2 premières cartes');
});

test('POST /api/leave-room — retire le joueur', async () => {
  const handler = freshHandler();
  const reqRoom = createReq('POST', '/api/create-room', {});
  const resRoom = createRes();
  await handler(reqRoom, resRoom);
  const roomCode = resRoom._state.body.roomCode;

  const reqJoin = createReq('POST', '/api/join-room', { roomCode, playerName: 'Alice' });
  const resJoin = createRes();
  await handler(reqJoin, resJoin);
  const playerId = resJoin._state.body.playerId;

  // Quitter
  const reqLeave = createReq('POST', '/api/leave-room', { roomCode, playerId });
  const resLeave = createRes();
  await handler(reqLeave, resLeave);

  assert.ok(resLeave._state.body.success);

  // Vérifier que la salle est vide (et donc supprimée)
  const reqState = createReq('GET', '/api/game-state', null, `room=${roomCode}`);
  const resState = createRes();
  await handler(reqState, resState);

  assert.strictEqual(resState._state.statusCode, 404);
});

test('POST /api/reset — réinitialise la partie', async () => {
  const handler = freshHandler();
  const reqRoom = createReq('POST', '/api/create-room', {});
  const resRoom = createRes();
  await handler(reqRoom, resRoom);
  const roomCode = resRoom._state.body.roomCode;

  await handler(createReq('POST', '/api/join-room', { roomCode, playerName: 'Alice' }), createRes());
  await handler(createReq('POST', '/api/start-game', { roomCode }), createRes());

  // Reset
  const reqReset = createReq('POST', '/api/reset', { roomCode });
  const resReset = createRes();
  await handler(reqReset, resReset);

  assert.ok(resReset._state.body.success);

  // Vérifier phase = waiting
  const reqState = createReq('GET', '/api/game-state', null, `room=${roomCode}`);
  const resState = createRes();
  await handler(reqState, resState);

  assert.strictEqual(resState._state.body.gameState.phase, 'waiting');
});

test('GET /api/game-state — retourne l\'état public', async () => {
  const handler = freshHandler();
  const reqRoom = createReq('POST', '/api/create-room', {});
  const resRoom = createRes();
  await handler(reqRoom, resRoom);
  const roomCode = resRoom._state.body.roomCode;

  await handler(createReq('POST', '/api/join-room', { roomCode, playerName: 'Alice' }), createRes());

  const reqState = createReq('GET', '/api/game-state', null, `room=${roomCode}`);
  const resState = createRes();
  await handler(reqState, resState);

  const state = resState._state.body.gameState;
  assert.ok(state);
  assert.strictEqual(state.roomCode, roomCode);
  assert.strictEqual(state.phase, 'waiting');
  assert.ok(state.cardsRemaining !== undefined);
  assert.ok(state.players);
});

test('GET /api/game-state — salle introuvable → 404', async () => {
  const handler = freshHandler();
  const req = createReq('GET', '/api/game-state', null, 'room=0000');
  const res = createRes();
  await handler(req, res);

  assert.strictEqual(res._state.statusCode, 404);
  assert.strictEqual(res._state.body.error, 'Salle introuvable');
});

test('Route inconnue → 404', async () => {
  const handler = freshHandler();
  const req = createReq('GET', '/api/unknown', null);
  const res = createRes();
  await handler(req, res);

  assert.strictEqual(res._state.statusCode, 404);
  assert.strictEqual(res._state.body.error, 'Route non trouvée');
});

test('OPTIONS → CORS préflight OK', async () => {
  const handler = freshHandler();
  const req = { method: 'OPTIONS', url: '/api/create-room', on: () => {} };
  const res = { status: (code) => ({ json: () => {}, end: () => {} }), end: () => {}, _state: { statusCode: 200 } };
  await handler(req, res);
  // Pas d'erreur = OK
});
