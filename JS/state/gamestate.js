export const gameState = {
  selectedCardIndex: null,

  player: {
    hp: 10,
    maxHp: 10,
    energy: 1,
    energyGain: 1,
    maxEnergy: 3,
  },

  enemy: {
    hp: 10,
    maxHp: 10,
    energy: 3,
    energyGain: 1,
    maxEnergy: 3,
  },

  board: {
    enemyBack: [null, null, null, null],
    enemyFront: [null, null, null, null],
    playerFront: [null, null, null, null],
  },

  drawPile: [],
  hand: [],
  discardPile: [],

  resetBoard() {
    this.selectedCardIndex = null;

    this.player.hp = 10;
    this.player.energy = 1;
    this.enemy.hp = 10;
    this.enemy.energy = 3;

    this.board.enemyBack = [null, null, null, null];
    this.board.enemyFront = [null, null, null, null];
    this.board.playerFront = [null, null, null, null];

    this.drawPile = [];
    this.hand = [];
    this.discardPile = [];
  },
};
