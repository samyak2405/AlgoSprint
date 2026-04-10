import React from "react";

export function ThemeControls({ theme, onThemeChange }) {
  return (
    <div className="feature-card">
      <h3>Theme</h3>
      <div className="mode-row">
        {["system", "light", "dark"].map((t) => (
          <button key={t} className={`mode-btn ${theme === t ? "active" : ""}`} onClick={() => onThemeChange(t)}>
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
