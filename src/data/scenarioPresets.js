/**
 * Scenario Presets for CityTwin Bengaluru
 * Quick-start real-world simulation configurations for city planners.
 */

export const SCENARIO_PRESETS = [
  {
    id: "preset_mg_central_overhaul",
    name: "MG Road Central Maintenance & Skywalk (Demo Default)",
    badge: "Official Demo",
    closedEdgeId: "edge_mg_central",
    originNodeId: "n_kumble_circle",
    destinationNodeId: "n_trinity_circle",
    hospitalNodeId: "n_bowring_hospital",
    durationHours: 6,
    demandLevel: "high", // 1.25x load
    timeOfDay: "peak_morning",
    recommendedPlan: "plan_b",
    description: "Full closure of MG Road between Brigade Road and Kamaraj Road for structural skywalk installation during peak hours. Requires testing bypass through Residency Rd vs Cubbon Rd."
  },
  {
    id: "preset_brigade_pedestrian",
    name: "Brigade Road Open Street Festival",
    badge: "Civic Event",
    closedEdgeId: "edge_brigade_road",
    originNodeId: "n_mg_brigade",
    destinationNodeId: "n_richmond_circle",
    hospitalNodeId: "n_mallya_hospital",
    durationHours: 12,
    demandLevel: "medium",
    timeOfDay: "evening_rush",
    recommendedPlan: "plan_a",
    description: "Pedestrianization of Brigade Road spine for an open-street festival. Diverts vehicles through Mayo Hall, Kamaraj, and Museum Road."
  },
  {
    id: "preset_bowring_emergency_priority",
    name: "Bowring Hospital Green Corridor Protocol",
    badge: "Emergency Priority",
    closedEdgeId: "edge_mg_central",
    originNodeId: "n_kasturba_queen",
    destinationNodeId: "n_trinity_circle",
    hospitalNodeId: "n_bowring_hospital",
    durationHours: 3,
    demandLevel: "high",
    timeOfDay: "peak_morning",
    recommendedPlan: "plan_c",
    description: "Simulates high congestion scenario while maintaining sub-8 minute emergency ambulance transit from Vidhana Soudha / High Court to Bowring Hospital."
  },
  {
    id: "preset_cubbon_repaving",
    name: "Cubbon Road Arterial Resurfacing",
    badge: "Infrastructure",
    closedEdgeId: "edge_cubbon_west",
    originNodeId: "n_vidhana_soudha",
    destinationNodeId: "n_trinity_circle",
    hospitalNodeId: "n_bowring_hospital",
    durationHours: 8,
    demandLevel: "medium",
    timeOfDay: "midday",
    recommendedPlan: "plan_b",
    description: "Partial arterial shutdown of Cubbon Road west of Kamaraj. Tests whether MG Road and Residency Road can absorb northern overflow without paralysis."
  }
];
