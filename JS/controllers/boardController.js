import { playerDeck } from "../data/playerDeck.js";
import { createCard } from "../cardCreator.js";
import { gameState } from "../state/gamestate.js";

let drawPile = [];

export function setupBoard() {
  gameState.resetBoard();
  playerDeck.initStartingDeck();

  gameState.drawPile = [...playerDeck.cards];
  shuffleDeck(gameState.drawPile);

  //Add listener to the deck pile. Not entirely sure if this should be here, but it is here for now.
  document.getElementById("deck-pile").addEventListener("click", drawCard);

  //Add listener to the player hand
  document
    .getElementById("player-hand")
    .addEventListener("click", handleHandClick);

  setupSlotListeners();

  //For now, "hacky" solution to draw 3 cards on setup. Make a stat for the player that multiplies with a function here.
  drawCard();
  drawCard();
  drawCard();

  updateDeckUI();
  renderStatsUI();
}

function handleHandClick(event) {
  const cardElement = event.target.closest(".card");
  if (!cardElement) return;

  const handContainer = document.getElementById("player-hand");
  const cardIndex = Array.from(handContainer.children).indexOf(cardElement);

  if (cardIndex === -1) return;

  const isSelfSelected = gameState.selectedCardIndex === cardIndex;

  if (isSelfSelected) {
    gameState.selectedCardIndex = null;
    cardElement.classList.remove("selected");
  } else {
    document
      .querySelectorAll("#player-hand .card")
      .forEach((c) => c.classList.remove("selected"));

    gameState.selectedCardIndex = cardIndex;
    cardElement.classList.add("selected");
  }
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
  gameState.selectedCardIndex = null; // Clear selection

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

function drawCard() {
  if (gameState.drawPile.length === 0) {
    console.warn("Your deck is empty!");
    return;
  }

  const cardData = gameState.drawPile.pop();
  gameState.hand.push(cardData);

  const cardElement = createCard(cardData);
  const handContainer = document.getElementById("player-hand");
  handContainer.appendChild(cardElement);

  updateDeckUI();
}

function updateDeckUI() {
  const deckSlot = document.getElementById("deck-pile");
  if (deckSlot) {
    deckSlot.textContent = `Deck (${gameState.drawPile.length})`;
  }
}

//Found this online, it's apparently called a "fisher-yates shuffle"
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

  if (playerHpEl) {
    playerHpEl.textContent = `${gameState.player.hp}/${gameState.player.maxHp}`;
  }

  if (playerEnergyEl) {
    playerEnergyEl.textContent = `${gameState.player.energy}/${gameState.player.maxEnergy}`;
  }
}
