# TrafficTwin — Bengaluru Urban Traffic Planner
### Interactive 3D traffic planning for Bengaluru

**TrafficTwin** is an interactive 3D traffic-planning tool for Central Bengaluru, covering the MG Road, Brigade Road, Residency Road, Cubbon Road, and hospital corridors. Planners can select graph intersections for route endpoints, choose road or junction closures, and compare deterministic traffic estimates.

---

## 🌟 Key Features

### 1. Real 3D Bengaluru Geographic Map
- **Location:** Centered on MG Road, Anil Kumble Circle, and the Central Business District (CBD) of Bengaluru (`[77.6074, 12.9740]`).
- **Engine:** Built with **MapLibre GL JS** using vector tile styles from **OpenFreeMap** and **OpenStreetMap** with complete 3D extruded building footprints.
- **Controls:** Smooth zoom, pan, rotate, 3D perspective tilt, and camera reset.
- **Map selection:** Pick route origin and destination graph nodes, select a road to close, or close a junction and its incident roads. Matching dropdowns are available in Scenario Studio.
- **Interactivity:** Clickable road corridors, graph intersections, and facility markers (Bowring Hospital, Mallya Hospital, Namma Metro stations, Mayo Hall, Vidhana Soudha).
- **Layer Toggles:** Independent switches for 3D Buildings, BPR Congestion Heatmap, Road Closures, Critical Facilities, and Diversion Trajectory Flow.
- **Zero Paid APIs:** Free map styles are configured centrally in [`src/config/mapConfig.js`](src/config/mapConfig.js), with OpenStreetMap attribution.

### 2. Deterministic Traffic Graph Engine & Bureau of Public Roads (BPR) Delay Modeling
- **Network Graph:** Connected graph network with 22 Bengaluru nodes and 28 road edges, including arterial and collector corridors.
- **Graph Routing:** Deterministic Dijkstra shortest-path algorithm coupled with the standard Bureau of Public Roads (BPR) link delay function:
  $$T = T_0 \cdot \left(1 + \alpha \cdot \left(\frac{V}{C}\right)^\beta\right)$$
- **Three Mitigation Strategies:**
  - **Plan A — Basic Diversion:** Shortest feasible geometric detour avoiding closed edges. Minimizes raw detour distance.
  - **Plan B — Balanced Traffic (Recommended Default):** Capacity-aware routing that penalizes congested links and accounts for modeled diverted flow.
  - **Plan C — Emergency Priority:** Prioritizes designated hospital access corridors (Bowring & Lady Curzon Hospital / Mallya Hospital) while routing general traffic around emergency lanes.

### 3. AI Planning Assistant (Offline NLP Engine)
- **Natural Language Parsing:** Operates completely offline without requiring paid external AI API keys or credit cards.
- **Query Understanding:** Parses complex natural language requests (e.g. *"Close MG Road Central for 6 hours during morning peak. Minimize delays while preserving hospital access."*).
- **Auto-Execution:** Extracts road target, duration, traffic demand, and strategy preference, then updates scenario controls and calculated results.
- **Executive Intelligence Briefing:** Generates quantified impact summaries, delay percentages, cumulative vehicle-hours of delay (VHD), winner recommendation rationale, and actionable Bangalore Traffic Police (BTP) mitigations.

### 4. Future Traffic and Route Estimates
- **Time controls:** Select 0, 1, 3, 6, 12, or 24 hours, or play/pause through the outlook.
- **Calculated route choices:** Plan A, Plan B, and Plan C use the selected origin, destination, road network, demand profile, and active closures.
- **Closure response:** Roads reopen at the selected closure duration, with modeled traffic recovery afterward. Junction closures affect all incident graph edges.
- **Transparency:** Traffic and travel-time values are synthetic estimates, not live traffic.

---

## 🚀 Quickstart & Installation

### Prerequisites
- Node.js (v18.0.0 or higher, tested on Node v22.14.0)
- npm (v9.0.0 or higher)

### Setup & Startup Commands

```bash
# 1. Navigate to the project directory
cd path/to/c2c

# 2. Install dependencies
npm install

# 3. Run unit tests (23 tests covering graph routing, closures, endpoint selection, and NLP)
npm test

# 4. Build production bundle to verify correctness
npm run build

# 5. Start the local development server
npm run dev
```

