import { cardDatabase } from "./cardsdatabase.js";
/**
 * ENCOUNTER DECKS REGISTRY
 * Maps unique deck IDs to arrays of card string IDs defined in cardsdatabase.js.
 * Encounter phases in encounters.js reference these deck IDs.
 */
export const encounterDecks = {
  // Phase 1 testing deck: Low-level aggressive minions
  test_deck_01: ["card_001", "card_001"],

  // Phase 2 testing deck: Heavier unit / Boss phase
  test_deck_boss: ["card_001", "card_002", "card_003"],

  // Alternative testing deck: Beast theme
  test_pack_basic: ["card_003", "card_003", "card_003", "card_004"],
};
