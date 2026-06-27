/* common.js — Fonctions partagées MuseTable (frontend) */

// --- Configuration
window.API_BASE = window.location.origin;
window.POLL_INTERVAL = 2000;

// --- État local
window.state = {
  roomCode: null, playerId: null, playerName: null,
  isSpectator: false, anonMode: false, isFullscreen: false,
  pollingId: null, phase: 'lobby'
};

// --- Éléments DOM (référencés une seule fois au chargement)
window.$ = id => document.getElementById(id);
window.dom = {};

function initDom() {
  const ids = ['screen-lobby','screen-room','screen-game','input-name','input-game',
    'input-code','input-join-name','btn-create','btn-join','btn-spectate',
    'room-code-display','room-game-type','waiting-players','btn-start','btn-leave',
    'btn-back-menu','btn-reset-session',
    'game-code-badge','phase-badge','game-type-badge','board','game-status',
    'dice-count-display',
    'controls','btn-fullscreen','btn-anonyme','result-overlay','winner-text',
    'result-scores','btn-replay','btn-back-lobby','toast'];
  ids.forEach(id => window.dom[id] = window.$(id));
}

// --- API
window.api = async (method, path, body) => {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(window.API_BASE + path, opts);
  const data = await r.json();
  if (!data.success) throw new Error(data.error || 'Erreur serveur');
  return data;
};

// --- UI
window.showScreen = function(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = window.$(id);
  if (el) el.classList.add('active');
};

window.getCardValue = function(card) {
  if (card.value === 'A') return 'A';
  if (['J','Q','K'].includes(card.value)) return card.value;
  return card.value;
};

window.getSuitSymbol = function(card) {
  return { S:'♠', H:'♥', D:'♦', C:'♣' }[card.suit] || '';
};

window.createCardElement = function(card, faceUp) {
  const div = document.createElement('div');
  div.className = 'card';
  if (faceUp === false || card.faceDown === true) {
    div.style.background = 'linear-gradient(135deg, #1a237e, #0d47a1)';
    div.style.border = '2px solid #fff';
    div.style.color = '#fff';
    div.style.fontSize = '2rem';
    div.style.fontWeight = '700';
    div.innerHTML = '<span style="opacity:0.25;letter-spacing:2px">♠♥♦♣</span>';
    return div;
  }
  const isRed = card.suit === 'H' || card.suit === 'D';
  div.classList.add(isRed ? 'red' : 'black');
  const inner = document.createElement('div');
  inner.className = 'card-inner';
  const valSpan = document.createElement('span');
  valSpan.className = 'card-value';
  valSpan.textContent = window.getCardValue(card);
  const suitSpan = document.createElement('span');
  suitSpan.className = 'card-suit';
  suitSpan.textContent = window.getSuitSymbol(card);
  inner.appendChild(valSpan);
  inner.appendChild(suitSpan);
  div.appendChild(inner);
  return div;
};

window._getDicePositions = function(value) {
  return ({
    1: [[1,1]],
    2: [[0,0],[2,2]],
    3: [[0,0],[1,1],[2,2]],
    4: [[0,0],[0,2],[2,0],[2,2]],
    5: [[0,0],[0,2],[1,1],[2,0],[2,2]],
    6: [[0,0],[0,2],[1,0],[1,2],[2,0],[2,2]]
  })[value] || [];
};

window._buildDiceGrid = function(grid, value) {
  const dots = window._getDicePositions(value);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const cell = document.createElement('div');
      cell.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center';
      if (dots.some(([r,c]) => r === row && c === col)) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        cell.appendChild(dot);
      }
      grid.appendChild(cell);
    }
  }
};

window.createDiceElement = function(value, isRolling) {
  const dice = document.createElement('div');
  dice.className = 'dice';
  if (isRolling) dice.classList.add('rolling');
  const grid = document.createElement('div');
  grid.className = 'dice-grid';
  window._buildDiceGrid(grid, value);
  dice.appendChild(grid);
  return dice;
};

window.updateDiceDots = function(diceEl, value) {
  const grid = diceEl.querySelector('.dice-grid');
  if (!grid) return;
  grid.innerHTML = '';
  window._buildDiceGrid(grid, value);
};

// --- État de lancer de dés (animation)
window._diceRolling = { active: false, results: null };

window.startDiceRolling = function(diceElements, finalResults) {
  window._diceRolling.active = true;

  const values = [1, 2, 3, 4, 5, 6];
  let tick = 0;

  const interval = setInterval(() => {
    const val = values[tick % 6];
    diceElements.forEach(el => window.updateDiceDots(el, val));
    tick++;
  }, 100);

  setTimeout(() => {
    clearInterval(interval);
    window._diceRolling.active = false;
    diceElements.forEach((el, i) => {
      el.classList.remove('rolling');
      if (i < finalResults.length) window.updateDiceDots(el, finalResults[i]);
    });
  }, 2000);
};

