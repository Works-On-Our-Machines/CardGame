const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Creates and renders the complete Map View DOM structure dynamically.
 * @param {Array} mapData - Array of row objects: [{ row: 0, nodes: [...] }, ...]
 * @param {Function} onNodeClick - Callback triggered when an available node is clicked
 * @returns {HTMLElement} The root map view container element
 */

export function createMapView(mapData, onNodeClick = () => {}) {
  const mapContainer = document.createElement("div");
  mapContainer.className = "map-view-container";

  // 1. Create SVG Layer for connection lines (positioned absolutely behind nodes)
  const svgLayer = document.createElementNS(SVG_NS, "svg");
  svgLayer.setAttribute("class", "map-svg-layer");
  mapContainer.appendChild(svgLayer);

  // 2. Create Nodes Layer for floor rows
  const nodesLayer = document.createElement("div");
  nodesLayer.className = "map-nodes-layer";
  mapContainer.appendChild(nodesLayer);

  // Map to store node DOM elements by ID for SVG positioning calculations
  const nodeElementsMap = new Map();

  // Render rows (Row 0 through Row N)
  mapData.forEach((rowData) => {
    const rowEl = document.createElement("div");
    rowEl.className = "map-row";
    rowEl.dataset.row = rowData.row;

    rowData.nodes.forEach((node) => {
      const nodeBtn = document.createElement("button");
      nodeBtn.className = `map-node node-${node.type} status-${node.status || "locked"}`;
      nodeBtn.dataset.id = node.id;
      nodeBtn.dataset.type = node.type;

      // Node Icon container
      const iconSpan = document.createElement("span");
      iconSpan.className = "node-icon";
      iconSpan.textContent = getNodeSymbol(node.type);
      nodeBtn.appendChild(iconSpan);

      // Node Click Event
      nodeBtn.addEventListener("click", () => {
        if (node.status === "available") {
          onNodeClick(node);
        }
      });

      rowEl.appendChild(nodeBtn);
      nodeElementsMap.set(node.id, nodeBtn);
    });

    nodesLayer.appendChild(rowEl);
  });

  // 3. Draw SVG path lines after elements are mounted in layout
  requestAnimationFrame(() => {
    drawConnections(mapData, nodeElementsMap, svgLayer, mapContainer);
  });

  return mapContainer;
}

/**
 * Draws curved SVG paths between connected node elements.
 */
export function drawConnections(
  mapData,
  nodeElementsMap,
  svgLayer,
  containerEl,
) {
  svgLayer.innerHTML = ""; // Clear existing paths

  // 1. Force SVG canvas to match total scrollable content dimensions
  const scrollWidth = Math.max(
    containerEl.scrollWidth,
    containerEl.clientWidth,
  );
  const scrollHeight = Math.max(
    containerEl.scrollHeight,
    containerEl.clientHeight,
  );

  svgLayer.setAttribute("width", scrollWidth);
  svgLayer.setAttribute("height", scrollHeight);
  svgLayer.style.width = `${scrollWidth}px`;
  svgLayer.style.height = `${scrollHeight}px`;

  const containerRect = containerEl.getBoundingClientRect();

  // 2. Draw connections
  mapData.forEach((rowData) => {
    rowData.nodes.forEach((node) => {
      const parentEl = nodeElementsMap.get(node.id);
      if (!parentEl || !node.connections) return;

      const parentCenter = getNodeCenter(parentEl, containerRect, containerEl);

      node.connections.forEach((targetId) => {
        const childEl = nodeElementsMap.get(targetId);
        if (!childEl) return;

        const childCenter = getNodeCenter(childEl, containerRect, containerEl);

        // Draw smooth cubic Bezier path
        const path = document.createElementNS(SVG_NS, "path");
        const pathData = createCurvedPath(parentCenter, childCenter);
        path.setAttribute("d", pathData);
        path.setAttribute(
          "class",
          `map-path ${node.status === "completed" ? "completed" : ""}`,
        );

        svgLayer.appendChild(path);
      });
    });
  });
}

/**
 * Calculates center coordinates of a node relative to the map container.
 */
function getNodeCenter(nodeEl, containerRect, containerEl) {
  const rect = nodeEl.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2 - containerRect.left + containerEl.scrollLeft,
    y: rect.top + rect.height / 2 - containerRect.top + containerEl.scrollTop,
  };
}

/**
 * Generates a cubic Bezier curve string between two coordinates.
 */
function createCurvedPath(start, end) {
  const deltaY = end.y - start.y;
  const controlY1 = start.y + deltaY * 0.4;
  const controlY2 = end.y - deltaY * 0.4;

  return `M ${start.x} ${start.y} C ${start.x} ${controlY1}, ${end.x} ${controlY2}, ${end.x} ${end.y}`;
}

/**
 * Basic symbol mapping for visual verification.
 */
function getNodeSymbol(type) {
  const symbols = {
    startingArea: "🏁",
    combat: "⚔️",
    event: "❓",
    elite: "💀",
    rest: "🔥",
    shop: "💰",
    boss: "👑",
  };
  return symbols[type] || "•";
}
