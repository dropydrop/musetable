/* game-tarot.js — Rendu et contrôles du Tarot Africain */

window.tarot = {};

window.tarot.renderer = function(gs) {
  if (!gs) return;
  window.dom['phase-badge'].textContent = gs.phase || 'Tarot';
  window.dom['game-type-badge'].textContent = '🎴 Tarot Africain';
  const rt = window.dom['room-game-type'];
  if (rt) rt.textContent = 'Jeu : Tarot Africain';

  const board = window.dom.board;
  board.innerHTML = '';

  // === Vies + Infos manche ===
  if (gs.vies && Object.keys(gs.vies).length > 0) {
    const box = document.createElement('div');
    box.className = 'player-area';
    box.style.borderColor = 'var(--gold)';
    const h = document.createElement('div');
    h.className = 'p-header';
    h.textContent = '❤️ Vies  |  📋 ' + (gs.cartesDistribuees || '?') + ' cartes/joueur';
    box.appendChild(h);
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:12px;flex-wrap:wrap;padding:4px 0';
    for (const [id, v] of Object.entries(gs.vies)) {
      const tag = document.createElement('span');
      tag.className = 'p-name';
      const nom = gs.joueurs && gs.players && gs.players[id] ? gs.players[id].name : id;
      tag.textContent = nom + ' ❤️' + v;
      if (id === gs.joueurs?.[gs.dealerIndex]) tag.textContent += ' 🎩';
      row.appendChild(tag);
    }
    box.appendChild(row);
    board.appendChild(box);
  }

  // === Joueurs ===
  if (gs.joueurs) {
    for (const id of gs.joueurs) {
      const p = gs.players?.[id] || {};
      const main = gs.mains?.[id] || [];
      const area = document.createElement('div');
      area.className = 'player-area';
      if (id === window.state.playerId) area.classList.add('me');
      if (id === gs.joueurActif) area.style.borderColor = 'var(--gold)';

      const header = document.createElement('div');
      header.className = 'p-header';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'p-name';
      const nom = p.name || id;
      if (window.state.anonMode) {
        nameSpan.textContent = id === window.state.playerId ? '👤 Moi' : '👤 Joueur';
      } else {
        nameSpan.textContent = id === window.state.playerId ? '👤 ' + nom + ' (moi)' : nom;
      }
      if (id === gs.joueurs?.[gs.dealerIndex]) nameSpan.textContent += ' 🎩';
      if (id === gs.joueurActif) nameSpan.textContent += ' 🎯';
      header.appendChild(nameSpan);

      // Pari
      const pariSpan = document.createElement('span');
      pariSpan.style.cssText = 'font-size:.85rem;color:var(--muted);margin-left:8px';
      if (gs.paris && gs.paris[id] !== undefined && (gs.parisFaits?.[id] || gs.phase !== 'PARI')) {
        pariSpan.textContent = '🏷️ ' + gs.paris[id];
      } else if (gs.phase === 'PARI' && (!gs.parisFaits?.[id])) {
        pariSpan.textContent = '⏳ pari...';
      }
      header.appendChild(pariSpan);

      // Plis gagnés
      const plisSpan = document.createElement('span');
      plisSpan.style.cssText = 'font-size:.85rem;color:var(--gold);margin-left:8px';
      if (gs.plisGagnes?.[id] > 0) {
        plisSpan.textContent = '🏆 ' + gs.plisGagnes[id];
      }
      header.appendChild(plisSpan);

      area.appendChild(header);

      // Mains — visibles pour tout le monde (Tarot Africain = jeu ouvert)
      if (main.length > 0) {
        const cardsRow = document.createElement('div');
        cardsRow.className = 'cards-row ' + window.getCardLayout(main);
        main.forEach((carte, i) => {
          const cardObj = carte === 0 ? { value: '0', suit: 'EXCUSE' } : { value: String(carte), suit: 'TAROT' };
          const el = carte === 0
            ? window.createCardElement(cardObj, true)
            : (() => {
                const e = document.createElement('div');
                e.className = 'card';
                e.textContent = String(carte);
                e.style.cssText = 'width:48px;height:68px;border-radius:6px;background:#fff;color:#222;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.85rem';
                return e;
              })();
          el.style.setProperty('--i', i);
          if (gs.phase === 'JEU' && id === window.state.playerId && id === gs.joueurActif) {
            el.style.cursor = 'pointer';
            el.style.border = '2px solid var(--accent)';
            el.addEventListener('click', () => {
              if (carte === 0) {
                window.tarot.excuseCardIndex = i;
                setTarotExcuseControls(gs);
              } else {
                window.tarot.playCard(i);
              }
            });
          }
          cardsRow.appendChild(el);
        });
        area.appendChild(cardsRow);
      }

      board.appendChild(area);
    }
  }

  // === Pli actuel ===
  if (gs.pliActuel && gs.pliActuel.length > 0) {
    const pliBox = document.createElement('div');
    pliBox.className = 'player-area';
    pliBox.style.borderColor = 'var(--accent)';
    const plh = document.createElement('div');
    plh.className = 'p-header';
    plh.textContent = '♠ Pli en cours';
    pliBox.appendChild(plh);
    const row = document.createElement('div');
    row.className = 'cards-row';
    for (const coup of gs.pliActuel) {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px';
      const cardObj = coup.carte === 0
        ? { value: '0', suit: 'EXCUSE' }
        : { value: String(coup.carte), suit: 'TAROT' };
      let cardEl;
      if (coup.carte === 0) {
        cardEl = window.createCardElement(cardObj, true);
      } else {
        cardEl = document.createElement('div');
        cardEl.className = 'card';
        const ev = coup.excuseValue !== null && coup.excuseValue !== undefined ? ' (' + coup.excuseValue + ')' : '';
        cardEl.innerHTML = String(coup.carte) + (ev || '');
        cardEl.style.cssText = 'width:64px;height:89px;border-radius:8px;background:#fff;color:#222;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.9rem';
      }
      wrapper.appendChild(cardEl);
      const label = document.createElement('div');
      label.style.cssText = 'font-size:0.7rem;color:var(--muted);text-align:center';
      label.textContent = gs.players?.[coup.playerId]?.name || coup.playerId;
      wrapper.appendChild(label);
      row.appendChild(wrapper);
    }
    pliBox.appendChild(row);
    board.appendChild(pliBox);
  }

  // === Status ===
  const gsEl = window.dom['game-status'];
  if (gs.phase === 'PARI') {
    const actuel = gs.bidActuel;
    const isMe = actuel === window.state.playerId;
    const nom = actuel && gs.players?.[actuel]?.name || '?';
    gsEl.textContent = isMe ? '📊 À vous de parier !' : '📊 ' + nom + ' parie...';
    gsEl.className = 'game-status';
  } else if (gs.phase === 'JEU') {
    const actif = gs.joueurActif;
    const isMe = actif === window.state.playerId;
    const nom = actif && gs.players?.[actif]?.name || '?';
    gsEl.textContent = isMe ? '♠ À vous de jouer une carte !' : '♠ ' + nom + ' joue...';
    gsEl.className = 'game-status';
  } else if (gs.phase === 'SCORE') {
    gsEl.textContent = '📊 Résultats de la manche';
    gsEl.className = 'game-status winner';
  } else if (gs.phase === 'FINI') {
    const gagnant = gs.gagnant ? (gs.players?.[gs.gagnant]?.name || gs.gagnant) : '?';
    gsEl.textContent = '🏆 ' + gagnant + ' a gagné la partie !';
    gsEl.className = 'game-status winner';
  } else {
    gsEl.textContent = 'En attente...';
    gsEl.className = 'game-status waiting';
  }

  // Contrôles
  updateTarotControls(gs);
};

