import React, { useRef, useState } from "react";

const ANIM_MS = 380;
let BST_ID = 1;
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function newNode(key) { return { id: BST_ID++, key, left: null, right: null }; }

function bstInsert(node, key) {
  if (!node) return newNode(key);
  if (key < node.key) return { ...node, left: bstInsert(node.left, key) };
  if (key > node.key) return { ...node, right: bstInsert(node.right, key) };
  return node;
}

function bstMin(node) { while (node.left) node = node.left; return node; }

function bstRemove(node, key) {
  if (!node) return null;
  if (key < node.key) return { ...node, left: bstRemove(node.left, key) };
  if (key > node.key) return { ...node, right: bstRemove(node.right, key) };
  if (!node.left) return node.right;
  if (!node.right) return node.left;
  const succ = bstMin(node.right);
  return { ...node, key: succ.key, id: node.id, right: bstRemove(node.right, succ.key) };
}

function bstFloor(node, key) {
  if (!node) return null;
  if (key === node.key) return node.key;
  if (key < node.key) return bstFloor(node.left, key);
  const r = bstFloor(node.right, key);
  return r !== null ? r : node.key;
}

function bstCeiling(node, key) {
  if (!node) return null;
  if (key === node.key) return node.key;
  if (key > node.key) return bstCeiling(node.right, key);
  const l = bstCeiling(node.left, key);
  return l !== null ? l : node.key;
}

function getSearchPath(node, key) {
  const path = [];
  let cur = node;
  while (cur) {
    path.push(cur.id);
    if (key === cur.key) break;
    cur = key < cur.key ? cur.left : cur.right;
  }
  return path;
}

function layoutBST(root) {
  const nodes = [], edges = [];
  if (!root) return { nodes, edges };
  const xMap = {};
  let counter = 0;
  const inorder = (n) => { if (!n) return; inorder(n.left); xMap[n.id] = counter++; inorder(n.right); };
  inorder(root);
  const getDepth = (n) => { if (!n) return -1; return 1 + Math.max(getDepth(n.left), getDepth(n.right)); };
  const total = counter;
  const build = (n, depth) => {
    if (!n) return;
    const x = 40 + (xMap[n.id] / Math.max(total - 1, 1)) * 680;
    const y = 30 + depth * 72;
    nodes.push({ id: n.id, key: n.key, x, y });
    if (n.left) { build(n.left, depth + 1); }
    if (n.right) { build(n.right, depth + 1); }
    if (n.left) {
      const lx = 40 + (xMap[n.left.id] / Math.max(total - 1, 1)) * 680;
      const ly = 30 + (depth + 1) * 72;
      edges.push({ x1: x, y1: y, x2: lx, y2: ly, toId: n.left.id });
    }
    if (n.right) {
      const rx = 40 + (xMap[n.right.id] / Math.max(total - 1, 1)) * 680;
      const ry = 30 + (depth + 1) * 72;
      edges.push({ x1: x, y1: y, x2: rx, y2: ry, toId: n.right.id });
    }
  };
  build(root, 0);
  return { nodes, edges };
}

