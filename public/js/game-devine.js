/* game-devine.js — Rendu et contrôles du jeu Devine Tête */

window.devine = {};

window.devine.renderer = function(gs) {
  if (!gs) return;
  window.dom['phase-badge'].textContent = 'Devine Tête';
  window.dom['game-type-badge'].textContent = '🤯 Devine Tête';
  const rt = window.dom['room-game-type'];
  if (rt) rt.textContent = 'Jeu : Devine Tête';

  const board = window.dom.board;
  board.innerHTML = '';

  if (gs.phase === 'playing' || gs.phase === 'finished') {
    const wordBox = document.createElement('div');
    wordBox.className = 'player-area';
    wordBox.style.cssText = 'border-color:var(--gold);text-align:center;padding:32px 16px';

    const progress = document.createElement('div');
    progress.style.cssText = 'font-size:.9rem;color:var(--muted);margin-bottom:12px';
    progress.textContent = (gs.indexActuel || 0) + ' / ' + (gs.totalMots || 0);
    wordBox.appendChild(progress);

    const timer = document.createElement('div');
    timer.style.cssText = 'font-size:1.2rem;font-weight:700;color:var(--gold);margin-bottom:16px';
    timer.id = 'devine-timer';
    timer.textContent = '⏱ ' + (gs.timer || 0) + 's';
    wordBox.appendChild(timer);

    if (gs.motCourant) {
      const mot = document.createElement('div');
      mot.style.cssText = 'font-size:2.5rem;font-weight:800;letter-spacing:2px;padding:20px 0';
      mot.textContent = gs.motCourant;
      wordBox.appendChild(mot);
    }

    const score = document.createElement('div');
    score.style.cssText = 'font-size:1.1rem;color:var(--green);margin-top:8px';
    score.textContent = '✅ ' + (gs.score || 0);
    wordBox.appendChild(score);

    board.appendChild(wordBox);

    // Historique (derniers mots)
    if (gs.historique && gs.historique.length > 0) {
      const hist = document.createElement('div');
      hist.className = 'player-area';
      const hh = document.createElement('div');
      hh.className = 'p-header';
      hh.textContent = '📜 Historique';
      hist.appendChild(hh);
      const last = gs.historique.slice(-5).reverse();
      for (const h of last) {
        const tag = document.createElement('div');
        tag.style.cssText = 'font-size:.85rem;padding:2px 0';
        tag.textContent = (h.resultat === 'TROUVÉ' ? '✅' : '⏭️') + ' ' + h.mot;
        hist.appendChild(tag);
      }
      board.appendChild(hist);
    }
  }

  if (gs.phase === 'finished') {
    const fin = document.createElement('div');
    fin.className = 'player-area';
    fin.style.cssText = 'border-color:var(--gold);text-align:center';
    const fh = document.createElement('div');
    fh.className = 'p-header';
    fh.textContent = '🏁 Partie terminée !';
    fin.appendChild(fh);
    const fs = document.createElement('div');
    fs.style.cssText = 'font-size:2rem;font-weight:800;color:var(--gold)';
    fs.textContent = 'Score : ' + (gs.score || 0);
    fin.appendChild(fs);
    board.appendChild(fin);
  }

  window.dom['game-status'].textContent = gs.phase === 'playing' ? '🤯 Devinez le mot !' : (gs.phase === 'finished' ? 'Terminé !' : 'En attente...');
  window.dom['game-status'].className = gs.phase === 'finished' ? 'game-status winner' : 'game-status';
};

window.devine.init = function() {
  setDevineControls();
};

function setDevineControls() {
  window.dom.controls.innerHTML = '';

  if (window.state.isSpectator) return;

  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:12px;justify-content:center;flex-wrap:wrap';

  const trouveBtn = document.createElement('button');
  trouveBtn.className = 'btn-green';
  trouveBtn.textContent = '✅ Trouvé !';
  trouveBtn.addEventListener('click', () => window.devine.doAction('TROUVE'));
  row.appendChild(trouveBtn);

  const passeBtn = document.createElement('button');
  passeBtn.className = 'btn-red';
  passeBtn.textContent = '⏭️ Passer';
  passeBtn.addEventListener('click', () => window.devine.doAction('PASSE'));
  row.appendChild(passeBtn);

  window.dom.controls.appendChild(row);

  // Détection accéléromètre
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', handleOrientation);
  }
}

let _devineLock = false;

function handleOrientation(e) {
  if (window.state.phase !== 'playing') return;
  if (_devineLock) return;
  const beta = e.beta;
  if (beta === null) return;
  if (beta < 45) {
    _devineLock = true;
    window.devine.doAction('TROUVE');
    setTimeout(() => { _devineLock = false; }, 1500);
  } else if (beta > 135) {
    _devineLock = true;
    window.devine.doAction('PASSE');
    setTimeout(() => { _devineLock = false; }, 1500);
  }
}

window.devine.doAction = async function(actionType) {
  if (!window.state.roomCode) return;
  try {
    const res = await window.api('POST', '/api/devine/action', {
      roomCode: window.state.roomCode, actionType
    });
    if (res.phase === 'finished') {
      window.showToast('Partie terminée ! Score : ' + res.score);
    }
  } catch (e) { window.showToast('Erreur : ' + e.message); }
};
