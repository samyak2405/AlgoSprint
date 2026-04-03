import React, { useEffect, useMemo, useRef, useState } from "react";

const ANIM_MS = 420;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function compare(mode, a, b) {
  return mode === "min" ? a < b : a > b;
}

function heapify(arr, mode) {
  const out = [...arr];
  for (let i = Math.floor(out.length / 2) - 1; i >= 0; i--) {
    let idx = i;
    while (true) {
      const left = idx * 2 + 1;
      const right = idx * 2 + 2;
      let best = idx;
      if (left < out.length && compare(mode, out[left], out[best])) best = left;
      if (right < out.length && compare(mode, out[right], out[best])) best = right;
      if (best === idx) break;
      [out[idx], out[best]] = [out[best], out[idx]];
      idx = best;
    }
  }
  return out;
}

function buildNodes(heap) {
  if (!heap.length) return [];
  const totalLevels = Math.floor(Math.log2(heap.length)) + 1;
  const width = 1000;
  const yStart = 58;
  const yStep = 112;
  const radius = 22;
  return heap.map((value, idx) => {
    const level = Math.floor(Math.log2(idx + 1));
    const levelStart = (1 << level) - 1;
    const posInLevel = idx - levelStart;
    const slots = 1 << level;
    const x = ((posInLevel + 0.5) / slots) * width;
    const y = yStart + level * yStep;
    return { idx, value, level, x, y, radius, totalLevels };
  });
}

