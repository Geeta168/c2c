import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  BarChart3,
  Clock,
  Flame,
  Hospital,
  AlertTriangle,
  Award,
  ArrowUpRight,
  TrendingDown,
  Layers
} from 'lucide-react';

function formatDelta(value, suffix = '') {
  if (value > 0) return `+${value}${suffix}`;
  if (value < 0) return `−${Math.abs(value)}${suffix}`;
  return `0${suffix}`;
}

export function ResultsComparison({ simulationResults }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!simulationResults) return null;

  const { baseline, simulated, scenario, strategyComparison, recommendation } = simulationResults;
  const timeline = simulationResults.timeline || [];
  const chartSeries = [
    { key: 'baselineTravelTime', label: 'Baseline', color: '#94a3b8' },
    { key: 'plan_a', label: 'Plan A', color: '#38bdf8' },
    { key: 'plan_b', label: 'Plan B', color: '#10b981' },
    { key: 'plan_c', label: 'Plan C', color: '#f43f5e' }
  ];
  const chartValues = timeline.flatMap((point) => chartSeries.map((series) => point[series.key]));
  const chartMin = Math.min(...chartValues);
  const chartRange = Math.max(1, Math.max(...chartValues) - chartMin);
  const selectedPoint = timeline.findIndex((point) => point.hour === scenario.timelineHour);
  const chartPoints = (key) => timeline.map((point, index) => {
    const x = timeline.length > 1 ? 30 + (index * 320) / (timeline.length - 1) : 190;
    const y = 78 - ((point[key] - chartMin) / chartRange) * 58;
    return `${x},${y}`;
  }).join(' ');

  return (
    <section className={`bottom-panel ${!isExpanded ? 'collapsed' : ''}`}>
      {/* Header bar */}
      <div className="bottom-panel-header">
        <div className="bottom-panel-title-area">
          <div className="bottom-panel-title">
            <BarChart3 size={16} style={{ color: '#00f2fe' }} />
            <span>Decision Impact Matrix — Baseline vs Plan</span>
          </div>

          <div className="disclaimer-pill">
            SYNTHETIC ESTIMATES — NOT LIVE TRAFFIC
          </div>

          <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
            <strong style={{ color: scenario.closureActive ? '#ff3b57' : '#10b981' }}>
              {scenario.closureActive ? 'Closure active' : 'Road reopened'}
            </strong>
            {' · '}{scenario.closedTargetName || scenario.closedEdge.name} · {scenario.durationHours}h planned · +{scenario.timelineHour}h
          </span>
        </div>

        <button
          className="btn-secondary"
          style={{ padding: '4px 10px', fontSize: '0.72rem' }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>{isExpanded ? "Collapse Metrics" : "Expand Metrics"}</span>
          {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {/* Body Grid */}
      {isExpanded && (
        <div className="bottom-panel-body">
          {/* Column 1: Core Comparative KPI Stat Cards */}
          <div className="kpi-cards-grid">
            {/* Travel Time */}
            <div className="kpi-card">
              <div className="kpi-label">Corridor Travel Time</div>
              <div className="kpi-value-row">
                <span className="kpi-main-num">{simulated.travelTimeMinutes}</span>
                <span className="kpi-unit">min</span>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  (Base: {baseline.travelTimeMinutes}m)
                </span>
              </div>
              <div className={`kpi-delta-tag ${simulated.delayDeltaMinutes > 0 ? 'delta-danger' : 'delta-success'}`}>
                <ArrowUpRight size={12} />
                <span>{formatDelta(simulated.delayDeltaMinutes, ' min')} ({formatDelta(simulated.delayPercentage, '%')})</span>
              </div>
            </div>

            {/* Congestion Index */}
            <div className="kpi-card">
              <div className="kpi-label">CBD Congestion Score</div>
              <div className="kpi-value-row">
                <span className="kpi-main-num" style={{ color: '#f59e0b' }}>
                  {simulated.congestionScore}
                </span>
                <span className="kpi-unit">/100</span>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  (Base: {baseline.congestionScore})
                </span>
              </div>
              <div className="kpi-delta-tag delta-danger">
                <span>{formatDelta(simulated.congestionScore - baseline.congestionScore, ' pts')} pressure</span>
              </div>
            </div>

            {/* Hospital Accessibility */}
            <div className="kpi-card">
              <div className="kpi-label">Bowring Hospital ETA</div>
              <div className="kpi-value-row">
                <span className="kpi-main-num" style={{ color: '#f43f5e' }}>
                  {simulated.hospitalTimeMinutes}
                </span>
                <span className="kpi-unit">min</span>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  (Base: {baseline.hospitalTimeMinutes}m)
                </span>
              </div>
              <div
                className={`kpi-delta-tag ${simulated.hospitalDeltaMinutes <= 1.0 ? 'delta-success' : 'delta-danger'}`}
              >
                <span>{simulated.hospitalStatus}</span>
              </div>
            </div>

            {/* Cumulative Delay */}
            <div className="kpi-card">
              <div className="kpi-label">Cumulative Delay Hours</div>
              <div className="kpi-value-row">
                <span className="kpi-main-num" style={{ color: '#38bdf8' }}>
                  {simulated.cumulativeDelayHours.toLocaleString()}
                </span>
                <span className="kpi-unit">hrs</span>
              </div>
              <div style={{ fontSize: '0.67rem', color: '#64748b', marginTop: '4px' }}>
                Across {scenario.totalVehiclesAffected.toLocaleString()} affected trips
              </div>
            </div>
          </div>

          {/* Column 2: Strategy Side-by-Side Comparison Table */}
          <div className="strategy-table-container">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Strategy Plan</th>
                  <th>Detour Time</th>
                  <th>Delay Delta</th>
                  <th>Congestion</th>
                  <th>Hospital ETA</th>
                  <th>Evaluation</th>
                </tr>
              </thead>
              <tbody>
                {/* Plan A */}
                <tr className={recommendation.winner === 'plan_a' ? 'highlight-winner' : ''}>
                  <td>
                    <strong style={{ color: '#38bdf8' }}>Plan A</strong> — Basic Detour
                  </td>
                  <td>{strategyComparison.plan_a.simulatedTravelTime} min</td>
                  <td style={{ color: '#ff3b57' }}>{formatDelta(strategyComparison.plan_a.delayDelta, 'm')}</td>
                  <td>{strategyComparison.plan_a.congestionScore}/100</td>
                  <td>{strategyComparison.plan_a.hospitalEta} min</td>
                  <td>
                    {recommendation.winner === 'plan_a' ? (
                      <span style={{ color: '#34d399', fontWeight: 700 }}>★ Best Detour</span>
                    ) : (
                      <span style={{ color: '#64748b' }}>Saturates Brigade</span>
                    )}
                  </td>
                </tr>

                {/* Plan B */}
                <tr className={recommendation.winner === 'plan_b' ? 'highlight-winner' : ''}>
                  <td>
                    <strong style={{ color: '#10b981' }}>Plan B</strong> — Balanced Flow
                  </td>
                  <td>{strategyComparison.plan_b.simulatedTravelTime} min</td>
                  <td style={{ color: '#10b981' }}>{formatDelta(strategyComparison.plan_b.delayDelta, 'm')}</td>
                  <td>{strategyComparison.plan_b.congestionScore}/100</td>
                  <td>{strategyComparison.plan_b.hospitalEta} min</td>
                  <td>
                    {recommendation.winner === 'plan_b' ? (
                      <span style={{ color: '#34d399', fontWeight: 700 }}>★ Recommended</span>
                    ) : (
                      <span>Balanced</span>
                    )}
                  </td>
                </tr>

                {/* Plan C */}
                <tr className={recommendation.winner === 'plan_c' ? 'highlight-winner' : ''}>
                  <td>
                    <strong style={{ color: '#f43f5e' }}>Plan C</strong> — Hospital Priority
                  </td>
                  <td>{strategyComparison.plan_c.simulatedTravelTime} min</td>
                  <td>{formatDelta(strategyComparison.plan_c.delayDelta, 'm')}</td>
                  <td>{strategyComparison.plan_c.congestionScore}/100</td>
                  <td style={{ color: '#f43f5e', fontWeight: 700 }}>
                    {strategyComparison.plan_c.hospitalEta} min
                  </td>
                  <td>
                    {recommendation.winner === 'plan_c' ? (
                      <span style={{ color: '#34d399', fontWeight: 700 }}>★ Hospital Protected</span>
                    ) : (
                      <span style={{ color: '#34d399' }}>Fastest Med Transit</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Recommendation Reasoning Banner */}
            <div
              style={{
                padding: '8px 12px',
                background: 'rgba(16, 185, 129, 0.08)',
                borderTop: '1px solid rgba(16, 185, 129, 0.2)',
                fontSize: '0.72rem',
                color: '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Award size={15} style={{ color: '#10b981', flexShrink: 0 }} />
              <span>
                <strong>System Recommendation:</strong> {recommendation.reason}
              </span>
            </div>

            <div className="future-chart" aria-label={`Synthetic travel-time estimates at ${scenario.timelineHour} hours`}>
              <div className="future-chart-heading">
                <strong>Travel-time outlook</strong>
                <span>min · synthetic estimates</span>
              </div>
              <svg viewBox="0 0 380 112" role="img" aria-label="Baseline and plan travel times across the traffic timeline">
                {[24, 53, 82].map((y) => <line key={y} x1="30" y1={y} x2="350" y2={y} className="future-chart-gridline" />)}
                {selectedPoint >= 0 && timeline[selectedPoint] && (
                  <line
                    x1={timeline.length > 1 ? 30 + (selectedPoint * 320) / (timeline.length - 1) : 190}
                    y1="16"
                    x2={timeline.length > 1 ? 30 + (selectedPoint * 320) / (timeline.length - 1) : 190}
                    y2="88"
                    className="future-chart-selection"
                  />
                )}
                {chartSeries.map((series) => (
                  <g key={series.key}>
                    <polyline points={chartPoints(series.key)} fill="none" stroke={series.color} strokeWidth="2.5" />
                    {timeline.map((point, index) => {
                      const x = timeline.length > 1 ? 30 + (index * 320) / (timeline.length - 1) : 190;
                      const y = 78 - ((point[series.key] - chartMin) / chartRange) * 58;
                      return <circle key={`${series.key}-${point.hour}`} cx={x} cy={y} r="2.5" fill={series.color} />;
                    })}
                  </g>
                ))}
                {timeline.map((point, index) => {
                  const x = timeline.length > 1 ? 30 + (index * 320) / (timeline.length - 1) : 190;
                  return <text key={point.hour} x={x} y="104" textAnchor="middle" className="future-chart-label">{point.hour}h</text>;
                })}
              </svg>
              <div className="future-chart-legend">
                {chartSeries.map((series) => (
                  <span key={series.key}><i style={{ background: series.color }} />{series.label}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Column 3: Bottlenecks & Critical Warnings */}
          <div className="bottlenecks-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#f1f5f9', textTransform: 'uppercase' }}>
                Bottleneck Radar
              </span>
              <span style={{ fontSize: '0.68rem', color: '#ff3b57', fontWeight: 600 }}>
                {simulated.bottlenecks.length} Saturated Links
              </span>
            </div>

            <div className="bottleneck-list">
              {simulated.bottlenecks.length === 0 ? (
                <div style={{ fontSize: '0.72rem', color: '#10b981', padding: '12px 0', textAlign: 'center' }}>
                  No severe bottlenecks detected. Flows are within normal threshold.
                </div>
              ) : (
                simulated.bottlenecks.slice(0, 3).map((bn) => (
                  <div key={bn.edgeId} className="bottleneck-row">
                    <div>
                      <div style={{ color: '#f1f5f9', fontWeight: 600 }}>{bn.name}</div>
                      <div style={{ color: '#64748b', fontSize: '0.65rem' }}>Travel: {bn.travelTime}m</div>
                    </div>
                    <span style={{ color: '#ff3b57', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {(bn.vcRatio * 100).toFixed(0)}% V/C
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
