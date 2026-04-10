import React, { useRef, useState } from "react";

const ANIM_MS = 380;
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export function DequeVisualizer() {
  const [deque, setDeque] = useState([6, 3, 8, 1]);
  const [inputVal, setInputVal] = useState("");
  const [animating, setAnimating] = useState(false);
  const [activeIdxSet, setActiveIdxSet] = useState(new Set());
  const [status, setStatus] = useState("Ready — Deque supports O(1) insert/remove at both ends.");
  const [trace, setTrace] = useState([]);
  const [tab, setTab] = useState("deque"); // "deque" | "mono"
  const dequeRef = useRef([6, 3, 8, 1]);

  const sync = arr => { dequeRef.current = [...arr]; setDeque([...arr]); };
  const addTrace = msg => setTrace(p => [...p.slice(-10), msg]);

  const handleAddFirst = async () => {
    const val = Number(inputVal);
    if (inputVal.trim() === "" || isNaN(val)) { setStatus("Enter a valid number."); return; }
    setAnimating(true);
    const arr = [val, ...dequeRef.current];
    sync(arr);
    setActiveIdxSet(new Set([0]));
    setStatus(`addFirst(${val}) — O(1): insert at front.`);
    addTrace(`addFirst(${val})`);
    await sleep(ANIM_MS);
    setActiveIdxSet(new Set());
    setInputVal("");
    setAnimating(false);
  };

  const handleAddLast = async () => {
    const val = Number(inputVal);
    if (inputVal.trim() === "" || isNaN(val)) { setStatus("Enter a valid number."); return; }
    setAnimating(true);
    const arr = [...dequeRef.current, val];
    sync(arr);
    setActiveIdxSet(new Set([arr.length - 1]));
    setStatus(`addLast(${val}) — O(1): insert at rear.`);
    addTrace(`addLast(${val})`);
    await sleep(ANIM_MS);
    setActiveIdxSet(new Set());
    setInputVal("");
    setAnimating(false);
  };

  const handleRemoveFirst = async () => {
    if (!dequeRef.current.length) { setStatus("Deque is empty."); return; }
    setAnimating(true);
    const front = dequeRef.current[0];
    setActiveIdxSet(new Set([0]));
    setStatus(`removeFirst() = ${front} — O(1): remove front.`);
    addTrace(`removeFirst() = ${front}`);
    await sleep(ANIM_MS);
    const arr = dequeRef.current.slice(1);
    sync(arr);
    setActiveIdxSet(new Set());
    setAnimating(false);
  };

  const handleRemoveLast = async () => {
    if (!dequeRef.current.length) { setStatus("Deque is empty."); return; }
    setAnimating(true);
    const rear = dequeRef.current[dequeRef.current.length - 1];
    setActiveIdxSet(new Set([dequeRef.current.length - 1]));
    setStatus(`removeLast() = ${rear} — O(1): remove rear.`);
    addTrace(`removeLast() = ${rear}`);
    await sleep(ANIM_MS);
    const arr = dequeRef.current.slice(0, -1);
    sync(arr);
    setActiveIdxSet(new Set());
    setAnimating(false);
  };

  // Monotonic deque demo — sliding window maximum with k=3
  const [monoDeque, setMonoDeque] = useState([]);
  const [monoStep, setMonoStep] = useState(0);
  const [monoResults, setMonoResults] = useState([]);
  const monoArr = [2, 1, 5, 3, 6, 4, 8, 7];
  const K = 3;

  const runMonoStep = async () => {
    if (monoStep >= monoArr.length) {
      setStatus("Sliding window max demo done. Click Reset to replay.");
      return;
    }
    setAnimating(true);
    const i = monoStep;
    const val = monoArr[i];
    let dq = [...monoDeque];

    // Remove indices out of window
    while (dq.length && dq[0] < i - K + 1) dq.shift();
    // Remove smaller from back (monotonic decreasing)
    while (dq.length && monoArr[dq[dq.length - 1]] <= val) dq.pop();
    dq.push(i);
    setMonoDeque([...dq]);

    let res = [...monoResults];
    if (i >= K - 1) {
      const maxVal = monoArr[dq[0]];
      res.push(maxVal);
      setMonoResults([...res]);
      setStatus(`Window [${i - K + 1}…${i}] = [${monoArr.slice(i - K + 1, i + 1).join(",")}]  max = ${maxVal}`);
      addTrace(`window [${i-K+1}..${i}] max=${maxVal}`);
    } else {
      setStatus(`Building window… added ${val} at index ${i}. Deque: [${dq.map(x => monoArr[x]).join(",")}]`);
    }
    setMonoStep(i + 1);
    await sleep(ANIM_MS);
    setAnimating(false);
  };

  const resetMono = () => {
    setMonoDeque([]); setMonoStep(0); setMonoResults([]);
    setStatus("Monotonic Deque demo reset. Press Step to advance.");
    setTrace([]);
  };

  return (
    <div className="deque-viz">
      <div className="deque-viz-header">
        <h4>Deque / Monotonic Queue Visualizer</h4>
        <span>ArrayDeque — O(1) all ends</span>
      </div>

      <div className="deque-tabs">
        <button className={`mode-btn ${tab === "deque" ? "active" : ""}`} onClick={() => setTab("deque")}>Deque Ops</button>
        <button className={`mode-btn ${tab === "mono" ? "active" : ""}`} onClick={() => setTab("mono")}>Sliding Window Max</button>
      </div>

      {tab === "deque" && (
        <>
          <div className="deque-viz-controls">
            <input className="text-input" placeholder="value" value={inputVal}
              onChange={e => setInputVal(e.target.value)} disabled={animating} />
            <button className="ghost-btn" onClick={handleAddFirst} disabled={animating}>addFirst</button>
            <button className="ghost-btn" onClick={handleAddLast} disabled={animating}>addLast</button>
            <button className="ghost-btn" onClick={handleRemoveFirst} disabled={animating || !deque.length}>removeFirst</button>
            <button className="ghost-btn" onClick={handleRemoveLast} disabled={animating || !deque.length}>removeLast</button>
          </div>

          <p className="deque-viz-status">{status}</p>

          <div className="deque-track-wrap">
            <div className="deque-track">
              {deque.length === 0 ? (
                <div className="queue-empty-msg">Deque is empty</div>
              ) : (
                deque.map((v, i) => {
                  const isFront = i === 0;
                  const isRear = i === deque.length - 1;
                  return (
                    <div key={`${i}-${v}-${deque.length}`} className="deque-cell-column">
                      <div className="deque-tag-row" aria-hidden={!isFront && !isRear}>
                        {isFront ? <span className="deque-end-tag">front</span> : null}
                        {isRear ? <span className="deque-end-tag deque-end-tag-rear">rear</span> : null}
                      </div>
                      <div
                        className={`deque-cell ${activeIdxSet.has(i) ? "active" : ""} ${isFront ? "front" : ""} ${isRear ? "rear" : ""}`}
                      >
                        {v}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {tab === "mono" && (
        <>
          <p className="deque-viz-status">{status}</p>
          <div className="mono-array-row">
            <span className="mono-label">Array:</span>
            {monoArr.map((v, i) => (
              <div key={i} className={`mono-cell ${i < monoStep ? "used" : ""} ${i === monoStep - 1 ? "current" : ""}`}>
                <div className="mono-cell-val">{v}</div>
                <div className="mono-cell-idx">{i}</div>
              </div>
            ))}
          </div>
          <div className="mono-deque-row">
            <span className="mono-label">Deque (indices):</span>
            <div className="deque-track mono">
              {monoDeque.length === 0
                ? <span className="muted" style={{ padding: "0 8px" }}>empty</span>
                : monoDeque.map((idx, i) => (
                  <div key={i} className="deque-cell active">
                    [{idx}]={monoArr[idx]}
                  </div>
                ))
              }
            </div>
          </div>
          <div className="mono-results-row">
            <span className="mono-label">Max per window (k={K}):</span>
            {monoResults.map((v, i) => (
              <span key={i} className="mono-result-chip">{v}</span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="ghost-btn" onClick={runMonoStep} disabled={animating || monoStep >= monoArr.length}>Step →</button>
            <button className="ghost-btn" onClick={resetMono} disabled={animating}>Reset</button>
          </div>
        </>
      )}

      <div className="array-explain">
        <h5>Key concepts</h5>
        <ol>
          <li><strong>Deque</strong>: double-ended queue — O(1) add/remove at both front and rear.</li>
          <li><strong>Monotonic Deque</strong>: maintains a decreasing sequence to answer "window maximum" in O(1).</li>
          <li>When a new element arrives, pop all smaller elements from the back.</li>
          <li>Pop from front when the front index is outside the current window.</li>
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
