import React, { useState } from "react";

export function DpInteractiveDemo({ demoKey, stepsMap }) {
  const steps = stepsMap[demoKey] || [];
  const [stepIdx, setStepIdx] = useState(0);
  if (!steps.length) return null;

  const step = steps[stepIdx];
  return (
    <div className="dp-demo">
      <div className="dp-demo-header">
        <h4>Interactive Walkthrough</h4>
        <span>
          Step {stepIdx + 1}/{steps.length}
        </span>
      </div>
      <p className="dp-demo-title">{step.title}</p>
      <p className="dp-demo-note">{step.note}</p>
      <pre className="dp-demo-view">
        <code>{step.view}</code>
      </pre>
      <div className="dp-demo-actions">
        <button className="ghost-btn" onClick={() => setStepIdx((v) => Math.max(0, v - 1))} disabled={stepIdx === 0}>
          Prev
        </button>
        <button
          className="ghost-btn"
          onClick={() => setStepIdx((v) => Math.min(steps.length - 1, v + 1))}
          disabled={stepIdx === steps.length - 1}
        >
          Next
        </button>
        <button className="ghost-btn" onClick={() => setStepIdx(0)}>
          Reset
        </button>
      </div>
    </div>
  );
}
