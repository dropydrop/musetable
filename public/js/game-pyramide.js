/* game-pyramide.js — Rendu et contrôles du jeu Pyramide */

window.pyramide = {};

function getPyramideInfos(index) {
  if (index <= 3) return { ligne: 1, gorgees: 1, position: index };
  if (index <= 6) return { ligne: 2, gorgees: 2, position: index - 4 };
  if (index <= 8) return { ligne: 3, gorgees: 3, position: index - 7 };
  return { ligne: 4, gorgees: 4, position: 0 };
}

window.pyramide.renderer = function(gs) {
  if (!gs) return;

  const phaseLabels = { waiting:'En attente', distribution:'Distribution', jeu:'En cours', finished:'Terminée' };
  window.dom['phase-badge'].textContent = phaseLabels[gs.phase] || gs.phase;
  window.dom['game-type-badge'].textContent = '🔺 Pyramide';
  const rt = window.dom['room-game-type'];
  if (rt) rt.textContent = 'Jeu : Pyramide';

  const board = window.dom.board;
  board.innerHTML = '';

  // === 1. Joueurs + leurs mains ===
  if (gs.players) {
    for (const [id, p] of Object.entries(gs.players)) {
      if (!p.hand || p.hand.length === 0) continue;

      const area = document.createElement('div');
      area.className = 'player-area';
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
      header.appendChild(nameSpan);

      if (gs.phase === 'jeu' || gs.phase === 'finished') {
        const scoreSpan = document.createElement('span');
        scoreSpan.className = 'p-score';
        scoreSpan.textContent = p.score || 0;
        header.appendChild(scoreSpan);
      }

      area.appendChild(header);

      const cardsRow = document.createElement('div');
      cardsRow.className = 'cards-row ' + window.getCardLayout(p.hand);
      p.hand.forEach((card, i) => {
        const faceDown = gs.phase === 'jeu' || gs.phase === 'finished' || gs.phase === 'waiting';
        const cardEl = window.createCardElement(card, !faceDown);
        cardEl.style.setProperty('--i', i);
        cardsRow.appendChild(cardEl);
      });
      area.appendChild(cardsRow);
      board.appendChild(area);
    }
  }

  // === 2. Phase distribution : info + barre de progression ===
  if (gs.phase === 'distribution') {
    const distBox = document.createElement('div');
    distBox.className = 'player-area';
    distBox.style.borderColor = 'var(--green)';

    const dh = document.createElement('div');
    dh.className = 'p-header';
    const tourDisplay = Math.min(gs.tourDistribution + 1, 4);
    dh.textContent = '📦 Distribution — Tour ' + tourDisplay + '/4';
    if (gs.joueurDistribution) dh.textContent += ' — ' + gs.joueurDistribution;
    distBox.appendChild(dh);

    // Barre de progression
    const totalCartes = (gs.playerOrder || []).length * 4;
    const cartesDist = (gs.playerOrder || []).reduce((s, id) => {
      const p = gs.players[id];
      return s + (p && p.hand ? p.hand.length : 0);
    }, 0);
    const pct = Math.round((cartesDist / totalCartes) * 100);

    const barOuter = document.createElement('div');
    barOuter.style.cssText = 'height:12px;background:var(--surface);border-radius:6px;overflow:hidden;margin:6px 0';
    const barInner = document.createElement('div');
    barInner.style.cssText = 'height:100%;background:var(--green);width:' + pct + '%;transition:width .3s';
    barOuter.appendChild(barInner);
    distBox.appendChild(barOuter);

    const countLabel = document.createElement('div');
    countLabel.style.cssText = 'font-size:.8rem;color:var(--muted);text-align:center';
    countLabel.textContent = cartesDist + '/' + totalCartes + ' cartes distribuées';
    distBox.appendChild(countLabel);

    board.appendChild(distBox);
  }

  // === 3. Pyramide (phase jeu) ===
  if (gs.phase === 'jeu' || gs.phase === 'finished') {
    const pBox = document.createElement('div');
    pBox.className = 'player-area';
    pBox.style.borderColor = 'var(--gold)';
    pBox.style.textAlign = 'center';

    const ph = document.createElement('div');
    ph.className = 'p-header';
    ph.textContent = '🔺 Pyramide';
    pBox.appendChild(ph);

    const rows = [
      { indices: [9], ligne: 4 },
      { indices: [7, 8], ligne: 3 },
      { indices: [4, 5, 6], ligne: 2 },
      { indices: [0, 1, 2, 3], ligne: 1 }
    ];

    const container = document.createElement('div');
    container.style.cssText = 'display:flex;flex-direction:column-reverse;align-items:center;gap:6px;padding:8px 0';

    for (const row of rows) {
      const rDiv = document.createElement('div');
      rDiv.style.cssText = 'display:flex;gap:4px;justify-content:center';
      for (const idx of row.indices) {
        const card = gs.pyramide[idx];
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'position:relative';

        const el = document.createElement('div');
        el.className = 'pyramide-card';
        const isActive = idx === gs.indexActif && gs.phase === 'jeu';
        if (isActive) el.style.border = '3px solid var(--gold)';

        const infos = getPyramideInfos(idx);
        wrapper.title = 'Ligne ' + infos.ligne + ' — ' + infos.gorgees + ' gorgée' + (infos.gorgees > 1 ? 's' : '');

        if (card.faceUp) {
          const isRed = card.suit === 'H' || card.suit === 'D';
          el.style.background = '#fff';
          el.style.color = isRed ? '#d32f2f' : '#222';
          el.innerHTML = '<span class="pv">' + card.value + '</span><span class="ps">' +
            ({ S:'♠', H:'♥', D:'♦', C:'♣' }[card.suit] || '') + '</span>';
        } else {
          el.style.background = 'linear-gradient(135deg,#1a237e,#0d47a1)';
          el.style.border = '1px solid #fff';
          el.style.color = '#fff';
          el.innerHTML = '<span class="pv" style="opacity:0.4">?</span>';
        }
        wrapper.appendChild(el);
        rDiv.appendChild(wrapper);
      }
      container.appendChild(rDiv);
    }

    pBox.appendChild(container);

    const legend = document.createElement('div');
    legend.style.cssText = 'font-size:.75rem;color:var(--muted);margin-top:6px';
    legend.textContent = 'Ligne 1: 🍺1 | Ligne 2: 🍺🍺2 | Ligne 3: 🍺🍺🍺3 | Ligne 4: 🍺🍺🍺🍺 Cul sec';
    pBox.appendChild(legend);

    board.appendChild(pBox);
  }

  // === Status ===
  const gsEl = window.dom['game-status'];
  if (gs.phase === 'distribution') {
    const complete = gs.tourDistribution >= 4;
    gsEl.textContent = complete
      ? '🧠 Toutes les cartes sont distribuées ! Mémorisez et cliquez sur "Mémoriser"'
      : '📦 Distribution des cartes — Tour ' + (Math.min(gs.tourDistribution + 1, 4)) + '/4';
    gsEl.className = 'game-status';
  } else if (gs.phase === 'jeu') {
    gsEl.textContent = '🔺 Retournez les cartes de la pyramide !';
    gsEl.className = 'game-status';
  } else if (gs.phase === 'finished') {
    gsEl.className = 'game-status winner';
    gsEl.textContent = '🏁 Pyramide terminée !';
  } else {
    gsEl.textContent = 'En attente...';
    gsEl.className = 'game-status waiting';
  }

  updatePyramideControls(gs);
};