export function PriorityQueueVisualizer() {
  const [mode, setMode] = useState("min");
  const [heap, setHeap] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [animating, setAnimating] = useState(false);
  const [activeIndices, setActiveIndices] = useState([]);
  const [status, setStatus] = useState("Ready");
  const [opTrace, setOpTrace] = useState([]);

  const heapRef = useRef(heap);
  const modeRef = useRef(mode);
  const nodes = useMemo(() => buildNodes(heap), [heap]);
  const links = useMemo(() => {
    return nodes
      .map((node) => {
        if (node.idx === 0) return null;
        const parentIdx = Math.floor((node.idx - 1) / 2);
        const parent = nodes[parentIdx];
        if (!parent) return null;
        return { from: parent, to: node };
      })
      .filter(Boolean);
  }, [nodes]);

  const setHeapSafe = (next) => {
    heapRef.current = next;
    setHeap(next);
  };

  const addTrace = (msg) => {
    setOpTrace((prev) => [...prev.slice(-8), msg]);
  };

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const animateInsert = async (value) => {
    if (Number.isNaN(value)) return;
    setAnimating(true);
    let arr = [...heapRef.current, value];
    let idx = arr.length - 1;
    setHeapSafe(arr);
    setActiveIndices([idx]);
    setStatus(`Inserted ${value}, bubble-up starts`);
    addTrace(`Insert ${value}: placed at index ${idx}`);
    await sleep(ANIM_MS);

    while (idx > 0) {
      const p = Math.floor((idx - 1) / 2);
      setActiveIndices([idx, p]);
      if (!compare(modeRef.current, arr[idx], arr[p])) break;
      const childVal = arr[idx];
      const parentVal = arr[p];
      [arr[idx], arr[p]] = [arr[p], arr[idx]];
      setHeapSafe([...arr]);
      setStatus(`Swap child ${childVal} with parent ${parentVal}`);
      addTrace(`Bubble-up swap: ${childVal} with ${parentVal}`);
      idx = p;
      await sleep(ANIM_MS);
    }

    setActiveIndices([]);
    setStatus(`Insert done. Top = ${arr[0]}`);
    addTrace(`Insert done: top is ${arr[0]}`);
    setAnimating(false);
  };

  const animateExtractTop = async () => {
    if (!heapRef.current.length) return;
    setAnimating(true);
    let arr = [...heapRef.current];
    const top = arr[0];
    setStatus(`Extract top ${top}`);
    setActiveIndices([0]);
    addTrace(`Extract top ${top}`);
    await sleep(ANIM_MS);

    if (arr.length === 1) {
      setHeapSafe([]);
      setActiveIndices([]);
      setStatus("Heap is now empty");
      addTrace("Heap became empty after extract");
      setAnimating(false);
      return;
    }

    arr[0] = arr.pop();
    setHeapSafe([...arr]);
    setActiveIndices([0]);
    setStatus(`Moved last element to root, bubble-down starts`);
    addTrace(`Move last to root: ${arr[0]}`);
    await sleep(ANIM_MS);

    let idx = 0;
    while (true) {
      const left = idx * 2 + 1;
      const right = idx * 2 + 2;
      let best = idx;
      if (left < arr.length && compare(modeRef.current, arr[left], arr[best])) best = left;
      if (right < arr.length && compare(modeRef.current, arr[right], arr[best])) best = right;
      if (best === idx) break;
      setActiveIndices([idx, best]);
      const parentVal = arr[idx];
      const childVal = arr[best];
      [arr[idx], arr[best]] = [arr[best], arr[idx]];
      setHeapSafe([...arr]);
      setStatus(`Swap index ${idx} with child ${best}`);
      addTrace(`Bubble-down swap: ${parentVal} with ${childVal}`);
      idx = best;
      await sleep(ANIM_MS);
    }

    setActiveIndices([]);
    setStatus(`Extract done. Removed ${top}`);
    addTrace(`Extract done: removed ${top}`);
    setAnimating(false);
  };

  const handleInsert = async () => {
    const value = Number(inputVal.trim());
    if (inputVal.trim() === "" || Number.isNaN(value)) {
      setStatus("Enter a valid number");
      addTrace("Invalid input ignored");
      return;
    }
    setInputVal("");
    await animateInsert(value);
  };

  const handleSample = async () => {
    if (animating) return;
    const sample = [7, 2, 11, 4, 9];
    setHeapSafe([]);
    setActiveIndices([]);
    setStatus(`Building sample (${mode}-heap): ${sample.join(", ")}`);
    setOpTrace([]);
    addTrace(`Build sample: ${sample.join(", ")}`);
    for (const v of sample) {
      await animateInsert(v);
    }
  };

  const handleModeChange = (nextMode) => {
    if (animating || nextMode === modeRef.current) return;
    setMode(nextMode);
    const rebuilt = heapify(heapRef.current, nextMode);
    setHeapSafe(rebuilt);
    setActiveIndices([]);
    setStatus(`Switched to ${nextMode === "min" ? "MinHeap" : "MaxHeap"} and rebuilt heap`);
    addTrace(`Mode switch -> ${nextMode === "min" ? "MinHeap" : "MaxHeap"} (heap rebuilt)`);
  };

  return (
    <div className="heap-viz">
      <div className="heap-viz-header">
        <h4>Interactive Heap Visualizer</h4>
        <span>{mode === "min" ? "MinHeap mode" : "MaxHeap mode"}</span>
      </div>

      <div className="heap-viz-controls">
        <button className={`mode-btn ${mode === "min" ? "active" : ""}`} onClick={() => handleModeChange("min")} disabled={animating}>
          MinHeap
        </button>
        <button className={`mode-btn ${mode === "max" ? "active" : ""}`} onClick={() => handleModeChange("max")} disabled={animating}>
          MaxHeap
        </button>
        <input
          className="text-input"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Value"
          disabled={animating}
        />
        <button className="ghost-btn heap-action-btn" onClick={handleInsert} disabled={animating}>
          Insert
        </button>
        <button className="ghost-btn heap-action-btn" onClick={animateExtractTop} disabled={animating || !heap.length}>
          Extract Top
        </button>
        <button className="ghost-btn heap-action-btn" onClick={handleSample} disabled={animating}>
          Build Sample
        </button>
        <button
          className="ghost-btn heap-action-btn"
          onClick={() => {
            if (animating) return;
            setHeapSafe([]);
            setActiveIndices([]);
            setStatus("Heap cleared");
            setOpTrace([]);
          }}
          disabled={animating}
        >
          Clear
        </button>
      </div>

      <p className="heap-viz-status">{status}</p>
      <div className="heap-array">{heap.length ? `[${heap.join(", ")}]` : "[]"}</div>

      <div className="heap-tree">
        {nodes.length ? (
          <svg className="heap-svg" viewBox={`0 0 1000 ${Math.max(220, nodes[nodes.length - 1].y + 70)}`} preserveAspectRatio="xMidYMid meet">
            {links.map((edge) => (
              <line
                key={`edge-${edge.from.idx}-${edge.to.idx}`}
                x1={edge.from.x}
                y1={edge.from.y}
                x2={edge.to.x}
                y2={edge.to.y}
                className={`heap-link ${activeIndices.includes(edge.from.idx) && activeIndices.includes(edge.to.idx) ? "active" : ""}`}
              />
            ))}
            {nodes.map((node) => (
              <g key={`node-${node.idx}`} transform={`translate(${node.x}, ${node.y})`}>
                <circle className={`heap-circle ${activeIndices.includes(node.idx) ? "active" : ""}`} r={node.radius} />
                <text className="heap-value" textAnchor="middle" dominantBaseline="middle">
                  {node.value}
                </text>
                <text className="heap-index" textAnchor="middle" dominantBaseline="hanging" y={node.radius + 6}>
                  {node.idx}
                </text>
              </g>
            ))}
          </svg>
        ) : (
          <div className="heap-empty">Heap is empty. Insert values or build sample.</div>
        )}
      </div>

      <div className="heap-bottom-explain">
        <h5>How insertion works (Bubble Up)</h5>
        <ol>
          <li>Insert new value at the end of array.</li>
          <li>Compare with parent.</li>
          <li>If heap-order is violated, swap with parent.</li>
          <li>Repeat until property is restored or root is reached.</li>
        </ol>

        <h5>How deletion works (Extract Top + Bubble Down)</h5>
        <ol>
          <li>Remove root (top priority).</li>
          <li>Move last element to root.</li>
          <li>Compare with children and swap with best child (min or max mode).</li>
          <li>Repeat until heap-order is restored.</li>
        </ol>

        <h5>Operation trace</h5>
        <div className="heap-trace">
          {opTrace.length ? (
            opTrace.map((line, idx) => (
              <div key={`trace-${idx}`} className="heap-trace-line">
                {line}
              </div>
            ))
          ) : (
            <div className="heap-trace-line muted">No operations yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

