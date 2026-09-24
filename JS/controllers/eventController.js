// JS/controllers/eventController.js
import { runState } from "../state/runState.js";
import { createEventView } from "../ui/eventRenderer.js";
import { showMapView, loadBoardView } from "../main.js";
import { showRewardScreen } from "./rewardController.js";
import { renderTopBar, updateTopBar } from "../ui/topBarRenderer.js"; // Import renderTopBar & updateTopBar

let currentActiveEvent = null;

export function startEvent(eventData, stageKey = null) {
  if (eventData && eventData.id) {
    runState.recordVisitedEvent(eventData.id);
  }

  currentActiveEvent = eventData;
  const initialStage = stageKey || eventData.initialStage || "start";
  renderStage(initialStage);
}

function renderStage(stageKey) {
  const appContainer = document.getElementById("app") || document.body;
  appContainer.innerHTML = "";

  // 1. Re-mount the Top Bar first so it stays on screen
  const topBar = renderTopBar();
  appContainer.appendChild(topBar);

  // 2. Render and append the Event View below the Top Bar
  const eventView = createEventView(
    currentActiveEvent,
    stageKey,
    (selectedOption) => {
      handleOptionSelect(selectedOption);
    },
  );

  appContainer.appendChild(eventView);
}

function handleOptionSelect(option) {
  // 1. Process instant non-modal numerical effects (currency, HP, Relics)
  const executionContext = processEffects(option.effects || []);

  // 2. Check if this option includes a card reward modal request
  const cardEffect = (option.effects || []).find(
    (e) => e.type === "cardReward",
  );

  // Helper function to proceed with stage transition or map return
  const proceedToNextStage = () => {
    if (executionContext.triggeredCombat) {
      loadBoardView();
      return;
    }

    if (option.nextStage) {
      renderStage(option.nextStage);
    } else {
      currentActiveEvent = null;
      showMapView();
    }
  };

  // 3. Trigger standard reward modal if requested; otherwise advance directly
  if (cardEffect) {
    showRewardScreen(
      {
        rarity: cardEffect.rarity || "any",
        choices: cardEffect.choices || 3,
        cardId: cardEffect.cardId || null,
        onComplete: proceedToNextStage,
      },
      proceedToNextStage,
    );
  } else {
    proceedToNextStage();
  }
}

function processEffects(effects) {
  const context = { triggeredCombat: false };
  let statsChanged = false;

  effects.forEach((effect) => {
    switch (effect.type) {
      case "currency":
      case "gold":
        runState.currency = Math.max(
          0,
          runState.currency + (effect.amount || 0),
        );
        statsChanged = true;
        break;

      case "damage":
        runState.currentHP = Math.max(
          0,
          runState.currentHP - (effect.amount || 0),
        );
        statsChanged = true;
        break;

      case "heal":
        runState.currentHP = Math.min(
          runState.maxHP,
          runState.currentHP + (effect.amount || 0),
        );
        statsChanged = true;
        break;

      case "gainRelic":
        runState.relics.push({
          id: effect.relicId || `relic_${Date.now()}`,
          name: effect.name || "Artifact",
          pool: effect.pool || "generic",
        });
        statsChanged = true;
        break;

      case "triggerCombat":
        context.triggeredCombat = true;
        break;

      case "cardReward":
        // Handled via modal callback in handleOptionSelect
        break;

      default:
        console.warn(`[Event] Unhandled effect type: ${effect.type}`);
    }
  });

  // Re-render Top Bar if currency, HP, or artifacts changed
  if (statsChanged) {
    updateTopBar();
  }

  return context;
}