function updatePyramideControls(gs) {
  if (window.state.isSpectator) {
    window.dom['screen-game'].classList.add('spectator');
    return;
  }
  window.dom['screen-game'].classList.remove('spectator');

  const controls = window.dom.controls;
  controls.innerHTML = '';

  if (gs.phase === 'distribution') {
    setPyramideDistributionControls(gs);
  } else if (gs.phase === 'jeu') {
    setPyramideGameControls(gs);
  } else if (gs.phase === 'finished') {
    setPyramideFinishedControls();
  }
}

function setPyramideDistributionControls(gs) {
  const controls = window.dom.controls;
  const complete = gs.tourDistribution >= 4;

  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:12px;justify-content:center;flex-wrap:wrap;align-items:center';

  const info = document.createElement('div');
  info.style.cssText = 'flex:1;text-align:center;font-weight:700';
  const tourDisplay = Math.min(gs.tourDistribution + 1, 4);
  info.textContent = complete
    ? '🧠 Toutes les cartes sont visibles — Mémorisez !'
    : '📤 Distribution — Tour ' + tourDisplay + '/4 — ' + (gs.joueurDistribution || '');
  row.appendChild(info);

  const btn = document.createElement('button');
  if (complete) {
    btn.className = 'btn-gold';
    btn.textContent = '🧠 Mémoriser';
    btn.addEventListener('click', window.pyramide.memoriser);
  } else {
    btn.className = 'btn-green';
    btn.textContent = '📤 Distribuer';
    btn.addEventListener('click', window.pyramide.distribuer);
  }
  row.appendChild(btn);

  controls.appendChild(row);
}

