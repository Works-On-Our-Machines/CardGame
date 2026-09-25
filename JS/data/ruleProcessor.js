import { RuleDictionary } from "./ruleDictionary.js";

/**
 * Utility: Extracts an array of normalized rule string keys from any card format
 */
export function getCardRules(card) {
  if (!card) return [];
  const raw = card.specialRules ?? card.specials ?? card.specialRule ?? [];
  const rulesArray = Array.isArray(raw) ? raw : [raw];

  return rulesArray
    .filter((r) => typeof r === "string" && r.trim() !== "" && r !== "None")
    .map((r) => r.trim());
}

/**
 * Utility: Returns true if the card has a specific special rule (case-insensitive)
 */
export function hasRule(card, ruleName) {
  if (!card || !ruleName) return false;
  const rules = getCardRules(card);
  const target = ruleName.toLowerCase();

  return rules.some((r) => r.toLowerCase() === target);
}

/**
 * Triggers an event hook on a single card (e.g., 'onDeath', 'onTakeDamage', 'onDealDamage')
 */
export function triggerRuleHook(hookName, card, gameState, ...args) {
  if (!card) return;

  const rules = getCardRules(card);

  rules.forEach((ruleName) => {
    // Case-insensitive dictionary lookup
    const formattedKey = Object.keys(RuleDictionary).find(
      (key) => key.toLowerCase() === ruleName.toLowerCase(),
    );

    const ruleLogic = RuleDictionary[formattedKey];

    if (ruleLogic && typeof ruleLogic[hookName] === "function") {
      ruleLogic[hookName](card, gameState, ...args);
    }
  });
}

/**
 * Processes end-of-turn hooks for all cards in a player's or enemy's lane
 */
export function processTurnEndRules(gameState, side) {
  const laneKey = side === "player" ? "playerFront" : "enemyFront";
  const lane = gameState.board[laneKey];

  if (!lane) return;

  for (let slotIndex = 0; slotIndex < lane.length; slotIndex++) {
    const card = lane[slotIndex];
    if (card) {
      triggerRuleHook("onTurnEnd", card, gameState, side, slotIndex);
    }
  }
}
