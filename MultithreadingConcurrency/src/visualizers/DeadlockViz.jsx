import React, { useState, useEffect, useCallback } from "react";
import VizControls from "../components/VizControls.jsx";

const FRAMES = [
  {
    threadA: "idle", threadB: "idle", lock1: null, lock2: null,
    showDeadlock: false,
    narration: "Two threads, two locks. Thread A acquires Lock1 then Lock2. Thread B acquires Lock2 then Lock1. This is the dangerous reverse ordering.",
  },
  {
    threadA: "holds-L1", threadB: "idle", lock1: "A", lock2: null,
    showDeadlock: false,
    narration: "Thread A enters synchronized(lock1) — acquires Lock 1. Thread B has not started yet.",
  },
  {
    threadA: "holds-L1", threadB: "holds-L2", lock1: "A", lock2: "B",
    showDeadlock: false,
    narration: "Thread B enters synchronized(lock2) — acquires Lock 2. Both threads now each hold one lock. The trap is set.",
  },
  {
    threadA: "wants-L2", threadB: "holds-L2", lock1: "A", lock2: "B",
    showDeadlock: false,
    narration: "Thread A tries to acquire Lock 2 → BLOCKED. Thread B holds it and will not release until it gets Lock 1.",
  },
  {
    threadA: "wants-L2", threadB: "wants-L1", lock1: "A", lock2: "B",
    showDeadlock: true,
    narration: "☠ DEADLOCK. Thread B tries to acquire Lock 1 → BLOCKED. Thread A holds it. Neither thread will ever proceed. The program is frozen forever.",
  },
];

const FIX_FRAMES = [
  {
    threadA: "idle", threadB: "idle", lock1: null, lock2: null,
    narration: "Fix: always acquire locks in the SAME order everywhere. Both Thread A and B will always try Lock1 first, then Lock2.",
  },
  {
    threadA: "holds-L1", threadB: "idle", lock1: "A", lock2: null,
    narration: "Thread A acquires Lock 1 first.",
  },
  {
    threadA: "holds-L1+L2", threadB: "idle", lock1: "A", lock2: "A",
    narration: "Thread A acquires Lock 2. Both locks held — Thread A proceeds.",
  },
  {
    threadA: "done", threadB: "holds-L1", lock1: "B", lock2: null,
    narration: "Thread A releases both locks. Thread B now acquires Lock 1 (same order).",
  },
  {
    threadA: "done", threadB: "holds-L1+L2", lock1: "B", lock2: "B",
    narration: "Thread B acquires Lock 2. No circular wait possible — lock ordering prevents deadlock.",
  },
];

