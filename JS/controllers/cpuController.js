import { gameState } from "../state/gameState.js";
import { encounters } from "../data/encounters.js";
import { encounterDecks } from "../data/encounterDecks.js";
import { cardDatabase } from "../data/cardsdatabase.js";
import { updateBoardSlotsUI } from "../combat.js";

// Internal CPU State Tracker
let currentEncounter = null;
let currentPhaseIndex = 0;
let currentCpuDeck = [];
let cpuTurnCount = 0;
let surrenderPromptShown = false;

/**
 * Helper to clone a fresh card object from carddatabase.js
 */
function createCardInstance(cardId) {
  if (!cardId) return null;

  const template = cardDatabase.find((card) => card.id === cardId);

  if (!template) {
    console.error(`Card ID "${cardId}" not found in carddatabase.js!`);
    return null;
  }
  // Return deep copy so HP changes don't mutate the database template
  return { ...template, id: cardId };
}

/**
 * 1. ENCOUNTER INITIALIZATION
 * Call this when starting a battle to load initial board & deck setup.
 */
export function loadEncounter(encounterId) {
  currentEncounter = encounters[encounterId];
  if (!currentEncounter) {
    console.error(`Encounter "${encounterId}" not found in encounters.js!`);
    return;
  }

  currentPhaseIndex = 0;
  cpuTurnCount = 0;
  surrenderPromptShown = false;

  // Load Phase 1 Deck
  loadPhaseDeck(0);

  // Setup initial board slots before Turn 1
  setupInitialBoard();
}

function loadPhaseDeck(phaseIdx) {
  const phase = currentEncounter.phases[phaseIdx];
  if (!phase) return;

  const rawDeck = encounterDecks[phase.deckId] || [];
  // Clone deck array so original blueprint isn't mutated
  currentCpuDeck = [...rawDeck];

  if (!phase.isOrderedPlay) {
    shuffleArray(currentCpuDeck);
  }
}

function setupInitialBoard() {
  if (!currentEncounter) return;

  // Populate frontline starting cards
  currentEncounter.startingFrontline.forEach((cardId, slotIdx) => {
    gameState.board.enemyFront[slotIdx] = createCardInstance(cardId);
  });

  // Populate backline starting cards
  currentEncounter.startingBackline.forEach((cardId, slotIdx) => {
    gameState.board.enemyBack[slotIdx] = createCardInstance(cardId);
  });

  updateBoardSlotsUI();
}

/**
 * 2. BACKLINE SHIFTING LOGIC
 * Slides cards from enemyBack into empty enemyFront slots directly ahead of them.
 */
export function moveCpuBacklineForward() {
  for (let slotIdx = 0; slotIdx < 4; slotIdx++) {
    const frontSlot = gameState.board.enemyFront[slotIdx];
    const backSlot = gameState.board.enemyBack[slotIdx];

    // If front is empty and back has a card, slide it forward
    if (!frontSlot && backSlot) {
      gameState.board.enemyFront[slotIdx] = backSlot;
      gameState.board.enemyBack[slotIdx] = null;
      console.log(
        `CPU moved ${backSlot.name} forward to Frontline Slot ${slotIdx}`,
      );
    }
  }

  updateBoardSlotsUI();
}

/**
 * 3. CPU TURN EXECUTION
 * Main entry point called by gameLoopController during CPU phase.
 */
export async function executeCpuTurn() {
  if (!currentEncounter) return;

  cpuTurnCount++;
  console.log(`--- CPU Turn ${cpuTurnCount} ---`);

  // A) Check Surrender Condition
  if (
    currentEncounter.surrenderTurn > 0 &&
    cpuTurnCount >= currentEncounter.surrenderTurn &&
    !surrenderPromptShown
  ) {
    surrenderPromptShown = true;
    const accepted = confirm(
      `${currentEncounter.name} is offering to surrender. Accept victory?`,
    );
    if (accepted) {
      console.log("Player accepted CPU surrender!");
      // TODO: Trigger match victory handler
      return;
    }
  }

  // B) Check Phase Transitions
  checkPhaseTransitions();

  // C) Shift Backline Cards Forward
  moveCpuBacklineForward();

  // D) Draw & Play Cards into Backline
  playCpuCards();

  updateBoardSlotsUI();
}

