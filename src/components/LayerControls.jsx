import React from 'react';
import {
  Layers,
  Building2,
  AlertOctagon,
  Flame,
  Hospital,
  Route,
  Activity,
  Eye,
  CheckCircle2,
  Info
} from 'lucide-react';
import { BENGALURU_EDGES, getEdgeById } from '../data/bengaluruRoadGraph';

export function LayerControls({
  layerToggles,
  onToggleLayer,
  selectedRoadId,
  onSelectRoad,
  simulationResults
}) {
  const selectedRoad = getEdgeById(selectedRoadId) || BENGALURU_EDGES[1]; // default to MG Road Central
  const metrics = simulationResults?.networkCongestion?.[selectedRoad.id];
  const isClosed = simulationResults?.scenario?.closureActive && (
    simulationResults?.scenario?.closedEdgeIds?.includes(selectedRoad.id) ||
    selectedRoad.id === simulationResults?.scenario?.closedEdge?.id
  );

  return (
    <aside className="sidebar-left">
      {/* 1. Map Layers & Visualization Controls */}
      <div className="sidebar-section">
        <div className="section-header">
          <div className="section-title">
            <Layers size={14} />
            <span>Map Layers & Overlays</span>
          </div>
        </div>

        <div className="layer-toggle-group">
          {/* 3D Buildings */}
          <div
            className="layer-toggle-row"
            onClick={() => onToggleLayer('buildings3D')}
          >
            <div className="layer-info">
              <div className="layer-icon-box" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                <Building2 size={16} />
              </div>
              <div>
                <div className="layer-name">3D Buildings</div>
                <div className="layer-desc">Extruded architectural height</div>
              </div>
            </div>
            <div className={`custom-switch ${layerToggles.buildings3D ? 'active' : ''}`}>
              <div className="switch-knob" />
            </div>
          </div>

          {/* Traffic Congestion Heatmap */}
          <div
            className="layer-toggle-row"
            onClick={() => onToggleLayer('trafficCongestion')}
          >
            <div className="layer-info">
              <div className="layer-icon-box" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                <Flame size={16} />
              </div>
              <div>
                <div className="layer-name">Congestion Heatmap</div>
                <div className="layer-desc">BPR volume-capacity index</div>
              </div>
            </div>
            <div className={`custom-switch ${layerToggles.trafficCongestion ? 'active' : ''}`}>
              <div className="switch-knob" />
            </div>
          </div>

          {/* Road Closures */}
          <div
            className="layer-toggle-row"
            onClick={() => onToggleLayer('roadClosures')}
          >
            <div className="layer-info">
              <div className="layer-icon-box" style={{ background: 'rgba(255, 59, 87, 0.15)', color: '#ff3b57' }}>
                <AlertOctagon size={16} />
              </div>
              <div>
                <div className="layer-name">Road Closures</div>
                <div className="layer-desc">Targeted blockades & cones</div>
              </div>
            </div>
            <div className={`custom-switch ${layerToggles.roadClosures ? 'active' : ''}`}>
              <div className="switch-knob" />
            </div>
          </div>

          {/* Critical Facilities */}
          <div
            className="layer-toggle-row"
            onClick={() => onToggleLayer('facilities')}
          >
            <div className="layer-info">
              <div className="layer-icon-box" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
                <Hospital size={16} />
              </div>
              <div>
                <div className="layer-name">Hospitals & Metro</div>
                <div className="layer-desc">Emergency transit nodes</div>
              </div>
            </div>
            <div className={`custom-switch ${layerToggles.facilities ? 'active' : ''}`}>
              <div className="switch-knob" />
            </div>
          </div>

          {/* Active Diversion Routes */}
          <div
            className="layer-toggle-row"
            onClick={() => onToggleLayer('activeRoutes')}
          >
            <div className="layer-info">
              <div className="layer-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                <Route size={16} />
              </div>
              <div>
                <div className="layer-name">Diversion Trajectory</div>
                <div className="layer-desc">Calculated route geometry</div>
              </div>
            </div>
            <div className={`custom-switch ${layerToggles.activeRoutes ? 'active' : ''}`}>
              <div className="switch-knob" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Corridor Inspector */}
      <div className="sidebar-section">
        <div className="section-header">
          <div className="section-title">
            <Activity size={14} />
            <span>Corridor Inspector</span>
          </div>
          <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Select road</span>
        </div>

        {/* Road Selector */}
        <div className="form-group">
          <select
            className="form-select"
            value={selectedRoad.id}
            onChange={(e) => onSelectRoad(e.target.value)}
          >
            {BENGALURU_EDGES.map((edge) => (
              <option key={edge.id} value={edge.id}>
                {edge.name} {edge.id === simulationResults?.scenario?.closedEdge?.id ? ' [CLOSED]' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Road Card */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: `1px solid ${isClosed ? '#ff3b57' : 'var(--border-subtle)'}`,
            borderRadius: '8px',
            padding: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f1f5f9' }}>
              {selectedRoad.name}
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                background: isClosed ? 'rgba(255, 59, 87, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: isClosed ? '#ff3b57' : '#34d399'
              }}
            >
              {isClosed ? 'BLOCKED' : 'FLOWING'}
            </span>
          </div>

          <p style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.4, marginBottom: '10px' }}>
            {selectedRoad.description}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '4px' }}>
              <div style={{ color: '#64748b', fontSize: '0.65rem' }}>LENGTH</div>
              <div style={{ color: '#38bdf8', fontWeight: 600 }}>{selectedRoad.distanceKm} km</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '4px' }}>
              <div style={{ color: '#64748b', fontSize: '0.65rem' }}>DESIGN SPEED</div>
              <div style={{ color: '#38bdf8', fontWeight: 600 }}>{selectedRoad.freeFlowSpeed} km/h</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '4px' }}>
              <div style={{ color: '#64748b', fontSize: '0.65rem' }}>CAPACITY</div>
              <div style={{ color: '#f1f5f9', fontWeight: 600 }}>{selectedRoad.capacity} veh/h</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '4px' }}>
              <div style={{ color: '#64748b', fontSize: '0.65rem' }}>CURRENT LOAD</div>
              <div style={{ color: isClosed ? '#ff3b57' : '#f1f5f9', fontWeight: 600 }}>
                {isClosed ? '0 veh/h' : `${metrics ? metrics.effectiveFlow : selectedRoad.baselineTraffic} veh/h`}
              </div>
            </div>
          </div>

          {metrics && !isClosed && (
            <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '4px' }}>
                <span style={{ color: '#94a3b8' }}>V/C Congestion Saturation:</span>
                <span style={{ fontWeight: 700, color: metrics.vcRatio >= 0.85 ? '#ff3b57' : '#10b981' }}>
                  {(metrics.vcRatio * 100).toFixed(0)}%
                </span>
              </div>
              <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, metrics.vcRatio * 100)}%`,
                    background: metrics.vcRatio >= 0.85 ? '#ff3b57' : metrics.vcRatio >= 0.65 ? '#f59e0b' : '#10b981'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Central Bengaluru Network Overview */}
      <div className="sidebar-section" style={{ borderBottom: 'none' }}>
        <div className="section-header">
          <div className="section-title">
            <Info size={14} />
            <span>Digital Twin Topology</span>
          </div>
        </div>

        <div style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.45, marginBottom: '10px' }}>
          Seeded road network graph aligned with real Central Bengaluru street coordinates.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.73rem', color: '#cbd5e1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Connected Intersections:</span>
            <strong style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>20 Junctions</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Network Centerpoint:</span>
            <strong style={{ color: '#f1f5f9' }}>MG Road & Anil Kumble</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Apex Hospital Hub:</span>
            <strong style={{ color: '#f43f5e' }}>Bowring & Lady Curzon</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Parallel Arterials:</span>
            <strong style={{ color: '#10b981' }}>Cubbon & Residency Rds</strong>
          </div>
        </div>

        <div
          style={{
            marginTop: '12px',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '6px',
            padding: '8px 10px',
            fontSize: '0.67rem',
            color: '#fbbf24',
            lineHeight: 1.35
          }}
        >
          <strong>Traffic estimate notice:</strong> Traffic loads and metrics use synthetic estimates, not live traffic or real-world predictions.
        </div>
      </div>
    </aside>
  );
}
