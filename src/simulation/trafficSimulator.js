/**
 * CityTwin deterministic future traffic simulation.
 * All volumes are synthetic estimates derived from the seeded road graph.
 */

import { BENGALURU_NODES, BENGALURU_EDGES, getEdgeById } from '../data/bengaluruRoadGraph.js';
import {
  buildAdjacencyGraph,
  dijkstraShortestPath,
  calculateBPRTravelTime,
  computeNetworkCongestion,
  getIncidentEdgeIds
} from './graphEngine.js';
import { runPlanA, runPlanB, runPlanC } from './strategies.js';

export const DEMAND_MULTIPLIERS = { low: 0.80, medium: 1.00, high: 1.28 };

export const TIME_OF_DAY_CONFIG = {
  peak_morning: { label: 'Morning Rush (08:30 - 11:30)', startHour: 9 },
  midday: { label: 'Midday Business (12:00 - 16:00)', startHour: 14 },
  evening_rush: { label: 'Evening Peak (17:30 - 21:00)', startHour: 18 },
  late_night: { label: 'Late Night (22:00 - 05:00)', startHour: 23 }
};

export const SIMULATION_HOURS = [0, 1, 3, 6, 12, 24];

const HOURLY_DEMAND_PROFILE = [
  0.60, 0.60, 0.60, 0.60, 0.60, 0.60,
  0.75, 0.95, 1.15, 1.15, 1.08, 1.00,
  0.95, 0.95, 0.95, 0.95, 1.05, 1.25,
  1.25, 1.18, 1.05, 0.90, 0.70, 0.60
];

const STRATEGY_OPTIONS = {
  plan_a: { run: runPlanA, diversionFactor: 1.35 },
  plan_b: { run: runPlanB, diversionFactor: 1.15 },
  plan_c: { run: runPlanC, diversionFactor: 1.18 }
};

function getDemandMultiplier(params, hour) {
  const demand = DEMAND_MULTIPLIERS[params.demandLevel] ?? DEMAND_MULTIPLIERS.medium;
  const startHour = TIME_OF_DAY_CONFIG[params.timeOfDay]?.startHour ?? 9;
  return Number((demand * HOURLY_DEMAND_PROFILE[(startHour + hour) % 24]).toFixed(3));
}

function getClosureState(durationHours, hour) {
  const closureActive = hour < durationHours;
  const recoveryFactor = closureActive
    ? 1
    : durationHours <= 0
      ? 0
      : Number(Math.exp(-(hour - durationHours + 1) / 3).toFixed(4));
  return { closureActive, recoveryFactor };
}

function getRouteTravelTime(route, demandMultiplier, diversionFactor = 1, speedFactor = 1) {
  if (!route?.edges) return null;
  return Number(route.edges.reduce((sum, edge) => {
    const flow = edge.baselineTraffic * demandMultiplier * diversionFactor;
    return sum + calculateBPRTravelTime(edge, flow).travelTimeMinutes / speedFactor;
  }, 0).toFixed(1));
}

function scoreCongestion(metrics, closedEdgeIds = new Set()) {
  const openEdges = BENGALURU_EDGES.filter((edge) => !closedEdgeIds.has(edge.id));
  const averageVc = openEdges.reduce((sum, edge) => sum + metrics[edge.id].vcRatio, 0) / openEdges.length;
  const bottlenecks = openEdges.filter((edge) => metrics[edge.id].vcRatio >= 0.88);
  return {
    score: Math.min(100, Math.round(averageVc * 50)),
    bottlenecks: bottlenecks.map((edge) => ({
      edgeId: edge.id,
      name: edge.name,
      vcRatio: metrics[edge.id].vcRatio,
      travelTime: metrics[edge.id].travelTimeMinutes
    }))
  };
}

function getHospitalRouteTime({ hospitalNodeId, originNodeId, closedEdgeIds, demandMultiplier, diversionFactor }) {
  const adjacency = buildAdjacencyGraph(BENGALURU_EDGES, {
    closedEdgeIds,
    flowMultiplier: demandMultiplier,
    edgeWeightFn: (edge, flow) => calculateBPRTravelTime(edge, flow * diversionFactor).travelTimeMinutes
  });
  const route = dijkstraShortestPath(adjacency, originNodeId, hospitalNodeId);
  return { route, time: getRouteTravelTime(route, demandMultiplier, diversionFactor) };
}

