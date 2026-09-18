// JS/main.js
import { setupBoard } from "./controllers/boardController.js";
import { generateMap } from "./engine/mapGenerator.js";
import { createMapView } from "./ui/mapRenderer.js";
import { runState } from "./state/runState.js";
import { handleNodeClick } from "./controllers/mapController.js";

export async function loadBoardView() {
  const appContainer = document.getElementById("app");

  try {
    const response = await fetch("./HTML/board.html");
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const boardHTML = await response.text();
    appContainer.innerHTML = boardHTML;

    setupBoard();
  } catch (error) {
    console.error("Failed to load board view:", error);
  }
}

export function showMapView() {
  const appContainer = document.getElementById("app") || document.body;

  // Preserve scroll offset across re-renders
  const existingContainer = appContainer.querySelector(".map-view-container");
  const savedScrollTop = existingContainer ? existingContainer.scrollTop : null;

  appContainer.innerHTML = "";

  // Initialize a new run and generate map if none exists
  if (!runState.mapData || runState.mapData.length === 0) {
    runState.initNewRun();
    const newMap = generateMap();
    runState.setMap(newMap);
  }

  const mapView = createMapView(runState.mapData, handleNodeClick);
  appContainer.appendChild(mapView);

  if (savedScrollTop !== null) {
    mapView.scrollTop = savedScrollTop;
  } else {
    mapView.scrollTop = mapView.scrollHeight;
  }
}

// Global window attachments for browser console testing
window.showMapView = showMapView;
window.loadBoardView = loadBoardView;
window.runState = runState;

document.addEventListener("DOMContentLoaded", () => {
  showMapView();
});
