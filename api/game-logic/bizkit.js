// game-logic/bizkit.js — Logique du jeu Bizkit (dés)
// 2-10 joueurs, chacun lance 2 dés à son tour

/**
 * Initialise une partie Bizkit
 * @param {object} room — salle (mutée)
 * @returns {{ success: true }}
 */
function startGame(room) {
  const ids = Object.keys(room.players);
  if (ids.length < 2) return { success: false, error: 'Minimum 2 joueurs requis' };

  room.phase = 'playing';
  room.playerOrder = ids.slice();
  room.currentTurn = room.playerOrder[0];
  room.lastDice = null;
  for (const p of Object.values(room.players)) {
    p.isActive = true;
    p.score = 0;
  }
  return { success: true };
}

/**
 * Lance 2 dés pour le joueur courant
 * @param {object} room
 * @param {string} playerId
 * @returns {{ success: boolean, results: number[], isSpecial: boolean }}
 */
function rollDice(room, playerId) {
  const player = room.players[playerId];
  if (!player) return { success: false, error: 'Joueur introuvable' };
  if (room.currentTurn !== playerId) return { success: false, error: 'Pas votre tour' };

  const results = [rollDie(), rollDie()];
  const isSpecial = checkSpecial(results);

  room.lastDice = { results, playerId, isSpecial, timestamp: Date.now() };
  return { success: true, results, isSpecial };
}

/**
 * Lance un dé à 6 faces
 * @returns {number} — résultat entre 1 et 6
 */
function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * Vérifie si une combinaison est "spéciale"
 * @param {number[]} results
 * @returns {boolean}
 */
function checkSpecial(results) {
  const sum = results[0] + results[1];
  return sum === 7 || sum === 11 || results[0] === results[1];
}

/**
 * Passe au joueur suivant
 * @param {object} room
 * @returns {{ success: boolean, nextPlayer: string }}
 */
function nextTurn(room) {
  const players = room.playerOrder;
  if (players.length === 0) return { success: false, error: 'Aucun joueur' };

  const currentIndex = players.indexOf(room.currentTurn);
  const nextIndex = (currentIndex + 1) % players.length;
  room.currentTurn = players[nextIndex];
  room.lastDice = null;
  return { success: true, nextPlayer: room.currentTurn };
}

module.exports = { startGame, rollDice, nextTurn, rollDie, checkSpecial };
