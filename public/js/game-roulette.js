/* game-roulette.js — Roulette de Casino Solo (client-side) */

window.roulette = {};

// ===================== CONSTANTES =====================
const ROUGE_NUMS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const DOUZAINES = { '1':[1,12], '2':[13,24], '3':[25,36] };
const START_BALANCE = 1000;
const HIST_WINDOW = 7;

function rColor(n) {
  if (n === 0) return 'vert';
  return ROUGE_NUMS.has(n) ? 'rouge' : 'noir';
}

function rColorCSS(n) {
  if (n === 0) return '#2ecc71';
  return ROUGE_NUMS.has(n) ? '#e74c3c' : '#1a1a2e';
}

function rGain(type, val, mise, n) {
  if (type === '1') return n === val ? mise * 35 : -mise;
  if (n === 0) return -mise;
  if (type === '2') return rColor(n) === val ? mise : -mise;
  if (type === '3') return n % 2 === val ? mise : -mise;
  if (type === '4') {
    const [lo, hi] = DOUZAINES[val] || [0,0];
    return n >= lo && n <= hi ? mise * 2 : -mise;
  }
  return -mise;
}

function rTrend(type, val, hist) {
  const recent = hist.slice(-HIST_WINDOW);
  let tot = 0, hits = 0;
  for (const h of recent) {
    if (h.n === 0) continue;
    tot++;
    if (type === '1' && h.n === val) hits++;
    else if (type === '2' && h.c === val) hits++;
    else if (type === '3' && h.n % 2 === val) hits++;
    else if (type === '4') {
      const [lo, hi] = DOUZAINES[val] || [0,0];
      if (h.n >= lo && h.n <= hi) hits++;
    }
  }
  return tot === 0 ? null : Math.round(hits / tot * 100);
}

const THEO_PROBA = { '1': 1/37*100, '2': 18/37*100, '3': 18/37*100, '4': 12/37*100 };

// ===================== STATE =====================
function initState() {
  const saved = localStorage.getItem('roulette-state');
  if (saved) {
    try {
      const s = JSON.parse(saved);
      if (s && typeof s.balance === 'number') {
        window.roulette.state = s;
        return;
      }
    } catch (_) {}
  }
  window.roulette.state = {
    balance: START_BALANCE,
    startBalance: START_BALANCE,
    totalSpins: 0,
    history: [],
    phase: 'betting_phase',
    lastResult: null,
    betType: '2',
    betValue: 'rouge',
    betAmount: 10
  };
}

function saveState() {
  try { localStorage.setItem('roulette-state', JSON.stringify(window.roulette.state)); } catch (_) {}
}

