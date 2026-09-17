// JS/main.js
import { setupBoard } from "./controllers/boardController.js";
import { gameState } from "./state/gameState.js";
import { generateMap } from "./engine/mapGenerator.js";
import { createMapView } from "./ui/mapRenderer.js";
import { runState } from "./state/runState.js";
import { startEvent } from "./controllers/eventController.js";
import { act1Events } from "./data/eventsData.js";
import { startingBoonsEvent } from "./data/eventsData.js";

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

function handleNodeClick(node) {
  // Advance run state progression
  const selectedNode = runState.selectNode(node.id);
  if (!selectedNode) return;

  console.log(`Visited ${selectedNode.type} node (${selectedNode.id})`);

  // View routing based on node type
  switch (selectedNode.type) {
    case "startingArea":
      startEvent(startingBoonsEvent);
      break;

    case "event": {
      const randomEvent =
        act1Events[Math.floor(Math.random() * act1Events.length)];
      if (randomEvent) {
        startEvent(randomEvent);
      } else {
        console.warn("No events found in act1Events pool.");
        showMapView();
      }
      break;
    }

    case "combat":
    case "elite":
    case "boss":
      loadBoardView();
      break;

    default:
      // Re-render map view for unimplemented node types (e.g. rest, shop)
      showMapView();
      break;
  }
}

// Global window attachments for browser console testing
window.showMapView = showMapView;
window.loadBoardView = loadBoardView;
window.runState = runState;

document.addEventListener("DOMContentLoaded", () => {
  showMapView();
});
