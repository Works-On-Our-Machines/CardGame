import { executeSideCombat } from "../combat.js";
import { setEndTurnButtonState, startPlayerTurn } from "./boardController.js";
import { executeCpuTurn } from "./cpuController.js"; // ◄ Import here

export async function handleEndTurn() {
  setEndTurnButtonState(false);

  // 1. Player Combat Phase
  console.log("--- PLAYER COMBAT PHASE ---");
  await executeSideCombat("player");

  // 2. CPU Turn Phase (Shifts backline, checks phases, plays cards)
  console.log("--- CPU TURN PHASE ---");
  await executeCpuTurn();

  // 3. CPU Combat Phase
  console.log("--- CPU COMBAT PHASE ---");
  await executeSideCombat("enemy");

  // 4. Start New Player Turn
  console.log("--- NEW PLAYER TURN ---");
  startPlayerTurn();

  setEndTurnButtonState(true);
}
