import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const STEP_DELAY_MS = 380;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function pushStep(steps, arr, highlight, msg, focusNodeId = null, viz = null) {
  const step = { arr: [...arr], highlight: [...highlight], msg, focusNodeId: focusNodeId || null };
  if (viz) {
    if (viz.aux !== undefined) {
      step.aux = viz.aux === null ? null : viz.aux.map((x) => (x === undefined || x === null ? null : x));
    }
    if (viz.auxHighlight !== undefined) step.auxHighlight = [...viz.auxHighlight];
    if (viz.mergeSpan !== undefined) {
      step.mergeSpan = viz.mergeSpan === null ? null : { l: viz.mergeSpan.l, r: viz.mergeSpan.r };
    }
  }
  steps.push(step);
}

function swap(a, i, j) {
  const t = a[i];
  a[i] = a[j];
  a[j] = t;
}

function buildQuickSortSteps(initial) {
  const steps = [];
  const a = [...initial];
  const nodes = {};
  let rootId = null;
  let nextId = 0;

  const makeNode = (l, r, parentId = null) => {
    const id = `q-${nextId++}`;
    nodes[id] = { id, label: `[${l}..${r}]`, detail: "subarray", children: [] };
    if (parentId) nodes[parentId].children.push(id);
    else rootId = id;
    return id;
  };

  const partition = (l, r) => {
    const pivot = a[r];
    let i = l;
    for (let j = l; j < r; j++) {
      pushStep(steps, a, [j, r, i], `Compare a[${j}] with pivot a[${r}]`);
      if (a[j] <= pivot) {
        swap(a, i, j);
        pushStep(steps, a, [i, j], `Swap smaller element left`);
        i++;
      }
    }
    swap(a, i, r);
    pushStep(steps, a, [i], `Pivot placed at index ${i}`);
    return i;
  };
  const qs = (l, r, parentId = null) => {
    if (l > r) return;
    const nodeId = makeNode(l, r, parentId);
    pushStep(steps, a, [l, r], `QuickSort subarray [${l}..${r}]`, nodeId);
    if (l >= r) {
      nodes[nodeId].detail = "base case";
      return;
    }
    const p = partition(l, r);
    nodes[nodeId].detail = `pivot at ${p}`;
    pushStep(steps, a, [p], `Pivot fixed at index ${p}`, nodeId);
    qs(l, p - 1, nodeId);
    qs(p + 1, r, nodeId);
  };
  if (a.length > 0) qs(0, a.length - 1);
  pushStep(steps, a, [], "Quick Sort complete");
  return {
    steps,
    tree: rootId ? { title: "Quick Sort Recursion Tree", rootId, nodes } : null,
  };
}

function buildInsertionSortSteps(initial) {
  const steps = [];
  const a = [...initial];
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    pushStep(steps, a, [i], `Insert key ${key} from index ${i}`);
    while (j >= 0 && a[j] > key) {
      pushStep(steps, a, [j, j + 1], `Shift a[${j}] right`);
      a[j + 1] = a[j];
      j--;
    }
    a[j + 1] = key;
    pushStep(steps, a, [j + 1], `Place key ${key}`);
  }
  pushStep(steps, a, [], "Insertion Sort complete");
  return { steps, tree: null };
}

function buildBubbleSortSteps(initial) {
  const steps = [];
  const a = [...initial];
  const n = a.length;
  for (let i = 0; i < n; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      pushStep(steps, a, [j, j + 1], `Compare a[${j}] and a[${j + 1}]`);
      if (a[j] > a[j + 1]) {
        swap(a, j, j + 1);
        swapped = true;
        pushStep(steps, a, [j, j + 1], "Swap (bubble larger right)");
      }
    }
    pushStep(steps, a, [n - 1 - i], `End of pass: largest settled at ${n - 1 - i}`);
    if (!swapped) break;
  }
  pushStep(steps, a, [], "Bubble Sort complete");
  return { steps, tree: null };
}

