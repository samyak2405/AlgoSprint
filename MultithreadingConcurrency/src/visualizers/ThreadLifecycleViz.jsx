import React, { useState, useEffect, useCallback } from "react";
import VizControls from "../components/VizControls.jsx";

// State positions as percentages of the 560×220 scene
const NODES = {
  NEW:           { cx: "9%",   cy: "45%", label: "NEW" },
  RUNNABLE:      { cx: "38%",  cy: "45%", label: "RUNNABLE" },
  BLOCKED:       { cx: "65%",  cy: "18%", label: "BLOCKED" },
  WAITING:       { cx: "65%",  cy: "45%", label: "WAITING" },
  TIMED_WAITING: { cx: "65%",  cy: "72%", label: "TIMED_WAITING" },
  TERMINATED:    { cx: "92%",  cy: "45%", label: "TERMINATED" },
};

// Edges: [from, to, labelText, curvature]
const EDGES = [
  { id: "new-run",    from: "NEW",           to: "RUNNABLE",      label: "start()" },
  { id: "run-blk",    from: "RUNNABLE",      to: "BLOCKED",       label: "lock contention" },
  { id: "blk-run",    from: "BLOCKED",       to: "RUNNABLE",      label: "lock acquired" },
  { id: "run-wait",   from: "RUNNABLE",      to: "WAITING",       label: "wait() / join()" },
  { id: "wait-run",   from: "WAITING",       to: "RUNNABLE",      label: "notify()" },
  { id: "run-twait",  from: "RUNNABLE",      to: "TIMED_WAITING", label: "sleep(ms)" },
  { id: "twait-run",  from: "TIMED_WAITING", to: "RUNNABLE",      label: "timeout" },
  { id: "run-term",   from: "RUNNABLE",      to: "TERMINATED",    label: "run() returns" },
];

const FRAMES = [
  { active: "NEW",           edge: null,         narration: "NEW — Thread object created with new Thread(r). No OS thread exists yet. start() has not been called." },
  { active: "RUNNABLE",      edge: "new-run",     narration: "RUNNABLE — start() invoked. JVM creates an OS thread. Thread is either executing on CPU or in the OS ready queue. Both sub-states appear as RUNNABLE." },
  { active: "BLOCKED",       edge: "run-blk",     narration: "BLOCKED — Thread attempted to enter a synchronized block/method but another thread holds the monitor lock. Parks here — no CPU burned." },
  { active: "RUNNABLE",      edge: "blk-run",     narration: "Lock acquired — previous holder released the monitor. OS wakes one BLOCKED thread; it re-enters RUNNABLE." },
  { active: "WAITING",       edge: "run-wait",    narration: "WAITING — Thread called Object.wait(), Thread.join() (no timeout), or LockSupport.park(). Waits indefinitely until explicitly notified." },
  { active: "RUNNABLE",      edge: "wait-run",    narration: "notify() / notifyAll() woke this thread. It re-enters RUNNABLE and competes for the lock again." },
  { active: "TIMED_WAITING", edge: "run-twait",   narration: "TIMED_WAITING — Thread called Thread.sleep(ms), Object.wait(ms), or Thread.join(ms). Automatically returns after the timeout expires." },
  { active: "RUNNABLE",      edge: "twait-run",   narration: "Timeout expired (or notify() received). Thread re-enters the scheduler queue as RUNNABLE." },
  { active: "TERMINATED",    edge: "run-term",    narration: "TERMINATED — run() returned normally or threw an uncaught exception. The Thread object lives in memory but cannot be restarted — start() would throw IllegalThreadStateException." },
];

// Map node labels to pixel coords in a 560×220 viewBox
function getCoord(node, axis) {
  const pct = axis === "x" ? parseFloat(NODES[node].cx) : parseFloat(NODES[node].cy);
  return (axis === "x" ? 560 : 220) * pct / 100;
}

export default function ThreadLifecycleViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const advance = useCallback(() => {
    setStep((s) => {
      if (s >= FRAMES.length - 1) { setPlaying(false); return s; }
      return s + 1;
    });
  }, []);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(advance, 1400 / speed);
    return () => clearInterval(id);
  }, [playing, speed, advance]);

  const reset = () => { setStep(0); setPlaying(false); };
  const frame = FRAMES[step];

  const stateColor = {
    NEW: "#6A5A4A", RUNNABLE: "#4ADE80", BLOCKED: "#D4A020",
    WAITING: "#6AA8D0", TIMED_WAITING: "#A78BFA", TERMINATED: "#E07060",
  };

  return (
    <div className="viz-root">
      <VizControls
        playing={playing} onPlay={() => setPlaying((p) => !p)}
        onStep={advance} onReset={reset}
        speed={speed} onSpeed={setSpeed}
        step={step} total={FRAMES.length}
      />

      <div className="viz-lifecycle-scene">
        {/* SVG arrows */}
        <svg className="viz-lifecycle-svg" viewBox="0 0 560 220" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="arrow-inactive" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
              <polygon points="0 0, 7 3.5, 0 7" fill="#3C3630" />
            </marker>
            <marker id="arrow-active" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
              <polygon points="0 0, 7 3.5, 0 7" fill="#B7860C" />
            </marker>
          </defs>
          {EDGES.map((edge) => {
            const isActive = frame.edge === edge.id;
            const x1 = getCoord(edge.from, "x");
            const y1 = getCoord(edge.from, "y");
            const x2 = getCoord(edge.to, "x");
            const y2 = getCoord(edge.to, "y");
            // slight curve offset for parallel edges
            const offset = edge.id.includes("blk-run") || edge.id.includes("wait-run") || edge.id.includes("twait-run") ? 18 : 0;
            const mx = (x1 + x2) / 2 + offset;
            const my = (y1 + y2) / 2 - (offset ? 18 : 0);
            return (
              <g key={edge.id}>
                <path
                  d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
                  fill="none"
                  stroke={isActive ? "#B7860C" : "#3C3630"}
                  strokeWidth={isActive ? 1.8 : 1}
                  markerEnd={isActive ? "url(#arrow-active)" : "url(#arrow-inactive)"}
                  strokeDasharray={isActive ? "none" : "4 3"}
                  style={{ transition: "stroke 280ms ease, stroke-width 280ms ease" }}
                />
                {isActive && (
                  <text
                    x={mx}
                    y={my - 5}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#B7860C"
                    fontFamily="monospace"
                    fontWeight="700"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* State nodes */}
        {Object.entries(NODES).map(([key, node]) => {
          const isActive = frame.active === key;
          const color = stateColor[key];
          return (
            <div
              key={key}
              className={"viz-node" + (isActive ? " viz-node--active" : "")}
              style={{
                left: node.cx,
                top: node.cy,
                borderColor: isActive ? color : "#3C3630",
                color: isActive ? color : "#4A3A2A",
                background: isActive ? `${color}18` : "#1C1A17",
                boxShadow: isActive ? `0 0 16px ${color}44` : "none",
              }}
            >
              {node.label}
            </div>
          );
        })}
      </div>

      <div className="viz-narration">{frame.narration}</div>
    </div>
  );
}
