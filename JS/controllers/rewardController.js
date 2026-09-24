// JS/controllers/rewardController.js
import { runState } from "../state/runState.js";
import { cardDatabase } from "../data/cardsdatabase.js";
import { createCard } from "../cardCreator.js";
import { showMapView } from "../main.js";
import { updateTopBar } from "../ui/topBarRenderer.js";

/**
 * Displays the reward modal for combat victories and event rewards.
 * @param {Object|number|string} config - Configuration object or direct values
 * @param {Function} [fallbackCallback] - Callback after rewards are claimed/skipped
 */
export function showRewardScreen(config = {}, fallbackCallback = null) {
  let currencyAward = 0;
  let choicesCount = 3;
  let rarity = "any";
  let cardId = null;
  let onComplete = null;

  // 1. Normalize parameters safely across caller types
  if (typeof config === "number") {
    currencyAward = config;
    onComplete = fallbackCallback;
  } else if (typeof config === "string") {
    const baseCurrency = config === "elite" ? 50 : 25;
    const overkill =
      typeof fallbackCallback === "number" ? fallbackCallback : 0;
    currencyAward = baseCurrency + overkill;
  } else if (typeof config === "object" && config !== null) {
    currencyAward = Number(config.currency ?? config.gold ?? 0);
    choicesCount = config.choices || 3;
    rarity = config.rarity || "any";
    cardId = config.cardId || null;
    onComplete = config.onComplete || fallbackCallback;
  }

  if (!onComplete || typeof onComplete !== "function") {
    onComplete = showMapView;
  }

  // 2. Process Currency Award & update Top Bar in real-time
  if (currencyAward > 0) {
    runState.currency = (runState.currency || 0) + currencyAward;
    updateTopBar();
  }

  // 3. Remove existing overlays to prevent duplicates
  const existingOverlay = document.getElementById("reward-overlay");
  if (existingOverlay) existingOverlay.remove();

  // 4. Create Modal DOM Container
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.id = "reward-overlay";

  const modal = document.createElement("div");
  modal.className = "reward-modal column align-center";

  const title = document.createElement("h2");
  title.className = "reward-title";
  title.textContent = "Rewards";
  modal.appendChild(title);

  // Currency Payout Banner
  if (currencyAward > 0) {
    const payoutContainer = document.createElement("div");
    payoutContainer.className = "payout-container";

    const currencyItem = document.createElement("div");
    currencyItem.className = "reward-item";
    currencyItem.textContent = `+${currencyAward} Currency`;
    payoutContainer.appendChild(currencyItem);

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

    const cardEl = createCard(cardData);
    cardWrapper.appendChild(cardEl);

    cardWrapper.addEventListener("click", () => {
      if (Array.isArray(runState.masterDeck)) {
        runState.masterDeck.push({ ...cardData });
      }
      cleanupAndProceed();
    });

    cardsGrid.appendChild(cardWrapper);
  });

  modal.appendChild(cardsGrid);

  // 6. Action Controls
  const actionsContainer = document.createElement("div");
  actionsContainer.className = "reward-actions";

  const skipBtn = document.createElement("button");
  skipBtn.className = "reward-item";
  skipBtn.textContent = "Skip Rewards";
  skipBtn.addEventListener("click", cleanupAndProceed);

  actionsContainer.appendChild(skipBtn);
  modal.appendChild(actionsContainer);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  function cleanupAndProceed() {
    overlay.remove();
    if (typeof onComplete === "function") {
      onComplete();
    }
  }
}

/**
 * Helper: Filters global card pool by rarity or specific cardId
 */
function getFilteredCardPool(rarity, cardId = null) {
  const allCards = Array.isArray(cardDatabase) ? cardDatabase : Object.values(cardDatabase || {});
  if (allCards.length === 0) return [];

  if (cardId) {
    const specificCard = allCards.find((c) => c.id === cardId);
    if (specificCard) return [specificCard];
    console.warn(`[Reward] Card ID "${cardId}" not found. Falling back.`);
  }

  if (rarity && rarity !== "any") {
    const filtered = allCards.filter(
      (c) => c.rarity === rarity || c.type === rarity
    );
    return filtered.length > 0 ? filtered : allCards;
  }

  return allCards;
}

/**
 * Helper: Returns N random non-repeating cards
 */
function getRandomCards(pool, count) {
  if (!pool || pool.length === 0) return [];
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, pool.length));
}