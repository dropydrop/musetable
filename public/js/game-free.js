/* game-free.js — Rendu et contrôles du mode Libre */

// --- Helpers d'interactions tactiles
function addLongPress(el, onLongPress, onClick) {
  let timer = null;
  el.addEventListener('touchstart', (e) => {
    timer = setTimeout(() => {
      timer = null;
      e.preventDefault();
      onLongPress();
    }, 500);
  });
  el.addEventListener('touchend', () => {
    if (timer) { clearTimeout(timer); timer = null; }
  });
  el.addEventListener('touchmove', () => {
    if (timer) { clearTimeout(timer); timer = null; }
  });
  let pendingClick = false;
  el.addEventListener('click', (e) => {
    if (pendingClick) { pendingClick = false; return; }
    pendingClick = true;
    setTimeout(() => {
      if (pendingClick) { pendingClick = false; onClick(); }
    }, 300);
  });
  el.addEventListener('dblclick', (e) => {
    pendingClick = false;
    e.preventDefault();
    onLongPress();
  });
}

window.free = {};

window.free.renderer = function(gs) {
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
    cardsRow.className = 'cards-row ' + window.getCardLayout(gs.table);
    gs.table.forEach((card, i) => {
      const wrapper = document.createElement('div');
      if (!window.state.isSpectator) {
        wrapper.style.cursor = 'pointer';
        wrapper.title = 'Cliquer : reprendre · Double-clic : retourner';
        addLongPress(wrapper,
          () => window.free.flipCard(i),
          () => window.free.pickupCard(i)
        );
      }
      const cardEl = window.createCardElement(card, card.faceUp);
      cardEl.style.setProperty('--i', i);
      wrapper.appendChild(cardEl);
      cardsRow.appendChild(wrapper);
    });
    tableArea.appendChild(cardsRow);
    board.appendChild(tableArea);
  }

  // Résultats dés (sauté si une animation de lancer est active)
  if (!window._diceRolling.active && gs.lastDice && gs.lastDice.results) {
    const diceArea = document.createElement('div');
    diceArea.className = 'player-area';
    diceArea.style.borderColor = 'var(--green)';
    const dh = document.createElement('div');
    dh.className = 'p-header';
    const dl = document.createElement('span');
    dl.className = 'p-name';
    dl.textContent = '🎲 Dés';
    dh.appendChild(dl);
    diceArea.appendChild(dh);
    const diceRow = document.createElement('div');
    diceRow.className = 'cards-row';
    for (const val of gs.lastDice.results) {
      diceRow.appendChild(window.createDiceElement(val));
    }
    diceArea.appendChild(diceRow);
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
      cardsRow.className = 'cards-row ' + window.getCardLayout(p.hand);
      p.hand.forEach((card, i) => {
        const wrapper = document.createElement('div');
        if (id === myId && !window.state.isSpectator) {
          wrapper.style.cursor = 'pointer';
          wrapper.title = 'Clic : poser · Double-clic : retourner';
          addLongPress(wrapper,
            () => window.free.flipHandCard(i),
            () => window.free.playCard(i)
          );
        }
        const cardEl = window.createCardElement(card);
        cardEl.style.setProperty('--i', i);
        wrapper.appendChild(cardEl);
        cardsRow.appendChild(wrapper);
      });
      area.appendChild(cardsRow);
    }

    board.appendChild(area);
  }

  // Synchroniser l'affichage du count de dés
  const display = window.dom['dice-count-display'];
  if (display && gs.diceCount) {
    display.textContent = '🎲 x' + gs.diceCount;
  }

  window.dom['game-status'].textContent = 'Mode libre — manipulez cartes et dés';
  window.dom['game-status'].className = 'game-status waiting';
};

// --- Contrôles libres
function setFreeControls() {
  window.dom.controls.innerHTML = '';
  const btns = [
    { id:'btn-free-draw', text:'🃏 Joueur pioche 1', cls:'btn-primary', action: window.free.drawCards },
    { id:'btn-free-deal', text:'♠ Distribuer 1 chacun', cls:'btn-green', action: window.free.dealCards },
    { id:'btn-free-shuffle', text:'🔀 Mélanger le deck', cls:'btn-outline', action: window.free.shuffleDeck },
    { id:'btn-free-reset', text:'🔄 Reset tout', cls:'btn-outline', action: window.free.resetGame }
  ];
  btns.forEach(b => {
    const btn = document.createElement('button');
    btn.id = b.id;
    btn.className = b.cls;
    btn.textContent = b.text;
    btn.addEventListener('click', b.action);
    window.dom.controls.appendChild(btn);
  });

  // Contrôles dés : ➖ 🎲 xN ➕ 🎲 Lancer
  const diceRow = document.createElement('div');
  diceRow.style.cssText = 'display:flex;gap:8px;align-items:center';

  const minusBtn = document.createElement('button');
  minusBtn.textContent = '➖';
  minusBtn.className = 'btn-outline';
  minusBtn.addEventListener('click', () => window.free.setDiceCount(-1));

  const countDisplay = document.createElement('span');
  countDisplay.id = 'dice-count-display';
  countDisplay.textContent = '🎲 x1';
  countDisplay.style.cssText = 'font-weight:700;min-width:60px;text-align:center';

  const plusBtn = document.createElement('button');
  plusBtn.textContent = '➕';
  plusBtn.className = 'btn-outline';
  plusBtn.addEventListener('click', () => window.free.setDiceCount(1));

  const rollBtn = document.createElement('button');
  rollBtn.textContent = '🎲 Lancer';
  rollBtn.className = 'btn-gold';
  rollBtn.addEventListener('click', window.free.rollDice);

  diceRow.appendChild(minusBtn);
  diceRow.appendChild(countDisplay);
  diceRow.appendChild(plusBtn);
  diceRow.appendChild(rollBtn);
  window.dom.controls.appendChild(diceRow);
}

