// JS/controllers/rewardController.js
import { runState } from "../state/runState.js";
import { cardDatabase } from "../data/cardsdatabase.js"; // Note: verify capitalization of your file here
import { createCard } from "../cardCreator.js";
import { showMapView } from "../main.js";
import { updateTopBar } from "../ui/topBarRenderer.js";

/**
 * Clean, predictable reward screen.
 * config MUST be an object. Example:
 * { currency: 25, choices: 3, rarity: "any", cardId: null, onComplete: null }
 */
export function showRewardScreen(config = {}) {
  // 1. Clean variable assignment (No more guessing types)
  const currencyReward = config.currency || 0;
  const choicesCount = config.choices || 3;
  const rarity = config.rarity || "any";
  const cardId = config.cardId || null;
  const onComplete = config.onComplete || showMapView;

  // 2. Award Currency
  if (currencyReward > 0) {
    runState.currency += currencyReward;
    updateTopBar();
  }

  // 3. Clear any old modals
  const existingOverlay = document.getElementById("reward-overlay");
  if (existingOverlay) existingOverlay.remove();

  // 4. Create UI Background & Modal
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.id = "reward-overlay";

  const modal = document.createElement("div");
  modal.className = "reward-modal column align-center";

  modal.innerHTML = `
    <h2 class="reward-title">Rewards</h2>
    ${currencyReward > 0 ? `<div class="payout-container"><div class="reward-item">+${currencyReward} Currency</div></div>` : ""}
    <div class="card-rewards-grid" id="reward-cards-container"></div>
    <div class="reward-actions"><button id="skip-rewards-btn" class="reward-item">Skip Rewards</button></div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // 5. Get Cards (Filtered by Suite!)
  const cardsContainer = document.getElementById("reward-cards-container");
  const cardPool = getFilteredCardPool(rarity, cardId);
  const cardChoices = getRandomCards(cardPool, choicesCount);

  // 6. Render Cards and add Click Events
  cardChoices.forEach((cardData) => {
    const cardWrapper = document.createElement("div");
    cardWrapper.className = "reward-card-wrapper";
    cardWrapper.appendChild(createCard(cardData));

    // When the player clicks a card, add it to their deck and close the window
    cardWrapper.addEventListener("click", () => {
      runState.masterDeck.push({ ...cardData });
      cleanupAndProceed();
    });

    cardsContainer.appendChild(cardWrapper);
  });

  // 7. Setup Skip Button
  document
    .getElementById("skip-rewards-btn")
    .addEventListener("click", cleanupAndProceed);

  // Helper to destroy window and move on
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
      card.suite === "none" ||
      card.suite === "gray" ||
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
