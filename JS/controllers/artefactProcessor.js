// JS/controllers/artefactProcessor.js
import { ArtefactDictionary } from "./artefactDictionary.js";
import { runState } from "../state/runState.js"; // ◄ IMPORT THE "SAVE FILE"

/**
 * Triggers a hook across all artefacts currently owned by the player
 */
export function triggerArtefactHook(hookName, gameStateContext, ...args) {
  // 1. Read owned artefacts from the persistent runState
  const playerArtefacts = runState.artefacts;
  if (!Array.isArray(playerArtefacts) || playerArtefacts.length === 0) return;

  playerArtefacts.forEach((artefactData) => {
    // 2. Safely extract the ID, handling both string IDs and object structures
    const id =
      typeof artefactData === "string" ? artefactData : artefactData?.id;
    if (!id) return;

    const artefactLogic = ArtefactDictionary[id];

    // 3. If the artefact has this hook, fire it and pass in the combat state!
    if (artefactLogic && typeof artefactLogic[hookName] === "function") {
      artefactLogic[hookName](gameStateContext, ...args);
    }
  });
}

/**
 * Utility: Grants an artefact to the player (prevents duplicates)
 */
export function addArtefactToPlayer(artefactId) {
  if (!runState.artefacts) {
    runState.artefacts = [];
  }

  // Check if player already owns this artefact (handling both strings and objects)
  const alreadyOwns = runState.artefacts.some(
    (art) => (typeof art === "string" ? art : art.id) === artefactId,
  );

  if (!alreadyOwns) {
    // Store as an object so it matches eventController's format
    runState.artefacts.push({ id: artefactId });
    console.log(`[Artefact] Player acquired: ${artefactId}`);

    // Fire immediate acquisition hook if applicable
    const logic = ArtefactDictionary[artefactId];
    if (logic && typeof logic.onAcquire === "function") {
      // Pass runState here, since onAcquire usually affects permanent stats (like +Max HP)
      logic.onAcquire(runState);
    }
  }
}
