import React, { useState, useEffect, useCallback } from "react";
import VizControls from "../components/VizControls.jsx";

const RACE_FRAMES = [
  {
    count: 0, displayCount: "0", countState: "normal",
    threadA: { step: null, register: null },
    threadB: { step: null, register: null },
    narration: "Shared counter starts at 0. Two threads will each call count++. Expected result: 2.",
  },
  {
    count: 0, displayCount: "0", countState: "normal",
    threadA: { step: "LOAD", register: "reg=0" },
    threadB: { step: null, register: null },
    narration: "Thread A executes LOAD — reads count=0 into its CPU register (reg=0). Still hasn't written anything.",
  },
  {
    count: 0, displayCount: "0", countState: "normal",
    threadA: { step: "LOAD", register: "reg=0" },
    threadB: { step: "LOAD", register: "reg=0" },
    narration: "⚡ Context switch! Thread B also executes LOAD — reads the same stale count=0 into its register. Both now hold reg=0.",
  },
  {
    count: 0, displayCount: "0", countState: "normal",
    threadA: { step: "INC", register: "reg=1" },
    threadB: { step: "LOAD", register: "reg=0" },
    narration: "Thread A increments its register: 0+1=1. No write to memory yet.",
  },
  {
    count: 1, displayCount: "1", countState: "normal",
    threadA: { step: "STORE", register: "reg=1" },
    threadB: { step: "LOAD", register: "reg=0" },
    narration: "Thread A STOREs 1 into count. count is now 1. Looks good so far.",
  },
  {
    count: 1, displayCount: "1", countState: "normal",
    threadA: { step: "done", register: null },
    threadB: { step: "INC", register: "reg=1" },
    narration: "Thread B increments its stale register: 0+1=1. (It loaded 0 back in step 2 — it never saw Thread A's write.)",
  },
  {
    count: 1, displayCount: "1 ← WRONG!", countState: "wrong",
    threadA: { step: "done", register: null },
    threadB: { step: "STORE", register: "reg=1" },
    narration: "☠ Thread B STOREs 1 — OVERWRITES Thread A's result. count = 1. We expected 2. One increment is LOST. This is a data race.",
  },
];

const ATOMIC_FRAMES = [
  {
    count: 0, displayCount: "0", countState: "normal",
    threadA: { step: null, register: null },
    threadB: { step: null, register: null },
    narration: "AtomicInteger.incrementAndGet(). Under the hood: a single CAS (Compare-And-Set) hardware instruction — indivisible.",
  },
  {
    count: 1, displayCount: "1", countState: "correct",
    threadA: { step: "CAS", register: "0→1" },
    threadB: { step: null, register: null },
    narration: "Thread A's CAS: 'if count==0, set to 1'. Succeeds atomically. count = 1. No other thread can interleave within this instruction.",
  },
  {
    count: 2, displayCount: "2 ✓", countState: "correct",
    threadA: { step: "done", register: null },
    threadB: { step: "CAS", register: "1→2" },
    narration: "Thread B's CAS: 'if count==1, set to 2'. Succeeds. count = 2. Both increments counted. No lost updates.",
  },
];

function OpStep({ label, register, state }) {
  return (
    <div className={"viz-op-step" +
      (state === "active" ? " viz-op-step--active" :
       state === "done"   ? " viz-op-step--done" :
       state === "wrong"  ? " viz-op-step--wrong" :
       state === "cas"    ? " viz-op-step--cas" : "")
    }>
      <span style={{ fontWeight: 700 }}>{label}</span>
      {register && <span style={{ marginLeft: 8, opacity: 0.75 }}>{register}</span>}
    </div>
  );
}

function getThreadStepState(thread, stepName) {
  if (!thread.step) return "inactive";
  if (thread.step === "done") return stepName === "STORE" || stepName === "CAS" ? "done" : "done";
  if (thread.step === stepName) return "active";
  if (thread.step === "CAS" && stepName === "CAS") return "active";
  const order = ["LOAD", "INC", "STORE"];
  const currentIdx = order.indexOf(thread.step);
  const thisIdx = order.indexOf(stepName);
  if (currentIdx > thisIdx) return "done";
  return "inactive";
}

