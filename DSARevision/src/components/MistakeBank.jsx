import React from "react";

export function MistakeBank({ resultName, catalog }) {
  const mistakes = catalog[resultName] || catalog.default || [];
  return (
    <div className="feature-card">
      <h3>Mistake Bank</h3>
      <ul className="mistake-list">
        {mistakes.map((m, i) => (
          <li key={`${m}-${i}`}>{m}</li>
        ))}
      </ul>
    </div>
  );
}