function buildSelectionSortSteps(initial) {
  const steps = [];
  const a = [...initial];
  const n = a.length;
  for (let i = 0; i < n; i++) {
    let minIdx = i;
    pushStep(steps, a, [i], `Select minimum starting at ${i}`);
    for (let j = i + 1; j < n; j++) {
      pushStep(steps, a, [minIdx, j], `Compare with a[${j}]`);
      if (a[j] < a[minIdx]) minIdx = j;
    }
    if (minIdx !== i) {
      swap(a, i, minIdx);
      pushStep(steps, a, [i, minIdx], `Swap min into position ${i}`);
    }
  }
  pushStep(steps, a, [], "Selection Sort complete");
  return { steps, tree: null };
}

function siftDown(a, n, i, steps) {
  while (true) {
    let largest = i;
    const l = 2 * i + 1;
    const r = 2 * i + 2;
    if (l < n) {
      pushStep(steps, a, [i, l], `Heap: compare parent ${i} with left ${l}`);
      if (a[l] > a[largest]) largest = l;
    }
    if (r < n) {
      pushStep(steps, a, [largest, r], `Heap: compare with right ${r}`);
      if (a[r] > a[largest]) largest = r;
    }
    if (largest === i) break;
    swap(a, i, largest);
    pushStep(steps, a, [i, largest], "Heap: sift down swap");
    i = largest;
  }
}

function buildHeapSortSteps(initial) {
  const steps = [];
  const a = [...initial];
  const n = a.length;
  if (n === 0) {
    pushStep(steps, a, [], "Heap Sort complete");
    return { steps, tree: null };
  }
  pushStep(steps, a, [], "Build max-heap");
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    pushStep(steps, a, [i], `Heapify subtree at ${i}`);
    siftDown(a, n, i, steps);
  }
  pushStep(steps, a, [], "Extract max to end");
  for (let end = n - 1; end > 0; end--) {
    pushStep(steps, a, [0, end], `Move max a[0] to sorted position ${end}`);
    swap(a, 0, end);
    pushStep(steps, a, [0, end], "Swap root with last unsorted");
    siftDown(a, end, 0, steps);
  }
  pushStep(steps, a, [], "Heap Sort complete");
  return { steps, tree: null };
}

function buildCountingSortSteps(initial) {
  const steps = [];
  const a = [...initial];
  if (a.length === 0) {
    pushStep(steps, a, [], "Counting Sort complete");
    return { steps, tree: null };
  }
  const maxVal = Math.max(...a);
  const cnt = new Array(maxVal + 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    cnt[a[i]]++;
    pushStep(steps, a, [i], `Count[${a[i]}]++ (scan input)`);
  }
  const out = new Array(a.length);
  let idx = 0;
  for (let v = 0; v <= maxVal; v++) {
    while (cnt[v] > 0) {
      out[idx++] = v;
      cnt[v]--;
      pushStep(steps, out, [idx - 1], `Place value ${v} in output`);
    }
  }
  for (let i = 0; i < a.length; i++) a[i] = out[i];
  pushStep(steps, a, [], "Counting Sort complete");
  return { steps, tree: null };
}

function buildRadixSortSteps(initial) {
  const steps = [];
  const a = [...initial];
  if (a.length === 0) {
    pushStep(steps, a, [], "Radix Sort complete");
    return { steps, tree: null };
  }
  const max = Math.max(...a);
  let exp = 1;
  while (Math.floor(max / exp) > 0) {
    const buckets = Array.from({ length: 10 }, () => []);
    pushStep(steps, a, [], `Radix pass: digit place ${exp}`);
    for (let i = 0; i < a.length; i++) {
      const d = Math.floor(a[i] / exp) % 10;
      buckets[d].push(a[i]);
      pushStep(steps, a, [i], `Bucket ${d}: enqueue ${a[i]}`);
    }
    let k = 0;
    for (let d = 0; d < 10; d++) {
      for (const v of buckets[d]) {
        a[k++] = v;
        pushStep(steps, a, [k - 1], `Collect from bucket ${d}: ${v}`);
      }
    }
    exp *= 10;
  }
  pushStep(steps, a, [], "Radix Sort complete");
  return { steps, tree: null };
}

