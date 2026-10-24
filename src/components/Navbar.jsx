import React from 'react';
import {
  Activity,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  Info,
  MapPin,
  ChevronDown
} from 'lucide-react';
import { SCENARIO_PRESETS } from '../data/scenarioPresets';

export function Navbar({
  scenarioParams,
  onUpdateScenario,
  onRunSimulation,
  onResetSimulation,
  activePresetId,
  onSelectPreset,
  isSimulating,
  onToggleHelpModal
}) {
  return (
    <header className="navbar">
      {/* Brand & Identity */}
      <div className="brand-section">
        <div className="brand-logo-icon">
          <Activity size={20} />
        </div>
        <div className="brand-text-container">
          <div className="brand-title">CityTwin</div>
          <div className="brand-subtitle">Bengaluru Urban Decision Twin</div>
        </div>
      </div>

      {/* Center Telemetry & Preset Picker */}
      <div className="navbar-center-telemetry">
        <div className="status-badge">
          <span className="status-pulse-dot" />
          <span>SIMULATION ENGINE READY</span>
        </div>

        {/* Preset Selector */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <select
            className="form-select"
            style={{
              padding: '5px 28px 5px 12px',
              fontSize: '0.74rem',
              height: '32px',
              background: 'rgba(11, 19, 38, 0.85)',
              borderColor: 'rgba(56, 189, 248, 0.25)',
              color: '#38bdf8',
              fontWeight: '600'
            }}
            value={activePresetId || ''}
            onChange={(e) => onSelectPreset(e.target.value)}
          >
            <option value="" disabled>Select Preset Scenario...</option>
            {SCENARIO_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.badge}: {preset.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            style={{
              position: 'absolute',
              right: '10px',
              pointerEvents: 'none',
              color: '#38bdf8'
            }}
          />
        </div>

        <div className="telemetry-chip">
          <MapPin size={12} style={{ color: '#00f2fe' }} />
          <span>CBD MG Road:</span>
          <span className="highlight">20 Nodes / 22 Corridors</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="navbar-actions">
        <button
          className="btn-secondary"
          onClick={onResetSimulation}
          title="Reset to default baseline state"
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>

        <button
          className="btn-primary"
          onClick={onRunSimulation}
          disabled={isSimulating}
          title="Recalculate network routing and BPR traffic congestion"
        >
          <Play size={14} fill="#030a1c" />
          <span>{isSimulating ? "Simulating..." : "Run Simulation"}</span>
        </button>

        <button
          className="btn-secondary"
          style={{ padding: '7px 10px' }}
          onClick={onToggleHelpModal}
          title="Attribution & Methodology Information"
        >
          <Info size={15} />
        </button>
      </div>
    </header>
  );
}
