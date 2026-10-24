import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  FileText
} from 'lucide-react';
import {
  ASSISTANT_PRESETS,
  processPlannerAssistantQuery
} from '../assistant/planningAssistant';

export function AssistantChat({
  onApplyAssistantScenario,
  currentScenarioParams,
  simulationResults
}) {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "initial-welcome",
      sender: "assistant",
      text: "CityTwin AI Planning Assistant is online. You can type natural language instructions or click any prompt template to test city decisions.",
      briefing: null
    }
  ]);

  const handleSendMessage = (textToSend) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    // 1. Add user message
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      briefing: null
    };

    // 2. Process query with deterministic offline NLP engine
    const response = processPlannerAssistantQuery(query, currentScenarioParams);

    // 3. Apply scenario parameters and run actual simulation
    onApplyAssistantScenario(response.simulationParams, response.results);

    // 4. Add assistant response
    const assistantMsg = {
      id: `assistant-${Date.now()}`,
      sender: "assistant",
      text: `Parsed your request: Closed ${response.parsed.closedEdgeName} for ${response.parsed.durationHours} hours under ${response.parsed.demandLevel.toUpperCase()} demand with ${response.parsed.selectedStrategy.toUpperCase()}.`,
      briefing: response.briefing,
      parsed: response.parsed
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInputText("");
  };

  const handlePresetClick = (presetText) => {
    handleSendMessage(presetText);
  };

  return (
    <div className="assistant-container">
      {/* Preset Prompts Tray */}
      <div className="assistant-prompts-tray">
        <div className="assistant-prompts-label">
          <Sparkles size={13} style={{ color: '#00f2fe' }} />
          <span>Quick Planning Prompts</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {ASSISTANT_PRESETS.map((preset) => (
            <div
              key={preset.id}
              className="preset-prompt-chip"
              onClick={() => handlePresetClick(preset.text)}
            >
              <strong>{preset.label}:</strong> "{preset.text}"
            </div>
          ))}
        </div>
      </div>

      {/* Messages List */}
      <div className="assistant-messages-list">
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              gap: '6px'
            }}
          >
            {/* Sender Label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.68rem', color: '#64748b' }}>
              {msg.sender === 'user' ? (
                <>
                  <span>Urban Planner</span>
                  <User size={12} />
                </>
              ) : (
                <>
                  <Bot size={12} style={{ color: '#00f2fe' }} />
                  <span>CityTwin Intelligence</span>
                </>
              )}
            </div>

            {/* Bubble Text */}
            <div
              style={{
                maxWidth: '92%',
                background: msg.sender === 'user' ? 'linear-gradient(135deg, rgba(0,242,254,0.18), rgba(2,132,199,0.25))' : 'var(--bg-card)',
                border: `1px solid ${msg.sender === 'user' ? 'rgba(56,189,248,0.4)' : 'var(--border-glass)'}`,
                borderRadius: '8px',
                padding: '9px 12px',
                fontSize: '0.78rem',
                color: msg.sender === 'user' ? '#f1f5f9' : '#cbd5e1',
                lineHeight: 1.45
              }}
            >
              {msg.text}
            </div>

            {/* Structured Executive Briefing Card if available */}
            {msg.briefing && (
              <div className="briefing-card fade-in" style={{ width: '100%', marginTop: '6px' }}>
                <div className="briefing-header">
                  <div className="briefing-title">{msg.briefing.title}</div>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(16,185,129,0.2)',
                      color: '#34d399'
                    }}
                  >
                    {msg.briefing.recommendedStrategy} RECOMMENDED
                  </span>
                </div>

                <p className="briefing-executive-summary">{msg.briefing.executiveSummary}</p>

                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Calculated Impact Metrics:
                </div>
                <ul className="findings-list">
                  {msg.briefing.keyFindings.map((finding, idx) => (
                    <li key={idx} className="finding-item">
                      <span className="finding-bullet">▪</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>

                {/* Mitigations */}
                <div className="mitigations-box">
                  <div className="mitigations-title">Recommended Traffic Mitigations</div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {msg.briefing.mitigations.map((m, idx) => (
                      <li key={idx} style={{ fontSize: '0.71rem', color: '#e2e8f0', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                        <ShieldCheck size={13} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ fontSize: '0.65rem', color: '#64748b', fontStyle: 'italic' }}>
                  {msg.briefing.syntheticDisclaimer}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input Bar */}
      <form
        className="assistant-input-bar"
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
      >
        <input
          type="text"
          className="assistant-input"
          placeholder="e.g. Close MG Road for 6h during peak rush..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button
          type="submit"
          className="btn-primary"
          style={{ padding: '0 14px' }}
          disabled={!inputText.trim()}
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