function buildMergeSortSteps(initial) {
  const steps = [];
  const a = [...initial];
  const n = a.length;
  const emptyAux = () => new Array(n).fill(null);
  const nodes = {};
  let rootId = null;
  let nextId = 0;
  const batchCopyBack = n > 8;

  const makeNode = (l, r, parentId = null) => {
    const id = `m-${nextId++}`;
    nodes[id] = { id, label: `[${l}..${r}]`, detail: "split", children: [], l, r, mid: null };
    if (parentId) nodes[parentId].children.push(id);
    else rootId = id;
    return id;
  };

  const merge = (l, m, r, nodeId) => {
    const mergeAux = new Array(n).fill(null);
    const vizSnap = () => mergeAux.map((x) => (x === null || x === undefined ? null : x));

    pushStep(
      steps,
      a,
      [l, m, m + 1, r],
      `Merge: sorted left a[${l}..${m}] and right a[${m + 1}..${r}] into aux[${l}..${r}]`,
      nodeId,
      { aux: vizSnap(), mergeSpan: { l, r }, auxHighlight: [] },
    );

    let i = l;
    let j = m + 1;
    let k = l;

    while (i <= m && j <= r) {
      pushStep(steps, a, [i, j], `Compare a[${i}]=${a[i]} vs a[${j}]=${a[j]}`, nodeId, {
        aux: vizSnap(),
        mergeSpan: { l, r },
        auxHighlight: [],
      });
      if (a[i] <= a[j]) {
        mergeAux[k] = a[i];
        pushStep(steps, a, [i, k], `Take left: a[${i}]=${a[i]} → aux[${k}]`, nodeId, {
          aux: vizSnap(),
          mergeSpan: { l, r },
          auxHighlight: [k],
        });
        i++;
        k++;
      } else {
        mergeAux[k] = a[j];
        pushStep(steps, a, [j, k], `Take right: a[${j}]=${a[j]} → aux[${k}]`, nodeId, {
          aux: vizSnap(),
          mergeSpan: { l, r },
          auxHighlight: [k],
        });
        j++;
        k++;
      }
    }
    while (i <= m) {
      mergeAux[k] = a[i];
      pushStep(steps, a, [i, k], `Drain left: a[${i}]=${a[i]} → aux[${k}]`, nodeId, {
        aux: vizSnap(),
        mergeSpan: { l, r },
        auxHighlight: [k],
      });
      i++;
      k++;
    }
    while (j <= r) {
      mergeAux[k] = a[j];
      pushStep(steps, a, [j, k], `Drain right: a[${j}]=${a[j]} → aux[${k}]`, nodeId, {
        aux: vizSnap(),
        mergeSpan: { l, r },
        auxHighlight: [k],
      });
      j++;
      k++;
    }

    if (batchCopyBack) {
      for (let t = l; t <= r; t++) a[t] = mergeAux[t];
      pushStep(steps, a, [l, r], `Copy merged aux[${l}..${r}] back into a[${l}..${r}]`, nodeId, {
        aux: emptyAux(),
        mergeSpan: null,
        auxHighlight: [],
      });
    } else {
      for (let t = l; t <= r; t++) {
        const val = mergeAux[t];
        a[t] = val;
        mergeAux[t] = null;
        pushStep(steps, a, [t], `Copy aux[${t}]=${val} → a[${t}]`, nodeId, {
          aux: vizSnap(),
          mergeSpan: { l, r },
          auxHighlight: [],
        });
      }
      pushStep(steps, a, [l, r], `Segment [${l}..${r}] merged in place`, nodeId, {
        aux: emptyAux(),
        mergeSpan: null,
        auxHighlight: [],
      });
    }
  };

  const ms = (l, r, parentId = null) => {
    const nodeId = makeNode(l, r, parentId);
    if (l >= r) {
      nodes[nodeId].detail = "base case";
      pushStep(steps, a, [l], `Singleton (sorted): a[${l}]=${a[l]}`, nodeId, {
        aux: emptyAux(),
        mergeSpan: null,
        auxHighlight: [],
      });
      return;
    }
    const m = l + Math.floor((r - l) / 2);
    nodes[nodeId].mid = m;
    nodes[nodeId].detail = `mid ${m}`;
    pushStep(
      steps,
      a,
      [l, m, r],
      `Divide [${l}..${r}] at mid=${m} → recurse on [${l}..${m}] and [${m + 1}..${r}]`,
      nodeId,
      { aux: emptyAux(), mergeSpan: { l, r }, auxHighlight: [] },
    );
    ms(l, m, nodeId);
    ms(m + 1, r, nodeId);
    merge(l, m, r, nodeId);
  };

  if (a.length > 0) ms(0, a.length - 1);
  pushStep(steps, a, [], "Merge Sort complete", null, { aux: emptyAux(), mergeSpan: null, auxHighlight: [] });
  return {
    steps,
    tree: rootId ? { title: "Merge sort — subarrays (live values)", rootId, nodes } : null,
  };
}