function calculateHour(params, hour) {
  const {
    closedEdgeId = 'edge_mg_central',
    closedNodeId = null,
    closureTargetType = closedNodeId ? 'intersection' : 'road',
    durationHours = 6,
    selectedStrategy = 'plan_b',
    originNodeId = 'n_kumble_circle',
    destinationNodeId = 'n_trinity_circle',
    hospitalNodeId = 'n_bowring_hospital'
  } = params;
  const demandMultiplier = getDemandMultiplier(params, hour);
  const { closureActive: withinDuration, recoveryFactor } = getClosureState(durationHours, hour);
  const selectedEdge = getEdgeById(closedEdgeId) || BENGALURU_EDGES[1];
  const closureEdgeIds = closureTargetType === 'intersection'
    ? (closedNodeId ? getIncidentEdgeIds(closedNodeId) : new Set())
    : new Set([selectedEdge.id]);
  const closureEdges = BENGALURU_EDGES.filter((edge) => closureEdgeIds.has(edge.id));
  const closedEdge = closureEdges[0] || selectedEdge;
  const closureActive = withinDuration && closureEdgeIds.size > 0;
  const impactFactor = closureEdgeIds.size === 0 ? 0 : closureActive ? 1 : recoveryFactor;
  const closedEdgeIds = closureActive ? closureEdgeIds : new Set();

  const baselineAdjacency = buildAdjacencyGraph(BENGALURU_EDGES, { flowMultiplier: demandMultiplier });
  const baselineRoute = dijkstraShortestPath(baselineAdjacency, originNodeId, destinationNodeId);
  const baselineHospitalRoute = dijkstraShortestPath(baselineAdjacency, originNodeId, hospitalNodeId);
  const baselineTravelTime = getRouteTravelTime(baselineRoute, demandMultiplier);
  const baselineHospitalTime = getRouteTravelTime(baselineHospitalRoute, demandMultiplier);
  const baselineNetwork = computeNetworkCongestion(BENGALURU_EDGES, {}, demandMultiplier);
  const baselineCongestion = scoreCongestion(baselineNetwork);

  const planResults = {};
  const planNetworks = {};
  const hospitalResults = {};

  for (const [strategyId, options] of Object.entries(STRATEGY_OPTIONS)) {
    const diversionFactor = 1 + (options.diversionFactor - 1) * impactFactor;
    const plan = options.run({
      startNodeId: originNodeId,
      targetNodeId: destinationNodeId,
      hospitalNodeId,
      closedEdgeIds,
      demandMultiplier,
      diversionMultiplier: diversionFactor,
      edges: BENGALURU_EDGES
    });
    const routeFlows = {};
    for (const edgeId of closedEdgeIds) routeFlows[edgeId] = 0;
    const routeEdgeIds = new Set((plan.route?.edges || []).map((edge) => edge.id));
    for (const edge of plan.route?.edges || []) routeFlows[edge.id] = edge.baselineTraffic * diversionFactor;

    const closureEndpoints = new Set(closureEdges.flatMap((edge) => [edge.from, edge.to]));
    const connectedDetours = BENGALURU_EDGES.filter((edge) =>
      !closureEdgeIds.has(edge.id) &&
      !routeEdgeIds.has(edge.id) &&
      (closureEndpoints.has(edge.from) || closureEndpoints.has(edge.to))
    );
    const totalDetourCapacity = connectedDetours.reduce((sum, edge) => sum + edge.capacity, 0);
    const localDiversion = closureEdges.reduce((sum, edge) => sum + edge.baselineTraffic, 0) * demandMultiplier * 0.25 * impactFactor;
    if (totalDetourCapacity > 0) {
      for (const edge of connectedDetours) {
        const addedFlow = localDiversion * (edge.capacity / totalDetourCapacity);
        routeFlows[edge.id] = edge.baselineTraffic + addedFlow / demandMultiplier;
      }
    }
    const network = computeNetworkCongestion(BENGALURU_EDGES, routeFlows, demandMultiplier);
    const congestion = scoreCongestion(network, closedEdgeIds);
    const hospital = strategyId === 'plan_c'
      ? { route: plan.ambulanceRoute, time: getRouteTravelTime(plan.ambulanceRoute, demandMultiplier, 1, 1.15) }
      : getHospitalRouteTime({ hospitalNodeId, originNodeId, closedEdgeIds, demandMultiplier, diversionFactor });

    planResults[strategyId] = {
      ...plan,
      simulatedTravelTime: getRouteTravelTime(plan.route, demandMultiplier, diversionFactor),
      delayDelta: 0,
      congestionScore: congestion.score,
      hospitalEta: hospital.time,
      hospitalRoute: hospital.route
    };
    planNetworks[strategyId] = network;
    hospitalResults[strategyId] = hospital;
  }

  const baselineTime = baselineTravelTime ?? 0;
  for (const plan of Object.values(planResults)) {
    plan.delayDelta = Number((plan.simulatedTravelTime - baselineTime).toFixed(1));
  }

  const ranking = Object.entries(planResults).map(([strategyId, plan]) => ({
    strategyId,
    cost: plan.simulatedTravelTime + plan.congestionScore * 0.1 + plan.hospitalEta * 0.5
  })).sort((left, right) => left.cost - right.cost);
  const recommendedWinner = ranking[0].strategyId;
  const activePlan = planResults[selectedStrategy] || planResults.plan_b;
  const activeNetwork = planNetworks[activePlan.strategyId];
  const activeCongestion = scoreCongestion(activeNetwork, closedEdgeIds);
  const delayDeltaMinutes = Number((activePlan.simulatedTravelTime - baselineTime).toFixed(1));
  const delayPercentage = baselineTime > 0 ? Number(((delayDeltaMinutes / baselineTime) * 100).toFixed(1)) : 0;
  const hospitalTime = hospitalResults[activePlan.strategyId].time ?? 0;
  const hospitalDelta = Number((hospitalTime - (baselineHospitalTime ?? 0)).toFixed(1));
  const affectedVehiclesThisHour = Math.round(
    closureEdges.reduce((sum, edge) => sum + edge.baselineTraffic, 0) * demandMultiplier * 0.85 * impactFactor
  );
  const closedTargetName = closureTargetType === 'intersection'
    ? (closedNodeId ? `${BENGALURU_NODES[closedNodeId]?.name || closedNodeId} intersection` : 'No intersection selected')
    : closedEdge.name;

  return {
    hour,
    demandMultiplier,
    closureActive,
    recoveryFactor,
    closedEdge,
    closedEdgeIds: [...closedEdgeIds],
    closureTargetEdgeIds: [...closureEdgeIds],
    closedNodeId,
    closureTargetType,
    closedTargetName,
    affectedVehiclesThisHour,
    baseline: {
      travelTimeMinutes: baselineTravelTime ?? 0,
      distanceKm: baselineRoute ? Number(baselineRoute.distanceKm.toFixed(2)) : 0,
      congestionScore: baselineCongestion.score,
      hospitalTimeMinutes: baselineHospitalTime ?? 0,
      route: baselineRoute
    },
    simulated: {
      activeStrategy: activePlan.strategyId,
      travelTimeMinutes: activePlan.simulatedTravelTime,
      distanceKm: activePlan.distanceKm,
      delayDeltaMinutes,
      delayPercentage,
      congestionScore: activeCongestion.score,
      hospitalTimeMinutes: Number(hospitalTime.toFixed(1)),
      hospitalDeltaMinutes: hospitalDelta,
      hospitalStatus: hospitalTime <= 7 ? 'Optimal (< 7 min)' : hospitalTime <= 10 ? 'Moderate (7 - 10 min)' : 'Critical Delay (> 10 min)',
      cumulativeDelayHours: 0,
      affectedVehiclesThisHour,
      bottleneckCount: activeCongestion.bottlenecks.length,
      bottlenecks: activeCongestion.bottlenecks,
      route: activePlan.route,
      ambulanceRoute: planResults.plan_c.ambulanceRoute
    },
    strategyComparison: planResults,
    recommendation: {
      winner: recommendedWinner,
      reason: `${recommendedWinner.replace('plan_', 'Plan ').toUpperCase()} has the lowest modeled combined impact (travel time + 0.1 × congestion score + 0.5 × hospital ETA).`
    },
    networkCongestion: activeNetwork
  };
}

