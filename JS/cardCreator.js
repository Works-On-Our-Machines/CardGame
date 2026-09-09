/**
 * Creates and returns a card DOM element using cardDatabase attributes.
 * @param {Object} cardData - Card object from cardDatabase
 * @returns {HTMLElement} The constructed card element
 */
export function createCard(cardData) {
  const card = document.createElement("div");
  card.className = "card";

  if (cardData.id) {
    card.dataset.id = cardData.id;
  }

  card.innerHTML = `
    <div class="cardHeader">
      <span class="cardName">${cardData.name ?? "Unknown Card"}</span>
      <span class="cardCost">${cardData.cost ?? 0}</span>
    </div>

    <div class="card-portraitBox">
      <img 
        class="card-portrait" 
        src="${cardData.portrait}" 
        alt="${cardData.name ?? "Card Image"}" 
      />
    </div>

    <div class="cardspecialsBox">
      <div class="cardSpecials">${cardData.specialRule ?? "None"}</div>
      <div class="card-stats">
        <span class="cardAtk">${cardData.atk ?? 0}</span>
        <span class="cardHP">${cardData.hp ?? 0}</span>
      </div>
    </div>
  `;

  return card;
}