// --- Détermination de la disposition des cartes
window.getCardLayout = function(hand) {
  if (!hand || hand.length <= 5) return 'fan';
  if (hand.length <= 10) return 'grid';
  return 'scroll';
};

window.showToast = function(msg, duration) {
  const el = window.dom.toast;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), duration || 3000);
};

window.getGameTypeLabel = function(type) {
  return ({ blackjack:'♠ Blackjack', tarot:'🎴 Tarot Africain', devine:'🤯 Devine Tête', pyramide:'🔺 Pyramide', bizkit:'🎲 Bizkit', free:'🃏 Libre' })[type] || type || 'Libre';
};

// --- Navigation
window.showLobby = function() {
  window.state.phase = 'lobby';
  window.state.roomCode = null;
  window.state.playerId = null;
  window._currentGameMode = null;
  window.stopPolling();
  window.showScreen('screen-lobby');
  window.dom['result-overlay'].classList.remove('show');
};

window.showRoom = function(roomCode) {
  window.state.roomCode = roomCode;
  window.state.phase = 'room';
  window.dom['room-code-display'].textContent = roomCode;
  window.dom['game-code-badge'].textContent = roomCode;
  window.showScreen('screen-room');
  window.startPolling();
};

window.showGame = function() {
  if (!window.state.roomCode) {
    console.warn('[MuseTable] showGame appelé sans roomCode');
    window.showLobby();
    return;
  }
  window.state.phase = 'playing';
  window.showScreen('screen-game');
  window.dom['screen-game'].classList.remove('spectator');
};

// --- Bascule de mode de jeu (appelé au passage en phase playing)
window.switchGameMode = function(gameType) {
  if (window._currentGameMode === gameType) return;
  window._currentGameMode = gameType;

  const mode = window[gameType];
  if (mode && mode.init) mode.init();
};

// --- Polling
window.startPolling = function() {
  window.stopPolling();
  window.pollGameState();
  window.state.pollingId = setInterval(window.pollGameState, window.POLL_INTERVAL);
};

window.stopPolling = function() {
  if (window.state.pollingId) {
    clearInterval(window.state.pollingId);
    window.state.pollingId = null;
  }
};

function renderWaitingPlayers(gs) {
  const list = window.dom['waiting-players'];
  if (!list) return;
  list.innerHTML = '';
  if (gs.players) {
    for (const [, p] of Object.entries(gs.players)) {
      const tag = document.createElement('span');
      tag.className = 'player-tag';
      tag.textContent = p.name || 'Anonyme';
      list.appendChild(tag);
    }
  }
}

window.pollGameState = async function() {
  if (!window.state.roomCode) { console.warn('[MuseTable] pollGameState — roomCode manquant'); return; }
  try {
    const data = await window.api('GET', `/api/game-state?room=${window.state.roomCode}`);
    const gs = data.gameState;
    if (gs.phase === 'playing' && window.state.phase === 'room') {
      window.state.phase = 'playing';
      window.showGame();
      if (window.switchGameMode) window.switchGameMode(gs.gameType);
    }
    if (gs.phase === 'finished' && window.state.phase === 'playing') {
      window.state.phase = 'finished';
      if (gs.gameType === 'blackjack' && window.blackjack && window.blackjack.renderResult) window.blackjack.renderResult(gs);
    }
    if (gs.phase === 'waiting' && (window.state.phase === 'playing' || window.state.phase === 'finished')) {
      window.state.phase = 'room';
      window.showRoom(window.state.roomCode);
    }
    // Mettre à jour la liste des joueurs dans la salle d'attente
    if (gs.phase === 'waiting') renderWaitingPlayers(gs);
    // Dispatch vers le renderer du mode de jeu actif
    const mode = window[gs.gameType];
    if (mode && mode.renderer) mode.renderer(gs);
  } catch (_) {}
};

