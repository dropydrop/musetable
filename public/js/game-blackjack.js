/* game-blackjack.js — Rendu et contrôles du Blackjack */

window.blackjack = {};

window.blackjack.renderer = function(gs) {
  if (!gs) return;
  const phaseLabels = { waiting:'En attente', playing:'En cours', finished:'Manche terminée' };
  window.dom['phase-badge'].textContent = phaseLabels[gs.phase] || gs.phase;
  window.dom['game-type-badge'].textContent = window.getGameTypeLabel(gs.gameType);
  const rt = window.dom['room-game-type'];
  if (rt) rt.textContent = 'Jeu : ' + window.getGameTypeLabel(gs.gameType);

  const board = window.dom.board;
  board.innerHTML = '';
  const players = Object.entries(gs.players || {});

  for (const [id, p] of players) {
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

    const soldeMise = document.createElement('span');
    soldeMise.style.cssText = 'font-size:.75rem;color:var(--muted);margin-left:8px';
    const solde = p.solde !== undefined ? p.solde : '';
    const mise = p.mise !== undefined ? p.mise : '';
    if (solde !== '') soldeMise.textContent = '💰' + solde + (mise ? ' | Mise: ' + mise : '');

    const scoreSpan = document.createElement('span');
    scoreSpan.className = 'p-score';
    if (p.score > 0) {
      scoreSpan.textContent = p.score;
      if (p.score > 21) scoreSpan.classList.add('bust');
      else if (p.score === 21 && p.hand.length === 2) scoreSpan.classList.add('blackjack');
    }

    header.appendChild(nameSpan);
    header.appendChild(soldeMise);
    header.appendChild(scoreSpan);
    area.appendChild(header);

    if (gs.phase === 'playing' || gs.phase === 'finished') {
      const statusSpan = document.createElement('div');
      statusSpan.className = 'p-status';
      if (p.stand && p.score <= 21) statusSpan.textContent = '✓ Resté';
      else if (p.score > 21) statusSpan.textContent = '💥 Dépassé';
      else if (gs.currentTurn === id) statusSpan.textContent = '🎯 En train de jouer...';
      area.appendChild(statusSpan);
    }

    if (p.hand && p.hand.length > 0) {
      const cardsRow = document.createElement('div');
      cardsRow.className = 'cards-row ' + window.getCardLayout(p.hand);
      p.hand.forEach((card, i) => {
        const cardEl = window.createCardElement(card);
        cardEl.style.setProperty('--i', i);
        cardsRow.appendChild(cardEl);
      });
      area.appendChild(cardsRow);
    }

    if (gs.phase === 'finished') {
      if (p.resultat === 'gagné') {
        const winBadge = document.createElement('div');
        winBadge.style.cssText = 'margin-top:6px;font-weight:700;color:var(--gold);font-size:.9rem';
        winBadge.textContent = '🏆 Gagnant ! +' + (p.mise || 0);
        area.appendChild(winBadge);
      } else if (p.resultat === 'perdu') {
        const loseBadge = document.createElement('div');
        loseBadge.style.cssText = 'margin-top:6px;font-weight:700;color:var(--red);font-size:.9rem';
        loseBadge.textContent = p.score > 21 ? '💥 Dépassé -' + (p.mise || 0) : '💥 Perdant -' + (p.mise || 0);
        area.appendChild(loseBadge);
      }
    }

    board.appendChild(area);
  }

  const gsEl = window.dom['game-status'];
  if (gs.phase === 'playing') {
    if (gs.currentTurn) {
      const cur = gs.players[gs.currentTurn];
      if (cur) {
        const isMe = gs.currentTurn === window.state.playerId;
        gsEl.textContent = isMe ? "C'est à vous de jouer !" : cur.name + ' joue...';
      }
      gsEl.className = 'game-status';
    }
    updateBlackjackControls(gs);
  } else if (gs.phase === 'finished') {
    gsEl.className = 'game-status winner';
    const w = gs.winners ? gs.winners.join(', ') : '?';
    const isPush = gs.winners && gs.winners.length > 1 && gs.winners[0] !== 'Personne (tous ont dépassé 21)';
    gsEl.textContent = isPush ? '🤝 ' + w + ' — Égalité (push), pas de perte' : '🏆 ' + w + ' — Manche terminée';
    updateBlackjackControls(gs);
  } else if (gs.phase === 'waiting') {
    gsEl.className = 'game-status waiting';
    gsEl.textContent = 'En attente du lancement...';
  }
};

