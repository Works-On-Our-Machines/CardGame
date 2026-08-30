import { executeSideCombat } from "../combat.js";
import { setEndTurnButtonState, startPlayerTurn } from "./boardController.js";

export async function handleEndTurn() {
  // 1. Lock the UI during combat
  setEndTurnButtonState(false);

  // 2. Player Combat Phase
  console.log("--- PLAYER COMBAT PHASE ---");
  await executeSideCombat("player");

  // 3. CPU Turn Setup (Placeholder for now)
  console.log("--- CPU TURN PHASE ---");
  // TODO: Move backline forward
  // TODO: Play new cards

  // 4. CPU Combat Phase
  console.log("--- CPU COMBAT PHASE ---");
  await executeSideCombat("enemy");

  // 5. Pass turn back to player
  console.log("--- NEW PLAYER TURN ---");
  startPlayerTurn();

  // 6. Unlock the UI
  setEndTurnButtonState(true);
}
