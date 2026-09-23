// JS/controllers/rewardController.js
import { runState } from "../state/runState.js";
import { cardDatabase } from "../data/cardsdatabase.js";
import { createCard } from "../cardCreator.js";
import { showMapView } from "../main.js";

/**
 * Displays the reward modal for combat victories and event rewards.
 * @param {Object} config - { gold?: number, choices?: number, rarity?: string, onComplete?: Function }
 * @param {Function} [fallbackCallback] - Fallback callback if not specified in config
 */
export function showRewardScreen(config = {}, fallbackCallback = null) {
  // 1. Normalize parameters safely across all caller types (combat or event)
  const gold = typeof config === "number" ? config : config.gold || 0;
  const choicesCount = config.choices || 3;
  const rarity = config.rarity || "any";
  const cardId = config.cardId || null; // <--- ADD THIS LINE

  const onComplete =
    (typeof config === "function" ? config : config.onComplete) ||
    fallbackCallback ||
    showMapView;

  // 2. Process Gold Reward immediately
  if (gold > 0) {
    runState.currency = (runState.currency || 0) + gold;
  }

  // 3. Remove any lingering reward overlays to prevent duplicates
  const existingOverlay = document.getElementById("reward-overlay");
  if (existingOverlay) existingOverlay.remove();

  // 4. Create Modal DOM Container using utilities.css classes
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.id = "reward-overlay";

  const modal = document.createElement("div");
  // Applying layout helper classes from utilities.css alongside the main modal class
  modal.className = "reward-modal column align-center";

  // Title
  const title = document.createElement("h2");
  title.className = "reward-title";
  title.textContent = "Rewards";
  modal.appendChild(title);

  // Gold Payout Display (if applicable)
  if (gold > 0) {
    const payoutContainer = document.createElement("div");
    payoutContainer.className = "payout-container";

    const goldItem = document.createElement("div");
    goldItem.className = "reward-item";
    goldItem.textContent = `+${gold} Gold`;
    payoutContainer.appendChild(goldItem);

    modal.appendChild(payoutContainer);
  }

  // 5. Populate Card Choices
  const cardsGrid = document.createElement("div");
  cardsGrid.className = "card-rewards-grid";

  const cardPool = getFilteredCardPool(rarity, cardId);
  const cardChoices = getRandomCards(cardPool, choicesCount);

  cardChoices.forEach((cardData) => {
    const cardWrapper = document.createElement("div");
    cardWrapper.className = "reward-card-wrapper";

    // Rely on  existing cardCreator logic
    const cardEl = createCard(cardData);
    cardWrapper.appendChild(cardEl);

    // Event listener for picking the card
    cardWrapper.addEventListener("click", () => {
      // Ensure we push to the correct deck array in runState
      if (Array.isArray(runState.masterDeck)) {
        runState.masterDeck.push({ ...cardData });
        console.log(`[Reward] Added ${cardData.name} to Master Deck.`);
      } else if (Array.isArray(runState.deck)) {
        runState.deck.push({ ...cardData });
        console.log(`[Reward] Added ${cardData.name} to Deck.`);
      }
      cleanupAndProceed();
    });

    cardsGrid.appendChild(cardWrapper);
  });

  modal.appendChild(cardsGrid);

  // 6. Setup Actions (Skip Button)
  const actionsContainer = document.createElement("div");
  actionsContainer.className = "reward-actions";

  const skipBtn = document.createElement("button");
  // Reusing the styled reward-item class for the button to match your aesthetic
  skipBtn.className = "reward-item";
  skipBtn.textContent = "Skip Rewards";
  skipBtn.addEventListener("click", () => {
    cleanupAndProceed();
  });

  actionsContainer.appendChild(skipBtn);
  modal.appendChild(actionsContainer);

  // 7. Mount to DOM
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // 8. Cleanup helper
  function cleanupAndProceed() {
    overlay.remove();
    if (typeof onComplete === "function") {
      onComplete(); // Routes back to Event stage or Map
    }
  }
}

function getFilteredCardPool(rarity, cardId = null) {
  // Normalize pool regardless of array or object export
  // CHANGED: Replaced 'cardDb' with the correctly imported 'cardDatabase'
  const allCards = Array.isArray(cardDatabase)
    ? cardDatabase
    : Object.values(cardDatabase);
  if (allCards.length === 0) return [];

  // 1. Look up specific card ID across array or object structures
  if (cardId) {
    const specificCard = allCards.find((c) => c.id === cardId);
    if (specificCard) {
      return [specificCard];
    }
    console.warn(
      `[Reward] Specified cardId "${cardId}" not found in cardsDatabase. Falling back to pool.`,
    );
  }

  // 2. Fall back to rarity filtering
  if (rarity && rarity !== "any") {
    const filtered = allCards.filter(
      (c) => c.rarity === rarity || c.type === rarity,
    );
    return filtered.length > 0 ? filtered : allCards;
  }

  return allCards;
}

/**
 * Returns random non-repeating cards from a given pool
 */
function getRandomCards(pool, count) {
  if (!pool || pool.length === 0) return [];
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, pool.length));
}
