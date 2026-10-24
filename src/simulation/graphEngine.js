/**
 * CityTwin Graph Engine
 * Deterministic Graph Representation, Dijkstra Pathfinding, and BPR Congestion Functions
 */

import { BENGALURU_NODES, BENGALURU_EDGES } from '../data/bengaluruRoadGraph.js';

/**
 * Standard Bureau of Public Roads (BPR) link performance function:
 * TravelTime = FreeFlowTime * (1 + alpha * (Flow / Capacity)^beta)
 */
export function calculateBPRTravelTime(edge, flowOverride = null, alpha = 0.15, beta = 4.0) {
  const freeFlowTimeMinutes = (edge.distanceKm / edge.freeFlowSpeed) * 60;
  const flow = flowOverride !== null ? flowOverride : edge.baselineTraffic;
  const vcRatio = Math.max(0, flow / edge.capacity);
  const congestionMultiplier = 1 + alpha * Math.pow(vcRatio, beta);
  return {
    travelTimeMinutes: freeFlowTimeMinutes * congestionMultiplier,
    freeFlowTimeMinutes,
    vcRatio,
    congestionMultiplier
  };
}

export function getIncidentEdgeIds(nodeId, edges = BENGALURU_EDGES) {
  return new Set(edges
    .filter((edge) => edge.from === nodeId || edge.to === nodeId)
    .map((edge) => edge.id));
}

/**
 * Builds an adjacency list from the nodes and edges, applying closure masks and dynamic weights.
 */
export function buildAdjacencyGraph(edges = BENGALURU_EDGES, options = {}) {
  const {
    closedEdgeIds = new Set(),
    flowMultiplier = 1.0,
    edgeWeightFn = null
  } = options;

  const adj = {};
  for (const nodeId of Object.keys(BENGALURU_NODES)) {
    adj[nodeId] = [];
  }

  for (const edge of edges) {
    if (closedEdgeIds.has(edge.id)) {
      // Road is closed: do not add to traversable graph edges
      continue;
    }

    const flow = edge.baselineTraffic * flowMultiplier;
    let weight;

    if (edgeWeightFn) {
      weight = edgeWeightFn(edge, flow);
    } else {
      const bpr = calculateBPRTravelTime(edge, flow);
      weight = bpr.travelTimeMinutes;
    }

    // Graph is bi-directional for city street networks with directional coordinates
    adj[edge.from].push({
      node: edge.to,
      edge,
      weight,
      reverse: false
    });

    adj[edge.to].push({
      node: edge.from,
      edge,
      weight,
      reverse: true
    });
  }

  return adj;
}

/**
 * Dijkstra shortest path algorithm
 * Returns: { path: [nodeIds], edges: [edgeObjs], totalCost, coordinates: [[lng, lat]] }
 */
export function dijkstraShortestPath(adj, startNodeId, targetNodeId) {
  if (!adj[startNodeId] || !adj[targetNodeId]) {
    return null;
  }

  const distances = {};
  const previous = {};
  const previousEdge = {};
  const visited = new Set();
  const queue = new Set(Object.keys(BENGALURU_NODES));

  for (const node of queue) {
    distances[node] = Infinity;
  }
  distances[startNodeId] = 0;

  while (queue.size > 0) {
    // Find unvisited node with smallest distance
    let current = null;
    let minDistance = Infinity;

    for (const node of queue) {
      if (distances[node] < minDistance) {
        minDistance = distances[node];
        current = node;
      }
    }

    if (current === null || minDistance === Infinity) {
      break; // Remaining nodes are unreachable
    }

    if (current === targetNodeId) {
      break; // Reached target
    }

    queue.delete(current);
    visited.add(current);

    const neighbors = adj[current] || [];
    for (const neighbor of neighbors) {
      if (visited.has(neighbor.node)) continue;

      const alt = distances[current] + neighbor.weight;
      if (alt < distances[neighbor.node]) {
        distances[neighbor.node] = alt;
        previous[neighbor.node] = current;
        previousEdge[neighbor.node] = {
          edge: neighbor.edge,
          reverse: neighbor.reverse
        };
      }
    }
  }

  if (distances[targetNodeId] === Infinity) {
    return null; // No path found
  }

  // Reconstruct path
  const pathNodes = [];
  const pathEdges = [];
  const pathEntries = [];

  let curr = targetNodeId;
  while (curr) {
    pathNodes.unshift(curr);
    const prevEntry = previousEdge[curr];
    if (prevEntry) {
      pathEdges.unshift(prevEntry.edge);
      pathEntries.unshift(prevEntry);
    }
    curr = previous[curr];
  }

  // Build clean continuous route coordinates in forward origin -> destination order
  const coordinates = [];
  for (let i = 0; i < pathEntries.length; i++) {
    const entry = pathEntries[i];
    const edgeCoords = entry.edge.coordinates;
    const ordered = entry.reverse ? [...edgeCoords].reverse() : [...edgeCoords];

    if (coordinates.length === 0) {
      coordinates.push(...ordered);
    } else {
      // Append points, skipping the first point since it connects with previous edge's end
      coordinates.push(...ordered.slice(1));
    }
  }

  // If coordinates list is empty (e.g. single node), fallback to node coords
  if (coordinates.length === 0 && BENGALURU_NODES[startNodeId]) {
    coordinates.push(BENGALURU_NODES[startNodeId].coordinates);
  }

  return {
    path: pathNodes,
    edges: pathEdges,
    totalCost: distances[targetNodeId],
    distanceKm: pathEdges.reduce((sum, e) => sum + e.distanceKm, 0),
    coordinates
  };
}

/**
 * Calculates synthetic volume-to-capacity (V/C) and congestion levels for all edges
 */
export function computeNetworkCongestion(edges = BENGALURU_EDGES, flows = {}, flowMultiplier = 1.0) {
  const edgeMetrics = {};

  for (const edge of edges) {
    const rawFlow = flows[edge.id] !== undefined ? flows[edge.id] : edge.baselineTraffic;
    const effectiveFlow = rawFlow * flowMultiplier;
    const bpr = calculateBPRTravelTime(edge, effectiveFlow);

    let congestionStatus = "free_flow"; // green
    if (bpr.vcRatio >= 1.0) {
      congestionStatus = "severe"; // red
    } else if (bpr.vcRatio >= 0.75) {
      congestionStatus = "congested"; // amber
    } else if (bpr.vcRatio >= 0.5) {
      congestionStatus = "moderate"; // yellow
    }

    edgeMetrics[edge.id] = {
      edgeId: edge.id,
      name: edge.name,
      effectiveFlow: Math.round(effectiveFlow),
      capacity: edge.capacity,
      vcRatio: Number(bpr.vcRatio.toFixed(2)),
      travelTimeMinutes: Number(bpr.travelTimeMinutes.toFixed(1)),
      freeFlowTimeMinutes: Number(bpr.freeFlowTimeMinutes.toFixed(1)),
      congestionStatus
    };
  }

  return edgeMetrics;
}