// ===================== CSS =====================
const rStyle = `
.roulette-dash{display:flex;justify-content:space-around;padding:12px;background:var(--surface);border-radius:12px;margin-bottom:12px;font-size:.9rem}
.roulette-dash div{text-align:center}
.roulette-dash-label{color:var(--muted);font-size:.75rem}
.roulette-dash-val{font-weight:700;font-size:1.2rem}
.roulette-section{margin-bottom:16px}
.roulette-section-title{font-size:.85rem;color:var(--muted);margin-bottom:6px;font-weight:600}
.roulette-bet-types{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.roulette-bet-type-btn{padding:10px;border-radius:8px;border:2px solid transparent;background:var(--card);color:var(--text);font-size:.85rem;cursor:pointer;transition:all .15s;text-align:center}
.roulette-bet-type-btn.active{border-color:var(--gold);background:rgba(245,197,24,.15);color:var(--gold);font-weight:700}
.roulette-bet-type-btn:active{transform:scale(.96)}
.roulette-value-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(44px,1fr));gap:4px}
.roulette-value-btn{padding:8px 4px;border-radius:6px;border:2px solid transparent;font-size:.85rem;cursor:pointer;text-align:center;font-weight:600;transition:all .1s}
.roulette-value-btn.active{border-color:var(--gold);box-shadow:0 0 8px rgba(245,197,24,.3)}
.roulette-value-btn:active{transform:scale(.92)}
.roulette-value-btn.vert{background:#1a3a2a;color:#2ecc71}
.roulette-value-btn.rouge{background:#3a1a1a;color:#e74c3c}
.roulette-value-btn.noir{background:#1a1a2e;color:#ecf0f1}
.roulette-chips{display:flex;gap:6px;flex-wrap:wrap}
.roulette-chip-btn{padding:8px 14px;border-radius:20px;border:2px solid var(--gold);background:transparent;color:var(--gold);font-weight:700;font-size:.9rem;cursor:pointer;transition:all .1s}
.roulette-chip-btn.active{background:var(--gold);color:#1a1a2e}
.roulette-chip-btn:active{transform:scale(.9)}
.roulette-spin-wrap{text-align:center;margin:16px 0}
.roulette-spin-btn{font-size:1.4rem;padding:16px 48px;border-radius:50px;background:linear-gradient(135deg,var(--gold),#c9a000);color:#1a1a2e;border:none;font-weight:800;cursor:pointer;transition:all .15s;box-shadow:0 4px 20px rgba(245,197,24,.3)}
.roulette-spin-btn:active{transform:scale(.95)}
.roulette-spin-btn:disabled{opacity:.4;cursor:not-allowed;transform:none}
.roulette-spin-btn.spinning{animation:pulse-gold .5s infinite}
@keyframes pulse-gold{0%,100%{box-shadow:0 0 10px rgba(245,197,24,.3)}50%{box-shadow:0 0 30px rgba(245,197,24,.6)}}
.roulette-result-wrap{background:var(--surface);border-radius:12px;padding:16px;text-align:center;margin-bottom:12px}
.roulette-result-num{font-size:4rem;font-weight:900;line-height:1.2;margin:8px 0;text-shadow:0 0 30px currentColor;opacity:0;transform:scale(0);transition:all .4s cubic-bezier(.34,1.56,.64,1)}
.roulette-result-num.show{opacity:1;transform:scale(1)}
.roulette-result-label{font-size:.85rem;color:var(--muted)}
.roulette-result-gain{font-size:1.3rem;font-weight:700;margin-top:4px}
.roulette-result-gain.pos{color:var(--green)}
.roulette-result-gain.neg{color:var(--red)}
.roulette-trend{padding:8px 12px;background:var(--card);border-radius:8px;font-size:.85rem;color:var(--muted);text-align:center;margin-bottom:12px}
.roulette-hist-line{font-family:monospace;font-size:.8rem;line-height:1.6;word-break:break-all;margin-bottom:8px}
.roulette-hist-num{display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;border-radius:50%;margin:1px;font-size:.7rem;font-weight:700}
.roulette-hist-num.vert{background:#1a3a2a;color:#2ecc71}
.roulette-hist-num.rouge{background:#3a1a1a;color:#e74c3c}
.roulette-hist-num.noir{background:#1a1a2e;color:#ecf0f1}
.roulette-ctrl-row{display:flex;gap:8px;justify-content:center;margin-top:12px}
.roulette-ctrl-row button{flex:1;max-width:160px}
.roulette-number-input{display:flex;align-items:center;justify-content:center;gap:12px;margin:8px 0}
.roulette-number-input button{width:44px;height:44px;border-radius:50%;border:2px solid var(--gold);background:transparent;color:var(--gold);font-size:1.3rem;cursor:pointer;font-weight:700}
.roulette-number-input button:active{background:var(--gold);color:#1a1a2e}
.roulette-number-input .num-display{font-size:2rem;font-weight:900;min-width:60px;text-align:center;padding:8px 16px;border-radius:8px}
`;

function injectRCSS() {
  if (!document.getElementById('roulette-css')) {
    const s = document.createElement('style');
    s.id = 'roulette-css';
    s.textContent = rStyle;
    document.head.appendChild(s);
  }
}

// ===================== RENDERER =====================
window.roulette.renderer = function(gs) {
  if (!gs) return;
  window.roulette.lastGs = gs;
  injectRCSS();
  const st = window.roulette.state;
  if (!st) { initState(); return; }

  window.dom['phase-badge'].textContent = 'Roulette';
  window.dom['game-type-badge'].textContent = '🎡 Roulette Solo';
  const rt = window.dom['room-game-type'];
  if (rt) rt.textContent = 'Jeu : Roulette Solo';

  const board = window.dom.board;
  board.innerHTML = '';
  board.style.padding = '12px';

  renderDash(board, st);
  renderBetArea(board, st);
  renderSpinBtn(board, st);
  renderResult(board, st);
  renderTrend(board, st);
  renderHistory(board, st);
  renderControls(board, st);

  window.dom['game-status'].textContent = st.phase === 'spinning' ? '🎡 Tirage en cours…' : st.phase === 'game_over' ? '💀 Game Over' : '🎡 Placez votre pari';
  window.dom['game-status'].className = 'game-status ' + (st.phase === 'game_over' ? 'lost' : 'waiting');
};

