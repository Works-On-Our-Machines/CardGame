// JS/state/runState.js
import { getStarterDeckCards } from "../data/playerDeck.js";

export const runState = {
  currency: 0,
  relics: [],
  consumables: [],
  masterDeck: [],
  freeDeckCount: 10,
  currentHP: 10,
  maxHP: 10,

  // --- Map & Progression State ---
  mapData: [], // Stores full 15-floor grid
  currentNodeId: null, // Active node ID (e.g. "0_0")
  visitedNodeIds: [], // Sequence of completed node IDs

  initNewRun() {
    this.currency = 50;
    this.currentHP = 10;
    this.maxHP = 10;
    this.relics = [];
    this.consumables = [];
    this.masterDeck = getStarterDeckCards().map((card) => ({ ...card }));

    // Reset Map State
    this.mapData = [];
    this.currentNodeId = null;
    this.visitedNodeIds = [];
  },

  /**
   * Stores freshly generated map in state.
   */
  setMap(generatedMap) {
    this.mapData = generatedMap;
    this.currentNodeId = null;
    this.visitedNodeIds = [];
  },

  /**
   * Selects an available node, marks it completed, locks unchosen choices,
   * and sets connected child nodes to available.
   * @param {string} nodeId - Target node ID
   * @returns {Object|null} Selected node object
   */
  
  selectNode(nodeId) {
    let targetNode = null;

    // 1. Lock out all currently available nodes across the map
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

    // 2. Mark selected node as completed & update tracking history
    targetNode.status = "completed";
    this.currentNodeId = targetNode.id;
    this.visitedNodeIds.push(targetNode.id);

    // 3. Unlock child nodes connected to selected node
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

  /**
   * Utility to retrieve active node object.
   */
  getCurrentNode() {
    if (!this.currentNodeId) return null;
    for (const row of this.mapData) {
      const found = row.nodes.find((n) => n.id === this.currentNodeId);
      if (found) return found;
    }
    return null;
  },
};
