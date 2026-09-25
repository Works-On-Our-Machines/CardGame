export const RuleDictionary = {
  // --- ACTION HOOKS ---
  Sacrificial: {
    onDeath: (card, gameState, owner) => {
      const ownerObj = owner === "player" ? gameState.player : gameState.enemy;
      if (ownerObj) {
        ownerObj.energy = (ownerObj.energy || 0) + 2;
        console.log(`${card.name} SACRIFICIAL triggered! Gained +2 Energy.`);
      }
    },
  },

  Unkillable: {
    onDeath: (card, gameState, owner) => {
      if (owner === "player" && Array.isArray(gameState.hand)) {
        gameState.hand.push({ ...card, hp: card.maxHp || card.hp });
        console.log(
          `${card.name} UNKILLABLE triggered! Returned copy to hand.`,
        );
      }
    },
  },

  Clone: {
    onPlay: (card, gameState, owner) => {
      if (owner === "player" && Array.isArray(gameState.hand)) {
        const rawRules =
          card.specialRules ?? card.specials ?? card.specialRule ?? [];
        const rulesArray = Array.isArray(rawRules) ? [...rawRules] : [rawRules];
        const filteredRules = rulesArray.filter(
          (r) => r.toLowerCase() !== "clone",
        );

        const clonedCard = {
          ...card,
          specialRules: filteredRules,
          specialRule: filteredRules[0] || "None",
        };
        gameState.hand.push(clonedCard);
        console.log(
          `${card.name} CLONE triggered! Added a copy without Clone to hand.`,
        );
      }
    },
  },

  // --- TURN END HOOKS ---
  Regenerative: {
    onTurnEnd: (card) => {
      card.hp += 1;
      console.log(`${card.name} REGENERATIVE: +1 HP.`);
    },
  },

  Intensify: {
    onTurnEnd: (card) => {
      card.atk += 1;
      console.log(`${card.name} INTENSIFY: +1 ATK.`);
    },
  },

  Builder: {
    onTurnEnd: (card) => {
      card.turnCount = (card.turnCount || 0) + 1;
      if (card.turnCount % 2 === 0) {
        card.atk += 1;
        card.hp += 1;
        console.log(`${card.name} BUILDER triggered: +1/+1.`);
      }
    },
  },

  Shifting: {
    onTurnEnd: (card) => {
      const temp = card.atk;
      card.atk = card.hp;
      card.hp = temp;
      console.log(
        `${card.name} SHIFTING: Swapped stats to ATK ${card.atk} / HP ${card.hp}.`,
      );
    },
  },

  Shifter: {
    onTurnEnd: (card, gameState, owner, slotIndex) => {
      const laneKey = owner === "player" ? "playerFront" : "enemyFront";
      const lane = gameState.board[laneKey];
      if (!lane) return;

      const dir = card.moveDir || 1; // 1 = Right, -1 = Left
      const nextIdx = slotIndex + dir;

      if (nextIdx >= 0 && nextIdx < 4 && lane[nextIdx] === null) {
        lane[nextIdx] = card;
        lane[slotIndex] = null;
        console.log(`${card.name} SHIFTER: Moved to slot ${nextIdx}.`);
      } else {
        card.moveDir = dir * -1; // Flip arrow direction when blocked
      }
    },
  },

  // --- COMBAT HOOKS ---
  Shell: {
    onTakeDamage: (card, attacker, damageContext) => {
      if (!card.shellBroken) {
        card.shellBroken = true;
        damageContext.cancelled = true;
        console.log(`${card.name}'s SHELL absorbed the damage!`);
      }
    },
  },

  Deadly: {
    onDealDamage: (attacker, targetCard, damageContext) => {
      if (targetCard && damageContext.amount > 0) {
        damageContext.amount = Math.max(targetCard.hp, damageContext.amount);
        console.log(`${attacker.name} DEADLY triggered! Dealt lethal damage.`);
      }
    },
  },

  Spikey: {
    onTakeDamage: (card, attacker, damageContext, gameState, attackerSide) => {
      if (attacker && typeof attacker.hp === "number") {
        attacker.hp -= 1;
        console.log(
          `${attacker.name} took 1 SPIKEY recoil damage from ${card.name}!`,
        );
      }
    },
  },

  Vampiric: {
    onDealDamage: (attacker, targetCard, damageContext) => {
      if (damageContext.actualDealt > 0) {
        attacker.hp += damageContext.actualDealt;
        console.log(
          `${attacker.name} VAMPIRIC healed +${damageContext.actualDealt} HP!`,
        );
      }
    },
  },

  // --- PASSIVES (Evaluated during queries / calculations) ---
  Leader: { isPassive: true },
  Airborne: { isPassive: true },
  "Winged Defender": { isPassive: true },
  "Bifurcated Strike": { isPassive: true },
  "Trifurcated Strike": { isPassive: true },
};