function setPyramideGameControls(gs) {
  const controls = window.dom.controls;

  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:12px;justify-content:center;flex-wrap:wrap;align-items:center';

  const infos = getPyramideInfos(gs.indexActif);
  const info = document.createElement('div');
  info.style.cssText = 'flex:1;text-align:center;font-weight:700';
  info.textContent = '🃏 Carte ' + (gs.indexActif + 1) + '/10 — Ligne ' + infos.ligne + ' — ' +
    infos.gorgees + ' gorgée' + (infos.gorgees > 1 ? 's' : '');
  row.appendChild(info);

  const flipBtn = document.createElement('button');
  flipBtn.className = 'btn-gold';
  flipBtn.textContent = '🃏 Retourner';
  flipBtn.addEventListener('click', window.pyramide.flipCard);
  row.appendChild(flipBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn-green';
  nextBtn.textContent = '⏭️ Suivant';
  nextBtn.addEventListener('click', window.pyramide.nextCard);
  row.appendChild(nextBtn);

  controls.appendChild(row);
}

function setPyramideFinishedControls() {
  const controls = window.dom.controls;

  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:12px;justify-content:center;flex-wrap:wrap';

  const replayBtn = document.createElement('button');
  replayBtn.className = 'btn-green';
  replayBtn.textContent = '🔄 Nouvelle partie';
  replayBtn.addEventListener('click', async () => {
    if (!window.state.roomCode) return;
    try {
      await window.api('POST', '/api/reset', { roomCode: window.state.roomCode });
    } catch (e) { window.showToast('Erreur : ' + e.message); }
  });
  row.appendChild(replayBtn);

  controls.appendChild(row);
}

// --- INIT ---
window.pyramide.init = function() {
  // Controls are dynamic via updatePyramideControls
};

// --- ACTIONS API ---

window.pyramide.distribuer = async function() {
  if (!window.state.roomCode) return;
  try {
    const res = await window.api('POST', '/api/pyramide/distribuer', { roomCode: window.state.roomCode });
    window.showToast('Carte distribuée');
  } catch (e) { window.showToast('Erreur : ' + e.message); }
};

window.pyramide.memoriser = async function() {
  if (!window.state.roomCode) return;
  try {
    const res = await window.api('POST', '/api/pyramide/memoriser', { roomCode: window.state.roomCode });
    window.showToast('🧠 Cartes mémorisées !');
  } catch (e) { window.showToast('Erreur : ' + e.message); }
};

window.pyramide.flipCard = async function() {
  if (!window.state.roomCode) return;
  try {
    const res = await window.api('POST', '/api/pyramide/flip', { roomCode: window.state.roomCode });
    const gorgees = ['🍺', '🍺🍺', '🍺🍺🍺', '🍺🍺🍺🍺'][(res.ligne || 1) - 1] || '🍺';
    window.showToast('Carte retournée ! Ligne ' + res.ligne + ' : ' + gorgees);
  } catch (e) { window.showToast('Erreur : ' + e.message); }
};

window.pyramide.nextCard = async function() {
  if (!window.state.roomCode) return;
  try {
    const res = await window.api('POST', '/api/pyramide/next', { roomCode: window.state.roomCode });
    if (res.phase === 'finished') {
      window.showToast('🏁 Pyramide terminée !');
    } else {
      window.showToast('Carte suivante — ligne ' + (res.ligne || '?'));
    }
  } catch (e) { window.showToast('Erreur : ' + e.message); }
};
