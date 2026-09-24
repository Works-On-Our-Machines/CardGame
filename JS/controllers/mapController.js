// JS/controllers/mapController.js
import { runState } from "../state/runState.js";
import { startEvent } from "./eventController.js";
import { act1Events, startingBoonsEvent } from "../data/eventsData.js";
import { loadBoardView, showMapView } from "../main.js";
import { updateTopBar } from "../ui/topBarRenderer.js";

/**
 * Handles node selection on the map, updates run state progression,
 * and routes the player to the appropriate view/event.
 * @param {Object} node - The map node clicked by the player
 */
export function handleNodeClick(node) {
  // 1. Advance run state progression
  const selectedNode = runState.selectNode(node.id);
  if (!selectedNode) return;

  updateTopBar();

  console.log(`Visited ${selectedNode.type} node (${selectedNode.id})`);

  // 2. View routing based on node type
  switch (selectedNode.type) {
    case "startingArea":
      startEvent(startingBoonsEvent);
      break;

    case "event": {
      // 1. Filter out events that exist in runState.visitedEvents
      const availableEvents = act1Events.filter(
        (event) => !runState.visitedEvents.includes(event.id),
      );

      // 2. Fall back to all act1Events if every event has already been seen
      const pool = availableEvents.length > 0 ? availableEvents : act1Events;
      const randomEvent = pool[Math.floor(Math.random() * pool.length)];

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
      // Re-render map view for unimplemented node types (e.g., rest, shop)
      showMapView();
      break;
  }
}
