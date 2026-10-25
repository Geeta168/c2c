/**
 * CityTwin Map Configuration
 * Real 3D Bengaluru Map centered on MG Road Corridor
 * Attribution & Providers are centrally configured here.
 */

export const MAP_CONFIG = {
  // Real coordinates for MG Road, Bengaluru (Anil Kumble Circle / MG Road Metro)
  center: [77.6074, 12.9740], // [lng, lat]
  defaultZoom: 15.6,
  minZoom: 11,
  maxZoom: 18.5,
  pitch: 60, // 55-65 degree 3D perspective pitch so building heights are clearly visible
  bearing: -20, // Heading angle towards Cubbon Park / Vidhana Soudha

  // Camera Presets for Quick Navigation
  cameraPresets: {
    mgRoad: {
      center: [77.6074, 12.9740],
      zoom: 15.8,
      pitch: 62,
      bearing: -20,
      name: "MG Road Central"
    },
    hospitalCorridor: {
      center: [77.6030, 12.9832],
      zoom: 15.5,
      pitch: 58,
      bearing: 15,
      name: "Bowring Hospital Corridor"
    },
    residencyBrigade: {
      center: [77.6074, 12.9696],
      zoom: 15.6,
      pitch: 60,
      bearing: -45,
      name: "Residency & Brigade Hub"
    },
    birdseyeOverview: {
      center: [77.6060, 12.9750],
      zoom: 14.0,
      pitch: 35,
      bearing: 0,
      name: "CBD Birdseye (3D Overview)"
    }
  },

  // Primary Vector Tile Style: OpenFreeMap Dark (Free vector tiles with 3D buildings support, no API key required)
  // Backup / Fallback styles for ultra reliability
  styles: {
    primaryVector: "https://tiles.openfreemap.org/styles/dark",
    libertyVector: "https://tiles.openfreemap.org/styles/liberty",
    osmRasterFallback: {
      version: 8,
      name: "OpenStreetMap Standard Raster Fallback",
      sources: {
        "osm-tiles": {
          type: "raster",
          tiles: [
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          ],
          tileSize: 256,
          attribution: "© OpenStreetMap contributors"
        }
      },
      layers: [
        {
          id: "osm-tiles-layer",
          type: "raster",
          source: "osm-tiles",
          minzoom: 0,
          maxzoom: 19
        }
      ]
    }
  },

  // Attribution string (strictly retained as required)
  attribution: "© OpenStreetMap contributors | Tiles: OpenFreeMap | TrafficTwin Bengaluru Traffic Graph",

  // 3D Building Extrusion Layer Config using documented OpenMapTiles vector source-layer
  buildings3D: {
    id: "3d-buildings",
    source: "openmaptiles",
    "source-layer": "building", // MapLibre style specification requires kebab-case
    type: "fill-extrusion",
    minzoom: 13,
    paint: {
      "fill-extrusion-color": [
        "interpolate",
        ["linear"],
        ["coalesce", ["get", "render_height"], 18],
        0, "#0b162c",
        15, "#102347",
        35, "#18366e",
        70, "#224c96",
        120, "#2e66ca"
      ],
      "fill-extrusion-height": [
        "interpolate",
        ["linear"],
        ["zoom"],
        13, 0,
        14, [
          "case",
          ["has", "render_height"],
          ["get", "render_height"],
          ["has", "height"],
          ["get", "height"],
          18 // Fallback height in meters for buildings without explicit height tag
        ]
      ],
      "fill-extrusion-base": [
        "case",
        ["has", "render_min_height"],
        ["get", "render_min_height"],
        0
      ],
      "fill-extrusion-opacity": 0.88
    }
  }
};
