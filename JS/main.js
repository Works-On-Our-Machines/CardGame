// JS/main.js
import { setupBoard } from "./controllers/boardController.js";
import { gameState } from "./state/gameState.js";
import { generateMap } from "./engine/mapGenerator.js";
import { createMapView } from "./ui/mapRenderer.js";
import { runState } from "./state/runState.js";

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

  // 1. Save scroll position of current map container before wiping DOM
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

  // 2. Restore previous scroll position, or focus bottom (Floor 0) on initial load
  if (savedScrollTop !== null) {
    mapView.scrollTop = savedScrollTop;
  } else {
    // Scroll to bottom because floors stack from bottom (Floor 0) to top (Floor 15)
    mapView.scrollTop = mapView.scrollHeight;
  }
}

function handleNodeClick(node) {
  // 1. Advance runState (marks node completed, locks choices, opens children)
  const selectedNode = runState.selectNode(node.id);
  if (!selectedNode) return;

  console.log(`Visited ${selectedNode.type} node (${selectedNode.id})`);

  // 2. Route view based on node type
  if (["combat", "elite", "boss"].includes(selectedNode.type)) {
    loadBoardView();
  } else {
    // Re-render map view for non-combat nodes (rest/shop/event) for now
    showMapView();
  }
}

// Global window attachment for console testing
window.showMapView = showMapView;
window.loadBoardView = loadBoardView;
window.runState = runState;

document.addEventListener("DOMContentLoaded", () => {
  showMapView();
});
