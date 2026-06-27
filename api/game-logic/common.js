// game-logic/common.js — Fonctions partagées entre tous les modes de jeu

/**
 * Génère un code de salle à 4 chiffres.
 * Optionnellement unique via existsCheck (callback de vérification)
 * @param {Function} [existsCheck] — (code) => booléen, pour éviter les collisions
 * @returns {string}
 */
function generateRoomCode(existsCheck) {
  let code;
  do {
    code = String(Math.floor(1000 + Math.random() * 9000));
  } while (existsCheck && existsCheck(code));
  return code;
}

/**
 * Génère un identifiant joueur aléatoire (8 caractères hex)
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
 * Lance un dé à N faces
 * @param {number} [faces=6] — nombre de faces (défaut: 6)
 * @returns {number} — résultat entre 1 et faces
 */
function rollDie(faces) {
  faces = faces || 6;
  return Math.floor(Math.random() * faces) + 1;
}

/**
 * Lance plusieurs dés
 * @param {number} count — nombre de dés
 * @param {number} [faces=6] — faces par dé
 * @returns {number[]}
 */
function rollDice(count, faces) {
  const results = [];
  for (let i = 0; i < (count || 1); i++) {
    results.push(rollDie(faces));
  }
  return results;
}

module.exports = {
  generateRoomCode,
  generatePlayerId,
  createShuffledDeck,
  rollDie,
  rollDice
};
