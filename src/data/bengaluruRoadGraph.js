/**
 * CityTwin Deterministic Road Graph — Central Bengaluru (MG Road CBD & Hospital Corridors)
 * Coordinates are dense (~50-75 m apart) and follow actual OSM road centrelines so that
 * route polylines never cut straight through 3D building footprints.
 * Note: Traffic volumes are synthetic simulated estimates, not live data.
 */

export const BENGALURU_NODES = {
  n_kumble_circle: {
    id: "n_kumble_circle",
    name: "Anil Kumble Circle",
    coordinates: [77.6015, 12.9754],
    type: "junction",
    elevation: 915
  },
  n_mg_brigade: {
    id: "n_mg_brigade",
    name: "MG Road - Brigade Junction",
    coordinates: [77.6068, 12.9740],
    type: "junction",
    elevation: 914
  },
  n_mg_kamaraj: {
    id: "n_mg_kamaraj",
    name: "MG Road - Kamaraj Rd (Cauvery Arts)",
    coordinates: [77.6110, 12.9742],
    type: "junction",
    elevation: 912
  },
  n_mayo_hall: {
    id: "n_mayo_hall",
    name: "Mayo Hall Junction (Residency Rd)",
    coordinates: [77.6095, 12.9715],
    type: "civic",
    elevation: 913
  },
  n_kamaraj_residency: {
    id: "n_kamaraj_residency",
    name: "Kamaraj Rd & Residency Rd Junction",
    coordinates: [77.6112, 12.9713],
    type: "junction",
    elevation: 913
  },
  n_trinity_circle: {
    id: "n_trinity_circle",
    name: "Trinity Circle (East Gateway)",
    coordinates: [77.6205, 12.9728],
    type: "gateway",
    elevation: 910
  },
  n_brigade_war_memorial: {
    id: "n_brigade_war_memorial",
    name: "Brigade Rd - War Memorial",
    coordinates: [77.6074, 12.9696],
    type: "junction",
    elevation: 914
  },
  n_residency_museum: {
    id: "n_residency_museum",
    name: "Residency Rd - Museum Rd",
    coordinates: [77.6045, 12.9700],
    type: "junction",
    elevation: 916
  },
  n_st_marks_residency: {
    id: "n_st_marks_residency",
    name: "St. Mark's - Residency Rd (Cash Pharmacy)",
    coordinates: [77.6008, 12.9702],
    type: "junction",
    elevation: 918
  },
  n_richmond_circle: {
    id: "n_richmond_circle",
    name: "Richmond Circle Flyover",
    coordinates: [77.5975, 12.9648],
    type: "flyover",
    elevation: 915
  },
  n_lavelle_junction: {
    id: "n_lavelle_junction",
    name: "Lavelle Rd - Vittal Mallya Rd",
    coordinates: [77.5995, 12.9690],
    type: "junction",
    elevation: 916
  },
  n_mallya_hospital: {
    id: "n_mallya_hospital",
    name: "Mallya Hospital Corridor Node",
    coordinates: [77.5960, 12.9710],
    type: "hospital_access",
    elevation: 917
  },
  n_kasturba_queen: {
    id: "n_kasturba_queen",
    name: "Kasturba Rd - Queen Victoria Statue",
    coordinates: [77.5972, 12.9759],
    type: "gateway",
    elevation: 918
  },
  n_vidhana_soudha: {
    id: "n_vidhana_soudha",
    name: "Vidhana Soudha / High Court Gate",
    coordinates: [77.5910, 12.9790],
    type: "civic",
    elevation: 922
  },
  n_cubbon_thimayya: {
    id: "n_cubbon_thimayya",
    name: "Cubbon Rd - Gen Thimayya Junction",
    coordinates: [77.6018, 12.9795],
    type: "junction",
    elevation: 916
  },
  n_cubbon_kamaraj: {
    id: "n_cubbon_kamaraj",
    name: "Cubbon Rd - Kamaraj Rd Junction",
    coordinates: [77.6115, 12.9785],
    type: "junction",
    elevation: 914
  },
  n_cubbon_dickenson: {
    id: "n_cubbon_dickenson",
    name: "Cubbon Rd - Dickenson Rd",
    coordinates: [77.6170, 12.9772],
    type: "junction",
    elevation: 912
  },
  n_dickenson_mg: {
    id: "n_dickenson_mg",
    name: "Dickenson Rd & MG Rd Junction",
    coordinates: [77.6172, 12.9744],
    type: "junction",
    elevation: 912
  },
  n_commercial_street: {
    id: "n_commercial_street",
    name: "Commercial Street Junction",
    coordinates: [77.6112, 12.9825],
    type: "shopping",
    elevation: 912
  },
  n_bowring_hospital: {
    id: "n_bowring_hospital",
    name: "Bowring & Lady Curzon Hospital Emergency Gate",
    coordinates: [77.6030, 12.9832],
    type: "hospital_emergency",
    elevation: 913
  },
  n_shivajinagar_terminal: {
    id: "n_shivajinagar_terminal",
    name: "Shivajinagar Bus Transit Hub",
    coordinates: [77.6000, 12.9845],
    type: "transit",
    elevation: 914
  },
  n_queens_road_north: {
    id: "n_queens_road_north",
    name: "Queen's Road - Cantonment Connector",
    coordinates: [77.5955, 12.9830],
    type: "arterial",
    elevation: 916
  }
};

