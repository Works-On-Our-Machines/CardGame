// JS/systems/artefactProcessor.js
import { ArtefactDictionary } from "./artefactDictionary.js";

/**
 * Triggers a hook across all artefacts currently owned by the player
 */
export function triggerArtefactHook(hookName, gameState, ...args) {
  const playerArtefacts = gameState?.player?.artefacts;
  if (!Array.isArray(playerArtefacts) || playerArtefacts.length === 0) return;

  playerArtefacts.forEach((artefactId) => {
    // Extract ID string whether artefacts are stored as string IDs or objects
    const id = typeof artefactId === "string" ? artefactId : artefactId?.id;
    if (!id) return;

    const artefactLogic = ArtefactDictionary[id];

    if (artefactLogic && typeof artefactLogic[hookName] === "function") {
      artefactLogic[hookName](gameState, ...args);
    }
  });
}

/**
 * Utility: Grants an artefact to the player (prevents duplicates if needed)
 */
export function addArtefactToPlayer(gameState, artefactId) {
  if (!gameState.player.artefacts) {
    gameState.player.artefacts = [];
  }

  if (!gameState.player.artefacts.includes(artefactId)) {
    gameState.player.artefacts.push(artefactId);
    console.log(`[Artefact] Player acquired: ${artefactId}`);

    // Fire immediate acquisition hook if applicable
    const logic = ArtefactDictionary[artefactId];
    if (logic && typeof logic.onAcquire === "function") {
      logic.onAcquire(gameState);
    }
  }
}
