import React, { useRef, useState } from "react";

const ANIM_MS = 420;
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ── min-heap helpers ─────────────────────────────────────────── */
function minHeapPush(h, v) {
  const a = [...h, v];
  let i = a.length - 1;
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (a[p] <= a[i]) break;
    [a[p], a[i]] = [a[i], a[p]];
    i = p;
  }
  return a;
}
function minHeapPop(h) {
  if (!h.length) return { val: undefined, heap: [] };
  const val = h[0];
  const a = [...h];
  const last = a.pop();
  if (!a.length) return { val, heap: [] };
  a[0] = last;
  let i = 0;
  while (true) {
    const l = i * 2 + 1, r = i * 2 + 2;
    let best = i;
    if (l < a.length && a[l] < a[best]) best = l;
    if (r < a.length && a[r] < a[best]) best = r;
    if (best === i) break;
    [a[i], a[best]] = [a[best], a[i]];
    i = best;
  }
  return { val, heap: a };
}

/* ── max-heap helpers (negate internally) ─────────────────────── */
function maxHeapPush(h, v)  { return minHeapPush(h.map(x => -x), -v).map(x => -x); }
function maxHeapPop(h) {
  const negH = h.map(x => -x);
  const { val, heap } = minHeapPop(negH);
  return { val: val === undefined ? undefined : -val, heap: heap.map(x => -x) };
}
function maxHeapPeek(h) { return h.length ? h[0] : undefined; }
function minHeapPeek(h) { return h.length ? h[0] : undefined; }

/* ── SVG heap layout ──────────────────────────────────────────── */
function heapLayout(arr, maxNodes = 15) {
  const nodes = [], edges = [];
  const display = arr.slice(0, maxNodes);
  display.forEach((v, i) => {
    const depth = Math.floor(Math.log2(i + 1));
    const levelStart = Math.pow(2, depth) - 1;
    const posInLevel = i - levelStart;
    const levelCount = Math.pow(2, depth);
    const w = 260;
    const x = (w / (levelCount + 1)) * (posInLevel + 1);
    const y = depth * 52 + 26;
    nodes.push({ i, v, x, y });
    if (i > 0) {
      const p = (i - 1) >> 1;
      edges.push({ x1: nodes[p].x, y1: nodes[p].y, x2: x, y2: y });
    }
  });
  return { nodes, edges };
}

