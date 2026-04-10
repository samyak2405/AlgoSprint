import React, { useMemo, useRef, useState } from "react";

const RED = "RED";
const BLACK = "BLACK";
const ANIM_MS = 430;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cloneTree(node) {
  if (!node) return null;
  return {
    id: node.id,
    key: node.key,
    color: node.color,
    left: cloneTree(node.left),
    right: cloneTree(node.right),
  };
}

function inOrderKeys(node, out = []) {
  if (!node) return out;
  inOrderKeys(node.left, out);
  out.push(node.key);
  inOrderKeys(node.right, out);
  return out;
}

function buildLayout(root) {
  if (!root) return { nodes: [], edges: [], height: 220 };
  const nodes = [];
  const edges = [];
  const width = 1000;
  const yStart = 55;
  const yStep = 96;

  function walk(node, depth, minX, maxX, parent) {
    if (!node) return;
    const x = (minX + maxX) / 2;
    const y = yStart + depth * yStep;
    nodes.push({ id: node.id, key: node.key, color: node.color, x, y, depth });
    if (parent) edges.push({ from: parent, to: node.id });
    walk(node.left, depth + 1, minX, x, node.id);
    walk(node.right, depth + 1, x, maxX, node.id);
  }

  walk(root, 0, 0, width, null);
  const maxDepth = Math.max(...nodes.map((n) => n.depth));
  return { nodes, edges, height: Math.max(220, yStart + (maxDepth + 1) * yStep) };
}

