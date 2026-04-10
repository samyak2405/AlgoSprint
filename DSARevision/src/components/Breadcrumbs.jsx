import React from "react";

export function Breadcrumbs({ path, onReset, onJumpToPath }) {
  if (!path.length) return null;

  return (
    <div className="breadcrumbs">
      <button className="crumb-btn" onClick={onReset}>
        Start
      </button>
      {path.map((item, idx) => (
        <span key={`${item.label}-${idx}`} className="crumb-item">
          <span className="crumb-sep">›</span>
          <button className="crumb-step-btn" onClick={() => onJumpToPath(idx)}>
            {item.label}
          </button>
        </span>
      ))}
    </div>
  );
}
