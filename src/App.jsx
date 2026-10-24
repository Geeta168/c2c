import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sliders,
  Sparkles,
  Layers,
  Activity,
  AlertTriangle,
  Compass,
  CheckCircle2,
  Car
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { MapView } from './components/MapView';
import { LayerControls } from './components/LayerControls';
import { ScenarioPanel } from './components/ScenarioPanel';
import { AssistantChat } from './components/AssistantChat';
import { ResultsComparison } from './components/ResultsComparison';
import { AttributionModal } from './components/AttributionModal';
import { runCityTwinSimulation } from './simulation/trafficSimulator';
import { getIncidentEdgeIds } from './simulation/graphEngine';
import { SCENARIO_PRESETS } from './data/scenarioPresets';

export function App() {
  // Scenario Parameters
  const [scenarioParams, setScenarioParams] = useState({
    closedEdgeId: "edge_mg_central", // Default predefined demo closure
    closureTargetType: "road",
    closedNodeId: null,
    durationHours: 6,
    demandLevel: "high",
    timeOfDay: "peak_morning",
    selectedStrategy: "plan_b",
    originNodeId: "n_kumble_circle",
    destinationNodeId: "n_trinity_circle",
    hospitalNodeId: "n_bowring_hospital",
    timelineHour: 0
  });

  const [activePresetId, setActivePresetId] = useState("preset_mg_central_overhaul");
  const [activeRightTab, setActiveRightTab] = useState("scenario"); // 'scenario' | 'assistant'
  const [selectedRoadId, setSelectedRoadId] = useState("edge_mg_central");
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [mapSelectionMode, setMapSelectionMode] = useState(null);
  const simulationTimeoutRef = useRef(null);

  // Layer Toggles
  const [layerToggles, setLayerToggles] = useState({
    buildings3D: true,
    trafficCongestion: true,
    roadClosures: true,
    facilities: true,
    activeRoutes: true
  });

  // Simulation Results state
  const [simulationResults, setSimulationResults] = useState(() => {
    return runCityTwinSimulation(scenarioParams);
  });

  // Recalculate simulation whenever relevant scenario parameters change
  const executeSimulation = useCallback((paramsToRun) => {
    window.clearTimeout(simulationTimeoutRef.current);
    setIsSimulating(true);
    simulationTimeoutRef.current = window.setTimeout(() => {
      const results = runCityTwinSimulation(paramsToRun);
      setSimulationResults(results);
      setIsSimulating(false);
    }, 180);
  }, []);

  useEffect(() => () => window.clearTimeout(simulationTimeoutRef.current), []);

  // Update scenario helper
  const handleUpdateScenario = (partialUpdate) => {
    const updated = { ...scenarioParams, ...partialUpdate };
    if (partialUpdate.closureTargetType === 'road' ||
      ('closedEdgeId' in partialUpdate && !('closedNodeId' in partialUpdate))) {
      updated.closureTargetType = 'road';
      updated.closedNodeId = null;
    }
    if (partialUpdate.closedNodeId) {
      const incidentEdgeId = [...getIncidentEdgeIds(partialUpdate.closedNodeId)][0];
      updated.closureTargetType = 'intersection';
      updated.closedEdgeId = incidentEdgeId || updated.closedEdgeId;
    }
    setScenarioParams(updated);
    setActivePresetId(null);
    if (partialUpdate.closedEdgeId || partialUpdate.closedNodeId) {
      setSelectedRoadId(partialUpdate.closedEdgeId);
      if (partialUpdate.closedNodeId) {
        setSelectedRoadId([...getIncidentEdgeIds(partialUpdate.closedNodeId)][0] || selectedRoadId);
      }
    }
    executeSimulation(updated);
  };

  // Run simulation button handler
  const handleRunSimulation = () => {
    executeSimulation(scenarioParams);
  };

  // Reset to default baseline demo state
  const handleResetSimulation = () => {
    const defaultParams = {
      closedEdgeId: "edge_mg_central",
      closureTargetType: "road",
      closedNodeId: null,
      durationHours: 6,
      demandLevel: "high",
      timeOfDay: "peak_morning",
      selectedStrategy: "plan_b",
      originNodeId: "n_kumble_circle",
      destinationNodeId: "n_trinity_circle",
      hospitalNodeId: "n_bowring_hospital",
      timelineHour: 0
    };
    setScenarioParams(defaultParams);
    setActivePresetId("preset_mg_central_overhaul");
    setSelectedRoadId("edge_mg_central");
    executeSimulation(defaultParams);
  };

  // Load a preset scenario
  const handleSelectPreset = (presetId) => {
    const preset = SCENARIO_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setActivePresetId(preset.id);
    const updated = {
      ...scenarioParams,
      closedEdgeId: preset.closedEdgeId,
      closureTargetType: "road",
      closedNodeId: null,
      durationHours: preset.durationHours,
      demandLevel: preset.demandLevel,
      timeOfDay: preset.timeOfDay,
      selectedStrategy: preset.recommendedPlan,
      timelineHour: 0,
      originNodeId: preset.originNodeId || scenarioParams.originNodeId,
      destinationNodeId: preset.destinationNodeId || scenarioParams.destinationNodeId,
      hospitalNodeId: preset.hospitalNodeId || scenarioParams.hospitalNodeId
    };
    setScenarioParams(updated);
    setSelectedRoadId(preset.closedEdgeId);
    executeSimulation(updated);
  };

  // Layer toggle handler
  const handleToggleLayer = (layerKey) => {
    setLayerToggles((prev) => ({
      ...prev,
      [layerKey]: !prev[layerKey]
    }));
  };

  // Handle Assistant applying a scenario
  const handleApplyAssistantScenario = (newParams) => {
    const updated = {
      ...newParams,
      closureTargetType: 'road',
      closedNodeId: null,
      timelineHour: scenarioParams.timelineHour
    };
    setScenarioParams(updated);
    setSelectedRoadId(updated.closedEdgeId);
    executeSimulation(updated);
  };

  // Handle road clicked on map
  const handleSelectRoad = (roadId) => {
    setSelectedRoadId(roadId);
    if (mapSelectionMode === 'closure-road') {
      handleUpdateScenario({ closedEdgeId: roadId, closedNodeId: null, closureTargetType: 'road' });
      setMapSelectionMode(null);
    }
  };

  const handleSelectMapPoint = (mode, nodeId) => {
    if (mode === 'origin') handleUpdateScenario({ originNodeId: nodeId });
    if (mode === 'destination') handleUpdateScenario({ destinationNodeId: nodeId });
    if (mode === 'closure-intersection') {
      handleUpdateScenario({ closedNodeId: nodeId, closureTargetType: 'intersection' });
    }
    setMapSelectionMode(null);
  };

  const handleSetMapSelectionMode = (mode) => {
    setMapSelectionMode((current) => current === mode ? null : mode);
  };

  // Handle facility clicked on map
  const handleSelectFacility = (fac) => {
    setSelectedFacility(fac);
  };

  return (
    <div className="app-container">
      {/* 1. Top Navigation & Global Branding */}
      <Navbar
        scenarioParams={scenarioParams}
        onUpdateScenario={handleUpdateScenario}
        onRunSimulation={handleRunSimulation}
        onResetSimulation={handleResetSimulation}
        activePresetId={activePresetId}
        onSelectPreset={handleSelectPreset}
        isSimulating={isSimulating}
        onToggleHelpModal={() => setIsHelpModalOpen(true)}
      />

      {/* 2. Main Central Workspace */}
      <main className="dashboard-workspace">
        {/* Left Sidebar: Layers, Corridors & Inspector */}
        <LayerControls
          layerToggles={layerToggles}
          onToggleLayer={handleToggleLayer}
          selectedRoadId={selectedRoadId}
          onSelectRoad={handleSelectRoad}
          simulationResults={simulationResults}
        />

        {/* Center: Dominant Real 3D Bengaluru Map */}
        <MapView
          simulationResults={simulationResults}
          scenarioParams={scenarioParams}
          layerToggles={layerToggles}
          selectedRoadId={selectedRoadId}
          onSelectRoad={handleSelectRoad}
          onSelectFacility={handleSelectFacility}
          mapSelectionMode={mapSelectionMode}
          onSelectMapPoint={handleSelectMapPoint}
        />

        {/* Right Sidebar: Scenario Settings & AI Planning Assistant */}
        <aside className="sidebar-right">
          {/* Tab Headers */}
          <div className="tabs-header">
            <button
              className={`tab-btn ${activeRightTab === 'scenario' ? 'active' : ''}`}
              onClick={() => setActiveRightTab('scenario')}
            >
              <Sliders size={14} />
              <span>Scenario Studio</span>
            </button>
            <button
              className={`tab-btn ${activeRightTab === 'assistant' ? 'active' : ''}`}
              onClick={() => setActiveRightTab('assistant')}
            >
              <Sparkles size={14} style={{ color: '#00f2fe' }} />
              <span>AI Assistant</span>
            </button>
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {activeRightTab === 'scenario' ? (
              <ScenarioPanel
                scenarioParams={scenarioParams}
                onUpdateScenario={handleUpdateScenario}
                onRunSimulation={handleRunSimulation}
                isSimulating={isSimulating}
                simulationResults={simulationResults}
                mapSelectionMode={mapSelectionMode}
                onSelectMapMode={handleSetMapSelectionMode}
              />
            ) : (
              <AssistantChat
                onApplyAssistantScenario={handleApplyAssistantScenario}
                currentScenarioParams={scenarioParams}
                simulationResults={simulationResults}
              />
            )}
          </div>
        </aside>
      </main>

      {/* 3. Bottom Panel: Baseline vs Simulated Results Comparison */}
      <ResultsComparison simulationResults={simulationResults} />

      {/* 4. Methodology & Attribution Modal */}
      <AttributionModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
}
