// JS/controllers/rewardController.js
import { runState } from "../state/runState.js";
import { cardDatabase } from "../data/cardsdatabase.js"; // Note: verify capitalization of your file here
import { createCard } from "../cardCreator.js";
import { showMapView } from "../main.js";
import { updateTopBar } from "../ui/topBarRenderer.js";
import { ArtefactDictionary } from "./artefactDictionary.js";
import { addArtefactToPlayer } from "./artefactProcessor.js";

/**
 * Clean, predictable reward screen.
 * config MUST be an object. Example:
 * { currency: 25, choices: 3, rarity: "any", cardId: null, onComplete: null }
 */
export function showRewardScreen(config = {}) {
  const currencyReward = config.currency || 0;
  const choicesCount = config.choices || 3;
  const rarity = config.rarity || "any";
  const cardId = config.cardId || null;
  const artefactId = config.artefactId || null; // ◄ NEW: Support artefact drops!
  const onComplete = config.onComplete || showMapView;

  // 1. Award Currency (Auto-granted for simplicity, or you could make it clickable)
  if (currencyReward > 0) {
    runState.currency += currencyReward;
    updateTopBar();
  }

  // 2. Clear old modals
  const existingOverlay = document.getElementById("reward-overlay");
  if (existingOverlay) existingOverlay.remove();

  // 3. Create UI
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.id = "reward-overlay";

  const modal = document.createElement("div");
  modal.className = "reward-modal column align-center";

  // Check if we have a valid artefact to display
  const hasArtefact = artefactId && artefactDatabase[artefactId];

  modal.innerHTML = `
    <h2 class="reward-title">Rewards</h2>
    <div class="payout-container column align-center gap-2">
      ${currencyReward > 0 ? `<div class="reward-item">+${currencyReward} Gold</div>` : ""}
      ${
        hasArtefact
          ? `
        <button id="claim-artefact-btn" class="reward-item artefact-reward row align-center gap-2" style="cursor: pointer;">
          <strong>+ Artefact:</strong> ${artefactDatabase[artefactId].name}
        </button>
      `
          : ""
      }
    </div>
    <div class="card-rewards-grid" id="reward-cards-container"></div>
    <div class="reward-actions"><button id="skip-rewards-btn" class="reward-item">Skip Rewards</button></div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // 4. Artefact Click Logic (Claiming the artefact)
  if (hasArtefact) {
    const artBtn = document.getElementById("claim-artefact-btn");
    artBtn.addEventListener("click", () => {
      // Give the artefact using our processor
      addArtefactToPlayer(artefactId);

      // Update UI to show it's been claimed
      artBtn.style.opacity = "0.5";
      artBtn.style.pointerEvents = "none";
      artBtn.innerText = `Claimed: ${artefactDatabase[artefactId].name}`;
      updateTopBar();
    });
  }

  // 5. Get and Render Cards
  const cardsContainer = document.getElementById("reward-cards-container");
  const cardPool = getFilteredCardPool(rarity, cardId);
  const cardChoices = getRandomCards(cardPool, choicesCount);

  cardChoices.forEach((cardData) => {
    const cardWrapper = document.createElement("div");
    cardWrapper.className = "reward-card-wrapper";
    cardWrapper.appendChild(createCard(cardData));

    cardWrapper.addEventListener("click", () => {
      runState.masterDeck.push({ ...cardData });
      cleanupAndProceed();
    });

    cardsContainer.appendChild(cardWrapper);
  });

  document
    .getElementById("skip-rewards-btn")
    .addEventListener("click", cleanupAndProceed);

  function cleanupAndProceed() {
    overlay.remove();
    onComplete();
  }
}

function getFilteredCardPool(rarity, cardId) {
  const allCards = Object.values(cardDatabase || {});
  if (allCards.length === 0) return [];

  // If the event gives a very specific card, just return that
  if (cardId) {
    const specificCard = allCards.find((c) => c.id === cardId);
    return specificCard ? [specificCard] : [];
  }

  // Get the suite from runState 
  const activeSuite = runState.playerSuite || "red";

  return allCards.filter((card) => {
    // 1. Suite Check: Allow if no suite, "none", "gray", or matches the player's suite
    const matchesSuite =
      !card.suite ||
      card.suite === activeSuite;

    // 2. Rarity Check: Check BOTH card.type (your DB) and card.rarity (just in case)
    const matchesRarity =
      rarity === "any" || card.type === rarity || card.rarity === rarity;

    return matchesSuite && matchesRarity;
  });
}

/**
 * Shuffles an array and returns X items
 */
function getRandomCards(pool, count) {
  if (!pool || pool.length === 0) return [];
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, pool.length));
}
