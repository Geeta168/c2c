/**
 * Real Facilities and Critical Infrastructure in Central Bengaluru
 * Displayed as interactive 3D map markers and used for emergency corridor routing.
 */

export const BENGALURU_FACILITIES = [
  {
    id: "fac_bowring_hospital",
    name: "Bowring & Lady Curzon Hospital",
    category: "hospital",
    categoryLabel: "Tertiary Emergency Hospital",
    coordinates: [77.6030, 12.9832],
    nearestNode: "n_bowring_hospital",
    beds: 686,
    traumaLevel: "Level 1 Trauma & Emergency",
    ambulanceFleet: 18,
    status: "Operational — Priority Corridor Protected",
    description: "Centuries-old apex government teaching hospital handling high daily trauma and critical emergency influx for Central Bengaluru."
  },
  {
    id: "fac_mallya_hospital",
    name: "Mallya Hospital & Heart Institute",
    category: "hospital",
    categoryLabel: "Specialty Emergency Hospital",
    coordinates: [77.5960, 12.9710],
    nearestNode: "n_mallya_hospital",
    beds: 220,
    traumaLevel: "Cardiac & Acute Trauma Center",
    ambulanceFleet: 8,
    status: "Operational",
    description: "Key private emergency healthcare institution located on Vittal Mallya Road servicing central and southern corridors."
  },
  {
    id: "fac_mg_metro",
    name: "MG Road Metro Interchange Station",
    category: "transit",
    categoryLabel: "Namma Metro Station",
    coordinates: [77.6068, 12.9748],
    nearestNode: "n_mg_brigade",
    dailyFootfall: "85,000+ passengers",
    transitLines: "Purple Line & Future Pink Line link",
    status: "Active Transit Gateway",
    description: "Heaviest transit hub in Bengaluru CBD with direct skywalk connection to Church Street and Brigade Road."
  },
  {
    id: "fac_cubbon_metro",
    name: "Cubbon Park Metro Station",
    category: "transit",
    categoryLabel: "Namma Metro Station",
    coordinates: [77.5998, 12.9798],
    nearestNode: "n_cubbon_thimayya",
    dailyFootfall: "45,000+ passengers",
    transitLines: "Purple Line",
    status: "Active Transit Hub",
    description: "Gateway to Cubbon Park, Chinnaswamy Stadium, and High Court administrative complex."
  },
  {
    id: "fac_trinity_metro",
    name: "Trinity Metro Station",
    category: "transit",
    categoryLabel: "Namma Metro Station",
    coordinates: [77.6205, 12.9728],
    nearestNode: "n_trinity_circle",
    dailyFootfall: "32,000+ passengers",
    transitLines: "Purple Line",
    status: "Active Transit Hub",
    description: "Eastern gateway connector linking MG Road to Halasuru, Indiranagar, and Old Airport Road."
  },
  {
    id: "fac_mayo_hall",
    name: "Mayo Hall & Municipal Courts",
    category: "civic",
    categoryLabel: "Heritage Civic Complex",
    coordinates: [77.6095, 12.9715],
    nearestNode: "n_mayo_hall",
    jurisdiction: "Civil Courts & Traffic Police Command",
    builtYear: "1883",
    status: "Active Civic Center",
    description: "Historic colonial landmark housing Bangalore City Civil Courts and municipal offices at the head of Residency Road."
  },
  {
    id: "fac_chinnaswamy",
    name: "M. Chinnaswamy Cricket Stadium",
    category: "landmark",
    categoryLabel: "Major Event Venue",
    coordinates: [77.5995, 12.9788],
    nearestNode: "n_cubbon_thimayya",
    capacity: "35,000 spectators",
    eventImpact: "Massive event crowd surge during match days",
    status: "High Congestion Potential",
    description: "International cricket stadium on Queen's / Cubbon Road requiring agile crowd and traffic management plans."
  },
  {
    id: "fac_vidhana_soudha",
    name: "Vidhana Soudha & High Court",
    category: "civic",
    categoryLabel: "State Legislative Assembly",
    coordinates: [77.5910, 12.9790],
    nearestNode: "n_vidhana_soudha",
    significance: "Seat of the Karnataka State Legislature",
    securityZone: "High Security VVIP Transit Zone",
    status: "Secured Administrative Axis",
    description: "Iconic neo-Dravidian granite government monument; key administrative origin point for policy and transit planning."
  },
  {
    id: "fac_commercial_street",
    name: "Commercial Street Pedestrian Core",
    category: "shopping",
    categoryLabel: "Heritage Retail District",
    coordinates: [77.6112, 12.9825],
    nearestNode: "n_commercial_street",
    density: "Heavy pedestrian and two-wheeler zone",
    status: "Restricted Traffic Corridor",
    description: "High-density retail bazaar adjacent to Shivaji Nagar, sensitive to arterial gridlock and overflow traffic."
  }
];
