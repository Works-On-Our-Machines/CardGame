// runState.js
import { playerDeck, getStarterDeckCards } from "../data/playerDeck.js";

export const runState = {
  currency: 0,
  relics: [],
  consumables: [],
  masterDeck: [],
  freeDeckCount: 10,
  currentHP: 10,
  maxHP: 10,
  mapNodes: [],
  currentNodeId: null,

  initNewRun() {
    this.currency = 50;
    this.currentHP = 10;
    this.maxHP = 10;
    this.relics = [];
    this.consumables = [];
    this.mapNodes = [];
    this.currentNodeId = null;

    // Deep clone starter cards so combat state doesn't mutate templates
    this.masterDeck = getStarterDeckCards().map((card) => ({ ...card }));
  },
};
