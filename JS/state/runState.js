import { getStarterDeckCards } from "../data/playerDeck.js";

export const runState = {
  currency: 0,
  artefacts: [],
  consumables: [],
  masterDeck: [],
  freeDeckCount: 10,
  currentHP: 10,
  maxHP: 10,
  floor: 0,

  // --- Map & Progression State ---
  mapData: [],
  currentNodeId: null,
  visitedNodeIds: [],
  visitedEvents: [],

  // --- Backward Compatibility Safeguards ---
  get deck() {
    return this.masterDeck;
  },

  initNewRun() {
    this.currency = 50;
    this.currentHP = 10;
    this.maxHP = 10;
    this.floor = 0;
    this.artefacts = [];
    this.consumables = [];
    this.masterDeck = getStarterDeckCards().map((card) => ({ ...card }));
    this.visitedEvents = [];

    // Reset Map State
    this.mapData = [];
    this.currentNodeId = null;
    this.visitedNodeIds = [];
  },

  setMap(generatedMap) {
    this.mapData = generatedMap;
    this.currentNodeId = null;
    this.visitedNodeIds = [];
  },

  selectNode(nodeId) {
    let targetNode = null;

    this.mapData.forEach((row) => {
      row.nodes.forEach((node) => {
        if (node.id === nodeId) {
          targetNode = node;
        } else if (node.status === "available") {
          node.status = "locked";
        }
      });
    });

    if (!targetNode) return null;

    targetNode.status = "completed";
    this.currentNodeId = targetNode.id;
    this.visitedNodeIds.push(targetNode.id);

    const childIds = targetNode.connections || [];
    this.mapData.forEach((row) => {
      row.nodes.forEach((node) => {
        if (childIds.includes(node.id)) {
          node.status = "available";
        }
      });
    });

    return targetNode;
  },

  getCurrentNode() {
    if (!this.currentNodeId) return null;
    for (const row of this.mapData) {
      const found = row.nodes.find((n) => n.id === this.currentNodeId);
      if (found) return found;
    }
    return null;
  },

  recordVisitedEvent(eventId) {
    if (eventId && !this.visitedEvents.includes(eventId)) {
      this.visitedEvents.push(eventId);
    }
  },

  /**
   * Safely modifies persistent HP within allowable bounds (0 - maxHP)
   */
  modifyHP(amount) {
    this.currentHP = Math.min(this.maxHP, Math.max(0, this.currentHP + amount));
    return this.currentHP;
  },
};
