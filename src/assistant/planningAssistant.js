/**
 * CityTwin AI Planning Assistant (Offline Deterministic NLP Engine)
 * Parses natural language requests, auto-populates scenario parameters,
 * executes the simulation engine, and formulates high-level planner briefings.
 */

import { BENGALURU_EDGES } from '../data/bengaluruRoadGraph.js';
import { runCityTwinSimulation } from '../simulation/trafficSimulator.js';

export const ASSISTANT_PRESETS = [
  {
    id: "prompt_demo_benchmark",
    text: "Close MG Road Central for 6 hours during morning peak. Minimize delays while preserving hospital access.",
    label: "Demo Benchmark (MG Road 6h Peak)"
  },
  {
    id: "prompt_brigade_pedestrian",
    text: "Close Brigade Road for 12 hours with medium demand for an open street festival.",
    label: "Brigade Road Festival (12h)"
  },
  {
    id: "prompt_hospital_drill",
    text: "Prioritize emergency hospital transit to Bowring Hospital during high peak rush with road closure.",
    label: "Bowring Hospital Emergency Corridor"
  },
  {
    id: "prompt_cubbon_repaving",
    text: "Close Cubbon Road West for 4 hours during midday. What is the delay impact?",
    label: "Cubbon Road Maintenance (4h Midday)"
  }
];

/**
 * Natural language intent parser
 */
export function parsePlannerQuery(queryText) {
  const text = (queryText || "").toLowerCase();

  // 1. Detect Road Closure Target
  let matchedEdge = BENGALURU_EDGES.find(e => e.id === "edge_mg_central"); // Default

  if (text.includes("brigade")) {
    matchedEdge = BENGALURU_EDGES.find(e => e.id === "edge_brigade_road") || matchedEdge;
  } else if (text.includes("cubbon") || text.includes("chinnaswamy")) {
    matchedEdge = BENGALURU_EDGES.find(e => e.id === "edge_cubbon_west") || matchedEdge;
  } else if (text.includes("residency") || text.includes("mayo")) {
    matchedEdge = BENGALURU_EDGES.find(e => e.id === "edge_residency_east") || matchedEdge;
  } else if (text.includes("st mark") || text.includes("st. mark")) {
    matchedEdge = BENGALURU_EDGES.find(e => e.id === "edge_st_marks") || matchedEdge;
  } else if (text.includes("mg road") || text.includes("mg") || text.includes("major road")) {
    matchedEdge = BENGALURU_EDGES.find(e => e.id === "edge_mg_central") || matchedEdge;
  }

  // 2. Detect Duration (hours)
  let durationHours = 6;
  const hourMatch = text.match(/(\d+)\s*(?:hours|hour|hrs|hr|h\b)/);
  if (hourMatch && hourMatch[1]) {
    const parsed = parseInt(hourMatch[1], 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 48) {
      durationHours = parsed;
    }
  } else if (text.includes("six hour")) {
    durationHours = 6;
  } else if (text.includes("three hour") || text.includes("3 hour")) {
    durationHours = 3;
  } else if (text.includes("twelve hour") || text.includes("12 hour")) {
    durationHours = 12;
  } else if (text.includes("full day") || text.includes("24 hour")) {
    durationHours = 24;
  }

  // 3. Detect Demand Level
  let demandLevel = "high";
  if (text.includes("off-peak") || text.includes("off peak") || text.includes("low demand") || text.includes("night")) {
    demandLevel = "low";
  } else if (text.includes("medium") || text.includes("standard") || text.includes("moderate") || text.includes("midday")) {
    demandLevel = "medium";
  } else if (text.includes("peak") || text.includes("rush") || text.includes("high") || text.includes("heavy")) {
    demandLevel = "high";
  }

  // 4. Detect Time of Day
  let timeOfDay = "peak_morning";
  if (text.includes("evening") || text.includes("dusk") || text.includes("night rush")) {
    timeOfDay = "evening_rush";
  } else if (text.includes("midday") || text.includes("afternoon") || text.includes("noon")) {
    timeOfDay = "midday";
  } else if (text.includes("late night") || text.includes("midnight")) {
    timeOfDay = "late_night";
  } else if (text.includes("morning") || text.includes("peak traffic") || text.includes("peak")) {
    timeOfDay = "peak_morning";
  }

  // 5. Detect Strategy Preference
  let selectedStrategy = "plan_b"; // Default balanced
  if (text.includes("hospital") || text.includes("emergency") || text.includes("ambulance") || text.includes("medical") || text.includes("preserv")) {
    selectedStrategy = "plan_c";
  } else if (text.includes("shortest") || text.includes("direct") || text.includes("basic detour") || text.includes("detour")) {
    selectedStrategy = "plan_a";
  } else if (text.includes("balanced") || text.includes("minimize delay") || text.includes("equilibrium")) {
    selectedStrategy = "plan_b";
  }

  return {
    closedEdgeId: matchedEdge.id,
    closedEdgeName: matchedEdge.name,
    durationHours,
    demandLevel,
    timeOfDay,
    selectedStrategy,
    detectedKeywords: {
      road: matchedEdge.name,
      duration: `${durationHours}h`,
      demand: demandLevel,
      strategy: selectedStrategy
    }
  };
}

