// api/index.js — Routeur principal MuseTable
// Routes communes : create/join/leave-room, game-state, reset
// Routes spécifiques dispatchées vers le handler du jeu

const {
  generateRoomCode,
  generatePlayerId,
  createShuffledDeck
} = require('./game-logic/common.js');

const blackjack = require('./handlers/blackjack.js');
const free = require('./handlers/free.js');
const bizkit = require('./handlers/bizkit.js');

const games = {};

function getRoom(path, body, url, games) {
  if (path === '/api/game-state') return games[url.searchParams.get('room')];
  return body.roomCode ? games[body.roomCode] : null;
}

// --- Handler Vercel
module.exports = async (req, res) => {
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
    // --- Routes sans salle ---

    // POST /api/create-room
    if (path === '/api/create-room' && req.method === 'POST') {
      const code = generateRoomCode(c => !!games[c]);
      const { gameType } = await parseBody();
      const type = gameType || 'blackjack';
      games[code] = {
        players: {},
        deck: createShuffledDeck(),
        currentTurn: null,
        phase: type === 'free' ? 'playing' : 'waiting',
        gameType: type,
        turnIndex: 0,
        playerOrder: [],
        winners: null,
        result: null,
        table: [],
        lastDice: null,
        diceCount: 1
      };
      res.status(200).json({ success: true, roomCode: code });
      return;
    }

    if (path === '/api/unknown') {
      res.status(404).json({ success: false, error: 'Route non trouvée' });
      return;
    }

    // --- Routes avec salle ---
    const body = await parseBody();
    const room = getRoom(path, body, url, games);
    if (!room) {
      if (path === '/api/join-room' || path === '/api/leave-room' || path === '/api/game-state' ||
          path === '/api/reset' || path === '/api/start-game' || path === '/api/hit' ||
          path === '/api/stand' || path === '/api/double' ||
          path.startsWith('/api/free/') || path.startsWith('/api/bizkit/')) {
        res.status(404).json({ success: false, error: 'Salle introuvable' });
        return;
      }
      res.status(404).json({ success: false, error: 'Route non trouvée' });
      return;
    }

    // --- Routes communes ---

    // POST /api/join-room
    if (path === '/api/join-room' && req.method === 'POST') {
      const { playerName } = body;
      if (room.phase !== 'waiting' && room.gameType !== 'free') { res.status(400).json({ success: false, error: 'Partie déjà commencée' }); return; }
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

    // POST /api/leave-room
    if (path === '/api/leave-room' && req.method === 'POST') {
      const { playerId } = body;
      if (playerId) delete room.players[playerId];
      if (Object.keys(room.players).length === 0) delete games[body.roomCode];
      res.status(200).json({ success: true });
      return;
    }

    // GET /api/game-state
    if (path === '/api/game-state' && req.method === 'GET') {
      const publicState = {
        roomCode: url.searchParams.get('room'),
        phase: room.phase,
        gameType: room.gameType,
        currentTurn: room.currentTurn,
        winners: room.winners,
        result: room.result,
        cardsRemaining: room.deck.length,
        table: room.table || [],
        lastDice: room.lastDice || null,
        diceCount: room.diceCount || 1,
        players: {}
      };
      for (const [id, p] of Object.entries(room.players)) {
        publicState.players[id] = {
          name: p.name,
          hand: p.hand,
          score: p.score,
          isActive: room.gameType === 'free' ? true : p.isActive,
          stand: room.gameType === 'free' ? false : p.stand
        };
      }
      res.status(200).json({ success: true, gameState: publicState });
      return;
    }

    // POST /api/reset
    if (path === '/api/reset' && req.method === 'POST') {
      room.phase = room.gameType === 'free' ? 'playing' : 'waiting';
      room.deck = createShuffledDeck();
      room.currentTurn = null;
      room.turnIndex = 0;
      room.playerOrder = [];
      room.winners = null;
      room.result = null;
      room.table = [];
      room.lastDice = null;
      for (const p of Object.values(room.players)) {
        p.hand = [];
        p.score = 0;
        if (room.gameType !== 'free') { p.isActive = true; p.stand = false; }
      }
      res.status(200).json({ success: true });
      return;
    }

    // --- Routes spécifiques au Blackjack ---
    if (room.gameType === 'blackjack') {
      if (path === '/api/start-game' && req.method === 'POST') {
        await blackjack.startGame(room, body, res, games);
        return;
      }
      if (path === '/api/hit' && req.method === 'POST') {
        await blackjack.hit(room, body, res, games);
        return;
      }
      if (path === '/api/stand' && req.method === 'POST') {
        await blackjack.stand(room, body, res, games);
        return;
      }
      if (path === '/api/double' && req.method === 'POST') {
        await blackjack.double(room, body, res, games);
        return;
      }
    }

    // --- Routes spécifiques au mode Libre ---
    if (room.gameType === 'free') {
      if (path === '/api/free/draw' && req.method === 'POST') {
        await free.draw(room, body, res, games); return;
      }
      if (path === '/api/free/play' && req.method === 'POST') {
        await free.play(room, body, res, games); return;
      }
      if (path === '/api/free/flip' && req.method === 'POST') {
        await free.flip(room, body, res, games); return;
      }
      if (path === '/api/free/pickup' && req.method === 'POST') {
        await free.pickup(room, body, res, games); return;
      }
      if (path === '/api/free/shuffle' && req.method === 'POST') {
        await free.shuffle(room, body, res, games); return;
      }
      if (path === '/api/free/deal' && req.method === 'POST') {
        await free.deal(room, body, res, games); return;
      }
      if (path === '/api/free/flip-hand' && req.method === 'POST') {
        await free.flipHand(room, body, res, games); return;
      }
      if (path === '/api/free/reset' && req.method === 'POST') {
        await free.reset(room, body, res, games); return;
      }
      if (path === '/api/free/roll' && req.method === 'POST') {
        await free.roll(room, body, res); return;
      }
      if (path === '/api/free/set-dice' && req.method === 'POST') {
        await free.setDiceCount(room, body, res); return;
      }
    }

    // --- Routes spécifiques au Bizkit ---
    if (room.gameType === 'bizkit') {
      if (path === '/api/start-game' && req.method === 'POST') {
        await bizkit.startGame(room, body, res, games); return;
      }
      if (path === '/api/bizkit/roll' && req.method === 'POST') {
        await bizkit.roll(room, body, res, games); return;
      }
      if (path === '/api/bizkit/next' && req.method === 'POST') {
        await bizkit.next(room, body, res, games); return;
      }
    }

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
