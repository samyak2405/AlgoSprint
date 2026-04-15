import React, { useState, useEffect, useCallback, useRef } from "react";

/* ─── Shared Controls ──────────────────────────────────────────── */
function VizControls({ step, total, onPrev, onNext, onReset, autoPlay, onToggleAuto }) {
  return (
    <div className="pviz-controls">
      <button className="pviz-btn" onClick={onReset} title="Reset">↺</button>
      <button className="pviz-btn" onClick={onPrev} disabled={step === 0}>← Prev</button>
      <span className="pviz-step-pill">{step + 1} / {total}</span>
      <button className="pviz-btn" onClick={onNext} disabled={step === total - 1}>Next →</button>
      <button className={`pviz-btn ${autoPlay ? "pviz-btn-pause" : "pviz-btn-play"}`} onClick={onToggleAuto}>
        {autoPlay ? "⏸ Pause" : "▶ Play"}
      </button>
    </div>
  );
}

function useSteps(steps, speed = 950) {
  const [step, setStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  useEffect(() => {
    if (!autoPlay) return;
    if (step >= steps.length - 1) { setAutoPlay(false); return; }
    const t = setTimeout(() => setStep(s => s + 1), speed);
    return () => clearTimeout(t);
  }, [autoPlay, step, steps.length, speed]);
  const reset = useCallback(() => { setStep(0); setAutoPlay(false); }, []);
  return {
    step, setStep, autoPlay, setAutoPlay, reset,
    prev: () => setStep(s => Math.max(0, s - 1)),
    next: () => setStep(s => Math.min(steps.length - 1, s + 1)),
  };
}

/* ─── 1. SLIDING WINDOW ────────────────────────────────────────── */
function SlidingWindowViz({ variant }) {
  const arr = [2, 3, 1, 2, 4, 3];
  const target = 7;

  // Variable window: min length subarray with sum >= target
  const steps = [];
  let l = 0, sum = 0, minLen = Infinity;
  for (let r = 0; r < arr.length; r++) {
    sum += arr[r];
    while (sum >= target) {
      minLen = Math.min(minLen, r - l + 1);
      sum -= arr[l++];
    }
    steps.push({
      l: l, r, sum: (() => { let s = 0; for (let i = l; i <= r; i++) s += arr[i]; return s; })(),
      minLen: minLen === Infinity ? "—" : minLen,
      action: sum >= target
        ? `sum=${steps[steps.length - 1]?.sum ?? 0} ≥ ${target} → shrink left`
        : `Expand right to index ${r} (arr[${r}]=${arr[r]})`,
      shrinking: sum >= target,
    });
  }
  // Add a couple shrink steps for illustration
  const richSteps = [];
  l = 0; sum = 0; let best = Infinity;
  for (let r = 0; r < arr.length; r++) {
    sum += arr[r];
    richSteps.push({ l, r, sum, best: best === Infinity ? "—" : best, action: `Expand: add arr[${r}]=${arr[r]}, sum=${sum}` });
    while (sum >= target) {
      best = Math.min(best, r - l + 1);
      richSteps.push({ l, r, sum, best, action: `sum=${sum} ≥ ${target} → shrink: remove arr[${l}]=${arr[l]}, minLen=${best}` });
      sum -= arr[l++];
    }
  }

  const { step, autoPlay, setAutoPlay, reset, prev, next } = useSteps(richSteps, 1100);
  const s = richSteps[step];

  return (
    <div className="pviz-card">
      <div className="pviz-header">
        <span className="pviz-label">Sliding Window</span>
        <span className="pviz-subtitle">Min subarray with sum ≥ {target} · arr = [{arr.join(", ")}]</span>
      </div>

      <div className="pviz-array-row">
        {arr.map((v, i) => {
          const inWindow = i >= s.l && i <= s.r;
          const isL = i === s.l && inWindow;
          const isR = i === s.r && inWindow;
          return (
            <div key={i} className="pviz-cell-wrap">
              {isL && <div className="pviz-ptr pviz-ptr-l">L</div>}
              {isR && <div className="pviz-ptr pviz-ptr-r">R</div>}
              <div className={`pviz-cell ${inWindow ? "pviz-cell-active" : ""} ${isL ? "pviz-cell-l" : ""} ${isR ? "pviz-cell-r" : ""}`}>
                {v}
              </div>
              <div className="pviz-cell-idx">{i}</div>
            </div>
          );
        })}
      </div>

      <div className="pviz-stats-row">
        <span className="pviz-stat"><b>sum</b> {s.sum}</span>
        <span className="pviz-stat"><b>window</b> [{s.l}..{s.r}]</span>
        <span className="pviz-stat"><b>minLen</b> {s.best}</span>
      </div>

      <div className="pviz-action">{s.action}</div>
      <VizControls step={step} total={richSteps.length} onPrev={prev} onNext={next} onReset={reset} autoPlay={autoPlay} onToggleAuto={() => setAutoPlay(v => !v)} />
    </div>
  );
}

/* ─── 2. TWO POINTERS ──────────────────────────────────────────── */
function TwoPointersViz() {
  const arr = [-4, -1, 0, 3, 5, 6, 9];
  const target = 5;

  const steps = [];
  let lo = 0, hi = arr.length - 1;
  steps.push({ lo, hi, sum: arr[lo] + arr[hi], action: `Start: L=${lo}, R=${hi}`, found: false });
  while (lo < hi) {
    const s = arr[lo] + arr[hi];
    if (s === target) {
      steps.push({ lo, hi, sum: s, action: `Found! arr[${lo}]=${arr[lo]} + arr[${hi}]=${arr[hi]} = ${target} ✓`, found: true });
      break;
    } else if (s < target) {
      steps.push({ lo, hi, sum: s, action: `sum=${s} < ${target} → move L right`, found: false });
      lo++;
    } else {
      steps.push({ lo, hi, sum: s, action: `sum=${s} > ${target} → move R left`, found: false });
      hi--;
    }
    if (lo < hi)
      steps.push({ lo, hi, sum: arr[lo] + arr[hi], action: `Check: arr[${lo}]=${arr[lo]} + arr[${hi}]=${arr[hi]} = ${arr[lo] + arr[hi]}`, found: arr[lo] + arr[hi] === target });
  }

  const { step, autoPlay, setAutoPlay, reset, prev, next } = useSteps(steps, 1000);
  const s = steps[step];

  return (
    <div className="pviz-card">
      <div className="pviz-header">
        <span className="pviz-label">Two Pointers</span>
        <span className="pviz-subtitle">Find pair with sum = {target} · arr = [{arr.join(", ")}]</span>
      </div>

      <div className="pviz-array-row">
        {arr.map((v, i) => {
          const isL = i === s.lo;
          const isR = i === s.hi;
          const isDone = s.found && (isL || isR);
          return (
            <div key={i} className="pviz-cell-wrap">
              {isL && <div className="pviz-ptr pviz-ptr-l">L</div>}
              {isR && <div className="pviz-ptr pviz-ptr-r">R</div>}
              <div className={`pviz-cell ${isL ? "pviz-cell-l" : ""} ${isR ? "pviz-cell-r" : ""} ${isDone ? "pviz-cell-done" : ""}`}>
                {v}
              </div>
              <div className="pviz-cell-idx">{i}</div>
            </div>
          );
        })}
      </div>

      <div className="pviz-stats-row">
        <span className="pviz-stat"><b>L</b> {s.lo} ({arr[s.lo]})</span>
        <span className="pviz-stat"><b>R</b> {s.hi} ({arr[s.hi]})</span>
        <span className="pviz-stat"><b>sum</b> {s.sum}</span>
        <span className="pviz-stat"><b>target</b> {target}</span>
      </div>

      <div className={`pviz-action ${s.found ? "pviz-action-success" : ""}`}>{s.action}</div>
      <VizControls step={step} total={steps.length} onPrev={prev} onNext={next} onReset={reset} autoPlay={autoPlay} onToggleAuto={() => setAutoPlay(v => !v)} />
    </div>
  );
}

/* ─── 3. FAST & SLOW POINTERS ──────────────────────────────────── */
function FastSlowViz() {
  // Linked list: 1→2→3→4→5→3 (cycle: node 5 points back to node 2 (index))
  const nodes = [
    { val: 1, id: 0 }, { val: 2, id: 1 }, { val: 3, id: 2 },
    { val: 4, id: 3 }, { val: 5, id: 4 },
  ];
  // next: 0→1→2→3→4→2 (cycle at index 2)
  const next = [1, 2, 3, 4, 2];

  const steps = [];
  let slow = 0, fast = 0;
  steps.push({ slow, fast, action: "Start: slow=0, fast=0 (both at head)", met: false });
  for (let i = 0; i < 8; i++) {
    slow = next[slow];
    fast = next[next[fast]];
    const met = slow === fast;
    steps.push({
      slow, fast,
      action: met
        ? `Meeting point! slow=${nodes[slow].val} = fast=${nodes[fast].val} → cycle detected ✓`
        : `slow → node ${nodes[slow].val},  fast → node ${nodes[fast].val}`,
      met,
    });
    if (met) break;
  }

  const { step, autoPlay, setAutoPlay, reset, prev, next: nextStep } = useSteps(steps, 1100);
  const s = steps[step];

  return (
    <div className="pviz-card">
      <div className="pviz-header">
        <span className="pviz-label">Fast &amp; Slow Pointers</span>
        <span className="pviz-subtitle">Cycle detection · 1→2→3→4→5→(back to 3)</span>
      </div>

      <div className="pviz-linked-list">
        {nodes.map((node, i) => {
          const isSlow = s.slow === i;
          const isFast = s.fast === i;
          const isBoth = isSlow && isFast;
          const inCycle = i >= 2;
          return (
            <React.Fragment key={i}>
              <div className={`pviz-ll-node ${isSlow && !isBoth ? "pviz-ll-slow" : ""} ${isFast && !isBoth ? "pviz-ll-fast" : ""} ${isBoth ? "pviz-ll-both" : ""} ${inCycle ? "pviz-ll-cycle" : ""}`}>
                <div className="pviz-ll-val">{node.val}</div>
                {isSlow && !isBoth && <div className="pviz-ll-label pviz-ll-label-s">S</div>}
                {isFast && !isBoth && <div className="pviz-ll-label pviz-ll-label-f">F</div>}
                {isBoth && <div className="pviz-ll-label pviz-ll-label-sf">S+F</div>}
              </div>
              {i < nodes.length - 1 && <div className="pviz-ll-arrow">→</div>}
            </React.Fragment>
          );
        })}
        <div className="pviz-ll-cycle-arrow">↩ cycle to 3</div>
      </div>

      <div className="pviz-stats-row">
        <span className="pviz-stat"><b>slow</b> node {nodes[s.slow].val}</span>
        <span className="pviz-stat"><b>fast</b> node {nodes[s.fast].val}</span>
      </div>

      <div className={`pviz-action ${s.met ? "pviz-action-success" : ""}`}>{s.action}</div>
      <VizControls step={step} total={steps.length} onPrev={prev} onNext={nextStep} onReset={reset} autoPlay={autoPlay} onToggleAuto={() => setAutoPlay(v => !v)} />
    </div>
  );
}

/* ─── 4. MONOTONIC STACK ───────────────────────────────────────── */
function MonotonicStackViz() {
  const arr = [2, 1, 2, 4, 3, 6];
  // Next Greater Element
  const steps = [];
  const stack = [];
  const nge = new Array(arr.length).fill(-1);

  for (let i = 0; i < arr.length; i++) {
    const pops = [];
    while (stack.length > 0 && arr[stack[stack.length - 1]] < arr[i]) {
      const top = stack.pop();
      nge[top] = arr[i];
      pops.push(top);
      steps.push({
        current: i,
        stack: [...stack],
        nge: [...nge],
        action: `arr[${i}]=${arr[i]} > arr[${top}]=${arr[top]} → pop ${top}, NGE[${top}]=${arr[i]}`,
        poppingIdx: top,
        pops: [...pops],
      });
    }
    stack.push(i);
    steps.push({
      current: i,
      stack: [...stack],
      nge: [...nge],
      action: `Push index ${i} (val=${arr[i]}) onto stack`,
      poppingIdx: -1,
      pops: [],
    });
  }
  // remaining in stack have no NGE
  while (stack.length > 0) {
    const top = stack.pop();
    steps.push({
      current: arr.length,
      stack: [...stack],
      nge: [...nge],
      action: `No NGE for index ${top} (val=${arr[top]}) → NGE[${top}]=-1`,
      poppingIdx: top,
      pops: [],
    });
  }

  const { step, autoPlay, setAutoPlay, reset, prev, next } = useSteps(steps, 1100);
  const s = steps[step];

  return (
    <div className="pviz-card">
      <div className="pviz-header">
        <span className="pviz-label">Monotonic Stack</span>
        <span className="pviz-subtitle">Next Greater Element · arr = [{arr.join(", ")}]</span>
      </div>

      <div className="pviz-array-row">
        {arr.map((v, i) => (
          <div key={i} className="pviz-cell-wrap">
            <div className={`pviz-cell ${i === s.current ? "pviz-cell-l" : ""} ${s.poppingIdx === i ? "pviz-cell-pop" : ""} ${s.stack.includes(i) ? "pviz-cell-stack" : ""}`}>
              {v}
            </div>
            <div className="pviz-cell-idx">{i}</div>
            <div className={`pviz-nge-val ${s.nge[i] !== -1 ? "pviz-nge-found" : ""}`}>
              {s.nge[i] !== -1 ? `→${s.nge[i]}` : "·"}
            </div>
          </div>
        ))}
      </div>

      <div className="pviz-stack-display">
        <span className="pviz-stack-label">Stack (indices):</span>
        <div className="pviz-stack-items">
          {s.stack.length === 0
            ? <span className="pviz-stack-empty">[ empty ]</span>
            : s.stack.map((idx, j) => (
                <div key={j} className="pviz-stack-item">
                  <span className="pviz-stack-item-idx">[{idx}]</span>
                  <span className="pviz-stack-item-val">{arr[idx]}</span>
                </div>
              ))
          }
        </div>
      </div>

      <div className="pviz-action">{s.action}</div>
      <VizControls step={step} total={steps.length} onPrev={prev} onNext={next} onReset={reset} autoPlay={autoPlay} onToggleAuto={() => setAutoPlay(v => !v)} />
    </div>
  );
}

/* ─── 5. PREFIX SUM ────────────────────────────────────────────── */
function PrefixSumViz() {
  const arr = [3, 1, 4, 1, 5];
  const prefix = [0];
  for (let i = 0; i < arr.length; i++) prefix.push(prefix[i] + arr[i]);
  // prefix[i] = sum of arr[0..i-1]

  const queryL = 1, queryR = 3; // sum arr[1..3]
  const queryAns = prefix[queryR + 1] - prefix[queryL];

  const buildSteps = arr.map((v, i) => ({
    phase: "build",
    builtUpto: i,
    prefix: prefix.slice(0, i + 2),
    action: `prefix[${i + 1}] = prefix[${i}] + arr[${i}] = ${prefix[i]} + ${v} = ${prefix[i + 1]}`,
  }));

  const querySteps = [
    { phase: "query", builtUpto: arr.length - 1, prefix, queryActive: false, action: `Query: sum of arr[${queryL}..${queryR}]` },
    { phase: "query", builtUpto: arr.length - 1, prefix, queryActive: true, action: `= prefix[${queryR + 1}] - prefix[${queryL}] = ${prefix[queryR + 1]} - ${prefix[queryL]} = ${queryAns}` },
  ];

  const steps = [
    { phase: "build", builtUpto: -1, prefix: [0], action: "Initialize: prefix[0] = 0 (empty prefix sum)" },
    ...buildSteps,
    ...querySteps,
  ];

  const { step, autoPlay, setAutoPlay, reset, prev, next } = useSteps(steps, 1100);
  const s = steps[step];

  return (
    <div className="pviz-card">
      <div className="pviz-header">
        <span className="pviz-label">Prefix Sum</span>
        <span className="pviz-subtitle">Build O(n), Query O(1) · arr = [{arr.join(", ")}]</span>
      </div>

      <div className="pviz-prefix-section">
        <div className="pviz-prefix-row-label">Original array:</div>
        <div className="pviz-array-row">
          {arr.map((v, i) => (
            <div key={i} className="pviz-cell-wrap">
              <div className={`pviz-cell ${s.phase === "query" && s.queryActive && i >= queryL && i <= queryR ? "pviz-cell-active" : ""} ${s.builtUpto === i ? "pviz-cell-l" : ""}`}>
                {v}
              </div>
              <div className="pviz-cell-idx">{i}</div>
            </div>
          ))}
        </div>

        <div className="pviz-prefix-row-label" style={{ marginTop: "var(--sp-4)" }}>Prefix array:</div>
        <div className="pviz-array-row">
          {prefix.map((v, i) => {
            const built = i < s.prefix.length;
            const isQL = s.phase === "query" && s.queryActive && i === queryL;
            const isQR = s.phase === "query" && s.queryActive && i === queryR + 1;
            return (
              <div key={i} className="pviz-cell-wrap">
                <div className={`pviz-cell pviz-cell-prefix ${built ? "pviz-cell-built" : "pviz-cell-ghost"} ${isQL || isQR ? "pviz-cell-query" : ""}`}>
                  {built ? v : "?"}
                </div>
                <div className="pviz-cell-idx">p[{i}]</div>
                {isQL && <div className="pviz-ptr pviz-ptr-l">−</div>}
                {isQR && <div className="pviz-ptr pviz-ptr-r">+</div>}
              </div>
            );
          })}
        </div>
      </div>

      {s.phase === "query" && s.queryActive && (
        <div className="pviz-query-result">
          sum([{queryL}..{queryR}]) = <strong>{queryAns}</strong>
        </div>
      )}

      <div className="pviz-action">{s.action}</div>
      <VizControls step={step} total={steps.length} onPrev={prev} onNext={next} onReset={reset} autoPlay={autoPlay} onToggleAuto={() => setAutoPlay(v => !v)} />
    </div>
  );
}

/* ─── 6. BACKTRACKING ──────────────────────────────────────────── */
function BacktrackingViz() {
  // Generate all subsets of [1,2,3]
  const items = [1, 2, 3];

  // Pre-compute the DFS call tree
  const steps = [
    { path: [], choices: [], action: "Start: explore all subsets of [1,2,3]", candidates: [[1,2,3],[1,2],[1,3],[1],[2,3],[2],[3],[]] },
    { path: [], include: null, action: "At index 0: choose to include or exclude 1" },
    { path: [1], action: "Include 1 → path=[1]. At index 1: include or exclude 2?" },
    { path: [1, 2], action: "Include 2 → path=[1,2]. At index 2: include or exclude 3?" },
    { path: [1, 2, 3], action: "Include 3 → subset=[1,2,3] ✓ Found!", result: true },
    { path: [1, 2], action: "Backtrack: remove 3. Exclude 3 → subset=[1,2] ✓ Found!", result: true },
    { path: [1], action: "Backtrack: remove 2. Exclude 2. At index 2: include or exclude 3?" },
    { path: [1, 3], action: "Include 3 → subset=[1,3] ✓ Found!", result: true },
    { path: [1], action: "Backtrack: remove 3. Exclude 3 → subset=[1] ✓ Found!", result: true },
    { path: [], action: "Backtrack: remove 1. Exclude 1. At index 1: include or exclude 2?" },
    { path: [2], action: "Include 2 → path=[2]. At index 2: include or exclude 3?" },
    { path: [2, 3], action: "Include 3 → subset=[2,3] ✓ Found!", result: true },
    { path: [2], action: "Backtrack. Exclude 3 → subset=[2] ✓ Found!", result: true },
    { path: [], action: "Backtrack: remove 2. Exclude 2. At index 2: include or exclude 3?" },
    { path: [3], action: "Include 3 → subset=[3] ✓ Found!", result: true },
    { path: [], action: "Backtrack. Exclude 3 → subset=[] ✓ Found! All 8 subsets generated.", result: true },
  ];

  const allSubsets = [[], [1], [2], [3], [1,2], [1,3], [2,3], [1,2,3]];

  const { step, autoPlay, setAutoPlay, reset, prev, next } = useSteps(steps, 1200);
  const s = steps[step];

  // Which subsets have been "found" by this step
  const foundCount = steps.slice(0, step + 1).filter(x => x.result).length;

  return (
    <div className="pviz-card">
      <div className="pviz-header">
        <span className="pviz-label">Backtracking</span>
        <span className="pviz-subtitle">All subsets of [1, 2, 3] — include/exclude decision tree</span>
      </div>

      <div className="pviz-bt-section">
        <div className="pviz-bt-current">
          <span className="pviz-stack-label">Current path:</span>
          <div className="pviz-bt-path">
            {s.path.length === 0
              ? <span className="pviz-stack-empty">[ ]</span>
              : s.path.map((v, i) => <span key={i} className="pviz-bt-item">{v}</span>)
            }
          </div>
        </div>

        <div className="pviz-bt-choices">
          {items.map((item, i) => {
            const inPath = s.path.includes(item);
            const processed = i < items.length;
            return (
              <div key={i} className={`pviz-bt-choice ${inPath ? "pviz-bt-choice-in" : "pviz-bt-choice-out"}`}>
                <span className="pviz-bt-choice-item">{item}</span>
                <span className="pviz-bt-choice-status">{inPath ? "✓ in" : "✗ out"}</span>
              </div>
            );
          })}
        </div>

        <div className="pviz-bt-found">
          <span className="pviz-stack-label">Subsets found ({foundCount}/8):</span>
          <div className="pviz-bt-subsets">
            {allSubsets.map((sub, i) => {
              const found = i < foundCount;
              return (
                <span key={i} className={`pviz-bt-subset ${found ? "pviz-bt-subset-found" : ""}`}>
                  [{sub.join(",")}]
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className={`pviz-action ${s.result ? "pviz-action-success" : ""}`}>{s.action}</div>
      <VizControls step={step} total={steps.length} onPrev={prev} onNext={next} onReset={reset} autoPlay={autoPlay} onToggleAuto={() => setAutoPlay(v => !v)} />
    </div>
  );
}

/* ─── 7. BFS LAYER TRAVERSAL ───────────────────────────────────── */
function BFSLayerViz() {
  const ROWS = 4, COLS = 5;
  // 0=open, 1=wall
  const grid = [
    [0,0,1,0,0],
    [0,0,0,1,0],
    [1,0,0,0,0],
    [0,0,1,0,0],
  ];
  const start = [0, 0];

  // BFS from start
  const dist = Array.from({ length: ROWS }, () => new Array(COLS).fill(-1));
  const visited = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
  const queue = [[...start]];
  dist[start[0]][start[1]] = 0;
  visited[start[0]][start[1]] = true;
  const dirs = [[0,1],[1,0],[0,-1],[-1,0]];

  const stepsData = [];
  stepsData.push({ distSnap: dist.map(r => [...r]), frontierSnap: [[...start]], action: "Start BFS from (0,0), distance=0" });

  let bfsQueue = [[...start]];
  while (bfsQueue.length > 0) {
    const next = [];
    for (const [r, c] of bfsQueue) {
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !visited[nr][nc] && grid[nr][nc] === 0) {
          visited[nr][nc] = true;
          dist[nr][nc] = dist[r][c] + 1;
          next.push([nr, nc]);
        }
      }
    }
    if (next.length > 0) {
      stepsData.push({
        distSnap: dist.map(r2 => [...r2]),
        frontierSnap: next,
        action: `Layer ${dist[next[0][0]][next[0][1]]}: visit ${next.map(([r,c]) => `(${r},${c})`).join(", ")}`,
      });
    }
    bfsQueue = next;
  }

  const { step, autoPlay, setAutoPlay, reset, prev, next } = useSteps(stepsData, 1000);
  const s = stepsData[step];
  const frontierSet = new Set(s.frontierSnap.map(([r, c]) => `${r},${c}`));

  return (
    <div className="pviz-card">
      <div className="pviz-header">
        <span className="pviz-label">BFS Layer Traversal</span>
        <span className="pviz-subtitle">Shortest path on grid from (0,0) · darker = farther</span>
      </div>

      <div className="pviz-grid-wrap">
        {Array.from({ length: ROWS }, (_, r) => (
          <div key={r} className="pviz-grid-row">
            {Array.from({ length: COLS }, (_, c) => {
              const d = s.distSnap[r][c];
              const isWall = grid[r][c] === 1;
              const isStart = r === start[0] && c === start[1];
              const isFrontier = frontierSet.has(`${r},${c}`);
              return (
                <div key={c}
                  className={`pviz-grid-cell ${isWall ? "pviz-grid-wall" : ""} ${isStart ? "pviz-grid-start" : ""} ${isFrontier ? "pviz-grid-frontier" : ""} ${d >= 0 && !isWall ? "pviz-grid-visited" : ""}`}
                  style={d >= 0 && !isWall ? { "--d": d } : {}}
                >
                  {isWall ? "■" : d >= 0 ? d : ""}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="pviz-action">{s.action}</div>
      <VizControls step={step} total={stepsData.length} onPrev={prev} onNext={next} onReset={reset} autoPlay={autoPlay} onToggleAuto={() => setAutoPlay(v => !v)} />
    </div>
  );
}

/* ─── 8. BINARY SEARCH ON ANSWER ───────────────────────────────── */
function BinarySearchAnswerViz() {
  // Problem: pile of [3,6,7,11], eat at speed H, finish in 8 hours. Min H?
  const piles = [3, 6, 7, 11];
  const H = 8;
  const check = (h) => piles.reduce((acc, p) => acc + Math.ceil(p / h), 0) <= H;

  const steps = [];
  let lo = 1, hi = 11;
  steps.push({ lo, hi, mid: null, feasible: null, action: `Search space: [${lo}..${hi}]` });
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const ok = check(mid);
    steps.push({ lo, hi, mid, feasible: ok, action: `mid=${mid}: hours needed=${piles.reduce((a,p)=>a+Math.ceil(p/mid),0)} ${ok?`≤${H} → go left`:`>${H} → go right`}` });
    if (ok) hi = mid;
    else lo = mid + 1;
    steps.push({ lo, hi, mid, feasible: ok, action: `Narrow range to [${lo}..${hi}]` });
  }
  steps.push({ lo, hi, mid: lo, feasible: true, action: `Answer: speed = ${lo} (minimum viable)` });

  const { step, autoPlay, setAutoPlay, reset, prev, next } = useSteps(steps, 1000);
  const s = steps[step];
  const range = hi - lo + 1;
  const BAR_MAX = 11;

  return (
    <div className="pviz-card">
      <div className="pviz-header">
        <span className="pviz-label">Binary Search on Answer</span>
        <span className="pviz-subtitle">Koko eats piles [{piles.join(",")}] in ≤{H}h. Min speed?</span>
      </div>

      <div className="pviz-bs-section">
        <div className="pviz-bs-bar-wrap">
          {Array.from({ length: BAR_MAX }, (_, i) => {
            const val = i + 1;
            const inRange = val >= s.lo && val <= s.hi;
            const isMid = val === s.mid;
            const isAns = s.lo === s.hi && val === s.lo;
            return (
              <div key={i} className={`pviz-bs-cell ${inRange ? "pviz-bs-active" : "pviz-bs-cut"} ${isMid ? "pviz-bs-mid" : ""} ${isAns ? "pviz-bs-ans" : ""}`}>
                {val}
              </div>
            );
          })}
        </div>
        <div className="pviz-bs-labels">
          <span>lo={s.lo}</span>
          {s.mid && <span>mid={s.mid}</span>}
          <span>hi={s.hi}</span>
        </div>
      </div>

      {s.mid && (
        <div className="pviz-stats-row">
          <span className="pviz-stat"><b>speed</b> {s.mid}</span>
          <span className="pviz-stat"><b>hours</b> {piles.reduce((a,p)=>a+Math.ceil(p/s.mid),0)}</span>
          <span className="pviz-stat"><b>feasible?</b> {s.feasible ? "✓ Yes" : "✗ No"}</span>
        </div>
      )}

      <div className={`pviz-action ${s.lo === s.hi ? "pviz-action-success" : ""}`}>{s.action}</div>
      <VizControls step={step} total={steps.length} onPrev={prev} onNext={next} onReset={reset} autoPlay={autoPlay} onToggleAuto={() => setAutoPlay(v => !v)} />
    </div>
  );
}

/* ─── REGISTRY ─────────────────────────────────────────────────── */
export const PATTERN_VIZ_NAMES = new Set([
  "Sliding Window Pattern",
  "Sliding Window Variant: Fixed Size",
  "Sliding Window Variant: At Most K",
  "Sliding Window Variant: Exactly K",
  "Sliding Window Variant: Frequency Match",
  "Sliding Window Variant: Monotonic Deque",
  "Two Pointers Pattern",
  "Two Pointers Variant: Opposite Ends",
  "Two Pointers Variant: K-Sum Reduction",
  "Two Pointers Variant: Merge / Intersection",
  "Fast and Slow Pointers",
  "Two Pointers Variant: Fast/Slow",
  "Monotonic Stack",
  "Prefix Sum + HashMap",
  "Binary Search on Answer",
  "Backtracking (DFS with choices)",
  "BFS Layer Traversal",
]);

export function PatternVisualizer({ patternName }) {
  if (patternName.includes("Sliding Window")) return <SlidingWindowViz />;
  if (patternName.includes("Two Pointers") || patternName.includes("K-Sum") || patternName.includes("Merge / Intersection")) return <TwoPointersViz />;
  if (patternName.includes("Fast") || patternName.includes("Slow")) return <FastSlowViz />;
  if (patternName.includes("Monotonic Stack")) return <MonotonicStackViz />;
  if (patternName.includes("Prefix Sum")) return <PrefixSumViz />;
  if (patternName.includes("Backtracking")) return <BacktrackingViz />;
  if (patternName.includes("BFS Layer")) return <BFSLayerViz />;
  if (patternName.includes("Binary Search on Answer")) return <BinarySearchAnswerViz />;
  return null;
}
