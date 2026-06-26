/* game-free.js — Rendu et contrôles du mode Libre */

window.freeRenderer = function(gs) {
  if (!gs) return;
  window.dom['phase-badge'].textContent = 'Libre';
  window.dom['game-type-badge'].textContent = window.getGameTypeLabel(gs.gameType);
  const rt = window.dom['room-game-type'];
  if (rt) rt.textContent = 'Jeu : ' + window.getGameTypeLabel(gs.gameType);

  const board = window.dom.board;
  board.innerHTML = '';
  const players = Object.entries(gs.players || {});
  const myId = window.state.playerId;

  // Plateau (cartes posées)
  if (gs.table && gs.table.length > 0) {
    const tableArea = document.createElement('div');
    tableArea.className = 'player-area';
    tableArea.style.borderColor = 'var(--gold)';
    const th = document.createElement('div');
    th.className = 'p-header';
    const tl = document.createElement('span');
    tl.className = 'p-name';
    tl.textContent = '🎯 Plateau';
    th.appendChild(tl);
    tableArea.appendChild(th);

    const cardsRow = document.createElement('div');
    cardsRow.className = 'cards-row';
    gs.table.forEach((card, i) => {
      const wrapper = document.createElement('div');
      if (!window.state.isSpectator) {
        wrapper.style.cursor = 'pointer';
        wrapper.title = card.faceUp ? 'Cliquer : reprendre' : 'Cliquer : retourner';
        wrapper.addEventListener('click', () => {
          if (card.faceUp) pickupCard(i);
          else flipCard(i);
        });
      }
      wrapper.appendChild(window.createCardElement(card, card.faceUp));
      cardsRow.appendChild(wrapper);
    });
    tableArea.appendChild(cardsRow);
    board.appendChild(tableArea);
  }

  // Résultats dés
  if (gs.lastDice && gs.lastDice.results) {
    const diceArea = document.createElement('div');
    diceArea.className = 'player-area';
    diceArea.style.borderColor = 'var(--green)';
    const dh = document.createElement('div');
    dh.className = 'p-header';
    const dl = document.createElement('span');
    dl.className = 'p-name';
    dl.textContent = '🎲 Dés : ' + gs.lastDice.results.join(' · ');
    dh.appendChild(dl);
    diceArea.appendChild(dh);
    board.appendChild(diceArea);
  }

  // Joueurs
  for (const [id, p] of players) {
    const area = document.createElement('div');
    area.className = 'player-area';
    if (id === myId) area.classList.add('me');

    const header = document.createElement('div');
    header.className = 'p-header';
    const nameSpan = document.createElement('span');
    nameSpan.className = 'p-name';
    if (window.state.anonMode) {
      nameSpan.classList.add('anonyme');
      nameSpan.textContent = id === myId ? '👤 Moi' : '👤 Joueur';
    } else {
      nameSpan.textContent = id === myId ? '👤 ' + p.name + ' (moi)' : p.name;
    }
    nameSpan.style.fontSize = '1rem';
    header.appendChild(nameSpan);
    area.appendChild(header);

    if (p.hand && p.hand.length > 0) {
      const cardsRow = document.createElement('div');
      cardsRow.className = 'cards-row';
      p.hand.forEach((card, i) => {
        const wrapper = document.createElement('div');
        if (id === myId && !window.state.isSpectator) {
          wrapper.style.cursor = 'pointer';
          wrapper.title = 'Poser sur le plateau';
          wrapper.addEventListener('click', () => playCard(i));
        }
        wrapper.appendChild(window.createCardElement(card));
        cardsRow.appendChild(wrapper);
      });
      area.appendChild(cardsRow);
    }

    board.appendChild(area);
  }

  window.dom['game-status'].textContent = 'Mode libre — manipulez cartes et dés';
  window.dom['game-status'].className = 'game-status waiting';
};

// --- Contrôles libres
function setFreeControls() {
  window.dom.controls.innerHTML = '';
  const btns = [
    { id:'btn-free-draw', text:'🃏 Piocher', cls:'btn-primary', action: drawCards },
    { id:'btn-free-deal', text:'♠ Distribuer', cls:'btn-green', action: dealCards },
    { id:'btn-free-roll', text:'🎲 Dés', cls:'btn-gold', action: rollDice },
    { id:'btn-free-shuffle', text:'🔀 Mélanger', cls:'btn-outline', action: shuffleDeck }
  ];
  btns.forEach(b => {
    const btn = document.createElement('button');
    btn.id = b.id;
    btn.className = b.cls;
    btn.textContent = b.text;
    btn.addEventListener('click', b.action);
    window.dom.controls.appendChild(btn);
  });
}

async function drawCards() {
  if (!window.state.roomCode || !window.state.playerId) return;
  try { await window.api('POST', '/api/free/draw', { roomCode: window.state.roomCode, playerId: window.state.playerId, count: 1 }); }
  catch (e) { window.showToast('Erreur : ' + e.message); }
}

async function dealCards() {
  if (!window.state.roomCode) return;
  try { await window.api('POST', '/api/free/deal', { roomCode: window.state.roomCode, count: 2 }); }
  catch (e) { window.showToast('Erreur : ' + e.message); }
}

async function rollDice() {
  if (!window.state.roomCode) return;
  try { await window.api('POST', '/api/free/roll', { roomCode: window.state.roomCode, count: 2 }); }
  catch (e) { window.showToast('Erreur : ' + e.message); }
}

async function shuffleDeck() {
  if (!window.state.roomCode) return;
  try { await window.api('POST', '/api/free/shuffle', { roomCode: window.state.roomCode }); }
  catch (e) { window.showToast('Erreur : ' + e.message); }
}

async function playCard(cardIndex) {
  if (!window.state.roomCode || !window.state.playerId) return;
  try { await window.api('POST', '/api/free/play', { roomCode: window.state.roomCode, playerId: window.state.playerId, cardIndex }); }
  catch (e) { window.showToast('Erreur : ' + e.message); }
}

async function flipCard(cardIndex) {
  if (!window.state.roomCode) return;
  try { await window.api('POST', '/api/free/flip', { roomCode: window.state.roomCode, cardIndex }); }
  catch (e) { window.showToast('Erreur : ' + e.message); }
}

async function pickupCard(cardIndex) {
  if (!window.state.roomCode || !window.state.playerId) return;
  try { await window.api('POST', '/api/free/pickup', { roomCode: window.state.roomCode, playerId: window.state.playerId, cardIndex }); }
  catch (e) { window.showToast('Erreur : ' + e.message); }
}

// Initialiser les contrôles libres (appelé par common.js au passage en jeu)
window.freeInit = function() {
  setFreeControls();
};
