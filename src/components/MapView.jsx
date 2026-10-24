import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Compass,
  RotateCcw,
  AlertTriangle,
  Building2,
  Navigation,
  ShieldAlert,
  Layers
} from 'lucide-react';
import { MAP_CONFIG } from '../config/mapConfig';
import { BENGALURU_EDGES, BENGALURU_NODES, getEdgeById } from '../data/bengaluruRoadGraph';
import { BENGALURU_FACILITIES } from '../data/facilities';
import { createBaselineRouteGeoJSON, createPlanRouteCollections } from '../simulation/routeGeoJSON';

export function MapView({
  simulationResults,
  scenarioParams,
  layerToggles,
  selectedRoadId,
  onSelectRoad,
  onSelectFacility,
  mapSelectionMode,
  onSelectMapPoint
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const initializeMapLayersRef = useRef(null);
  const mapSelectionModeRef = useRef(mapSelectionMode);
  const onSelectMapPointRef = useRef(onSelectMapPoint);
  const onSelectRoadRef = useRef(onSelectRoad);
  mapSelectionModeRef.current = mapSelectionMode;
  onSelectMapPointRef.current = onSelectMapPoint;
  onSelectRoadRef.current = onSelectRoad;

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [currentPitch, setCurrentPitch] = useState(MAP_CONFIG.pitch);
  const [activeCameraPreset, setActiveCameraPreset] = useState("mgRoad");
  const selectedStrategyId = simulationResults?.scenario?.selectedStrategy ||
    scenarioParams.selectedStrategy || simulationResults?.simulated?.activeStrategy || 'plan_b';
  const selectedPlanLabel = { plan_a: 'Plan A', plan_b: 'Plan B', plan_c: 'Plan C' }[selectedStrategyId] || 'Selected plan';
  const activeRouteResult = simulationResults?.strategyComparison?.[selectedStrategyId];
  const activeRoute = activeRouteResult?.route;
  const closureActive = simulationResults?.scenario?.closureActive ?? true;
  const closedEdgeIds = new Set(simulationResults?.scenario?.closedEdgeIds || [scenarioParams.closedEdgeId]);
  const routeUnavailable = !activeRoute?.coordinates || activeRoute.coordinates.length < 2 ||
    (closureActive && activeRoute.edges?.some((edge) => closedEdgeIds.has(edge.id)));
  const baselineRouteUnavailable = !simulationResults?.baseline?.route ||
    (closureActive && simulationResults.baseline.route.edges.some((edge) => closedEdgeIds.has(edge.id)));

  // 1. Format GeoJSON for Base Network Road Corridors
  const createEdgesGeoJSON = useCallback(() => {
    const { networkCongestion } = simulationResults || {};
    const activeClosedEdgeIds = new Set(simulationResults?.scenario?.closedEdgeIds || [scenarioParams.closedEdgeId]);
    const closureActive = simulationResults?.scenario?.closureActive ?? true;

    const features = BENGALURU_EDGES.map((edge) => {
      const isClosed = activeClosedEdgeIds.has(edge.id) && closureActive;
      const metrics = networkCongestion ? networkCongestion[edge.id] : null;
      const vcRatio = metrics ? metrics.vcRatio : (edge.baselineTraffic / edge.capacity);

      // Determine road visual status color
      let statusColor = "#334155"; // Subtle dark slate network baseline
      if (layerToggles.trafficCongestion) {
        if (vcRatio >= 1.0) statusColor = "#ef4444"; // severe congestion
        else if (vcRatio >= 0.75) statusColor = "#f59e0b"; // heavy amber
        else if (vcRatio >= 0.5) statusColor = "#eab308"; // moderate yellow
        else statusColor = "#10b981"; // free flow green
      }

      return {
        type: "Feature",
        id: edge.id,
        properties: {
          id: edge.id,
          name: edge.name,
          fromNodeName: BENGALURU_NODES[edge.from]?.name || edge.from,
          toNodeName: BENGALURU_NODES[edge.to]?.name || edge.to,
          distanceKm: edge.distanceKm,
          freeFlowSpeed: edge.freeFlowSpeed,
          capacity: edge.capacity,
          baselineTraffic: edge.baselineTraffic,
          effectiveFlow: metrics ? metrics.effectiveFlow : edge.baselineTraffic,
          vcRatio: Number(vcRatio.toFixed(2)),
          travelTimeMinutes: metrics ? metrics.travelTimeMinutes : 2.0,
          isClosed,
          color: statusColor,
          description: edge.description
        },
        geometry: {
          type: "LineString",
          coordinates: edge.coordinates
        }
      };
    });

    return {
      type: "FeatureCollection",
      features
    };
  }, [simulationResults, scenarioParams.closedEdgeId, layerToggles.trafficCongestion]);

  // 2. Format GeoJSON for Closed Road Segment (RED #ff3b57)
  const createClosedRoadGeoJSON = useCallback(() => {
    const activeClosedEdgeIds = simulationResults?.scenario?.closedEdgeIds || [scenarioParams.closedEdgeId];
    if (simulationResults?.scenario?.closureActive === false) {
      return { type: "FeatureCollection", features: [] };
    }

    return {
      type: "FeatureCollection",
      features: BENGALURU_EDGES.filter((edge) => activeClosedEdgeIds.includes(edge.id)).map((closedEdge) => ({
          type: "Feature",
          properties: {
            id: closedEdge.id,
            name: `${simulationResults?.scenario?.closedTargetName || closedEdge.name} [CLOSED]`,
            color: "#ff3b57"
          },
          geometry: {
            type: "LineString",
            coordinates: closedEdge.coordinates
          }
        }))
    };
  }, [scenarioParams.closedEdgeId, simulationResults?.scenario]);

  const createIntersectionGeoJSON = useCallback(() => ({
    type: 'FeatureCollection',
    features: Object.values(BENGALURU_NODES).map((node) => {
      const role = node.id === scenarioParams.closedNodeId && closureActive
        ? 'closure'
        : node.id === scenarioParams.originNodeId
          ? 'origin'
          : node.id === scenarioParams.destinationNodeId
            ? 'destination'
            : 'junction';
      return {
        type: 'Feature',
        properties: { id: node.id, name: node.name, nodeType: node.type, role },
        geometry: { type: 'Point', coordinates: node.coordinates }
      };
    })
  }), [scenarioParams.closedNodeId, scenarioParams.originNodeId, scenarioParams.destinationNodeId, closureActive]);

  // 3. Format GeoJSON for Recommended Active Route (GREEN #10b981)
  const createRecommendedRouteGeoJSON = useCallback(() => {
    return createPlanRouteCollections(
      simulationResults?.strategyComparison,
      selectedStrategyId,
      closedEdgeIds,
      closureActive
    ).selected;
  }, [simulationResults, selectedStrategyId, scenarioParams.closedEdgeId, closedEdgeIds, closureActive]);

  // 4. Format GeoJSON for the other calculated plan routes
  const createAlternativeRoutesGeoJSON = useCallback(() => {
    return createPlanRouteCollections(
      simulationResults?.strategyComparison,
      selectedStrategyId,
      closedEdgeIds,
      closureActive
    ).alternatives;
  }, [simulationResults, selectedStrategyId, scenarioParams.closedEdgeId, closedEdgeIds, closureActive]);

  const createBaselineRouteGeoJSONCallback = useCallback(() => createBaselineRouteGeoJSON(
    simulationResults?.baseline?.route,
    closedEdgeIds,
    closureActive
  ), [simulationResults, scenarioParams.closedEdgeId, closedEdgeIds, closureActive]);

  // 5. Format GeoJSON for Hospital Emergency Corridor (Plan C - ROSE RED #f43f5e)
  const createAmbulanceRouteGeoJSON = useCallback(() => {
    const ambulanceRoute = simulationResults?.simulated?.ambulanceRoute;
    if (
      scenarioParams.selectedStrategy !== "plan_c" ||
      !ambulanceRoute ||
      !ambulanceRoute.coordinates ||
      ambulanceRoute.coordinates.length < 2
    ) {
      return { type: "FeatureCollection", features: [] };
    }

    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            name: "Bowring Hospital Emergency Protected Corridor",
            color: "#f43f5e"
          },
          geometry: {
            type: "LineString",
            coordinates: ambulanceRoute.coordinates
          }
        }
      ]
    };
  }, [simulationResults, scenarioParams.selectedStrategy]);

  // Safely adds layers and 3D buildings onto the loaded style
  const initializeMapLayers = useCallback((map) => {
    if (!map || !map.isStyleLoaded()) return;

    // 1. Set ambient & directional lighting for 3D extrusions
    try {
      map.setLight({
        anchor: 'viewport',
        color: '#c8e2ff',
        intensity: 0.52,
        position: [1.5, 90, 80]
      });
    } catch (err) {
      // Ignored if style doesn't support custom lighting
    }

    // 2. Enhance contrast of real Bengaluru street names & labels
    const streetLabelLayers = [
      "highway_name_other",
      "highway_name_major",
      "highway_name_motorway",
      "highway-name-major",
      "highway-name-minor",
      "highway-name-path",
      "place_suburb",
      "place_city",
      "place_neighbourhood"
    ];
    streetLabelLayers.forEach((layerId) => {
      if (map.getLayer(layerId)) {
        try {
          map.setPaintProperty(layerId, "text-color", "#93c5fd");
          map.setPaintProperty(layerId, "text-halo-color", "#040915");
          map.setPaintProperty(layerId, "text-halo-width", 1.6);
        } catch (e) { }
      }
    });

    // 3. Add 3D Extruded Buildings Layer (rendered beneath routes & roads)
    if (map.getSource("openmaptiles") && !map.getLayer("3d-buildings")) {
      try {
        map.addLayer(MAP_CONFIG.buildings3D);
        map.setLayoutProperty(
          "3d-buildings",
          "visibility",
          layerToggles.buildings3D ? "visible" : "none"
        );
      } catch (e) {
        console.warn("Notice adding 3D buildings layer:", e);
      }
    }

    // 4. Add Network Roads Source
    if (!map.getSource("citytwin-network-roads")) {
      map.addSource("citytwin-network-roads", {
        type: "geojson",
        data: createEdgesGeoJSON()
      });
    }

    // Road casing layer
    if (!map.getLayer("roads-casing")) {
      map.addLayer({
        id: "roads-casing",
        type: "line",
        source: "citytwin-network-roads",
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": "#020712",
          "line-width": 7.5,
          "line-opacity": 0.85
        }
      });
    }

    // Road line layer
    if (!map.getLayer("roads-line")) {
      map.addLayer({
        id: "roads-line",
        type: "line",
        source: "citytwin-network-roads",
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": ["get", "color"],
          "line-width": 3.8,
          "line-opacity": 0.95,
          "line-color-transition": { duration: 500, delay: 0 }
        }
      });
    }

    if (!map.getSource("citytwin-intersections")) {
      map.addSource("citytwin-intersections", {
        type: "geojson",
        data: createIntersectionGeoJSON()
      });
    }

    if (!map.getLayer("citytwin-intersection-nodes")) {
      map.addLayer({
        id: "citytwin-intersection-nodes",
        type: "circle",
        source: "citytwin-intersections",
        paint: {
          "circle-radius": ["match", ["get", "role"], "origin", 7, "destination", 7, "closure", 7, 4.5],
          "circle-color": ["match", ["get", "role"], "origin", "#10b981", "destination", "#38bdf8", "closure", "#ff3b57", "#fbbf24"],
          "circle-stroke-color": "#f8fafc",
          "circle-stroke-width": 1.5,
          "circle-opacity": 0.95
        }
      });
    }

    // 5. Add Dedicated Closed Road Source & Layers (RED #ff3b57)
    if (!map.getSource("citytwin-closed-road")) {
      map.addSource("citytwin-closed-road", {
        type: "geojson",
        data: createClosedRoadGeoJSON()
      });
    }

    if (!map.getLayer("closed-road-casing")) {
      map.addLayer({
        id: "closed-road-casing",
        type: "line",
        source: "citytwin-closed-road",
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": "#000000",
          "line-width": 11,
          "line-opacity": 0.9
        }
      });
    }

    if (!map.getLayer("closed-road-line")) {
      map.addLayer({
        id: "closed-road-line",
        type: "line",
        source: "citytwin-closed-road",
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": "#ff3b57",
          "line-width": 8,
          "line-opacity": 1.0
        }
      });
    }

    if (!map.getLayer("closed-road-stripes")) {
      map.addLayer({
        id: "closed-road-stripes",
        type: "line",
        source: "citytwin-closed-road",
        paint: {
          "line-color": "#ffffff",
          "line-width": 3.5,
          "line-dasharray": [1.5, 1.5]
        }
      });
    }

    if (!map.getSource("citytwin-baseline-route")) {
      map.addSource("citytwin-baseline-route", {
        type: "geojson",
        data: createBaselineRouteGeoJSONCallback()
      });
    }

    if (!map.getLayer("baseline-route-line")) {
      map.addLayer({
        id: "baseline-route-line",
        type: "line",
        source: "citytwin-baseline-route",
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": "#f8fafc",
          "line-width": 3,
          "line-opacity": 0.65,
          "line-dasharray": [2, 2]
        }
      });
    }

    // 6. Add the other strategy routes beneath the selected route
    if (!map.getSource("citytwin-alternative-routes")) {
      map.addSource("citytwin-alternative-routes", {
        type: "geojson",
        data: createAlternativeRoutesGeoJSON()
      });
    }

    if (!map.getLayer("alternative-routes-glow")) {
      map.addLayer({
        id: "alternative-routes-glow",
        type: "line",
        source: "citytwin-alternative-routes",
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": ["get", "color"],
          "line-width": 5,
          "line-opacity": 0.18,
          "line-blur": 1
        }
      });
    }

    if (!map.getLayer("alternative-routes-line")) {
      map.addLayer({
        id: "alternative-routes-line",
        type: "line",
        source: "citytwin-alternative-routes",
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": ["get", "color"],
          "line-width": 3,
          "line-opacity": 0.58,
          "line-dasharray": [2, 1.5]
        }
      });
    }

    // 7. Add Recommended Active Route Source & Layers (GREEN #10b981)
    if (!map.getSource("citytwin-recommended-route")) {
      map.addSource("citytwin-recommended-route", {
        type: "geojson",
        data: createRecommendedRouteGeoJSON()
      });
    }

    if (!map.getLayer("recommended-route-glow")) {
      map.addLayer({
        id: "recommended-route-glow",
        type: "line",
        source: "citytwin-recommended-route",
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": "#10b981",
          "line-width": 13,
          "line-opacity": 0.45,
          "line-blur": 4
        }
      });
    }

    if (!map.getLayer("recommended-route-line")) {
      map.addLayer({
        id: "recommended-route-line",
        type: "line",
        source: "citytwin-recommended-route",
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": "#10b981",
          "line-width": 6,
          "line-opacity": 1.0
        }
      });
    }

    // 8. Add Ambulance Priority Route Source & Layers (Plan C - ROSE #f43f5e)
    if (!map.getSource("citytwin-ambulance-route")) {
      map.addSource("citytwin-ambulance-route", {
        type: "geojson",
        data: createAmbulanceRouteGeoJSON()
      });
    }

    if (!map.getLayer("ambulance-route-glow")) {
      map.addLayer({
        id: "ambulance-route-glow",
        type: "line",
        source: "citytwin-ambulance-route",
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": "#f43f5e",
          "line-width": 12,
          "line-opacity": 0.45,
          "line-blur": 4
        }
      });
    }

    if (!map.getLayer("ambulance-route-line")) {
      map.addLayer({
        id: "ambulance-route-line",
        type: "line",
        source: "citytwin-ambulance-route",
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": "#ff385c",
          "line-width": 4.5,
          "line-dasharray": [2, 1]
        }
      });
    }

    // Click handler for Road Corridors
    map.off("click", "roads-line");
    map.on("click", "roads-line", (e) => {
      if (e.features && e.features[0]) {
        const props = e.features[0].properties;
        onSelectRoadRef.current?.(props.id);

        new maplibregl.Popup({ offset: 12, closeButton: true })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="popup-title">${props.name}</div>
            <div class="popup-badge" style="background:${props.isClosed ? 'rgba(255,59,87,0.2)' : 'rgba(56,189,248,0.2)'}; color:${props.isClosed ? '#ff3b57' : '#38bdf8'}">
              ${props.isClosed ? 'CLOSED CITYTWIN EDGE' : 'CITYTWIN GRAPH ROAD · SIMULATED FLOW'}
            </div>
            <div class="popup-desc">${props.description || ''}</div>
            <div class="popup-stats">
              <div>Connects: <strong>${props.fromNodeName}</strong> ↔ <strong>${props.toNodeName}</strong></div>
              <div>Length: <strong>${props.distanceKm} km</strong> | Speed: <strong>${props.freeFlowSpeed} km/h</strong></div>
              <div>Capacity: <strong>${props.capacity} veh/h</strong> | Volume: <strong>${props.effectiveFlow} veh/h</strong></div>
              <div>V/C Saturation: <strong style="color:${props.vcRatio >= 0.85 ? '#ff3b57' : '#10b981'}">${props.vcRatio}</strong></div>
            </div>
          `)
          .addTo(map);
      }
    });

    map.on("mouseenter", "roads-line", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "roads-line", () => {
      map.getCanvas().style.cursor = "";
    });

    map.off("click", "citytwin-intersection-nodes");
    map.on("click", "citytwin-intersection-nodes", (event) => {
      const node = event.features?.[0]?.properties;
      if (!node) return;
      const selectionMode = mapSelectionModeRef.current;
      if (selectionMode === 'closure-intersection' && node.nodeType !== 'junction') {
        new maplibregl.Popup({ offset: 12 })
          .setLngLat(event.lngLat)
          .setHTML('<div class="popup-title">Select a junction</div><div class="popup-desc">Only network junctions can be selected for intersection closure.</div>')
          .addTo(map);
        return;
      }
      if (selectionMode && selectionMode !== 'closure-road') {
        onSelectMapPointRef.current?.(selectionMode, node.id);
        return;
      }
      new maplibregl.Popup({ offset: 12 })
        .setLngLat(event.lngLat)
        .setHTML(`<div class="popup-title">${node.name}</div><div class="popup-badge">SIMULATED GRAPH INTERSECTION</div><div class="popup-desc">This selectable junction belongs to the CityTwin road graph; basemap geometry remains unchanged.</div>`)
        .addTo(map);
    });

    map.off("mouseenter", "citytwin-intersection-nodes");
    map.on("mouseenter", "citytwin-intersection-nodes", () => {
      map.getCanvas().style.cursor = mapSelectionModeRef.current ? "crosshair" : "pointer";
    });
    map.off("mouseleave", "citytwin-intersection-nodes");
    map.on("mouseleave", "citytwin-intersection-nodes", () => {
      map.getCanvas().style.cursor = "";
    });
  }, [
    createEdgesGeoJSON,
    createIntersectionGeoJSON,
    createClosedRoadGeoJSON,
    createBaselineRouteGeoJSONCallback,
    createRecommendedRouteGeoJSON,
    createAlternativeRoutesGeoJSON,
    createAmbulanceRouteGeoJSON,
    layerToggles.buildings3D,
  ]);

  initializeMapLayersRef.current = initializeMapLayers;

  // Initialize Map Instance
  useEffect(() => {
    if (mapRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: MAP_CONFIG.styles.primaryVector,
        center: MAP_CONFIG.center,
        zoom: MAP_CONFIG.defaultZoom,
        pitch: MAP_CONFIG.pitch,
        bearing: MAP_CONFIG.bearing,
        attributionControl: false,
        maxPitch: 85
      });

      // Attribution
      map.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution: MAP_CONFIG.attribution
        }),
        "bottom-right"
      );

      // Navigation Controls
      map.addControl(
        new maplibregl.NavigationControl({
          visualizePitch: true,
          showZoom: true,
          showCompass: true
        }),
        "top-right"
      );

      map.on("load", () => {
        setMapLoaded(true);
        setMapError(null);
        initializeMapLayersRef.current?.(map);
      });

      // Handle style data reload
      map.on("styledata", () => {
        if (map.isStyleLoaded()) {
          initializeMapLayersRef.current?.(map);
        }
      });

      // Catch only fatal connection issues without triggering broken fallback
      map.on("error", (e) => {
        if (e?.error?.status === 404 || e?.error?.message?.includes("Failed to fetch")) {
          console.warn("Tile server error:", e.error);
          if (!mapLoaded) {
            setMapError("Map tiles connection issue. Please check internet connection.");
          }
        }
      });

      map.on("pitch", () => {
        setCurrentPitch(Math.round(map.getPitch()));
      });

      mapRef.current = map;
    } catch (err) {
      console.error("MapLibre initialization failed:", err);
      setMapError("WebGL initialization failed on this device.");
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Data Sources dynamically when simulation results change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    const source = map.getSource("citytwin-network-roads");
    if (source) {
      source.setData(createEdgesGeoJSON());
    }

    const intersectionsSource = map.getSource("citytwin-intersections");
    if (intersectionsSource) {
      intersectionsSource.setData(createIntersectionGeoJSON());
    }

    const closedSource = map.getSource("citytwin-closed-road");
    if (closedSource) {
      closedSource.setData(createClosedRoadGeoJSON());
    }

    const baselineSource = map.getSource("citytwin-baseline-route");
    if (baselineSource) {
      baselineSource.setData(createBaselineRouteGeoJSONCallback());
    }

    const recRouteSource = map.getSource("citytwin-recommended-route");
    if (recRouteSource) {
      recRouteSource.setData(createRecommendedRouteGeoJSON());
    }

    const altRouteSource = map.getSource("citytwin-alternative-routes");
    if (altRouteSource) {
      altRouteSource.setData(createAlternativeRoutesGeoJSON());
    }

    const ambulanceSource = map.getSource("citytwin-ambulance-route");
    if (ambulanceSource) {
      ambulanceSource.setData(createAmbulanceRouteGeoJSON());
    }
  }, [
    createEdgesGeoJSON,
    createIntersectionGeoJSON,
    createClosedRoadGeoJSON,
    createBaselineRouteGeoJSONCallback,
    createRecommendedRouteGeoJSON,
    createAlternativeRoutesGeoJSON,
    createAmbulanceRouteGeoJSON,
    mapLoaded
  ]);

  // Update Facility Markers
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!layerToggles.facilities) return;

    BENGALURU_FACILITIES.forEach((fac) => {
      const el = document.createElement("div");
      el.className = "custom-facility-marker";

      let iconColor = "#38bdf8";
      let borderColor = "rgba(56, 189, 248, 0.4)";
      let symbol = "📍";

      if (fac.category === "hospital") {
        iconColor = "#ff385c";
        borderColor = "rgba(255, 56, 92, 0.5)";
        symbol = "🏥";
      } else if (fac.category === "transit") {
        iconColor = "#a855f7";
        borderColor = "rgba(168, 85, 247, 0.5)";
        symbol = "🚇";
      } else if (fac.category === "civic") {
        iconColor = "#eab308";
        borderColor = "rgba(234, 179, 8, 0.5)";
        symbol = "🏛️";
      }

      el.style.width = "32px";
      el.style.height = "32px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = "rgba(7, 12, 24, 0.92)";
      el.style.border = `2px solid ${iconColor}`;
      el.style.boxShadow = `0 0 14px ${borderColor}`;
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.cursor = "pointer";
      el.style.fontSize = "15px";
      el.innerHTML = symbol;

      el.addEventListener("click", () => {
        onSelectFacility(fac);

        new maplibregl.Popup({ offset: 15 })
          .setLngLat(fac.coordinates)
          .setHTML(`
            <div class="popup-title">${fac.name}</div>
            <div class="popup-badge" style="background:${borderColor}; color:${iconColor}">${fac.categoryLabel}</div>
            <div class="popup-desc">${fac.description}</div>
            <div class="popup-stats">
              <div>Status: <strong>${fac.status}</strong></div>
              ${fac.traumaLevel ? `<div>Trauma Level: <strong>${fac.traumaLevel}</strong></div>` : ''}
              ${fac.dailyFootfall ? `<div>Daily Footfall: <strong>${fac.dailyFootfall}</strong></div>` : ''}
            </div>
          `)
          .addTo(mapRef.current);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(fac.coordinates)
        .addTo(mapRef.current);

      markersRef.current.push(marker);
    });
  }, [layerToggles.facilities, mapLoaded, onSelectFacility]);

  // Handle Layer Visibility Toggles
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    // 3D Buildings Toggle
    if (map.getLayer("3d-buildings")) {
      map.setLayoutProperty(
        "3d-buildings",
        "visibility",
        layerToggles.buildings3D ? "visible" : "none"
      );
    }

    // Road Closures Toggle
    const closureLayers = ["closed-road-casing", "closed-road-line", "closed-road-stripes"];
    closureLayers.forEach((cid) => {
      if (map.getLayer(cid)) {
        map.setLayoutProperty(cid, "visibility", layerToggles.roadClosures ? "visible" : "none");
      }
    });

    // Active & Alternative Routes Toggle
    const routeLayers = [
      "recommended-route-glow",
      "recommended-route-line",
      "baseline-route-line",
      "alternative-routes-glow",
      "alternative-routes-line",
      "ambulance-route-glow",
      "ambulance-route-line"
    ];
    routeLayers.forEach((rid) => {
      if (map.getLayer(rid)) {
        map.setLayoutProperty(rid, "visibility", layerToggles.activeRoutes ? "visible" : "none");
      }
    });
  }, [layerToggles, mapLoaded]);

  const activeRouteDistance = activeRouteResult?.distanceKm ?? activeRoute?.distanceKm;
  const activeRouteTime = activeRouteResult?.simulatedTravelTime ?? simulationResults?.simulated?.travelTimeMinutes;
  const baselineDistance = simulationResults?.baseline?.distanceKm;
  const baselineTime = simulationResults?.baseline?.travelTimeMinutes;

  // Camera Presets Navigation
  const handleApplyCameraPreset = (presetKey) => {
    if (!mapRef.current) return;
    const preset = MAP_CONFIG.cameraPresets[presetKey];
    if (preset) {
      setActiveCameraPreset(presetKey);
      mapRef.current.flyTo({
        center: preset.center,
        zoom: preset.zoom,
        pitch: preset.pitch,
        bearing: preset.bearing,
        essential: true,
        duration: 1600
      });
    }
  };

  // Quick 3D Tilt Toggle (0° vs 60°)
  const handleTogglePitch3D = () => {
    if (!mapRef.current) return;
    const nextPitch = currentPitch > 25 ? 0 : 60;
    mapRef.current.easeTo({
      pitch: nextPitch,
      duration: 800
    });
  };

  // Reset Camera View
  const handleResetCamera = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.defaultZoom,
      pitch: MAP_CONFIG.pitch,
      bearing: MAP_CONFIG.bearing,
      duration: 1400
    });
    setActiveCameraPreset("mgRoad");
  };

  return (
    <div className="map-viewport-container">
      {/* Map Element */}
      <div ref={mapContainerRef} className="maplibre-map-element" />

      {/* Loading & Error States */}
      {!mapLoaded && !mapError && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(7, 12, 24, 0.94)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '12px',
            padding: '20px 30px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            zIndex: 50,
            boxShadow: '0 10px 40px rgba(0,0,0,0.7)'
          }}
        >
          <div className="status-pulse-dot" style={{ width: '14px', height: '14px' }} />
          <div style={{ fontSize: '0.86rem', color: '#f1f5f9', fontWeight: 600 }}>
            Loading 3D Bengaluru Streets & OpenFreeMap Extrusions...
          </div>
        </div>
      )}

      {mapError && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 59, 87, 0.15)',
            border: '1px solid #ff3b57',
            borderRadius: '8px',
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 50,
            color: '#ff3b57',
            fontSize: '0.8rem'
          }}
        >
          <AlertTriangle size={16} />
          <span>{mapError}</span>
        </div>
      )}

      {/* Floating Camera Presets Bar */}
      <div className="map-floating-overlay">
        <div className="map-view-preset-label">Camera views · view only</div>
        <div className="camera-presets-card">
          <button
            className={`camera-preset-btn ${activeCameraPreset === 'mgRoad' ? 'active' : ''}`}
            onClick={() => handleApplyCameraPreset('mgRoad')}
          >
            <Navigation size={13} />
            <span>MG Road Central</span>
          </button>
          <button
            className={`camera-preset-btn ${activeCameraPreset === 'hospitalCorridor' ? 'active' : ''}`}
            onClick={() => handleApplyCameraPreset('hospitalCorridor')}
          >
            <span>🏥 Bowring Hospital</span>
          </button>
          <button
            className={`camera-preset-btn ${activeCameraPreset === 'residencyBrigade' ? 'active' : ''}`}
            onClick={() => handleApplyCameraPreset('residencyBrigade')}
          >
            <span>Brigade & Residency</span>
          </button>
          <button
            className={`camera-preset-btn ${activeCameraPreset === 'birdseyeOverview' ? 'active' : ''}`}
            onClick={() => handleApplyCameraPreset('birdseyeOverview')}
          >
            <span>Overview</span>
          </button>
        </div>
        {mapSelectionMode && (
          <div className="map-selection-hint">
            {mapSelectionMode === 'origin' ? 'Choose a CityTwin intersection for the route origin.'
              : mapSelectionMode === 'destination' ? 'Choose a CityTwin intersection for the destination.'
                : mapSelectionMode === 'closure-intersection' ? 'Choose a CityTwin intersection to close its connected roads.'
                  : 'Choose a CityTwin road segment to close.'}
          </div>
        )}
      </div>

      {/* Floating Right Controls (Pitch & Reset) */}
      <div className="map-right-controls">
        <button
          className="map-control-btn"
          onClick={handleTogglePitch3D}
          title={`Toggle 3D Perspective Tilt (Current: ${currentPitch}°)`}
        >
          <Building2 size={17} style={{ color: currentPitch > 25 ? '#00f2fe' : '#94a3b8' }} />
        </button>

        <button
          className="map-control-btn"
          onClick={handleResetCamera}
          title="Reset Camera to MG Road"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Map Legend */}
      <div className="map-legend-card">
        <div className="legend-title">
          <span>Simulation Visual Hierarchy</span>
          <span style={{ color: '#00f2fe' }}>{currentPitch}° 3D Perspective</span>
        </div>
        <div className="legend-items-grid">
          <div className="legend-item">
            <div className="legend-color-line" style={{ background: '#ff3b57', border: '1px dashed #ffffff', height: '6px' }} />
            <span style={{ color: '#ff3b57', fontWeight: 600 }}>Closed Road (Red)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color-line" style={{ background: '#10b981', height: '5px' }} />
            <span style={{ color: '#10b981', fontWeight: 600 }}>Selected Plan Route</span>
          </div>
          <div className="legend-item">
            <div className="legend-color-line" style={{ background: '#94a3b8', height: '3px', borderTop: '1px dashed #cbd5e1' }} />
            <span>Other valid plans (dashed)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color-line" style={{ background: '#f8fafc', height: '3px', borderTop: '1px dashed #f8fafc' }} />
            <span>Baseline route (dashed)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color-line" style={{ background: '#f43f5e', border: '1px dashed #ffffff', height: '4px' }} />
            <span style={{ color: '#f43f5e' }}>Ambulance Corridor (Rose)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color-line" style={{ background: '#f59e0b', height: '3px' }} />
            <span>Congested Corridors</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#ff385c' }} />
            <span>Bowring Hospital Gate</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#fbbf24', border: '1px solid #f8fafc' }} />
            <span>CityTwin graph intersections</span>
          </div>
        </div>
        <div className="map-data-note">Basemap and buildings are physical map layers. Roads, junction points, closures, traffic, and routes are synthetic CityTwin graph overlays.</div>
        <div className="map-route-summary" aria-live="polite">
          {routeUnavailable ? (
            <strong>No valid {selectedPlanLabel} route for this closure.</strong>
          ) : (
            <>
              <strong>{selectedPlanLabel} route</strong>
              <span>{simulationResults?.scenario?.origin} to {simulationResults?.scenario?.destination}</span>
              <span>{activeRouteDistance} km · {activeRouteTime} min estimated</span>
            </>
          )}
          <span>
            Baseline (no closure): {baselineDistance} km · {baselineTime} min
            {baselineRouteUnavailable ? ' · route uses closed road; geometry hidden' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