window.free.drawCards = async function() {
  if (!window.state.roomCode || !window.state.playerId) return;
  try {
    const res = await window.api('POST', '/api/free/draw', { roomCode: window.state.roomCode, playerId: window.state.playerId, count: 1 });
    window.showToast(res.cards.length + ' carte(s) piochée(s)');
  }
  catch (e) { window.showToast('Erreur : ' + e.message); }
};

window.free.dealCards = async function() {
  if (!window.state.roomCode) return;
  try {
    await window.api('POST', '/api/free/deal', { roomCode: window.state.roomCode, count: 1 });
    window.showToast('1 carte distribuée à chaque joueur');
  }
  catch (e) { window.showToast('Erreur : ' + e.message); }
};

window.free.rollDice = async function() {
  if (window._diceRolling.active) return;
  if (!window.state.roomCode) {
    window.showToast('Erreur : roomCode non défini');
    return;
  }
  console.log('[MuseTable] rollDice — roomCode:', window.state.roomCode, '→ POST /api/free/roll');
  try {
    const res = await window.api('POST', '/api/free/roll', { roomCode: window.state.roomCode });
    const results = res.results;
    const board = window.dom.board;
    const diceArea = document.createElement('div');
    diceArea.className = 'player-area dice-area';
    diceArea.style.borderColor = 'var(--green)';
    const dh = document.createElement('div');
    dh.className = 'p-header';
    const dl = document.createElement('span');
    dl.className = 'p-name';
    dl.textContent = '🎲 Dés';
    dh.appendChild(dl);
    diceArea.appendChild(dh);
    const diceRow = document.createElement('div');
    diceRow.className = 'cards-row dice-row';
    for (const val of results) {
      diceRow.appendChild(window.createDiceElement(val, true));
    }
    diceArea.appendChild(diceRow);
    board.appendChild(diceArea);
    window.startDiceRolling(results);
    window.showToast('🎲 Lancé !');
  }
  catch (e) { window.showToast('Erreur : ' + e.message); }
};

window.free.setDiceCount = async function(delta) {
  const display = document.getElementById('dice-count-display');
  const current = parseInt(display.textContent.replace('🎲 x', '')) || 1;
  const count = current + delta;
  if (count < 1 || count > 6) return;
  if (!window.state.roomCode) { window.showToast('Erreur : roomCode non défini'); return; }
  try {
    await window.api('POST', '/api/free/set-dice', {
      roomCode: window.state.roomCode,
      count
    });
    display.textContent = '🎲 x' + count;
  } catch (e) {
    window.showToast('Erreur : ' + e.message);
  }
};

window.free.shuffleDeck = async function() {
  if (!window.state.roomCode) return;
  try {
    await window.api('POST', '/api/free/shuffle', { roomCode: window.state.roomCode });
    window.showToast('Deck mélangé');
  }
  catch (e) { window.showToast('Erreur : ' + e.message); }
};

window.free.playCard = async function(cardIndex) {
  if (!window.state.roomCode || !window.state.playerId) return;
  try {
    await window.api('POST', '/api/free/play', { roomCode: window.state.roomCode, playerId: window.state.playerId, cardIndex });
    window.showToast('Carte posée');
  }
  catch (e) { window.showToast('Erreur : ' + e.message); }
};

window.free.flipCard = async function(cardIndex) {
  if (!window.state.roomCode) return;
  try {
    await window.api('POST', '/api/free/flip', { roomCode: window.state.roomCode, cardIndex });
    window.showToast('Carte retournée');
  }
  catch (e) { window.showToast('Erreur : ' + e.message); }
};

window.free.pickupCard = async function(cardIndex) {
  if (!window.state.roomCode || !window.state.playerId) return;
  try {
    await window.api('POST', '/api/free/pickup', { roomCode: window.state.roomCode, playerId: window.state.playerId, cardIndex });
    window.showToast('Carte reprise');
  }
  catch (e) { window.showToast('Erreur : ' + e.message); }
};

window.free.flipHandCard = async function(cardIndex) {
  if (!window.state.roomCode || !window.state.playerId) return;
  try {
    await window.api('POST', '/api/free/flip-hand', { roomCode: window.state.roomCode, playerId: window.state.playerId, cardIndex });
    window.showToast('Carte retournée');
  }
  catch (e) { window.showToast('Erreur : ' + e.message); }
};

window.free.resetGame = async function() {
  if (!window.state.roomCode) return;
  try {
    await window.api('POST', '/api/free/reset', { roomCode: window.state.roomCode });
    window.showToast('Table réinitialisée');
  }
  catch (e) { window.showToast('Erreur : ' + e.message); }
};

// Initialiser les contrôles libres (appelé par common.js au passage en jeu)
window.free.init = function() {
  setFreeControls();
};
