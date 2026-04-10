import React, { useRef, useState } from "react";

const ANIM_MS = 380;
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export function QueueVisualizer() {
  const [queue, setQueue] = useState([5, 12, 3]);
  const [inputVal, setInputVal] = useState("");
  const [animating, setAnimating] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [status, setStatus] = useState("Ready — Queue: FIFO (First In, First Out)");
  const [trace, setTrace] = useState([]);
  const qRef = useRef([5, 12, 3]);

  const sync = arr => { qRef.current = [...arr]; setQueue([...arr]); };
  const addTrace = msg => setTrace(p => [...p.slice(-10), msg]);

  const handleOffer = async () => {
    const val = Number(inputVal);
    if (inputVal.trim() === "" || isNaN(val)) { setStatus("Enter a valid number."); return; }
    setAnimating(true);
    const arr = [...qRef.current, val];
    sync(arr);
    setActiveIdx(arr.length - 1);
    setStatus(`offer(${val}) — O(1): enqueue at rear. size = ${arr.length}`);
    addTrace(`offer(${val}) → rear`);
    await sleep(ANIM_MS);
    setActiveIdx(-1);
    setInputVal("");
    setAnimating(false);
  };

  const handlePoll = async () => {
    if (!qRef.current.length) { setStatus("Queue is empty — cannot poll."); return; }
    setAnimating(true);
    const arr = [...qRef.current];
    const front = arr[0];
    setActiveIdx(0);
    setStatus(`poll() = ${front} — O(1): dequeue from front. size will be ${arr.length - 1}`);
    addTrace(`poll() = ${front} ← front`);
    await sleep(ANIM_MS);
    arr.shift();
    sync(arr);
    setActiveIdx(-1);
    setAnimating(false);
  };

  const handlePeek = async () => {
    if (!qRef.current.length) { setStatus("Queue is empty."); return; }
    setAnimating(true);
    setActiveIdx(0);
    setStatus(`peek() = ${qRef.current[0]} — O(1): read front without removing.`);
    addTrace(`peek() = ${qRef.current[0]}`);
    await sleep(ANIM_MS * 2);
    setActiveIdx(-1);
    setAnimating(false);
  };

  const handleReset = () => {
    if (animating) return;
    sync([5, 12, 3]);
    setActiveIdx(-1); setInputVal("");
    setStatus("Reset."); setTrace([]);
  };

  return (
    <div className="queue-viz">
      <div className="queue-viz-header">
        <h4>Queue (ArrayDeque) Visualizer</h4>
        <span>size = {queue.length}</span>
      </div>

      <div className="queue-viz-controls">
        <input className="text-input" placeholder="value" value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !animating && handleOffer()}
          disabled={animating} />
        <button className="ghost-btn" onClick={handleOffer} disabled={animating}>offer (enqueue)</button>
        <button className="ghost-btn" onClick={handlePoll} disabled={animating || !queue.length}>poll (dequeue)</button>
        <button className="ghost-btn" onClick={handlePeek} disabled={animating || !queue.length}>peek</button>
        <button className="ghost-btn" onClick={handleReset} disabled={animating}>Reset</button>
      </div>

      <p className="queue-viz-status">{status}</p>

      <div className="queue-track-wrap">
        <div className="queue-label-row">
          <span className="queue-end-label">FRONT (poll)</span>
          <span className="queue-end-label rear">REAR (offer)</span>
        </div>
        <div className="queue-track">
          <div className="queue-arrow-in">→</div>
          {queue.length === 0 ? (
            <div className="queue-empty-msg">Queue is empty</div>
          ) : (
            queue.map((v, i) => (
              <div key={`${v}-${i}`}
                className={`queue-cell ${i === activeIdx ? "active" : ""} ${i === 0 ? "front" : ""} ${i === queue.length - 1 ? "rear" : ""}`}>
                {v}
              </div>
            ))
          )}
          <div className="queue-arrow-out">→</div>
        </div>
      </div>

      <div className="array-explain">
        <h5>FIFO behaviour</h5>
        <ol>
          <li><strong>offer(x)</strong> — O(1): enqueue at rear.</li>
          <li><strong>poll()</strong> — O(1): dequeue from front.</li>
          <li><strong>peek()</strong> — O(1): read front without removing.</li>
          <li>Classic uses: BFS, task scheduling, print queues, level-order traversal.</li>
        </ol>
        <h5>Operation trace</h5>
        <div className="array-trace">
          {trace.length ? trace.map((l, i) => <div key={i} className="array-trace-line">{l}</div>)
            : <div className="array-trace-line muted">No operations yet.</div>}
        </div>
      </div>
    </div>
  );
}
