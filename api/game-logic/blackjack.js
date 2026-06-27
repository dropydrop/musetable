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
 * - 1 winner : gagne sa mise + les mises des perdants
 * - Push (égalité) : personne ne gagne ni ne perd (soldes inchangés)
 * - Tous bust : tous perdent leur mise
 */
function checkGameFinished(room) {
  const entries = Object.entries(room.players);
  const allDone = entries.every(([, p]) => !p.isActive || p.stand);
  if (!allDone || entries.length === 0) return;

  room.phase = 'finished';

  // Recalculer les scores finaux
  for (const [, p] of entries) {
    p.score = calculateScore(p.hand);
  }

  // Séparer valides (≤21) et busts (>21)
  const valides = entries.filter(([, p]) => p.score <= 21);
  const busts = entries.filter(([, p]) => p.score > 21);

  // Tous bust → tout le monde perd sa mise
  if (valides.length === 0) {
    for (const [id, p] of entries) {
      p.solde = (p.solde || 100) - (p.mise || MISE_PAR_DEFAUT);
      p.mise = 0;
      p.resultat = 'perdu';
      p.gain = -(p.mise || MISE_PAR_DEFAUT);
    }
    room.winners = ['Personne (tous ont dépassé 21)'];
    room.result = 0;
    return;
  }

  // Trouver le meilleur score parmi les valides
  let bestScore = 0;
  for (const [, p] of valides) {
    if (p.score > bestScore) bestScore = p.score;
  }

  const winnerEntries = valides.filter(([, p]) => p.score === bestScore);
  const winnerIds = winnerEntries.map(([id]) => id);
  const isPush = winnerEntries.length > 1;

  room.winners = winnerEntries.map(([, p]) => p.name);
  room.result = bestScore;

  // Mise à jour des soldes par ID (pas par nom)
  const miseRef = room.miseParDefaut || MISE_PAR_DEFAUT;
  for (const [id, p] of entries) {
    if (p.solde === undefined) p.solde = 100;
    const m = p.mise || miseRef;

    if (isPush) {
      // Push : pas de mouvement
      p.resultat = null;
      p.gain = null;
    } else if (winnerIds.includes(id)) {
      // Gagnant unique : prend la mise des perdants (sa propre mise reste en solde)
      const misePerdants = entries
        .filter(([oid]) => !winnerIds.includes(oid))
        .reduce((sum, [, op]) => sum + (op.mise || miseRef), 0);
      p.solde += misePerdants;
      p.resultat = 'gagné';
      p.gain = misePerdants;
    } else {
      // Perdant
      p.solde -= m;
      p.resultat = 'perdu';
      p.gain = -m;
    }
    p.mise = 0;
  }
}

module.exports = { calculateScore, nextTurn, checkGameFinished, MISE_PAR_DEFAUT };
