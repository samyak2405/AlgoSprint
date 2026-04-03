import React from "react";

export function ProblemCueMapper({ value, onChange, suggestions }) {
  return (
    <div className="feature-card">
      <h3>Pattern Mapper from Problem Statement</h3>
      <textarea
        className="text-input mapper-input"
        placeholder="Paste a problem statement cue..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="mapper-results">
        {suggestions.length === 0 ? <p className="muted">No mapped suggestions yet.</p> : suggestions.map((s) => <span key={s} className="mapper-chip">{s}</span>)}
      </div>
    </div>
  );
}
