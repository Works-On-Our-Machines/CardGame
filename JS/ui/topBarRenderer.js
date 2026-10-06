// JS/ui/topBarRenderer.js
import { runState } from "../state/runState.js";
import { artefactDatabase } from "../data/artefactDatabase.js"; // ◄ Import the database to look up names

export function renderTopBar() {
  let topBar = document.getElementById("global-top-bar");

  if (!topBar) {
    topBar = document.createElement("div");
    topBar.id = "global-top-bar";
    // All inline styles moved to CSS/topbar.css
  }

  updateTopBar(topBar);
  return topBar;
}

export function updateTopBar(targetEl = null) {
  const topBar = targetEl || document.getElementById("global-top-bar");
  if (!topBar) return;

  const artefactsHTML =
    runState.artefacts.length === 0
      ? `<span class="topbar-empty-artefacts">No Artefacts</span>`
      : runState.artefacts
          .map((r) => {
            // BUG FIX: Get the ID string, then look it up in the database
            const artefactId = typeof r === "string" ? r : r.id;
            const artefactData = artefactDatabase[artefactId];
            const artefactName = artefactData
              ? artefactData.name
              : "Unknown Artefact";

            return `
          <div class="reward-item topbar-artefact-tag" title="${artefactName}">
            🛡️ ${artefactName}
          </div>
        `;
          })
          .join("");

  topBar.innerHTML = `
    <div class="row justify-evenly align-center topbar-stats-row">
      <div class="topbar-stat-floor">📌 Floor: <span class="topbar-stat-value">${runState.floor}</span></div>
      <div class="topbar-stat-hp">❤️ HP: <span class="topbar-stat-value">${runState.currentHP} / ${runState.maxHP}</span></div>
      <div class="topbar-stat-gold">🪙 Gold: <span class="topbar-stat-value">${runState.currency}</span></div>
    </div>
    <div class="row align-center gap-1 topbar-artefacts-row">
      <span class="topbar-artefacts-label">Artifacts:</span>
      <div class="row align-center gap-1 flex-wrap">
        ${artefactsHTML}
      </div>
    </div>
  `;
}
