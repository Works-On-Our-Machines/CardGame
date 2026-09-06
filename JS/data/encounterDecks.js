/**
 * ENCOUNTER DECKS REGISTRY
 * Maps unique deck IDs to arrays of card string IDs defined in cardsdatabase.js.
 * Encounter phases in encounters.js reference these deck IDs.
 */
export const encounterDecks = {
  // Phase 1 testing deck: Low-level aggressive minions
  test_deck_01: [
    "The Default Test Card",
    "The Default Test Card",
    "The Default Test Card",
    "The Default Test Card",
  ],

  // Phase 2 testing deck: Heavier unit / Boss phase
  test_deck_boss: [
    "The Aggressive Test Card",
    "The Aggressive Test Card",
    "The Aggressive Test Card",
  ],

  // Alternative testing deck: Beast theme
  wolf_pack_basic: [
    "The Defensive Test Card",
    "The Defensive Test Card",
    "The Defensive Test Card",
    "The Aggressive Test Card",
  ],
};
