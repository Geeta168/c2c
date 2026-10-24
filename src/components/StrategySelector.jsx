import React from 'react';
import { Compass, Scale, HeartPulse, Check, Sparkles } from 'lucide-react';
import { STRATEGY_DEFINITIONS } from '../simulation/strategies';

export function StrategySelector({
  selectedStrategy,
  onSelectStrategy,
  comparisonMetrics,
  recommendedWinner
}) {
  const getIcon = (iconName) => {
    switch (iconName) {
      case 'Compass':
        return <Compass size={18} />;
      case 'Scale':
        return <Scale size={18} />;
      case 'HeartPulse':
        return <HeartPulse size={18} />;
      default:
        return <Compass size={18} />;
    }
  };

  return (
    <div className="strategy-cards-container">
      {Object.values(STRATEGY_DEFINITIONS).map((strat) => {
        const isSelected = selectedStrategy === strat.id;
        const isWinner = recommendedWinner === strat.id;
        const metrics = comparisonMetrics?.[strat.id];

        let selectedClass = "";
        if (isSelected) {
          if (strat.id === "plan_a") selectedClass = "selected plan-a-active";
          else if (strat.id === "plan_b") selectedClass = "selected";
          else if (strat.id === "plan_c") selectedClass = "selected plan-c-active";
        }

        return (
          <div
            key={strat.id}
            className={`strategy-card ${selectedClass}`}
            onClick={() => onSelectStrategy(strat.id)}
          >
            <div className="strategy-card-header">
              <div className="strategy-card-title">
                <span style={{ color: strat.color }}>{getIcon(strat.icon)}</span>
                <span>{strat.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isWinner && (
                  <span
                    className="strategy-badge"
                    style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid #10b981' }}
                  >
                    ★ Recommended
                  </span>
                )}
                <span
                  className="strategy-badge"
                  style={{
                    background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    color: isSelected ? '#38bdf8' : '#94a3b8'
                  }}
                >
                  {strat.tagline}
                </span>
              </div>
            </div>

            <p className="strategy-card-desc">{strat.description}</p>

            {metrics && (
              <div className="strategy-metrics-mini">
                <div>
                  Time: <strong style={{ color: '#f1f5f9' }}>{metrics.simulatedTravelTime}m</strong>
                </div>
                <div>
                  Delay: <strong style={{ color: metrics.delayDelta > 3 ? '#ff3b57' : '#10b981' }}>
                    +{metrics.delayDelta}m
                  </strong>
                </div>
                <div>
                  Congestion: <strong style={{ color: '#f59e0b' }}>{metrics.congestionScore}/100</strong>
                </div>
                {strat.id === "plan_c" && (
                  <div>
                    Hospital: <strong style={{ color: '#f43f5e' }}>{metrics.hospitalEta}m</strong>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