window.roulette.rerender = function() {
  if (window.roulette.lastGs) window.roulette.renderer(window.roulette.lastGs);
};

function renderDash(board, st) {
  const d = document.createElement('div');
  d.className = 'roulette-dash';
  d.innerHTML = `
    <div><div class="roulette-dash-label">💰 Solde</div><div class="roulette-dash-val" id="r-balance">${st.balance}€</div></div>
    <div><div class="roulette-dash-label">💸 Départ</div><div class="roulette-dash-val">${st.startBalance}€</div></div>
    <div><div class="roulette-dash-label">🎡 Tirages</div><div class="roulette-dash-val">${st.totalSpins}</div></div>
  `;
  board.appendChild(d);
}

function renderBetArea(board, st) {
  if (st.phase === 'game_over') return;
  const sec = document.createElement('div');
  sec.className = 'roulette-section';

  const title = document.createElement('div');
  title.className = 'roulette-section-title';
  title.textContent = '🎯 Type de pari';
  sec.appendChild(title);

  const types = document.createElement('div');
  types.className = 'roulette-bet-types';

  const opts = [
    { v:'2', l:'Couleur' },
    { v:'3', l:'Pair/Impair' },
    { v:'4', l:'Douzaine' },
    { v:'1', l:'Numéro exact' }
  ];
  for (const o of opts) {
    const btn = document.createElement('button');
    btn.className = 'roulette-bet-type-btn' + (st.betType === o.v ? ' active' : '');
    btn.textContent = o.l;
    btn.addEventListener('click', () => { window.roulette.setBetType(o.v); });
    types.appendChild(btn);
  }
  sec.appendChild(types);
  board.appendChild(sec);

  // Valeur du pari
  const vsec = document.createElement('div');
  vsec.className = 'roulette-section';

  const vtitle = document.createElement('div');
  vtitle.className = 'roulette-section-title';
  vtitle.textContent = 'Valeur du pari';
  vsec.appendChild(vtitle);

  if (st.betType === '2') {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:flex;gap:8px';
    for (const { v, l, cls } of [{ v:'rouge', l:'🔴 Rouge', cls:'rouge' }, { v:'noir', l:'⚫ Noir', cls:'noir' }]) {
      const btn = document.createElement('button');
      btn.className = 'roulette-value-btn ' + cls + (st.betValue === v ? ' active' : '');
      btn.textContent = l;
      btn.style.flex = '1';
      btn.style.padding = '14px';
      btn.style.fontSize = '1rem';
      btn.addEventListener('click', () => { window.roulette.setBetValue(v); });
      grid.appendChild(btn);
    }
    vsec.appendChild(grid);
  } else if (st.betType === '3') {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:flex;gap:8px';
    for (const { v, l } of [{ v:0, l:'✅ Pair' }, { v:1, l:'🔲 Impair' }]) {
      const btn = document.createElement('button');
      btn.className = 'roulette-value-btn' + (st.betValue === v ? ' active' : '');
      btn.textContent = l;
      btn.style.flex = '1';
      btn.style.padding = '14px';
      btn.style.fontSize = '1rem';
      btn.addEventListener('click', () => { window.roulette.setBetValue(v); });
      grid.appendChild(btn);
    }
    vsec.appendChild(grid);
  } else if (st.betType === '4') {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:flex;gap:6px';
    for (const [k, [lo, hi]] of Object.entries(DOUZAINES)) {
      const btn = document.createElement('button');
      btn.className = 'roulette-value-btn' + (st.betValue === k ? ' active' : '');
      btn.textContent = `${lo}-${hi}`;
      btn.style.flex = '1';
      btn.style.padding = '14px';
      btn.style.fontSize = '.9rem';
      btn.addEventListener('click', () => { window.roulette.setBetValue(k); });
      grid.appendChild(btn);
    }
    vsec.appendChild(grid);
  } else if (st.betType === '1') {
    const wrap = document.createElement('div');
    wrap.className = 'roulette-number-input';
    const sub = document.createElement('button');
    sub.textContent = '−';
    sub.addEventListener('click', () => {
      let v = typeof st.betValue === 'number' ? st.betValue : 17;
      v = Math.max(0, v - 1);
      window.roulette.setBetValue(v);
    });
    const disp = document.createElement('div');
    disp.className = 'num-display';
    const v = typeof st.betValue === 'number' ? st.betValue : 17;
    disp.textContent = v;
    disp.style.background = rColorCSS(v);
    disp.style.color = v === 0 ? '#2ecc71' : '#ecf0f1';
    const add = document.createElement('button');
    add.textContent = '+';
    add.addEventListener('click', () => {
      let v = typeof st.betValue === 'number' ? st.betValue : 17;
      v = Math.min(36, v + 1);
      window.roulette.setBetValue(v);
    });
    wrap.appendChild(sub);
    wrap.appendChild(disp);
    wrap.appendChild(add);
    vsec.appendChild(wrap);
  }

  board.appendChild(vsec);

  // Théorique
  const theo = document.createElement('div');
  theo.style.cssText = 'font-size:.75rem;color:var(--muted);text-align:center;margin-bottom:12px';
  theo.textContent = `Chance théorique : ${THEO_PROBA[st.betType].toFixed(1)}%`;
  board.appendChild(theo);

  // Mise
  const msec = document.createElement('div');
  msec.className = 'roulette-section';
  const mtitle = document.createElement('div');
  mtitle.className = 'roulette-section-title';
  mtitle.textContent = '💰 Mise';
  msec.appendChild(mtitle);

  const chips = document.createElement('div');
  chips.className = 'roulette-chips';
  const chipVals = [1, 5, 10, 25, 50, 100];
  for (const cv of chipVals) {
    const btn = document.createElement('button');
    btn.className = 'roulette-chip-btn' + (st.betAmount === cv ? ' active' : '');
    btn.textContent = cv + '€';
    btn.addEventListener('click', () => { window.roulette.setBetAmount(cv); });
    chips.appendChild(btn);
  }
  msec.appendChild(chips);

  // Mise personnalisée via input range
  const rangeRow = document.createElement('div');
  rangeRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:6px';
  const range = document.createElement('input');
  range.type = 'range';
  range.min = '1';
  range.max = String(st.balance);
  range.value = String(Math.min(st.betAmount, st.balance));
  range.style.flex = '1';
  range.style.accentColor = 'var(--gold)';
  range.addEventListener('input', () => {
    window.roulette.setBetAmount(parseInt(range.value) || 1);
  });
  const rangeVal = document.createElement('span');
  rangeVal.style.cssText = 'font-weight:700;min-width:50px;text-align:center';
  rangeVal.textContent = Math.min(st.betAmount, st.balance) + '€';
  rangeRow.appendChild(range);
  rangeRow.appendChild(rangeVal);
  msec.appendChild(rangeRow);

  board.appendChild(msec);
}

