export const ArtefactDictionary = {
  art_energy_ring: {
    onTurnStart: (gameState) => {
      gameState.player.energy = (gameState.player.energy || 0) + 1;
      console.log("[Artefact] Ring of Power granted +1 Energy!");
    },
  },

  art_vampire_fang: {
    onEnemyKilled: (gameState) => {
      const maxHp = gameState.player.maxHp || 30;
      gameState.player.hp = Math.min(maxHp, gameState.player.hp + 2);
      console.log("[Artefact] Vampire's Fang healed 2 HP on kill!");
    },
  },

  art_golden_coin: {
    onGoldGain: (gameState, goldContext) => {
      const bonus = Math.floor(goldContext.amount * 0.25);
      goldContext.amount += bonus;
      console.log(`[Artefact] Greed Idol increased gold by +${bonus}!`);
    },
  },

  art_tacticians_banner: {
    onCombatStart: (gameState) => {
      if (typeof gameState.drawCards === "function") {
        gameState.drawCards(1);
        console.log("[Artefact] Tactician's Banner drew 1 extra card!");
      }
    },
  },
};
