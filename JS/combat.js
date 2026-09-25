// JS/combat.js
import { gameState } from "./state/gamestate.js";
import { renderStatsUI } from "./controllers/boardController.js";
import { createCard } from "./cardCreator.js";
import { showRewardScreen } from "./controllers/rewardController.js";
import { showMapView } from "./main.js";
import {
  hasRule,
  triggerRuleHook,
  processTurnEndRules,
} from "./data/ruleProcessor.js";

// Helper to pause execution for visual pacing
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * EXPORTED: Executes combat for ONE side ("player" or "enemy")
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
    if (
      !attackerCard ||
      getEffectiveAtk(attackerCard, slotIndex, boardLane) <= 0
    )
      continue;

    highlightSlot(isPlayer ? "PlayerFront" : "enemyFront", slotIndex, true);

    await executeCardAttack(attackerCard, slotIndex, attackerSide);

    highlightSlot(isPlayer ? "PlayerFront" : "enemyFront", slotIndex, false);

    if (gameState.isCombatOver) break;
  }
}

/**
 * Calculates attack including Leader bonus (+1 ATK per adjacent Leader card)
 */
function getEffectiveAtk(card, slotIndex, lane) {
  if (!card) return 0;
  let bonus = 0;

  const leftCard = lane[slotIndex - 1];
  const rightCard = lane[slotIndex + 1];

  if (hasRule(leftCard, "leader")) bonus += 1;
  if (hasRule(rightCard, "leader")) bonus += 1;

  return card.atk + bonus;
}

/**
 * Handles attack patterns (straight, bifurcated, trifurcated) and multi-strikes (double_strike)
 */
async function executeCardAttack(attacker, slotIndex, attackerSide) {
  const isPlayer = attackerSide === "player";

  const defenderFrontKey = isPlayer ? "enemyFront" : "playerFront";
  const defenderBackKey = isPlayer ? "enemyBack" : null;
  const defenderFace = isPlayer ? gameState.enemy : gameState.player;
  const attackerFace = isPlayer ? gameState.player : gameState.enemy;

  // 1. Target Slots
  let targetSlots = [slotIndex];

  if (
    hasRule(attacker, "bifurcated") ||
    hasRule(attacker, "bifurcated strike")
  ) {
    targetSlots = [slotIndex - 1, slotIndex + 1].filter(
      (idx) => idx >= 0 && idx < 4,
    );
  } else if (
    hasRule(attacker, "trifurcated") ||
    hasRule(attacker, "trifurcated strike")
  ) {
    targetSlots = [slotIndex - 1, slotIndex, slotIndex + 1].filter(
      (idx) => idx >= 0 && idx < 4,
    );
  }

  // 2. Hits Per Target
  const hitCount = hasRule(attacker, "double_strike") ? 2 : 1;

  // 3. Execute Hits
  for (let hit = 0; hit < hitCount; hit++) {
    for (const targetIdx of targetSlots) {
      if (gameState.isCombatOver) return;

      await resolveSingleHit(
        attacker,
        slotIndex,
        targetIdx,
        defenderFrontKey,
        defenderBackKey,
        defenderFace,
        attackerFace,
        attackerSide,
      );
      await delay(250);
    }
  }

  await delay(350);
}

/**
 * Target Resolution: Airborne / Winged Defender logic
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

  // AIRBORNE / FLYING LOGIC
  if (hasRule(attacker, "airborne") || hasRule(attacker, "flying")) {
    if (
      hasRule(frontCard, "winged defender") ||
      hasRule(frontCard, "mighty_leap")
    ) {
      return {
        type: "card",
        card: frontCard,
        laneKey: defenderFrontKey,
        index: targetSlotIdx,
      };
    }
    if (
      hasRule(backCard, "winged defender") ||
      hasRule(backCard, "mighty_leap")
    ) {
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
 * Resolves damage, rule hooks (Shell, Deadly, Vampiric, Spikey, Sacrificial, Unkillable), and overflow
 */
async function resolveSingleHit(
  attacker,
  attackerSlotIdx,
  targetSlotIdx,
  defenderFrontKey,
  defenderBackKey,
  defenderFace,
  attackerFace,
  attackerSide,
) {
  const attackerLaneKey =
    attackerSide === "player" ? "playerFront" : "enemyFront";
  const attackerLane = gameState.board[attackerLaneKey];
  const attackPower = getEffectiveAtk(attacker, attackerSlotIdx, attackerLane);

  const target = resolveTargetForSlot(
    attacker,
    targetSlotIdx,
    defenderFrontKey,
    defenderBackKey,
  );

  // A) TARGET IS FACE
  if (target.type === "face") {
    defenderFace.hp -= attackPower;
    console.log(`${attacker.name} dealt ${attackPower} damage to Face!`);

    renderStatsUI();
    updateBoardSlotsUI();
    checkVictoryConditions();
    return;
  }

  // B) TARGET IS A CARD
  const targetCard = target.card;
  const defenderSide = attackerSide === "player" ? "enemy" : "player";

  // Build Damage Context Object for Hook Mutations
  const damageContext = {
    amount: attackPower,
    cancelled: false,
    actualDealt: 0,
  };

  // 1. PRE-DAMAGE: Target Hook (e.g. Shell, Spikey)
  triggerRuleHook(
    "onTakeDamage",
    targetCard,
    gameState,
    attacker,
    damageContext,
    attackerSide,
  );

  if (damageContext.cancelled) {
    updateBoardSlotsUI();
    return;
  }

  // Check if attacker died from Spikey recoil before striking
  if (attacker.hp <= 0) {
    console.log(
      `${attacker.name} perished from recoil before completing strike!`,
    );
    gameState.board[attackerLaneKey][attackerSlotIdx] = null;
    triggerRuleHook("onDeath", attacker, gameState, attackerSide);
    updateBoardSlotsUI();
    checkVictoryConditions();
    return;
  }

  // 2. PRE-DAMAGE: Attacker Hook (e.g. Deadly)
  triggerRuleHook(
    "onDealDamage",
    attacker,
    gameState,
    targetCard,
    damageContext,
  );

  // 3. APPLY DAMAGE
  const hpBeforeHit = targetCard.hp;
  targetCard.hp -= damageContext.amount;
  damageContext.actualDealt = Math.min(damageContext.amount, hpBeforeHit);

  console.log(
    `${attacker.name} hit ${targetCard.name} for ${damageContext.amount} damage!`,
  );

  // 4. POST-DAMAGE: Attacker Hook (e.g. Vampiric)
  triggerRuleHook(
    "onDealDamage",
    attacker,
    gameState,
    targetCard,
    damageContext,
  );

  // 5. TARGET DEATH PROCESSING
  if (targetCard.hp <= 0) {
    const excessDamage = Math.abs(targetCard.hp);
    console.log(`${targetCard.name} was destroyed!`);

    gameState.board[target.laneKey][target.index] = null;
    triggerRuleHook("onDeath", targetCard, gameState, defenderSide);

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
          triggerRuleHook("onDeath", backCard, gameState, defenderSide);
        }
      }
    }
  }

  updateBoardSlotsUI();
  checkVictoryConditions();
}

/**
 * EXPORTED: Call this at the end of a turn to execute turn-end rules across the board
 */
export function processEndOfTurnRules(side) {
  processTurnEndRules(gameState, side);
  updateBoardSlotsUI();
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
        currency: totalGold,
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
