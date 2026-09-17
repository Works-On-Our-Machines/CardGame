// JS/engine/mapGenerator.js
import { MAP_CONFIG } from "../data/mapConfig.js";

/**
 * Generates a complete procedural map based on the provided configuration rules.
 * @param {Object} config - Configuration object (defaults to MAP_CONFIG)
 * @returns {Array} Array of floor row objects: [{ row: 0, nodes: [...] }, ...]
 */

export function generateMap(config = MAP_CONFIG) {
  // Step 1: Initialize grid with empty node objects per row
  const mapData = createNodeGrid(config);

  // Step 2: Build non-crossing connections (edges) between adjacent rows
  buildConnections(mapData, config);

  // Step 3: Assign node types (Combat, Event, Elite, Rest, Shop, Boss)
  assignNodeTypes(mapData, config);

  // Step 4: Validate & balance overall type counts (min/max elites, rests, shops)
  enforceGlobalRestrictions(mapData, config);

  // Step 5: Initialize node statuses (Floor 0 completed, connected Floor 1 nodes available)
  initializeStatuses(mapData);

  return mapData;
}

/* =========================================================
   1. GRID INITIALIZATION
   ========================================================= */

function createNodeGrid(config) {
  const mapData = [];

  for (let row = 0; row <= config.totalFloors; row++) {
    let nodeCount = getRandomInt(config.minNodesPerRow, config.maxNodesPerRow);

    // Override node count if explicitly defined for special floors (e.g. Row 0, 7, 15)
    if (config.fixedNodeCounts && config.fixedNodeCounts[row] !== undefined) {
      nodeCount = config.fixedNodeCounts[row];
    }

    const rowNodes = [];
    for (let col = 0; col < nodeCount; col++) {
      rowNodes.push({
        id: `${row}_${col}`,
        row: row,
        col: col,
        type: "combat", // Temporary placeholder before assignment step
        connections: [],
        status: "locked",
      });
    }

    mapData.push({ row, nodes: rowNodes });
  }

  return mapData;
}

/* =========================================================
   2. NON-CROSSING PATH GENERATION
   ========================================================= */

function buildConnections(mapData, config) {
  for (let r = 0; r < mapData.length - 1; r++) {
    const parentNodes = mapData[r].nodes;
    const childNodes = mapData[r + 1].nodes;

    const M = parentNodes.length;
    const N = childNodes.length;

    // Step A: Assign a primary parent for every child (prevents orphan children)
    // Proportional mapping naturally preserves left-to-right order without crossing
    for (let j = 0; j < N; j++) {
      let pIdx = Math.floor((j / N) * M);
      pIdx = Math.min(pIdx, M - 1);
      parentNodes[pIdx].connections.push(childNodes[j].id);
    }

    // Step B: Ensure every parent has at least 1 outgoing connection
    for (let i = 0; i < M; i++) {
      if (parentNodes[i].connections.length === 0) {
        // Strict boundary bounds to prevent crossing
        const minJ = getMaxConnectedChildCol(parentNodes, 0, i - 1);
        const maxJ = getMinConnectedChildCol(parentNodes, i + 1, M - 1, N - 1);

        let idealJ = Math.floor((i / M) * N);
        idealJ = Math.max(minJ, Math.min(maxJ, idealJ));

        parentNodes[i].connections.push(childNodes[idealJ].id);
      }
    }

    // Step C: Add optional branching up to maxOutgoingPaths without crossing lines
    parentNodes.forEach((parent, i) => {
      while (parent.connections.length < config.maxOutgoingPaths) {
        // Determine allowed child index window [minJ, maxJ] based on neighboring parents
        const minJ = getMaxConnectedChildCol(parentNodes, 0, i - 1);
        const maxJ = getMinConnectedChildCol(parentNodes, i + 1, M - 1, N - 1);

        const currentCols = parent.connections.map((id) =>
          parseInt(id.split("_")[1], 10),
        );
        const currentMin = Math.min(...currentCols);
        const currentMax = Math.max(...currentCols);

        // Candidate adjacent children that fall strictly within non-crossing boundaries
        const candidates = [];
        if (currentMin - 1 >= minJ && !currentCols.includes(currentMin - 1)) {
          candidates.push(currentMin - 1);
        }
        if (currentMax + 1 <= maxJ && !currentCols.includes(currentMax + 1)) {
          candidates.push(currentMax + 1);
        }

        if (candidates.length === 0 || Math.random() > 0.55) {
          break; // Stop branching if no valid non-crossing candidate or roll fails
        }

        const chosenJ =
          candidates[Math.floor(Math.random() * candidates.length)];
        parent.connections.push(childNodes[chosenJ].id);
      }

      // Sort connections left-to-right for clean rendering
      parent.connections.sort((a, b) => {
        const colA = parseInt(a.split("_")[1], 10);
        const colB = parseInt(b.split("_")[1], 10);
        return colA - colB;
      });
    });
  }
}

/**
 * Gets the highest child column index connected by any parent from startIdx to endIdx.
 */
function getMaxConnectedChildCol(parentNodes, startIdx, endIdx) {
  let maxCol = 0;
  for (let i = startIdx; i <= endIdx; i++) {
    if (i < 0 || i >= parentNodes.length) continue;
    parentNodes[i].connections.forEach((connId) => {
      const col = parseInt(connId.split("_")[1], 10);
      if (col > maxCol) maxCol = col;
    });
  }
  return maxCol;
}

/**
 * Gets the lowest child column index connected by any parent from startIdx to endIdx.
 */
