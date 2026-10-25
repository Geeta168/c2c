const STRATEGY_LABELS = {
  plan_a: 'Plan A',
  plan_b: 'Plan B',
  plan_c: 'Plan C'
};

const STRATEGY_COLORS = {
  plan_a: '#38bdf8',
  plan_b: '#10b981',
  plan_c: '#f43f5e'
};

function emptyCollection() {
  return { type: 'FeatureCollection', features: [] };
}

function normalizeClosedEdgeIds(closedEdgeIds) {
  if (closedEdgeIds instanceof Set) return closedEdgeIds;
  if (Array.isArray(closedEdgeIds)) return new Set(closedEdgeIds);
  return closedEdgeIds ? new Set([closedEdgeIds]) : new Set();
}

function isDrawableRoute(route, closedEdgeIds, closureActive) {
  if (!route?.edges || !Array.isArray(route.coordinates) || route.coordinates.length < 2) return false;
  const blockedIds = normalizeClosedEdgeIds(closedEdgeIds);
  return !closureActive || !route.edges.some((edge) => blockedIds.has(edge.id));
}

function createRouteFeature(route, properties) {
  const hasEdgeGeometry = route.edges?.length && route.edges.every((edge) => Array.isArray(edge.coordinates));
  const coordinates = hasEdgeGeometry
    ? route.edges.map((edge, index) => {
        const followsEdgeDirection = edge.from === route.path?.[index] && edge.to === route.path?.[index + 1];
        return followsEdgeDirection ? edge.coordinates : [...edge.coordinates].reverse();
      })
    : [route.coordinates];

  return {
    type: 'Feature',
    properties,
    geometry: {
      type: 'MultiLineString',
      coordinates
    }
  };
}

export function createPlanRouteCollections(comparison, selectedStrategy, closedEdgeIds, closureActive) {
  const selectedFeatures = [];
  const alternativeFeatures = [];

  for (const [strategyId, result] of Object.entries(comparison || {})) {
    const route = result?.route;
    if (!isDrawableRoute(route, closedEdgeIds, closureActive)) continue;

    const feature = createRouteFeature(route, {
      strategy: strategyId,
      name: `${STRATEGY_LABELS[strategyId] || strategyId} route`,
      color: STRATEGY_COLORS[strategyId] || '#94a3b8',
      distanceKm: result.distanceKm,
      travelTimeMinutes: result.simulatedTravelTime
    });

    if (strategyId === selectedStrategy) selectedFeatures.push(feature);
    else alternativeFeatures.push(feature);
  }

  return {
    selected: selectedFeatures.length ? { type: 'FeatureCollection', features: selectedFeatures } : emptyCollection(),
    alternatives: alternativeFeatures.length ? { type: 'FeatureCollection', features: alternativeFeatures } : emptyCollection()
  };
}

export function createBaselineRouteGeoJSON(route, closedEdgeIds, closureActive) {
  if (!isDrawableRoute(route, closedEdgeIds, closureActive)) return emptyCollection();
  return {
    type: 'FeatureCollection',
    features: [createRouteFeature(route, {
      name: 'Baseline route',
      distanceKm: route.distanceKm
    })]
  };
}
