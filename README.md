# CityTwin — Test a City Decision Before It Happens
### Interactive 3D Digital Twin & Traffic Simulation Platform for Bengaluru Urban Planners

**CityTwin** is an advanced interactive 3D digital twin of Central Bengaluru (MG Road, Brigade Road, Residency Road, Cubbon Road, Bowring & Lady Curzon Hospital corridors). It enables municipal authorities, city planners, and event coordinators to simulate the ripple effects of major road closures, detour protocols, and emergency vehicle routing **before they happen in the physical world**.

---

## 🌟 Key Features

### 1. Real 3D Bengaluru Geographic Map
- **Location:** Centered on MG Road, Anil Kumble Circle, and the Central Business District (CBD) of Bengaluru (`[77.6074, 12.9740]`).
- **Engine:** Built with **MapLibre GL JS** using vector tile styles from **OpenFreeMap** and **OpenStreetMap** with complete 3D extruded building footprints.
- **Controls:** Smooth zoom, pan, rotate, 3D perspective pitch tilt (0° flat to 55° 3D oblique angle), camera presets (**MG Road Central**, **Bowring Hospital Corridor**, **Brigade & Residency Hub**, **Birdseye Overview**), and one-click camera reset.
- **Interactivity:** Clickable road corridors and facility markers (Bowring Hospital, Mallya Hospital, Namma Metro stations, Mayo Hall, Vidhana Soudha).
- **Layer Toggles:** Independent switches for 3D Buildings, BPR Congestion Heatmap, Road Closures, Critical Facilities, and Diversion Trajectory Flow.
- **Zero Paid APIs:** Free map style provider configured centrally in [`src/config/mapConfig.js`](file:///c:/Users/geeta%20siddappa/Downloads/c2c/src/config/mapConfig.js) with retained OpenStreetMap attribution and automatic fallback styling.

### 2. Deterministic Traffic Graph Engine & Bureau of Public Roads (BPR) Delay Modeling
- **Network Graph:** Connected graph network with 20 real Bengaluru intersections and 22 major arterial and collector corridors.
- **Graph Routing:** Deterministic Dijkstra shortest-path algorithm coupled with the standard Bureau of Public Roads (BPR) link delay function:
  $$T = T_0 \cdot \left(1 + \alpha \cdot \left(\frac{V}{C}\right)^\beta\right)$$
- **Three Mitigation Strategies:**
  - **Plan A — Basic Diversion:** Shortest feasible geometric detour avoiding closed edges. Minimizes raw detour distance.
  - **Plan B — Balanced Traffic (Recommended Default):** Capacity-aware user equilibrium that penalizes congested corridors and disperses volume across parallel northern (Cubbon Rd) and southern (Residency Rd) corridors.
  - **Plan C — Emergency Priority:** Shields designated hospital access corridors (Bowring & Lady Curzon Hospital / Mallya Hospital) from diversion overflow, preserving rapid emergency transit under 8 minutes.

### 3. AI Planning Assistant (Offline NLP Engine)
- **Natural Language Parsing:** Operates completely offline without requiring paid external AI API keys or credit cards.
- **Query Understanding:** Parses complex natural language requests (e.g. *"Close MG Road Central for 6 hours during morning peak. Minimize delays while preserving hospital access."*).
- **Auto-Execution:** Automatically extracts road target, duration, traffic demand multiplier, and strategy priority, populates scenario controls, and triggers the simulation engine.
- **Executive Intelligence Briefing:** Generates quantified impact summaries, delay percentages, cumulative vehicle-hours of delay (VHD), winner recommendation rationale, and actionable Bangalore Traffic Police (BTP) mitigations.

### 4. Decision Impact Matrix (Baseline vs. Simulated)
- **Side-by-Side KPIs:** Corridor traversal time, Delay delta (+min / +%), CBD Congestion Score (0–100 index), Emergency Hospital ETA, and Cumulative Delay Hours.
- **Strategy Comparison Table:** Comparative evaluation of Plan A, Plan B, and Plan C side-by-side.
- **Bottleneck Radar:** Real-time detection of saturated road segments exceeding 85% capacity.
- **Transparency:** Prominently labeled with mandatory disclosure: *"Synthetic simulated estimates, not live traffic or real-world predictions."*

---

## 🚀 Quickstart & Installation

### Prerequisites
- Node.js (v18.0.0 or higher, tested on Node v22.14.0)
- npm (v9.0.0 or higher)

### Setup & Startup Commands

```bash
# 1. Clone or navigate to the workspace directory
cd "c:\Users\geeta siddappa\Downloads\c2c"

# 2. Install dependencies
npm install

# 3. Run unit tests (14 tests covering graph connectivity, Dijkstra, closure avoidance, and NLP)
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

Run `npm test` to execute Vitest across 4 comprehensive test suites:
- [`src/tests/graphEngine.test.js`](file:///c:/Users/geeta%20siddappa/Downloads/c2c/src/tests/graphEngine.test.js): Verifies graph adjacency, node connectivity, Dijkstra shortest path finding, and BPR link cost calculations.
- [`src/tests/closureAvoidance.test.js`](file:///c:/Users/geeta%20siddappa/Downloads/c2c/src/tests/closureAvoidance.test.js): Confirms that detours strictly avoid closed road segments and verifies multi-closure handling.
- [`src/tests/strategies.test.js`](file:///c:/Users/geeta%20siddappa/Downloads/c2c/src/tests/strategies.test.js): Validates Plan A, Plan B, and Plan C routing logic, ambulance travel times, and baseline vs. simulated metrics.
- [`src/tests/assistantParser.test.js`](file:///c:/Users/geeta%20siddappa/Downloads/c2c/src/tests/assistantParser.test.js): Tests natural language intent extraction and briefing generation.

---

## 📁 Project Architecture

```
c2c/
├── package.json                   # Dependencies: React 18, MapLibre GL 4, Lucide React, Vitest
├── vite.config.js                 # Vite bundler configuration with React and Vitest plugins
├── index.html                     # HTML5 shell with Google Fonts & MapLibre CSS
├── src/
│   ├── main.jsx                   # React DOM root entry
│   ├── App.jsx                    # Top-level state coordinator
│   ├── index.css                  # Dark navy glassmorphism design system & responsive styling
│   ├── config/
│   │   └── mapConfig.js           # Centralized MapLibre styles, MG Road coordinates, 3D buildings config, and OSM attribution
│   ├── data/
│   │   ├── bengaluruRoadGraph.js  # Connected road graph with 20 nodes, 22 corridors, coordinates & capacities
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
│   │   ├── MapView.jsx            # Real MapLibre 3D interactive map with 3D buildings, dynamic routes, and popups
│   │   ├── LayerControls.jsx      # Left panel: layer switches, corridor inspector & topology statistics
│   │   ├── ScenarioPanel.jsx      # Right panel: closures, duration, demand levels, and strategy switcher
│   │   ├── StrategySelector.jsx   # Strategy cards (Plan A, B, C) with badges and trade-offs
│   │   ├── AssistantChat.jsx      # Conversational planning assistant with prompt presets
│   │   ├── ResultsComparison.jsx  # Bottom panel: KPI cards, strategy comparison table, bottleneck radar
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
- **Provider:** OpenFreeMap vector tiles (`https://tiles.openfreemap.org/styles/dark`) based on OpenMapTiles and OpenStreetMap data.
- **3D Buildings:** Dynamically rendered using MapLibre `fill-extrusion` with building heights.
- **Network Resilience:** Fallback to CARTO Dark Matter raster tiles if vector tile network issues arise.
- **Attribution:** Strictly retained on bottom-right of map and within the Help modal.

---

## 📌 Synthetic Traffic Modeling Disclaimer
All baseline vehicle counts, volume-to-capacity (V/C) ratios, detour delays, and emergency transit estimates are **synthetic simulated estimates** produced by the deterministic CityTwin Graph & BPR engine for planning and scenario testing. They are not live sensor feeds or official municipal predictions.
"# c2c" 