export function RedBlackTreeVisualizer() {
  const rootRef = useRef(null);
  const idRef = useRef(1);
  const [tree, setTree] = useState(null);
  const [keyInput, setKeyInput] = useState("");
  const [animating, setAnimating] = useState(false);
  const [activeIds, setActiveIds] = useState([]);
  const [status, setStatus] = useState("Ready");
  const [trace, setTrace] = useState([]);

  const { nodes, edges, height } = useMemo(() => buildLayout(tree), [tree]);
  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const addTrace = (line) => setTrace((prev) => [...prev.slice(-10), line]);

  const publish = async (nextStatus, ids = []) => {
    setTree(cloneTree(rootRef.current));
    setActiveIds(ids);
    setStatus(nextStatus);
    await sleep(ANIM_MS);
  };

  const createNode = (key) => ({
    id: idRef.current++,
    key,
    color: RED,
    left: null,
    right: null,
    parent: null,
  });

  const rotateLeft = (x) => {
    const y = x.right;
    x.right = y.left;
    if (y.left) y.left.parent = x;
    y.parent = x.parent;
    if (!x.parent) rootRef.current = y;
    else if (x === x.parent.left) x.parent.left = y;
    else x.parent.right = y;
    y.left = x;
    x.parent = y;
  };

  const rotateRight = (x) => {
    const y = x.left;
    x.left = y.right;
    if (y.right) y.right.parent = x;
    y.parent = x.parent;
    if (!x.parent) rootRef.current = y;
    else if (x === x.parent.right) x.parent.right = y;
    else x.parent.left = y;
    y.right = x;
    x.parent = y;
  };

  const fixInsert = async (z) => {
    while (z.parent && z.parent.color === RED) {
      const gp = z.parent.parent;
      if (!gp) break;
      if (z.parent === gp.left) {
        const uncle = gp.right;
        if (uncle && uncle.color === RED) {
          z.parent.color = BLACK;
          uncle.color = BLACK;
          gp.color = RED;
          addTrace("Recolor parent + uncle to BLACK, grandparent to RED");
          await publish("Case: recolor", [z.parent.id, uncle.id, gp.id]);
          z = gp;
        } else {
          if (z === z.parent.right) {
            z = z.parent;
            addTrace("Left rotation on parent (triangle fix)");
            await publish("Rotate left (triangle)", [z.id]);
            rotateLeft(z);
            await publish("After left rotation", [z.parent?.id || z.id]);
          }
          z.parent.color = BLACK;
          gp.color = RED;
          addTrace("Right rotation on grandparent + recolor");
          await publish("Rotate right + recolor", [gp.id, z.parent.id]);
          rotateRight(gp);
          await publish("After right rotation", [z.parent?.id || z.id]);
        }
      } else {
        const uncle = gp.left;
        if (uncle && uncle.color === RED) {
          z.parent.color = BLACK;
          uncle.color = BLACK;
          gp.color = RED;
          addTrace("Recolor parent + uncle to BLACK, grandparent to RED");
          await publish("Case: recolor", [z.parent.id, uncle.id, gp.id]);
          z = gp;
        } else {
          if (z === z.parent.left) {
            z = z.parent;
            addTrace("Right rotation on parent (triangle fix)");
            await publish("Rotate right (triangle)", [z.id]);
            rotateRight(z);
            await publish("After right rotation", [z.parent?.id || z.id]);
          }
          z.parent.color = BLACK;
          gp.color = RED;
          addTrace("Left rotation on grandparent + recolor");
          await publish("Rotate left + recolor", [gp.id, z.parent.id]);
          rotateLeft(gp);
          await publish("After left rotation", [z.parent?.id || z.id]);
        }
      }
    }
    if (rootRef.current) rootRef.current.color = BLACK;
    await publish("Root forced BLACK", rootRef.current ? [rootRef.current.id] : []);
  };

  const insertKey = async (key) => {
    let parent = null;
    let cur = rootRef.current;
    while (cur) {
      parent = cur;
      await publish(`Traverse ${key < cur.key ? "left" : key > cur.key ? "right" : "equal"} from ${cur.key}`, [cur.id]);
      if (key < cur.key) cur = cur.left;
      else if (key > cur.key) cur = cur.right;
      else {
        setStatus(`Key ${key} already exists`);
        addTrace(`insert skip: duplicate key ${key}`);
        setActiveIds([]);
        return;
      }
    }

    const z = createNode(key);
    z.parent = parent;
    if (!parent) rootRef.current = z;
    else if (key < parent.key) parent.left = z;
    else parent.right = z;

    addTrace(`insert: ${key} as RED`);
    await publish(`Inserted ${key} as RED`, [z.id, parent?.id].filter(Boolean));
    await fixInsert(z);
    addTrace(`insert done: ${key}`);
    setActiveIds([]);
    setStatus(`Insert complete for ${key}`);
  };

  const handleInsert = async () => {
    const key = Number(keyInput.trim());
    if (keyInput.trim() === "" || Number.isNaN(key)) {
      setStatus("Enter a valid integer key");
      return;
    }
    if (animating) return;
    setAnimating(true);
    await insertKey(key);
    setKeyInput("");
    setAnimating(false);
  };

  const handleSearch = async () => {
    const key = Number(keyInput.trim());
    if (keyInput.trim() === "" || Number.isNaN(key)) {
      setStatus("Enter a valid integer key");
      return;
    }
    if (animating) return;
    setAnimating(true);
    let cur = rootRef.current;
    while (cur) {
      await publish(`Visit ${cur.key}`, [cur.id]);
      if (cur.key === key) {
        setStatus(`Found key ${key}`);
        addTrace(`search hit: ${key}`);
        setAnimating(false);
        setActiveIds([cur.id]);
        return;
      }
      cur = key < cur.key ? cur.left : cur.right;
    }
    setStatus(`Key ${key} not found`);
    addTrace(`search miss: ${key}`);
    setAnimating(false);
    setActiveIds([]);
  };

  const handleDelete = async () => {
    const key = Number(keyInput.trim());
    if (keyInput.trim() === "" || Number.isNaN(key)) {
      setStatus("Enter a valid integer key");
      return;
    }
    if (animating) return;
    setAnimating(true);

    const keys = inOrderKeys(rootRef.current, []);
    if (!keys.includes(key)) {
      setStatus(`Key ${key} not found`);
      addTrace(`delete miss: ${key}`);
      setAnimating(false);
      return;
    }

    // For visualization clarity, rebuild using insert-fix logic after removing key.
    const remain = keys.filter((k) => k !== key);
    rootRef.current = null;
    setTree(null);
    addTrace(`delete: remove ${key} then rebuild`);
    await publish(`Removed ${key}. Rebuilding tree...`, []);

    for (const k of remain) {
      let parent = null;
      let cur = rootRef.current;
      while (cur) {
        parent = cur;
        cur = k < cur.key ? cur.left : cur.right;
      }
      const z = createNode(k);
      z.parent = parent;
      if (!parent) rootRef.current = z;
      else if (k < parent.key) parent.left = z;
      else parent.right = z;
      await fixInsert(z);
    }

    setStatus(`Delete complete for ${key}`);
    setActiveIds([]);
    setAnimating(false);
  };

  const handleDemo = async () => {
    if (animating) return;
    setAnimating(true);
    rootRef.current = null;
    setTree(null);
    setTrace([]);
    idRef.current = 1;
    const demo = [10, 20, 30, 15, 25, 5, 1, 8];
    setStatus("Running demo insert sequence...");
    addTrace(`demo: ${demo.join(", ")}`);

    for (const key of demo) {
      // eslint-disable-next-line no-await-in-loop
      await insertKey(key);
    }
    setKeyInput("");
    setAnimating(false);
  };

  const handleClear = () => {
    if (animating) return;
    rootRef.current = null;
    idRef.current = 1;
    setTree(null);
    setKeyInput("");
    setActiveIds([]);
    setStatus("Tree cleared");
    setTrace([]);
  };

  return (
    <div className="rbt-viz">
      <div className="rbt-viz-header">
        <h4>Interactive Red-Black Tree Visualizer</h4>
        <span>Insert + Search + Delete (rebuild animation)</span>
      </div>

      <div className="rbt-viz-controls">
        <input
          className="text-input"
          placeholder="Integer key"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          disabled={animating}
        />
        <button className="ghost-btn rbt-action-btn" onClick={handleInsert} disabled={animating}>
          Insert
        </button>
        <button className="ghost-btn rbt-action-btn" onClick={handleSearch} disabled={animating}>
          Search
        </button>
        <button className="ghost-btn rbt-action-btn" onClick={handleDelete} disabled={animating}>
          Delete
        </button>
        <button className="ghost-btn rbt-action-btn" onClick={handleDemo} disabled={animating}>
          Run Demo
        </button>
        <button className="ghost-btn rbt-action-btn" onClick={handleClear} disabled={animating}>
          Clear
        </button>
      </div>

      <p className="rbt-viz-status">{status}</p>

      <div className="rbt-tree">
        {nodes.length ? (
          <svg className="rbt-svg" viewBox={`0 0 1000 ${height}`} preserveAspectRatio="xMidYMid meet">
            {edges.map((edge) => {
              const from = nodeById.get(edge.from);
              const to = nodeById.get(edge.to);
              if (!from || !to) return null;
              return (
                <line
                  key={`rbt-edge-${edge.from}-${edge.to}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  className={`rbt-link ${activeIds.includes(edge.from) && activeIds.includes(edge.to) ? "active" : ""}`}
                />
              );
            })}
            {nodes.map((node) => (
              <g key={`rbt-node-${node.id}`} transform={`translate(${node.x}, ${node.y})`}>
                <circle
                  r={22}
                  className={`rbt-circle ${node.color === RED ? "red" : "black"} ${activeIds.includes(node.id) ? "active" : ""}`}
                />
                <text className="rbt-value" textAnchor="middle" dominantBaseline="middle">
                  {node.key}
                </text>
                <text className="rbt-index" textAnchor="middle" dominantBaseline="hanging" y={28}>
                  {node.color}
                </text>
              </g>
            ))}
          </svg>
        ) : (
          <div className="rbt-empty">Tree is empty. Insert nodes or run demo.</div>
        )}
      </div>

      <div className="rbt-bottom-explain">
        <h5>What this animation shows</h5>
        <ol>
          <li>New node is inserted as RED via BST rules.</li>
          <li>If parent is RED, recolor and/or rotate to restore RB properties.</li>
          <li>Root is always recolored BLACK at the end.</li>
          <li>Search follows normal BST traversal.</li>
          <li>Delete here is visualized via rebuild to keep operations intuitive for revision.</li>
        </ol>
        <h5>Operation trace</h5>
        <div className="rbt-trace">
          {trace.length ? (
            trace.map((line, idx) => (
              <div key={`rbt-trace-${idx}`} className="rbt-trace-line">
                {line}
              </div>
            ))
          ) : (
            <div className="rbt-trace-line muted">No operations yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

