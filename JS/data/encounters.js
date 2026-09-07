/**
 * ENCOUNTER TEMPLATE
 * Copy and fill this structure out for each custom fight.
 */
export const encounterTemplate = {
  id: "encounter_id_here",
  name: "Encounter Name",
  surrenderTurn: 0, // Turn when CPU offers surrender (0 = disabled)

  // Initial board layout at match start (Turn 0)
  // Use card string IDs matching cardsdatabase.js, or null for empty slots
  startingFrontline: [null, null, null, null],
  startingBackline: [null, null, null, null],

  phases: [
    {
      phaseId: 1,
      name: "Phase 1",

      // Conditions to advance to Phase 2:
      // Valid types:
      // - { type: "deck_empty" }
      // - { type: "hp_below", threshold: 5 }
      // - { type: "turn_count", threshold: 4 }
      transitionTriggers: [{ type: "deck_empty" }],

      isOrderedPlay: false, // false = shuffle deck on phase start; true = draw in exact order
      drawRange: [1, 2], // [min, max] cards drawn and played each turn
      rampUpEveryXTurns: 0, // Every X turns, increase draw count (0 = disabled)
      rampUpBonus: 0, // Extra cards added to draw count when ramping up
      deckId: "deck_id_here", // Key pointing to JS/data/encounterDecks.js
    },
  ],
};

export const testEncounter01 = {
  id: "0001",
  name: "Test Encounter",
  surrenderTurn: 8, // Turn when CPU offers surrender (0 = disabled)

  // Initial board layout at match start (Turn 0)
  // Use card string IDs matching cardsdatabase.js, or null for empty slots
  startingFrontline: ["card_001", null, null, null],
  startingBackline: [null, "card_001", null, null],

  phases: [
    {
      phaseId: 1,
      name: "Phase 1",

      // Conditions to advance to Phase 2:
      // Valid types:
      // - { type: "deck_empty" }
      // - { type: "hp_below", threshold: 5 }
      // - { type: "turn_count", threshold: 4 }
      transitionTriggers: [{ type: "deck_empty" }],

      isOrderedPlay: false, // false = shuffle deck on phase start; true = draw in exact order
      drawRange: [1, 2], // [min, max] cards drawn and played each turn
      rampUpEveryXTurns: 0, // Every X turns, increase draw count (0 = disabled)
      rampUpBonus: 0, // Extra cards added to draw count when ramping up
      deckId: "test_deck_01", // Key pointing to JS/data/encounterDecks.js
    },
    {
      phaseId: 2,
      name: "Phase 2: Aggressive Rush",
      transitionTriggers: [], // Final phase
      isOrderedPlay: true, // Draws in exact array order from test_deck_boss
      drawRange: [2, 2],
      rampUpEveryXTurns: 0,
      rampUpBonus: 0,
      deckId: "test_deck_boss",
    },
  ],
};

/**
 * ENCOUNTER REGISTRY
 * Store all your active encounters here for easy lookup by ID.
 */
export const encounters = {
  [testEncounter01.id]: testEncounter01,
  // Add your designed encounters here...
};
