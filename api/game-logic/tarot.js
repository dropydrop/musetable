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

function startGame(room) {
  const ids = Object.keys(room.players);
  if (ids.length < 2) return { success: false, error: 'Minimum 2 joueurs requis' };

  room.phase = 'PARI';
  room.tarotDeck = shuffle(createTarotDeck());
  room.dealerIndex = (room.dealerIndex || 0) % ids.length;
  room.cartesDistribuees = room.cartesDistribuees || 5;
  room.paris = {};
  room.mains = {};
  room.pliActuel = [];
  room.plisGagnes = {};
  room.parisPhase = { debut: (room.dealerIndex + 1) % ids.length, fin: room.dealerIndex, index: 0 };
  room.joueurs = ids.slice();

  // Distribuer les cartes
  const deck = room.tarotDeck;
  for (const id of ids) {
    room.mains[id] = [];
    for (let i = 0; i < room.cartesDistribuees; i++) {
      if (deck.length > 0) room.mains[id].push(deck.pop());
    }
    room.paris[id] = 0;
    room.plisGagnes[id] = 0;
  }

  return { success: true, cartesDistribuees: room.cartesDistribuees };
}

function isBidValid(room, playerId, nb) {
  const ids = room.joueurs;
  const total = ids.reduce((s, id) => s + room.paris[id], 0);
  const isLast = playerId === room.parisPhase.fin;
  if (isLast && (total + nb) === room.cartesDistribuees) return false;
  return nb >= 0 && nb <= room.cartesDistribuees;
}

function placerPari(room, playerId, nb) {
  if (!room.paris || room.paris[playerId] === undefined) return { success: false, error: 'Joueur invalide' };
  if (!isBidValid(room, playerId, nb)) return { success: false, error: 'Pari invalide' };
  room.paris[playerId] = nb;
  return { success: true };
}

function areBidsComplete(room) {
  return room.joueurs.every(id => room.paris[id] > 0 || room.paris[id] === 0);
}

function jouerCarte(room, playerId, cardIndex, excuseValue) {
  const main = room.mains[playerId];
  if (!main) return { success: false, error: 'Joueur invalide' };
  if (cardIndex < 0 || cardIndex >= main.length) return { success: false, error: 'Carte invalide' };

  const carte = main.splice(cardIndex, 1)[0];
  const pli = room.pliActuel;

  if (carte === 0) {
    pli.push({ playerId, carte, excuseValue: excuseValue !== undefined ? excuseValue : 0 });
  } else {
    pli.push({ playerId, carte, excuseValue: null });
  }

  return { success: true, carte, pli: room.pliActuel };
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
    mainsPubliques: room.joueurs ? room.joueurs.map(id => ({
      playerId: id, count: (room.mains[id] || []).length
    })) : [],
    pliActuel: room.pliActuel || [],
    plisGagnes: room.plisGagnes || {},
    joueurs: room.joueurs || []
  };
}

module.exports = {
  createTarotDeck, startGame, placerPari, jouerCarte, resolveTrick, endRound, getPublicState, isBidValid, areBidsComplete, areTricksComplete
};
