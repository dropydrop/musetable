// api/index.js — Backend Blackjack pour MuseTable
// Version optimisée Vercel (serverless)
// Routes : /api/xxx

const {
  createShuffledDeck,
  calculateScore,
  nextTurn,
  checkGameFinished
} = require('../game-logic.js');

const games = {};

function generateRoomCode() {
  let code;
  do {
    code = String(Math.floor(1000 + Math.random() * 9000));
  } while (games[code]);
  return code;
}

function generatePlayerId() {
  return Math.random().toString(36).substring(2, 10);
}

// --- Handler Vercel
module.exports = async (req, res) => {
  // CORS préflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;

  const parseBody = () =>
    new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try { resolve(body ? JSON.parse(body) : {}); }
        catch (e) { reject(new Error('JSON invalide')); }
      });
      req.on('error', reject);
    });

  try {
    // POST /api/create-room
    if (path === '/api/create-room' && req.method === 'POST') {
      const code = generateRoomCode();
      const { gameType } = await parseBody();
      games[code] = {
        players: {},
        deck: createShuffledDeck(),
        currentTurn: null,
        phase: 'waiting',
        gameType: gameType || 'blackjack',
        turnIndex: 0,
        playerOrder: [],
        winners: null,
        result: null
      };
      res.status(200).json({ success: true, roomCode: code });
      return;
    }

    // POST /api/join-room
    if (path === '/api/join-room' && req.method === 'POST') {
      const { roomCode, playerName } = await parseBody();
      const room = games[roomCode];
      if (!room) { res.status(404).json({ success: false, error: 'Salle introuvable' }); return; }
      if (room.phase !== 'waiting') { res.status(400).json({ success: false, error: 'Partie déjà commencée' }); return; }
      if (Object.keys(room.players).length >= 10) { res.status(400).json({ success: false, error: 'Salle pleine (max 10)' }); return; }

      const id = generatePlayerId();
      room.players[id] = {
        name: playerName || 'Anonyme',
        hand: [],
        score: 0,
        isActive: true,
        stand: false
      };
      res.status(200).json({ success: true, playerId: id, playerName: playerName || 'Anonyme' });
      return;
    }

    // POST /api/start-game
    if (path === '/api/start-game' && req.method === 'POST') {
      const { roomCode } = await parseBody();
      const room = games[roomCode];
      if (!room) { res.status(404).json({ success: false, error: 'Salle introuvable' }); return; }
      if (Object.keys(room.players).length === 0) { res.status(400).json({ success: false, error: 'Aucun joueur' }); return; }
      if (room.phase !== 'waiting') { res.status(400).json({ success: false, error: 'Partie déjà commencée' }); return; }

      for (const p of Object.values(room.players)) {
        p.hand.push(room.deck.pop());
        p.hand.push(room.deck.pop());
        p.score = calculateScore(p.hand);
        p.isActive = true;
        p.stand = false;
      }

      room.phase = 'playing';
      room.playerOrder = Object.keys(room.players);
      room.turnIndex = 0;
      room.currentTurn = room.playerOrder[0];
      res.status(200).json({ success: true });
      return;
    }

    // POST /api/hit
    if (path === '/api/hit' && req.method === 'POST') {
      const { roomCode, playerId } = await parseBody();
      const room = games[roomCode];
      if (!room) { res.status(404).json({ success: false, error: 'Salle introuvable' }); return; }
      if (room.phase !== 'playing') { res.status(400).json({ success: false, error: 'Partie pas en cours' }); return; }
      if (room.currentTurn !== playerId) { res.status(400).json({ success: false, error: 'Pas votre tour' }); return; }

      const player = room.players[playerId];
      if (!player) { res.status(404).json({ success: false, error: 'Joueur introuvable' }); return; }

      player.hand.push(room.deck.pop());
      player.score = calculateScore(player.hand);

      if (player.score > 21) {
        player.isActive = false;
        player.stand = true;
        nextTurn(room);
      }

      res.status(200).json({ success: true, score: player.score });
      return;
    }

    // POST /api/stand
    if (path === '/api/stand' && req.method === 'POST') {
      const { roomCode, playerId } = await parseBody();
      const room = games[roomCode];
      if (!room) { res.status(404).json({ success: false, error: 'Salle introuvable' }); return; }
      if (room.phase !== 'playing') { res.status(400).json({ success: false, error: 'Partie pas en cours' }); return; }
      if (room.currentTurn !== playerId) { res.status(400).json({ success: false, error: 'Pas votre tour' }); return; }

      const player = room.players[playerId];
      if (!player) { res.status(404).json({ success: false, error: 'Joueur introuvable' }); return; }

      player.stand = true;
      player.isActive = false;
      nextTurn(room);

      res.status(200).json({ success: true });
      return;
    }

    // POST /api/double
    if (path === '/api/double' && req.method === 'POST') {
      const { roomCode, playerId } = await parseBody();
      const room = games[roomCode];
      if (!room) { res.status(404).json({ success: false, error: 'Salle introuvable' }); return; }
      if (room.phase !== 'playing') { res.status(400).json({ success: false, error: 'Partie pas en cours' }); return; }
      if (room.currentTurn !== playerId) { res.status(400).json({ success: false, error: 'Pas votre tour' }); return; }

      const player = room.players[playerId];
      if (!player) { res.status(404).json({ success: false, error: 'Joueur introuvable' }); return; }

      // Double = 1 carte + stand automatique (uniquement sur les 2 premières cartes)
      if (player.hand.length !== 2) { res.status(400).json({ success: false, error: 'Double uniquement sur les 2 premières cartes' }); return; }

      player.hand.push(room.deck.pop());
      player.score = calculateScore(player.hand);
      player.stand = true;
      player.isActive = false;
      nextTurn(room);

      res.status(200).json({ success: true, score: player.score });
      return;
    }

    // POST /api/leave-room
    if (path === '/api/leave-room' && req.method === 'POST') {
      const { roomCode, playerId } = await parseBody();
      const room = games[roomCode];
      if (!room) { res.status(404).json({ success: false, error: 'Salle introuvable' }); return; }

      if (playerId) {
        delete room.players[playerId];
      }

      // Nettoyer la salle si vide
      if (Object.keys(room.players).length === 0) {
        delete games[roomCode];
      }

      res.status(200).json({ success: true });
      return;
    }

    // GET /api/game-state
    if (path === '/api/game-state' && req.method === 'GET') {
      const roomCode = url.searchParams.get('room');
      const room = games[roomCode];
      if (!room) { res.status(404).json({ success: false, error: 'Salle introuvable' }); return; }

      const publicState = {
        roomCode,
        phase: room.phase,
        gameType: room.gameType,
        currentTurn: room.currentTurn,
        winners: room.winners,
        result: room.result,
        cardsRemaining: room.deck.length,
        players: {}
      };

      for (const [id, p] of Object.entries(room.players)) {
        publicState.players[id] = {
          name: p.name,
          hand: p.hand,
          score: p.score,
          isActive: p.isActive,
          stand: p.stand
        };
      }

      res.status(200).json({ success: true, gameState: publicState });
      return;
    }

    // POST /api/reset
    if (path === '/api/reset' && req.method === 'POST') {
      const { roomCode } = await parseBody();
      const room = games[roomCode];
      if (!room) { res.status(404).json({ success: false, error: 'Salle introuvable' }); return; }

      room.phase = 'waiting';
      room.deck = createShuffledDeck();
      room.currentTurn = null;
      room.turnIndex = 0;
      room.playerOrder = [];
      room.winners = null;
      room.result = null;

      for (const p of Object.values(room.players)) {
        p.hand = [];
        p.score = 0;
        p.isActive = true;
        p.stand = false;
      }

      res.status(200).json({ success: true });
      return;
    }

    // Route inconnue → servir index.html (frontend)
    res.status(404).json({ success: false, error: 'Route non trouvée' });

  } catch (e) {
    res.status(500).json({ success: false, error: 'Erreur serveur: ' + e.message });
  }
};

// Démarrage local (node api/index.js) — Vercel ignore ce bloc
if (require.main === module) {
  const http = require('http');
  const PORT = process.env.PORT || 3000;
  const server = http.createServer((req, res) => {
    module.exports(req, res);
  });
  server.listen(PORT, () => {
    console.log(`♠ MuseTable — http://localhost:${PORT}`);
  });
}