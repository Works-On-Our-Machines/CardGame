import { runState } from "../state/runState.js";

/**
 * Creates and returns the DOM element for an event view stage.
 * @param {Object} eventData - The active event configuration object
 * @param {string} stageKey - Key of the stage to render (defaults to "start")
 * @param {Function} onOptionSelect - Callback function when an option is clicked
 * @returns {HTMLElement} The complete event view container
 */
export function createEventView(eventData, stageKey = "start", onOptionSelect) {
  const stage =
    eventData.stages[stageKey] || eventData.stages[eventData.initialStage];

  const container = document.createElement("div");
  container.className = "event-view-container";

  // Title
  const titleEl = document.createElement("h2");
  titleEl.className = "event-title";
  titleEl.textContent = eventData.title;
  container.appendChild(titleEl);

  // Body container (art + story text)
  const bodyEl = document.createElement("div");
  bodyEl.className = "event-body";

  if (eventData.art) {
    const artEl = document.createElement("img");
    artEl.className = "event-art";
    artEl.src = eventData.art;
    artEl.alt = eventData.title;
    bodyEl.appendChild(artEl);
  }

  const textEl = document.createElement("p");
  textEl.className = "event-text";
  textEl.textContent = stage.text;
  bodyEl.appendChild(textEl);

  container.appendChild(bodyEl);

  // Options buttons area
  const optionsEl = document.createElement("div");
  optionsEl.className = "event-options";

  stage.options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "event-option-btn";
    button.textContent = option.text;

    // Check requirement constraints (e.g. minHP, minGold)
    const canAfford = checkRequirement(option.requirement);
    if (!canAfford) {
      button.disabled = true;
      button.classList.add("disabled");
    } else {
      button.addEventListener("click", () => onOptionSelect(option));
    }

    optionsEl.appendChild(button);
  });

  container.appendChild(optionsEl);

  return container;
}

function checkRequirement(req) {
  if (!req) return true;
  if (req.minHP !== undefined && runState.currentHP < req.minHP) return false;
  if (req.minGold !== undefined && runState.currency < req.minGold)
    return false;
  return true;
}
