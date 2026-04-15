import React, { useState, useEffect, useCallback } from "react";
import VizControls from "../components/VizControls.jsx";

// Two modes: "broken" (no volatile) and "volatile" (with volatile)
const BROKEN_FRAMES = [
  {
    mainFlag: true, t1Flag: true,
    mainCache: "flag=true", t1Cache: "flag=true",
    t1Reads: null, stage: "init",
    narration: "Initial state: flag=true in main memory. Both threads see flag=true in their CPU cache.",
  },
  {
    mainFlag: false, t1Flag: true,
    mainCache: "flag=false", t1Cache: "flag=true (stale!)",
    t1Reads: null, stage: "write",
    narration: "Main thread sets flag=false in its CPU cache. ⚠ The write is NOT immediately visible to Thread-1 — no happens-before guarantee.",
  },
  {
    mainFlag: false, t1Flag: true,
    mainCache: "flag=false", t1Cache: "flag=true (stale!)",
    t1Reads: "true", stage: "stale-read",
    narration: "☠ Thread-1 reads its stale cache value: flag=true. It keeps looping FOREVER — even though main thread wrote false. Infinite loop!",
  },
];

const VOLATILE_FRAMES = [
  {
    mainFlag: true, t1Flag: true,
    mainCache: "flag=true", t1Cache: "flag=true",
    t1Reads: null, stage: "init",
    narration: "With volatile boolean flag. JMM guarantees: every write to a volatile variable is immediately flushed to main memory.",
  },
  {
    mainFlag: false, t1Flag: false,
    mainCache: "flag=false", t1Cache: "flag=false (refreshed)",
    t1Reads: null, stage: "write",
    narration: "Main thread writes flag=false. Because flag is volatile, the write is IMMEDIATELY visible to ALL threads — CPU cache bypass.",
  },
  {
    mainFlag: false, t1Flag: false,
    mainCache: "flag=false", t1Cache: "flag=false",
    t1Reads: "false", stage: "fresh-read",
    narration: "✓ Thread-1 reads flag=false. The loop exits. Volatile establishes a happens-before: the write of flag=false happens-before any subsequent read.",
  },
];

function CPUBox({ label, cacheLabel, cacheValue, isStale, isFresh, color }) {
  return (
    <div className="viz-jmm-cpu">
      <div className="viz-jmm-cpu-label" style={{ color }}>{label}</div>
      <div className={"viz-jmm-cache" +
        (isStale ? " viz-jmm-cache--stale" :
         isFresh ? " viz-jmm-cache--fresh" : "")
      }>
        <div style={{ fontSize: 9, opacity: 0.6, marginBottom: 3 }}>L1 Cache</div>
        <div style={{ fontFamily: "monospace", fontSize: 11 }}>{cacheValue}</div>
        {isStale && <div style={{ fontSize: 9, color: "#E07060", marginTop: 3 }}>STALE ⚠</div>}
        {isFresh && <div style={{ fontSize: 9, color: "#4ADE80", marginTop: 3 }}>FRESH ✓</div>}
      </div>
    </div>
  );
}

function JMMPanel({ frames, mode }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const advance = useCallback(() => {
    setStep((s) => { if (s >= frames.length - 1) { setPlaying(false); return s; } return s + 1; });
  }, [frames.length]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(advance, 1600 / speed);
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

      <div className="viz-jmm-scene">
        {/* CPU boxes */}
        <div className="viz-jmm-cpus">
          <CPUBox
            label="Main Thread"
            cacheValue={f.mainCache}
            isStale={false}
            isFresh={f.stage === "write" || f.stage === "fresh-read"}
            color="#6AA8D0"
          />
          <CPUBox
            label="Thread-1"
            cacheValue={f.t1Cache}
            isStale={f.stage === "stale-read" || (f.stage === "write" && mode === "broken")}
            isFresh={f.stage === "fresh-read" || (f.stage === "write" && mode === "volatile")}
            color="#E07060"
          />
        </div>

        {/* Main memory */}
        <div className="viz-jmm-memory">
          <div className="viz-jmm-memory-label">Main Memory</div>
          <div className={"viz-jmm-memory-value" +
            (f.mainFlag === false ? " viz-jmm-memory-value--changed" : "")
          }>
            {mode === "volatile" ? "volatile " : ""}boolean flag = {String(f.mainFlag)}
          </div>
          {mode === "volatile" && f.stage === "write" && (
            <div style={{ fontSize: 9, color: "#4ADE80", marginTop: 4, textAlign: "center" }}>
              ↑ immediately flushed
            </div>
          )}
        </div>

        {/* Thread-1 reads */}
        {f.t1Reads !== null && (
          <div className={"viz-jmm-read-result" +
            (f.t1Reads === "true" ? " viz-jmm-read-result--bad" : " viz-jmm-read-result--good")
          }>
            Thread-1 reads: flag = {f.t1Reads}
            {f.t1Reads === "true" ? " → loop never exits ☠" : " → loop exits ✓"}
          </div>
        )}
      </div>

      <div className="viz-narration">{f.narration}</div>
    </div>
  );
}

export default function JMMViz() {
  const [tab, setTab] = useState("broken");
  return (
    <div className="viz-root">
      <div className="viz-jmm-tabs">
        <button
          className={"viz-jmm-tab" + (tab === "broken" ? " viz-jmm-tab--active viz-jmm-tab--bad" : "")}
          onClick={() => setTab("broken")}
        >☠ Without volatile</button>
        <button
          className={"viz-jmm-tab" + (tab === "volatile" ? " viz-jmm-tab--active viz-jmm-tab--good" : "")}
          onClick={() => setTab("volatile")}
        >✓ With volatile</button>
      </div>
      <JMMPanel key={tab} frames={tab === "broken" ? BROKEN_FRAMES : VOLATILE_FRAMES} mode={tab} />
    </div>
  );
}