function RacePanel({ frames, mode }) {
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

  return (
    <div>
      <VizControls
        playing={playing} onPlay={() => setPlaying((p) => !p)}
        onStep={advance} onReset={reset}
        speed={speed} onSpeed={setSpeed}
        step={step} total={frames.length}
      />

      <div className="viz-race-scene">
        {/* Counter */}
        <div className="viz-race-counter-row">
          <div className="viz-counter-box">
            <div className="viz-counter-label">count (shared)</div>
            <div className={"viz-counter-value" +
              (f.countState === "wrong" ? " viz-counter-value--wrong" :
               f.countState === "correct" ? " viz-counter-value--correct" : "")
            }>
              {f.displayCount}
            </div>
          </div>
        </div>

        {/* Thread columns */}
        <div className="viz-race-threads">
          {/* Thread A */}
          <div className="viz-race-thread">
            <div className="viz-race-thread-label" style={{ color: "#6AA8D0" }}>Thread A</div>
            <div className="viz-op-steps">
              {mode === "race" ? (
                <>
                  <OpStep label="LOAD  count→reg" register={f.threadA.step === "LOAD" ? f.threadA.register : null}
                    state={getThreadStepState(f.threadA, "LOAD")} />
                  <OpStep label="INC   reg+1" register={f.threadA.step === "INC" ? f.threadA.register : null}
                    state={getThreadStepState(f.threadA, "INC")} />
                  <OpStep label="STORE reg→count" register={f.threadA.step === "STORE" ? f.threadA.register : null}
                    state={f.threadA.step === "STORE" ? "active" : getThreadStepState(f.threadA, "STORE")} />
                </>
              ) : (
                <OpStep label="CAS  incrementAndGet()"
                  register={f.threadA.register}
                  state={f.threadA.step === "CAS" ? "cas" : f.threadA.step === "done" ? "done" : "inactive"} />
              )}
            </div>
          </div>

          {/* Thread B */}
          <div className="viz-race-thread">
            <div className="viz-race-thread-label" style={{ color: "#E07060" }}>Thread B</div>
            <div className="viz-op-steps">
              {mode === "race" ? (
                <>
                  <OpStep label="LOAD  count→reg"
                    register={f.threadB.step === "LOAD" ? f.threadB.register : null}
                    state={getThreadStepState(f.threadB, "LOAD")} />
                  <OpStep label="INC   reg+1"
                    register={f.threadB.step === "INC" ? f.threadB.register : null}
                    state={getThreadStepState(f.threadB, "INC")} />
                  <OpStep label="STORE reg→count"
                    register={f.threadB.step === "STORE" ? f.threadB.register : null}
                    state={f.threadB.step === "STORE" ? "wrong" : getThreadStepState(f.threadB, "STORE")} />
                </>
              ) : (
                <OpStep label="CAS  incrementAndGet()"
                  register={f.threadB.register}
                  state={f.threadB.step === "CAS" ? "cas" : f.threadB.step === "done" ? "done" : "inactive"} />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="viz-narration">{f.narration}</div>
    </div>
  );
}

export default function RaceConditionViz() {
  const [tab, setTab] = useState("race");
  return (
    <div className="viz-root">
      <div className="viz-jmm-tabs">
        <button className={"viz-jmm-tab" + (tab === "race" ? " viz-jmm-tab--active viz-jmm-tab--bad" : "")} onClick={() => setTab("race")}>
          ☠ Race Condition
        </button>
        <button className={"viz-jmm-tab" + (tab === "atomic" ? " viz-jmm-tab--active viz-jmm-tab--good" : "")} onClick={() => setTab("atomic")}>
          ✓ AtomicInteger
        </button>
      </div>
      <RacePanel key={tab} frames={tab === "race" ? RACE_FRAMES : ATOMIC_FRAMES} mode={tab} />
    </div>
  );
}
