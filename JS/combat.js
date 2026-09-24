import { gameState } from "./state/gamestate.js";
import { renderStatsUI } from "./controllers/boardController.js";
import { createCard } from "./cardCreator.js";
import { showRewardScreen } from "./controllers/rewardController.js";
import { showMapView } from "./main.js";

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

    // Highlight active attacking slot visually
    highlightSlot(isPlayer ? "PlayerFront" : "enemyFront", slotIndex, true);

    // Execute attack(s) for this specific card
    await executeCardAttack(attackerCard, slotIndex, attackerSide);

    highlightSlot(isPlayer ? "PlayerFront" : "enemyFront", slotIndex, false);

    // Stop phase if combat ended mid-lane
    if (gameState.isCombatOver) break;
  }
}

/**
 * Handles attack patterns (straight, bifurcated) and multi-strikes (double_strike)
 */
async function executeCardAttack(attacker, slotIndex, attackerSide) {
  const isPlayer = attackerSide === "player";

  // Define opponent target parameters
  const defenderFrontKey = isPlayer ? "enemyFront" : "playerFront";
  const defenderBackKey = isPlayer ? "enemyBack" : null;
  const defenderFace = isPlayer ? gameState.enemy : gameState.player;

  // 1. Determine Target Slots (Default: straight ahead)
  let targetSlots = [slotIndex];

  if (hasSpecial(attacker, "bifurcated")) {
    targetSlots = [slotIndex - 1, slotIndex + 1].filter(
      (idx) => idx >= 0 && idx < 4,
    );
  } else if (hasSpecial(attacker, "trifurcated")) {
    targetSlots = [slotIndex - 1, slotIndex, slotIndex + 1].filter(
      (idx) => idx >= 0 && idx < 4,
    );
  }

  // 2. Determine Hits Per Target (Default: 1 hit)
  const hitCount = hasSpecial(attacker, "double_strike") ? 2 : 1;

  // 3. Execute Attacks
  for (let hit = 0; hit < hitCount; hit++) {
    for (const targetIdx of targetSlots) {
      if (gameState.isCombatOver) return;

      await resolveSingleHit(
        attacker,
        targetIdx,
        defenderFrontKey,
        defenderBackKey,
        defenderFace,
      );
      await delay(250);
    }
  }

  await delay(350);
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

  // FLYING LOGIC
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

  // GROUND LOGIC
  if (frontCard) {
    return {
      type: "card",
      card: frontCard,
      laneKey: defenderFrontKey,
      index: targetSlotIdx,
    };
  }

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
  const target = resolveTargetForSlot(
    attacker,
    targetSlotIdx,
    defenderFrontKey,
    defenderBackKey,
  );

  // A) TARGET IS FACE
  if (target.type === "face") {
    defenderFace.hp -= attacker.atk;

    console.log(`${attacker.name} dealt ${attacker.atk} damage to Face!`);
    renderStatsUI();
    updateBoardSlotsUI();
    checkVictoryConditions();
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

    gameState.board[target.laneKey][target.index] = null;

    // OVERFLOW LOGIC
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

  updateBoardSlotsUI();
  checkVictoryConditions();
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

      slotEl.innerHTML = "";

      if (cardData) {
        const cardEl = createCard(cardData);
        slotEl.appendChild(cardEl);
      } else {
        slotEl.textContent = "Empty Slot";
      }
    });
  });
}

function highlightSlot(laneAttr, index, enable) {
  const slotEl = document.querySelector(
    `.card-slot[data-lane="${laneAttr}"][data-index="${index}"]`,
  );
  if (!slotEl) return;

  slotEl.style.boxShadow = enable ? "0 0 12px 3px #f39c12" : "";
}

export function checkVictoryConditions() {
  if (gameState.isCombatOver) return;

  const enemyHp = gameState.enemy?.hp;
  const playerHp = gameState.player?.hp;

  if (enemyHp !== undefined && enemyHp <= 0) {
    gameState.isCombatOver = true;

    const overkillDamage = Math.abs(enemyHp);
    const baseGold = gameState.currentEncounterType === "elite" ? 50 : 25;
    const totalGold = baseGold + overkillDamage;

    console.log(
      `Enemy defeated! Overkill: ${overkillDamage}. Gold awarded: ${totalGold}`,
    );

    disableCombatInputs();

    setTimeout(() => {
      showRewardScreen({
        gold: totalGold,
        choices: 3,
        rarity: gameState.currentEncounterType === "elite" ? "rare" : "any",
      });
    }, 600);
  } else if (playerHp !== undefined && playerHp <= 0) {
    gameState.isCombatOver = true;
    disableCombatInputs();

    setTimeout(() => {
      handleGameOver();
    }, 600);
  }
}

function handleGameOver() {
  console.log("Game Over! Returning to start area...");
  alert("Game Over! Your run has ended.");
  showMapView();
}

function disableCombatInputs() {
  const endTurnBtn = document.getElementById("end-turn-btn");
  if (endTurnBtn) endTurnBtn.disabled = true;

  const boardEl = document.getElementById("board-container");
  if (boardEl) boardEl.style.pointerEvents = "none";
}
