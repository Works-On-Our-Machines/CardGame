import { executeSideCombat } from "../combat.js";

export async function handleEndTurn() {
  // Disable the End Turn button so the player can't click it during animations
  setEndTurnButtonState(false);

  // -------------------------------------------------------------
  // STEP 3: PLAYER COMBAT PHASE
  // -------------------------------------------------------------
  // Only player cards attack right now.
  await executeSideCombat("player");

  // Check if CPU died from player's attack
  if (gameState.enemy.hp <= 0) {
    handleMatchEnd(true); // Player Wins!
    return;
  }

  // -------------------------------------------------------------
  // STEP 4: CPU TURN
  // -------------------------------------------------------------
  // 4a. Move backline cards forward into empty frontline slots
  await moveCpuBacklineForward();

  // 4b. CPU plays new cards into the backline from its deck/hand
  await executeCpuAIPlayCards();

  // 4c/d. CPU COMBAT PHASE - Now CPU cards attack!
  await executeSideCombat("enemy");

  // Check if Player died from CPU's attack
  if (gameState.player.hp <= 0) {
    handleMatchEnd(false); // Player Lost!
    return;
  }

  // -------------------------------------------------------------
  // STEP 5: RETURN TURN TO PLAYER
  // -------------------------------------------------------------
  startPlayerTurn();
  setEndTurnButtonState(true); // Re-enable End Turn button
}
