import { describe, it, expect } from 'vitest';
import {
  buildAdjacencyGraph,
  dijkstraShortestPath,
  calculateBPRTravelTime,
  computeNetworkCongestion
} from '../simulation/graphEngine.js';
import { BENGALURU_NODES, BENGALURU_EDGES } from '../data/bengaluruRoadGraph.js';

describe('CityTwin Graph Engine Tests', () => {
  it('should build connected adjacency graph with all nodes', () => {
    const adj = buildAdjacencyGraph(BENGALURU_EDGES);
    expect(adj).toBeDefined();

    // Check all nodes exist in adjacency list
    for (const nodeId of Object.keys(BENGALURU_NODES)) {
      expect(adj[nodeId]).toBeDefined();
      expect(Array.isArray(adj[nodeId])).toBe(true);
    }

    // Verify MG Road connections
    const kumbleNeighbors = adj['n_kumble_circle'].map(n => n.node);
    expect(kumbleNeighbors).toContain('n_mg_brigade');
    expect(kumbleNeighbors).toContain('n_st_marks_residency');
  });

  it('should find deterministic shortest path between Kumble Circle and Trinity Circle', () => {
    const adj = buildAdjacencyGraph(BENGALURU_EDGES);
    const result = dijkstraShortestPath(adj, 'n_kumble_circle', 'n_trinity_circle');

    expect(result).not.toBeNull();
    expect(result.path.length).toBeGreaterThan(2);
    expect(result.path[0]).toBe('n_kumble_circle');
    expect(result.path[result.path.length - 1]).toBe('n_trinity_circle');
    expect(result.distanceKm).toBeGreaterThan(1.5);
    expect(result.coordinates.length).toBeGreaterThan(3);
  });

  it('should calculate BPR link travel times with congestion exponent', () => {
    const testEdge = BENGALURU_EDGES[0]; // MG West
    const freeFlowResult = calculateBPRTravelTime(testEdge, 0);
    const heavyCongestionResult = calculateBPRTravelTime(testEdge, testEdge.capacity * 1.2);

    expect(freeFlowResult.travelTimeMinutes).toBeCloseTo(freeFlowResult.freeFlowTimeMinutes, 2);
    expect(heavyCongestionResult.travelTimeMinutes).toBeGreaterThan(freeFlowResult.travelTimeMinutes);
    expect(heavyCongestionResult.vcRatio).toBeGreaterThan(1.0);
  });

  it('should compute network congestion metrics across all edges', () => {
    const metrics = computeNetworkCongestion(BENGALURU_EDGES, {}, 1.0);
    expect(Object.keys(metrics).length).toBe(BENGALURU_EDGES.length);

    for (const edge of BENGALURU_EDGES) {
      expect(metrics[edge.id]).toBeDefined();
      expect(metrics[edge.id].vcRatio).toBeGreaterThan(0);
      expect(['free_flow', 'moderate', 'congested', 'severe']).toContain(metrics[edge.id].congestionStatus);
    }
  });
});
