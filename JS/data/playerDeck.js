import { cardDatabase } from "./cardsdatabase.js";

export const playerDeck = {
  cards: [],

  initStartingDeck() {
    this.cards = [];

    for (let i = 0; i < 8; i++) {
      this.addCard("card_001");
    }
    for (let i = 0; i < 2; i++) {
      this.addCard("card_002");
    }
  },

  addCard(selectedCard) {
    const template = cardDatabase.find(
      (tag) => tag.id === selectedCard || tag.name === selectedCard,
    );

    if (!template) {
      console.warn(`Card "${selectedCard}" not found in database!`);
      return;
    }

    this.cards.push({ ...template });
  },
};
