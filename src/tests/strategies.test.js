import { describe, it, expect } from 'vitest';
import { runPlanA, runPlanB, runPlanC } from '../simulation/strategies.js';
import { runCityTwinSimulation } from '../simulation/trafficSimulator.js';
import { BENGALURU_EDGES } from '../data/bengaluruRoadGraph.js';
import { getIncidentEdgeIds } from '../simulation/graphEngine.js';
import { createBaselineRouteGeoJSON, createPlanRouteCollections } from '../simulation/routeGeoJSON.js';

describe('Simulation Strategies & Scenario Calculations Tests', () => {
  const baseOptions = {
    startNodeId: 'n_kumble_circle',
    targetNodeId: 'n_trinity_circle',
    hospitalNodeId: 'n_bowring_hospital',
    closedEdgeIds: new Set(['edge_mg_central']),
    demandMultiplier: 1.25
  };

  it('Plan A should calculate a valid diversion route avoiding closure', () => {
    const planA = runPlanA(baseOptions);
    expect(planA.route).not.toBeNull();
    expect(planA.simulatedTravelTime).toBeGreaterThan(0);
    expect(planA.distanceKm).toBeGreaterThan(1.0);
    const edgeIds = planA.route.edges.map(e => e.id);
    expect(edgeIds).not.toContain('edge_mg_central');
  });

  it('Plan B should calculate a balanced diversion route with capacity penalties', () => {
    const planB = runPlanB(baseOptions);
    expect(planB.route).not.toBeNull();
    expect(planB.simulatedTravelTime).toBeGreaterThan(0);
    const edgeIds = planB.route.edges.map(e => e.id);
    expect(edgeIds).not.toContain('edge_mg_central');
  });

  it('Plan C should preserve ambulance emergency route to Bowring Hospital', () => {
    const planC = runPlanC(baseOptions);
    expect(planC.route).not.toBeNull();
    expect(planC.ambulanceRoute).not.toBeNull();
    expect(planC.ambulanceEtaMinutes).toBeGreaterThan(0);
    expect(planC.ambulanceEtaMinutes).toBeLessThan(12.0); // fast emergency ETA
  });

  it('Full simulation orchestrator should produce comprehensive baseline vs simulated metrics', () => {
    const simResult = runCityTwinSimulation({
      closedEdgeId: 'edge_mg_central',
      durationHours: 6,
      demandLevel: 'high',
      timeOfDay: 'peak_morning',
      timelineHour: 6,
      selectedStrategy: 'plan_b',
      originNodeId: 'n_kumble_circle',
      destinationNodeId: 'n_trinity_circle',
      hospitalNodeId: 'n_bowring_hospital'
    });

    expect(simResult.baseline).toBeDefined();
    expect(simResult.simulated).toBeDefined();
    expect(simResult.strategyComparison).toBeDefined();
    expect(simResult.recommendation).toBeDefined();

    // Verify baseline vs simulated deltas
    expect(simResult.simulated.travelTimeMinutes).toBeGreaterThan(0);
    expect(simResult.baseline.travelTimeMinutes).toBeGreaterThan(0);
    expect(simResult.simulated.delayDeltaMinutes).toBeGreaterThanOrEqual(0);
    expect(simResult.simulated.congestionScore).toBeGreaterThanOrEqual(0);
    expect(simResult.simulated.congestionScore).toBeLessThanOrEqual(100);
    expect(simResult.scenario.totalVehiclesAffected).toBeGreaterThan(1000);
    expect(simResult.recommendation.winner).toBeDefined();
  });

  it('should reopen a road at its closure duration and report cumulative impacts to the selected hour', () => {
    const duringClosure = runCityTwinSimulation({
      closedEdgeId: 'edge_mg_central', durationHours: 6, demandLevel: 'high', timeOfDay: 'peak_morning',
      selectedStrategy: 'plan_b', timelineHour: 3
    });
    const afterReopening = runCityTwinSimulation({
      closedEdgeId: 'edge_mg_central', durationHours: 3, demandLevel: 'high', timeOfDay: 'peak_morning',
      selectedStrategy: 'plan_b', timelineHour: 3
    });

    expect(duringClosure.scenario.closureActive).toBe(true);
    expect(afterReopening.scenario.closureActive).toBe(false);
    expect(duringClosure.simulated.travelTimeMinutes).not.toBe(afterReopening.simulated.travelTimeMinutes);
    expect(afterReopening.scenario.totalVehiclesAffected).toBeGreaterThan(0);
    expect(afterReopening.timeline.map((point) => point.hour)).toEqual([0, 1, 3, 6, 12, 24]);
  });

  it('should change calculated flows when demand and future hour change', () => {
    const zeroHour = runCityTwinSimulation({ timelineHour: 0, demandLevel: 'high', timeOfDay: 'peak_morning' });
    const highPeak = runCityTwinSimulation({ timelineHour: 1, demandLevel: 'high', timeOfDay: 'peak_morning' });
    const offPeak = runCityTwinSimulation({ timelineHour: 1, demandLevel: 'low', timeOfDay: 'peak_morning' });
    const laterHour = runCityTwinSimulation({ timelineHour: 6, demandLevel: 'high', timeOfDay: 'peak_morning' });

    expect(zeroHour.scenario.demandMultiplier).not.toBe(highPeak.scenario.demandMultiplier);
    expect(zeroHour.simulated.travelTimeMinutes).not.toBe(highPeak.simulated.travelTimeMinutes);
    expect(zeroHour.networkCongestion.edge_mg_west.effectiveFlow).not.toBe(highPeak.networkCongestion.edge_mg_west.effectiveFlow);
    expect(highPeak.scenario.demandMultiplier).toBeGreaterThan(offPeak.scenario.demandMultiplier);
    expect(highPeak.simulated.travelTimeMinutes).toBeGreaterThan(offPeak.simulated.travelTimeMinutes);
    expect(highPeak.simulated.travelTimeMinutes).not.toBe(laterHour.simulated.travelTimeMinutes);
  });

  it('should show closure diversion on connected roads and reopen the closed link after its duration', () => {
    const params = { timelineHour: 1, durationHours: 6, demandLevel: 'high', selectedStrategy: 'plan_b' };
    const duringClosure = runCityTwinSimulation(params);
    const closedEdge = BENGALURU_EDGES.find((edge) => edge.id === 'edge_mg_central');
    const activeRoute = new Set(duringClosure.simulated.route.edges.map((edge) => edge.id));
    const connectedDetours = BENGALURU_EDGES.filter((edge) =>
      edge.id !== closedEdge.id &&
      !activeRoute.has(edge.id) &&
      [closedEdge.from, closedEdge.to].some((node) => edge.from === node || edge.to === node)
    );

    expect(duringClosure.networkCongestion[closedEdge.id].effectiveFlow).toBe(0);
    expect(connectedDetours.some((edge) =>
      duringClosure.networkCongestion[edge.id].effectiveFlow > edge.baselineTraffic * duringClosure.scenario.demandMultiplier
    )).toBe(true);

    const afterReopening = runCityTwinSimulation({ ...params, durationHours: 1 });
    expect(afterReopening.scenario.closureActive).toBe(false);
    expect(afterReopening.networkCongestion[closedEdge.id].effectiveFlow).toBeGreaterThan(0);
  });

  it('should produce repeatable estimates for identical inputs', () => {
    const params = { timelineHour: 12, durationHours: 6, demandLevel: 'medium', selectedStrategy: 'plan_c' };
    const first = runCityTwinSimulation(params);
    const second = runCityTwinSimulation(params);

    expect(first.simulated).toEqual(second.simulated);
    expect(first.timeline).toEqual(second.timeline);
    expect(first.recommendation).toEqual(second.recommendation);
  });

  it('should calculate distinct Plan B travel estimates at all six selectable horizons', () => {
    const result = runCityTwinSimulation({ demandLevel: 'high', timeOfDay: 'peak_morning', durationHours: 6 });
    const planBTravelTimes = result.timeline.map((point) => point.plan_b);

    expect(result.timeline.map((point) => point.hour)).toEqual([0, 1, 3, 6, 12, 24]);
    expect(new Set(planBTravelTimes).size).toBe(6);
  });

  it('should select a different congestion-aware route when hourly demand changes', () => {
    const early = runCityTwinSimulation({
      closedEdgeId: 'edge_cubbon_west', durationHours: 6, demandLevel: 'high',
      selectedStrategy: 'plan_b', timelineHour: 0
    });
    const peak = runCityTwinSimulation({
      closedEdgeId: 'edge_cubbon_west', durationHours: 6, demandLevel: 'high',
      selectedStrategy: 'plan_b', timelineHour: 3
    });

    expect(early.simulated.route.edges.map((edge) => edge.id)).not.toEqual(
      peak.simulated.route.edges.map((edge) => edge.id)
    );
  });

  it('should expose all valid strategy geometries and hide baseline paths crossing a closure', () => {
    const result = runCityTwinSimulation({
      closedEdgeId: 'edge_mg_central', durationHours: 6, demandLevel: 'high',
      selectedStrategy: 'plan_b', timelineHour: 1
    });

    for (const strategyId of ['plan_a', 'plan_b', 'plan_c']) {
      const plan = result.strategyComparison[strategyId];
      expect(plan.route.edges.some((edge) => edge.id === 'edge_mg_central')).toBe(false);
      const collections = createPlanRouteCollections(result.strategyComparison, strategyId, 'edge_mg_central', true);
      expect(collections.selected.features[0].geometry.coordinates).toEqual(plan.route.coordinates);
      expect(collections.alternatives.features).toHaveLength(2);
      for (const alternative of collections.alternatives.features) {
        expect(alternative.geometry.coordinates).toEqual(
          result.strategyComparison[alternative.properties.strategy].route.coordinates
        );
      }
    }

    expect(createBaselineRouteGeoJSON(result.baseline.route, 'edge_mg_central', true).features).toHaveLength(0);
    expect(createBaselineRouteGeoJSON(result.baseline.route, 'edge_mg_central', false).features).toHaveLength(1);
    expect(createPlanRouteCollections({ plan_b: { route: null } }, 'plan_b', 'edge_mg_central', true).selected.features)
      .toHaveLength(0);
  });

  it('should close every incident road when an intersection is selected for closure', () => {
    const nodeId = 'n_kumble_circle';
    const incidentEdgeIds = getIncidentEdgeIds(nodeId);
    const result = runCityTwinSimulation({
      closureTargetType: 'intersection', closedNodeId: nodeId,
      originNodeId: 'n_richmond_circle', destinationNodeId: 'n_trinity_circle',
      durationHours: 6, timelineHour: 1, demandLevel: 'high', selectedStrategy: 'plan_b'
    });

    expect(incidentEdgeIds.size).toBeGreaterThan(1);
    expect(new Set(result.scenario.closedEdgeIds)).toEqual(incidentEdgeIds);
    for (const edgeId of incidentEdgeIds) {
      expect(result.networkCongestion[edgeId].effectiveFlow).toBe(0);
    }
    expect(result.simulated.route.edges.every((edge) => !incidentEdgeIds.has(edge.id))).toBe(true);
    expect(result.scenario.closedTargetName).toContain('intersection');

    const blockedRoute = { edges: [{ id: [...incidentEdgeIds][0] }], coordinates: [[1, 1], [2, 2]] };
    const validRoute = { edges: [{ id: 'valid-edge' }], coordinates: [[2, 2], [3, 3]] };
    const routeCollections = createPlanRouteCollections({
      plan_a: { route: blockedRoute, distanceKm: 1, simulatedTravelTime: 2 },
      plan_b: { route: validRoute, distanceKm: 1, simulatedTravelTime: 2 }
    }, 'plan_a', incidentEdgeIds, true);
    expect(routeCollections.selected.features).toHaveLength(0);
    expect(routeCollections.alternatives.features).toHaveLength(1);
  });

  it('should calculate the selected graph origin and destination instead of fixed demo points', () => {
    const result = runCityTwinSimulation({
      closedEdgeId: 'edge_mg_central', closureTargetType: 'road',
      originNodeId: 'n_richmond_circle', destinationNodeId: 'n_commercial_street',
      timelineHour: 3, durationHours: 6, demandLevel: 'medium', selectedStrategy: 'plan_b'
    });

    expect(result.baseline.route.path[0]).toBe('n_richmond_circle');
    expect(result.baseline.route.path.at(-1)).toBe('n_commercial_street');
    expect(result.simulated.route.path[0]).toBe('n_richmond_circle');
    expect(result.simulated.route.path.at(-1)).toBe('n_commercial_street');
    expect(result.scenario.origin).toContain('Richmond');
    expect(result.scenario.destination).toContain('Commercial');
  });
});