function updateBlackjackControls(gs) {
  const isMyTurn = gs.currentTurn === window.state.playerId;
  const isSpectator = window.state.isSpectator;

  if (isSpectator) {
    window.dom['screen-game'].classList.add('spectator');
    return;
  }
  window.dom['screen-game'].classList.remove('spectator');

  const bHit = window.dom['btn-hit'];
  const bDouble = window.dom['btn-double'];
  const bStand = window.dom['btn-stand'];
  const bRejouer = window.dom['btn-rejouer'];

  if (gs.phase === 'finished') {
    if (bHit) { bHit.disabled = true; bHit.style.display = 'none'; }
    if (bDouble) { bDouble.disabled = true; bDouble.style.display = 'none'; }
    if (bStand) { bStand.disabled = true; bStand.style.display = 'none'; }
    if (bRejouer) bRejouer.style.display = '';
    return;
  }

  if (bRejouer) bRejouer.style.display = 'none';
  if (bHit) { bHit.disabled = !isMyTurn; bHit.style.display = ''; }
  if (bStand) { bStand.disabled = !isMyTurn; bStand.style.display = ''; }
  if (bDouble) { bDouble.disabled = !isMyTurn; bDouble.style.display = ''; }

  const me = gs.players[window.state.playerId];
  if (bDouble) bDouble.disabled = !isMyTurn || !me || me.hand.length !== 2;

  if (me && me.score >= 21) {
    if (bHit) bHit.disabled = true;
    if (bDouble) bDouble.disabled = true;
  }
}

function setBlackjackControls() {
  window.dom.controls.innerHTML = '';
  const spec = [
    { id:'btn-hit', text:'HIT', cls:'btn-green' },
    { id:'btn-double', text:'DOUBLER', cls:'btn-gold' },
    { id:'btn-stand', text:'STAND', cls:'btn-red' },
    { id:'btn-rejouer', text:'🔄 Rejouer', cls:'btn-green' }
  ];
  spec.forEach(b => {
    const btn = document.createElement('button');
    btn.id = b.id;
    btn.className = b.cls;
    btn.textContent = b.text;
    window.dom[b.id] = btn;
    window.dom.controls.appendChild(btn);
  });

  window.dom['btn-hit'].addEventListener('click', async () => {
    if (!window.state.roomCode || !window.state.playerId) return;
    try { await window.api('POST', '/api/hit', { roomCode: window.state.roomCode, playerId: window.state.playerId }); }
    catch (e) { window.showToast('Erreur : ' + e.message); }
  });

  window.dom['btn-stand'].addEventListener('click', async () => {
    if (!window.state.roomCode || !window.state.playerId) return;
    try { await window.api('POST', '/api/stand', { roomCode: window.state.roomCode, playerId: window.state.playerId }); }
    catch (e) { window.showToast('Erreur : ' + e.message); }
  });

  window.dom['btn-double'].addEventListener('click', async () => {
    if (!window.state.roomCode || !window.state.playerId) return;
    try { await window.api('POST', '/api/double', { roomCode: window.state.roomCode, playerId: window.state.playerId }); }
    catch (e) { window.showToast('Erreur : ' + e.message); }
  });

  window.dom['btn-rejouer'].addEventListener('click', async () => {
    if (!window.state.roomCode) return;
    try { await window.api('POST', '/api/blackjack/redeal', { roomCode: window.state.roomCode }); }
    catch (e) { window.showToast('Erreur : ' + e.message); }
  });
}

window.blackjack.init = function() {
  setBlackjackControls();
};