function renderSpinBtn(board, st) {
  if (st.phase === 'game_over') return;
  const wrap = document.createElement('div');
  wrap.className = 'roulette-spin-wrap';
  const btn = document.createElement('button');
  btn.className = 'roulette-spin-btn' + (st.phase === 'spinning' ? ' spinning' : '');
  btn.id = 'r-spin-btn';
  btn.textContent = st.phase === 'spinning' ? '🎡 ...' : '🎡 LANCER';
  btn.disabled = st.phase === 'spinning' || st.balance <= 0 || st.betAmount <= 0 || st.betAmount > st.balance;
  btn.addEventListener('click', window.roulette.spin);
  wrap.appendChild(btn);
  board.appendChild(wrap);
}

function renderResult(board, st) {
  if (!st.lastResult) return;
  const r = st.lastResult;
  const wrap = document.createElement('div');
  wrap.className = 'roulette-result-wrap';

  const num = document.createElement('div');
  num.className = 'roulette-result-num show';
  num.textContent = r.n;
  num.style.color = rColorCSS(r.n);

  const colorLabel = document.createElement('div');
  colorLabel.className = 'roulette-result-label';
  colorLabel.textContent = r.c === 'vert' ? '🟢 Vert (0)' : r.c === 'rouge' ? '🔴 Rouge' : '⚫ Noir';

  const gain = document.createElement('div');
  gain.className = 'roulette-result-gain ' + (r.gain >= 0 ? 'pos' : 'neg');
  gain.textContent = r.gain >= 0 ? `+${r.gain}€` : `${r.gain}€`;

  wrap.appendChild(num);
  wrap.appendChild(colorLabel);
  wrap.appendChild(gain);
  board.appendChild(wrap);
}

function renderTrend(board, st) {
  if (st.history.length === 0) return;
  const t = rTrend(st.betType, st.betValue, st.history);
  const el = document.createElement('div');
  el.className = 'roulette-trend';
  el.textContent = t !== null
    ? `📊 Tendance (${HIST_WINDOW} derniers) : ${t}% de réussite`
    : '📊 Données insuffisantes pour la tendance';
  board.appendChild(el);
}