export const BENGALURU_EDGES = [
  // ─── MG Road Corridor (East-West Main Spine) ────────────────────────────
  {
    id: "edge_mg_west",
    name: "MG Road West (Kumble to Brigade)",
    from: "n_kumble_circle",
    to: "n_mg_brigade",
    distanceKm: 0.58,
    freeFlowSpeed: 38,
    capacity: 2600,
    baselineTraffic: 2150,
    isPredefinedClosureCandidate: false,
    // Dense waypoints following the actual MG Road centreline heading east
    coordinates: [
      [77.6015, 12.9754],
      [77.6022, 12.9752],
      [77.6029, 12.9750],
      [77.6036, 12.9748],
      [77.6043, 12.9746],
      [77.6050, 12.9744],
      [77.6058, 12.9742],
      [77.6068, 12.9740]
    ],
    description: "Primary commercial corridor passing MG Road Boulevard & Metro Station."
  },
  {
    id: "edge_mg_central",
    name: "MG Road Central (Brigade to Kamaraj / Cauvery)",
    from: "n_mg_brigade",
    to: "n_mg_kamaraj",
    distanceKm: 0.46,
    freeFlowSpeed: 35,
    capacity: 2400,
    baselineTraffic: 2280,
    isPredefinedClosureCandidate: true,
    // Nearly level east run — waypoints prevent diagonal across blocks
    coordinates: [
      [77.6068, 12.9740],
      [77.6075, 12.9740],
      [77.6082, 12.9741],
      [77.6089, 12.9741],
      [77.6096, 12.9741],
      [77.6103, 12.9742],
      [77.6110, 12.9742]
    ],
    description: "Demo Closure Target: Prime high-street retail zone with heavy pedestrian crossings."
  },
  {
    id: "edge_mg_mid_east",
    name: "MG Road Mid-East (Kamaraj to Dickenson Link)",
    from: "n_mg_kamaraj",
    to: "n_dickenson_mg",
    distanceKm: 0.68,
    freeFlowSpeed: 40,
    capacity: 2800,
    baselineTraffic: 2250,
    coordinates: [
      [77.6110, 12.9742],
      [77.6120, 12.9742],
      [77.6130, 12.9743],
      [77.6140, 12.9743],
      [77.6150, 12.9743],
      [77.6160, 12.9744],
      [77.6172, 12.9744]
    ],
    description: "Eastward commercial trunk passing Manipal Centre towards Trinity Circle."
  },
  {
    id: "edge_mg_east",
    name: "MG Road East (Dickenson to Trinity Circle)",
    from: "n_dickenson_mg",
    to: "n_trinity_circle",
    distanceKm: 0.38,
    freeFlowSpeed: 42,
    capacity: 2800,
    baselineTraffic: 2300,
    coordinates: [
      [77.6172, 12.9744],
      [77.6180, 12.9741],
      [77.6188, 12.9738],
      [77.6197, 12.9733],
      [77.6205, 12.9728]
    ],
    description: "East arterial leading directly to Trinity Metro and Indiranagar/Old Airport Rd."
  },

  // ─── Brigade Road (North-South Arterial) ────────────────────────────────
  {
    id: "edge_brigade_road",
    name: "Brigade Road Main Spine",
    from: "n_mg_brigade",
    to: "n_brigade_war_memorial",
    distanceKm: 0.52,
    freeFlowSpeed: 30,
    capacity: 1800,
    baselineTraffic: 1550,
    isPredefinedClosureCandidate: false,
    // Runs south-southwest: tight waypoints avoid crossing building blocks
    coordinates: [
      [77.6068, 12.9740],
      [77.6069, 12.9732],
      [77.6070, 12.9724],
      [77.6071, 12.9716],
      [77.6072, 12.9708],
      [77.6074, 12.9696]
    ],
    description: "Vibrant shopping avenue linking MG Road with Residency Road."
  },

  // ─── Residency Road (Parallel westbound to MG Road) ─────────────────────
  {
    id: "edge_kamaraj_south",
    name: "Kamaraj Road South (MG Rd to Residency Rd)",
    from: "n_mg_kamaraj",
    to: "n_kamaraj_residency",
    distanceKm: 0.32,
    freeFlowSpeed: 32,
    capacity: 1700,
    baselineTraffic: 1100,
    // Runs south along Kamaraj Road
    coordinates: [
      [77.6110, 12.9742],
      [77.6111, 12.9733],
      [77.6111, 12.9723],
      [77.6112, 12.9713]
    ],
    description: "Southward connector from MG Road to Residency Road along Kamaraj Road corridor."
  },
  {
    id: "edge_residency_mayo_link",
    name: "Residency Rd (Kamaraj to Mayo Hall)",
    from: "n_kamaraj_residency",
    to: "n_mayo_hall",
    distanceKm: 0.19,
    freeFlowSpeed: 36,
    capacity: 2200,
    baselineTraffic: 1650,
    coordinates: [
      [77.6112, 12.9713],
      [77.6104, 12.9714],
      [77.6095, 12.9715]
    ],
    description: "Westbound Residency Road stretch adjacent to Garuda Mall and Mayo Hall."
  },
  {
    id: "edge_residency_east",
    name: "Residency Road East (Mayo Hall to Brigade)",
    from: "n_mayo_hall",
    to: "n_brigade_war_memorial",
    distanceKm: 0.32,
    freeFlowSpeed: 40,
    capacity: 2200,
    baselineTraffic: 1750,
    coordinates: [
      [77.6095, 12.9715],
      [77.6088, 12.9710],
      [77.6081, 12.9705],
      [77.6074, 12.9696]
    ],
    description: "High-capacity civic corridor adjacent to Mayo Hall Courthouse."
  },
  {
    id: "edge_residency_mid",
    name: "Residency Road Mid (Brigade to Museum Rd)",
    from: "n_brigade_war_memorial",
    to: "n_residency_museum",
    distanceKm: 0.33,
    freeFlowSpeed: 40,
    capacity: 2400,
    baselineTraffic: 1900,
    coordinates: [
      [77.6074, 12.9696],
      [77.6063, 12.9697],
      [77.6052, 12.9699],
      [77.6045, 12.9700]
    ],
    description: "Major multi-lane westbound bypass for diverted MG Road traffic."
  },
  {
    id: "edge_residency_west",
    name: "Residency Road West (Museum Rd to Cash Pharmacy)",
    from: "n_residency_museum",
    to: "n_st_marks_residency",
    distanceKm: 0.41,
    freeFlowSpeed: 40,
    capacity: 2400,
    baselineTraffic: 1850,
    coordinates: [
      [77.6045, 12.9700],
      [77.6033, 12.9700],
      [77.6020, 12.9701],
      [77.6008, 12.9702]
    ],
    description: "Westbound trunk road connecting central CBD to Richmond Circle."
  },

  // ─── St. Mark's Road ────────────────────────────────────────────────────
  {
    id: "edge_st_marks",
    name: "St. Mark's Road",
    from: "n_kumble_circle",
    to: "n_st_marks_residency",
    distanceKm: 0.58,
    freeFlowSpeed: 35,
    capacity: 1900,
    baselineTraffic: 1400,
    // Runs south along St. Mark's Road
    coordinates: [
      [77.6015, 12.9754],
      [77.6014, 12.9741],
      [77.6013, 12.9728],
      [77.6011, 12.9715],
      [77.6008, 12.9702]
    ],
    description: "Key north-south corridor flanked by heritage cafes and institutions."
  },

  // ─── Cubbon Road (Northern Parallel Arterial) ───────────────────────────
  {
    id: "edge_cubbon_west",
    name: "Cubbon Road West (Thimayya to Kamaraj)",
    from: "n_cubbon_thimayya",
    to: "n_cubbon_kamaraj",
    distanceKm: 1.06,
    freeFlowSpeed: 45,
    capacity: 2600,
    baselineTraffic: 1800,
    coordinates: [
      [77.6018, 12.9795],
      [77.6030, 12.9793],
      [77.6043, 12.9791],
      [77.6056, 12.9790],
      [77.6070, 12.9789],
      [77.6083, 12.9788],
      [77.6096, 12.9787],
      [77.6115, 12.9785]
    ],
    description: "Wide arterial passing Chinnaswamy Stadium, crucial for northern diversion."
  },
  {
    id: "edge_cubbon_east",
    name: "Cubbon Road East (Kamaraj to Dickenson)",
    from: "n_cubbon_kamaraj",
    to: "n_cubbon_dickenson",
    distanceKm: 0.62,
    freeFlowSpeed: 42,
    capacity: 2200,
    baselineTraffic: 1500,
    coordinates: [
      [77.6115, 12.9785],
      [77.6127, 12.9782],
      [77.6139, 12.9779],
      [77.6152, 12.9776],
      [77.6170, 12.9772]
    ],
    description: "Bypasses MG Road towards Manipal Centre and Ulsoor Lake."
  },
  {
    id: "edge_dickenson_south",
    name: "Dickenson Road (Cubbon Rd to MG Rd)",
    from: "n_cubbon_dickenson",
    to: "n_dickenson_mg",
    distanceKm: 0.32,
    freeFlowSpeed: 35,
    capacity: 1800,
    baselineTraffic: 1250,
    coordinates: [
      [77.6170, 12.9772],
      [77.6171, 12.9762],
      [77.6171, 12.9753],
      [77.6172, 12.9744]
    ],
    description: "Southward Dickenson Road connection feeding Cubbon bypass into MG Road East."
  },

  // ─── MG Road ↔ Cubbon Road Connectors ───────────────────────────────────
  {
    id: "edge_kamaraj_connector",
    name: "Kamaraj Road North (MG Rd to Cubbon Rd)",
    from: "n_mg_kamaraj",
    to: "n_cubbon_kamaraj",
    distanceKm: 0.48,
    freeFlowSpeed: 34,
    capacity: 1700,
    baselineTraffic: 1250,
    // Runs north along Kamaraj Road
    coordinates: [
      [77.6110, 12.9742],
      [77.6111, 12.9753],
      [77.6112, 12.9763],
      [77.6113, 12.9773],
      [77.6115, 12.9785]
    ],
    description: "Critical bypass connecting MG Road Central to Cubbon Road North."
  },
  {
    id: "edge_thimayya_kumble",
    name: "Gen. Thimayya Link (Kumble to Cubbon)",
    from: "n_kumble_circle",
    to: "n_cubbon_thimayya",
    distanceKm: 0.46,
    freeFlowSpeed: 35,
    capacity: 1900,
    baselineTraffic: 1300,
    // Runs north along Thimayya Road
    coordinates: [
      [77.6015, 12.9754],
      [77.6015, 12.9764],
      [77.6016, 12.9774],
      [77.6017, 12.9785],
      [77.6018, 12.9795]
    ],
    description: "Links Anil Kumble Circle northwards to Chinnaswamy Stadium & Cubbon Rd."
  },

  // ─── Kasturba Road & Vidhana Soudha Corridors ───────────────────────────
  {
    id: "edge_kasturba_kumble",
    name: "Kasturba Road (Queen Victoria to Kumble Circle)",
    from: "n_kasturba_queen",
    to: "n_kumble_circle",
    distanceKm: 0.47,
    freeFlowSpeed: 40,
    capacity: 2500,
    baselineTraffic: 1950,
    // Runs east along Kasturba Road
    coordinates: [
      [77.5972, 12.9759],
      [77.5983, 12.9758],
      [77.5994, 12.9757],
      [77.6005, 12.9756],
      [77.6015, 12.9754]
    ],
    description: "Bordering Cubbon Park, high volume inbound corridor from west Bengaluru."
  },
  {
    id: "edge_kasturba_vidhana",
    name: "Vidhana Soudha Approach Corridor",
    from: "n_vidhana_soudha",
    to: "n_kasturba_queen",
    distanceKm: 0.76,
    freeFlowSpeed: 45,
    capacity: 3000,
    baselineTraffic: 2100,
    coordinates: [
      [77.5910, 12.9790],
      [77.5921, 12.9786],
      [77.5932, 12.9782],
      [77.5943, 12.9778],
      [77.5955, 12.9774],
      [77.5965, 12.9768],
      [77.5972, 12.9759]
    ],
    description: "Ceremonial axis between High Court/Vidhana Soudha and MG Road."
  },
  {
    id: "edge_vidhana_queens_rd",
    name: "Queen's Road (Vidhana Soudha to North)",
    from: "n_vidhana_soudha",
    to: "n_queens_road_north",
    distanceKm: 0.67,
    freeFlowSpeed: 42,
    capacity: 2200,
    baselineTraffic: 1550,
    coordinates: [
      [77.5910, 12.9790],
      [77.5921, 12.9798],
      [77.5932, 12.9807],
      [77.5943, 12.9817],
      [77.5955, 12.9830]
    ],
    description: "Express corridor directing administrative traffic north toward Cantonment."
  },

  // ─── Emergency Priority Hospital Corridors (Bowring & Lady Curzon) ──────
  {
    id: "edge_bowring_thimayya_arterial",
    name: "Lady Curzon Emergency Corridor (Bowring to Thimayya)",
    from: "n_bowring_hospital",
    to: "n_cubbon_thimayya",
    distanceKm: 0.44,
    freeFlowSpeed: 40,
    capacity: 1800,
    baselineTraffic: 900,
    isEmergencyLane: true,
    coordinates: [
      [77.6030, 12.9832],
      [77.6027, 12.9823],
      [77.6024, 12.9814],
      [77.6021, 12.9804],
      [77.6018, 12.9795]
    ],
    description: "CRITICAL EMERGENCY ACCESS: Direct artery into Bowring & Lady Curzon Hospital."
  },
  {
    id: "edge_bowring_commercial",
    name: "Armstrong Road (Bowring to Commercial St)",
    from: "n_bowring_hospital",
    to: "n_commercial_street",
    distanceKm: 0.89,
    freeFlowSpeed: 30,
    capacity: 1400,
    baselineTraffic: 1100,
    coordinates: [
      [77.6030, 12.9832],
      [77.6047, 12.9831],
      [77.6063, 12.9829],
      [77.6079, 12.9828],
      [77.6096, 12.9826],
      [77.6112, 12.9825]
    ],
    description: "East access into Bowring Hospital via Shivaji Nagar commercial perimeter."
  },
  {
    id: "edge_commercial_cubbon",
    name: "Kamaraj Commercial Link",
    from: "n_commercial_street",
    to: "n_cubbon_kamaraj",
    distanceKm: 0.45,
    freeFlowSpeed: 30,
    capacity: 1500,
    baselineTraffic: 1200,
    coordinates: [
      [77.6112, 12.9825],
      [77.6112, 12.9812],
      [77.6113, 12.9799],
      [77.6115, 12.9785]
    ],
    description: "Connects northern bazaar district into Cubbon Road arterial."
  },
  {
    id: "edge_bowring_transit",
    name: "Hospital - Shivajinagar Terminal Link",
    from: "n_bowring_hospital",
    to: "n_shivajinagar_terminal",
    distanceKm: 0.36,
    freeFlowSpeed: 25,
    capacity: 1600,
    baselineTraffic: 1400,
    coordinates: [
      [77.6030, 12.9832],
      [77.6020, 12.9836],
      [77.6010, 12.9841],
      [77.6000, 12.9845]
    ],
    description: "Dense feeder corridor to Shivajinagar transit hub."
  },
  {
    id: "edge_queens_shivajinagar",
    name: "Queen's Rd to Shivajinagar",
    from: "n_queens_road_north",
    to: "n_shivajinagar_terminal",
    distanceKm: 0.52,
    freeFlowSpeed: 35,
    capacity: 1800,
    baselineTraffic: 1300,
    coordinates: [
      [77.5955, 12.9830],
      [77.5966, 12.9834],
      [77.5977, 12.9838],
      [77.5989, 12.9842],
      [77.6000, 12.9845]
    ],
    description: "Links western government sector into northern hospital district."
  },

  // ─── Southern Medical / Mallya Hospital Corridors ───────────────────────
  {
    id: "edge_mallya_kasturba",
    name: "Vittal Mallya Road (Mallya Hospital to Kasturba)",
    from: "n_kasturba_queen",
    to: "n_mallya_hospital",
    distanceKm: 0.56,
    freeFlowSpeed: 35,
    capacity: 2000,
    baselineTraffic: 1450,
    isEmergencyLane: true,
    // Runs south along Vittal Mallya Road
    coordinates: [
      [77.5972, 12.9759],
      [77.5970, 12.9747],
      [77.5967, 12.9735],
      [77.5964, 12.9722],
      [77.5960, 12.9710]
    ],
    description: "EMERGENCY ACCESS: Direct corridor servicing Mallya Hospital and UB City."
  },
  {
    id: "edge_mallya_lavelle",
    name: "Vittal Mallya Rd to Lavelle Rd",
    from: "n_mallya_hospital",
    to: "n_lavelle_junction",
    distanceKm: 0.42,
    freeFlowSpeed: 35,
    capacity: 1700,
    baselineTraffic: 1100,
    coordinates: [
      [77.5960, 12.9710],
      [77.5969, 12.9704],
      [77.5978, 12.9698],
      [77.5987, 12.9694],
      [77.5995, 12.9690]
    ],
    description: "Southern connector passing high-density residential and clinics."
  },
  {
    id: "edge_lavelle_residency",
    name: "Lavelle Rd to Cash Pharmacy Link",
    from: "n_lavelle_junction",
    to: "n_st_marks_residency",
    distanceKm: 0.21,
    freeFlowSpeed: 30,
    capacity: 1500,
    baselineTraffic: 1050,
    coordinates: [
      [77.5995, 12.9690],
      [77.6002, 12.9696],
      [77.6008, 12.9702]
    ],
    description: "Direct feed into Residency Road artery."
  },
  {
    id: "edge_richmond_cash",
    name: "Richmond Circle - Residency Connector",
    from: "n_richmond_circle",
    to: "n_st_marks_residency",
    distanceKm: 0.69,
    freeFlowSpeed: 42,
    capacity: 2800,
    baselineTraffic: 2200,
    coordinates: [
      [77.5975, 12.9648],
      [77.5981, 12.9661],
      [77.5987, 12.9673],
      [77.5993, 12.9685],
      [77.5999, 12.9694],
      [77.6008, 12.9702]
    ],
    description: "Major flyover feeder for southern Bengaluru."
  }
];

// Helper to look up an edge by ID or between two nodes
export function getEdgeById(edgeId) {
  return BENGALURU_EDGES.find(e => e.id === edgeId) || null;
}

export function getNodeById(nodeId) {
  return BENGALURU_NODES[nodeId] || null;
}
