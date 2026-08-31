import { gameState } from "./state/gameState.js";
import { renderStatsUI } from "./controllers/boardController.js";
import { createCard } from "./cardCreator.js";

// Helper to pause execution for visual pacing
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to check card specials array safely
function hasSpecial(card, rule) {
  return card?.specials?.includes(rule) ?? false;
}

/**
 * EXPORTED: Executes combat for ONE side ("player" or "enemy")
 * Called directly by gameLoopController.js
 */
export async function executeSideCombat(attackerSide) {
  const isPlayer = attackerSide === "player";
  const boardLane = isPlayer
    ? gameState.board.playerFront
    : gameState.board.enemyFront;

  console.log(`--- Starting ${attackerSide.toUpperCase()} Combat Phase ---`);

  for (let slotIndex = 0; slotIndex < 4; slotIndex++) {
    const attackerCard = boardLane[slotIndex];

    // Skip empty slots or cards with 0 ATK
    if (!attackerCard || attackerCard.atk <= 0) continue;

    // Highlight active attacking slot visually (optional polish)
    highlightSlot(isPlayer ? "PlayerFront" : "enemyFront", slotIndex, true);

    // Execute attack(s) for this specific card
    await executeCardAttack(attackerCard, slotIndex, attackerSide);

    highlightSlot(isPlayer ? "PlayerFront" : "enemyFront", slotIndex, false);
  }
}

/**
 * Handles attack patterns (straight, bifurcated) and multi-strikes (double_strike)
 */
async function executeCardAttack(attacker, slotIndex, attackerSide) {
  const isPlayer = attackerSide === "player";

  // Define opponent target parameters
  const defenderFrontKey = isPlayer ? "enemyFront" : "playerFront";
  const defenderBackKey = isPlayer ? "enemyBack" : null; // Player currently has 1 row
  const defenderFace = isPlayer ? gameState.enemy : gameState.player;

  // 1. Determine Target Slots (Default: straight ahead)
  let targetSlots = [slotIndex];

  if (hasSpecial(attacker, "bifurcated")) {
    // Mantis style: diagonal left and diagonal right
    targetSlots = [slotIndex - 1, slotIndex + 1].filter(
      (idx) => idx >= 0 && idx < 4,
    );
  } else if (hasSpecial(attacker, "trifurcated")) {
    // Mantis God style: diagonal left, straight, diagonal right
    targetSlots = [slotIndex - 1, slotIndex, slotIndex + 1].filter(
      (idx) => idx >= 0 && idx < 4,
    );
  }

  // 2. Determine Hits Per Target (Default: 1 hit)
  const hitCount = hasSpecial(attacker, "double_strike") ? 2 : 1;

  // 3. Execute Attacks
  for (let hit = 0; hit < hitCount; hit++) {
    for (const targetIdx of targetSlots) {
      await resolveSingleHit(
        attacker,
        targetIdx,
        defenderFrontKey,
        defenderBackKey,
        defenderFace,
      );
      await delay(250); // Pause between individual strikes
    }
  }

  await delay(350); // Pause before moving to the next attacking card slot
}

/**
 * Target Resolution: Decides what the attacker is actually hitting
 */
function resolveTargetForSlot(
  attacker,
  targetSlotIdx,
  defenderFrontKey,
  defenderBackKey,
) {
  const frontCard = gameState.board[defenderFrontKey]?.[targetSlotIdx];
  const backCard = defenderBackKey
    ? gameState.board[defenderBackKey]?.[targetSlotIdx]
    : null;

  // FLYING LOGIC: Bypasses ground cards unless blocked by Mighty Leap
  if (hasSpecial(attacker, "flying")) {
    if (hasSpecial(frontCard, "mighty_leap")) {
      return {
        type: "card",
        card: frontCard,
        laneKey: defenderFrontKey,
        index: targetSlotIdx,
      };
    }
    if (hasSpecial(backCard, "mighty_leap")) {
      return {
        type: "card",
        card: backCard,
        laneKey: defenderBackKey,
        index: targetSlotIdx,
      };
    }
    return { type: "face" };
  }

  // GROUND / STANDARD LOGIC
  if (frontCard) {
    return {
      type: "card",
      card: frontCard,
      laneKey: defenderFrontKey,
      index: targetSlotIdx,
    };
  }
  if (backCard) {
    return {
      type: "card",
      card: backCard,
      laneKey: defenderBackKey,
      index: targetSlotIdx,
    };
  }

  // Empty slot -> Hit Face
  return { type: "face" };
}

