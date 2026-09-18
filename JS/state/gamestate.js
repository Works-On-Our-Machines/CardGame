import { runState } from "./runState.js";

export const gameState = {
  selectedCardIndex: null,
  turnPhase: "PLAY",
  isCombatOver: false,

  player: {
    hp: 10,
    maxHp: 10,
    energy: 1,
    startingEnergy: 2,
    energyGain: 1,
    maxEnergy: 3,
    cardDrawPerTurn: 1,
    cardsDrawnThisTurn: 0,
    initialCardDraw: 3,
  },

  enemy: {
    hp: 10,
    maxHp: 10,
    energy: 3,
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

  /**
   * Pulls persistent player stats and deck from runState, reset tactical combat parameters,
   * and accepts dynamic enemy encounter data.
   */
  initCombat(enemyData = {}) {
    this.selectedCardIndex = null;
    this.turnPhase = "DRAW";
    this.isCombatOver = false;

    // 1. Inherit health state from persistent runState
    this.player.hp = runState.currentHP;
    this.player.maxHp = runState.maxHP;
    this.player.energy = this.player.startingEnergy;
    this.player.cardsDrawnThisTurn = 0;

    // 2. Set enemy parameters dynamically based on encounter data
    this.enemy.hp = enemyData.hp || 10;
    this.enemy.maxHp = enemyData.maxHp || enemyData.hp || 10;
    this.enemy.energy = enemyData.energy || 3;

    // 3. Clear board grid
    this.board.enemyBack = [null, null, null, null];
    this.board.enemyFront = [null, null, null, null];
    this.board.playerFront = [null, null, null, null];

    // 4. Clone master deck into tactical combat draw pile
    this.drawPile = runState.masterDeck.map((card) => ({ ...card }));
    this.freePile = [];
    this.hand = [];
    this.discardPile = [];
  },

  /**
   * Alias for backward compatibility
   */
  resetBoard(enemyData = {}) {
    this.initCombat(enemyData);
  },

  /**
   * Commits combat health back to runState (call when damage is taken or combat ends)
   */
  syncHealthToRun() {
    runState.currentHP = Math.max(0, this.player.hp);
  },
};
