import { cardDatabase } from "./cardsdatabase.js";

export const startingBoonsEvent = {
  id: "BOONS_001",
  title: "Ancient Blessing",
  art: "../Assets/Events/starting_boons.png",
  initialStage: "start",
  stages: {
    start: {
      text: "A towering entity observes your journey. Choose a starting blessing to aid your ascent...",
      options: [
        {
          text: "[Card Discovery] Choose 1 of 3 rare cards.",
          effects: [{ type: "cardReward", rarity: "rare", choices: 3 }],
          nextStage: null,
        },
        {
          text: "[Relic Cache] Receive 1 random artifact.",
          effects: [{ type: "gainRelic", pool: ["generic", "classSpecific"] }],
          nextStage: null,
        },
        {
          text: "[Merchant Pouch] Get 150 gold.",
          effects: [{ type: "gold", amount: 150 }],
          nextStage: null,
        },
        {
          text: "[Starter Package] Get 1 uncommon card and 75 gold.",
          effects: [
            { type: "cardReward", rarity: "uncommon", choices: 1 },
            { type: "gold", amount: 75 },
          ],
          nextStage: null,
        },
      ],
    },
  },
};

function rollStartingBoon() {}

let placeholderArt = "../Assets/Events/placeholder.png";
export const act1Events = [
  {
    id: "A1_001",
    title: "The Mysterious Shrine",
    art: placeholderArt,
    initialStage: "start",
    stages: {
      // --- Stage 1: Initial Presentation ---
      start: {
        text: "You stumble upon an ancient glowing shrine. It whispers promises of strength, but demands something in return.",
        options: [
          {
            text: "[Pray] Gain 50 Gold.",
            effects: [{ type: "gold", amount: 50 }],
            nextStage: "prayed",
          },
          {
            text: "[Sacrifice] Take 3 Damage. Choose 1 Rare Card.",
            requirement: { minHP: 4 }, // Button disabled if HP <= 3
            effects: [
              { type: "damage", amount: 3 },
              { type: "cardReward", rarity: "rare", choices: 3 },
            ],
            nextStage: "sacrificed",
          },
          {
            text: "[Ambush] Draw your weapon! (Trigger Combat)",
            effects: [
              { type: "triggerCombat", encounterId: "shrine_guardian" },
            ],
            nextStage: null, // Exits event directly into battle
          },
          {
            text: "[Leave] Walk away.",
            effects: [],
            nextStage: null, // Null returns to map view
          },
        ],
      },

      // --- Stage 2A: Outcome after praying ---
      prayed: {
        text: "The shrine glows faintly, showering gold coins at your feet before dissolving into dust.",
        options: [{ text: "[Continue]", effects: [], nextStage: null }],
      },

      // --- Stage 2B: Outcome after sacrificing ---
      sacrificed: {
        text: "A sudden sharp pain pierces your soul, but knowledge of a dark technique manifests before you.",
        options: [{ text: "[Continue]", effects: [], nextStage: null }],
      },
    },
  },
  {
    id: "A1_002",
    title: "An Unsuspectic Crate",
    art: placeholderArt,
    initialStage: "start",
    stages: {
      start: {
        text: "You find a generic looking box. It carries no markings or other destinctive features.",
        options: [
          {
            text: "[Open] Open the crate...",
            effects: [{ type: "cardReward", rarity: "uncommon", choices: 3 }],
            nextStage: "opened",
          },
          {
            text: "[Leave] Ignore the crate...",
            effects: [],
            nextStage: "left",
          },
        ],
      },
      opened: {
        text: "The crate contains a manual on certain combat techniques!",
        options: [{ text: "[Continue]", effects: [], nextStage: null }],
      },

      left: {
        text: "You leave the crate. There are many just like it, why would this one be any special?",
        options: [{ text: "[Continue]", effects: [], nextStage: null }],
      },
    },
  },
  {
    id: "A1_003",
    title: "A Chomping Turtle",
    art: placeholderArt,
    initialStage: "start",
    stages: {
      start: {
        text: "",
        options: [
          {
            text: "",
            effects: "",
            nextStage: "",
          },
        ],
      },
    },
  },
];

export const universalEvents = [{}];
