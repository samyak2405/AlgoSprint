import React, { useRef, useState } from "react";

const ANIM_MS = 380;
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const INIT_ARR = [2, 4, 5, 1, 8, 3, 7, 6];

/* ── tree helpers ─────────────────────────────────────────────── */
function buildTree(arr) {
  const n = arr.length;
  const tree = new Array(4 * n).fill(0);
  const build = (node, l, r) => {
    if (l === r) { tree[node] = arr[l]; return; }
    const m = (l + r) >> 1;
    build(node * 2, l, m);
    build(node * 2 + 1, m + 1, r);
    tree[node] = tree[node * 2] + tree[node * 2 + 1];
  };
  build(1, 0, n - 1);
  return tree;
}

function pointUpdateTree(tree, node, l, r, idx, delta) {
  if (l === r) { tree[node] += delta; return; }
  const m = (l + r) >> 1;
  if (idx <= m) pointUpdateTree(tree, node * 2, l, m, idx, delta);
  else pointUpdateTree(tree, node * 2 + 1, m + 1, r, idx, delta);
  tree[node] = tree[node * 2] + tree[node * 2 + 1];
}

function rangeQuery(tree, node, l, r, ql, qr) {
  if (ql > r || qr < l) return 0;
  if (ql <= l && r <= qr) return tree[node];
  const m = (l + r) >> 1;
  return rangeQuery(tree, node * 2, l, m, ql, qr)
    + rangeQuery(tree, node * 2 + 1, m + 1, r, ql, qr);
}

/* ── layout: collect all internal nodes for SVG ──────────────── */
function layoutTree(tree, n) {
  const nodes = [];
  const SVG_W = 720;
  const LEVEL_H = 62;

  const visit = (node, l, r, depth) => {
    if (l > r || tree[node] === undefined) return;
    const slots = Math.pow(2, depth);
    const slotW = SVG_W / slots;
    // Map node index within its level
    const levelStart = Math.pow(2, depth);
    const posInLevel = node - levelStart;
    const cx = slotW * posInLevel + slotW / 2 + 20;
    const cy = depth * LEVEL_H + 30;
    nodes.push({ node, l, r, sum: tree[node], cx, cy });
    if (l < r) {
      const m = (l + r) >> 1;
      visit(node * 2, l, m, depth + 1);
      visit(node * 2 + 1, m + 1, r, depth + 1);
    }
  };
  visit(1, 0, n - 1, 0);
  return nodes;
}

