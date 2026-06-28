/* game-devine.js — Rendu et contrôles du jeu Devine Tête */

window.devine = {};

const devineStyle = `
  .devine-header{display:flex;justify-content:space-around;padding:16px;background:var(--surface);font-size:1.2rem;font-weight:700}
  .devine-word{font-size:3.5rem;font-weight:900;text-align:center;letter-spacing:2px;color:var(--gold);text-shadow:0 0 30px rgba(245,197,24,0.3);padding:40px 0}
  .devine-category{font-size:1rem;color:var(--muted);text-align:center;margin-bottom:8px}
  .devine-hint{text-align:center;color:var(--muted);font-size:.9rem;animation:pulse 2s infinite}
  .devine-start-info{text-align:center;color:var(--muted);font-size:.9rem;margin-bottom:16px}
  @keyframes pulse{0%,100%{opacity:0.5}50%{opacity:1}}
  .devine-progress{height:6px;background:#333;border-radius:3px;margin:12px 16px;overflow:hidden}
  .devine-progress-bar{height:100%;border-radius:3px;transition:width 0.3s,background 0.5s}
  .devine-config-row{display:flex;gap:8px;align-items:center;justify-content:center;margin:12px 0}
  .devine-config-row label{color:var(--muted);font-size:.85rem}
  .devine-config-row select{background:var(--card);color:var(--text);padding:8px 12px;border-radius:8px;font-size:.9rem;border:none;cursor:pointer}
`;

function injectDevineCSS() {
  if (!document.getElementById('devine-css')) {
    const s = document.createElement('style');
    s.id = 'devine-css';
    s.textContent = devineStyle;
    document.head.appendChild(s);
  }
}

let _devineTimerInterval = null;
let _devineTimerValue = 0;
let _devineLock = false;

// Poll immédiat après action pour fluidité
function pollNow() {
  setTimeout(window.pollGameState, 50);
}

// ============================================================
// RENDERER
// ============================================================

