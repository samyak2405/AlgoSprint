import React from "react";

export default function VizControls({ playing, onPlay, onStep, onReset, speed, onSpeed, step, total }) {
  return (
    <div className="viz-controls">
      <button
        className={playing ? "viz-btn viz-btn--pause" : "viz-btn viz-btn--play"}
        onClick={onPlay}
      >
        {playing ? "⏸ Pause" : "▶ Play"}
      </button>
      <button className="viz-btn viz-btn--step" onClick={onStep} disabled={playing}>
        ⏭ Step
      </button>
      <button className="viz-btn viz-btn--reset" onClick={onReset}>
        ↺ Reset
      </button>
      <span className="viz-step-counter">
        {step + 1} / {total}
      </span>
      <div className="viz-speed-group">
        {[0.5, 1, 2].map((s) => (
          <button
            key={s}
            className={"viz-speed-btn" + (speed === s ? " viz-speed-btn--active" : "")}
            onClick={() => onSpeed(s)}
          >
            {s}×
          </button>
        ))}
      </div>
    </div>
  );
}
