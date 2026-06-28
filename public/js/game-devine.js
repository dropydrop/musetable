/* game-devine.js — Rendu et contrôles du jeu Devine Tête */

window.devine = {};

// Injection CSS spécifique au mode Devine Tête
const devineStyle = `
  .devine-header{display:flex;justify-content:space-around;padding:16px;background:var(--surface);font-size:1.2rem;font-weight:700}
  .devine-word{font-size:3.5rem;font-weight:900;text-align:center;letter-spacing:2px;color:var(--gold);text-shadow:0 0 30px rgba(245, 197, 24, 0.3);padding:40px 0}
  .devine-category{font-size:1rem;color:var(--muted);text-align:center;margin-bottom:8px}
  .devine-hint{text-align:center;color:var(--muted);font-size:.9rem;animation:pulse 2s infinite}
  @keyframes pulse {0%, 100%{opacity:0.5}50%{opacity:1}}
`;

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
    wordBox.style.cssText = 'border-color:var(--gold);padding:0';

    if (gs.phase === 'playing') {
      // Header
      wordBox.innerHTML = `
        <div class="devine-header">
          <span>⏱ <span id="devine-timer">${gs.timer || 0}</span>s</span>
          <span>✅ <span id="devine-score">${gs.score || 0}</span></span>
          <span>⏭️ <span id="devine-passes">${gs.passes || 0}</span></span>
        </div>
        <div class="devine-word">${gs.motCourant || '...'}</div>
        <div class="devine-hint">
          ⚡ Inclinez l'écran vers l'avant pour ✅ Trouvé<br>
          🔄 Inclinez vers l'arrière pour ⏭️ Passer
        </div>
      `;
    } else {
      // Finished
      wordBox.innerHTML = `<div class="devine-word">🏁 ${gs.score} pts</div>`;
    }

    board.appendChild(wordBox);
  }

  window.dom['game-status'].textContent = gs.phase === 'playing' ? '🤯 Devinez le mot !' : 'Terminé !';
  window.dom['game-status'].className = gs.phase === 'finished' ? 'game-status winner' : 'game-status';
};

window.devine.init = function() {
  if (!document.getElementById('devine-css')) {
    const style = document.createElement('style');
    style.id = 'devine-css';
    style.textContent = devineStyle;
    document.head.appendChild(style);
  }
  setDevineControls();
};

function showFeedback(type) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:50;transition:opacity 0.3s;background:${type === 'TROUVE' ? 'rgba(46,204,113,0.3)' : 'rgba(241,196,15,0.3)'}`;
  document.body.appendChild(overlay);
  setTimeout(() => { overlay.style.opacity = '0'; }, 300);
  setTimeout(() => overlay.remove(), 600);
}

function setDevineControls() {
  window.dom.controls.innerHTML = '';
  if (window.state.isSpectator) return;

  // Boutons de secours si pas d'accéléromètre
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:12px;justify-content:center;flex-wrap:wrap';

  const trouveBtn = document.createElement('button');
  trouveBtn.className = 'btn-green';
  trouveBtn.textContent = '✅ Trouvé';
  trouveBtn.addEventListener('click', () => window.devine.doAction('TROUVE'));
  row.appendChild(trouveBtn);

  const passeBtn = document.createElement('button');
  passeBtn.className = 'btn-red';
  passeBtn.textContent = '⏭️ Passer';
  passeBtn.addEventListener('click', () => window.devine.doAction('PASSE'));
  row.appendChild(passeBtn);

  window.dom.controls.appendChild(row);

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
  // Tilt forward (beta < 35) = TROUVE
  // Tilt backward (beta > 145) = PASSE
  if (beta < 35) {
    _devineLock = true;
    window.devine.doAction('TROUVE');
    setTimeout(() => { _devineLock = false; }, 1500);
  } else if (beta > 145) {
    _devineLock = true;
    window.devine.doAction('PASSE');
    setTimeout(() => { _devineLock = false; }, 1500);
  }
}

window.devine.doAction = async function(actionType) {
  if (!window.state.roomCode) return;
  showFeedback(actionType);
  try {
    await window.api('POST', '/api/devine/action', {
      roomCode: window.state.roomCode, actionType
    });
  } catch (e) { window.showToast('Erreur : ' + e.message); }
};
