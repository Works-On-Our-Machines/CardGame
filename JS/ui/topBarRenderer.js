import { runState } from "../state/runState.js";

export function renderTopBar() {
  let topBar = document.getElementById("global-top-bar");

  if (!topBar) {
    topBar = document.createElement("div");
    topBar.id = "global-top-bar";
    topBar.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      background: #181a20;
      border-bottom: 2px solid #2a2d37;
      padding: 10px 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 2000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      box-sizing: border-box;
    `;
  }

  updateTopBar(topBar);
  return topBar;
}

export function updateTopBar(targetEl = null) {
  const topBar = targetEl || document.getElementById("global-top-bar");
  if (!topBar) return;

  const artefactsHTML =
    runState.artefacts.length === 0
      ? `<span style="color: #666; font-size: 0.85rem; font-style: italic;">No Artefacts</span>`
      : runState.artefacts
          .map(
            (r) => `
          <div class="reward-item" title="${r.name}" style="padding: 4px 10px; font-size: 0.65rem; background: #252836; border: 1px solid #454962;">
            🛡️ ${r.name}
          </div>
        `,
          )
          .join("");

  topBar.innerHTML = `
    <div class="row justify-evenly align-center" style="font-weight: bold; font-size: 0.65rem;">
      <div style="color: #3498db;">📌 Floor: <span style="color: #fff;">${runState.floor}</span></div>
      <div style="color: #e74c3c;">❤️ HP: <span style="color: #fff;">${runState.currentHP} / ${runState.maxHP}</span></div>
      <div style="color: #f1c40f;">🪙 Gold: <span style="color: #fff;">${runState.currency}</span></div>
    </div>
    <div class="row align-center gap-1" style="min-height: 20px; padding-top: 4px; border-top: 1px solid #2a2d37;">
      <span style="font-size: 0.8rem; color: #888; font-weight: bold; text-transform: uppercase;">Artifacts:</span>
      <div class="row align-center gap-1" style="flex-wrap: wrap;">
        ${artefactsHTML}
      </div>
    </div>
  `;
}