function updateTarotControls(gs) {
  if (window.state.isSpectator) {
    window.dom['screen-game'].classList.add('spectator');
    return;
  }
  window.dom['screen-game'].classList.remove('spectator');

  if (gs.phase === 'PARI') {
    setTarotBidControls(gs);
  } else if (gs.phase === 'JEU') {
    setTarotGameControls(gs);
  } else if (gs.phase === 'SCORE' || gs.phase === 'FINI') {
    setTarotScoreControls(gs);
  } else {
    setTarotEmptyControls();
  }
}

function setTarotBidControls(gs) {
  const controls = window.dom.controls;
  controls.innerHTML = '';

  const isMyTurn = gs.bidActuel === window.state.playerId;
  const maxBid = gs.cartesDistribuees || 5;

  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:center';

  const label = document.createElement('span');
  label.textContent = 'Pari : ';
  label.style.fontWeight = '700';
  row.appendChild(label);

  for (let i = 0; i <= maxBid; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = 'btn-outline';
    btn.style.cssText = 'min-width:40px;padding:10px 8px;font-weight:700';
    const isLast = gs.bidActuel === gs.joueurs?.[gs.dealerIndex];
    let disabled = !isMyTurn;
    if (isMyTurn && isLast && gs.interdit !== null && i === gs.interdit) {
      disabled = true;
      btn.style.textDecoration = 'line-through';
      btn.style.opacity = '0.4';
      btn.title = 'Valeur interdite (total = nb cartes)';
    }
    if (gs.parisFaits?.[window.state.playerId]) disabled = true;
    btn.disabled = disabled;
    if (!disabled) {
      btn.addEventListener('click', () => window.tarot.placeBid(i));
    }
    row.appendChild(btn);
  }

  controls.appendChild(row);
}