/** Calculate all selectable future times from one deterministic hourly run. */
export function runCityTwinSimulation(params = {}) {
  const timelineHour = Number(params.timelineHour ?? 0);
  const durationHours = Number(params.durationHours ?? 6);
  const hourlyResults = Array.from({ length: 25 }, (_, hour) => calculateHour(params, hour));
  let cumulativeVehicles = 0;
  let cumulativeDelayHours = 0;

  for (let hour = 0; hour < timelineHour; hour++) {
    const result = hourlyResults[hour];
    cumulativeVehicles += result.affectedVehiclesThisHour;
    cumulativeDelayHours += (Math.max(0, result.simulated.delayDeltaMinutes) * result.affectedVehiclesThisHour) / 60;
  }

  const selected = hourlyResults[Math.max(0, Math.min(24, Math.round(timelineHour)))];
  selected.simulated.cumulativeDelayHours = Number(cumulativeDelayHours.toFixed(1));
  selected.scenario = {
    closedEdge: selected.closedEdge,
    closedEdgeIds: selected.closedEdgeIds,
    closureTargetEdgeIds: selected.closureTargetEdgeIds,
    closedNodeId: selected.closedNodeId,
    closureTargetType: selected.closureTargetType,
    closedTargetName: selected.closedTargetName,
    durationHours,
    demandLevel: params.demandLevel || 'high',
    timeOfDay: params.timeOfDay || 'peak_morning',
    selectedStrategy: selected.simulated.activeStrategy,
    timelineHour: selected.hour,
    closureActive: selected.closureActive,
    recoveryFactor: selected.recoveryFactor,
    demandMultiplier: selected.demandMultiplier,
    origin: BENGALURU_NODES[params.originNodeId || 'n_kumble_circle']?.name || params.originNodeId,
    destination: BENGALURU_NODES[params.destinationNodeId || 'n_trinity_circle']?.name || params.destinationNodeId,
    hospital: BENGALURU_NODES[params.hospitalNodeId || 'n_bowring_hospital']?.name || params.hospitalNodeId,
    totalVehiclesAffected: Math.round(cumulativeVehicles)
  };
  selected.timestamp = new Date().toISOString();
  selected.timeline = SIMULATION_HOURS.map((hour) => {
    const result = hourlyResults[hour];
    return {
      hour,
      baselineTravelTime: result.baseline.travelTimeMinutes,
      plan_a: result.strategyComparison.plan_a.simulatedTravelTime,
      plan_b: result.strategyComparison.plan_b.simulatedTravelTime,
      plan_c: result.strategyComparison.plan_c.simulatedTravelTime,
      closureActive: result.closureActive
    };
  });
  return selected;
}