/**
 * Checks triggers to see if CPU advances to next phase.
 */
function checkPhaseTransitions() {
  const currentPhase = currentEncounter.phases[currentPhaseIndex];
  if (!currentPhase || !currentPhase.transitionTriggers.length) return;

  let shouldTransition = false;

  for (const trigger of currentPhase.transitionTriggers) {
    if (trigger.type === "deck_empty" && currentCpuDeck.length === 0) {
      shouldTransition = true;
    } else if (
      trigger.type === "hp_below" &&
      gameState.enemy.hp <= trigger.threshold
    ) {
      shouldTransition = true;
    } else if (
      trigger.type === "turn_count" &&
      cpuTurnCount >= trigger.threshold
    ) {
      shouldTransition = true;
    }
  }

  if (
    shouldTransition &&
    currentPhaseIndex + 1 < currentEncounter.phases.length
  ) {
    currentPhaseIndex++;
    console.log(
      `CPU transitioning to Phase ${currentPhaseIndex + 1}: ${currentEncounter.phases[currentPhaseIndex].name}`,
    );
    loadPhaseDeck(currentPhaseIndex);
  }
}

/**
 * Calculates card count, draws from deck, sorts priority, and places in backline.
 */
function playCpuCards() {
  const phase = currentEncounter.phases[currentPhaseIndex];
  if (!phase) return;

  // Calculate draw count with ramp-up bonus
  const [minDraw, maxDraw] = phase.drawRange;
  let cardsToDrawCount =
    Math.floor(Math.random() * (maxDraw - minDraw + 1)) + minDraw;

  if (phase.rampUpEveryXTurns > 0 && phase.rampUpBonus > 0) {
    const rampIncrements = Math.floor(cpuTurnCount / phase.rampUpEveryXTurns);
    cardsToDrawCount += rampIncrements * phase.rampUpBonus;
  }

  // Draw card IDs from CPU deck
  const drawnCardIds = [];
  for (let i = 0; i < cardsToDrawCount; i++) {
    if (currentCpuDeck.length > 0) {
      drawnCardIds.push(currentCpuDeck.shift());
    }
  }

  if (drawnCardIds.length === 0) return;

  // Instantiate cards and sort by priority tag (`isPriority: true` played first)
  const cardsToPlay = drawnCardIds
    .map((id) => createCardInstance(id))
    .filter(Boolean)
    .sort((a, b) => (b.isPriority ? 1 : 0) - (a.isPriority ? 1 : 0));

  // Place cards into backline
  for (const card of cardsToPlay) {
    const targetSlot = selectBacklineSlot();
    if (targetSlot !== -1) {
      gameState.board.enemyBack[targetSlot] = card;
      console.log(`CPU played ${card.name} to Backline Slot ${targetSlot}`);
    } else {
      console.log(
        `No open backline slots for ${card.name}, card wasted/retained.`,
      );
      break; // Backline is full
    }
  }
}

/**
 * Slot Selector: Pass 1 (Counter player), Pass 2 (Random open slot)
 */
function selectBacklineSlot() {
  const backSlots = gameState.board.enemyBack;
  const playerFrontSlots = gameState.board.playerFront;

  // Pass 1: Counter-player (slot opposite an occupied player slot where backline is empty)
  const counterSlots = [];
  for (let i = 0; i < 4; i++) {
    if (backSlots[i] === null && playerFrontSlots[i] !== null) {
      counterSlots.push(i);
    }
  }

  if (counterSlots.length > 0) {
    return counterSlots[Math.floor(Math.random() * counterSlots.length)];
  }

  // Pass 2: Fallback (any empty backline slot)
  const emptySlots = [];
  for (let i = 0; i < 4; i++) {
    if (backSlots[i] === null) {
      emptySlots.push(i);
    }
  }

  if (emptySlots.length > 0) {
    return emptySlots[Math.floor(Math.random() * emptySlots.length)];
  }

  return -1; // No empty backline slots
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
