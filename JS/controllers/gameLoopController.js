// JS/controllers/gameLoopController.js

import { gameState } from "../state/gamestate.js";
import { executeSideCombat, checkVictoryConditions } from "../combat.js";
import { setEndTurnButtonState, renderStatsUI } from "./boardController.js";
import { executeCpuTurn } from "./cpuController.js";
import { triggerArtefactHook } from "./artefactProcessor.js";

export async function handleEndTurn() {
  setEndTurnButtonState(false);

  // 1. Player Combat Phase (Player attacks CPU)
  console.log("--- PLAYER COMBAT PHASE ---");
  await executeSideCombat("player");

  // Check if player attacks defeated the CPU
  checkVictoryConditions();
  if (gameState.isCombatOver) return; // Stop turn execution immediately on victory

  // 2. CPU Turn Phase (Shifts backline, checks surrender/phases, plays cards)
  console.log("--- CPU TURN PHASE ---");
  await executeCpuTurn();

  // Check if CPU surrendered during its turn phase
  if (gameState.isCombatOver) return;

  // 3. CPU Combat Phase (CPU attacks Player)
  console.log("--- CPU COMBAT PHASE ---");
  await executeSideCombat("enemy");

  // Check if CPU attacks killed the player or triggered counter-damage victory
  checkVictoryConditions();
  if (gameState.isCombatOver) return; // Stop turn execution immediately on victory/defeat

  // 4. Start New Player Turn
  console.log("--- NEW PLAYER TURN ---");
  startPlayerTurn();
}

export function startPlayerTurn() {
  gameState.player.energy = gameState.player.maxEnergy; // base energy
  triggerArtefactHook("onTurnStart", gameState); // artefact modifications
  renderStatsUI();
}