function setTarotGameControls(gs) {
  const controls = window.dom.controls;
  controls.innerHTML = '';

  // Si un choix de valeur Excuse est en attente
  if (window.tarot.excuseCardIndex !== null && window.tarot.excuseCardIndex !== undefined) {
    setTarotExcuseControls(gs);
    return;
  }

  const isMyTurn = gs.joueurActif === window.state.playerId;

  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center';

  if (isMyTurn) {
    const label = document.createElement('span');
    label.textContent = 'Cliquez sur une carte de votre main pour la jouer';
    label.style.cssText = 'font-size:.85rem;color:var(--muted)';
    row.appendChild(label);
  }

  controls.appendChild(row);
}

function setTarotExcuseControls(gs) {
  const controls = window.dom.controls;
  controls.innerHTML = '';

  const info = document.createElement('div');
  info.style.cssText = 'flex:1;text-align:center;font-weight:700;margin-bottom:8px';
  info.textContent = '🃏 Vous jouez l\'Excuse — Choisissez sa valeur';
  controls.appendChild(info);

  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:12px;justify-content:center;flex-wrap:wrap';

  const btn0 = document.createElement('button');
  btn0.className = 'btn-outline';
  btn0.textContent = '0 (plus petite)';
  btn0.addEventListener('click', () => {
    window.tarot.playCard(window.tarot.excuseCardIndex, 0);
    window.tarot.excuseCardIndex = null;
  });
  row.appendChild(btn0);

  const btn22 = document.createElement('button');
  btn22.className = 'btn-gold';
  btn22.textContent = '22 (plus forte)';
  btn22.addEventListener('click', () => {
    window.tarot.playCard(window.tarot.excuseCardIndex, 22);
    window.tarot.excuseCardIndex = null;
  });
  row.appendChild(btn22);

  controls.appendChild(row);
}

function setTarotScoreControls(gs) {
  const controls = window.dom.controls;
  controls.innerHTML = '';

  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center';

  if (gs.phase === 'SCORE') {
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn-gold';
    nextBtn.textContent = '🔄 Prochaine manche';
    nextBtn.addEventListener('click', async () => {
      if (!window.state.roomCode) return;
      try {
        await window.api('POST', '/api/start-game', { roomCode: window.state.roomCode });
      } catch (e) { window.showToast('Erreur : ' + e.message); }
    });
    row.appendChild(nextBtn);
  }

  if (gs.phase === 'FINI') {
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
  }

  controls.appendChild(row);
}

function setTarotEmptyControls() {
  window.dom.controls.innerHTML = '';
}

// --- INIT ---
window.tarot.init = function() {
  // Les contrôles sont gérés dynamiquement par updateTarotControls
};

// --- ACTIONS API ---
window.tarot.placeBid = async function(nb) {
  if (!window.state.roomCode || !window.state.playerId) return;
  try {
    const res = await window.api('POST', '/api/tarot/bid', {
      roomCode: window.state.roomCode, playerId: window.state.playerId, nb
    });
    window.showToast('Pari placé : ' + nb);
  } catch (e) { window.showToast('Erreur : ' + e.message); }
};

window.tarot.playCard = async function(cardIndex, excuseValue) {
  if (!window.state.roomCode || !window.state.playerId) return;
  try {
    const res = await window.api('POST', '/api/tarot/play', {
      roomCode: window.state.roomCode, playerId: window.state.playerId, cardIndex,
      excuseValue: excuseValue !== undefined ? excuseValue : undefined
    });
    const msg = res.gagnantPli ? '🏆 Pli remporté !' : 'Carte jouée';
    window.showToast(msg);
  } catch (e) { window.showToast('Erreur : ' + e.message); }
};

window.tarot.resolveTrick = async function() {
  if (!window.state.roomCode) return;
  try {
    const res = await window.api('POST', '/api/tarot/next-trick', { roomCode: window.state.roomCode });
    if (res.pliResolu) {
      window.showToast('Pli remporté par ' + (res.pliResolu.gagnant || '?'));
    }
  } catch (e) { window.showToast('Erreur : ' + e.message); }
};
