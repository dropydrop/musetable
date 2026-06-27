// game-logic/blackjack.js — Logique métier du Blackjack
// Fonctions pures, sans dépendance au stockage

const MISE_PAR_DEFAUT = 10;

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
 * et met à jour les soldes.
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

  const winnerNames = winners.length > 0 ? winners : ['Personne (tous ont dépassé 21)'];
  room.winners = winnerNames;
  room.result = bestScore;

  // Mise à jour des soldes
  const mise = room.miseParDefaut || MISE_PAR_DEFAUT;
  for (const [id, p] of Object.entries(room.players)) {
    if (p.solde === undefined) p.solde = 100;
    const miseJoueur = p.mise || mise;
    if (p.score <= 21 && winners.includes(p.name)) {
      p.solde += miseJoueur; // gagne sa mise
    } else if (p.score <= 21 && winners.length > 0 && winners[0] !== 'Personne (tous ont dépassé 21)') {
      p.solde -= miseJoueur; // perd sa mise
    }
    // push (égalité) : solde inchangé
    // tous bust : pas de perte de mise
  }
}

module.exports = { calculateScore, nextTurn, checkGameFinished, MISE_PAR_DEFAUT };
