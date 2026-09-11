// JS/ui/cardRender.js

/**
 * Creates a visual DOM node for a card based on card database data.
 * @param {Object} cardData - Card object from cardDatabase
 * @returns {HTMLElement} The formatted card DOM element
 */
export function createCardElement(cardData) {
  const cardNode = document.createElement("div");

  // Attach CSS classes based on rarity and suite for styling
  const suiteClass = cardData.suite
    ? `suite-${cardData.suite.toLowerCase()}`
    : "suite-gray";
  const rarityClass = cardData.type
    ? `rarity-${cardData.type.toLowerCase()}`
    : "rarity-common";

  cardNode.className = `card ${suiteClass} ${rarityClass}`;
  cardNode.dataset.id = cardData.id;

  cardNode.innerHTML = `
    <div class="card-cost">${cardData.cost ?? 0}</div>
    <div class="card-header">
      <span class="card-title">${cardData.name}</span>
    </div>
    <div class="card-portrait-frame">
      <img src="${cardData.portrait}" alt="${cardData.name}" class="card-portrait" />
    </div>
    <div class="card-body">
      <p class="card-text">${cardData.specialRule !== "None" ? cardData.specialRule : ""}</p>
    </div>
    <div class="card-footer">
      <span class="card-stat atk">${cardData.atk ?? 0}</span>
      <span class="card-stat hp">${cardData.hp ?? 0}</span>
    </div>
  `;

  return cardNode;
}