function renderHistory(board, st) {
  if (st.history.length === 0) return;
  const sec = document.createElement('div');
  sec.className = 'roulette-section';

  const title = document.createElement('div');
  title.className = 'roulette-section-title';
  title.textContent = `📜 Historique (${st.history.length} tirages)`;
  sec.appendChild(title);

  // Ligne compacte des 25 derniers
  const line = document.createElement('div');
  line.className = 'roulette-hist-line';
  const recent = st.history.slice(-25);
  for (const h of recent) {
    const span = document.createElement('span');
    span.className = 'roulette-hist-num ' + h.c;
    span.textContent = h.n;
    line.appendChild(span);
  }
  sec.appendChild(line);

  board.appendChild(sec);
}

function renderControls(board, st) {
  const row = document.createElement('div');
  row.className = 'roulette-ctrl-row';

  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn-outline';
  resetBtn.textContent = '🔄 Réinitialiser';
  resetBtn.addEventListener('click', window.roulette.reset);

  const clearBtn = document.createElement('button');
  clearBtn.className = 'btn-outline';
  clearBtn.textContent = '🧹 Effacer historique';
  clearBtn.addEventListener('click', window.roulette.clearHistory);

  row.appendChild(resetBtn);
  row.appendChild(clearBtn);
  board.appendChild(row);
}

// ===================== ACTIONS =====================
window.roulette.setBetType = function(v) {
  const st = window.roulette.state;
  if (st.phase !== 'betting_phase') return;
  st.betType = v;
  if (v === '1') st.betValue = 17;
  else if (v === '2') st.betValue = 'rouge';
  else if (v === '3') st.betValue = 0;
  else if (v === '4') st.betValue = '2';
  saveState();
  window.roulette.rerender();
};

window.roulette.setBetValue = function(v) {
  const st = window.roulette.state;
  if (st.phase !== 'betting_phase') return;
  st.betValue = v;
  saveState();
  window.roulette.rerender();
};

window.roulette.setBetAmount = function(v) {
  const st = window.roulette.state;
  if (st.phase !== 'betting_phase') return;
  st.betAmount = Math.min(v, st.balance);
  saveState();
  window.roulette.rerender();
};

window.roulette.spin = function() {
  const st = window.roulette.state;
  if (st.phase !== 'betting_phase' || st.balance <= 0) return;
  if (st.betAmount <= 0 || st.betAmount > st.balance) {
    window.showToast('Mise invalide');
    return;
  }

  st.phase = 'spinning';
  window.roulette.rerender();

  // Resolve bet value for tracking
  const resolvedVal = st.betType === '2' ? (st.betValue === 'rouge' ? 'rouge' : 'noir')
    : st.betType === '3' ? (st.betValue === 0 ? 'pair' : 'impair')
    : st.betType === '4' ? `douzaine ${st.betValue}`
    : String(st.betValue);

  // Deduct bet
  st.balance -= st.betAmount;

  // Spin result after delay
  setTimeout(() => {
    const n = Math.floor(Math.random() * 37);
    const c = rColor(n);
    const gain = rGain(st.betType, st.betValue, st.betAmount, n);
    st.balance += st.betAmount + gain;
    st.totalSpins++;

    st.lastResult = {
      n, c,
      gain: gain,
      mise: st.betAmount,
      type: st.betType,
      val: resolvedVal
    };

    st.history.push({ n, c, gain, mise: st.betAmount, type: st.betType, val: resolvedVal });

    st.phase = st.balance <= 0 ? 'game_over' : 'betting_phase';
    saveState();
    window.roulette.rerender();
  }, 1200);
};

window.roulette.reset = function() {
  const old = window.roulette.state;
  window.roulette.state = {
    balance: START_BALANCE,
    startBalance: START_BALANCE,
    totalSpins: 0,
    history: [],
    phase: 'betting_phase',
    lastResult: null,
    betType: old.betType,
    betValue: old.betValue,
    betAmount: 10
  };
  saveState();
  window.roulette.rerender();
};

window.roulette.clearHistory = function() {
  window.roulette.state.history = [];
  window.roulette.state.lastResult = null;
  window.roulette.state.totalSpins = 0;
  saveState();
  window.roulette.rerender();
};

// ===================== INIT =====================
window.roulette.init = function() {
  injectRCSS();
  initState();
};