window.devine.renderer = function(gs) {
  console.log('[Devine] renderer called phase=%s motCourant=%s gameType=%s boardExiste=%s', gs?.phase, gs?.motCourant, gs?.gameType, !!window.dom.board);
  if (!gs) return;
  injectDevineCSS();

  window.dom['phase-badge'].textContent = 'Devine Tête';
  window.dom['game-type-badge'].textContent = '🤯 Devine Tête';
  const rt = window.dom['room-game-type'];
  if (rt) rt.textContent = 'Jeu : Devine Tête';

  const board = window.dom.board;
  board.innerHTML = '';

  const oldPhase = board.dataset.devinePhase;
  if (oldPhase !== gs.phase) {
    board.dataset.devinePhase = gs.phase;
    if (gs.phase === 'TURN_PLAYING') {
      _devineTimerValue = gs.timerRestant || 0;
      window._lastTimerTotal = gs.config.timerPerTour;
      startDevineTimer();
    } else {
      stopDevineTimer();
    }
  }

  const guesserLabel = gs.guesserName
    ? `<strong>${gs.guesserName}</strong>`
    : 'le joueur';

  switch (gs.phase) {

    // ==================== TURN_START ====================
    case 'TURN_START': {
      const el = document.createElement('div');
      el.className = 'player-area';
      el.style.cssText = 'border-color:var(--gold);text-align:center;padding:40px 16px';
      el.innerHTML = `
        <div style="font-size:1.5rem;margin-bottom:24px">🤯 Au tour de ${guesserLabel} !</div>
        ${devineConfigHTML(gs)}
        <button class="btn-gold" id="devine-btn-start" style="font-size:1.3rem;padding:16px 48px">
          🟢 Commencer
        </button>
      `;
      board.appendChild(el);
      break;
    }

    // ==================== TURN_PLAYING ====================
    case 'TURN_PLAYING': {
      if (gs.timerRestant !== undefined && gs.timerRestant < _devineTimerValue) {
        _devineTimerValue = gs.timerRestant;
      }

      const pct = gs.config.timerPerTour > 0
        ? Math.round((_devineTimerValue / gs.config.timerPerTour) * 100)
        : 100;
      const barColor = pct > 50 ? 'var(--green)' : pct > 25 ? 'orange' : 'var(--red)';

      const el = document.createElement('div');
      el.className = 'player-area';
      el.style.cssText = 'border-color:var(--gold);padding:0';

      el.innerHTML = `
        <div class="devine-header">
          <span>⏱ <span id="devine-timer">${_devineTimerValue}</span>s</span>
          <span>✅ <span id="devine-score">${gs.scores?.[gs.guesserId]?.trouve || 0}</span></span>
          <span>⏭️ <span id="devine-passes">${gs.scores?.[gs.guesserId]?.passe || 0}</span></span>
        </div>
        <div class="devine-progress">
          <div class="devine-progress-bar" style="width:${pct}%;background:${barColor}" id="devine-progress-bar"></div>
        </div>
        <div class="devine-word">${gs.motCourant || '...'}</div>
        <div class="devine-category">${gs.categorie || ''}</div>
        <div style="text-align:center;color:var(--muted);font-size:.85rem;margin-bottom:16px">
          ${gs.indexActuel} / ${gs.totalMots}
        </div>
        <div style="display:flex;gap:12px;justify-content:center;padding:0 16px 16px">
          <button class="btn-green" id="devine-btn-trouve" style="flex:1;max-width:160px;font-size:1rem">✅ Trouvé</button>
          <button class="btn-red" id="devine-btn-passe" style="flex:1;max-width:160px;font-size:1rem">⏭️ Passer</button>
        </div>
        <div class="devine-hint" style="padding-bottom:12px">
          ⚡ Inclinez avant pour Trouvé · arrière pour Passer
        </div>
      `;
      board.appendChild(el);
      break;
    }

    // ==================== TURN_DONE ====================
    case 'TURN_DONE': {
      const s = gs.scores?.[gs.guesserId] || {};
      const trouve = s.trouve || 0;
      const passe = s.passe || 0;
      const total = trouve + passe;

      const el = document.createElement('div');
      el.className = 'player-area';
      el.style.cssText = 'border-color:var(--gold);text-align:center;padding:40px 16px';
      el.innerHTML = `
        <div style="font-size:2rem;font-weight:800;margin-bottom:8px">✅ Tour terminé !</div>
        <div style="font-size:1.4rem;color:var(--green);margin-bottom:16px">
          ${guesserLabel} : ${trouve} / ${total}
        </div>
        <button class="btn-gold" id="devine-btn-next" style="font-size:1.1rem;padding:14px 36px">
          ⏭️ Joueur suivant
        </button>
      `;
      board.appendChild(el);
      break;
    }

    // ==================== ALL_DONE ====================
    case 'ALL_DONE': {
      const nbPlayers = gs.playerOrder?.length || 1;
      const isSolo = nbPlayers <= 1;

      const sorted = [];
      for (const id of gs.playerOrder || []) {
        const s = gs.scores?.[id];
        if (s) sorted.push({ id, name: gs.players?.[id]?.name || id, trouve: s.trouve || 0 });
      }
      sorted.sort((a, b) => b.trouve - a.trouve);

      let recordMsg = '';
      if (isSolo && sorted.length > 0) {
        const current = sorted[0].trouve;
        const stored = JSON.parse(localStorage.getItem('devine-record') || '{}');
        const oldRecord = stored.score || 0;
        if (current > oldRecord) {
          recordMsg = '<div style="color:var(--gold);font-size:1.2rem;margin-top:8px">🎉 Nouveau record personnel !</div>';
          localStorage.setItem('devine-record', JSON.stringify({ score: current, date: new Date().toISOString() }));
        } else if (oldRecord > 0) {
          recordMsg = `<div style="color:var(--muted);font-size:.95rem;margin-top:8px">Record : ${oldRecord} · Cette manche : ${current}</div>`;
        } else {
          localStorage.setItem('devine-record', JSON.stringify({ score: current, date: new Date().toISOString() }));
        }
      }

      let podiumHtml = '';
      const medals = ['🥇', '🥈', '🥉'];
      if (isSolo) {
        podiumHtml = sorted.map(p =>
          `<div style="font-size:1.2rem;font-weight:600;margin:8px 0">${p.name} : ${p.trouve} trouvé${p.trouve > 1 ? 's' : ''}</div>`
        ).join('');
      } else {
        podiumHtml = sorted.map((p, i) => {
          const medal = medals[i] || '';
          const highlight = i === 0 ? 'color:var(--gold);font-size:1.5rem' : 'font-size:1.1rem';
          return `<div style="${highlight};font-weight:700;margin:6px 0">${medal} ${p.name} : ${p.trouve}</div>`;
        }).join('');
      }

      const el = document.createElement('div');
      el.className = 'player-area';
      el.style.cssText = 'border-color:var(--gold);text-align:center;padding:40px 16px';
      el.innerHTML = `
        <div style="font-size:2rem;font-weight:800;margin-bottom:16px">🏆 Manche terminée !</div>
        ${podiumHtml}
        ${recordMsg}
        ${devineConfigHTML(gs)}
        <div style="margin-top:12px">
          <button class="btn-gold" id="devine-btn-replay" style="font-size:1.1rem;padding:14px 36px">
            🔄 Nouvelle manche
          </button>
        </div>
      `;
      board.appendChild(el);
      break;
    }

    default: {
      const el = document.createElement('div');
      el.className = 'player-area';
      el.style.cssText = 'text-align:center;padding:24px';
      el.textContent = 'En attente du début de la partie…';
      board.appendChild(el);
    }
  }

  window.dom['game-status'].textContent = gs.phase === 'TURN_PLAYING'
    ? '🤯 En cours' : gs.phase === 'ALL_DONE' ? 'Terminé !' : '';

  setDevineControls(gs);
  bindDevineConfig();
};

