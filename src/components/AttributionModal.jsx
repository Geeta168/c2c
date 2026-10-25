import React from 'react';
import { X, ShieldCheck, MapPin, Database, Award, Info } from 'lucide-react';
import { MAP_CONFIG } from '../config/mapConfig';

export function AttributionModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.8)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-glass-heavy)',
          border: '1px solid var(--border-glow)',
          borderRadius: '12px',
          maxWidth: '560px',
          width: '100%',
          padding: '24px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={20} style={{ color: '#00f2fe' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f1f5f9' }}>
              TrafficTwin Bengaluru — Architecture & Attribution
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5 }}>
          <div>
            <strong style={{ color: '#38bdf8' }}>1. Real Geographic Map Provider:</strong>
            <p style={{ marginTop: '4px', color: '#94a3b8' }}>
              Built using <strong>MapLibre GL JS</strong> with vector tile styles from <strong>OpenFreeMap</strong> and <strong>OpenStreetMap</strong> contributors. Extruded 3D buildings are dynamically rendered based on actual building footprints and heights in Central Bengaluru.
            </p>
          </div>

          <div>
            <strong style={{ color: '#10b981' }}>2. Deterministic Traffic Engine & Routing:</strong>
            <p style={{ marginTop: '4px', color: '#94a3b8' }}>
              Utilizes a connected graph network centered on MG Road CBD with exact GPS coordinates. Detours and travel costs are calculated using <strong>Dijkstra’s shortest-path algorithm</strong> coupled with standard <strong>Bureau of Public Roads (BPR) link delay functions</strong>.
            </p>
          </div>

          <div>
            <strong style={{ color: '#f59e0b' }}>3. Synthetic Modeling Transparency:</strong>
            <p style={{ marginTop: '4px', color: '#94a3b8' }}>
              Baseline traffic volumes, volume-to-capacity (V/C) ratios, and traffic outputs are <em>synthetic estimates</em> for urban planning exercises, not live sensor traffic or official municipal forecasts.
            </p>
          </div>

          <div>
            <strong style={{ color: '#a855f7' }}>4. Offline AI Planning Assistant:</strong>
            <p style={{ marginTop: '4px', color: '#94a3b8' }}>
              Runs a deterministic client-side natural-language parser for instantaneous entity and scenario parameter extraction. Requires zero paid API keys, external credentials, or mandatory databases.
            </p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
            Attribution: {MAP_CONFIG.attribution}
          </span>
          <button className="btn-primary" onClick={onClose} style={{ padding: '6px 16px' }}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
