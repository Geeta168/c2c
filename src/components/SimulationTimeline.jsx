import React, { useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { SIMULATION_HOURS } from '../simulation/trafficSimulator';

export function SimulationTimeline({ selectedHour, onSelectHour, closureActive, recoveryFactor }) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return undefined;
    const currentIndex = SIMULATION_HOURS.indexOf(selectedHour);
    if (currentIndex >= SIMULATION_HOURS.length - 1) {
      setIsPlaying(false);
      return undefined;
    }
    const timer = window.setTimeout(() => onSelectHour(SIMULATION_HOURS[currentIndex + 1]), 1400);
    return () => window.clearTimeout(timer);
  }, [isPlaying, onSelectHour, selectedHour]);

  const status = closureActive
    ? 'Closure active'
    : recoveryFactor > 0.05
      ? `Road reopened · ${Math.round(recoveryFactor * 100)}% recovery load`
      : 'Road open';

  return (
    <section className="simulation-timeline" aria-label="Future traffic outlook">
      <div className="simulation-timeline-heading">
        <div>
          <strong>Future traffic</strong>
          <span className="simulation-timeline-status">{status}</span>
        </div>
        <span className="simulation-timeline-disclaimer">Synthetic estimates</span>
      </div>
      <div className="simulation-timeline-controls">
        <div className="simulation-time-options" role="group" aria-label="Select time horizon">
          {SIMULATION_HOURS.map((hour) => (
            <button
              key={hour}
              type="button"
              className={`simulation-time-btn ${selectedHour === hour ? 'active' : ''}`}
              aria-pressed={selectedHour === hour}
              onClick={() => onSelectHour(hour)}
            >
              {hour}h
            </button>
          ))}
        </div>
        <button
          type="button"
          className="simulation-play-btn"
          aria-label={isPlaying ? 'Pause timeline' : 'Play timeline'}
          title={isPlaying ? 'Pause' : 'Play'}
          onClick={() => setIsPlaying((playing) => !playing)}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
      </div>
    </section>
  );
}
