import React, { useRef, useState } from "react";

const ANIM_MS = 380;
let UID = 1;
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function makeNode(val) { return { id: UID++, val }; }

export function LinkedListVisualizer() {
  const [nodes, setNodes] = useState(() => [makeNode(10), makeNode(20), makeNode(30)]);
  const [inputVal, setInputVal] = useState("");
  const [animating, setAnimating] = useState(false);
  const [activeIds, setActiveIds] = useState([]);
  const [status, setStatus] = useState("Ready — LinkedList (Deque API) supports O(1) head/tail ops.");
  const [trace, setTrace] = useState([]);
  const nodesRef = useRef([...nodes]);

  const sync = arr => { nodesRef.current = arr; setNodes([...arr]); };
  const addTrace = msg => setTrace(p => [...p.slice(-10), msg]);

  const getValue = () => {
    const v = Number(inputVal);
    if (inputVal.trim() === "" || isNaN(v)) return null;
    return v;
  };

  const handleAddFirst = async () => {
    const val = getValue();
    if (val === null) { setStatus("Enter a valid number."); return; }
    setAnimating(true);
    const node = makeNode(val);
    setStatus(`addFirst(${val}) — O(1): create node, update head pointer`);
    addTrace(`addFirst(${val})`);
    const arr = [node, ...nodesRef.current];
    sync(arr);
    setActiveIds([node.id]);
    await sleep(ANIM_MS);
    setActiveIds([]);
    setStatus(`Added ${val} at head. size = ${arr.length}`);
    setInputVal("");
    setAnimating(false);
  };

  const handleAddLast = async () => {
    const val = getValue();
    if (val === null) { setStatus("Enter a valid number."); return; }
    setAnimating(true);
    const node = makeNode(val);
    setStatus(`addLast(${val}) — O(1): create node, update tail pointer`);
    addTrace(`addLast(${val})`);
    const arr = [...nodesRef.current, node];
    sync(arr);
    setActiveIds([node.id]);
    await sleep(ANIM_MS);
    setActiveIds([]);
    setStatus(`Added ${val} at tail. size = ${arr.length}`);
    setInputVal("");
    setAnimating(false);
  };

  const handleRemoveFirst = async () => {
    if (!nodesRef.current.length) { setStatus("List is empty."); return; }
    setAnimating(true);
    const head = nodesRef.current[0];
    setActiveIds([head.id]);
    setStatus(`removeFirst() — O(1): remove head (${head.val}), update head pointer`);
    addTrace(`removeFirst() = ${head.val}`);
    await sleep(ANIM_MS);
    const arr = nodesRef.current.slice(1);
    sync(arr);
    setActiveIds([]);
    setStatus(`Removed head ${head.val}. size = ${arr.length}`);
    setAnimating(false);
  };

  const handleRemoveLast = async () => {
    if (!nodesRef.current.length) { setStatus("List is empty."); return; }
    setAnimating(true);
    const tail = nodesRef.current[nodesRef.current.length - 1];
    setActiveIds([tail.id]);
    setStatus(`removeLast() — O(1): remove tail (${tail.val}), update tail pointer`);
    addTrace(`removeLast() = ${tail.val}`);
    await sleep(ANIM_MS);
    const arr = nodesRef.current.slice(0, -1);
    sync(arr);
    setActiveIds([]);
    setStatus(`Removed tail ${tail.val}. size = ${arr.length}`);
    setAnimating(false);
  };

  const handleTraverse = async () => {
    if (!nodesRef.current.length) { setStatus("List is empty."); return; }
    setAnimating(true);
    setStatus("Traversing — O(n): follow next pointers from head to tail");
    addTrace("traverse from head");
    for (const node of nodesRef.current) {
      setActiveIds([node.id]);
      await sleep(ANIM_MS * 0.8);
    }
    setActiveIds([]);
    setStatus(`Traversal done. Visited ${nodesRef.current.length} nodes.`);
    setAnimating(false);
  };

  const handleReset = () => {
    if (animating) return;
    const init = [makeNode(10), makeNode(20), makeNode(30)];
    sync(init);
    setActiveIds([]); setInputVal("");
    setStatus("Reset to default."); setTrace([]);
  };

  const W = 90, GAP = 50, R = 28, ARROW = 18;
  const totalW = Math.max(400, nodes.length * (W + GAP));
  const svgH = 120;

  return (
    <div className="ll-viz">
      <div className="ll-viz-header">
        <h4>LinkedList (Deque API) Visualizer</h4>
        <span>size = {nodes.length}</span>
      </div>

      <div className="ll-viz-controls">
        <input className="text-input" placeholder="value" value={inputVal}
          onChange={e => setInputVal(e.target.value)} disabled={animating} />
        <button className="ghost-btn" onClick={handleAddFirst} disabled={animating}>addFirst</button>
        <button className="ghost-btn" onClick={handleAddLast} disabled={animating}>addLast</button>
        <button className="ghost-btn" onClick={handleRemoveFirst} disabled={animating || !nodes.length}>removeFirst</button>
        <button className="ghost-btn" onClick={handleRemoveLast} disabled={animating || !nodes.length}>removeLast</button>
        <button className="ghost-btn" onClick={handleTraverse} disabled={animating || !nodes.length}>Traverse</button>
        <button className="ghost-btn" onClick={handleReset} disabled={animating}>Reset</button>
      </div>

      <p className="ll-viz-status">{status}</p>

      <div className="ll-canvas-wrap">
        {nodes.length === 0 ? (
          <div className="ll-empty">List is empty.</div>
        ) : (
          <svg className="ll-svg" viewBox={`0 0 ${totalW} ${svgH}`} preserveAspectRatio="xMinYMid meet">
            <defs>
              <marker id="ll-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" className="ll-arrowhead" />
              </marker>
              <marker id="ll-arrow-active" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" className="ll-arrowhead active" />
              </marker>
            </defs>

            {/* NULL at start */}
            <text x={10} y={svgH / 2 + 5} className="ll-null">NULL</text>
            {nodes.length > 0 && (
              <line x1={42} y1={svgH / 2} x2={55} y2={svgH / 2}
                className="ll-edge" markerEnd="url(#ll-arrow)" />
            )}

            {nodes.map((node, i) => {
              const cx = 68 + i * (W + GAP) + W / 2;
              const cy = svgH / 2;
              const isActive = activeIds.includes(node.id);
              return (
                <g key={node.id}>
                  {/* node box */}
                  <rect x={cx - W / 2} y={cy - R} width={W} height={R * 2}
                    rx={8} className={`ll-node-rect ${isActive ? "active" : ""}`} />
                  {/* value */}
                  <text x={cx - 10} y={cy + 5} className="ll-node-val">{node.val}</text>
                  {/* separator */}
                  <line x1={cx + 14} y1={cy - R + 4} x2={cx + 14} y2={cy + R - 4} className="ll-sep" />
                  {/* next pointer dot */}
                  <circle cx={cx + 28} cy={cy} r={5} className={`ll-ptr-dot ${isActive ? "active" : ""}`} />
                  {/* label */}
                  {i === 0 && <text x={cx - W / 2} y={cy - R - 8} className="ll-label">head</text>}
                  {i === nodes.length - 1 && <text x={cx + W / 2 - 28} y={cy - R - 8} className="ll-label">tail</text>}
                  {/* arrow to next */}
                  {i < nodes.length - 1 && (
                    <line
                      x1={cx + 33} y1={cy}
                      x2={cx + W / 2 + GAP - 10} y2={cy}
                      className={`ll-edge ${isActive ? "active" : ""}`}
                      markerEnd={isActive ? "url(#ll-arrow-active)" : "url(#ll-arrow)"}
                    />
                  )}
                  {/* NULL at end */}
                  {i === nodes.length - 1 && (
                    <>
                      <line x1={cx + 33} y1={cy} x2={cx + 33 + ARROW} y2={cy}
                        className="ll-edge" markerEnd="url(#ll-arrow)" />
                      <text x={cx + 33 + ARROW + 4} y={cy + 5} className="ll-null">NULL</text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        )}
      </div>

      <div className="array-explain">
        <h5>Complexity guide</h5>
        <ol>
          <li><strong>addFirst / addLast</strong> — O(1): just rewire head/tail pointer.</li>
          <li><strong>removeFirst / removeLast</strong> — O(1): same.</li>
          <li><strong>get(i)</strong> — O(n): must traverse from head.</li>
          <li><strong>Preferred over ArrayList</strong> when inserts/removes at ends dominate.</li>
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
