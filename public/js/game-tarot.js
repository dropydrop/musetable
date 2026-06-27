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

  // Vies
  if (gs.vies && Object.keys(gs.vies).length > 0) {
    const viesBox = document.createElement('div');
    viesBox.className = 'player-area';
    viesBox.style.borderColor = 'var(--gold)';
    const h = document.createElement('div');
    h.className = 'p-header';
    h.textContent = '❤️ Vies';
    viesBox.appendChild(h);
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:12px;flex-wrap:wrap';
    for (const [id, v] of Object.entries(gs.vies)) {
      const tag = document.createElement('span');
      tag.className = 'p-name';
      tag.textContent = (gs.players && gs.players[id] ? gs.players[id].name : id) + ' : ' + v;
      row.appendChild(tag);
    }
    viesBox.appendChild(row);
    board.appendChild(viesBox);
  }

  // Infos manche
  const info = document.createElement('div');
  info.className = 'player-area';
  const infoH = document.createElement('div');
  infoH.className = 'p-header';
  infoH.textContent = '📋 Manche — ' + (gs.cartesDistribuees || '?') + ' cartes/joueur';
  info.appendChild(infoH);

  if (gs.dealerIndex !== undefined && gs.joueurs) {
    const dealerName = gs.players && gs.players[gs.joueurs[gs.dealerIndex]] ?
      gs.players[gs.joueurs[gs.dealerIndex]].name : 'Joueur ' + (gs.dealerIndex + 1);
    const d = document.createElement('div');
    d.style.cssText = 'font-size:.85rem;color:var(--muted)';
    d.textContent = 'Donneur : ' + dealerName;
    info.appendChild(d);
  }
  board.appendChild(info);

  // Paris
  if (gs.paris && Object.keys(gs.paris).length > 0) {
    const parisBox = document.createElement('div');
    parisBox.className = 'player-area';
    parisBox.style.borderColor = 'var(--green)';
    const ph = document.createElement('div');
    ph.className = 'p-header';
    ph.textContent = '📊 Paris';
    parisBox.appendChild(ph);
    for (const [id, nb] of Object.entries(gs.paris)) {
      const tag = document.createElement('div');
      tag.style.cssText = 'font-size:.9rem';
      tag.textContent = (gs.players && gs.players[id] ? gs.players[id].name : id) + ' : ' + nb;
      parisBox.appendChild(tag);
    }
    board.appendChild(parisBox);
  }

  // Pli actuel
  if (gs.pliActuel && gs.pliActuel.length > 0) {
    const pliBox = document.createElement('div');
    pliBox.className = 'player-area';
    pliBox.style.borderColor = 'var(--gold)';
    const plh = document.createElement('div');
    plh.className = 'p-header';
    plh.textContent = '♠ Pli en cours';
    pliBox.appendChild(plh);
    const row = document.createElement('div');
    row.className = 'cards-row';
    for (const p of gs.pliActuel) {
      const cardEl = document.createElement('div');
      cardEl.className = 'card';
      const v = p.carte === 0 ? 'Excuse' : String(p.carte);
      const ev = p.excuseValue !== null ? ' (' + p.excuseValue + ')' : '';
      cardEl.textContent = v + ev;
      cardEl.style.cssText = 'width:64px;height:89px;border-radius:8px;background:#fff;color:#222;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.9rem';
      row.appendChild(cardEl);
    }
    pliBox.appendChild(row);
    board.appendChild(pliBox);
  }

  // Plis gagnés
  if (gs.plisGagnes && Object.keys(gs.plisGagnes).length > 0) {
    const gBox = document.createElement('div');
    gBox.className = 'player-area';
    const gh = document.createElement('div');
    gh.className = 'p-header';
    gh.textContent = '🏆 Plis gagnés';
    gBox.appendChild(gh);
    for (const [id, n] of Object.entries(gs.plisGagnes)) {
      const tag = document.createElement('div');
      tag.style.cssText = 'font-size:.9rem';
      const pname = gs.players && gs.players[id] ? gs.players[id].name : id;
      const pari = gs.paris && gs.paris[id] !== undefined ? ' (pari: ' + gs.paris[id] + ')' : '';
      tag.textContent = pname + ' : ' + n + '/ ' + (gs.cartesDistribuees || '?') + pari;
      gBox.appendChild(tag);
    }
    board.appendChild(gBox);
  }

  // Joueurs (mains)
  if (gs.players) {
    for (const [id, p] of Object.entries(gs.players)) {
      const area = document.createElement('div');
      area.className = 'player-area';
      if (id === window.state.playerId) area.classList.add('me');
      const header = document.createElement('div');
      header.className = 'p-header';
      const nameSpan = document.createElement('span');
      nameSpan.className = 'p-name';
      nameSpan.textContent = id === window.state.playerId ? '👤 ' + p.name + ' (moi)' : p.name;
      if (gs.joueurs && gs.dealerIndex !== undefined && gs.joueurs[gs.dealerIndex] === id) {
        nameSpan.textContent += ' 🎩';
      }
      header.appendChild(nameSpan);
      area.appendChild(header);

      if (p.hand && p.hand.length > 0 && id === window.state.playerId) {
        const cardsRow = document.createElement('div');
        cardsRow.className = 'cards-row ' + window.getCardLayout(p.hand);
        p.hand.forEach((carte, i) => {
          const val = carte === 0 ? 'Excuse' : String(carte);
          const el = document.createElement('div');
          el.className = 'card';
          el.textContent = val;
          el.style.cssText = 'width:64px;height:89px;border-radius:8px;background:#fff;color:#222;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.9rem';
          el.style.setProperty('--i', i);
          if (gs.phase === 'JEU') {
            el.style.cursor = 'pointer';
            el.addEventListener('click', () => window.tarot.playCard(i));
          }
          cardsRow.appendChild(el);
        });
        area.appendChild(cardsRow);
      }

      board.appendChild(area);
    }
  }

  window.dom['game-status'].textContent = 'Phase : ' + (gs.phase || 'En attente');
  window.dom['game-status'].className = 'game-status';
};

