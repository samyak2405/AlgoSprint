import React, { useState, useEffect, useCallback } from "react";
import VizControls from "../components/VizControls.jsx";

// Queue capacity = 3 slots
const FRAMES = [
  {
    queue: [],
    producer: "idle", consumer: "idle",
    produced: null, consumed: null,
    producerMsg: "idle",
    consumerMsg: "idle",
    narration: "Bounded buffer (capacity = 3). Producer puts items; Consumer takes items. If queue is FULL, producer waits. If queue is EMPTY, consumer waits.",
  },
  {
    queue: ["T1"],
    producer: "producing", consumer: "idle",
    produced: "T1", consumed: null,
    producerMsg: "put(T1) ✓",
    consumerMsg: "idle",
    narration: "Producer puts Task 1 into the queue (size: 1/3). Consumer is idle.",
  },
  {
    queue: ["T1", "T2"],
    producer: "producing", consumer: "idle",
    produced: "T2", consumed: null,
    producerMsg: "put(T2) ✓",
    consumerMsg: "idle",
    narration: "Producer puts Task 2 (size: 2/3). Queue has room, no blocking.",
  },
  {
    queue: ["T1", "T2", "T3"],
    producer: "producing", consumer: "consuming",
    produced: "T3", consumed: "T1",
    producerMsg: "put(T3) ✓",
    consumerMsg: "take() → T1",
    narration: "Producer puts Task 3 — queue now FULL (3/3). Consumer wakes and takes T1.",
  },
  {
    queue: ["T2", "T3"],
    producer: "blocked", consumer: "consuming",
    produced: null, consumed: "T1",
    producerMsg: "⏳ await notFull",
    consumerMsg: "processing T1",
    narration: "Producer tries to put T4 but queue is FULL → blocks on notFull condition. Consumer finishes T1.",
  },
  {
    queue: ["T2", "T3", "T4"],
    producer: "producing", consumer: "consuming",
    produced: "T4", consumed: "T2",
    producerMsg: "put(T4) ✓ (signaled)",
    consumerMsg: "take() → T2",
    narration: "Consumer took T2 → signals notFull. Producer unblocks, puts T4. Consumer takes T2.",
  },
  {
    queue: ["T3", "T4"],
    producer: "idle", consumer: "consuming",
    produced: null, consumed: "T2",
    producerMsg: "idle",
    consumerMsg: "processing T2",
    narration: "Producer is now idle. Consumer drains the queue — T3 and T4 remain.",
  },
  {
    queue: [],
    producer: "idle", consumer: "blocked",
    produced: null, consumed: null,
    producerMsg: "idle",
    consumerMsg: "⏳ await notEmpty",
    narration: "Consumer empties the queue and tries to take again → blocks on notEmpty. Producer is idle. Steady state.",
  },
];

const CAPACITY = 3;

function QueueSlot({ item, isNew, isLeaving }) {
  return (
    <div className={"viz-queue-slot" +
      (item ? " viz-queue-slot--filled" : "") +
      (isNew ? " viz-queue-slot--new" : "") +
      (isLeaving ? " viz-queue-slot--leaving" : "")
    }>
      {item || ""}
    </div>
  );
}

export default function ProducerConsumerViz() {
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
  const f = FRAMES[step];
  const prev = step > 0 ? FRAMES[step - 1] : null;

  const newItem = prev && f.queue.length > prev.queue.length ? f.queue[f.queue.length - 1] : null;
  const leftItem = prev && f.queue.length < prev.queue.length ? prev.queue[0] : null;

  // Build display slots
  const slots = Array.from({ length: CAPACITY }, (_, i) => f.queue[i] || null);

  return (
    <div className="viz-root">
      <VizControls
        playing={playing} onPlay={() => setPlaying((p) => !p)}
        onStep={advance} onReset={reset}
        speed={speed} onSpeed={setSpeed}
        step={step} total={FRAMES.length}
      />

      <div className="viz-pc-scene">
        {/* Producer */}
        <div className={"viz-pc-actor" +
          (f.producer === "producing" ? " viz-pc-actor--active" :
           f.producer === "blocked" ? " viz-pc-actor--blocked" : "")
        }>
          <div className="viz-pc-actor-label" style={{ color: "#6AA8D0" }}>Producer</div>
          <div className="viz-pc-actor-status">{f.producerMsg}</div>
          {f.producer === "blocked" && <div className="viz-blocked-tag">BLOCKED</div>}
        </div>

        {/* Arrow producer → queue */}
        <div className="viz-pc-arrow">
          {f.producer === "producing" && (
            <svg width="40" height="20" viewBox="0 0 40 20">
              <defs>
                <marker id="pc-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <polygon points="0 0, 6 3, 0 6" fill="#6AA8D0" />
                </marker>
              </defs>
              <line x1="2" y1="10" x2="34" y2="10" stroke="#6AA8D0" strokeWidth="2" markerEnd="url(#pc-arr)" />
            </svg>
          )}
        </div>

        {/* Queue */}
        <div className="viz-pc-queue">
          <div className="viz-pc-queue-label">Buffer ({f.queue.length}/{CAPACITY})</div>
          <div className="viz-pc-queue-slots">
            {slots.map((item, i) => (
              <QueueSlot
                key={i}
                item={item}
                isNew={item === newItem && item !== null}
                isLeaving={false}
              />
            ))}
          </div>
          <div className="viz-pc-queue-bar">
            <div
              className="viz-pc-queue-fill"
              style={{ width: `${(f.queue.length / CAPACITY) * 100}%`,
                background: f.queue.length === CAPACITY ? "#E07060" :
                            f.queue.length === 0 ? "#D4A020" : "#4ADE80" }}
            />
          </div>
          {f.queue.length === CAPACITY && <div style={{ fontSize: 10, color: "#E07060", marginTop: 4, textAlign: "center" }}>FULL</div>}
          {f.queue.length === 0 && <div style={{ fontSize: 10, color: "#D4A020", marginTop: 4, textAlign: "center" }}>EMPTY</div>}
        </div>

        {/* Arrow queue → consumer */}
        <div className="viz-pc-arrow">
          {f.consumer === "consuming" && (
            <svg width="40" height="20" viewBox="0 0 40 20">
              <defs>
                <marker id="pc-arr2" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <polygon points="0 0, 6 3, 0 6" fill="#E07060" />
                </marker>
              </defs>
              <line x1="2" y1="10" x2="34" y2="10" stroke="#E07060" strokeWidth="2" markerEnd="url(#pc-arr2)" />
            </svg>
          )}
        </div>

        {/* Consumer */}
        <div className={"viz-pc-actor" +
          (f.consumer === "consuming" ? " viz-pc-actor--consuming" :
           f.consumer === "blocked" ? " viz-pc-actor--blocked" : "")
        }>
          <div className="viz-pc-actor-label" style={{ color: "#E07060" }}>Consumer</div>
          <div className="viz-pc-actor-status">{f.consumerMsg}</div>
          {f.consumer === "blocked" && <div className="viz-blocked-tag">BLOCKED</div>}
        </div>
      </div>

      <div className="viz-narration">{f.narration}</div>
    </div>
  );
}
