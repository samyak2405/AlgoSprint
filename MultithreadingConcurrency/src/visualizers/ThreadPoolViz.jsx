import React, { useState, useEffect, useCallback } from "react";
import VizControls from "../components/VizControls.jsx";

// ThreadPool with 3 workers, task queue
const FRAMES = [
  {
    queue: [],
    workers: [
      { id: "W1", task: null, state: "idle" },
      { id: "W2", task: null, state: "idle" },
      { id: "W3", task: null, state: "idle" },
    ],
    completed: [],
    narration: "ThreadPoolExecutor(corePoolSize=3). Three worker threads are alive and idle. The task queue is empty.",
  },
  {
    queue: ["T4", "T5"],
    workers: [
      { id: "W1", task: "T1", state: "busy" },
      { id: "W2", task: "T2", state: "busy" },
      { id: "W3", task: "T3", state: "busy" },
    ],
    completed: [],
    narration: "5 tasks submitted. W1/W2/W3 immediately pick up T1/T2/T3. T4 and T5 wait in the queue — all core threads are busy.",
  },
  {
    queue: ["T5"],
    workers: [
      { id: "W1", task: "T4", state: "busy" },
      { id: "W2", task: "T2", state: "busy" },
      { id: "W3", task: "T3", state: "busy" },
    ],
    completed: ["T1"],
    narration: "W1 finishes T1 → immediately picks up T4 from the queue. No new thread spawned — reuse is the whole point of a thread pool.",
  },
  {
    queue: [],
    workers: [
      { id: "W1", task: "T4", state: "busy" },
      { id: "W2", task: "T5", state: "busy" },
      { id: "W3", task: null, state: "idle" },
    ],
    completed: ["T1", "T2", "T3"],
    narration: "T2 and T3 finish. W2 picks up T5. W3 goes idle. Queue is now empty. Thread creation/destruction cost = ZERO for these tasks.",
  },
  {
    queue: [],
    workers: [
      { id: "W1", task: null, state: "idle" },
      { id: "W2", task: null, state: "idle" },
      { id: "W3", task: null, state: "idle" },
    ],
    completed: ["T1", "T2", "T3", "T4", "T5"],
    narration: "✓ All 5 tasks complete. Workers stay alive (keepAlive time not expired). Pool ready for next burst. Contrast: creating a new Thread per task would waste OS resources.",
  },
];

const OVERFLOW_FRAMES = [
  {
    queue: [],
    workers: [
      { id: "W1", task: null, state: "idle" },
      { id: "W2", task: null, state: "idle" },
      { id: "W3", task: null, state: "idle" },
    ],
    completed: [],
    queueCapacity: 2,
    rejected: [],
    narration: "ThreadPoolExecutor(core=3, max=3, queueCapacity=2). We'll submit 6 tasks — more than pool+queue can handle.",
  },
  {
    queue: ["T4", "T5"],
    workers: [
      { id: "W1", task: "T1", state: "busy" },
      { id: "W2", task: "T2", state: "busy" },
      { id: "W3", task: "T3", state: "busy" },
    ],
    completed: [],
    queueCapacity: 2,
    rejected: [],
    narration: "T1-T3 start immediately. T4, T5 enqueue (queue full at 2).",
  },
  {
    queue: ["T4", "T5"],
    workers: [
      { id: "W1", task: "T1", state: "busy" },
      { id: "W2", task: "T2", state: "busy" },
      { id: "W3", task: "T3", state: "busy" },
    ],
    completed: [],
    queueCapacity: 2,
    rejected: ["T6"],
    narration: "☠ T6 arrives — queue full, all threads busy, max reached → RejectedExecutionException (AbortPolicy). T6 is dropped.",
  },
];

