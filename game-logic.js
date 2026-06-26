// game-logic.js — Point d'entrée rétrocompatible
// Redirige vers les modules spécialisés

const common = require('./game-logic/common.js');
const blackjack = require('./game-logic/blackjack.js');

module.exports = {
  generatePlayerId: common.generatePlayerId,
  createShuffledDeck: common.createShuffledDeck,
  calculateScore: blackjack.calculateScore,
  nextTurn: blackjack.nextTurn,
  checkGameFinished: blackjack.checkGameFinished
};
