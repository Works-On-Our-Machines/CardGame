// JS/controllers/artefactDictionary.js

export const ArtefactDictionary = {
  // Ring of Power: +1 Energy at the start of every turn
  art_energy_ring: {
    onTurnStart(gameState) {
      gameState.player.energy += 1;
      console.log("[Artefact] Ring of Power: Granted +1 Energy.");
    },
  },

  // Vampire's Fang: Heal 2 HP whenever an enemy card dies
  art_vampire_fang: {
    onEnemyKilled(gameState) {
      const healAmount = 2;
      gameState.player.hp = Math.min(
        gameState.player.maxHp,
        gameState.player.hp + healAmount,
      );
      gameState.syncHealthToRun();
      console.log(`[Artefact] Vampire's Fang: Healed ${healAmount} HP.`);
    },
  },

  // Greed Idol: +25% Gold on combat victory
  art_golden_coin: {
    onGoldGain(gameState, goldContext) {
      goldContext.amount = Math.floor(goldContext.amount * 1.25);
      console.log(
        `[Artefact] Greed Idol: Boosted gold yield to ${goldContext.amount}.`,
      );
    },
  },

  // Tactician's Banner: Draw 1 extra card when combat starts
  art_tacticians_banner: {
    onCombatStart(gameState) {
      if (gameState.drawPile && gameState.drawPile.length > 0) {
        const drawnCard = gameState.drawPile.pop();
        gameState.hand.push(drawnCard);
        console.log(
          `[Artefact] Tactician's Banner: Drew extra card (${drawnCard.name}).`,
        );
      }
    },
  },
};
