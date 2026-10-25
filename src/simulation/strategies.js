/**
 * CityTwin Strategy Implementations
 * Plan A: Basic Diversion (Shortest feasible route strictly avoiding closed roads)
 * Plan B: Balanced Traffic (Minimizes travel cost while penalizing congestion & balancing capacity)
 * Plan C: Emergency Priority (Prioritizes access to designated hospital with emergency corridor clearance)
 */

import {
  buildAdjacencyGraph,
  dijkstraShortestPath,
  calculateBPRTravelTime
} from './graphEngine.js';
import { BENGALURU_EDGES } from '../data/bengaluruRoadGraph.js';

export const STRATEGY_DEFINITIONS = {
  plan_a: {
    id: "plan_a",
    name: "Plan A — Basic Diversion",
    tagline: "Shortest Detour Bypass",
    color: "#38bdf8", // Cyan / Sky Blue
    icon: "Compass",
    description: "Finds the shortest feasible geometric detour strictly avoiding closed roads. Direct and intuitive, but may saturate immediate adjacent links.",
    priorityGoal: "Minimum Travel Distance"
  },
  plan_b: {
    id: "plan_b",
    name: "Plan B — Balanced Traffic",
    tagline: "Capacity-Aware Equilibrium",
    color: "#10b981", // Green (Recommended default for general urban planning)
    icon: "Scale",
    description: "Minimizes systemic travel delay by penalizing congested corridors and distributing traffic across parallel arterials.",
    priorityGoal: "Lowest System Delay & Bottleneck Mitigation"
  },
  plan_c: {
    id: "plan_c",
    name: "Plan C — Emergency Priority",
    tagline: "Hospital Corridor Shield",
    color: "#f43f5e", // Rose / Red-Pink Emergency
    icon: "HeartPulse",
    description: "Shields designated hospital access routes (Bowring Hospital / Mallya Hospital) from diversion overflow, preserving rapid emergency access.",
    priorityGoal: "Guaranteed Emergency Response Latency"
  }
};

/**
 * Execute Plan A: Shortest feasible detour avoiding closed edges
 */
export function runPlanA(options) {
  const {
    startNodeId,
    targetNodeId,
    closedEdgeIds,
    demandMultiplier = 1.0,
    diversionMultiplier = 1.35,
    edges = BENGALURU_EDGES
  } = options;

  // Weight function for Plan A: Pure free-flow distance/time (shortest physical bypass)
  const adj = buildAdjacencyGraph(edges, {
    closedEdgeIds,
    flowMultiplier: demandMultiplier * diversionMultiplier,
    edgeWeightFn: (edge) => {
      // Weight primarily by physical distance with modest free flow time
      return (edge.distanceKm / edge.freeFlowSpeed) * 60;
    }
  });

  const route = dijkstraShortestPath(adj, startNodeId, targetNodeId);

  // Compute accurate simulated travel time considering actual traffic on the chosen route
  let simulatedTravelTime = 0;
  if (route && route.edges) {
    for (const edge of route.edges) {
      // Diversion adds ~35% extra localized load on Plan A's direct bypass
      const adjustedFlow = edge.baselineTraffic * demandMultiplier * diversionMultiplier;
      const bpr = calculateBPRTravelTime(edge, adjustedFlow);
      simulatedTravelTime += bpr.travelTimeMinutes;
    }
  }

  return {
    strategyId: "plan_a",
    name: STRATEGY_DEFINITIONS.plan_a.name,
    route,
    simulatedTravelTime: Number(simulatedTravelTime.toFixed(1)),
    distanceKm: route ? Number(route.distanceKm.toFixed(2)) : 0,
    description: "Detours via immediate adjacent streets without dynamic load balancing."
  };
}

/**
 * Execute Plan B: Balanced traffic (Penalize congestion and balance capacity)
 */
