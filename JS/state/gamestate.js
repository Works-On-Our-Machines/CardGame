export const gameState = {
  selectedCardIndex: null,
  turnPhase: "PLAY",

  player: {
    hp: 10,
    maxHp: 10,
    energy: 1,
    energyGain: 1,
    maxEnergy: 3,
    cardDrawPerTurn: 1,
    cardsDrawnThisTurn: 0,
    initialCardDraw: 3,
  },

  enemy: {
    hp: 10,
    maxHp: 10,
  },

  board: {
    enemyBack: [null, null, null, null],
    enemyFront: [null, null, null, null],
    playerFront: [null, null, null, null],
  },

  drawPile: [],
  freePile: [],
  hand: [],
  discardPile: [],

  resetBoard() {
    this.selectedCardIndex = null;
    this.turnPhase = "PLAY"; // Reset phase

    this.player.hp = 10;
    this.player.energy = 1;
    this.player.cardsDrawnThisTurn = 0; // Reset draw tracker

    this.enemy.hp = 10;
    this.enemy.energy = 3;

    this.board.enemyBack = [null, null, null, null];
    this.board.enemyFront = [null, null, null, null];
    this.board.playerFront = [null, null, null, null];

    this.drawPile = [];
    this.freePile = []; // Clear free pile
    this.hand = [];
    this.discardPile = [];
  },
};