export function TwoHeapsVisualizer() {
  // lo = max-heap (lower half), hi = min-heap (upper half)
  const [lo, setLo] = useState([]);  // max-heap
  const [hi, setHi] = useState([]);  // min-heap
  const [inputVal, setInputVal] = useState("");
  const [animating, setAnimating] = useState(false);
  const [loActive, setLoActive] = useState(new Set());
  const [hiActive, setHiActive] = useState(new Set());
  const [median, setMedian] = useState(null);
  const [status, setStatus] = useState("Ready — add numbers to maintain a running median.");
  const [trace, setTrace] = useState([]);
  const stateRef = useRef({ lo: [], hi: [] });

  const addTrace = msg => setTrace(p => [...p.slice(-10), msg]);

  const computeMedian = (lo, hi) => {
    if (!lo.length && !hi.length) return null;
    if (lo.length === hi.length) return (maxHeapPeek(lo) + minHeapPeek(hi)) / 2;
    return lo.length > hi.length ? maxHeapPeek(lo) : minHeapPeek(hi);
  };

  const handleAdd = async () => {
    const val = Number(inputVal);
    if (inputVal.trim() === "" || isNaN(val)) { setStatus("Enter a valid number."); return; }
    setAnimating(true);
    let { lo: cLo, hi: cHi } = stateRef.current;

    // Step 1: route to lo or hi
    setStatus(`addNum(${val}): comparing with lo.peek() = ${maxHeapPeek(cLo) ?? "—"}`);
    await sleep(ANIM_MS * 0.8);

    if (!cLo.length || val <= maxHeapPeek(cLo)) {
      cLo = maxHeapPush(cLo, val);
      setLo([...cLo]);
      setLoActive(new Set([0]));
      setStatus(`${val} ≤ lo.peek() → pushed to max-heap (lo)`);
      addTrace(`add(${val}) → lo`);
    } else {
      cHi = minHeapPush(cHi, val);
      setHi([...cHi]);
      setHiActive(new Set([0]));
      setStatus(`${val} > lo.peek() → pushed to min-heap (hi)`);
      addTrace(`add(${val}) → hi`);
    }
    await sleep(ANIM_MS);
    setLoActive(new Set()); setHiActive(new Set());

    // Step 2: rebalance
    if (cLo.length > cHi.length + 1) {
      setStatus("Rebalancing: lo is too large — move lo.poll() to hi");
      const { val: moved, heap: newLo } = maxHeapPop(cLo);
      cLo = newLo;
      cHi = minHeapPush(cHi, moved);
      setLo([...cLo]); setHi([...cHi]);
      setLoActive(new Set([0])); setHiActive(new Set([0]));
      addTrace(`rebalance: moved ${moved} lo→hi`);
      await sleep(ANIM_MS);
      setLoActive(new Set()); setHiActive(new Set());
    } else if (cHi.length > cLo.length) {
      setStatus("Rebalancing: hi is too large — move hi.poll() to lo");
      const { val: moved, heap: newHi } = minHeapPop(cHi);
      cHi = newHi;
      cLo = maxHeapPush(cLo, moved);
      setLo([...cLo]); setHi([...cHi]);
      setLoActive(new Set([0])); setHiActive(new Set([0]));
      addTrace(`rebalance: moved ${moved} hi→lo`);
      await sleep(ANIM_MS);
      setLoActive(new Set()); setHiActive(new Set());
    }

    stateRef.current = { lo: cLo, hi: cHi };
    const med = computeMedian(cLo, cHi);
    setStatus(`Done — lo.size=${cLo.length} hi.size=${cHi.length} → median=${med}`);
    addTrace(`median = ${med}`);
    setInputVal("");
    setAnimating(false);
  };

  const handleFindMedian = async () => {
    setAnimating(true);
    const { lo: cLo, hi: cHi } = stateRef.current;
    const med = computeMedian(cLo, cHi);
    if (med === null) { setStatus("No numbers added yet."); setAnimating(false); return; }
    setLoActive(new Set([0])); setHiActive(new Set([0]));
    if (cLo.length === cHi.length) {
      setStatus(`Equal sizes → median = (${maxHeapPeek(cLo)} + ${minHeapPeek(cHi)}) / 2 = ${med}`);
    } else {
      setStatus(`|lo| > |hi| → median = lo.peek() = ${med}`);
    }
    setMedian(med);
    addTrace(`findMedian() = ${med}`);
    await sleep(ANIM_MS * 2.5);
    setLoActive(new Set()); setHiActive(new Set()); setMedian(null);
    setAnimating(false);
  };

  const handleReset = () => {
    if (animating) return;
    stateRef.current = { lo: [], hi: [] };
    setLo([]); setHi([]);
    setLoActive(new Set()); setHiActive(new Set());
    setMedian(null); setInputVal("");
    setStatus("Reset."); setTrace([]);
  };

  const loLayout = heapLayout(lo);
  const hiLayout = heapLayout(hi);
  const loH = loLayout.nodes.reduce((m, n) => Math.max(m, n.y), 0) + 40;
  const hiH = hiLayout.nodes.reduce((m, n) => Math.max(m, n.y), 0) + 40;
  const svgH = Math.max(loH, hiH, 100);

  return (
    <div className="two-heap-viz">
      <div className="two-heap-header">
        <h4>Two Heaps (Median Finder) Visualizer</h4>
        <span>O(log n) add · O(1) median</span>
      </div>

      <div className="two-heap-controls">
        <input className="text-input" placeholder="number" value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !animating && handleAdd()}
          disabled={animating} />
        <button className="ghost-btn" onClick={handleAdd} disabled={animating}>addNum(x)</button>
        <button className="ghost-btn" onClick={handleFindMedian} disabled={animating || (!lo.length && !hi.length)}>findMedian()</button>
        <button className="ghost-btn" onClick={handleReset} disabled={animating}>Reset</button>
      </div>

      <p className="two-heap-status">{status}</p>

      {median !== null && (
        <div className="seg-result-banner">Median = {median}</div>
      )}

      <div className="two-heap-panels">
        {/* lo = max-heap */}
        <div className="two-heap-panel">
          <div className="two-heap-panel-title lo">
            <span>lo (max-heap)</span>
            <span className="two-heap-panel-meta">lower half · size {lo.length}</span>
          </div>
          <div className="two-heap-svg-wrap">
            {lo.length === 0 ? (
              <div className="two-heap-empty">Empty</div>
            ) : (
              <svg viewBox={`0 0 280 ${svgH}`} className="two-heap-svg" preserveAspectRatio="xMidYMid meet">
                {loLayout.edges.map((e, i) => (
                  <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} className="two-heap-edge" />
                ))}
                {loLayout.nodes.map(n => {
                  const isActive = loActive.has(n.i);
                  return (
                    <g key={n.i}>
                      <circle cx={n.x} cy={n.y} r={20}
                        className={`two-heap-node lo ${isActive ? "active" : ""}`} />
                      <text x={n.x} y={n.y + 5} textAnchor="middle"
                        className="two-heap-node-val">{n.v}</text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
          <div className="two-heap-peek">
            peek: <strong>{maxHeapPeek(lo) ?? "—"}</strong>
            <span className="two-heap-peek-note">(max of lower)</span>
          </div>
        </div>

        {/* median display */}
        <div className="two-heap-median-col">
          <div className="two-heap-median-label">median</div>
          <div className="two-heap-median-val">
            {computeMedian(lo, hi) ?? "—"}
          </div>
          <div className="two-heap-size-row">
            <span className="two-heap-size-chip lo">{lo.length}</span>
            <span className="two-heap-balance-arrow">↔</span>
            <span className="two-heap-size-chip hi">{hi.length}</span>
          </div>
          <div className="two-heap-balance-rule">|lo| ≥ |hi|<br/>|lo|−|hi| ≤ 1</div>
        </div>

        {/* hi = min-heap */}
        <div className="two-heap-panel">
          <div className="two-heap-panel-title hi">
            <span>hi (min-heap)</span>
            <span className="two-heap-panel-meta">upper half · size {hi.length}</span>
          </div>
          <div className="two-heap-svg-wrap">
            {hi.length === 0 ? (
              <div className="two-heap-empty">Empty</div>
            ) : (
              <svg viewBox={`0 0 280 ${svgH}`} className="two-heap-svg" preserveAspectRatio="xMidYMid meet">
                {hiLayout.edges.map((e, i) => (
                  <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} className="two-heap-edge" />
                ))}
                {hiLayout.nodes.map(n => {
                  const isActive = hiActive.has(n.i);
                  return (
                    <g key={n.i}>
                      <circle cx={n.x} cy={n.y} r={20}
                        className={`two-heap-node hi ${isActive ? "active" : ""}`} />
                      <text x={n.x} y={n.y + 5} textAnchor="middle"
                        className="two-heap-node-val">{n.v}</text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
          <div className="two-heap-peek">
            peek: <strong>{minHeapPeek(hi) ?? "—"}</strong>
            <span className="two-heap-peek-note">(min of upper)</span>
          </div>
        </div>
      </div>

      <div className="array-explain">
        <h5>How Two Heaps work</h5>
        <ol>
          <li><strong>lo</strong> (max-heap) holds the lower half; <strong>hi</strong> (min-heap) holds the upper half.</li>
          <li><strong>addNum(x)</strong> — O(log n): route to lo if x ≤ lo.peek(), else hi. Then rebalance so |lo| − |hi| ≤ 1.</li>
          <li><strong>findMedian()</strong> — O(1): if equal sizes → (lo.peek() + hi.peek()) / 2, else lo.peek().</li>
          <li>Invariant maintained: every element in lo ≤ every element in hi.</li>
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
