import { playerDeck } from "../data/playerDeck.js";
import { createCard } from "../cardCreator.js";
import { gameState } from "../state/gameState.js";
import { handleEndTurn } from "./gameLoopController.js"; // ◄ Added to trigger your new combat loop
import { loadEncounter } from "./cpuController.js";

export function setupBoard() {
  gameState.resetBoard();
  playerDeck.initStartingDeck(); //This needs to be done differently later on gamestart rather than setupboard

  gameState.drawPile = [...playerDeck.cards];
  shuffleDeck(gameState.drawPile);

  // Event Listeners
  document
    .getElementById("deck-pile")
    ?.addEventListener("click", () => drawCard(false));
  document
    .getElementById("player-hand")
    ?.addEventListener("click", handleHandClick);

  const endTurnBtn = document.getElementById("end-turn-btn");
  if (endTurnBtn) {
    endTurnBtn.addEventListener("click", () => {
      clearHandSelection(); // Drop selected card before combat starts
      handleEndTurn(); // Hand control over to gameLoopController
    });

    loadEncounter("0001");
  }

  setupSlotListeners();

  // 1. Draw starting hand
  for (let i = 0; i < gameState.player.initialCardDraw; i++) {
    drawCard(true);
  }

  // 2. Start Turn 1 (resets cardsDrawnThisTurn, adds energy, draws 1 turn card)
  startPlayerTurn();

  // 3. Render stats immediately so HP isn't blank on load!
  renderStatsUI();
  updateDeckUI();
}

function handleHandClick(event) {
  const cardElement = event.target.closest(".card");
  if (!cardElement) return;

  const handContainer = document.getElementById("player-hand");
  const cardIndex = Array.from(handContainer.children).indexOf(cardElement);

  if (cardIndex === -1) return;

  const isSelfSelected = gameState.selectedCardIndex === cardIndex;

  if (isSelfSelected) {
    clearHandSelection();
  } else {
    document
      .querySelectorAll("#player-hand .card")
      .forEach((c) => c.classList.remove("selected"));

    gameState.selectedCardIndex = cardIndex;
    cardElement.classList.add("selected");
  }
}

export function clearHandSelection() {
  gameState.selectedCardIndex = null;
  document
    .querySelectorAll("#player-hand .card")
    .forEach((c) => c.classList.remove("selected"));
}

function setupSlotListeners() {
  const playerSlots = document.querySelectorAll("#player-lane .card-slot");

  playerSlots.forEach((slot) => {
    slot.addEventListener("click", () => {
      const slotIndex = parseInt(slot.dataset.index, 10);
      playSelectedCardToSlot(slotIndex, slot);
    });
  });
}

function playSelectedCardToSlot(slotIndex, slotElement) {
  if (gameState.selectedCardIndex === null) return; // No card selected fallback
  if (gameState.board.playerFront[slotIndex] !== null) return; // if slot occupied

  const cardData = gameState.hand[gameState.selectedCardIndex];

  // Energy Check defaults to 1 if unset
  const cardCost = cardData.cost ?? 1;
  if (gameState.player.energy < cardCost) {
    console.warn("Not enough energy!");
    return;
  }

  // Reduce energy & update state arrays
  gameState.player.energy -= cardCost;
  gameState.board.playerFront[slotIndex] = cardData;
  renderStatsUI();
  gameState.hand.splice(gameState.selectedCardIndex, 1);

  clearHandSelection();
  renderHandUI();
  renderSlotUI(slotElement, cardData);
}

function renderHandUI() {
  const handContainer = document.getElementById("player-hand");
  handContainer.innerHTML = ""; // Clear existing hand

  gameState.hand.forEach((cardData) => {
    const cardEl = createCard(cardData);
    handContainer.appendChild(cardEl);
  });
}

function renderSlotUI(slotElement, cardData) {
  slotElement.innerHTML = ""; // Clear "Empty Slot" text
  const cardEl = createCard(cardData);
  slotElement.appendChild(cardEl);
}

export function drawCard(isEffect = false) {
  if (gameState.drawPile.length === 0) {
    console.warn("Your deck is empty!");
    return;
  }

  if (
    !isEffect &&
    gameState.player.cardsDrawnThisTurn >= gameState.player.cardDrawPerTurn
  ) {
    console.warn("Draw limit reached for this turn!");
    return;
  }

  const cardData = gameState.drawPile.pop();
  gameState.hand.push(cardData);

  if (!isEffect) {
    gameState.player.cardsDrawnThisTurn++;
  }

  renderHandUI();
  updateDeckUI();
}

function updateDeckUI() {
  const deckSlot = document.getElementById("deck-pile");
  if (deckSlot) {
    deckSlot.textContent = `Deck (${gameState.drawPile.length})`;
  }
}

// Fisher-yates shuffle
function shuffleDeck(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function renderStatsUI() {
  const playerHpEl = document.getElementById("player-hp");
  const playerEnergyEl = document.getElementById("player-energy");
  const enemyHpEl = document.getElementById("enemy-hp");

  if (playerHpEl) {
    playerHpEl.textContent = `${gameState.player.hp}/${gameState.player.maxHp}`;
  }

  if (playerEnergyEl) {
    playerEnergyEl.textContent = `${gameState.player.energy}/${gameState.player.maxEnergy}`;
  }

  if (enemyHpEl && gameState.enemy) {
    enemyHpEl.textContent = `${gameState.enemy.hp}/${gameState.enemy.maxHp}`;
  }
}

export function startPlayerTurn() {
  gameState.player.cardsDrawnThisTurn = 0;

  gameState.player.energy = Math.min(
    gameState.player.maxEnergy,
    gameState.player.energy + gameState.player.energyGain,
  );

  // Draw starting card(s) for the turn
  for (let i = 0; i < gameState.player.cardDrawPerTurn; i++) {
    drawCard(false);
  }

  renderStatsUI();
}

// Utility to disable End Turn button during enemy AI / animations
export function setEndTurnButtonState(isEnabled) {
  const btn = document.getElementById("end-turn-btn");
  if (btn) {
    btn.disabled = !isEnabled;
    if (!isEnabled) {
      btn.style.opacity = "0.5";
      btn.style.cursor = "not-allowed";
    } else {
      btn.style.opacity = "1";
      btn.style.cursor = "pointer";
    }
  }
}