export function SegmentTreeVisualizer() {
  const [arr, setArr] = useState([...INIT_ARR]);
  const [tree, setTree] = useState(() => buildTree(INIT_ARR));
  const [idxInput, setIdxInput] = useState("");
  const [deltaInput, setDeltaInput] = useState("");
  const [ql, setQL] = useState("");
  const [qr, setQR] = useState("");
  const [animating, setAnimating] = useState(false);
  const [activeNodes, setActiveNodes] = useState(new Set());
  const [queryResult, setQueryResult] = useState(null);
  const [status, setStatus] = useState("Ready — Segment Tree for range sum queries.");
  const [trace, setTrace] = useState([]);
  const stateRef = useRef({ arr: [...INIT_ARR], tree: buildTree(INIT_ARR) });

  const addTrace = msg => setTrace(p => [...p.slice(-10), msg]);
  const N = arr.length;

  /* collect nodes touched during point update */
  const collectUpdatePath = (node, l, r, idx, path = []) => {
    path.push(node);
    if (l === r) return path;
    const m = (l + r) >> 1;
    if (idx <= m) collectUpdatePath(node * 2, l, m, idx, path);
    else collectUpdatePath(node * 2 + 1, m + 1, r, idx, path);
    return path;
  };

  /* collect nodes touched during range query */
  const collectQueryPath = (node, l, r, ql, qr, path = []) => {
    if (ql > r || qr < l) return path;
    path.push(node);
    if (ql <= l && r <= qr) return path;
    const m = (l + r) >> 1;
    collectQueryPath(node * 2, l, m, ql, qr, path);
    collectQueryPath(node * 2 + 1, m + 1, r, ql, qr, path);
    return path;
  };

  const handleUpdate = async () => {
    const idx = Number(idxInput);
    const delta = Number(deltaInput);
    if (isNaN(idx) || idx < 0 || idx > N - 1) { setStatus(`Index must be 0–${N - 1}.`); return; }
    if (isNaN(delta) || deltaInput.trim() === "") { setStatus("Enter a delta value."); return; }
    setAnimating(true);
    const path = collectUpdatePath(1, 0, N - 1, idx);
    setStatus(`update(${idx}, ${delta > 0 ? "+" : ""}${delta}): updating path of ${path.length} nodes`);
    addTrace(`update(a[${idx}], ${delta > 0 ? "+" : ""}${delta})`);
    for (let k = 0; k < path.length; k++) {
      setActiveNodes(new Set(path.slice(0, k + 1)));
      await sleep(ANIM_MS * 0.7);
    }
    const newArr = [...stateRef.current.arr];
    newArr[idx] += delta;
    const newTree = [...stateRef.current.tree];
    pointUpdateTree(newTree, 1, 0, N - 1, idx, delta);
    stateRef.current = { arr: newArr, tree: newTree };
    setArr(newArr);
    setTree([...newTree]);
    setStatus(`Done — a[${idx}] = ${newArr[idx]}, root sum = ${newTree[1]}`);
    await sleep(ANIM_MS * 0.5);
    setActiveNodes(new Set());
    setIdxInput(""); setDeltaInput("");
    setAnimating(false);
  };

  const handleRangeQuery = async () => {
    const l = Number(ql), r = Number(qr);
    if (isNaN(l) || isNaN(r) || l < 0 || r > N - 1 || l > r) {
      setStatus(`l and r must satisfy 0 ≤ l ≤ r ≤ ${N - 1}.`); return;
    }
    setAnimating(true);
    const path = collectQueryPath(1, 0, N - 1, l, r);
    setStatus(`rangeSum(${l}, ${r}): visiting ${path.length} node${path.length > 1 ? "s" : ""}`);
    addTrace(`rangeSum(${l},${r})`);
    for (let k = 0; k < path.length; k++) {
      setActiveNodes(new Set(path.slice(0, k + 1)));
      await sleep(ANIM_MS * 0.8);
    }
    const result = rangeQuery(stateRef.current.tree, 1, 0, N - 1, l, r);
    setQueryResult(result);
    setStatus(`rangeSum(${l}, ${r}) = ${result}`);
    addTrace(`rangeSum(${l},${r}) = ${result}`);
    await sleep(ANIM_MS * 2);
    setActiveNodes(new Set()); setQueryResult(null);
    setQL(""); setQR("");
    setAnimating(false);
  };

  const handleReset = () => {
    if (animating) return;
    const t = buildTree(INIT_ARR);
    stateRef.current = { arr: [...INIT_ARR], tree: t };
    setArr([...INIT_ARR]); setTree(t);
    setActiveNodes(new Set()); setQueryResult(null);
    setIdxInput(""); setDeltaInput(""); setQL(""); setQR("");
    setStatus("Reset to default array."); setTrace([]);
  };

  const layoutNodes = layoutTree(tree, N);
  // Build edge list (parent → child)
  const edges = layoutNodes
    .filter(n => n.l < n.r)
    .flatMap(n => {
      const m = (n.l + n.r) >> 1;
      const left = layoutNodes.find(c => c.node === n.node * 2);
      const right = layoutNodes.find(c => c.node === n.node * 2 + 1);
      const result = [];
      if (left) result.push({ x1: n.cx, y1: n.cy, x2: left.cx, y2: left.cy, childId: left.node });
      if (right) result.push({ x1: n.cx, y1: n.cy, x2: right.cx, y2: right.cy, childId: right.node });
      return result;
    });

  const maxDepth = Math.ceil(Math.log2(N)) + 1;
  const svgH = maxDepth * 62 + 30;

  return (
    <div className="seg-viz">
      <div className="seg-viz-header">
        <h4>Segment Tree Visualizer (Range Sum)</h4>
        <span>O(log n) update &amp; query</span>
      </div>

      <div className="seg-controls-block">
        <div className="seg-controls-row">
          <span className="seg-ctrl-label">Point update</span>
          <input className="text-input seg-input" placeholder="index (0–7)" value={idxInput}
            onChange={e => setIdxInput(e.target.value)} disabled={animating} />
          <input className="text-input seg-input" placeholder="delta (±)" value={deltaInput}
            onChange={e => setDeltaInput(e.target.value)} disabled={animating} />
          <button className="ghost-btn" onClick={handleUpdate} disabled={animating}>update(i, δ)</button>
        </div>
        <div className="seg-controls-row">
          <span className="seg-ctrl-label">Range sum</span>
          <input className="text-input seg-input" placeholder="l (0–7)" value={ql}
            onChange={e => setQL(e.target.value)} disabled={animating} />
          <input className="text-input seg-input" placeholder="r (0–7)" value={qr}
            onChange={e => setQR(e.target.value)} disabled={animating} />
          <button className="ghost-btn" onClick={handleRangeQuery} disabled={animating}>sum(l, r)</button>
          <button className="ghost-btn" onClick={handleReset} disabled={animating}>Reset</button>
        </div>
      </div>

      {queryResult !== null && (
        <div className="seg-result-banner">Result = {queryResult}</div>
      )}
      <p className="seg-viz-status">{status}</p>

      {/* Input array */}
      <div className="fen-section-label">Input array a[] (0-indexed)</div>
      <div className="fen-array-row">
        {arr.map((v, i) => (
          <div key={i} className="fen-cell">
            <div className="fen-cell-val">{v}</div>
            <div className="fen-cell-idx">{i}</div>
          </div>
        ))}
      </div>

      {/* Tree */}
      <div className="seg-tree-wrap">
        <svg className="seg-svg" viewBox={`0 0 760 ${svgH}`} preserveAspectRatio="xMidYMid meet">
          {edges.map((e, i) => (
            <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              className={`seg-edge ${activeNodes.has(e.childId) ? "active" : ""}`} />
          ))}
          {layoutNodes.map(n => {
            const isActive = activeNodes.has(n.node);
            const isLeaf = n.l === n.r;
            return (
              <g key={n.node}>
                <circle cx={n.cx} cy={n.cy} r={isLeaf ? 17 : 21}
                  className={`seg-node ${isActive ? "active" : ""} ${isLeaf ? "leaf" : ""}`} />
                <text x={n.cx} y={n.cy + 1} textAnchor="middle" dominantBaseline="middle"
                  className="seg-node-val">{n.sum}</text>
                <text x={n.cx} y={n.cy + (isLeaf ? 30 : 33)} textAnchor="middle"
                  className="seg-node-range">[{n.l},{n.r}]</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="array-explain">
        <h5>How Segment Tree works</h5>
        <ol>
          <li>Each node stores the sum of its range <strong>[l, r]</strong>. Leaf nodes hold individual array values.</li>
          <li><strong>build</strong> — O(n): fill leaves, propagate sums up to root.</li>
          <li><strong>rangeSum(l, r)</strong> — O(log n): descend tree, collect fully-covered sub-ranges.</li>
          <li><strong>pointUpdate(i, δ)</strong> — O(log n): update leaf, recompute all ancestors on the path to root.</li>
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
