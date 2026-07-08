/* game-balatrow.js — Balatrow: Poker Solo Rogue-like (client-side) */

window.balatrow = {};

const BT_VAL_NUM = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14 };
const BT_SUITS = ['S','H','D','C'];
const BT_MULT = {
  'Carte haute':1, 'Paire':2, 'Deux paires':3, 'Brelan':4,
  'Suite':5, 'Couleur':6, 'Full':8, 'Carré':10, 'Quinte flush':15
};
const BT_JOKER_POOL = [
  { name:'Joker Chanceux', mult:1.5 },
  { name:'Joker Cupide', mult:2.0 },
  { name:'Joker Triste', mult:0.8 },
  { name:'Joker Chaos', mult:null }
];

function btShuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function btCreateDeck() {
  const vals = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const d = [];
  for (const s of BT_SUITS)
    for (const v of vals) d.push({ suit:s, value:v });
  return btShuffle(d);
}

function* btCombos(arr, k) {
  if (k === 0) { yield []; return; }
  for (let i = 0; i <= arr.length - k; i++)
    for (const c of btCombos(arr.slice(i + 1), k - 1))
      yield [arr[i], ...c];
}

function btVal(c) { return BT_VAL_NUM[c.value] || 0; }

function btEval(cards) {
  if (!cards || cards.length === 0) return 'Carte haute';
  const vals = cards.map(btVal).sort((a,b) => a - b);
  const suits = cards.map(c => c.suit);
  const isFlush = suits.every(s => s === suits[0]);
  let isStraight = vals.every((v,i) => i === 0 || v === vals[i-1] + 1);
  if (vals.length === 5 && vals[0] === 2 && vals[1] === 3 && vals[2] === 4 && vals[3] === 5 && vals[4] === 14)
    isStraight = true;
  const count = {};
  for (const v of vals) count[v] = (count[v] || 0) + 1;
  const cv = Object.values(count).sort((a,b) => b - a);
  if (isStraight && isFlush && cards.length === 5) return 'Quinte flush';
  if (cv[0] === 4) return 'Carré';
  if (cv[0] === 3 && cv[1] === 2) return 'Full';
  if (isFlush) return 'Couleur';
  if (isStraight) return 'Suite';
  if (cv[0] === 3) return 'Brelan';
  if (cv.filter(c => c === 2).length === 2) return 'Deux paires';
  if (cv[0] === 2) return 'Paire';
  return 'Carte haute';
}

function btScore(cards) {
  const name = btEval(cards);
  return { name, score: (BT_MULT[name] || 1) * 10 * cards.length };
}

function btBestHand(hand) {
  let best = { score:0, name:'Carte haute', cards:[] };
  for (let r = 1; r <= 5; r++)
    for (const combo of btCombos(hand, r)) {
      const { name, score } = btScore(combo);
      if (score > best.score) best = { score, name, cards:combo };
    }
  return best;
}

window.balatrow.state = null;

function btInit() {
  const deck = btCreateDeck();
  window.balatrow.state = {
    round:1, level:1, score:0,
    roundTarget:300, levelTarget:300,
    handsLeft:4, discardsLeft:3,
    hand:deck.splice(0,8), deck,
    selected:[], jokers:[],
    phase:'blind_intro',
    lastPlayed:null, lastHandName:'', lastScore:0
  };
}

function btApplyJokers(score) {
  let s = score;
  for (const j of window.balatrow.state.jokers) s = Math.round(s * j.mult);
  return s;
}

function btMaybeJoker() {
  if (Math.random() < 0.35) {
    const t = BT_JOKER_POOL[Math.floor(Math.random() * BT_JOKER_POOL.length)];
    const j = { name:t.name, mult:t.mult };
    if (j.mult === null) j.mult = +(1 + Math.random() * 1.5).toFixed(2);
    window.balatrow.state.jokers.push(j);
    return j;
  }
  return null;
}

window.balatrow.renderer = function() {};

window.balatrow.init = function() {
  window.stopPolling();
  window.dom['game-code-badge'].textContent = 'SOLO';
  btInit();
  btRender();
  btSetControls();
};

