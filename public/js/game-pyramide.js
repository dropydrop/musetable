/* game-pyramide.js — Rendu et contrôles du jeu Pyramide */

window.pyramide = {};

window.pyramide.renderer = function(gs) {
  if (!gs) return;
  window.dom['phase-badge'].textContent = 'Pyramide';
  window.dom['game-type-badge'].textContent = '🔺 Pyramide';
  const rt = window.dom['room-game-type'];
  if (rt) rt.textContent = 'Jeu : Pyramide';

  const board = window.dom.board;
  board.innerHTML = '';

  // Pyramide
  if (gs.pyramide && gs.pyramide.length > 0) {
    const pBox = document.createElement('div');
    pBox.className = 'player-area';
    pBox.style.borderColor = 'var(--gold)';
    pBox.style.textAlign = 'center';

    const ph = document.createElement('div');
    ph.className = 'p-header';
    ph.textContent = '🔺 Pyramide';
    pBox.appendChild(ph);

    // Ligne 4 (1 carte)
    // Ligne 3 (2 cartes)
    // Ligne 2 (3 cartes)
    // Ligne 1 (4 cartes) — en bas
    const rows = [[9], [7, 8], [4, 5, 6], [0, 1, 2, 3]];
    for (const row of rows) {
      const rDiv = document.createElement('div');
      rDiv.style.cssText = 'display:flex;gap:4px;justify-content:center;margin:4px 0';
      for (const idx of row) {
        const card = gs.pyramide[idx];
        const el = document.createElement('div');
        el.className = 'card';
        if (card.faceUp) {
          el.textContent = card.value;
          const isRed = card.suit === 'H' || card.suit === 'D';
          el.style.cssText = 'width:48px;height:64px;border-radius:6px;background:#fff;' +
            'color:' + (isRed ? '#d32f2f' : '#222') + ';display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.9rem';
        } else {
          el.style.cssText = 'width:48px;height:64px;border-radius:6px;background:linear-gradient(135deg,#1a237e,#0d47a1);border:1px solid #fff';
          el.innerHTML = '<span style="opacity:0.25;font-size:1.2rem">?</span>';
        }
        if (idx === gs.indexActif && gs.phase === 'playing') {
          el.style.border = '3px solid var(--gold)';
        }
        rDiv.appendChild(el);
      }
      pBox.appendChild(rDiv);
    }

    // Légende multiplicateurs
    const legend = document.createElement('div');
    legend.style.cssText = 'font-size:.75rem;color:var(--muted);margin-top:8px';
    legend.textContent = 'Ligne 1: 🍺1 | Ligne 2: 🍺🍺2 | Ligne 3: 🍺🍺🍺3 | Ligne 4: 🍺🍺🍺🍺 Cul sec';
    pBox.appendChild(legend);

    board.appendChild(pBox);
  }

  // Joueurs
  if (gs.players) {
    for (const [id, p] of Object.entries(gs.players)) {
      const area = document.createElement('div');
      area.className = 'player-area';
      if (id === window.state.playerId) area.classList.add('me');
      if (id === gs.joueurActif) area.style.borderColor = 'var(--gold)';

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
      if (id === gs.joueurActif) nameSpan.textContent += ' 🎯';
      header.appendChild(nameSpan);

      const scoreSpan = document.createElement('span');
      scoreSpan.className = 'p-score';
      scoreSpan.textContent = p.score || 0;
      header.appendChild(scoreSpan);

      area.appendChild(header);

      if (p.hand && p.hand.length > 0 && id === window.state.playerId) {
        const cardsRow = document.createElement('div');
        cardsRow.className = 'cards-row ' + window.getCardLayout(p.hand);
        p.hand.forEach((card, i) => {
          const cardEl = document.createElement('div');
          cardEl.className = 'card';
          cardEl.style.cssText = 'width:64px;height:89px;border-radius:8px;background:linear-gradient(135deg,#1a237e,#0d47a1);border:2px solid #fff;display:flex;align-items:center;justify-content:center';
          cardEl.innerHTML = '<span style="opacity:0.4;letter-spacing:2px;color:#fff;font-size:1.2rem">?</span>';
          cardEl.style.setProperty('--i', i);
          cardsRow.appendChild(cardEl);
        });
        area.appendChild(cardsRow);
      }

      board.appendChild(area);
    }
  }

  window.dom['game-status'].textContent = gs.phase === 'playing' ? '🔺 Retournez les cartes de la pyramide !' : (gs.phase === 'finished' ? 'Pyramide terminée !' : 'En attente...');
  window.dom['game-status'].className = gs.phase === 'finished' ? 'game-status winner' : 'game-status';
};

window.pyramide.init = function() {
  setPyramideControls();
};

function setPyramideControls() {
  window.dom.controls.innerHTML = '';

  if (window.state.isSpectator) return;

  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:12px;justify-content:center;flex-wrap:wrap';

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

  window.dom.controls.appendChild(row);
}

window.pyramide.flipCard = async function() {
  if (!window.state.roomCode) return;
  try {
    const res = await window.api('POST', '/api/pyramide/flip', { roomCode: window.state.roomCode });
    const ligne = res.ligne || 1;
    const gorgées = ['🍺', '🍺🍺', '🍺🍺🍺', '🍺🍺🍺🍺'][ligne - 1] || '🍺';
    window.showToast('Carte retournée ! Ligne ' + ligne + ' : ' + gorgées);
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

window.pyramide.matchCard = async function(handIndex) {
  if (!window.state.roomCode || !window.state.playerId) return;
  try {
    const res = await window.api('POST', '/api/pyramide/match', {
      roomCode: window.state.roomCode, playerId: window.state.playerId, handIndex
    });
    window.showToast('✅ Carte matching trouvée !');
  } catch (e) { window.showToast('Erreur : ' + e.message); }
};