/**
 * Damage Calculation, Overflow, and Death Processing
 */
async function resolveSingleHit(
  attacker,
  targetSlotIdx,
  defenderFrontKey,
  defenderBackKey,
  defenderFace,
) {
  // Re-evaluate target on EVERY hit (for multi-strike)
  const target = resolveTargetForSlot(
    attacker,
    targetSlotIdx,
    defenderFrontKey,
    defenderBackKey,
  );

  // A) TARGET IS FACE
  if (target.type === "face") {
    defenderFace.hp = Math.max(0, defenderFace.hp - attacker.atk);
    console.log(`${attacker.name} dealt ${attacker.atk} damage to Face!`);
    renderStatsUI();
    updateBoardSlotsUI();
    return;
  }

  // B) TARGET IS A CARD
  const targetCard = target.card;
  const damage = attacker.atk;

  targetCard.hp -= damage;
  console.log(`${attacker.name} hit ${targetCard.name} for ${damage} damage!`);

  // Death Check
  if (targetCard.hp <= 0) {
    const excessDamage = Math.abs(targetCard.hp);
    console.log(`${targetCard.name} was destroyed!`);

    // Remove dead card from state
    gameState.board[target.laneKey][target.index] = null;

    // OVERFLOW LOGIC: Only overflows to backline if hitting front card and backline exists
    if (target.laneKey === defenderFrontKey && defenderBackKey) {
      const backCard = gameState.board[defenderBackKey]?.[target.index];

      if (backCard && excessDamage > 0) {
        backCard.hp -= excessDamage;
        console.log(
          `Excess damage (${excessDamage}) hit backline card ${backCard.name}!`,
        );

        if (backCard.hp <= 0) {
          console.log(`Backline card ${backCard.name} destroyed by overflow!`);
          gameState.board[defenderBackKey][target.index] = null;
        }
      }
    }
  }

  updateBoardSlotsUI(); // Refreshes HTML slots to reflect HP changes and card deaths
}

/**
 * Refreshes all board slots on screen to match gameState.board
 */
export function updateBoardSlotsUI() {
  const lanes = [
    { key: "playerFront", laneAttr: "PlayerFront" },
    { key: "enemyFront", laneAttr: "enemyFront" },
    { key: "enemyBack", laneAttr: "enemyBack" },
  ];

  lanes.forEach(({ key, laneAttr }) => {
    const laneData = gameState.board[key];
    if (!laneData) return;

    laneData.forEach((cardData, index) => {
      const slotEl = document.querySelector(
        `.card-slot[data-lane="${laneAttr}"][data-index="${index}"]`,
      );
      if (!slotEl) return;

      slotEl.innerHTML = ""; // Clear current contents

      if (cardData) {
        const cardEl = createCard(cardData);
        slotEl.appendChild(cardEl);
      } else {
        slotEl.textContent = "Empty Slot";
      }
    });
  });
}

/**
 * Optional visual feedback helper
 */
function highlightSlot(laneAttr, index, enable) {
  const slotEl = document.querySelector(
    `.card-slot[data-lane="${laneAttr}"][data-index="${index}"]`,
  );
  if (!slotEl) return;

  if (enable) {
    slotEl.style.boxShadow = "0 0 12px 3px #f39c12";
  } else {
    slotEl.style.boxShadow = "";
  }
}