function WorkerBox({ worker }) {
  return (
    <div className={"viz-worker-box" +
      (worker.state === "busy" ? " viz-worker-box--busy" :
       worker.state === "idle" ? " viz-worker-box--idle" : "")
    }>
      <div className="viz-worker-box-id">{worker.id}</div>
      {worker.task ? (
        <div className="viz-worker-box-task">{worker.task}</div>
      ) : (
        <div className="viz-worker-box-idle-label">idle</div>
      )}
    </div>
  );
}

function TaskChip({ label, style }) {
  return (
    <div className="viz-task-chip" style={style}>{label}</div>
  );
}

function PoolPanel({ frames, showRejected }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const advance = useCallback(() => {
    setStep((s) => { if (s >= frames.length - 1) { setPlaying(false); return s; } return s + 1; });
  }, [frames.length]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(advance, 1500 / speed);
    return () => clearInterval(id);
  }, [playing, speed, advance]);

  const reset = () => { setStep(0); setPlaying(false); };
  const f = frames[step];

  return (
    <div>
      <VizControls
        playing={playing} onPlay={() => setPlaying((p) => !p)}
        onStep={advance} onReset={reset}
        speed={speed} onSpeed={setSpeed}
        step={step} total={frames.length}
      />

      <div className="viz-pool-scene">
        {/* Task queue */}
        <div className="viz-pool-queue">
          <div className="viz-pool-section-label">
            Task Queue {showRejected ? `(max ${f.queueCapacity})` : ""}
          </div>
          <div className="viz-pool-queue-slots">
            {f.queue.length === 0 ? (
              <div style={{ fontSize: 10, color: "#5C5248", padding: "6px 0" }}>empty</div>
            ) : (
              f.queue.map((t) => <TaskChip key={t} label={t} />)
            )}
          </div>
        </div>

        {/* Arrow */}
        <div className="viz-pool-arrow">→</div>

        {/* Worker threads */}
        <div className="viz-pool-workers">
          <div className="viz-pool-section-label">Worker Threads</div>
          <div className="viz-pool-worker-row">
            {f.workers.map((w) => <WorkerBox key={w.id} worker={w} />)}
          </div>
        </div>

        {/* Completed */}
        {f.completed && f.completed.length > 0 && (
          <div className="viz-pool-completed">
            <div className="viz-pool-section-label">Completed</div>
            <div className="viz-pool-completed-chips">
              {f.completed.map((t) => (
                <TaskChip key={t} label={t} style={{ background: "#1E3A2A", borderColor: "#4ADE80", color: "#4ADE80" }} />
              ))}
            </div>
          </div>
        )}

        {/* Rejected tasks */}
        {showRejected && f.rejected && f.rejected.length > 0 && (
          <div className="viz-pool-rejected">
            <div className="viz-pool-section-label" style={{ color: "#E07060" }}>Rejected</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {f.rejected.map((t) => (
                <TaskChip key={t} label={t} style={{ background: "#3A1A1A", borderColor: "#E07060", color: "#E07060" }} />
              ))}
            </div>
            <div style={{ fontSize: 10, color: "#E07060", marginTop: 4 }}>RejectedExecutionException</div>
          </div>
        )}
      </div>

      <div className="viz-narration">{f.narration}</div>
    </div>
  );
}

export default function ThreadPoolViz() {
  const [tab, setTab] = useState("normal");
  return (
    <div className="viz-root">
      <div className="viz-jmm-tabs">
        <button
          className={"viz-jmm-tab" + (tab === "normal" ? " viz-jmm-tab--active viz-jmm-tab--good" : "")}
          onClick={() => setTab("normal")}
        >✓ Normal Flow</button>
        <button
          className={"viz-jmm-tab" + (tab === "overflow" ? " viz-jmm-tab--active viz-jmm-tab--bad" : "")}
          onClick={() => setTab("overflow")}
        >☠ Queue Overflow</button>
      </div>
      <PoolPanel key={tab} frames={tab === "normal" ? FRAMES : OVERFLOW_FRAMES} showRejected={tab === "overflow"} />
    </div>
  );
}
