// game-logic/blackjack.js — Logique métier du Blackjack
// Fonctions pures, sans dépendance au stockage

const MISE_PAR_DEFAUT = 10;

/**
 * Calcule le score Blackjack d'une main
 * As = 1 ou 11, figures = 10, bust si > 21
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
 * Passe au joueur suivant, ou déclenche la fin de partie.
 * Si le joueur précédent a bust (>21), auto-stand du joueur courant
 * pour ne pas l'obliger à jouer alors qu'il gagne déjà.
 */
function nextTurn(room) {
  room.turnIndex++;
  if (room.turnIndex >= room.playerOrder.length) {
    room.currentTurn = null;
    checkGameFinished(room);
    return;
  }

  const prevId = room.playerOrder[room.turnIndex - 1];
  const prev = room.players[prevId];
  room.currentTurn = room.playerOrder[room.turnIndex];

  // Si le joueur précédent a bust, auto-stand du joueur actuel
  if (prev && prev.score > 21) {
    const cur = room.players[room.currentTurn];
    if (cur) {
      cur.stand = true;
      cur.isActive = false;
      // Si tout le monde est done, finir
      if (Object.values(room.players).every(p => !p.isActive || p.stand)) {
        room.currentTurn = null;
        checkGameFinished(room);
      }
    }
  }
}

/**
 * Vérifie si tous les joueurs ont fini, détermine le(s) gagnant(s) et met à jour les soldes.
 * - 1 winner +:mise pour lui, -:mise pour les autres
 * - Push (égalité) : personne ne gagne ni ne perd (soldes inchangés)
 * - Tous bust : personne ne gagne ni ne perd
 */
function checkGameFinished(room) {
  const players = Object.values(room.players);
  const allDone = players.every(p => !p.isActive || p.stand);
  if (!allDone || players.length === 0) return;

  room.phase = 'finished';

  // Recalculer les scores finaux
  for (const p of players) {
    p.score = calculateScore(p.hand);
  }

  let bestScore = 0;
  let winners = [];

  for (const p of players) {
    if (p.score <= 21 && p.score > bestScore) {
      bestScore = p.score;
      winners = [p.name];
    } else if (p.score <= 21 && p.score === bestScore) {
      winners.push(p.name);
    }
  }

  const isEveryoneBust = winners.length === 0;
  const winnerNames = isEveryoneBust ? ['Personne (tous ont dépassé 21)'] : winners;
  const isPush = winners.length > 1;

  room.winners = winnerNames;
  room.result = bestScore;

  // Résultat individuel et soldes
  const miseRef = room.miseParDefaut || MISE_PAR_DEFAUT;
  for (const [, p] of Object.entries(room.players)) {
    if (p.solde === undefined) p.solde = 100;
    const m = p.mise || miseRef;

    if (isEveryoneBust || isPush) {
      p.resultat = null; // pas de mouvement
    } else if (winners.includes(p.name)) {
      p.resultat = 'gagné';
      p.solde += m;
    } else {
      p.resultat = 'perdu';
      p.solde -= m;
    }
  }
}

module.exports = { calculateScore, nextTurn, checkGameFinished, MISE_PAR_DEFAUT };
