import { describe, it, expect } from 'vitest';
import { parsePlannerQuery, processPlannerAssistantQuery } from '../assistant/planningAssistant.js';

describe('AI Planning Assistant Natural Language Parser Tests', () => {
  it('should parse the prompt benchmark query accurately', () => {
    const query = "Close a major road for six hours during peak traffic. Minimize delays while preserving hospital access.";
    const parsed = parsePlannerQuery(query);

    expect(parsed.durationHours).toBe(6);
    expect(parsed.demandLevel).toBe('high');
    expect(parsed.selectedStrategy).toBe('plan_c'); // "preserving hospital access" detects plan_c
    expect(parsed.closedEdgeId).toBeDefined();
  });

  it('should extract specific road names and custom hour durations', () => {
    const query = "Close Brigade Road for 12 hours with medium traffic for an open street festival.";
    const parsed = parsePlannerQuery(query);

    expect(parsed.closedEdgeId).toBe('edge_brigade_road');
    expect(parsed.durationHours).toBe(12);
    expect(parsed.demandLevel).toBe('medium');
  });

  it('should execute simulation and build comprehensive executive intelligence briefing', () => {
    const query = "Close MG Road Central for 6 hours during peak morning rush. What is the impact?";
    const response = processPlannerAssistantQuery(query);

    expect(response.parsed).toBeDefined();
    expect(response.results).toBeDefined();
    expect(response.briefing).toBeDefined();
    expect(response.briefing.title).toContain('MG Road Central');
    expect(response.briefing.keyFindings.length).toBeGreaterThan(2);
    expect(response.briefing.mitigations.length).toBeGreaterThan(0);
    expect(response.briefing.syntheticDisclaimer).toContain('Synthetic estimates');
  });
});