function DeadlockPanel({ frames }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const advance = useCallback(() => {
    setStep((s) => { if (s >= frames.length - 1) { setPlaying(false); return s; } return s + 1; });
  }, [frames.length]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(advance, 1300 / speed);
    return () => clearInterval(id);
  }, [playing, speed, advance]);

  const reset = () => { setStep(0); setPlaying(false); };
  const f = frames[step];

  const threadAClass = () => {
    if (f.threadA === "wants-L2" || f.threadA === "wants-L1") return "viz-thread-pill viz-thread-pill--blocked";
    if (f.threadA === "idle") return "viz-thread-pill";
    if (f.threadA === "done") return "viz-thread-pill" + " viz-thread-pill--done";
    return "viz-thread-pill viz-thread-pill--a";
  };

  const threadBClass = () => {
    if (f.threadB === "wants-L1" || f.threadB === "wants-L2") return "viz-thread-pill viz-thread-pill--blocked";
    if (f.threadB === "idle") return "viz-thread-pill";
    if (f.threadB === "done") return "viz-thread-pill";
    return "viz-thread-pill viz-thread-pill--b";
  };

  const lockClass = (holder) => {
    if (!holder) return "viz-lock-circle";
    return "viz-lock-circle viz-lock-circle--held-" + holder.toLowerCase();
  };

  return (
    <div>
      <VizControls
        playing={playing} onPlay={() => setPlaying((p) => !p)}
        onStep={advance} onReset={reset}
        speed={speed} onSpeed={setSpeed}
        step={step} total={frames.length}
      />

      {/* Scene */}
      <div style={{ position: "relative", height: 180, marginBottom: 8 }}>
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox="0 0 400 180">
          <defs>
            <marker id="dlock-arrow-a" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#6AA8D0" />
            </marker>
            <marker id="dlock-arrow-b" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#E07060" />
            </marker>
            <marker id="dlock-arrow-want" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#D4A020" />
            </marker>
          </defs>

          {/* Thread A holds Lock1 */}
          {(f.lock1 === "A" || f.lock1 === "B") && (
            <line x1="80" y1="55" x2="168" y2="55"
              stroke={f.lock1 === "A" ? "#6AA8D0" : "#E07060"}
              strokeWidth="1.5"
              markerEnd={f.lock1 === "A" ? "url(#dlock-arrow-a)" : "url(#dlock-arrow-b)"}
            />
          )}
          {/* Thread B holds Lock2 */}
          {(f.lock2 === "A" || f.lock2 === "B") && (
            <line x1="80" y1="125" x2="168" y2="125"
              stroke={f.lock2 === "B" ? "#E07060" : "#6AA8D0"}
              strokeWidth="1.5"
              markerEnd={f.lock2 === "B" ? "url(#dlock-arrow-b)" : "url(#dlock-arrow-a)"}
            />
          )}
          {/* Thread A wants Lock2 */}
          {(f.threadA === "wants-L2") && (
            <path d="M 80 65 Q 200 90 168 125"
              fill="none" stroke="#D4A020" strokeWidth="1.5" strokeDasharray="5 4"
              markerEnd="url(#dlock-arrow-want)"
              style={{ animation: "viz-dash-flow 0.6s linear infinite" }}
            />
          )}
          {/* Thread B wants Lock1 */}
          {(f.threadB === "wants-L1") && (
            <path d="M 80 115 Q 200 90 168 55"
              fill="none" stroke="#D4A020" strokeWidth="1.5" strokeDasharray="5 4"
              markerEnd="url(#dlock-arrow-want)"
              style={{ animation: "viz-dash-flow 0.6s linear infinite" }}
            />
          )}

          {/* Lock1 → Lock2 from hold arrows */}
          {f.lock1 && (
            <line x1="232" y1="55" x2="300" y2="55" stroke="#4A3A2A" strokeWidth="1" strokeDasharray="3 3" />
          )}
          {f.lock2 && (
            <line x1="232" y1="125" x2="300" y2="125" stroke="#4A3A2A" strokeWidth="1" strokeDasharray="3 3" />
          )}
        </svg>

        {/* Thread A */}
        <div className={threadAClass()} style={{ position: "absolute", left: 0, top: 38, width: 80 }}>
          <div style={{ fontSize: 10 }}>Thread A</div>
          <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>
            {f.threadA === "wants-L2" ? "⏳ blocked" : f.threadA === "idle" ? "idle" : f.threadA === "done" ? "done ✓" : "running"}
          </div>
        </div>

        {/* Thread B */}
        <div className={threadBClass()} style={{ position: "absolute", left: 0, top: 108, width: 80 }}>
          <div style={{ fontSize: 10 }}>Thread B</div>
          <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>
            {f.threadB === "wants-L1" ? "⏳ blocked" : f.threadB === "idle" ? "idle" : f.threadB === "done" ? "done ✓" : "running"}
          </div>
        </div>

        {/* Lock 1 */}
        <div className={lockClass(f.lock1)} style={{ position: "absolute", left: 168, top: 33 }}>
          <div>
            <div style={{ fontSize: 9 }}>🔒</div>
            <div style={{ fontSize: 8, marginTop: 1 }}>L1</div>
          </div>
        </div>

        {/* Lock 2 */}
        <div className={lockClass(f.lock2)} style={{ position: "absolute", left: 168, top: 103 }}>
          <div>
            <div style={{ fontSize: 9 }}>🔒</div>
            <div style={{ fontSize: 8, marginTop: 1 }}>L2</div>
          </div>
        </div>

        {/* Holder label next to locks */}
        <div style={{ position: "absolute", left: 222, top: 46, fontSize: 10, color: "#5C5248", fontFamily: "monospace" }}>
          {f.lock1 ? `held by ${f.lock1 === "A" || f.lock1 === "B" ? "Thread " + f.lock1 : f.lock1}` : "free"}
        </div>
        <div style={{ position: "absolute", left: 222, top: 116, fontSize: 10, color: "#5C5248", fontFamily: "monospace" }}>
          {f.lock2 ? `held by ${f.lock2 === "A" || f.lock2 === "B" ? "Thread " + f.lock2 : f.lock2}` : "free"}
        </div>

        {/* Deadlock badge */}
        {f.showDeadlock && (
          <div className="viz-deadlock-badge">☠ DEADLOCK</div>
        )}
      </div>

      <div className="viz-narration">{f.narration}</div>
    </div>
  );
}

export default function DeadlockViz() {
  const [tab, setTab] = useState("bad");
  return (
    <div className="viz-root">
      <div className="viz-jmm-tabs">
        <button
          className={"viz-jmm-tab" + (tab === "bad" ? " viz-jmm-tab--active viz-jmm-tab--bad" : "")}
          onClick={() => setTab("bad")}
        >☠ Deadlock</button>
        <button
          className={"viz-jmm-tab" + (tab === "good" ? " viz-jmm-tab--active viz-jmm-tab--good" : "")}
          onClick={() => setTab("good")}
        >✓ Fixed: Lock Ordering</button>
      </div>
      <DeadlockPanel key={tab} frames={tab === "bad" ? FRAMES : FIX_FRAMES} />
    </div>
  );
}
