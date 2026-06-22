// server.js — Backend Blackjack pour MuseTable
// Routes API RESTful, stockage mémoire, zéro dépendance externe
// Compatible Vercel (serverless)

const games = {};

// Génère un code de salle à 4 chiffres (unique)
function generateRoomCode() {
  let code;
  do {
    code = String(Math.floor(1000 + Math.random() * 9000));
  } while (games[code]);
  return code;
}

// Génère un ID joueur aléatoire
function generatePlayerId() {
  return Math.random().toString(36).substring(2, 10);
}

// Crée un deck de 52 cartes mélangé (Fisher-Yates)
function createShuffledDeck() {
  const suits = ['S', 'H', 'D', 'C'];
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Calcule le score Blackjack (As = 1 ou 11)
function calculateScore(hand) {
  let score = 0;
  let aces = 0;
  for (const card of hand) {
    if (card.value === 'A') { aces++; score += 11; }
    else if (['J', 'Q', 'K'].includes(card.value)) { score += 10; }
    else { score += parseInt(card.value); }
  }
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }
  return score;
}

// Vérifie si tous les joueurs ont joué → détermine le gagnant
function checkGameFinished(room) {
  const players = Object.values(room.players);
  const allDone = players.every(p => !p.isActive || p.stand);
  if (!allDone || players.length === 0) return;

  room.phase = 'finished';
  let bestScore = 0;
  let winners = [];

  for (const p of players) {
    p.score = calculateScore(p.hand);
    if (p.score <= 21 && p.score > bestScore) {
      bestScore = p.score;
      winners = [p.name];
    } else if (p.score <= 21 && p.score === bestScore) {
      winners.push(p.name);
    }
  }

  room.winners = winners.length > 0 ? winners : ['Personne (tous ont dépassé 21)'];
  room.result = bestScore;
}

// Passe au joueur suivant ou termine la partie
function nextTurn(room) {
  room.turnIndex++;
  if (room.turnIndex >= room.playerOrder.length) {
    room.currentTurn = null;
    checkGameFinished(room);
  } else {
    room.currentTurn = room.playerOrder[room.turnIndex];
  }
}

// Handler Vercel — toutes les routes arrivent ici
module.exports = (req, res) => {
  // CORS : autorise les requêtes cross-device
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end('');
    return;
  }

  // Parse l'URL (chemin + query string)
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;

  const json = (data, status = 200) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  };

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

  (async () => {
    try {
      // POST /api/create-room
      if (path === '/api/create-room' && req.method === 'POST') {
        const code = generateRoomCode();
        games[code] = {
          players: {},
          deck: createShuffledDeck(),
          currentTurn: null,
          phase: 'waiting',
          gameType: 'blackjack',
          turnIndex: 0,
          playerOrder: [],
          winners: null,
          result: null
        };
        return json({ success: true, roomCode: code });
      }

      // POST /api/join-room
      if (path === '/api/join-room' && req.method === 'POST') {
        const { roomCode, playerName } = await parseBody();
        const room = games[roomCode];
        if (!room) return json({ success: false, error: 'Salle introuvable' }, 404);
        if (room.phase !== 'waiting') return json({ success: false, error: 'Partie déjà commencée' }, 400);
        if (Object.keys(room.players).length >= 6) return json({ success: false, error: 'Salle pleine (max 6)' }, 400);

        const id = generatePlayerId();
        room.players[id] = {
          name: playerName || 'Anonyme',
          hand: [],
          score: 0,
          isActive: true,
          stand: false
        };
        return json({ success: true, playerId: id, playerName: playerName || 'Anonyme' });
      }

      // POST /api/start-game
      if (path === '/api/start-game' && req.method === 'POST') {
        const { roomCode } = await parseBody();
        const room = games[roomCode];
        if (!room) return json({ success: false, error: 'Salle introuvable' }, 404);
        if (Object.keys(room.players).length === 0) return json({ success: false, error: 'Aucun joueur dans la salle' }, 400);
        if (room.phase !== 'waiting') return json({ success: false, error: 'Partie déjà commencée' }, 400);

        // Distribution : 2 cartes par joueur
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
        return json({ success: true });
      }

      // POST /api/hit
      if (path === '/api/hit' && req.method === 'POST') {
        const { roomCode, playerId } = await parseBody();
        const room = games[roomCode];
        if (!room) return json({ success: false, error: 'Salle introuvable' }, 404);
        if (room.phase !== 'playing') return json({ success: false, error: 'Partie pas en cours' }, 400);
        if (room.currentTurn !== playerId) return json({ success: false, error: 'Ce n\'est pas votre tour' }, 400);

        const player = room.players[playerId];
        if (!player) return json({ success: false, error: 'Joueur introuvable' }, 404);

        player.hand.push(room.deck.pop());
        player.score = calculateScore(player.hand);

        // Bust → automatically out
        if (player.score > 21) {
          player.isActive = false;
          player.stand = true;
          nextTurn(room);
        }

        return json({ success: true, score: player.score });
      }

      // POST /api/stand
      if (path === '/api/stand' && req.method === 'POST') {
        const { roomCode, playerId } = await parseBody();
        const room = games[roomCode];
        if (!room) return json({ success: false, error: 'Salle introuvable' }, 404);
        if (room.phase !== 'playing') return json({ success: false, error: 'Partie pas en cours' }, 400);
        if (room.currentTurn !== playerId) return json({ success: false, error: 'Ce n\'est pas votre tour' }, 400);

        const player = room.players[playerId];
        if (!player) return json({ success: false, error: 'Joueur introuvable' }, 404);

        player.stand = true;
        player.isActive = false;
        nextTurn(room);

        return json({ success: true });
      }

      // GET /api/game-state
      if (path === '/api/game-state' && req.method === 'GET') {
        const roomCode = url.searchParams.get('room');
        const room = games[roomCode];
        if (!room) return json({ success: false, error: 'Salle introuvable' }, 404);

        // État public (sans le deck restant pour éviter la triche)
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

        return json({ success: true, gameState: publicState });
      }

      // POST /api/reset
      if (path === '/api/reset' && req.method === 'POST') {
        const { roomCode } = await parseBody();
        const room = games[roomCode];
        if (!room) return json({ success: false, error: 'Salle introuvable' }, 404);

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

        return json({ success: true });
      }

      // Route inconnue
      return json({ success: false, error: 'Route non trouvée' }, 404);

    } catch (e) {
      return json({ success: false, error: 'Erreur serveur: ' + e.message }, 500);
    }
  })();
};

// Démarrage local (node server.js) — Vercel ignore ce bloc
if (require.main === module) {
  const http = require('http');
  const PORT = process.env.PORT || 3000;
  const server = http.createServer(module.exports);
  server.listen(PORT, () => {
    console.log(`♠ MuseTable — http://localhost:${PORT}`);
  });
}