window.tarot.init = function() {
  setTarotControls();
};

function setTarotControls() {
  window.dom.controls.innerHTML = '';

  if (window.state.isSpectator) return;

  const bidRow = document.createElement('div');
  bidRow.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center';

  const bidLabel = document.createElement('span');
  bidLabel.textContent = 'Pari : ';
  bidLabel.style.fontWeight = '700';
  bidRow.appendChild(bidLabel);

  const bidInput = document.createElement('input');
  bidInput.type = 'number';
  bidInput.min = 0;
  bidInput.max = 5;
  bidInput.value = 0;
  bidInput.style.cssText = 'width:60px;padding:8px;text-align:center';
  bidInput.id = 'tarot-bid-input';
  bidRow.appendChild(bidInput);

  const bidBtn = document.createElement('button');
  bidBtn.className = 'btn-gold';
  bidBtn.textContent = 'Parier';
  bidBtn.addEventListener('click', () => {
    const nb = parseInt(document.getElementById('tarot-bid-input').value) || 0;
    window.tarot.placeBid(nb);
  });
  bidRow.appendChild(bidBtn);

  const resolveBtn = document.createElement('button');
  resolveBtn.className = 'btn-green';
  resolveBtn.textContent = 'Résoudre pli';
  resolveBtn.addEventListener('click', window.tarot.resolveTrick);
  bidRow.appendChild(resolveBtn);

  window.dom.controls.appendChild(bidRow);
}

window.tarot.placeBid = async function(nb) {
  if (!window.state.roomCode || !window.state.playerId) return;
  try {
    const res = await window.api('POST', '/api/tarot/bid', {
      roomCode: window.state.roomCode, playerId: window.state.playerId, nb
    });
    window.showToast('Pari placé : ' + nb);
  } catch (e) { window.showToast('Erreur : ' + e.message); }
};

window.tarot.playCard = async function(cardIndex) {
  if (!window.state.roomCode || !window.state.playerId) return;
  try {
    const res = await window.api('POST', '/api/tarot/play', {
      roomCode: window.state.roomCode, playerId: window.state.playerId, cardIndex
    });
    window.showToast('Carte jouée');
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