function getMinConnectedChildCol(parentNodes, startIdx, endIdx, defaultVal) {
  let minCol = defaultVal;
  for (let i = startIdx; i <= endIdx; i++) {
    if (i < 0 || i >= parentNodes.length) continue;
    parentNodes[i].connections.forEach((connId) => {
      const col = parseInt(connId.split("_")[1], 10);
      if (col < minCol) minCol = col;
    });
  }
  return minCol;
}

/* =========================================================
   3. NODE TYPE ASSIGNMENT
   ========================================================= */

function assignNodeTypes(mapData, config) {
  mapData.forEach((rowData) => {
    const row = rowData.row;

    rowData.nodes.forEach((node) => {
      // 1. Guaranteed row rules
      if (config.guaranteedRows && config.guaranteedRows[row]) {
        const allowed = config.guaranteedRows[row];
        node.type = allowed[getRandomInt(0, allowed.length - 1)];
        return;
      }

      // 2. Roll weighted node type for intermediate rows
      const validWeights = { ...config.nodeWeights };

      // Filter out types restricted by minimum floor height
      if (row < config.typeRestrictions.firstPossibleEliteFloor)
        delete validWeights.elite;
      if (row < config.typeRestrictions.firstPossibleRestFloor)
        delete validWeights.rest;

      // LOOK-BACKWARD: Prevent consecutive types from parent nodes
      const incomingParents = getParentNodes(mapData, row, node.id);
      config.preventConsecutive.forEach((restrictedType) => {
        const parentHasType = incomingParents.some(
          (p) => p.type === restrictedType,
        );
        if (parentHasType) delete validWeights[restrictedType];
      });

      // LOOK-FORWARD: Prevent types if the NEXT row is guaranteed to contain them
      const nextRow = row + 1;
      if (config.guaranteedRows && config.guaranteedRows[nextRow]) {
        const upcomingGuaranteed = config.guaranteedRows[nextRow];
        config.preventConsecutive.forEach((restrictedType) => {
          if (upcomingGuaranteed.includes(restrictedType)) {
            delete validWeights[restrictedType];
          }
        });
      }

      node.type = pickWeightedType(validWeights);
    });
  });
}

/* =========================================================
   4. GLOBAL COUNT RESTRICTIONS & BALANCING
   ========================================================= */

function enforceGlobalRestrictions(mapData, config) {
  const counts = countNodeTypes(mapData);
  const restr = config.typeRestrictions;

  // Enforce minimum Elite nodes
  while (counts.elite < restr.minEliteNodes) {
    const candidate = findRandomNodeToSwap(
      mapData,
      config,
      "combat",
      restr.firstPossibleEliteFloor,
    );
    if (!candidate) break;
    candidate.type = "elite";
    counts.elite++;
    counts.combat--;
  }

  // Enforce maximum Elite nodes
  while (counts.elite > restr.maxEliteNodes) {
    const candidate = findRandomNodeToSwap(
      mapData,
      config,
      "elite",
      restr.firstPossibleEliteFloor,
    );
    if (!candidate) break;
    candidate.type = "combat";
    counts.elite--;
    counts.combat++;
  }

  // Enforce minimum Rest areas
  while (counts.rest < restr.minRestAreas) {
    const candidate = findRandomNodeToSwap(
      mapData,
      config,
      "event",
      restr.firstPossibleRestFloor,
    );
    if (!candidate) break;
    candidate.type = "rest";
    counts.rest++;
    counts.event--;
  }
}

/* =========================================================
   5. INITIAL STATUSES
   ========================================================= */

function initializeStatuses(mapData) {
  mapData.forEach((rowData) => {
    rowData.nodes.forEach((node) => {
      if (rowData.row === 0) {
        node.status = "available"; // Player starts here
      } else {
        node.status = "locked";
      }
    });
  });
}

/* =========================================================
   HELPERS
   ========================================================= */

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickWeightedType(weights) {
  const entries = Object.entries(weights);
  const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);

  if (totalWeight <= 0) return "combat"; // Fallback standard node

  let roll = Math.random() * totalWeight;
  for (const [type, weight] of entries) {
    if (roll < weight) return type;
    roll -= weight;
  }
  return "combat";
}

function getParentNodes(mapData, currentRow, nodeId) {
  if (currentRow === 0) return [];
  return mapData[currentRow - 1].nodes.filter((p) =>
    p.connections.includes(nodeId),
  );
}

function countNodeTypes(mapData) {
  const counts = {
    combat: 0,
    event: 0,
    elite: 0,
    rest: 0,
    shop: 0,
    boss: 0,
    startingArea: 0,
  };
  mapData.forEach((row) => {
    row.nodes.forEach((n) => {
      counts[n.type] = (counts[n.type] || 0) + 1;
    });
  });
  return counts;
}

function findRandomNodeToSwap(mapData, config, targetType, minFloor) {
  const candidates = [];

  mapData.forEach((row) => {
    if (row.row < minFloor) return;
    if (config.guaranteedRows && config.guaranteedRows[row.row]) return;

    // Skip rows directly adjacent to guaranteed rows containing targetType
    const prevGuaranteed =
      config.guaranteedRows && config.guaranteedRows[row.row - 1];
    const nextGuaranteed =
      config.guaranteedRows && config.guaranteedRows[row.row + 1];
    if (prevGuaranteed && prevGuaranteed.includes(targetType)) return;
    if (nextGuaranteed && nextGuaranteed.includes(targetType)) return;

    row.nodes.forEach((node) => {
      if (node.type === targetType) {
        // Prevent creating consecutive violations during post-generation swaps
        if (config.preventConsecutive.includes(targetType)) {
          const parents = getParentNodes(mapData, row.row, node.id);
          if (parents.some((p) => p.type === targetType)) return;
        }
        candidates.push(node);
      }
    });
  });

  if (candidates.length === 0) return null;
  return candidates[getRandomInt(0, candidates.length - 1)];
}