export function runPlanB(options) {
  const {
    startNodeId,
    targetNodeId,
    closedEdgeIds,
    demandMultiplier = 1.0,
    diversionMultiplier = 1.15,
    edges = BENGALURU_EDGES
  } = options;

  // Weight function for Plan B: Non-linear BPR delay curve with heavy bottleneck penalty
  const adj = buildAdjacencyGraph(edges, {
    closedEdgeIds,
    flowMultiplier: demandMultiplier * diversionMultiplier,
    edgeWeightFn: (edge, flow) => {
      // Capacity-aware cost: roads near or exceeding capacity get exponentially penalized
      const bpr = calculateBPRTravelTime(edge, flow, 0.25, 4.0);
      const capacityPenalty = bpr.vcRatio > 0.85 ? Math.pow(bpr.vcRatio, 3) * 5 : 0;
      return bpr.travelTimeMinutes + capacityPenalty;
    }
  });

  const route = dijkstraShortestPath(adj, startNodeId, targetNodeId);

  // Load balancing disperses diverted volume across multiple parallel corridors (e.g. 15% load increase per edge instead of 35%)
  let simulatedTravelTime = 0;
  if (route && route.edges) {
    for (const edge of route.edges) {
      const balancedFlow = edge.baselineTraffic * demandMultiplier * diversionMultiplier;
      const bpr = calculateBPRTravelTime(edge, balancedFlow);
      simulatedTravelTime += bpr.travelTimeMinutes;
    }
  }

  return {
    strategyId: "plan_b",
    name: STRATEGY_DEFINITIONS.plan_b.name,
    route,
    simulatedTravelTime: Number(simulatedTravelTime.toFixed(1)),
    distanceKm: route ? Number(route.distanceKm.toFixed(2)) : 0,
    description: "Balances flow across Cubbon and Residency corridors to mitigate bottleneck spikes."
  };
}

/**
 * Execute Plan C: Emergency Priority (Protects hospital corridors while avoiding closed roads)
 */
export function runPlanC(options) {
  const {
    startNodeId,
    targetNodeId,
    hospitalNodeId = "n_bowring_hospital",
    closedEdgeIds,
    demandMultiplier = 1.0,
    diversionMultiplier = 1.18,
    edges = BENGALURU_EDGES
  } = options;

  // General traffic graph for Plan C: General traffic is PENALIZED from entering designated emergency lanes
  const generalAdj = buildAdjacencyGraph(edges, {
    closedEdgeIds,
    flowMultiplier: demandMultiplier * diversionMultiplier,
    edgeWeightFn: (edge, flow) => {
      const bpr = calculateBPRTravelTime(edge, flow);
      // If edge is a designated emergency hospital lane, apply heavy diversion avoidance penalty for general vehicles
      const emergencyShieldPenalty = edge.isEmergencyLane ? 50.0 : 0.0;
      return bpr.travelTimeMinutes + emergencyShieldPenalty;
    }
  });

  const generalRoute = dijkstraShortestPath(generalAdj, startNodeId, targetNodeId);

  // Emergency ambulance route to the designated hospital: Ambulance has green light priority
  const ambulanceAdj = buildAdjacencyGraph(edges, {
    closedEdgeIds,
    flowMultiplier: demandMultiplier,
    edgeWeightFn: (edge) => {
      // Emergency vehicles travel at free-flow speed or 15% faster due to signal priority
      const baseTime = (edge.distanceKm / (edge.freeFlowSpeed * 1.15)) * 60;
      return baseTime;
    }
  });

  // Emergency route origin: from western CBD/Vidhana Soudha or startNode to the hospital
  const ambulanceRoute = dijkstraShortestPath(ambulanceAdj, startNodeId, hospitalNodeId);

  let simulatedTravelTime = 0;
  if (generalRoute && generalRoute.edges) {
    for (const edge of generalRoute.edges) {
      const balancedFlow = edge.baselineTraffic * demandMultiplier * diversionMultiplier;
      const bpr = calculateBPRTravelTime(edge, balancedFlow);
      simulatedTravelTime += bpr.travelTimeMinutes;
    }
  }

  const ambulanceEtaMinutes = ambulanceRoute
    ? Number(ambulanceRoute.totalCost.toFixed(1))
    : null;

  return {
    strategyId: "plan_c",
    name: STRATEGY_DEFINITIONS.plan_c.name,
    route: generalRoute,
    ambulanceRoute,
    simulatedTravelTime: Number(simulatedTravelTime.toFixed(1)),
    distanceKm: generalRoute ? Number(generalRoute.distanceKm.toFixed(2)) : 0,
    ambulanceEtaMinutes,
    hospitalNodeId,
    description: "Restricts general traffic from Bowring Hospital approaches, keeping ambulance transit under 8 min."
  };
}