function btRender() {
  const st = window.balatrow.state;
  if (!st) return;
  window.dom['phase-badge'].textContent = st.phase === 'game_over' ? 'Game Over' : `Round ${st.round}`;
  window.dom['game-type-badge'].textContent = '🃏 Balatrow';
  const board = window.dom.board;
  board.innerHTML = '';
  const bar = document.createElement('div');
  bar.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:10px 16px;background:var(--surface);border-radius:10px;gap:8px;flex-wrap:wrap';
  bar.innerHTML = `
    <span style="font-size:1.2rem;font-weight:700">Score: <span style="color:var(--gold)">${st.score}</span></span>
    <span style="font-size:.9rem;color:var(--muted)">Cible: ${st.roundTarget}</span>
    <span style="font-size:.9rem">🃏 Mains: ${st.handsLeft}</span>
    <span style="font-size:.9rem">🗑️ Défausses: ${st.discardsLeft}</span>`;
  board.appendChild(bar);
  const info = document.createElement('div');
  info.style.cssText = 'text-align:center;font-size:.8rem;color:var(--muted);padding:4px';
  info.textContent = `Niveau ${st.level} — Round ${st.round}${st.round % 5 === 0 ? ' ⚠️ BOSS' : ''}`;
  board.appendChild(info);
  if (st.jokers.length > 0) {
    const ja = document.createElement('div');
    ja.style.cssText = 'display:flex;gap:8px;justify-content:center;padding:8px;flex-wrap:wrap';
    for (const j of st.jokers) {
      const je = document.createElement('div');
      je.style.cssText = 'background:linear-gradient(135deg,#2a1a3e,#4a2a6e);border:2px solid var(--gold);border-radius:8px;padding:4px 12px;text-align:center;font-size:.75rem';
      je.innerHTML = `<div style="font-weight:700;color:var(--gold)">${j.name}</div><div style="color:var(--muted)">${j.mult}×</div>`;
      ja.appendChild(je);
    }
    board.appendChild(ja);
  }
  if (st.phase === 'blind_intro') btRenderIntro(board);
  else if (st.phase === 'round_active') { btRenderHand(board); btRenderSelected(board); btRenderHint(board); }
  else if (st.phase === 'hand_evaluation') btRenderEval(board);
  else if (st.phase === 'round_won') btRenderWon(board);
  else if (st.phase === 'game_over') btRenderGameOver(board);
  btUpdateControls();
}

function btRenderIntro(board) {
  const st = window.balatrow.state;
  const el = document.createElement('div');
  el.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;gap:16px;padding:40px;text-align:center';
  el.innerHTML = `
    <h2 style="font-size:2rem;font-weight:800;color:var(--gold);text-transform:uppercase;letter-spacing:2px">Round ${st.round}</h2>
    <div style="font-size:1.4rem">Score à battre: <b style="color:var(--gold)">${st.roundTarget}</b></div>
    <div style="font-size:1rem;color:var(--muted)">Score actuel: ${st.score}</div>
    ${st.round % 5 === 0 ? '<div style="color:var(--red);font-weight:700">⚠️ BLIND BOSS — Niveau check!</div>' : ''}
    <button class="btn-gold" id="bt-start-round" style="padding:16px 48px;font-size:1.2rem">JOUER →</button>`;
  board.appendChild(el);
  window.$('bt-start-round').addEventListener('click', () => {
    st.phase = 'round_active';
    btRender();
  });
}

function btRenderHand(board) {
  const st = window.balatrow.state;
  if (!st.hand || st.hand.length === 0) return;
  const sec = document.createElement('div');
  sec.style.cssText = 'margin-top:8px';
  const label = document.createElement('div');
  label.style.cssText = 'font-size:.75rem;color:var(--muted);margin-bottom:4px;text-align:center';
  label.textContent = 'Main — Cliquez pour sélectionner';
  sec.appendChild(label);
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:6px;justify-content:center;flex-wrap:wrap;padding:8px';
  st.hand.forEach((card, i) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'cursor:pointer;transition:transform .15s;position:relative';
    wrap.style.transform = st.selected.includes(i) ? 'translateY(-18px)' : '';
    const el = window.createCardElement(card);
    if (st.selected.includes(i)) {
      el.style.boxShadow = '0 0 0 3px var(--gold)';
      el.style.transform = 'scale(1.05)';
    }
    wrap.appendChild(el);
    wrap.addEventListener('click', () => btToggle(i));
    row.appendChild(wrap);
  });
  sec.appendChild(row);
  board.appendChild(sec);
}