// HTML des sélecteurs de config timer/mots
function devineConfigHTML(gs) {
  const cur = window.state.devineConfig || gs.config || { timerPerTour: 45, motsParTour: 6 };
  const tOpts = [30, 45, 60].map(v =>
    `<option value="${v}"${v === cur.timerPerTour ? ' selected' : ''}>${v}s</option>`
  ).join('');
  const mOpts = [4, 6, 8, 10].map(v =>
    `<option value="${v}"${v === cur.motsParTour ? ' selected' : ''}>${v}</option>`
  ).join('');
  return `
    <div class="devine-config-row">
      <label>⏱</label>
      <select id="devine-cfg-timer">${tOpts}</select>
      <label>📝</label>
      <select id="devine-cfg-mots">${mOpts}</select>
    </div>
  `;
}

// Lier les changements de config → window.state.devineConfig
function bindDevineConfig() {
  const t = document.getElementById('devine-cfg-timer');
  const m = document.getElementById('devine-cfg-mots');
  if (t && m) {
    const update = () => {
      window.state.devineConfig = {
        timerPerTour: parseInt(t.value),
        motsParTour: parseInt(m.value)
      };
    };
    t.onchange = update;
    m.onchange = update;
    update();
  }
}

// ============================================================
// CONTROLS
// ============================================================

function setDevineControls(gs) {
  const c = window.dom.controls;
  c.innerHTML = '';
  if (window.state.isSpectator) return;

  const btnStart = document.getElementById('devine-btn-start');
  if (btnStart) { btnStart.addEventListener('click', () => window.devine.startTurn()); return; }

  const btnTrouve = document.getElementById('devine-btn-trouve');
  const btnPasse = document.getElementById('devine-btn-passe');
  if (btnTrouve && btnPasse) {
    btnTrouve.addEventListener('click', () => window.devine.doAction('TROUVE'));
    btnPasse.addEventListener('click', () => window.devine.doAction('PASSE'));
    return;
  }

  const btnNext = document.getElementById('devine-btn-next');
  if (btnNext) { btnNext.addEventListener('click', () => window.devine.nextTurn()); return; }

  const btnReplay = document.getElementById('devine-btn-replay');
  if (btnReplay) { btnReplay.addEventListener('click', () => window.devine.replay()); return; }
}

