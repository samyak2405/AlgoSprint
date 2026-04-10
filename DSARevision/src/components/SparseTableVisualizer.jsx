import React, { useState } from "react";

const ANIM_MS = 380;
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const INIT_ARR = [3, 7, 2, 5, 9, 1, 8, 4];

function buildST(arr) {
  const n = arr.length;
  const LOG = Math.floor(Math.log2(n)) + 1;
  const st = Array.from({ length: LOG }, () => new Array(n).fill(Infinity));
  for (let i = 0; i < n; i++) st[0][i] = arr[i];
  for (let k = 1; k < LOG; k++) {
    for (let i = 0; i + (1 << k) <= n; i++) {
      st[k][i] = Math.min(st[k - 1][i], st[k - 1][i + (1 << (k - 1))]);
    }
  }
  return { st, LOG };
}

function rmq(st, lg, l, r) {
  const k = Math.floor(Math.log2(r - l + 1));
  const leftBlock = { k, start: l, end: l + (1 << k) - 1 };
  const rightBlock = { k, start: r - (1 << k) + 1, end: r };
  return {
    result: Math.min(st[k][l], st[k][r - (1 << k) + 1]),
    leftBlock,
    rightBlock,
  };
}

export function SparseTableVisualizer() {
  const [arr] = useState([...INIT_ARR]);
  const { st, LOG } = buildST(arr);
  const [ql, setQL] = useState("");
  const [qr, setQR] = useState("");
  const [animating, setAnimating] = useState(false);
  const [leftBlock, setLeftBlock] = useState(null);
  const [rightBlock, setRightBlock] = useState(null);
  const [activeCell, setActiveCell] = useState(null); // {k, i}
  const [queryResult, setQueryResult] = useState(null);
  const [status, setStatus] = useState("Ready — Sparse Table for O(1) range minimum query (RMQ).");
  const [trace, setTrace] = useState([]);

  const addTrace = msg => setTrace(p => [...p.slice(-10), msg]);
  const N = arr.length;

  const handleQuery = async () => {
    const l = Number(ql), r = Number(qr);
    if (isNaN(l) || isNaN(r) || l < 0 || r > N - 1 || l > r) {
      setStatus(`l and r must satisfy 0 ≤ l ≤ r ≤ ${N - 1}.`); return;
    }
    setAnimating(true);
    const k = Math.floor(Math.log2(r - l + 1));
    const lb = { k, start: l, end: l + (1 << k) - 1 };
    const rb = { k, start: r - (1 << k) + 1, end: r };

    setStatus(`RMQ(${l}, ${r}): k = floor(log₂(${r - l + 1})) = ${k}`);
    addTrace(`RMQ(${l},${r}) k=${k}`);
    await sleep(ANIM_MS);

    setActiveCell({ k, i: l });
    setLeftBlock(lb);
    setStatus(`Left block: st[${k}][${l}] covers [${lb.start}..${lb.end}] = ${st[k][l]}`);
    await sleep(ANIM_MS * 1.2);

    setActiveCell({ k, i: r - (1 << k) + 1 });
    setRightBlock(rb);
    setStatus(`Right block: st[${k}][${r - (1 << k) + 1}] covers [${rb.start}..${rb.end}] = ${st[k][r - (1 << k) + 1]}`);
    await sleep(ANIM_MS * 1.2);

    const { result } = rmq(st, LOG, l, r);
    setQueryResult(result);
    setStatus(`RMQ(${l}, ${r}) = min(${st[k][l]}, ${st[k][r - (1 << k) + 1]}) = ${result}`);
    addTrace(`RMQ(${l},${r}) = ${result}`);
    await sleep(ANIM_MS * 2);

    setLeftBlock(null); setRightBlock(null);
    setActiveCell(null); setQueryResult(null);
    setQL(""); setQR("");
    setAnimating(false);
  };

  const isCellInBlock = (k, i, block) => {
    if (!block || block.k !== k) return false;
    return i >= block.start && i <= block.end;
  };

  return (
    <div className="sparse-viz">
      <div className="sparse-viz-header">
        <h4>Sparse Table Visualizer (Range Min Query)</h4>
        <span>O(n log n) build · O(1) query</span>
      </div>

      <div className="sparse-controls-row">
        <span className="seg-ctrl-label">RMQ</span>
        <input className="text-input seg-input" placeholder={`l (0–${N - 1})`} value={ql}
          onChange={e => setQL(e.target.value)} disabled={animating} />
        <input className="text-input seg-input" placeholder={`r (0–${N - 1})`} value={qr}
          onChange={e => setQR(e.target.value)} disabled={animating} />
        <button className="ghost-btn" onClick={handleQuery} disabled={animating}>min(l, r)</button>
      </div>

      {queryResult !== null && (
        <div className="seg-result-banner">Min = {queryResult}</div>
      )}
      <p className="sparse-viz-status">{status}</p>

      {/* Input array */}
      <div className="fen-section-label">Input array (0-indexed, immutable)</div>
      <div className="fen-array-row">
        {arr.map((v, i) => {
          const inLeft  = leftBlock  && i >= leftBlock.start  && i <= leftBlock.end;
          const inRight = rightBlock && i >= rightBlock.start && i <= rightBlock.end;
          const cls = inLeft && inRight ? "overlap" : inLeft ? "left-block" : inRight ? "right-block" : "";
          return (
            <div key={i} className={`fen-cell ${cls}`}>
              <div className="fen-cell-val">{v}</div>
              <div className="fen-cell-idx">{i}</div>
            </div>
          );
        })}
      </div>

      {/* Sparse Table */}
      <div className="fen-section-label">st[k][i] — min of 2ᵏ elements starting at i</div>
      <div className="sparse-table-wrap">
        <table className="sparse-table">
          <thead>
            <tr>
              <th className="sparse-th-k">k \ i</th>
              {arr.map((_, i) => <th key={i} className="sparse-th">{i}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: LOG }, (_, k) => (
              <tr key={k}>
                <td className="sparse-td-k">k={k} (2ᵏ={1 << k})</td>
                {arr.map((_, i) => {
                  const valid = i + (1 << k) <= N;
                  const isLeftActive  = isCellInBlock(k, i, leftBlock)  && activeCell?.k === k && activeCell?.i === i;
                  const isRightActive = isCellInBlock(k, i, rightBlock) && activeCell?.k === k && activeCell?.i === (qr - (1 << k) + 1 | 0);
                  const isActive = activeCell && activeCell.k === k && activeCell.i === i;
                  return (
                    <td key={i} className={`sparse-td ${!valid ? "sparse-td-invalid" : ""} ${isActive ? "active" : ""}`}>
                      {valid ? st[k][i] : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sparse-legend">
        <span className="sparse-legend-item left-block">Left block</span>
        <span className="sparse-legend-item right-block">Right block</span>
        <span className="sparse-legend-item overlap">Overlap (O(1) ok — idempotent min)</span>
      </div>

      <div className="array-explain">
        <h5>How Sparse Table works</h5>
        <ol>
          <li><strong>Build</strong> — O(n log n): st[k][i] = min of 2ᵏ elements starting at i. Fill bottom-up: st[k][i] = min(st[k-1][i], st[k-1][i+2ᵏ⁻¹]).</li>
          <li><strong>RMQ(l, r)</strong> — O(1): choose k = ⌊log₂(r−l+1)⌋, then min(st[k][l], st[k][r−2ᵏ+1]).</li>
          <li>The two length-2ᵏ blocks overlap — that's fine because <strong>min is idempotent</strong> (overlapping elements don't double-count).</li>
          <li><strong>No updates</strong> — array must be static. Use Segment Tree for mutable arrays.</li>
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