/**
 * Execute simulation via query and build an intelligence report
 */
export function processPlannerAssistantQuery(queryText, baseParams = {}) {
  const parsed = parsePlannerQuery(queryText);

  // Merge parsed parameters with baseParams
  const simulationParams = {
    ...baseParams,
    closedEdgeId: parsed.closedEdgeId,
    closureTargetType: 'road',
    closedNodeId: null,
    durationHours: parsed.durationHours,
    demandLevel: parsed.demandLevel,
    timeOfDay: parsed.timeOfDay,
    selectedStrategy: parsed.selectedStrategy
  };

  const results = runCityTwinSimulation(simulationParams);

  // Generate Executive Intelligence Briefing based on calculated metrics
  const briefing = generateExecutiveBriefing(parsed, results);

  return {
    queryText,
    parsed,
    simulationParams,
    results,
    briefing
  };
}

/**
 * Generates an executive urban planning briefing without hallucinating numbers.
 */
function generateExecutiveBriefing(parsed, results) {
  const { simulated, baseline, scenario, strategyComparison, recommendation } = results;

  const roadName = scenario.closedTargetName || scenario.closedEdge.name;
  const activePlanName = strategyComparison[scenario.selectedStrategy]?.name || scenario.selectedStrategy;

  const keyFindings = [
    `Baseline corridor traversal time: ${baseline.travelTimeMinutes} min. Under closure with ${activePlanName}, projected travel time is ${simulated.travelTimeMinutes} min (+${simulated.delayDeltaMinutes} min / +${simulated.delayPercentage}%).`,
    `Systemic Congestion Score increases from ${baseline.congestionScore}/100 to ${simulated.congestionScore}/100 across the CBD network.`,
    `Total estimated affected vehicle volume over ${scenario.durationHours} hours: ${scenario.totalVehiclesAffected.toLocaleString()} vehicles, accumulating ~${simulated.cumulativeDelayHours.toLocaleString()} vehicle-hours of delay.`,
    `Emergency Bowring Hospital accessibility: transit is rated as "${simulated.hospitalStatus}" at ${simulated.hospitalTimeMinutes} min (baseline: ${baseline.hospitalTimeMinutes} min).`
  ];

  const mitigations = [];
  if (simulated.bottlenecks.length > 0) {
    const topBottleneck = simulated.bottlenecks[0];
    mitigations.push(`Deploy Bangalore Traffic Police (BTP) marshals at ${topBottleneck.name} (V/C ratio: ${topBottleneck.vcRatio}) to maintain manual green signal waves.`);
  } else {
    mitigations.push(`Extend green signal splits along Cubbon Road and Residency Road corridors by +15 seconds.`);
  }

  if (scenario.selectedStrategy === "plan_c" || simulated.hospitalTimeMinutes > 8.0) {
    mitigations.push(`Establish a physical cone-delineated Emergency Priority Lane along Lady Curzon Road connecting to Bowring Hospital.`);
  }

  mitigations.push(`Activate Variable Message Signs (VMS) at Anil Kumble Circle and Trinity Circle 45 minutes prior to closure commencement.`);

  return {
    title: `Decision Evaluation Briefing: ${roadName} (${scenario.durationHours}h Closure)`,
    executiveSummary: `Calculated estimates for ${roadName} closure under ${scenario.demandLevel.toUpperCase()} traffic demand. ${recommendation.reason}`,
    keyFindings,
    recommendedStrategy: recommendation.winner.toUpperCase(),
    recommendedStrategyReason: recommendation.reason,
    mitigations,
    syntheticDisclaimer: "Synthetic estimates, not live traffic or real-world predictions. Calculated by the TrafficTwin Graph & BPR Engine."
  };
}
