import React from "react";

const OPTIONS = [
  { id: "all", label: "All Topics" },
  { id: "quick15", label: "Quick 15-min" },
];

export function RevisionModeSwitcher({ mode, onChange }) {
  return (
    <div className="feature-card">
      <h3>Revision Mode</h3>
      <div className="mode-row">
        {OPTIONS.map((opt) => (
          <button key={opt.id} className={`mode-btn ${mode === opt.id ? "active" : ""}`} onClick={() => onChange(opt.id)}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
