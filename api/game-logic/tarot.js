// game-logic/tarot.js — Logique du Tarot Africain
// Deck : 1 à 21 + Excuse (0) — 22 cartes

function createTarotDeck() {
  const deck = [];
  for (let i = 0; i <= 21; i++) deck.push(i);
  return deck;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getParieurs(room) {
  const joueurs = room.joueurs || [];
  if (joueurs.length === 0) return [];
  const start = (room.dealerIndex + 1) % joueurs.length;
  const result = [];
  for (let i = 0; i < joueurs.length; i++) {
    result.push(joueurs[(start + i) % joueurs.length]);
  }
  return result;
}

function isLastBidder(room, playerId) {
  const joueurs = room.joueurs || [];
  if (joueurs.length === 0) return false;
  return playerId === joueurs[room.dealerIndex];
}

function getBidInterdit(room) {
  const totalActuel = Object.values(room.paris).reduce((a, b) => a + b, 0);
  return room.cartesDistribuees - totalActuel;
}

function startGame(room) {
  const ids = Object.keys(room.players);
  if (ids.length < 2) return { success: false, error: 'Minimum 2 joueurs requis' };

  room.phase = 'PARI';
  room.tarotDeck = shuffle(createTarotDeck());
  room.dealerIndex = (room.dealerIndex || 0) % ids.length;
  room.cartesDistribuees = room.cartesDistribuees || 5;
  room.paris = {};
  room.parisFaits = {};
  room.mains = {};
  room.pliActuel = [];
  room.plisGagnes = {};
  room.joueurs = ids.slice();
  room.tourIndex = 0;

  // Distribuer les cartes
  const deck = room.tarotDeck;
  for (const id of ids) {
    room.mains[id] = [];
    for (let i = 0; i < room.cartesDistribuees; i++) {
      if (deck.length > 0) room.mains[id].push(deck.pop());
    }
    room.paris[id] = 0;
    room.parisFaits[id] = false;
    room.plisGagnes[id] = 0;
  }

  return { success: true, cartesDistribuees: room.cartesDistribuees };
}

function bidActuel(room) {
  const parieurs = getParieurs(room);
  return room.tourIndex < parieurs.length ? parieurs[room.tourIndex] : null;
}

function canBid(room, playerId, nb) {
  if (playerId !== bidActuel(room)) return false;
  if (room.phase !== 'PARI') return false;
  if (nb < 0 || nb > room.cartesDistribuees) return false;
  if (nb !== Math.floor(nb)) return false;

  if (isLastBidder(room, playerId)) {
    const interdit = getBidInterdit(room);
    if (nb === interdit) return false;
  }
  return true;
}

function placerPari(room, playerId, nb) {
  if (!room.paris || room.paris[playerId] === undefined) return { success: false, error: 'Joueur invalide' };
  if (!canBid(room, playerId, nb)) return { success: false, error: 'Pari invalide' };

  room.paris[playerId] = nb;
  room.parisFaits[playerId] = true;
  room.tourIndex++;

  if (areBidsComplete(room)) {
    room.phase = 'JEU';
    room.tourIndex = 0; // reset pour la phase de jeu
  }

  return { success: true, phase: room.phase, prochain: bidActuel(room) };
}

function areBidsComplete(room) {
  return room.joueurs.every(id => room.parisFaits[id] === true);
}

function joueurActuelJeu(room) {
  if (!room.joueurs || room.joueurs.length === 0) return null;
  return room.joueurs[room.tourIndex % room.joueurs.length];
}

function jouerCarte(room, playerId, cardIndex, excuseValue) {
  const main = room.mains[playerId];
  if (!main) return { success: false, error: 'Joueur invalide' };
  if (cardIndex < 0 || cardIndex >= main.length) return { success: false, error: 'Carte invalide' };
  if (room.phase !== 'JEU') return { success: false, error: "Pas en phase JEU" };
  if (playerId !== joueurActuelJeu(room)) return { success: false, error: 'Pas votre tour' };

  const carte = main.splice(cardIndex, 1)[0];
  const pli = room.pliActuel;

  if (carte === 0) {
    pli.push({ playerId, carte, excuseValue: excuseValue !== undefined ? excuseValue : 0 });
  } else {
    pli.push({ playerId, carte, excuseValue: null });
  }

  room.tourIndex++;

  return { success: true, carte, pli: room.pliActuel, prochain: joueurActuelJeu(room) };
}

function resolveTrick(room) {
  const pli = room.pliActuel;
  if (pli.length === 0) return { success: false, error: 'Aucune carte dans le pli' };

  let best = null;
  let bestId = null;
  for (const p of pli) {
    const val = p.carte === 0 ? (p.excuseValue || 0) : p.carte;
    if (best === null || val > best) {
      best = val;
      bestId = p.playerId;
    }
  }

  room.pliActuel = [];
  if (bestId) room.plisGagnes[bestId] = (room.plisGagnes[bestId] || 0) + 1;
  return { success: true, gagnant: bestId, gagneAvec: best };
}

function areTricksComplete(room) {
  const totalPlayed = room.joueurs.reduce((s, id) => s + (room.plisGagnes[id] || 0), 0);
  return totalPlayed >= room.cartesDistribuees;
}

function endRound(room) {
  if (!room.vies) {
    room.vies = {};
    for (const id of room.joueurs) room.vies[id] = 10;
  }

  for (const id of room.joueurs) {
    const pari = room.paris[id] || 0;
    const gagnes = room.plisGagnes[id] || 0;
    room.vies[id] -= Math.abs(pari - gagnes);
    if (room.vies[id] < 0) room.vies[id] = 0;
  }

  room.dealerIndex = (room.dealerIndex + 1) % room.joueurs.length;
  room.cartesDistribuees = room.cartesDistribuees === 5 ? 4 :
    room.cartesDistribuees === 4 ? 3 :
    room.cartesDistribuees === 3 ? 2 :
    room.cartesDistribuees === 2 ? 1 : 5;
  room.phase = 'SCORE';

  const alive = room.joueurs.filter(id => room.vies[id] > 0);
  if (alive.length <= 1) {
    room.phase = 'FINI';
    return { success: true, phase: 'FINI', gagnant: alive[0] || null, vies: room.vies };
  }

  return { success: true, phase: 'SCORE', vies: room.vies, cartesDistribuees: room.cartesDistribuees };
}

function getPublicState(room) {
  return {
    vies: room.vies || {},
    cartesDistribuees: room.cartesDistribuees,
    dealerIndex: room.dealerIndex,
    phase: room.phase,
    paris: room.paris,
    parisFaits: room.parisFaits || {},
    mains: room.mains || {},
    pliActuel: room.pliActuel || [],
    plisGagnes: room.plisGagnes || {},
    joueurs: room.joueurs || [],
    tourIndex: room.tourIndex || 0,
    bidActuel: bidActuel(room),
    joueurActif: room.phase === 'JEU' ? joueurActuelJeu(room) : bidActuel(room),
    parieurs: room.joueurs ? getParieurs(room) : [],
    interdit: room.phase === 'PARI' ? getBidInterdit(room) : null
  };
}

module.exports = {
  createTarotDeck, startGame, placerPari, jouerCarte, resolveTrick,
  endRound, getPublicState, canBid, areBidsComplete, areTricksComplete,
  getParieurs, isLastBidder, getBidInterdit, bidActuel, joueurActuelJeu
};
