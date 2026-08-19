import { playerDeck } from "../data/playerDeck.js";
import { createCard } from "../cardCreator.js";

let drawPile = [];

export function setupBoard() {
  playerDeck.initStartingDeck(); //We dont want to do this here in the future I suspect, but it will work for now just to see things working.
  drawPile = [...playerDeck.cards];

  shuffleDeck(drawPile);

  const deckSlot = document.getElementById("deck-pile");

  updateDeckUI();

  deckSlot.addEventListener("click", () => {
    drawCard();
  });
}

function drawCard() {
  if (drawPile.length === 0) {
    console.warn("Your deck is empty!");
    return;
  }

  const cardData = drawPile.pop();

  const cardElement = createCard(cardData);
  const handContainer = document.getElementById("player-hand");
  handContainer.appendChild(cardElement);

  updateDeckUI();
}

function updateDeckUI() {
  const deckSlot = document.getElementById("deck-pile");
  if (deckSlot) {
    deckSlot.textContent = `Deck (${drawPile.length})`;
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