function btRenderSelected(board) {
  const st = window.balatrow.state;
  if (st.selected.length === 0) return;
  const cards = st.selected.map(i => st.hand[i]);
  const sec = document.createElement('div');
  sec.style.cssText = 'margin-top:4px';
  const label = document.createElement('div');
  label.style.cssText = 'font-size:.75rem;color:var(--gold);margin-bottom:4px;text-align:center';
  label.textContent = `Sélection (${st.selected.length})`;
  sec.appendChild(label);
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:6px;justify-content:center;flex-wrap:wrap;padding:4px';
  for (const card of cards) {
    const el = window.createCardElement(card);
    el.style.border = '2px solid var(--gold)';
    row.appendChild(el);
  }
  sec.appendChild(row);
  if (cards.length >= 1 && cards.length <= 5) {
    const { name, score } = btScore(cards);
    const h = document.createElement('div');
    h.style.cssText = 'text-align:center;font-size:.85rem;color:var(--muted);padding:4px';
    h.textContent = `${name} → +${score}`;
    sec.appendChild(h);
  }
  board.appendChild(sec);
}

function btRenderHint(board) {
  const st = window.balatrow.state;
  if (!st.hand || st.hand.length === 0) return;
  const best = btBestHand(st.hand);
  const h = document.createElement('div');
  h.style.cssText = 'text-align:center;font-size:.75rem;color:var(--muted);padding:4px;margin-top:4px';
  h.textContent = `Meilleure main possible: ${best.name} (+${best.score})`;
  board.appendChild(h);
}

function btToggle(i) {
  const st = window.balatrow.state;
  if (st.phase !== 'round_active') return;
  const idx = st.selected.indexOf(i);
  if (idx >= 0) st.selected.splice(idx, 1);
  else if (st.selected.length < 5) st.selected.push(i);
  btRender();
}

function btRenderEval(board) {
  const st = window.balatrow.state;
  const sec = document.createElement('div');
  sec.style.cssText = 'margin-top:8px';
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:6px;justify-content:center;flex-wrap:wrap;padding:16px';
  for (const card of (st.lastPlayed || [])) {
    const el = window.createCardElement(card);
    el.style.border = '2px solid var(--gold)';
    el.style.transform = 'scale(1.1)';
    row.appendChild(el);
  }
  sec.appendChild(row);
  board.appendChild(sec);
  const res = document.createElement('div');
  res.style.cssText = 'text-align:center;padding:16px';
  res.innerHTML = `
    <div style="font-size:1.6rem;font-weight:800;color:var(--gold);text-transform:uppercase;letter-spacing:1px">${st.lastHandName}</div>
    <div style="font-size:1.3rem;color:var(--green);margin-top:8px">+${st.lastScore}</div>`;
  board.appendChild(res);
  setTimeout(btAdvance, 1500);
}

function btRenderWon(board) {
  const st = window.balatrow.state;
  const el = document.createElement('div');
  el.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;gap:16px;padding:40px;text-align:center';
  let title = 'ROUND GAGNÉ!';
  let extra = '';
  if (st.round % 5 === 0) {
    title = `NIVEAU ${st.level} COMPLÉTÉ!`;
    extra = `<div style="font-size:1rem;color:var(--green)">Palier: ${st.levelTarget} ✓</div>`;
  }
  const joker = btMaybeJoker();
  let jokerHtml = '';
  if (joker) jokerHtml = `<div style="background:linear-gradient(135deg,#2a1a3e,#4a2a6e);border:2px solid var(--gold);border-radius:8px;padding:12px 24px;font-size:.9rem">🎉 Nouveau Joker: <b style="color:var(--gold)">${joker.name}</b> (${joker.mult}×)</div>`;
  el.innerHTML = `
    <h2 style="font-size:2rem;font-weight:800;color:var(--gold);text-transform:uppercase">${title}</h2>
    ${extra}
    ${jokerHtml}
    <button class="btn-gold" id="bt-next-round" style="padding:16px 48px;font-size:1.2rem">Round suivant →</button>`;
  board.appendChild(el);
  window.$('bt-next-round').addEventListener('click', () => {
    st.round++;
    st.roundTarget = Math.round(st.roundTarget * 1.25);
    st.handsLeft = 4;
    st.discardsLeft = 3;
    st.selected = [];
    if (st.deck.length < 8) st.deck = btCreateDeck();
    st.hand = st.deck.splice(0, 8);
    st.phase = 'blind_intro';
    btRender();
  });
}

function btRenderGameOver(board) {
  const st = window.balatrow.state;
  const el = document.createElement('div');
  el.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;gap:16px;padding:40px;text-align:center';
  el.innerHTML = `
    <h2 style="font-size:2.5rem;font-weight:800;color:var(--red)">GAME OVER</h2>
    <div style="font-size:1rem;line-height:1.8">
      Score final: <b style="color:var(--gold)">${st.score}</b><br>
      Niveau atteint: <b>${st.level}</b><br>
      Rounds joués: <b>${st.round}</b>
    </div>
    <button class="btn-gold" id="bt-restart" style="padding:16px 48px;font-size:1.2rem">🔄 Nouvelle partie</button>`;
  board.appendChild(el);
  window.$('bt-restart').addEventListener('click', () => {
    btInit();
    btRender();
    btSetControls();
  });
  window.dom['phase-badge'].textContent = 'Game Over';
}