const ALGO_BUILDERS = {
  "Quick Sort": buildQuickSortSteps,
  "Merge Sort": buildMergeSortSteps,
  "Insertion Sort": buildInsertionSortSteps,
  "Bubble Sort": buildBubbleSortSteps,
  "Selection Sort": buildSelectionSortSteps,
  "Heap Sort": buildHeapSortSteps,
  "Counting Sort": buildCountingSortSteps,
  "Radix Sort": buildRadixSortSteps,
};

const DEFAULT_DEMO = [5, 2, 8, 1, 9, 3, 7, 4, 6];

export function SortingVisualizer({ algorithmName }) {
  const builder = ALGO_BUILDERS[algorithmName];
  const [array, setArray] = useState([...DEFAULT_DEMO]);
  const [highlight, setHighlight] = useState([]);
  const [status, setStatus] = useState("Ready");
  const [stepLog, setStepLog] = useState([]);
  const [treeData, setTreeData] = useState(null);
  const [activeNodeId, setActiveNodeId] = useState(null);
  const [auxView, setAuxView] = useState(null);
  const [auxHighlight, setAuxHighlight] = useState([]);
  const [mergeSpan, setMergeSpan] = useState(null);
  const [running, setRunning] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const cancelRef = useRef(false);
  const logRef = useRef(null);
  const treeScrollRef = useRef(null);
  const treeInnerRef = useRef(null);
  const [treeScale, setTreeScale] = useState(1);
  const [treeViewportH, setTreeViewportH] = useState(0);

  useEffect(() => {
    cancelRef.current = false;
    return () => {
      cancelRef.current = true;
    };
  }, []);

  useEffect(() => {
    setArray([...DEFAULT_DEMO]);
    setHighlight([]);
    setStatus("Ready");
    setStepLog([]);
    setTreeData(null);
    setActiveNodeId(null);
    setAuxView(null);
    setAuxHighlight([]);
    setMergeSpan(null);
    setCustomInput("");
  }, [algorithmName]);

  useEffect(() => {
    if (!logRef.current) return;
    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [stepLog]);

  const fitRecursionTree = useCallback(() => {
    const outer = treeScrollRef.current;
    const inner = treeInnerRef.current;
    if (!outer || !inner || !treeData) {
      setTreeScale(1);
      setTreeViewportH(0);
      return;
    }
    const pad = 8;
    const available = Math.max(0, outer.clientWidth - pad);
    const needed = inner.scrollWidth;
    const next = needed > 0 ? Math.min(1, available / needed) : 1;
    setTreeScale(next);
    setTreeViewportH(Math.ceil(inner.scrollHeight * next) + pad);
  }, [treeData]);

  useEffect(() => {
    if (!treeData) {
      setTreeScale(1);
      setTreeViewportH(0);
    }
  }, [treeData]);

  useLayoutEffect(() => {
    if (!treeData || algorithmName === "Merge Sort") return;
    const schedule = () => requestAnimationFrame(() => fitRecursionTree());
    schedule();
    const outer = treeScrollRef.current;
    const inner = treeInnerRef.current;
    const ro = new ResizeObserver(schedule);
    if (outer) ro.observe(outer);
    if (inner) ro.observe(inner);
    window.addEventListener("resize", schedule);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [treeData, algorithmName, fitRecursionTree, activeNodeId]);

  const runAnimation = useCallback(async () => {
    if (!builder || running) return;
    setRunning(true);
    cancelRef.current = false;
    const output = builder([...array]);
    const seq = output?.steps ?? [];
    setTreeData(output?.tree ?? null);
    setActiveNodeId(null);
    setStepLog([]);
    for (const step of seq) {
      if (cancelRef.current) break;
      setArray(step.arr);
      setHighlight(step.highlight);
      setStatus(step.msg);
      setActiveNodeId(step.focusNodeId || null);
      if (step.aux !== undefined) setAuxView(step.aux);
      if (step.auxHighlight !== undefined) setAuxHighlight(step.auxHighlight);
      if (step.mergeSpan !== undefined) setMergeSpan(step.mergeSpan);
      setStepLog((prev) => [...prev, step.msg]);
      await sleep(STEP_DELAY_MS);
    }
    setHighlight([]);
    setActiveNodeId(null);
    setAuxView(null);
    setAuxHighlight([]);
    setMergeSpan(null);
    setRunning(false);
  }, [array, builder, running]);

  const parseCustom = () => {
    const parts = customInput
      .split(/[\s,]+/)
      .map((x) => x.trim())
      .filter(Boolean);
    const nums = parts.map(Number).filter((n) => !Number.isNaN(n) && Number.isFinite(n));
    if (nums.length === 0) {
      setStatus("Enter numbers separated by space or comma");
      return;
    }
    if (algorithmName === "Radix Sort" && nums.some((n) => n < 0)) {
      setStatus("Radix demo uses non-negative integers only");
      return;
    }
    setArray(nums.slice(0, 16));
    setHighlight([]);
    setStatus(`Array set (${nums.length} elements, showing first 16)`);
    setStepLog([]);
    setTreeData(null);
    setActiveNodeId(null);
    setAuxView(null);
    setAuxHighlight([]);
    setMergeSpan(null);
  };

  const resetDemo = () => {
    if (running) return;
    setArray([...DEFAULT_DEMO]);
    setHighlight([]);
    setStatus("Reset to demo array");
    setStepLog([]);
    setTreeData(null);
    setActiveNodeId(null);
    setAuxView(null);
    setAuxHighlight([]);
    setMergeSpan(null);
  };

  if (!builder) return null;

  const auxValsForScale = (auxView || []).filter((x) => x != null);
  const barMax = Math.max(1, ...array, ...auxValsForScale);

  return (
    <div className="sort-viz">
      <div className="sort-viz-header">
        <h4>Sorting animation: {algorithmName}</h4>
        <span>{running ? "Running…" : "Paused"}</span>
      </div>
      <p className="sort-viz-status">{status}</p>
      <div className="sort-step-log" ref={logRef}>
        {stepLog.length === 0 ? (
          <p className="sort-step-line muted">Run animation to see each step in sequence.</p>
        ) : (
          stepLog.map((line, idx) => (
            <p key={`step-${idx}-${line}`} className="sort-step-line">
              {idx + 1}. {line}
            </p>
          ))
        )}
      </div>
      <div className="sort-viz-controls">
        <input
          className="text-input"
          placeholder="Custom: 5 2 8 1 9 (max 16 nums)"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          disabled={running}
        />
        <button type="button" className="ghost-btn sort-action-btn" onClick={parseCustom} disabled={running}>
          Set array
        </button>
        <button type="button" className="ghost-btn sort-action-btn" onClick={resetDemo} disabled={running}>
          Demo array
        </button>
        <button type="button" className="ghost-btn sort-action-btn" onClick={runAnimation} disabled={running}>
          Play animation
        </button>
      </div>
      <div className="sort-bars-block">
        {algorithmName === "Merge Sort" ? (
          <p className="sort-bars-caption">Main array (a)</p>
        ) : null}
        <div className="sort-bars">
          {array.map((v, i) => {
            const hPct = (v / barMax) * 100;
            const active = highlight.includes(i);
            const dim = mergeSpan && (i < mergeSpan.l || i > mergeSpan.r);
            return (
              <div
                key={`bar-wrap-${i}-${v}`}
                className={`sort-bar-wrap ${dim ? "sort-merge-dim" : ""}`}
              >
                <div
                  className={`sort-bar ${active ? "active" : ""}`}
                  style={{ height: `${Math.max(8, hPct)}%` }}
                  title={`index ${i}: ${v}`}
                />
                <span className="sort-bar-label">{v}</span>
              </div>
            );
          })}
        </div>
        {algorithmName === "Merge Sort" ? (
          <>
            <p className="sort-bars-caption sort-bars-caption-aux">Scratch buffer (aux)</p>
            <div className="sort-bars sort-aux-bars">
              {array.map((aVal, i) => {
                const fromAux = auxView && auxView[i] != null;
                const v = fromAux ? auxView[i] : aVal;
                const hPct = (v / barMax) * 100;
                const active = auxHighlight.includes(i);
                const dim = mergeSpan && (i < mergeSpan.l || i > mergeSpan.r);
                return (
                  <div
                    key={`aux-wrap-${i}`}
                    className={`sort-bar-wrap ${dim ? "sort-merge-dim" : ""}`}
                  >
                    <div
                      className={`sort-bar sort-bar-aux ${!fromAux ? "sort-bar-aux-mirror" : ""} ${active ? "active" : ""}`}
                      style={{ height: `${Math.max(8, hPct)}%` }}
                      title={
                        fromAux
                          ? `aux[${i}] = ${v} (merged)`
                          : `aux[${i}] not set — showing a[${i}] = ${aVal} from main array`
                      }
                    />
                    <span className={`sort-bar-label ${!fromAux ? "sort-bar-label-mirror" : ""}`}>{v}</span>
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
      {treeData && algorithmName === "Merge Sort" ? (
        <div className="sort-rec-tree sort-rec-tree-merge-boxes">
          <h5>{treeData.title}</h5>
          <p className="sort-merge-tree-legend muted">
            Each box is a subarray of <code>a</code>. Highlighted cells match the main array; the glowing box is the current recursive call.
          </p>
          <div className="merge-tree-panel">
            <MergeSortTreeNode
              nodeId={treeData.rootId}
              nodes={treeData.nodes}
              array={array}
              activeNodeId={activeNodeId}
              highlight={highlight}
              mergeSpan={mergeSpan}
              auxView={auxView}
              auxHighlight={auxHighlight}
            />
          </div>
        </div>
      ) : treeData ? (
        <div className="sort-rec-tree">
          <h5>{treeData.title}</h5>
          <div
            ref={treeScrollRef}
            className="sort-rec-tree-scroll"
            style={treeViewportH > 0 ? { minHeight: treeViewportH } : undefined}
          >
            <div
              ref={treeInnerRef}
              className="sort-rec-tree-inner"
              style={{
                transform: `scale(${treeScale})`,
                transformOrigin: "top center",
              }}
            >
              <ul className="sort-tree-root">
                <SortTreeNode nodeId={treeData.rootId} nodes={treeData.nodes} activeNodeId={activeNodeId} />
              </ul>
            </div>
          </div>
        </div>
      ) : null}
      <p className="sort-viz-hint muted">
        {algorithmName === "Merge Sort"
          ? "Merge sort: dimmed indices are outside the current subarray. The aux row mirrors a until aux is written. The boxed tree shows each subarray with live values and highlights the active call and indices."
          : "Highlighted bars show indices being compared or moved. Use a short custom list for clearer merge / heap traces."}
      </p>
    </div>
  );
}

export const SORTING_VISUALIZER_NAMES = new Set(Object.keys(ALGO_BUILDERS));

function MergeSortTreeNode({ nodeId, nodes, array, activeNodeId, highlight, mergeSpan, auxView, auxHighlight }) {
  const node = nodes[nodeId];
  if (!node || node.l === undefined || node.r === undefined) return null;
  const { l, r, mid } = node;
  const segment = [];
  for (let i = l; i <= r; i++) segment.push({ idx: i, val: array[i] });
  const boxActive = activeNodeId === nodeId;
  const inMergeWindow = mergeSpan && !(r < mergeSpan.l || l > mergeSpan.r);
  const isMergeFocus = mergeSpan && mergeSpan.l === l && mergeSpan.r === r;
  const showAuxStrip = Boolean(isMergeFocus && auxView && auxView.length === array.length);

  return (
    <div
      className={`merge-tree-col ${boxActive ? "merge-tree-col-active" : ""} ${inMergeWindow ? "merge-tree-col-in-range" : ""}`}
    >
      <div className={`merge-tree-box ${boxActive ? "merge-tree-box-glow" : ""}`}>
        <div className="merge-tree-box-head">
          <span className="merge-tree-range">
            a[{l}..{r}]
          </span>
          {mid != null ? (
            <span className="merge-tree-badge merge-tree-badge-split">split @ {mid}</span>
          ) : (
            <span className="merge-tree-badge merge-tree-badge-leaf">leaf</span>
          )}
        </div>
        <div className="merge-tree-cells">
          {segment.map(({ idx, val }) => (
            <div
              key={idx}
              className={`merge-tree-cell ${(highlight || []).includes(idx) ? "merge-tree-cell-pulse" : ""}`}
            >
              <span className="merge-tree-cell-idx">{idx}</span>
              <span className="merge-tree-cell-val">{val}</span>
            </div>
          ))}
        </div>
        {showAuxStrip ? (
          <div className="merge-tree-aux-strip" aria-label="aux segment">
            <span className="merge-tree-aux-label">aux</span>
            <div className="merge-tree-aux-cells">
              {segment.map(({ idx }) => {
                const fromAux = auxView[idx] != null;
                const v = fromAux ? auxView[idx] : array[idx];
                return (
                  <div
                    key={`a-${idx}`}
                    className={`merge-tree-aux-cell ${fromAux ? "filled" : "mirror"} ${(auxHighlight || []).includes(idx) ? "active" : ""}`}
                  >
                    {v}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
      {node.children.length > 0 ? (
        <div className="merge-tree-children">
          {node.children.map((childId) => (
            <MergeSortTreeNode
              key={childId}
              nodeId={childId}
              nodes={nodes}
              array={array}
              activeNodeId={activeNodeId}
              highlight={highlight}
              mergeSpan={mergeSpan}
              auxView={auxView}
              auxHighlight={auxHighlight}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SortTreeNode({ nodeId, nodes, activeNodeId }) {
  const node = nodes[nodeId];
  if (!node) return null;
  return (
    <li>
      <div className={`sort-tree-node ${activeNodeId === nodeId ? "active" : ""}`}>
        <strong className="sort-tree-node-label">{node.label}</strong>
        <span className="sort-tree-node-detail">{node.detail}</span>
      </div>
      {node.children.length > 0 ? (
        <ul>
          {node.children.map((childId) => (
            <SortTreeNode key={childId} nodeId={childId} nodes={nodes} activeNodeId={activeNodeId} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
