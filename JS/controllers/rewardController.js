import { cardDatabase } from "../data/cardsdatabase.js";
import { runState } from "../state/runState.js";
import { createCard } from "../cardCreator.js";

let pendingGold = 0;
let goldCollected = false;

// 1. Rarity Roll Logic
function rollRarity(encounterType) {
  const roll = Math.random() * 100;

  if (encounterType === "boss") return "rare";

  if (encounterType === "elite") {
    if (roll < 20) return "common";
    if (roll < 80) return "uncommon";
    return "rare";
  }

  // Regular Battle
  if (roll < 70) return "common";
  if (roll < 95) return "uncommon";
  return "rare";
}

// 2. Card Reward Choice Generator
export function generateCardRewards(
  encounterType = "regular",
  playerSuite = "red",
  count = 3,
) {
  const selectedRewards = [];

  for (let i = 0; i < count; i++) {
    const targetRarity = rollRarity(encounterType);

    let pool = cardDatabase.filter((card) => {
      const cardType = card.type?.toLowerCase();
      const cardSuite = card.suite?.toLowerCase();

      const matchesRarity = cardType === targetRarity;
      const isCollectible = cardType !== "basic";
      const matchesSuite =
        cardSuite === playerSuite.toLowerCase() || cardSuite === "gray";

      return matchesRarity && isCollectible && matchesSuite;
    });

    if (pool.length === 0) {
      pool = cardDatabase.filter(
        (c) =>
          c.type?.toLowerCase() !== "basic" &&
          (c.suite?.toLowerCase() === playerSuite.toLowerCase() ||
            c.suite?.toLowerCase() === "gray"),
      );
    }

    const uniquePool = pool.filter(
      (card) => !selectedRewards.some((r) => r.id === card.id),
    );
    const finalPool = uniquePool.length > 0 ? uniquePool : pool;

    const chosenCard = finalPool[Math.floor(Math.random() * finalPool.length)];
    if (chosenCard) {
      selectedRewards.push({ ...chosenCard });
    }
  }

  return selectedRewards;
}

// 3. Gold Calculation
export function calculateGoldReward(
  encounterType = "regular",
  overkillDamage = 0,
) {
  let baseGold = 15;
  if (encounterType === "elite") baseGold = 35;
  if (encounterType === "boss") baseGold = 75;

  const variance = Math.floor(Math.random() * 6) - 3;
  const overkillBonus = Math.max(0, Math.floor(overkillDamage * 1.5));

  return Math.max(5, baseGold + variance + overkillBonus);
}

// 4. Dynamic HTML Overlay Generator
function getOrCreateRewardOverlay() {
  let overlay = document.getElementById("reward-overlay");
  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.id = "reward-overlay";
  overlay.className = "overlay hidden";

  overlay.innerHTML = `
    <div class="reward-modal">
      <h2 class="reward-title">VICTORY</h2>
      
      <div class="payout-container">
        <div id="gold-reward" class="reward-item">
          <span class="reward-icon">🪙</span>
          <span id="gold-amount">+0 Gold</span>
        </div>
        <div id="extra-rewards" class="extra-rewards-list"></div>
      </div>

      <p class="reward-subtitle">Choose a card to add to your deck:</p>

      <div id="card-rewards-container" class="card-rewards-grid"></div>

      <div class="reward-actions">
        <button id="skip-reward-btn" class="btn-secondary">Skip Card Reward</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  return overlay;
}

// 5. Victory Overlay Display Controller
export function showVictoryOverlay(
  encounterType = "regular",
  overkillDamage = 0,
) {
  const overlay = getOrCreateRewardOverlay();

  const goldEl = document.getElementById("gold-amount");
  const cardsContainer = document.getElementById("card-rewards-container");
  const skipBtn = document.getElementById("skip-reward-btn");
  const goldRewardBox = document.getElementById("gold-reward");

  pendingGold = calculateGoldReward(encounterType, overkillDamage);
  goldCollected = false;
  goldEl.textContent = `+${pendingGold} Gold`;
  goldRewardBox.style.opacity = "1";

  goldRewardBox.onclick = () => {
    if (!goldCollected) {
      runState.currency += pendingGold;
      goldCollected = true;
      goldRewardBox.style.opacity = "0.4";
      goldEl.textContent = "Collected!";
    }
  };

  cardsContainer.innerHTML = "";
  const cardChoices = generateCardRewards(
    encounterType,
    runState.playerSuite || "red",
    3,
  );

  cardChoices.forEach((cardData) => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("reward-card-wrapper");

    // Uses your existing card builder
    const cardNode = createCard(cardData);
    wrapper.appendChild(cardNode);

    wrapper.addEventListener("click", () => {
      claimCardAndFinish(cardData);
    });

    cardsContainer.appendChild(wrapper);
  });

  skipBtn.onclick = () => {
    claimCardAndFinish(null);
  };

  overlay.classList.remove("hidden");
}

// 6. Claim & Exit Resolution
function claimCardAndFinish(chosenCard) {
  if (!goldCollected) {
    runState.currency += pendingGold;
  }

  if (chosenCard) {
    runState.masterDeck.push({ ...chosenCard });
  }

  const overlay = document.getElementById("reward-overlay");
  if (overlay) overlay.classList.add("hidden");

  const boardEl = document.getElementById("board-container");
  if (boardEl) boardEl.style.pointerEvents = "auto";
}