export function BSTVisualizer() {
  const [root, setRoot] = useState(() => {
    let r = null;
    for (const k of [20, 10, 30, 5, 15, 25, 35]) r = bstInsert(r, k);
    return r;
  });
  const [inputVal, setInputVal] = useState("");
  const [animating, setAnimating] = useState(false);
  const [activePath, setActivePath] = useState([]);
  const [status, setStatus] = useState("Ready — BST (TreeMap/TreeSet) keeps keys sorted.");
  const [trace, setTrace] = useState([]);
  const rootRef = useRef(root);

  const sync = r => { rootRef.current = r; setRoot(r); };
  const addTrace = msg => setTrace(p => [...p.slice(-10), msg]);

  const getKey = () => {
    const v = Number(inputVal);
    if (inputVal.trim() === "" || isNaN(v)) return null;
    return v;
  };

  const animatePath = async (path) => {
    for (let i = 0; i <= path.length; i++) {
      setActivePath(path.slice(0, i));
      await sleep(ANIM_MS * 0.55);
    }
  };

  const handleInsert = async () => {
    const key = getKey();
    if (key === null) { setStatus("Enter a valid number."); return; }
    setAnimating(true);
    const path = getSearchPath(rootRef.current, key);
    setStatus(`put(${key}) — searching BST path…`);
    addTrace(`insert: ${key}`);
    await animatePath(path);
    const r = bstInsert(rootRef.current, key);
    sync(r);
    setActivePath([]);
    setStatus(`Inserted ${key}. Tree maintains sorted order.`);
    setInputVal("");
    setAnimating(false);
  };

  const handleRemove = async () => {
    const key = getKey();
    if (key === null) { setStatus("Enter a valid number."); return; }
    setAnimating(true);
    const path = getSearchPath(rootRef.current, key);
    setStatus(`remove(${key}) — finding node…`);
    addTrace(`remove: ${key}`);
    await animatePath(path);
    const r = bstRemove(rootRef.current, key);
    sync(r);
    setActivePath([]);
    setStatus(`Removed ${key}.`);
    setInputVal("");
    setAnimating(false);
  };

  const handleSearch = async () => {
    const key = getKey();
    if (key === null) { setStatus("Enter a valid number."); return; }
    setAnimating(true);
    const path = getSearchPath(rootRef.current, key);
    setStatus(`get(${key}) — traversing…`);
    addTrace(`search: ${key}`);
    await animatePath(path);
    const found = path.length > 0;
    setStatus(found ? `✓ Found ${key} after ${path.length} comparisons.` : `✗ ${key} not in tree.`);
    addTrace(found ? `hit: ${key}` : `miss: ${key}`);
    await sleep(ANIM_MS);
    setActivePath([]);
    setAnimating(false);
  };

  const handleFloor = async () => {
    const key = getKey();
    if (key === null) { setStatus("Enter a value."); return; }
    setAnimating(true);
    const f = bstFloor(rootRef.current, key);
    setStatus(f !== null ? `floor(${key}) = ${f}` : `No floor for ${key} (all keys are larger)`);
    addTrace(`floor(${key}) = ${f}`);
    await sleep(ANIM_MS);
    setAnimating(false);
  };

  const handleCeiling = async () => {
    const key = getKey();
    if (key === null) { setStatus("Enter a value."); return; }
    setAnimating(true);
    const c = bstCeiling(rootRef.current, key);
    setStatus(c !== null ? `ceiling(${key}) = ${c}` : `No ceiling for ${key} (all keys are smaller)`);
    addTrace(`ceiling(${key}) = ${c}`);
    await sleep(ANIM_MS);
    setAnimating(false);
  };

  const handleReset = () => {
    if (animating) return;
    let r = null;
    for (const k of [20, 10, 30, 5, 15, 25, 35]) r = bstInsert(r, k);
    sync(r);
    setActivePath([]); setInputVal("");
    setStatus("Reset."); setTrace([]);
  };

  const { nodes, edges } = layoutBST(root);
  const svgH = Math.max(100, (nodes.reduce((m, n) => Math.max(m, n.y), 0) + 50));

  return (
    <div className="bst-viz">
      <div className="bst-viz-header">
        <h4>BST (TreeMap / TreeSet) Visualizer</h4>
        <span>Keys always sorted — O(log n) average</span>
      </div>

      <div className="bst-viz-controls">
        <input className="text-input" placeholder="key (number)" value={inputVal}
          onChange={e => setInputVal(e.target.value)} disabled={animating} />
        <button className="ghost-btn" onClick={handleInsert} disabled={animating}>put</button>
        <button className="ghost-btn" onClick={handleRemove} disabled={animating}>remove</button>
        <button className="ghost-btn" onClick={handleSearch} disabled={animating}>get</button>
        <button className="ghost-btn" onClick={handleFloor} disabled={animating}>floor</button>
        <button className="ghost-btn" onClick={handleCeiling} disabled={animating}>ceiling</button>
        <button className="ghost-btn" onClick={handleReset} disabled={animating}>Reset</button>
      </div>

      <p className="bst-viz-status">{status}</p>

      <div className="bst-canvas-wrap">
        {!root ? <div className="ll-empty">Tree is empty.</div> : (
          <svg className="bst-svg" viewBox={`0 0 760 ${svgH}`} preserveAspectRatio="xMidYMid meet">
            {edges.map((e, i) => (
              <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                className={`bst-edge ${activePath.includes(e.toId) ? "active" : ""}`} />
            ))}
            {nodes.map(n => {
              const isActive = activePath.includes(n.id);
              return (
                <g key={n.id}>
                  <circle cx={n.x} cy={n.y} r={22}
                    className={`bst-node ${isActive ? "active" : ""}`} />
                  <text x={n.x} y={n.y + 5} textAnchor="middle" className="bst-node-label">{n.key}</text>
                </g>
              );
            })}
          </svg>
        )}
      </div>

      <div className="array-explain">
        <h5>TreeMap / TreeSet (Red-Black BST in Java)</h5>
        <ol>
          <li><strong>put/get/remove</strong> — O(log n) guaranteed (balanced).</li>
          <li><strong>floor(k)</strong> — largest key ≤ k. <strong>ceiling(k)</strong> — smallest key ≥ k.</li>
          <li><strong>firstKey / lastKey</strong> — O(log n): navigate to leftmost/rightmost node.</li>
          <li>Inorder traversal visits keys in sorted order — used by subMap/headMap/tailMap.</li>
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
