import React, { useRef, useState } from "react";

const ANIM_MS = 400;
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const INIT_VALS = [3, 2, 5, 4, 7, 1, 6, 3]; // 1-indexed values → index 0 unused

function buildBIT(vals) {
  const n = vals.length;
  const bit = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    let j = i;
    while (j <= n) {
      bit[j] += vals[i - 1];
      j += j & -j;
    }
  }
  return bit;
}

function bitCoverage(i, n) {
  // Returns the range [i - lowbit(i) + 1, i] that BIT[i] covers
  const low = i & -i;
  return { lo: i - low + 1, hi: i };
}

export function FenwickTreeVisualizer() {
  const [vals, setVals] = useState([...INIT_VALS]);
  const [bit, setBIT] = useState(() => buildBIT(INIT_VALS));
  const [idxInput, setIdxInput] = useState("");
  const [deltaInput, setDeltaInput] = useState("");
  const [ql, setQL] = useState("");
  const [qr, setQR] = useState("");
  const [animating, setAnimating] = useState(false);
  const [activeSet, setActiveSet] = useState(new Set());  // 1-indexed BIT cells
  const [queryRange, setQueryRange] = useState(null);     // {l, r} array highlight
  const [status, setStatus] = useState("Ready — Fenwick Tree (BIT) for prefix sums.");
  const [trace, setTrace] = useState([]);
  const stateRef = useRef({ vals: [...INIT_VALS], bit: buildBIT(INIT_VALS) });

  const addTrace = msg => setTrace(p => [...p.slice(-10), msg]);
  const N = vals.length;

  // Prefix sum [1..i] using BIT
  const queryPrefix = (b, i) => {
    let s = 0;
    while (i > 0) { s += b[i]; i -= i & -i; }
    return s;
  };

  const handleUpdate = async () => {
    const idx = Number(idxInput);   // 1-indexed
    const delta = Number(deltaInput);
    if (isNaN(idx) || idx < 1 || idx > N) { setStatus(`Index must be 1–${N}.`); return; }
    if (isNaN(delta) || deltaInput.trim() === "") { setStatus("Enter a delta value."); return; }
    setAnimating(true);

    const newVals = [...stateRef.current.vals];
    newVals[idx - 1] += delta;
    const touched = [];
    let j = idx;
    while (j <= N) { touched.push(j); j += j & -j; }

    setStatus(`update(${idx}, ${delta > 0 ? "+" : ""}${delta}): propagating up BIT cells [${touched.join(" → ")}]`);
    addTrace(`update(${idx}, ${delta > 0 ? "+" : ""}${delta})`);

    for (let k = 0; k < touched.length; k++) {
      setActiveSet(new Set(touched.slice(0, k + 1)));
      await sleep(ANIM_MS);
    }

    const newBIT = buildBIT(newVals);
    stateRef.current = { vals: newVals, bit: newBIT };
    setVals(newVals);
    setBIT(newBIT);
    setStatus(`Done — a[${idx}] = ${newVals[idx - 1]}, ${touched.length} BIT cell${touched.length > 1 ? "s" : ""} updated.`);
    await sleep(ANIM_MS * 0.5);
    setActiveSet(new Set());
    setIdxInput(""); setDeltaInput("");
    setAnimating(false);
  };

  const handleRangeSum = async () => {
    const l = Number(ql), r = Number(qr);
    if (isNaN(l) || isNaN(r) || l < 1 || r > N || l > r) {
      setStatus(`l and r must satisfy 1 ≤ l ≤ r ≤ ${N}.`); return;
    }
    setAnimating(true);
    setQueryRange({ l, r });

    // Collect BIT cells traversed
    const rightCells = [], leftCells = [];
    let ir = r;
    while (ir > 0) { rightCells.push(ir); ir -= ir & -ir; }
    let il = l - 1;
    while (il > 0) { leftCells.push(il); il -= il & -il; }

    setStatus(`rangeSum(${l}, ${r}): prefix(${r}) − prefix(${l-1})`);
    addTrace(`rangeSum(${l},${r})`);

    // Animate right prefix
    for (let k = 0; k < rightCells.length; k++) {
      setActiveSet(new Set(rightCells.slice(0, k + 1)));
      await sleep(ANIM_MS);
    }
    const sumR = queryPrefix(stateRef.current.bit, r);
    const sumL = queryPrefix(stateRef.current.bit, l - 1);
    setStatus(`prefix(${r})=${sumR} − prefix(${l-1})=${sumL} = ${sumR - sumL}`);
    addTrace(`rangeSum(${l},${r}) = ${sumR - sumL}`);
    await sleep(ANIM_MS * 1.5);
    setActiveSet(new Set());
    setQueryRange(null);
    setAnimating(false);
  };

  const handleReset = () => {
    if (animating) return;
    const b = buildBIT(INIT_VALS);
    stateRef.current = { vals: [...INIT_VALS], bit: b };
    setVals([...INIT_VALS]);
    setBIT(b);
    setActiveSet(new Set());
    setQueryRange(null);
    setIdxInput(""); setDeltaInput(""); setQL(""); setQR("");
    setStatus("Reset to default array."); setTrace([]);
  };

  return (
    <div className="fen-viz">
      <div className="fen-viz-header">
        <h4>Fenwick Tree (BIT) Visualizer</h4>
        <span>O(log n) update &amp; prefix query</span>
      </div>

      {/* Controls */}
      <div className="fen-controls-block">
        <div className="fen-controls-row">
          <span className="fen-ctrl-label">Point update</span>
          <input className="text-input fen-input" placeholder="index (1–8)" value={idxInput}
            onChange={e => setIdxInput(e.target.value)} disabled={animating} />
          <input className="text-input fen-input" placeholder="delta (±)" value={deltaInput}
            onChange={e => setDeltaInput(e.target.value)} disabled={animating} />
          <button className="ghost-btn" onClick={handleUpdate} disabled={animating}>update(i, δ)</button>
        </div>
        <div className="fen-controls-row">
          <span className="fen-ctrl-label">Range sum</span>
          <input className="text-input fen-input" placeholder="l" value={ql}
            onChange={e => setQL(e.target.value)} disabled={animating} />
          <input className="text-input fen-input" placeholder="r" value={qr}
            onChange={e => setQR(e.target.value)} disabled={animating} />
          <button className="ghost-btn" onClick={handleRangeSum} disabled={animating}>sum(l, r)</button>
          <button className="ghost-btn" onClick={handleReset} disabled={animating}>Reset</button>
        </div>
      </div>

      <p className="fen-viz-status">{status}</p>

      {/* Input array */}
      <div className="fen-section-label">Input array a[] (1-indexed)</div>
      <div className="fen-array-row">
        {vals.map((v, i) => {
          const inQuery = queryRange && i + 1 >= queryRange.l && i + 1 <= queryRange.r;
          return (
            <div key={i} className={`fen-cell ${inQuery ? "query" : ""}`}>
              <div className="fen-cell-val">{v}</div>
              <div className="fen-cell-idx">{i + 1}</div>
            </div>
          );
        })}
      </div>

      {/* BIT array with coverage bars */}
      <div className="fen-section-label">BIT[] — each cell covers a range of the array</div>
      <div className="fen-bit-grid">
        {Array.from({ length: N }, (_, i) => {
          const bitIdx = i + 1;
          const { lo, hi } = bitCoverage(bitIdx, N);
          const lowBit = bitIdx & -bitIdx;
          const isActive = activeSet.has(bitIdx);
          return (
            <div key={bitIdx} className={`fen-bit-row ${isActive ? "active" : ""}`}>
              <div className="fen-bit-idx">[{bitIdx}]</div>
              <div className="fen-bit-val">{bit[bitIdx]}</div>
              <div className="fen-bit-bar-wrap">
                <div
                  className={`fen-bit-bar ${isActive ? "active" : ""}`}
                  style={{
                    marginLeft: `${((lo - 1) / N) * 100}%`,
                    width: `${(lowBit / N) * 100}%`,
                  }}
                />
              </div>
              <div className="fen-bit-range">[{lo}..{hi}]</div>
            </div>
          );
        })}
      </div>

      <div className="array-explain">
        <h5>How BIT works</h5>
        <ol>
          <li><strong>lowBit(i) = i &amp; -i</strong> — the range width stored at BIT[i] is exactly lowBit(i).</li>
          <li><strong>update(i, δ)</strong> — O(log n): add δ to BIT[i], jump to next responsible cell via i += lowBit(i).</li>
          <li><strong>prefix(i)</strong> — O(log n): accumulate BIT[i], jump back via i -= lowBit(i).</li>
          <li><strong>rangeSum(l, r)</strong> = prefix(r) − prefix(l−1).</li>
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
