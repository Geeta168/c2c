import React from 'react';
import {
  Sliders,
  Clock,
  Car,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { BENGALURU_EDGES, BENGALURU_NODES } from '../data/bengaluruRoadGraph';
import { TIME_OF_DAY_CONFIG, DEMAND_MULTIPLIERS } from '../simulation/trafficSimulator';
import { StrategySelector } from './StrategySelector';
import { SimulationTimeline } from './SimulationTimeline';

export function ScenarioPanel({
  scenarioParams,
  onUpdateScenario,
  onRunSimulation,
  isSimulating,
  simulationResults,
  mapSelectionMode,
  onSelectMapMode
}) {
  const durationOptions = [1, 3, 6, 12, 24];
  const demandOptions = [
    { id: 'low', label: 'Off-Peak (0.8x)' },
    { id: 'medium', label: 'Standard (1.0x)' },
    { id: 'high', label: 'Peak Rush (1.28x)' }
  ];

  const timeOfDayOptions = [
    { id: 'peak_morning', label: 'Morning Peak' },
    { id: 'midday', label: 'Midday Business' },
    { id: 'evening_rush', label: 'Evening Rush' },
    { id: 'late_night', label: 'Late Night' }
  ];
  const graphNodes = Object.values(BENGALURU_NODES);
  const junctionNodes = graphNodes.filter((node) => node.type === 'junction');
  const hospitalNodes = graphNodes.filter((node) => node.type?.includes('hospital'));
  const isRoadClosure = scenarioParams.closureTargetType !== 'intersection';

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SimulationTimeline
        selectedHour={simulationResults?.scenario?.timelineHour ?? scenarioParams.timelineHour ?? 0}
        onSelectHour={(timelineHour) => onUpdateScenario({ timelineHour })}
        closureActive={simulationResults?.scenario?.closureActive ?? true}
        recoveryFactor={simulationResults?.scenario?.recoveryFactor ?? 0}
      />

      {/* 1. Closure Target */}
      <div className="form-group">
        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle size={13} style={{ color: '#ff3b57' }} />
          <span>Closure Target</span>
        </label>
        <div className="pill-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '8px' }}>
          <button
            className={`pill-btn ${isRoadClosure ? 'active' : ''}`}
            onClick={() => onUpdateScenario({ closureTargetType: 'road', closedNodeId: null })}
          >Road</button>
          <button
            className={`pill-btn ${!isRoadClosure ? 'active' : ''}`}
            onClick={() => onUpdateScenario({ closureTargetType: 'intersection', closedNodeId: null })}
          >Intersection</button>
        </div>
        {isRoadClosure ? (
          <select
            className="form-select"
            value={scenarioParams.closedEdgeId}
            onChange={(e) => onUpdateScenario({ closureTargetType: 'road', closedNodeId: null, closedEdgeId: e.target.value })}
          >
            {BENGALURU_EDGES.map((edge) => (
              <option key={edge.id} value={edge.id}>
                {edge.name} {simulationResults?.scenario?.closureActive && simulationResults.scenario.closedEdgeIds?.includes(edge.id) ? '[CLOSED] ' : ''}({edge.distanceKm} km)
              </option>
            ))}
          </select>
        ) : (
          <select
            className="form-select"
            value={scenarioParams.closedNodeId || ''}
            onChange={(e) => onUpdateScenario({ closureTargetType: 'intersection', closedNodeId: e.target.value || null })}
          >
            <option value="">Choose an intersection</option>
            {junctionNodes.map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}
          </select>
        )}
        <button
          className={`btn-secondary map-pick-btn ${mapSelectionMode === (isRoadClosure ? 'closure-road' : 'closure-intersection') ? 'active' : ''}`}
          onClick={() => onSelectMapMode(isRoadClosure ? 'closure-road' : 'closure-intersection')}
        >
          {mapSelectionMode === (isRoadClosure ? 'closure-road' : 'closure-intersection')
            ? 'Click a graph feature on the map...'
            : isRoadClosure ? 'Pick road on map' : 'Pick intersection on map'}
        </button>
      </div>

      {/* 2. Route Points */}
      <div className="form-group">
        <label className="form-label">Route Points</label>
        <label className="form-label form-label-secondary">Origin</label>
        <select className="form-select" value={scenarioParams.originNodeId} onChange={(e) => onUpdateScenario({ originNodeId: e.target.value })}>
          {graphNodes.map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}
        </select>
        <button
          className={`btn-secondary map-pick-btn ${mapSelectionMode === 'origin' ? 'active' : ''}`}
          onClick={() => onSelectMapMode('origin')}
        >{mapSelectionMode === 'origin' ? 'Click an intersection to set origin...' : 'Pick origin on map'}</button>

        <label className="form-label form-label-secondary">Destination</label>
        <select className="form-select" value={scenarioParams.destinationNodeId} onChange={(e) => onUpdateScenario({ destinationNodeId: e.target.value })}>
          {graphNodes.map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}
        </select>
        <button
          className={`btn-secondary map-pick-btn ${mapSelectionMode === 'destination' ? 'active' : ''}`}
          onClick={() => onSelectMapMode('destination')}
        >{mapSelectionMode === 'destination' ? 'Click an intersection to set destination...' : 'Pick destination on map'}</button>

        <label className="form-label form-label-secondary">Hospital access target</label>
        <select className="form-select" value={scenarioParams.hospitalNodeId} onChange={(e) => onUpdateScenario({ hospitalNodeId: e.target.value })}>
          {hospitalNodes.map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}
        </select>
        <div className="synthetic-data-note">Selectable points use the simulated CityTwin road graph, not live map routing.</div>
      </div>

      {/* 3. Closure Duration */}
      <div className="form-group">
        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={13} style={{ color: '#00f2fe' }} />
          <span>Closure Duration (Hours)</span>
        </label>
        <div className="pill-grid">
          {durationOptions.map((h) => (
            <button
              key={h}
              className={`pill-btn ${scenarioParams.durationHours === h ? 'active' : ''}`}
              onClick={() => onUpdateScenario({ durationHours: h })}
            >
              {h} hr{h > 1 ? 's' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Traffic Demand Level */}
      <div className="form-group">
        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Car size={13} style={{ color: '#f59e0b' }} />
          <span>Traffic Demand Level</span>
        </label>
        <div className="pill-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {demandOptions.map((opt) => (
            <button
              key={opt.id}
              className={`pill-btn ${scenarioParams.demandLevel === opt.id ? 'active' : ''}`}
              onClick={() => onUpdateScenario({ demandLevel: opt.id })}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Time of Day Window */}
      <div className="form-group">
        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sliders size={13} style={{ color: '#38bdf8' }} />
          <span>Operational Time Window</span>
        </label>
        <select
          className="form-select"
          value={scenarioParams.timeOfDay}
          onChange={(e) => onUpdateScenario({ timeOfDay: e.target.value })}
        >
          {timeOfDayOptions.map((tod) => (
            <option key={tod.id} value={tod.id}>
              {tod.label} ({TIME_OF_DAY_CONFIG[tod.id]?.label})
            </option>
          ))}
        </select>
      </div>

      {/* 5. Strategy Selection */}
      <div className="form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label className="form-label" style={{ margin: 0 }}>
            <span>Traffic Mitigation Strategy</span>
          </label>
          <span style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 600 }}>
            Pick Plan A, B, or C
          </span>
        </div>
        <StrategySelector
          selectedStrategy={scenarioParams.selectedStrategy}
          onSelectStrategy={(stratId) => onUpdateScenario({ selectedStrategy: stratId })}
          comparisonMetrics={simulationResults?.strategyComparison}
          recommendedWinner={simulationResults?.recommendation?.winner}
        />
      </div>

      {/* Simulation Trigger Button */}
      <button
        className="btn-primary"
        style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: '4px' }}
        onClick={onRunSimulation}
        disabled={isSimulating}
      >
        <Play size={15} fill="#030a1c" />
        <span>{isSimulating ? "Calculating Graph & Delays..." : "Recalculate Decision Simulation"}</span>
      </button>
    </div>
  );
}
