/* game-blackjack.js — Rendu et contrôles du Blackjack */

window.blackjack = {};

window.blackjack.renderer = function(gs) {
  if (!gs) return;
  const phaseLabels = { waiting:'En attente', playing:'En cours', finished:'Terminée' };
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

    const scoreSpan = document.createElement('span');
    scoreSpan.className = 'p-score';
    if (p.score > 0) {
      scoreSpan.textContent = p.score;
      if (p.score > 21) scoreSpan.classList.add('bust');
      else if (p.score === 21 && p.hand.length === 2) scoreSpan.classList.add('blackjack');
    }

    header.appendChild(nameSpan);
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
      cardsRow.className = 'cards-row';
      for (const card of p.hand) cardsRow.appendChild(window.createCardElement(card));
      area.appendChild(cardsRow);
    }

    if (gs.phase === 'finished' && gs.winners && gs.winners.includes(p.name)) {
      const winBadge = document.createElement('div');
      winBadge.style.cssText = 'margin-top:6px;font-weight:700;color:var(--gold);font-size:.9rem';
      winBadge.textContent = '🏆 Gagnant !';
      area.appendChild(winBadge);
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
    gsEl.textContent = '🏆 ' + (gs.winners ? gs.winners.join(', ') : '?') + ' gagne !';
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

  if (window.state.phase === 'finished') {
    window.dom['btn-hit'].disabled = true;
    window.dom['btn-double'].disabled = true;
    window.dom['btn-stand'].disabled = true;
    return;
  }

  window.dom['btn-hit'].disabled = !isMyTurn;
  window.dom['btn-stand'].disabled = !isMyTurn;

  const me = gs.players[window.state.playerId];
  window.dom['btn-double'].disabled = !isMyTurn || !me || me.hand.length !== 2;

  if (me && me.score >= 21) {
    window.dom['btn-hit'].disabled = true;
    window.dom['btn-double'].disabled = true;
  }
}

window.blackjack.renderResult = function(gs) {
  window.dom['result-overlay'].classList.add('show');
  if (gs.winners) {
    if (gs.winners.length === 1 && gs.winners[0] === 'Personne (tous ont dépassé 21)') {
      window.dom['winner-text'].textContent = '💥 Tout le monde a dépassé 21 !';
    } else {
      window.dom['winner-text'].textContent = gs.winners.join(' & ');
    }
  }
  window.dom['result-scores'].innerHTML = '';
  if (gs.players) {
    for (const [, p] of Object.entries(gs.players)) {
      const span = document.createElement('span');
      const label = p.score > 21 ? '💥' : (p.score === 21 && p.hand && p.hand.length === 2 ? '🌟' : '');
      span.innerHTML = label + ' <b>' + p.name + '</b> : ' + p.score + ' pts';
      window.dom['result-scores'].appendChild(span);
    }
  }
};

window.blackjack.init = function() {
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
};
