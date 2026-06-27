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
  if (gs.pyramide && gs.pyramide.length > 0 && gs.phase !== 'waiting') {
    const pBox = document.createElement('div');
    pBox.className = 'player-area';
    pBox.style.borderColor = 'var(--gold)';
    pBox.style.textAlign = 'center';

    const ph = document.createElement('div');
    ph.className = 'p-header';
    ph.textContent = '🔺 Pyramide';
    pBox.appendChild(ph);

    // 4 lignes : ligne 4 (1) en haut, ligne 1 (4) en bas
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
        const el = document.createElement('div');
        el.className = 'pyramide-card';
        const isActive = idx === gs.indexActif && gs.phase === 'playing';
        if (isActive) el.style.border = '3px solid var(--gold)';

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
        rDiv.appendChild(el);
      }
      container.appendChild(rDiv);
    }

    pBox.appendChild(container);

    // Légende multiplicateurs
    const legend = document.createElement('div');
    legend.style.cssText = 'font-size:.75rem;color:var(--muted);margin-top:6px';
    legend.textContent = 'Ligne 1: 🍺1 | Ligne 2: 🍺🍺2 | Ligne 3: 🍺🍺🍺3 | Ligne 4: 🍺🍺🍺🍺 Cul sec';
    pBox.appendChild(legend);

    board.appendChild(pBox);
  }

  // Phase distribution : afficher les mains face visible avec bouton distribuer
  if (gs.phase === 'distribution') {
    const distBox = document.createElement('div');
    distBox.className = 'player-area';
    distBox.style.borderColor = 'var(--green)';
    const dh = document.createElement('div');
    dh.className = 'p-header';
    dh.textContent = '📦 Distribution — Tour ' + ((gs.tourDistribution || 0) + 1) + '/4';
    distBox.appendChild(dh);

    if (gs.playerOrder) {
      for (const id of gs.playerOrder) {
        const p = gs.players[id];
        if (!p || !p.hand) continue;
        const tag = document.createElement('div');
        tag.style.cssText = 'font-size:.85rem;padding:2px 0';
        const name = gs.players[id] ? gs.players[id].name : id;
        tag.textContent = '👤 ' + name + ' : ' + p.hand.length + ' carte(s)';
        distBox.appendChild(tag);
      }
    }

    board.appendChild(distBox);
  }

  // Phase jeu : afficher les joueurs avec leurs mains face cachée
  if (gs.players) {
    for (const [id, p] of Object.entries(gs.players)) {
      if (gs.phase === 'distribution') {
        // Afficher les mains pendant la distribution
        if (p.hand && p.hand.length > 0) {
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
          area.appendChild(header);

          const cardsRow = document.createElement('div');
          cardsRow.className = 'cards-row ' + window.getCardLayout(p.hand);
          p.hand.forEach((card, i) => {
            const cardEl = window.createCardElement(card, false);
            cardEl.style.setProperty('--i', i);
            cardsRow.appendChild(cardEl);
          });
          area.appendChild(cardsRow);
          board.appendChild(area);
        }
      } else if (gs.phase === 'playing' || gs.phase === 'finished') {
        // En jeu : mains face cachée pour tout le monde
        if (p.hand && p.hand.length > 0 && id === window.state.playerId) {
          const area = document.createElement('div');
          area.className = 'player-area';
          area.classList.add('me');

          const header = document.createElement('div');
          header.className = 'p-header';
          const nameSpan = document.createElement('span');
          nameSpan.className = 'p-name';
          nameSpan.textContent = '👤 ' + p.name + ' (moi)';
          header.appendChild(nameSpan);

          const scoreSpan = document.createElement('span');
          scoreSpan.className = 'p-score';
          scoreSpan.textContent = p.score || 0;
          header.appendChild(scoreSpan);

          area.appendChild(header);

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
          board.appendChild(area);
        }

        // Afficher aussi les autres joueurs avec leur nom et score
        if (id !== window.state.playerId) {
          const area = document.createElement('div');
          area.className = 'player-area';
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
          board.appendChild(area);
        }
      }
    }
  }

  // Status
  if (gs.phase === 'distribution') {
    window.dom['game-status'].textContent = '📦 Distribution des cartes — Tour ' + ((gs.tourDistribution || 0) + 1) + '/4';
    window.dom['game-status'].className = 'game-status';
  } else if (gs.phase === 'playing') {
    window.dom['game-status'].textContent = '🔺 Retournez les cartes de la pyramide !';
    window.dom['game-status'].className = 'game-status';
  } else if (gs.phase === 'finished') {
    window.dom['game-status'].className = 'game-status winner';
    window.dom['game-status'].textContent = '🏁 Pyramide terminée !';
  } else {
    window.dom['game-status'].textContent = 'En attente...';
    window.dom['game-status'].className = 'game-status waiting';
  }
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

window.pyramide.distribuer = async function() {
  if (!window.state.roomCode) return;
  try {
    const res = await window.api('POST', '/api/pyramide/distrib', { roomCode: window.state.roomCode });
    if (res.gameState && res.gameState.phase === 'playing') {
      window.showToast('📦 Mémorisation terminée ! Cartes retournées.');
    } else {
      window.showToast('Carte distribuée');
    }
  } catch (e) { window.showToast('Erreur : ' + e.message); }
};