function btAdvance() {
  const st = window.balatrow.state;
  if (!st || st.phase !== 'hand_evaluation') return;
  const idxs = st.selected.slice().sort((a,b) => b - a);
  for (const idx of idxs) {
    if (st.deck.length > 0) st.hand[idx] = st.deck.pop();
    else st.hand.splice(idx, 1);
  }
  st.selected = [];
  if (st.score >= st.roundTarget) {
    if (st.round % 5 === 0 && st.score < st.levelTarget) {
      st.phase = 'game_over';
      btRender();
      return;
    }
    if (st.round % 5 === 0) {
      st.level++;
      st.levelTarget = Math.round(st.levelTarget * 1.6);
    }
    st.phase = 'round_won';
    btRender();
    return;
  }
  if (st.handsLeft <= 0) {
    st.phase = 'game_over';
    btRender();
    return;
  }
  st.phase = 'round_active';
  btRender();
}

function btSetControls() {
  window.dom.controls.innerHTML = '';
  const btns = [
    { id:'bt-play', text:'🎯 Jouer la main', cls:'btn-green', action:btPlay },
    { id:'bt-discard', text:'🗑️ Défausser', cls:'btn-red', action:btDiscard },
    { id:'bt-sort-val', text:'🔢 Trier valeur', cls:'btn-outline', action:() => btSort('value') },
    { id:'bt-sort-suit', text:'♠ Trier enseigne', cls:'btn-outline', action:() => btSort('suit') }
  ];
  for (const b of btns) {
    const btn = document.createElement('button');
    btn.id = b.id;
    btn.className = b.cls;
    btn.textContent = b.text;
    btn.addEventListener('click', b.action);
    window.dom.controls.appendChild(btn);
  }
  btUpdateControls();
}

function btUpdateControls() {
  const st = window.balatrow.state;
  if (!st) return;
  const playBtn = window.$('bt-play');
  const discardBtn = window.$('bt-discard');
  const sortValBtn = window.$('bt-sort-val');
  const sortSuitBtn = window.$('bt-sort-suit');
  if (!playBtn) return;
  const active = st.phase === 'round_active';
  playBtn.disabled = !(active && st.selected.length >= 1 && st.handsLeft > 0);
  discardBtn.disabled = !(active && st.selected.length >= 1 && st.discardsLeft > 0);
  sortValBtn.disabled = !active;
  sortSuitBtn.disabled = !active;
  for (const b of [playBtn, discardBtn, sortValBtn, sortSuitBtn])
    b.style.display = active ? '' : 'none';
}

function btPlay() {
  const st = window.balatrow.state;
  if (!st || st.phase !== 'round_active' || st.selected.length === 0 || st.handsLeft <= 0) return;
  const played = st.selected.map(i => st.hand[i]);
  const { name, score } = btScore(played);
  const finalScore = btApplyJokers(score);
  st.lastPlayed = played;
  st.lastHandName = name;
  st.lastScore = finalScore;
  st.score += finalScore;
  st.handsLeft--;
  st.phase = 'hand_evaluation';
  btRender();
}

function btDiscard() {
  const st = window.balatrow.state;
  if (!st || st.phase !== 'round_active' || st.selected.length === 0 || st.discardsLeft <= 0) return;
  const idxs = st.selected.slice().sort((a,b) => b - a);
  for (const idx of idxs) {
    if (st.deck.length > 0) st.hand[idx] = st.deck.pop();
    else st.hand.splice(idx, 1);
  }
  st.selected = [];
  st.discardsLeft--;
  btRender();
  window.showToast('Cartes défaussées');
}

function btSort(mode) {
  const st = window.balatrow.state;
  if (!st || st.phase !== 'round_active' || !st.hand) return;
  if (mode === 'value') {
    st.hand.sort((a,b) => (BT_VAL_NUM[b.value] || 0) - (BT_VAL_NUM[a.value] || 0));
  } else {
    const order = { 'S':0, 'H':1, 'D':2, 'C':3 };
    st.hand.sort((a,b) => {
      const sa = order[a.suit] || 0, sb = order[b.suit] || 0;
      return sa !== sb ? sa - sb : (BT_VAL_NUM[b.value] || 0) - (BT_VAL_NUM[a.value] || 0);
    });
  }
  st.selected = [];
  btRender();
}
