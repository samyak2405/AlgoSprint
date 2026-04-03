import React from "react";

export function DecisionDebugger({ path, result }) {
  if (!result) return null;
  return (
    <div className="feature-card">
      <h3>Decision Debugger</h3>
      <p>
        <strong>Selected:</strong> {result.name}
      </p>
      <p>
        <strong>Reason:</strong> {result.why}
      </p>
      <p>
        <strong>Path:</strong> {path.map((p) => p.label).join(" -> ") || "Direct result"}
      </p>
      <p className="muted">Alternatives are excluded because selected choices optimized for your chosen constraints.</p>
    </div>
  );
}
