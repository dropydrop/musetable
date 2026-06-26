// game-logic/free.js — Logique du mode libre (sans règles)
// Actions : piocher, poser, retourner, reprendre, lancer dés, mélanger, distribuer

/**
 * Pioche X cartes du deck vers la main d'un joueur
 * @param {object} room — salle (mutée)
 * @param {string} playerId
 * @param {number} count — nombre de cartes à piocher
 * @returns {{ success: boolean, cards: Array, remaining: number }}
 */
function drawCards(room, playerId, count) {
  const player = room.players[playerId];
  if (!player) return { success: false, error: 'Joueur introuvable' };
  const drawn = [];
  for (let i = 0; i < (count || 1); i++) {
    if (room.deck.length === 0) break;
    drawn.push(room.deck.pop());
  }
  player.hand.push(...drawn);
  return { success: true, cards: drawn, remaining: room.deck.length };
}

/**
 * Pose une carte de la main d'un joueur sur le plateau
 * @param {object} room
 * @param {string} playerId
 * @param {number} cardIndex — index dans la main
 * @param {boolean} [faceUp=true] — visible ou cachée
 * @returns {{ success: boolean, card: object }}
 */
function playCard(room, playerId, cardIndex, faceUp) {
  const player = room.players[playerId];
  if (!player) return { success: false, error: 'Joueur introuvable' };
  if (cardIndex < 0 || cardIndex >= player.hand.length) return { success: false, error: 'Carte invalide' };

  const card = player.hand.splice(cardIndex, 1)[0];
  const played = { ...card, faceUp: faceUp !== false, playedBy: playerId };
  room.table.push(played);
  return { success: true, card: played };
}

/**
 * Retourne une carte sur le plateau (face cachée ↔ face visible)
 * @param {object} room
 * @param {number} cardIndex — index dans room.table
 * @returns {{ success: boolean, card: object }}
 */
function flipCard(room, cardIndex) {
  if (cardIndex < 0 || cardIndex >= room.table.length) return { success: false, error: 'Carte invalide' };
  const card = room.table[cardIndex];
  card.faceUp = !card.faceUp;
  return { success: true, card };
}

/**
 * Reprend une carte du plateau dans la main d'un joueur
 * @param {object} room
 * @param {string} playerId
 * @param {number} cardIndex — index dans room.table
 * @returns {{ success: boolean, card: object }}
 */
function pickupCard(room, playerId, cardIndex) {
  const player = room.players[playerId];
  if (!player) return { success: false, error: 'Joueur introuvable' };
  if (cardIndex < 0 || cardIndex >= room.table.length) return { success: false, error: 'Carte invalide' };

  const card = room.table.splice(cardIndex, 1)[0];
  delete card.faceUp;
  delete card.playedBy;
  player.hand.push(card);
  return { success: true, card };
}

/**
 * Lance X dés (délègue à common)
 * @param {number} count
 * @param {number} [faces=6]
 * @returns {{ success: true, results: number[] }}
 */
function rollDice(count, faces) {
  const { rollDice: roll } = require('./common.js');
  const results = roll(count || 1, faces || 6);
  return { success: true, results };
}

/**
 * Mélange la pioche
 * @param {object} room
 * @returns {{ success: true, remaining: number }}
 */
function shuffleDeck(room) {
  const { createShuffledDeck } = require('./common.js');
  room.deck = createShuffledDeck();
  return { success: true, remaining: room.deck.length };
}

/**
 * Distribue X cartes à chaque joueur depuis la pioche
 * @param {object} room
 * @param {number} count — cartes par joueur
 * @returns {{ success: boolean, dealt: object }}
 */
function dealCards(room, count) {
  const dealt = {};
  for (const [id, player] of Object.entries(room.players)) {
    const cards = [];
    for (let i = 0; i < (count || 1); i++) {
      if (room.deck.length === 0) break;
      cards.push(room.deck.pop());
    }
    player.hand.push(...cards);
    dealt[id] = { name: player.name, cards };
  }
  return { success: true, dealt, remaining: room.deck.length };
}

module.exports = {
  drawCards,
  playCard,
  flipCard,
  pickupCard,
  rollDice,
  shuffleDeck,
  dealCards
};
