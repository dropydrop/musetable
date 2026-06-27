/* game-bizkit.js — Rendu et contrôles du mode Bizkit */

window.bizkitRenderer = function(gs) {
  if (!gs) return;
  const board = window.dom.board;
  board.innerHTML = '';

  // Zone des dés (plateau)
  if (gs.lastDice && gs.lastDice.results) {
    const diceArea = document.createElement('div');
    diceArea.className = 'player-area';
    diceArea.style.borderColor = 'var(--gold)';
    const dh = document.createElement('div');
    dh.className = 'p-header';
    const dl = document.createElement('span');
    dl.className = 'p-name';
    const playerName = gs.players[gs.lastDice.playerId]?.name || '?';
    dl.textContent = '🎲 ' + playerName;
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
  for (const [id, p] of Object.entries(gs.players)) {
    const area = document.createElement('div');
    area.className = 'player-area';
    const isCurrentTurn = id === gs.currentTurn;
    if (isCurrentTurn) area.style.borderColor = 'var(--gold)';
    if (id === window.state.playerId) area.classList.add('me');

    const header = document.createElement('div');
    header.className = 'p-header';
    const nameSpan = document.createElement('span');
    nameSpan.className = 'p-name';
    if (window.state.anonMode) {
      nameSpan.classList.add('anonyme');
      nameSpan.textContent = id === window.state.playerId ? '👤 Moi' : '👤 Joueur';
    } else {
      nameSpan.textContent = id === window.state.playerId ? '👤 ' + p.name + ' (moi)' : p.name;
    }
    if (isCurrentTurn) nameSpan.textContent += ' 🎯';
    header.appendChild(nameSpan);
    area.appendChild(header);

    board.appendChild(area);
  }

  window.dom['phase-badge'].textContent = 'Bizkit';
  window.dom['game-type-badge'].textContent = '🎲 Bizkit';

  const status = window.dom['game-status'];
  if (gs.currentTurn) {
    const isMe = gs.currentTurn === window.state.playerId;
    if (isMe) {
      status.textContent = '🎯 À vous de jouer ! Lancez les dés.';
    } else {
      const player = gs.players[gs.currentTurn];
      status.textContent = '⏳ ' + (player?.name || '?') + ' lance les dés...';
    }
    status.className = 'game-status';
  } else {
    status.textContent = 'En attente...';
    status.className = 'game-status waiting';
  }
};

window.bizkitInit = function() {
  setBizkitControls();
};

function setBizkitControls() {
  const controls = window.dom.controls;
  controls.innerHTML = '';

  const rollBtn = document.createElement('button');
  rollBtn.className = 'btn-gold';
  rollBtn.id = 'btn-bizkit-roll';
  rollBtn.textContent = '🎲 Lancer';
  rollBtn.addEventListener('click', bizkitRollDice);
  controls.appendChild(rollBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn-green';
  nextBtn.id = 'btn-bizkit-next';
  nextBtn.textContent = '⏭️ Joueur suivant';
  nextBtn.disabled = true;
  nextBtn.addEventListener('click', nextTurn);
  controls.appendChild(nextBtn);

  window._bizkitNextBtn = nextBtn;
}

async function bizkitRollDice() {
  if (!window.state.roomCode || !window.state.playerId) return;
  try {
    const res = await window.api('POST', '/api/bizkit/roll', {
      roomCode: window.state.roomCode,
      playerId: window.state.playerId
    });
    const btn = window._bizkitNextBtn;
    if (btn) {
      btn.disabled = false;
      btn.textContent = '⏭️ Joueur suivant';
    }
    window.showToast('🎲 Lancé en cours...');
  } catch (e) {
    window.showToast('Erreur : ' + e.message);
  }
}

async function nextTurn() {
  if (!window.state.roomCode) return;
  try {
    await window.api('POST', '/api/bizkit/next', {
      roomCode: window.state.roomCode
    });
    const btn = window._bizkitNextBtn;
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏭️ Joueur suivant';
    }
  } catch (e) {
    window.showToast('Erreur : ' + e.message);
  }
}
