import React, { useRef, useState } from "react";

const ANIM_MS = 400;
const N = 7;
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export function UnionFindVisualizer() {
  const init = () => ({ parent: Array.from({ length: N }, (_, i) => i), rank: new Array(N).fill(0) });
  const [uf, setUF] = useState(init);
  const [xInput, setXInput] = useState("");
  const [yInput, setYInput] = useState("");
  const [animating, setAnimating] = useState(false);
  const [highlighted, setHighlighted] = useState([]);
  const [pathNodes, setPathNodes] = useState([]);
  const [status, setStatus] = useState(`Ready — ${N} nodes (0–${N - 1}). Try union / find.`);
  const [trace, setTrace] = useState([]);
  const ufRef = useRef(init());

  const syncUF = s => { ufRef.current = { ...s }; setUF({ ...s }); };
  const addTrace = msg => setTrace(p => [...p.slice(-10), msg]);

  const findRoot = (parent, x) => {
    let path = [];
    while (parent[x] !== x) { path.push(x); x = parent[x]; }
    path.push(x); // root
    return { root: x, path };
  };

  const handleFind = async () => {
    const x = Number(xInput);
    if (isNaN(x) || x < 0 || x >= N) { setStatus(`Enter node 0–${N - 1}.`); return; }
    setAnimating(true);
    const { parent } = ufRef.current;
    const { root, path } = findRoot(parent, x);
    setStatus(`find(${x}): traversing path ${path.join(" → ")} — root = ${root}`);
    addTrace(`find(${x}) = ${root}`);

    // Highlight path step by step
    for (let i = 0; i < path.length; i++) {
      setHighlighted(path.slice(0, i + 1));
      await sleep(ANIM_MS * 0.6);
    }

    // Path compression
    const newParent = [...parent];
    for (const node of path.slice(0, -1)) newParent[node] = root;
    syncUF({ ...ufRef.current, parent: newParent });
    setPathNodes(path.slice(0, -1));
    setStatus(`Path compression: all nodes ${path.slice(0,-1).join(",")} now point directly to root ${root}`);
    addTrace(`path compress → all point to root ${root}`);
    await sleep(ANIM_MS);
    setHighlighted([]); setPathNodes([]);
    setAnimating(false);
  };

  const handleUnion = async () => {
    const x = Number(xInput), y = Number(yInput);
    if (isNaN(x) || isNaN(y) || x < 0 || x >= N || y < 0 || y >= N) {
      setStatus(`Enter two nodes 0–${N - 1}.`); return;
    }
    setAnimating(true);
    const { parent, rank } = ufRef.current;
    const { root: rx, path: px } = findRoot(parent, x);
    const { root: ry, path: py } = findRoot(parent, y);

    setHighlighted([...new Set([...px, ...py])]);
    await sleep(ANIM_MS * 0.8);

    if (rx === ry) {
      setStatus(`union(${x}, ${y}): already same component (root ${rx})`);
      addTrace(`union(${x},${y}) → same root ${rx}`);
    } else {
      const newParent = [...parent];
      const newRank = [...rank];
      if (rank[rx] < rank[ry]) { newParent[rx] = ry; }
      else if (rank[rx] > rank[ry]) { newParent[ry] = rx; }
      else { newParent[ry] = rx; newRank[rx]++; }
      syncUF({ parent: newParent, rank: newRank });
      setStatus(`union(${x}, ${y}): merged roots ${rx} and ${ry} (union by rank)`);
      addTrace(`union(${x},${y}) merged roots ${rx},${ry}`);
    }
    await sleep(ANIM_MS);
    setHighlighted([]);
    setAnimating(false);
  };

  const handleReset = () => {
    if (animating) return;
    const s = init();
    ufRef.current = { ...s };
    setUF({ ...s });
    setHighlighted([]); setPathNodes([]);
    setXInput(""); setYInput("");
    setStatus(`Reset — ${N} isolated nodes.`); setTrace([]);
  };

  // Compute connected components for coloring
  const { parent } = uf;
  const roots = parent.map((_, i) => {
    let x = i;
    while (parent[x] !== x) x = parent[x];
    return x;
  });
  const uniqueRoots = [...new Set(roots)];
  const colorMap = {};
  const colors = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316"];
  uniqueRoots.forEach((r, i) => { colorMap[r] = colors[i % colors.length]; });

  // SVG layout
  const CX = 380, CY = 80, R_ORBIT = 60;
  const nodePositions = Array.from({ length: N }, (_, i) => {
    const angle = (i * 2 * Math.PI) / N - Math.PI / 2;
    return { x: CX + R_ORBIT * 2.5 * Math.cos(angle), y: CY + 60 + R_ORBIT * Math.sin(angle) };
  });

  return (
    <div className="uf-viz">
      <div className="uf-viz-header">
        <h4>Union-Find (Disjoint Set) Visualizer</h4>
        <span>{uniqueRoots.length} component{uniqueRoots.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="uf-viz-controls">
        <input className="text-input" placeholder="node x (0–6)" value={xInput}
          onChange={e => setXInput(e.target.value)} disabled={animating} />
        <input className="text-input" placeholder="node y (0–6)" value={yInput}
          onChange={e => setYInput(e.target.value)} disabled={animating} />
        <button className="ghost-btn" onClick={handleUnion} disabled={animating}>union(x, y)</button>
        <button className="ghost-btn" onClick={handleFind} disabled={animating}>find(x)</button>
        <button className="ghost-btn" onClick={handleReset} disabled={animating}>Reset</button>
      </div>

      <p className="uf-viz-status">{status}</p>

      <div className="uf-canvas-wrap">
        <svg className="uf-svg" viewBox="0 0 760 200" preserveAspectRatio="xMidYMid meet">
          {/* parent edges */}
          {parent.map((p, i) => {
            if (p === i) return null;
            const from = nodePositions[i];
            const to = nodePositions[p];
            const isPath = pathNodes.includes(i);
            return (
              <line key={`edge-${i}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                className={`uf-edge ${isPath ? "compressed" : ""}`} />
            );
          })}
          {/* nodes */}
          {nodePositions.map(({ x, y }, i) => {
            const isHighlighted = highlighted.includes(i);
            const color = colorMap[roots[i]];
            const isRoot = parent[i] === i;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={22}
                  className={`uf-node ${isHighlighted ? "active" : ""}`}
                  style={{ fill: isHighlighted ? "#6366f1" : color + "33", stroke: color }} />
                <text x={x} y={y + 5} textAnchor="middle" className="uf-node-label"
                  style={{ fill: isHighlighted ? "#fff" : color }}>{i}</text>
                {isRoot && (
                  <text x={x} y={y + 36} textAnchor="middle" className="uf-root-label">root</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="uf-parent-row">
        {parent.map((p, i) => (
          <div key={i} className="uf-parent-cell">
            <div className="uf-parent-idx">{i}</div>
            <div className="uf-parent-val" style={{ color: colorMap[roots[i]] }}>{p}</div>
            <div className="uf-parent-label">parent</div>
          </div>
        ))}
      </div>

      <div className="array-explain">
        <h5>How it works</h5>
        <ol>
          <li><strong>find(x)</strong>: follow parent pointers to root; compress path to O(α) amortized.</li>
          <li><strong>union(x,y)</strong>: find roots, attach smaller-rank tree under larger-rank root.</li>
          <li><strong>Path compression + Union by rank</strong> → near-O(1) per operation.</li>
          <li>Nodes with the same color belong to the same connected component.</li>
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
