import { describe, it, expect } from 'vitest';
import { buildAdjacencyGraph, dijkstraShortestPath } from '../simulation/graphEngine.js';
import { BENGALURU_EDGES } from '../data/bengaluruRoadGraph.js';

describe('Road Closure Avoidance Tests', () => {
  it('should strictly avoid closed road edge_mg_central during pathfinding', () => {
    const closedEdgeIds = new Set(['edge_mg_central']);

    const adj = buildAdjacencyGraph(BENGALURU_EDGES, {
      closedEdgeIds
    });

    const detourResult = dijkstraShortestPath(adj, 'n_kumble_circle', 'n_trinity_circle');

    expect(detourResult).not.toBeNull();
    // Verify none of the edges in the resulting path are the closed edge
    const usedEdgeIds = detourResult.edges.map(e => e.id);
    expect(usedEdgeIds).not.toContain('edge_mg_central');

    // Verify the detour successfully reached the destination
    expect(detourResult.path[detourResult.path.length - 1]).toBe('n_trinity_circle');
  });

  it('should find alternative bypass when multiple arterial roads are closed', () => {
    const closedEdgeIds = new Set(['edge_mg_central', 'edge_cubbon_west']);

    const adj = buildAdjacencyGraph(BENGALURU_EDGES, {
      closedEdgeIds
    });

    const detourResult = dijkstraShortestPath(adj, 'n_kumble_circle', 'n_trinity_circle');

    expect(detourResult).not.toBeNull();
    const usedEdgeIds = detourResult.edges.map(e => e.id);
    expect(usedEdgeIds).not.toContain('edge_mg_central');
    expect(usedEdgeIds).not.toContain('edge_cubbon_west');
  });

  it('should return null when destination is completely unreachable', () => {
    // If we close all edges incident to Trinity Circle
    const closedEdgeIds = new Set(['edge_mg_east', 'edge_dickenson_trinity']);

    const adj = buildAdjacencyGraph(BENGALURU_EDGES, {
      closedEdgeIds
    });

    const result = dijkstraShortestPath(adj, 'n_kumble_circle', 'n_trinity_circle');
    expect(result).toBeNull();
  });
});