// --- Événements lobby
function bindLobbyEvents() {
  window.dom['btn-create'].addEventListener('click', async () => {
    const name = window.dom['input-name'].value.trim() || 'Anonyme';
    const gameType = window.dom['input-game'] ? window.dom['input-game'].value : 'blackjack';
    console.log('[MuseTable] Création salle — gameType:', gameType, '— input-game DOM:', window.dom['input-game']);
    try {
      const createRes = await window.api('POST', '/api/create-room', { gameType });
      const joinRes = await window.api('POST', '/api/join-room', { roomCode: createRes.roomCode, playerName: name });
      window.state.playerId = joinRes.playerId;
      window.state.playerName = name;
      window.state.isSpectator = false;
      window.showRoom(createRes.roomCode);
    } catch (e) { window.showToast('Erreur : ' + e.message); }
  });

  window.dom['btn-join'].addEventListener('click', async () => {
    const code = window.dom['input-code'].value.trim();
    const name = window.dom['input-join-name'].value.trim() || 'Anonyme';
    if (code.length !== 4) return window.showToast('Code à 4 chiffres requis');
    try {
      const res = await window.api('POST', '/api/join-room', { roomCode: code, playerName: name });
      window.state.playerId = res.playerId;
      window.state.playerName = name;
      window.state.isSpectator = false;
      window.showRoom(code);
    } catch (e) { window.showToast('Erreur : ' + e.message); }
  });

  window.dom['btn-spectate'].addEventListener('click', () => {
    const code = prompt('Code de la salle (spectateur) :');
    if (code && code.length === 4) {
      window.state.roomCode = code;
      window.state.playerId = null;
      window.state.isSpectator = true;
      window.dom['screen-game'].classList.add('spectator');
      window.showScreen('screen-game');
      window.startPolling();
    }
  });
}

// --- Événements room
function bindRoomEvents() {
  window.dom['btn-start'].addEventListener('click', async () => {
    if (!window.state.roomCode) return;
    try { await window.api('POST', '/api/start-game', { roomCode: window.state.roomCode }); }
    catch (e) { window.showToast('Erreur : ' + e.message); }
  });

  window.dom['btn-leave'].addEventListener('click', async () => {
    if (window.state.roomCode) {
      try { await window.api('POST', '/api/leave-room', { roomCode: window.state.roomCode, playerId: window.state.playerId }); }
      catch (_) {}
    }
    window.stopPolling();
    window.showLobby();
  });
}

// --- Replay / Quitter
function bindResultEvents() {
  window.dom['btn-replay'].addEventListener('click', async () => {
    if (!window.state.roomCode) return;
    try {
      await window.api('POST', '/api/reset', { roomCode: window.state.roomCode });
      window.dom['result-overlay'].classList.remove('show');
      window.state.phase = 'room';
      window.showRoom(window.state.roomCode);
    } catch (e) { window.showToast('Erreur : ' + e.message); }
  });

  window.dom['btn-back-lobby'].addEventListener('click', window.showLobby);
}

// --- Plein écran
function bindFullscreen() {
  window.dom['btn-fullscreen'].addEventListener('click', () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  });
  document.addEventListener('fullscreenchange', () => {
    window.state.isFullscreen = !!document.fullscreenElement;
    window.dom['btn-fullscreen'].textContent = window.state.isFullscreen ? '✕' : '⛶';
  });
}

// --- Mode anonyme
function bindAnonyme() {
  window.dom['btn-anonyme'].addEventListener('click', () => {
    window.state.anonMode = !window.state.anonMode;
    window.dom['btn-anonyme'].classList.toggle('active');
  });
}

// --- Copie code
function bindCopy() {
  window.dom['room-code-display'].addEventListener('click', () => {
    if (window.state.roomCode) {
      navigator.clipboard.writeText(window.state.roomCode).catch(() => {});
      window.showToast('Code copié !');
    }
  });
  window.dom['game-code-badge'].addEventListener('click', () => {
    if (window.state.roomCode) {
      navigator.clipboard.writeText(window.state.roomCode).catch(() => {});
      window.showToast('Code copié !');
    }
  });
}

// --- Boutons de navigation jeu
function bindGameNavEvents() {
  window.dom['btn-back-menu'].addEventListener('click', () => {
    window.stopPolling();
    window.showLobby();
  });

  window.dom['btn-reset-session'].addEventListener('click', async () => {
    if (!window.state.roomCode) return;
    try {
      await window.api('POST', '/api/reset', { roomCode: window.state.roomCode });
      window.showToast('Session réinitialisée');
    } catch (e) { window.showToast('Erreur : ' + e.message); }
  });
}

// --- Enter key
function bindEnterKeys() {
  window.dom['input-name'].addEventListener('keydown', e => { if (e.key === 'Enter') window.dom['btn-create'].click(); });
  window.dom['input-code'].addEventListener('keydown', e => { if (e.key === 'Enter') window.dom['btn-join'].click(); });
  window.dom['input-join-name'].addEventListener('keydown', e => { if (e.key === 'Enter') window.dom['btn-join'].click(); });
}

// --- Init
initDom();
bindLobbyEvents();
bindRoomEvents();
bindResultEvents();
bindGameNavEvents();
bindFullscreen();
bindAnonyme();
bindCopy();
bindEnterKeys();
window.showLobby();
