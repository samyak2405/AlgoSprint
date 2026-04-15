import React, { useState, useEffect, useCallback } from "react";
import VizControls from "../components/VizControls.jsx";

// Semaphore with 3 permits — 5 threads compete
const FRAMES = [
  {
    permits: 3, usedPermits: 0,
    threads: [
      { id: "T1", state: "waiting" },
      { id: "T2", state: "waiting" },
      { id: "T3", state: "waiting" },
      { id: "T4", state: "waiting" },
      { id: "T5", state: "waiting" },
    ],
    narration: "Semaphore(3) — 3 permits available. 5 threads all want to access the limited resource (e.g., 3 DB connections).",
  },
  {
    permits: 3, usedPermits: 1,
    threads: [
      { id: "T1", state: "acquired" },
      { id: "T2", state: "waiting" },
      { id: "T3", state: "waiting" },
      { id: "T4", state: "waiting" },
      { id: "T5", state: "waiting" },
    ],
    narration: "T1 calls acquire() — gets a permit. Permits remaining: 2.",
  },
  {
    permits: 3, usedPermits: 2,
    threads: [
      { id: "T1", state: "acquired" },
      { id: "T2", state: "acquired" },
      { id: "T3", state: "waiting" },
      { id: "T4", state: "waiting" },
      { id: "T5", state: "waiting" },
    ],
    narration: "T2 calls acquire() — gets a permit. Permits remaining: 1.",
  },
  {
    permits: 3, usedPermits: 3,
    threads: [
      { id: "T1", state: "acquired" },
      { id: "T2", state: "acquired" },
      { id: "T3", state: "acquired" },
      { id: "T4", state: "blocked" },
      { id: "T5", state: "blocked" },
    ],
    narration: "T3 gets the last permit (permits: 0). T4 and T5 call acquire() → BLOCKED. Semaphore is exhausted.",
  },
  {
    permits: 3, usedPermits: 2,
    threads: [
      { id: "T1", state: "released" },
      { id: "T2", state: "acquired" },
      { id: "T3", state: "acquired" },
      { id: "T4", state: "acquired" },
      { id: "T5", state: "blocked" },
    ],
    narration: "T1 calls release() — returns its permit. T4 wakes up and immediately acquires the permit. Permits: 1 used.",
  },
  {
    permits: 3, usedPermits: 1,
    threads: [
      { id: "T1", state: "done" },
      { id: "T2", state: "released" },
      { id: "T3", state: "acquired" },
      { id: "T4", state: "acquired" },
      { id: "T5", state: "acquired" },
    ],
    narration: "T2 releases. T5 wakes and acquires. All 5 threads eventually get their turn — no starvation possible with fair semaphore.",
  },
  {
    permits: 3, usedPermits: 0,
    threads: [
      { id: "T1", state: "done" },
      { id: "T2", state: "done" },
      { id: "T3", state: "done" },
      { id: "T4", state: "done" },
      { id: "T5", state: "done" },
    ],
    narration: "✓ All threads complete. Semaphore ensures at most 3 concurrent accesses at any time — a gate, not a mutex.",
  },
];

function PermitDots({ total, used }) {
  return (
    <div className="viz-permit-row">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={"viz-permit" + (i < used ? " viz-permit--used" : " viz-permit--free")}
        />
      ))}
    </div>
  );
}

function ThreadRow({ thread }) {
  const stateLabel = {
    waiting: "waiting",
    acquired: "inside ✓",
    blocked: "⏳ blocked",
    released: "releasing",
    done: "done ✓",
  };
  return (
    <div className={"viz-thread-row" +
      (thread.state === "acquired" ? " viz-thread-row--acquired" :
       thread.state === "blocked" ? " viz-thread-row--blocked" :
       thread.state === "released" ? " viz-thread-row--releasing" :
       thread.state === "done" ? " viz-thread-row--done" : "")
    }>
      <span className="viz-thread-row-id">{thread.id}</span>
      <span className="viz-thread-row-state">{stateLabel[thread.state] || thread.state}</span>
    </div>
  );
}

export default function SemaphoreViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const advance = useCallback(() => {
    setStep((s) => { if (s >= FRAMES.length - 1) { setPlaying(false); return s; } return s + 1; });
  }, []);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(advance, 1400 / speed);
    return () => clearInterval(id);
  }, [playing, speed, advance]);

  const reset = () => { setStep(0); setPlaying(false); };
  const f = FRAMES[step];
  const available = f.permits - f.usedPermits;

  return (
    <div className="viz-root">
      <VizControls
        playing={playing} onPlay={() => setPlaying((p) => !p)}
        onStep={advance} onReset={reset}
        speed={speed} onSpeed={setSpeed}
        step={step} total={FRAMES.length}
      />

      <div className="viz-sem-scene">
        {/* Semaphore permit display */}
        <div className="viz-sem-box">
          <div className="viz-sem-title">Semaphore(3)</div>
          <PermitDots total={f.permits} used={f.usedPermits} />
          <div className="viz-sem-count">
            <span style={{ color: available > 0 ? "#4ADE80" : "#E07060" }}>
              {available} permit{available !== 1 ? "s" : ""} available
            </span>
          </div>
        </div>

        {/* Thread list */}
        <div className="viz-sem-threads">
          {f.threads.map((t) => <ThreadRow key={t.id} thread={t} />)}
        </div>
      </div>

      <div className="viz-narration">{f.narration}</div>
    </div>
  );
}
