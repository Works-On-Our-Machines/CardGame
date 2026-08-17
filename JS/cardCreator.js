export function createCard(cardData) {
  const cardElement = document.createElement("div");
  cardElement.className = "card";

  cardElement.innerHTML = `
    <div class="cardHeader">
      <span class="cardName">${cardData.name}</span>
      <span class="cardCost">${cardData.cost}</span>
    </div>

    <div class="card-portraitBox">
      <img
        class="card-portrait"
        src="${cardData.portrait}"
        alt="Art for ${cardData.name}"
      />
    </div>

    <div class="cardspecialsBox">
      <div class="cardSpecials">${cardData.specialRule}</div>
    </div>

    <div class="card-stats">
      <div class="cardAtk">${cardData.atk}</div>
      <div class="cardHP">${cardData.hp}</div>
    </div>
  `;

  return cardElement;
}