// ============================================================
// TIMER
// ============================================================

function startDevineTimer() {
  stopDevineTimer();
  _devineTimerInterval = setInterval(() => {
    _devineTimerValue = Math.max(0, _devineTimerValue - 1);
    const timerEl = document.getElementById('devine-timer');
    if (timerEl) timerEl.textContent = _devineTimerValue;
    const bar = document.getElementById('devine-progress-bar');
    if (bar) {
      const parent = bar.parentElement;
      const pct = Math.round((_devineTimerValue / window._lastTimerTotal) * 100);
      bar.style.width = pct + '%';
      bar.style.background = pct > 50 ? 'var(--green)' : pct > 25 ? 'orange' : 'var(--red)';
    }
    if (_devineTimerValue <= 0) {
      stopDevineTimer();
      window.devine.endTurn();
    }
  }, 1000);
  // Store total for bar updates
  window._lastTimerTotal = _devineTimerValue;
}

function stopDevineTimer() {
  if (_devineTimerInterval) {
    clearInterval(_devineTimerInterval);
    _devineTimerInterval = null;
  }
}

// ============================================================
// ACCÉLÉROMÈTRE
// ============================================================

function handleOrientation(e) {
  if (window.state.phase !== 'TURN_PLAYING') return;
  if (_devineLock) return;
  const beta = e.beta;
  if (beta === null) return;
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

// ============================================================
// API CALLS — chaque appel déclenche un poll immédiat
// ============================================================

window.devine.startTurn = async function() {
  if (!window.state.roomCode) return;
  try {
    await window.api('POST', '/api/devine/start-turn', { roomCode: window.state.roomCode });
    pollNow();
  } catch (e) { window.showToast('Erreur : ' + e.message); }
};

window.devine.doAction = async function(actionType) {
  if (!window.state.roomCode) return;
  showDevineFeedback(actionType);
  try {
    await window.api('POST', '/api/devine/action', {
      roomCode: window.state.roomCode, actionType
    });
    pollNow();
  } catch (e) { window.showToast('Erreur : ' + e.message); }
};

window.devine.endTurn = async function() {
  if (!window.state.roomCode) return;
  try {
    await window.api('POST', '/api/devine/end-turn', { roomCode: window.state.roomCode });
    pollNow();
  } catch (e) { /* ignore */ }
};

window.devine.nextTurn = async function() {
  if (!window.state.roomCode) return;
  try {
    await window.api('POST', '/api/devine/next-turn', { roomCode: window.state.roomCode });
    pollNow();
  } catch (e) { window.showToast('Erreur : ' + e.message); }
};

window.devine.replay = async function() {
  if (!window.state.roomCode) return;
  const cfg = window.state.devineConfig || { timerPerTour: 45, motsParTour: 6 };
  try {
    await window.api('POST', '/api/start-game', {
      roomCode: window.state.roomCode,
      timerPerTour: cfg.timerPerTour,
      motsParTour: cfg.motsParTour
    });
    pollNow();
  } catch (e) { window.showToast('Erreur : ' + e.message); }
};

function showDevineFeedback(type) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:50;transition:opacity 0.3s;background:${type === 'TROUVE' ? 'rgba(46,204,113,0.3)' : 'rgba(241,196,15,0.3)'}`;
  document.body.appendChild(overlay);
  setTimeout(() => { overlay.style.opacity = '0'; }, 300);
  setTimeout(() => overlay.remove(), 600);
}

// ============================================================
// INIT
// ============================================================

window.devine.init = function() {
  injectDevineCSS();
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', handleOrientation);
  }
};
