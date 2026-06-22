// game-logic.js — Fonctions métier pures pour MuseTable
// Sans dépendance au stockage (games global), input → output

/**
 * Genère un identifiant joueur aléatoire (8 caractères)
 * @returns {string}
 */
function generatePlayerId() {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Crée un paquet de 52 cartes mélangé (Fisher-Yates)
 * @returns {Array<{suit:string, value:string}>}
 */
function createShuffledDeck() {
  const suits = ['S', 'H', 'D', 'C'];
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/**
 * Calcule le score Blackjack d'une main
 * As = 1 ou 11, figures = 10, bust si > 21
 * @param {Array<{suit:string, value:string}>} hand
 * @returns {number}
 */
function calculateScore(hand) {
  let score = 0;
  let aces = 0;
  for (const card of hand) {
    if (card.value === 'A') { aces++; score += 11; }
    else if (['J', 'Q', 'K'].includes(card.value)) { score += 10; }
    else { score += parseInt(card.value); }
  }
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }
  return score;
}

/**
 * Passe au joueur suivant, ou déclenche la fin de partie
 * @param {object} room — objet salle (muté sur place)
 */
function nextTurn(room) {
  room.turnIndex++;
  if (room.turnIndex >= room.playerOrder.length) {
    room.currentTurn = null;
    checkGameFinished(room);
  } else {
    room.currentTurn = room.playerOrder[room.turnIndex];
  }
}

/**
 * Vérifie si tous les joueurs ont fini de jouer, détermine le(s) gagnant(s)
 * @param {object} room — objet salle (muté sur place)
 */
function checkGameFinished(room) {
  const players = Object.values(room.players);
  const allDone = players.every(p => !p.isActive || p.stand);
  if (!allDone || players.length === 0) return;

  room.phase = 'finished';
  let bestScore = 0;
  let winners = [];

  for (const p of players) {
    p.score = calculateScore(p.hand);
    if (p.score <= 21 && p.score > bestScore) {
      bestScore = p.score;
      winners = [p.name];
    } else if (p.score <= 21 && p.score === bestScore) {
      winners.push(p.name);
    }
  }

  room.winners = winners.length > 0 ? winners : ['Personne (tous ont dépassé 21)'];
  room.result = bestScore;
}

module.exports = {
  generatePlayerId,
  createShuffledDeck,
  calculateScore,
  nextTurn,
  checkGameFinished
};
