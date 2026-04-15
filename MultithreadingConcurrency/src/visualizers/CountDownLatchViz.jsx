import React, { useState, useEffect, useCallback } from "react";
import VizControls from "../components/VizControls.jsx";

// CountDownLatch(3) — 3 workers, 1 aggregator waits
const FRAMES = [
  {
    latch: 3,
    workers: [
      { id: "W1", task: "Fetch user data",    state: "pending" },
      { id: "W2", task: "Fetch orders",        state: "pending" },
      { id: "W3", task: "Fetch inventory",     state: "pending" },
    ],
    aggregator: "waiting",
    narration: "CountDownLatch(3) — count starts at 3. The aggregator thread calls await() and blocks until the count reaches 0.",
  },
  {
    latch: 3,
    workers: [
      { id: "W1", task: "Fetch user data",    state: "running" },
      { id: "W2", task: "Fetch orders",        state: "running" },
      { id: "W3", task: "Fetch inventory",     state: "running" },
    ],
    aggregator: "waiting",
    narration: "All 3 workers start concurrently. The aggregator is blocked at latch.await() — it cannot proceed until all workers call countDown().",
  },
  {
    latch: 2,
    workers: [
      { id: "W1", task: "Fetch user data",    state: "done" },
      { id: "W2", task: "Fetch orders",        state: "running" },
      { id: "W3", task: "Fetch inventory",     state: "running" },
    ],
    aggregator: "waiting",
    narration: "W1 finishes → calls latch.countDown(). Count: 3→2. Aggregator still waiting.",
  },
  {
    latch: 1,
    workers: [
      { id: "W1", task: "Fetch user data",    state: "done" },
      { id: "W2", task: "Fetch orders",        state: "done" },
      { id: "W3", task: "Fetch inventory",     state: "running" },
    ],
    aggregator: "waiting",
    narration: "W2 finishes → countDown(). Count: 2→1. Aggregator still waiting for the last worker.",
  },
  {
    latch: 0,
    workers: [
      { id: "W1", task: "Fetch user data",    state: "done" },
      { id: "W2", task: "Fetch orders",        state: "done" },
      { id: "W3", task: "Fetch inventory",     state: "done" },
    ],
    aggregator: "released",
    narration: "W3 finishes → countDown(). Count: 1→0. Latch opens — all threads blocked on await() are released simultaneously.",
  },
  {
    latch: 0,
    workers: [
      { id: "W1", task: "Fetch user data",    state: "done" },
      { id: "W2", task: "Fetch orders",        state: "done" },
      { id: "W3", task: "Fetch inventory",     state: "done" },
    ],
    aggregator: "aggregating",
    narration: "✓ Aggregator proceeds — merges all results. CountDownLatch is single-use: once count reaches 0, it cannot be reset (use CyclicBarrier for reuse).",
  },
];

function LatchDisplay({ count }) {
  const maxCount = 3;
  return (
    <div className="viz-latch-box">
      <div className="viz-latch-title">CountDownLatch</div>
      <div className={"viz-latch-count" + (count === 0 ? " viz-latch-count--zero" : "")}>
        {count}
      </div>
      <div className="viz-latch-bar-track">
        <div
          className="viz-latch-bar-fill"
          style={{
            width: `${((maxCount - count) / maxCount) * 100}%`,
            background: count === 0 ? "#4ADE80" : "#B7860C",
          }}
        />
      </div>
      <div style={{ fontSize: 10, marginTop: 4, color: count === 0 ? "#4ADE80" : "#9A8A7A" }}>
        {count === 0 ? "🔓 OPEN" : `${count} remaining`}
      </div>
    </div>
  );
}

function WorkerRow({ worker }) {
  return (
    <div className={"viz-worker-row" +
      (worker.state === "running" ? " viz-worker-row--running" :
       worker.state === "done" ? " viz-worker-row--done" : "")
    }>
      <span className="viz-worker-id">{worker.id}</span>
      <span className="viz-worker-task">{worker.task}</span>
      <span className="viz-worker-state">
        {worker.state === "pending" ? "pending" :
         worker.state === "running" ? "running…" :
         "done ✓"}
      </span>
    </div>
  );
}

export default function CountDownLatchViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const advance = useCallback(() => {
    setStep((s) => { if (s >= FRAMES.length - 1) { setPlaying(false); return s; } return s + 1; });
  }, []);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(advance, 1500 / speed);
    return () => clearInterval(id);
  }, [playing, speed, advance]);

  const reset = () => { setStep(0); setPlaying(false); };
  const f = FRAMES[step];

  return (
    <div className="viz-root">
      <VizControls
        playing={playing} onPlay={() => setPlaying((p) => !p)}
        onStep={advance} onReset={reset}
        speed={speed} onSpeed={setSpeed}
        step={step} total={FRAMES.length}
      />

      <div className="viz-latch-scene">
        {/* Workers */}
        <div className="viz-latch-workers">
          <div style={{ fontSize: 11, color: "#9A8A7A", marginBottom: 6 }}>Worker Threads</div>
          {f.workers.map((w) => <WorkerRow key={w.id} worker={w} />)}
        </div>

        {/* Latch counter */}
        <LatchDisplay count={f.latch} />

        {/* Aggregator */}
        <div className={"viz-latch-aggregator" +
          (f.aggregator === "waiting" ? " viz-latch-aggregator--waiting" :
           f.aggregator === "released" ? " viz-latch-aggregator--released" :
           f.aggregator === "aggregating" ? " viz-latch-aggregator--active" : "")
        }>
          <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>Aggregator</div>
          <div style={{ fontSize: 10, opacity: 0.8 }}>
            {f.aggregator === "waiting" ? "⏳ await()…" :
             f.aggregator === "released" ? "🔓 unblocked!" :
             "✓ merging results"}
          </div>
        </div>
      </div>

      <div className="viz-narration">{f.narration}</div>
    </div>
  );
}
