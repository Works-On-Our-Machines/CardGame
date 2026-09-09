import { playerDeck } from "../data/playerDeck.js";
import { createCard } from "../cardCreator.js";
import { gameState } from "../state/gameState.js";
import { handleEndTurn } from "./gameLoopController.js";
import { loadEncounter } from "./cpuController.js";
import { cardDatabase } from "../data/cardsdatabase.js";

export function setupBoard() {
  gameState.resetBoard();
  playerDeck.initStartingDeck(); //This needs to be done differently later on gamestart rather than setupboard

  setEndTurnButtonState(false);
  //Create the deck draw pile
  gameState.drawPile = [...playerDeck.cards];
  shuffleDeck(gameState.drawPile);

  //Here we create the free card draw pile. Note that we are setting the quantity of squirrels in the deck here with the 10.
  const freeCardTemplate = cardDatabase.find((c) => c.id === "card_000");
  for (let i = 0; i < 10; i++) {
    gameState.freePile.push({ ...freeCardTemplate });
  }

  // Event Listeners
  document
    .getElementById("deck-pile")
    ?.addEventListener("click", () => drawCard(false, "main"));
  document
    .getElementById("free-deck-pile")
    ?.addEventListener("click", () => drawCard(false, "free")); // ◄ NEW listener
  document
    .getElementById("player-hand")
    ?.addEventListener("click", handleHandClick);

  const endTurnBtn = document.getElementById("end-turn-btn");
  if (endTurnBtn) {
    endTurnBtn.addEventListener("click", () => {
      clearHandSelection(); // Drop selected card before combat starts
      handleEndTurn(); // Hand control over to gameLoopController
    });
  }
  loadEncounter("0001");
  setupSlotListeners();

  // Draw starting hand
  for (let i = 0; i < gameState.player.initialCardDraw; i++) {
    drawCard(true, "main");
  }

  //Draw the free card
  drawCard(true, "free");

  // 3. Start game in PLAY phase so they can use their initial hand
  gameState.turnPhase = "PLAY";
  gameState.player.energy = gameState.player.startingEnergy; // Ensure they have starting energy

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
  // ◄ NEW: Block playing cards if still in Draw Phase
  if (gameState.turnPhase === "DRAW") {
    console.warn("You must finish drawing cards first!");
    return;
  }

  if (gameState.selectedCardIndex === null) return;
  if (gameState.board.playerFront[slotIndex] !== null) return;

  const cardData = gameState.hand[gameState.selectedCardIndex];
  const cardCost = cardData.cost ?? 1;

  if (gameState.player.energy < cardCost) {
    console.warn("Not enough energy!");
    return;
  }

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

export function drawCard(isEffect = false, deckType = "main") {
  const targetPile =
    deckType === "free" ? gameState.freePile : gameState.drawPile;

  if (targetPile.length === 0) {
    console.warn(`Your ${deckType} deck is empty!`);
    return;
  }

  if (
    !isEffect &&
    gameState.player.cardsDrawnThisTurn >= gameState.player.cardDrawPerTurn
  ) {
    console.warn("Draw limit reached for this turn!");
    return;
  }

  const cardData = targetPile.pop();
  gameState.hand.push(cardData);

  if (!isEffect) {
    gameState.player.cardsDrawnThisTurn++;

    // --- NEW: PHASE UNLOCK LOGIC ---
    // If they hit their draw limit, switch to PLAY phase and unlock button
    if (
      gameState.player.cardsDrawnThisTurn >= gameState.player.cardDrawPerTurn
    ) {
      gameState.turnPhase = "PLAY";
      setEndTurnButtonState(true);
      console.log("Draw Phase complete. Entering PLAY Phase.");
    }
  }

  renderHandUI();
  updateDeckUI();
}

function updateDeckUI() {
  const deckSlot = document.getElementById("deck-pile");
  const freeDeckSlot = document.getElementById("free-deck-pile"); // ◄ NEW

  if (deckSlot) {
    deckSlot.textContent = `Deck (${gameState.drawPile.length})`;
  }
  if (freeDeckSlot) {
    freeDeckSlot.textContent = `Free Cards (${gameState.freePile.length})`;
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
  gameState.turnPhase = "DRAW"; // ◄ Lock the game in Draw Phase!

  gameState.player.energy = Math.min(
    gameState.player.maxEnergy,
    gameState.player.energy + gameState.player.energyGain,
  );

  renderStatsUI();

  // Lock the End Turn button until they draw
  // This doesn't actually work
  // It works now in other places, but leaving it here because Im worried to remove it
  setEndTurnButtonState(false);
  console.log("Draw Phase: Please draw a card from either deck.");
}

// Utility to disable End Turn button during enemy AI / animations
export function setEndTurnButtonState(isEnabled) {
  const btn = document.getElementById("end-turn-btn");
  console.log(btn.disabled);
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