The application will be live at:
**`http://localhost:5173/`**

---

## 🧪 Completed Unit Test Suite

Run `npm test` to execute Vitest across 4 test suites:
- `src/tests/graphEngine.test.js`: Verifies graph adjacency, node connectivity, Dijkstra routing, and BPR link costs.
- `src/tests/closureAvoidance.test.js`: Confirms routes avoid closed roads and checks multi-road closures.
- `src/tests/strategies.test.js`: Covers all three plans, custom endpoints, junction closures, route geometry, and hourly traffic changes.
- `src/tests/assistantParser.test.js`: Tests natural-language intent extraction and planning briefs.

---

## 📁 Project Architecture

```
c2c/
├── package.json                   # Dependencies: React 18, MapLibre GL 4, Lucide React, Vitest
├── vite.config.js                 # Vite bundler configuration with React and Vitest plugins
├── index.html                     # HTML5 shell with Google Fonts & MapLibre CSS
├── src/
│   ├── main.jsx                   # React DOM root entry
│   ├── App.jsx                    # Top-level state and route-pick coordinator
│   ├── index.css                  # Dark navy glassmorphism design system & responsive styling
│   ├── config/
│   │   └── mapConfig.js           # Centralized MapLibre styles, MG Road coordinates, 3D buildings config, and OSM attribution
│   ├── data/
│   │   ├── bengaluruRoadGraph.js  # Connected road graph with 22 nodes, 28 edges, coordinates & capacities
│   │   ├── facilities.js          # Healthcare, transit & civic infrastructure (Bowring Hospital, Metro, etc.)
│   │   └── scenarioPresets.js     # Urban planning scenario presets
│   ├── simulation/
│   │   ├── graphEngine.js         # Adjacency list, Dijkstra algorithm, BPR functions, network congestion index
│   │   ├── strategies.js          # Plan A (Basic Detour), Plan B (Balanced Flow), Plan C (Hospital Priority)
│   │   └── trafficSimulator.js    # Simulation runner, baseline vs simulated comparisons, delay deltas
│   ├── assistant/
│   │   └── planningAssistant.js   # Offline NLP parser, parameter extraction & executive briefing generator
│   ├── components/
│   │   ├── Navbar.jsx             # Top bar branding, telemetry, preset selector, simulation actions
│   │   ├── MapView.jsx            # MapLibre 3D map with interactive graph routes and road/node picks
│   │   ├── LayerControls.jsx      # Left panel: layer switches, corridor inspector & topology statistics
│   │   ├── ScenarioPanel.jsx      # Right panel: endpoints, closure targets, timeline, and strategies
│   │   ├── SimulationTimeline.jsx # Future-hour controls and playback
│   │   ├── StrategySelector.jsx   # Strategy cards (Plan A, B, C) with badges and trade-offs
│   │   ├── AssistantChat.jsx      # Conversational planning assistant with prompt presets
│   │   ├── ResultsComparison.jsx  # Retained comparison panel component; not mounted in the current app
│   │   └── AttributionModal.jsx   # Data sources, methodology, and OpenStreetMap attribution
│   └── tests/
│       ├── graphEngine.test.js
│       ├── closureAvoidance.test.js
│       ├── strategies.test.js
│       └── assistantParser.test.js
└── README.md
```

---

## ⚙️ Map Provider & Tile Details
- **Provider:** OpenFreeMap vector tiles (`https://tiles.openfreemap.org/styles/dark`) based on OpenMapTiles and OpenStreetMap data. An OpenStreetMap raster fallback style is also defined in configuration.
- **3D Buildings:** Dynamically rendered using MapLibre `fill-extrusion` with building heights.
- **Attribution:** Strictly retained on bottom-right of map and within the Help modal.

---

## 📌 Synthetic Traffic Modeling Disclaimer
All baseline vehicle counts, volume-to-capacity (V/C) ratios, detour delays, and emergency transit estimates are **synthetic estimates** produced by the deterministic TrafficTwin Graph & BPR engine for planning and scenario testing. They are not live sensor feeds or official municipal predictions.
