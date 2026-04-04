import React, { useRef, useState } from "react";

const ANIM_MS = 400;
const N = 7;
const SVG_W = 760, SVG_H = 270;
const CX = SVG_W / 2, CY = 125;
const RX = 155, RY = 78;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export function UnionFindVisualizer() {
  const init = () => ({
    parent: Array.from({ length: N }, (_, i) => i),
    rank: new Array(N).fill(0),
  });

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
    const path = [];
    while (parent[x] !== x) { path.push(x); x = parent[x]; }
    path.push(x);
    return { root: x, path };
  };

  const handleFind = async () => {
    const x = Number(xInput);
    if (isNaN(x) || x < 0 || x >= N) { setStatus(`Enter a node 0–${N - 1}.`); return; }
    setAnimating(true);
    const { parent } = ufRef.current;
    const { root, path } = findRoot(parent, x);
    setStatus(`find(${x}): path ${path.join(" → ")} — root = ${root}`);
    addTrace(`find(${x}) = root ${root}`);
    for (let i = 0; i < path.length; i++) {
      setHighlighted(path.slice(0, i + 1));
      await sleep(ANIM_MS * 0.65);
    }
    const newParent = [...parent];
    for (const node of path.slice(0, -1)) newParent[node] = root;
    syncUF({ ...ufRef.current, parent: newParent });
    setPathNodes(path.slice(0, -1));
    if (path.length > 2) {
      setStatus(`Path compressed: [${path.slice(0, -1).join(",")}] → root ${root}`);
      addTrace(`compressed → root ${root}`);
    }
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
    await sleep(ANIM_MS * 0.9);
    if (rx === ry) {
      setStatus(`union(${x}, ${y}): already same component — root ${rx}`);
      addTrace(`union(${x},${y}) → already connected`);
    } else {
      const newParent = [...parent];
      const newRank = [...rank];
      if (rank[rx] < rank[ry]) newParent[rx] = ry;
      else if (rank[rx] > rank[ry]) newParent[ry] = rx;
      else { newParent[ry] = rx; newRank[rx]++; }
      syncUF({ parent: newParent, rank: newRank });
      setStatus(`union(${x}, ${y}): merged root ${rx} ← root ${ry} (union by rank)`);
      addTrace(`union(${x},${y}) merged ${rx}↔${ry}`);
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

  const { parent } = uf;
  const roots = parent.map((_, i) => {
    let x = i;
    while (parent[x] !== x) x = parent[x];
    return x;
  });
  const uniqueRoots = [...new Set(roots)];
  const COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316"];
  const colorMap = {};
  uniqueRoots.forEach((r, i) => { colorMap[r] = COLORS[i % COLORS.length]; });

  // Ellipse layout — each node gets equal angle spacing
  const nodePos = Array.from({ length: N }, (_, i) => {
    const angle = (i * 2 * Math.PI) / N - Math.PI / 2;
    return { x: CX + RX * Math.cos(angle), y: CY + RY * Math.sin(angle) };
  });

  return (
    <div className="uf-viz">
      <div className="uf-viz-header">
        <h4>Union-Find (DSU) Visualizer</h4>
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
        <svg className="uf-svg" viewBox={`0 0 ${SVG_W} ${SVG_H}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="uf-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="rgba(100,116,139,.5)" />
            </marker>
            <marker id="uf-arrow-compressed" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#6366f1" />
            </marker>
          </defs>

          {/* parent edges */}
          {parent.map((p, i) => {
            if (p === i) return null;
            const from = nodePos[i];
            const to = nodePos[p];
            const isCompressed = pathNodes.includes(i);
            // Shorten line so it doesn't overlap node circles (r=22)
            const dx = to.x - from.x, dy = to.y - from.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const offset = 24;
            const x1 = from.x + (dx / dist) * offset;
            const y1 = from.y + (dy / dist) * offset;
            const x2 = to.x - (dx / dist) * offset;
            const y2 = to.y - (dy / dist) * offset;
            return (
              <line key={`edge-${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
                className={`uf-edge ${isCompressed ? "compressed" : ""}`}
                markerEnd={isCompressed ? "url(#uf-arrow-compressed)" : "url(#uf-arrow)"} />
            );
          })}

          {/* nodes */}
          {nodePos.map(({ x, y }, i) => {
            const isHl = highlighted.includes(i);
            const color = colorMap[roots[i]];
            const isRoot = parent[i] === i;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={22}
                  className={`uf-node ${isHl ? "active" : ""}`}
                  style={{
                    fill: isHl ? color : color + "28",
                    stroke: color,
                  }} />
                <text x={x} y={y + 5} textAnchor="middle"
                  className="uf-node-label"
                  style={{ fill: isHl ? "#fff" : color }}>
                  {i}
                </text>
                {isRoot && (
                  <text x={x} y={y + 38} textAnchor="middle" className="uf-root-label">root</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* parent array */}
      <div className="uf-parent-row">
        {parent.map((p, i) => (
          <div key={i} className="uf-parent-cell"
            style={{ borderColor: colorMap[roots[i]] + "80" }}>
            <div className="uf-parent-idx">[{i}]</div>
            <div className="uf-parent-val" style={{ color: colorMap[roots[i]] }}>{p}</div>
            <div className="uf-parent-label">parent</div>
          </div>
        ))}
      </div>

      <div className="array-explain">
        <h5>How it works</h5>
        <ol>
          <li><strong>find(x)</strong> — follow parent[] until self-loop; compress path so all nodes skip to root.</li>
          <li><strong>union(x,y)</strong> — find both roots; attach smaller-rank root under larger to keep tree flat.</li>
          <li><strong>Path compression + Union by rank</strong> → O(α(n)) ≈ O(1) amortised per op.</li>
          <li>Same colour = same connected component. Nodes labelled <em>root</em> are component representatives.</li>
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
