import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildJohnsonFrames,
  JOHNSON_POS,
  JOHNSON_V,
  JOHNSON_SUPER,
  JOHNSON_EDGES,
} from "./johnsonVizFrames.js";

const STEP_MS = 320;
const JOHNSON_ALGO = "Johnson (APSP)";
const N = 6;
const SRC = 0;
const DST = 5;
const INF = 1e9;

/** Multiple BFS sources (demo): corners of the graph */
const MULTI_SOURCES = [0, 5];

/** Undirected weighted edges [u, v, weight] — demo graph */
const DEMO_EDGES = [
  [0, 1, 2],
  [0, 2, 4],
  [1, 2, 1],
  [1, 3, 7],
  [2, 4, 3],
  [3, 4, 2],
  [3, 5, 1],
  [4, 5, 5],
];

/** Directed DAG edges [u, v] for Kahn demo (same node layout) */
const TOPO_DAG_EDGES = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
  [3, 4],
  [3, 5],
];

/** SVG layout (viewBox 0 0 400 280) */
const NODE_POS = [
  [70, 40],
  [200, 40],
  [330, 40],
  [70, 150],
  [200, 155],
  [330, 230],
];

const DAG_ALGORITHMS = new Set(["Topological Sort (Kahn)"]);

function cloneMatrix(m) {
  return m.map((r) => [...r]);
}

function buildAdjUnweighted() {
  const adj = Array.from({ length: N }, () => []);
  for (const [u, v] of DEMO_EDGES) {
    adj[u].push(v);
    adj[v].push(u);
  }
  for (let i = 0; i < N; i++) adj[i].sort((a, b) => a - b);
  return adj;
}

function buildAdjWeighted() {
  const adj = Array.from({ length: N }, () => []);
  for (const [u, v, w] of DEMO_EDGES) {
    adj[u].push([v, w]);
    adj[v].push([u, w]);
  }
  for (let i = 0; i < N; i++) adj[i].sort((a, b) => a[0] - b[0]);
  return adj;
}

function buildTopoAdj() {
  const adj = Array.from({ length: N }, () => []);
  for (const [u, v] of TOPO_DAG_EDGES) {
    adj[u].push(v);
  }
  return adj;
}

function buildBfsFrames() {
  const adj = buildAdjUnweighted();
  const visited = Array(N).fill(false);
  const visitOrder = Array(N).fill(0);
  const q = [];
  const frames = [];
  let seq = 0;

  const snap = (extra) => ({
    dist: null,
    visitOrder: [...visitOrder],
    visited: [...visited],
    queue: [...q],
    frontier: [],
    highlightNodes: [],
    highlightEdges: [],
    ...extra,
  });

  visited[SRC] = true;
  q.push(SRC);
  frames.push(
    snap({
      msg: `BFS traversal from start ${SRC}: enqueue ${SRC}, mark visited.`,
      highlightNodes: [SRC],
    }),
  );

  while (q.length) {
    const u = q.shift();
    seq += 1;
    visitOrder[u] = seq;
    frames.push(
      snap({
        msg: `Dequeue ${u} — traversal order #${seq}. Visit neighbors and enqueue unvisited.`,
        current: u,
        highlightNodes: [u],
        queue: [...q],
      }),
    );
    for (const v of adj[u]) {
      if (!visited[v]) {
        visited[v] = true;
        q.push(v);
        frames.push(
          snap({
            msg: `Neighbor ${v} unseen — mark visited, enqueue (${u}—${v}).`,
            highlightNodes: [u, v],
            highlightEdges: [[u, v]],
            queue: [...q],
          }),
        );
      }
    }
  }
  frames.push(
    snap({
      msg: "BFS complete — dequeue order is the level-order traversal sequence.",
      highlightNodes: [],
      highlightEdges: [],
    }),
  );
  return frames;
}

function buildMultiSourceBfsFrames() {
  const adj = buildAdjUnweighted();
  const visited = Array(N).fill(false);
  const dist = Array(N).fill(-1);
  const nearest = Array(N).fill(-1);
  const q = [];
  const frames = [];

  const snap = (extra) => ({
    dist: [...dist],
    nearestSource: [...nearest],
    visited: [...visited],
    queue: [...q],
    highlightNodes: [],
    highlightEdges: [],
    ...extra,
  });

  for (const s of MULTI_SOURCES) {
    visited[s] = true;
    dist[s] = 0;
    nearest[s] = s;
    q.push(s);
  }
  frames.push(
    snap({
      msg: `Multi-source BFS: enqueue every source at distance 0 (sources = ${MULTI_SOURCES.join(", ")}).`,
      highlightNodes: [...MULTI_SOURCES],
    }),
  );

  while (q.length) {
    const u = q.shift();
    frames.push(
      snap({
        msg: `Dequeue ${u} (dist = ${dist[u]}, nearest source = ${nearest[u]}).`,
        current: u,
        highlightNodes: [u],
        queue: [...q],
      }),
    );
    for (const v of adj[u]) {
      if (!visited[v]) {
        visited[v] = true;
        dist[v] = dist[u] + 1;
        nearest[v] = nearest[u];
        q.push(v);
        frames.push(
          snap({
            msg: `First visit ${v} from ${u} — dist[${v}] = ${dist[v]}, nearest source stays ${nearest[v]}.`,
            highlightNodes: [u, v],
            highlightEdges: [[u, v]],
            queue: [...q],
          }),
        );
      }
    }
  }
  frames.push(
    snap({
      msg: "Complete — dist[v] is the unweighted distance from the closest source.",
      highlightNodes: [],
      highlightEdges: [],
    }),
  );
  return frames;
}

function buildDfsFrames() {
  const adj = buildAdjUnweighted();
  const visited = Array(N).fill(false);
  const stack = [SRC];
  const frames = [];

  const snap = (extra) => ({
    dist: null,
    visited: [...visited],
    stack: [...stack],
    highlightNodes: [],
    highlightEdges: [],
    ...extra,
  });

  frames.push(
    snap({
      msg: `DFS (iterative): push source ${SRC} onto the stack.`,
      highlightNodes: [SRC],
      stack: [...stack],
    }),
  );

  while (stack.length) {
    const u = stack.pop();
    if (visited[u]) {
      frames.push(
        snap({
          msg: `Pop ${u} — already visited, skip.`,
          stack: [...stack],
          highlightNodes: [u],
        }),
      );
      continue;
    }
    visited[u] = true;
    frames.push(
      snap({
        msg: `Pop ${u} — first visit; mark visited and explore.`,
        current: u,
        highlightNodes: [u],
        stack: [...stack],
      }),
    );
    const neigh = [...adj[u]].sort((a, b) => b - a);
    for (const v of neigh) {
      if (!visited[v]) stack.push(v);
    }
    frames.push(
      snap({
        msg: `Push unvisited neighbors of ${u} onto stack (larger IDs first so smaller IDs are popped first).`,
        highlightNodes: [u],
        queue: [],
        stack: [...stack],
      }),
    );
  }
  frames.push(
    snap({
      msg: "DFS complete — order depends on stack push order.",
      highlightNodes: [],
      stack: [],
    }),
  );
  return frames;
}

function buildBidirectionalBfsFrames() {
  const adj = buildAdjUnweighted();
  const distF = Array(N).fill(-1);
  const distB = Array(N).fill(-1);
  const qF = [SRC];
  const qB = [DST];
  distF[SRC] = 0;
  distB[DST] = 0;
  const frames = [];

  const snap = (extra) => ({
    dist: null,
    distF: [...distF],
    distB: [...distB],
    queueF: [...qF],
    queueB: [...qB],
    highlightNodes: [],
    highlightEdges: [],
    ...extra,
  });

  frames.push(
    snap({
      msg: `Bidirectional BFS: forward from ${SRC}, backward from ${DST} (target).`,
      highlightNodes: [SRC, DST],
    }),
  );

  const expand = (forward) => {
    const q = forward ? qF : qB;
    const dist = forward ? distF : distB;
    const other = forward ? distB : distF;
    if (q.length === 0) return false;
    const u = q.shift();
    frames.push(
      snap({
        msg: `Expand ${forward ? "forward" : "backward"} from node ${u}.`,
        current: u,
        highlightNodes: [u],
        queueF: [...qF],
        queueB: [...qB],
      }),
    );
    for (const v of adj[u]) {
      if (dist[v] !== -1) continue;
      dist[v] = dist[u] + 1;
      q.push(v);
      if (other[v] !== -1) {
        const total = distF[v] + distB[v];
        frames.push(
          snap({
            msg: `Meet at ${v}: distF[${v}]=${distF[v]} + distB[${v}]=${distB[v]} ⇒ unweighted shortest length ${total}.`,
            highlightNodes: [u, v],
            highlightEdges: [[u, v]],
            queueF: [...qF],
            queueB: [...qB],
            meet: v,
            totalLen: total,
          }),
        );
        return true;
      }
      frames.push(
        snap({
          msg: `Discover ${v} from ${forward ? "forward" : "backward"} side.`,
          highlightNodes: [u, v],
          highlightEdges: [[u, v]],
          queueF: [...qF],
          queueB: [...qB],
        }),
      );
    }
    return false;
  };

  let met = false;
  while (qF.length && qB.length) {
    const useForward = qF.length <= qB.length;
    if (expand(useForward)) {
      met = true;
      break;
    }
  }

  frames.push(
    snap({
      msg: met ? "Shortest path length found by meeting frontiers." : "Search finished (frontiers exhausted).",
      highlightNodes: [],
    }),
  );
  return frames;
}

function buildDijkstraFrames() {
  const adj = buildAdjWeighted();
  const dist = Array(N).fill(Infinity);
  const settled = Array(N).fill(false);
  dist[SRC] = 0;
  const pq = [];
  const pushPq = (d, u) => {
    pq.push([d, u]);
    pq.sort((a, b) => a[0] - b[0]);
  };
  pushPq(0, SRC);
  const frames = [];

  const snap = (extra) => ({
    dist: dist.map((d) => (d === Infinity ? null : d)),
    settled: [...settled],
    pq: pq.map(([d, u]) => [d === Infinity ? null : d, u]),
    queue: [],
    highlightNodes: [],
    highlightEdges: [],
    ...extra,
  });

  frames.push(
    snap({
      msg: `Dijkstra: dist[${SRC}] = 0, all others ∞. Min-heap holds (dist, node).`,
      highlightNodes: [SRC],
    }),
  );

  while (pq.length) {
    const [d, u] = pq.shift();
    if (d > dist[u]) continue;
    if (settled[u]) continue;
    settled[u] = true;
    frames.push(
      snap({
        msg: `Pop minimum: settle node ${u} with distance ${d}.`,
        current: u,
        highlightNodes: [u],
      }),
    );
    for (const [v, w] of adj[u]) {
      const nd = dist[u] + w;
      if (nd < dist[v]) {
        dist[v] = nd;
        pushPq(nd, v);
        frames.push(
          snap({
            msg: `Relax edge (${u}—${v}, w=${w}): dist[${v}] = ${nd}.`,
            highlightNodes: [u, v],
            highlightEdges: [[u, v]],
          }),
        );
      }
    }
  }
  frames.push(
    snap({
      msg: "All reachable nodes settled — shortest paths from source found.",
      highlightNodes: [],
      highlightEdges: [],
    }),
  );
  return frames;
}

function buildBellmanFordFrames() {
  const dist = Array(N).fill(Infinity);
  dist[SRC] = 0;
  const directed = [];
  for (const [u, v, w] of DEMO_EDGES) {
    directed.push([u, v, w], [v, u, w]);
  }

  const frames = [];

  const snap = (extra) => ({
    dist: dist.map((d) => (d === Infinity ? null : d)),
    settled: [],
    pq: [],
    queue: [],
    round: null,
    highlightNodes: [],
    highlightEdges: [],
    ...extra,
  });

  frames.push(
    snap({
      msg: `Bellman-Ford: dist[${SRC}] = 0, others ∞. Up to ${N - 1} relaxation rounds over every directed edge (both ways for undirected links).`,
      highlightNodes: [SRC],
    }),
  );

  for (let round = 0; round < N - 1; round++) {
    frames.push(
      snap({
        msg: `Round ${round + 1} / ${N - 1}: relax all directed edges once.`,
        round: round + 1,
      }),
    );
    for (const [u, v, w] of directed) {
      if (dist[u] === Infinity) {
        frames.push(
          snap({
            msg: `Directed edge ${u}→${v} (w=${w}): skip — dist[${u}] is ∞.`,
            highlightEdges: [[u, v]],
            highlightNodes: [u, v],
          }),
        );
        continue;
      }
      const nd = dist[u] + w;
      const prev = dist[v];
      if (nd < dist[v]) {
        dist[v] = nd;
        frames.push(
          snap({
            msg: `Relax ${u}→${v}: dist[${v}] := ${nd} (improved from ${prev === Infinity ? "∞" : prev}).`,
            highlightEdges: [[u, v]],
            highlightNodes: [u, v],
          }),
        );
      } else {
        frames.push(
          snap({
            msg: `Relax ${u}→${v}: no change — dist[${v}] already ≤ dist[${u}]+w.`,
            highlightEdges: [[u, v]],
            highlightNodes: [u, v],
          }),
        );
      }
    }
  }

  frames.push(
    snap({
      msg: "Optional: one more pass over edges to detect negative cycles (none in this demo).",
      highlightNodes: [],
      highlightEdges: [],
    }),
  );
  return frames;
}

function buildFloydWarshallFrames() {
  const dist = Array.from({ length: N }, () => Array(N).fill(INF));
  for (let i = 0; i < N; i++) dist[i][i] = 0;
  for (const [u, v, w] of DEMO_EDGES) {
    dist[u][v] = Math.min(dist[u][v], w);
    dist[v][u] = Math.min(dist[v][u], w);
  }
  const frames = [];
  frames.push({
    msg: "Initialize dist with edge weights (∞ if no edge), dist[i][i]=0.",
    matrix: cloneMatrix(dist),
    highlightK: -1,
    highlightNodes: [],
    highlightEdges: [],
    dist: null,
  });
  for (let k = 0; k < N; k++) {
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        if (dist[i][k] + dist[k][j] < dist[i][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
        }
      }
    }
    frames.push({
      msg: `After allowing intermediate vertices 0..${k} (outer k=${k}), update all pairs.`,
      matrix: cloneMatrix(dist),
      highlightK: k,
      highlightNodes: [k],
      highlightEdges: [],
      dist: null,
    });
  }
  frames.push({
    msg: "Floyd-Warshall complete — matrix holds all-pairs shortest path lengths.",
    matrix: cloneMatrix(dist),
    highlightK: -1,
    highlightNodes: [],
    highlightEdges: [],
    dist: null,
  });
  return frames;
}

function buildTopoKahnFrames() {
  const adj = buildTopoAdj();
  const indeg = Array(N).fill(0);
  for (const [u, v] of TOPO_DAG_EDGES) indeg[v]++;
  const q = [];
  for (let i = 0; i < N; i++) if (indeg[i] === 0) q.push(i);
  q.sort((a, b) => a - b);
  const order = [];
  const frames = [];

  const snap = (extra) => ({
    dist: null,
    indeg: [...indeg],
    topoQueue: [...q],
    topoOrder: [...order],
    highlightNodes: [],
    highlightEdges: [],
    ...extra,
  });

  frames.push(
    snap({
      msg: "Kahn: all vertices with indegree 0 are ready (no prerequisites).",
      highlightNodes: [...q],
    }),
  );

  while (q.length) {
    const u = q.shift();
    order.push(u);
    frames.push(
      snap({
        msg: `Remove ${u} from the frontier and append to topological order.`,
        current: u,
        highlightNodes: [u],
        topoQueue: [...q],
        topoOrder: [...order],
      }),
    );
    for (const v of adj[u]) {
      indeg[v]--;
      frames.push(
        snap({
          msg: `Edge ${u}→${v}: decrement indegree[${v}] to ${indeg[v]}.`,
          highlightEdges: [[u, v]],
          highlightNodes: [u, v],
          topoQueue: [...q],
          topoOrder: [...order],
        }),
      );
      if (indeg[v] === 0) {
        q.push(v);
        q.sort((a, b) => a - b);
        frames.push(
          snap({
            msg: `Vertex ${v} now has indegree 0 — enqueue.`,
            highlightNodes: [v],
            topoQueue: [...q],
            topoOrder: [...order],
          }),
        );
      }
    }
  }
  frames.push(
    snap({
      msg: `Done — order [${order.join(", ")}] is a valid topological ordering (DAG is acyclic).`,
      topoOrder: [...order],
    }),
  );
  return frames;
}

function buildKruskalFrames() {
  const edges = [...DEMO_EDGES].sort((a, b) => a[2] - b[2]);
  const parent = Array.from({ length: N }, (_, i) => i);
  const rank = Array(N).fill(0);
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const unite = (a, b) => {
    let ra = find(a);
    let rb = find(b);
    if (ra === rb) return false;
    if (rank[ra] < rank[rb]) parent[ra] = rb;
    else if (rank[ra] > rank[rb]) parent[rb] = ra;
    else {
      parent[rb] = ra;
      rank[ra]++;
    }
    return true;
  }
  const mstEdges = [];
  const frames = [];

  const snap = (extra) => ({
    dist: null,
    mstEdges: [...mstEdges],
    highlightNodes: [],
    highlightEdges: [],
    ...extra,
  });

  frames.push(
    snap({
      msg: "Kruskal: sort edges by weight, add edges that connect different DSU components.",
    }),
  );

  for (const [u, v, w] of edges) {
    frames.push(
      snap({
        msg: `Consider edge (${u}—${v}, w=${w}).`,
        highlightEdges: [[u, v]],
        highlightNodes: [u, v],
        mstEdges: [...mstEdges],
      }),
    );
    if (unite(u, v)) {
      mstEdges.push([u, v]);
      frames.push(
        snap({
          msg: `Add to MST — connects two components (total ${mstEdges.length} edges).`,
          highlightEdges: [[u, v]],
          highlightNodes: [u, v],
          mstEdges: [...mstEdges],
        }),
      );
    } else {
      frames.push(
        snap({
          msg: "Skip — both endpoints already in the same component (would form a cycle).",
          highlightEdges: [[u, v]],
          highlightNodes: [u, v],
          mstEdges: [...mstEdges],
        }),
      );
    }
  }
  frames.push(
    snap({
      msg: "MST complete — green edges in the legend are the chosen tree.",
      mstEdges: [...mstEdges],
    }),
  );
  return frames;
}

function buildPrimFrames() {
  const adj = buildAdjWeighted();
  const inMst = Array(N).fill(false);
  const key = Array(N).fill(Infinity);
  key[SRC] = 0;
  const parent = Array(N).fill(-1);
  const frames = [];
  const mstEdges = [];

  const snap = (extra) => ({
    dist: key.map((k) => (k === Infinity ? null : k)),
    mstEdges: [...mstEdges],
    highlightNodes: [],
    highlightEdges: [],
    ...extra,
  });

  frames.push(
    snap({
      msg: `Prim: start with node ${SRC} in MST; key[v] is cheapest edge weight from v to the current tree.`,
      highlightNodes: [SRC],
    }),
  );

  for (let iter = 0; iter < N; iter++) {
    let u = -1;
    let minK = Infinity;
    for (let i = 0; i < N; i++) {
      if (!inMst[i] && key[i] < minK) {
        minK = key[i];
        u = i;
      }
    }
    inMst[u] = true;
    if (parent[u] !== -1) {
      mstEdges.push([parent[u], u]);
      frames.push(
        snap({
          msg: `Add vertex ${u} to MST via edge (${parent[u]}—${u}) with weight ${minK}.`,
          current: u,
          highlightEdges: [[parent[u], u]],
          highlightNodes: [u, parent[u]],
        }),
      );
    } else {
      frames.push(
        snap({
          msg: `Pick starting vertex ${u} (key = 0).`,
          current: u,
          highlightNodes: [u],
        }),
      );
    }
    for (const [v, w] of adj[u]) {
      if (!inMst[v] && w < key[v]) {
        key[v] = w;
        parent[v] = u;
      }
    }
  }
  frames.push(
    snap({
      msg: "Prim MST complete — tree spans all vertices.",
      mstEdges: [...mstEdges],
    }),
  );
  return frames;
}

const BUILDERS = {
  BFS: buildBfsFrames,
  "Multi-Source BFS": buildMultiSourceBfsFrames,
  DFS: buildDfsFrames,
  Dijkstra: buildDijkstraFrames,
  "Bellman-Ford": buildBellmanFordFrames,
  "Floyd-Warshall": buildFloydWarshallFrames,
  "Topological Sort (Kahn)": buildTopoKahnFrames,
  "Kruskal (MST)": buildKruskalFrames,
  "Prim (MST)": buildPrimFrames,
  "Bidirectional BFS": buildBidirectionalBfsFrames,
  [JOHNSON_ALGO]: buildJohnsonFrames,
};

export const GRAPH_VIZ_NAMES = new Set(Object.keys(BUILDERS));

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function edgeInMst(edge, mstList) {
  if (!mstList) return false;
  const [a, b] = edge;
  return mstList.some(([u, v]) => (u === a && v === b) || (u === b && v === a));
}

export function GraphAlgorithmVisualizer({ algorithm }) {
  const builder = BUILDERS[algorithm];
  const frames = useMemo(() => (builder ? builder() : []), [builder]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const frame = frames[idx] || frames[0];
  const stepMs = algorithm === JOHNSON_ALGO ? 440 : STEP_MS;

  useEffect(() => {
    setIdx(0);
  }, [algorithm]);

  useEffect(() => {
    if (!playing || frames.length === 0) return;
    let cancelled = false;
    (async () => {
      for (let i = 0; i < frames.length; i++) {
        if (cancelled) return;
        setIdx(i);
        await sleep(stepMs);
      }
      if (!cancelled) setPlaying(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [playing, frames.length, algorithm, stepMs]);

  const goStep = useCallback(
    (delta) => {
      setPlaying(false);
      setIdx((i) => Math.max(0, Math.min(frames.length - 1, i + delta)));
    },
    [frames.length],
  );

  const reset = useCallback(() => {
    setPlaying(false);
    setIdx(0);
  }, []);

  const play = useCallback(() => {
    setIdx(0);
    setPlaying(true);
  }, []);

  if (!builder || !frame) return null;

  const isDag = DAG_ALGORITHMS.has(algorithm);
  const isJohnson = algorithm === JOHNSON_ALGO;
  const edgesToDraw = isDag ? TOPO_DAG_EDGES.map(([u, v]) => [u, v, 1]) : DEMO_EDGES;
  const directed = isDag || isJohnson;

  const johnsonEdgeRows = isJohnson
    ? (() => {
        const rows = JOHNSON_EDGES.map(([u, v, w]) => ({ u, v, w, superEdge: false }));
        if (frame.showSuper) {
          for (let i = 0; i < JOHNSON_V; i++) {
            rows.push({ u: JOHNSON_SUPER, v: i, w: 0, superEdge: true });
          }
        }
        return rows;
      })()
    : [];

  const distLine = frame.dist
    ? frame.dist.map((d, i) => (d === null || d === -1 ? "∞" : String(d))).join(", ")
    : "";
  const visitOrderLine =
    frame.visitOrder && algorithm === "BFS"
      ? frame.visitOrder.map((n) => (n === 0 ? "—" : String(n))).join(", ")
      : "";

  const fmtMatrixCell = (v) => {
    if (v >= INF / 2) return "∞";
    return String(v);
  };

  return (
    <div className="graph-algo-viz">
      <div className="graph-algo-viz-header">
        <h4>Graph walkthrough: {algorithm}</h4>
        <span>
          Step {idx + 1} / {frames.length}
        </span>
      </div>
      <p className="graph-algo-viz-status">{frame.msg}</p>
      <div className="graph-algo-viz-controls">
        <button type="button" className="ghost-btn graph-algo-btn" onClick={() => goStep(-1)} disabled={playing || idx <= 0}>
          ← Prev
        </button>
        <button type="button" className="ghost-btn graph-algo-btn" onClick={() => goStep(1)} disabled={playing || idx >= frames.length - 1}>
          Next →
        </button>
        <button type="button" className="ghost-btn graph-algo-btn" onClick={play} disabled={playing}>
          Play all
        </button>
        <button type="button" className="ghost-btn graph-algo-btn" onClick={reset} disabled={playing}>
          Reset
        </button>
      </div>

      <div className="graph-algo-svg-wrap">
        {isJohnson ? (
          <svg className="graph-algo-svg graph-algo-svg--johnson" viewBox="0 0 400 295" aria-label="Johnson APSP demo graph">
            <defs>
              <marker
                id="graph-arrow-johnson"
                markerWidth="8"
                markerHeight="8"
                refX="20"
                refY="4"
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path d="M0,0 L8,4 L0,8 z" fill="var(--border-default)" />
              </marker>
            </defs>
            {johnsonEdgeRows.map((e, ei) => {
              const [x1, y1] = JOHNSON_POS[e.u];
              const [x2, y2] = JOHNSON_POS[e.v];
              const hl = frame.highlightEdges && frame.highlightEdges.some(([a, b]) => a === e.u && b === e.v);
              const rw = frame.reweighted && frame.reweighted.find((r) => r.u === e.u && r.v === e.v);
              let label = "";
              if (e.superEdge) label = "0";
              else if (frame.showReweight && rw) label = `${e.w}→${rw.wp}`;
              else label = String(e.w);
              const edgeClass = ["graph-edge", e.superEdge ? "graph-edge-johnson-super" : "", hl ? "graph-edge-active" : ""]
                .filter(Boolean)
                .join(" ");
              return (
                <g key={`je-${ei}-${e.u}-${e.v}`}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    className={edgeClass}
                    markerEnd="url(#graph-arrow-johnson)"
                  />
                  <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 6} className="graph-edge-w" textAnchor="middle">
                    {label}
                  </text>
                </g>
              );
            })}
            {JOHNSON_POS.map(([cx, cy], i) => {
              const hl = frame.highlightNodes && frame.highlightNodes.includes(i);
              const cur = frame.current === i;
              let sub = "";
              if (i < JOHNSON_V && frame.h && frame.h[i] !== undefined && frame.h[i] < INF / 2) {
                sub = `h=${frame.h[i]}`;
              }
              const idLabel = i === JOHNSON_SUPER ? "S" : String(i);
              return (
                <g key={`jn-${i}`}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={i === JOHNSON_SUPER ? 24 : 22}
                    className={`graph-node ${hl ? "graph-node-active" : ""} ${cur ? "graph-node-current" : ""} ${
                      i === JOHNSON_SUPER ? "graph-node-johnson-super" : ""
                    }`}
                  />
                  <text x={cx} y={cy + 5} className="graph-node-id" textAnchor="middle">
                    {idLabel}
                  </text>
                  {sub ? (
                    <text x={cx} y={cy + 38} className="graph-node-dist" textAnchor="middle">
                      {sub}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>
        ) : (
          <svg className="graph-algo-svg" viewBox="0 0 400 280" aria-label="Demo graph">
            <defs>
              <marker
                id="graph-arrow"
                markerWidth="8"
                markerHeight="8"
                refX="20"
                refY="4"
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path d="M0,0 L8,4 L0,8 z" fill="var(--border-default)" />
              </marker>
            </defs>
            {edgesToDraw.map(([u, v, w], ei) => {
              const [x1, y1] = NODE_POS[u];
              const [x2, y2] = NODE_POS[v];
              const hl =
                frame.highlightEdges &&
                frame.highlightEdges.some(([a, b]) => (a === u && b === v) || (!directed && a === v && b === u));
              const mstHl = frame.mstEdges && edgeInMst([u, v], frame.mstEdges);
              const edgeClass = [
                "graph-edge",
                hl ? "graph-edge-active" : "",
                mstHl && !hl ? "graph-edge-mst" : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <g key={`e-${ei}-${u}-${v}`}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    className={edgeClass}
                    markerEnd={directed ? "url(#graph-arrow)" : undefined}
                  />
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 - 6}
                    className="graph-edge-w"
                    textAnchor="middle"
                  >
                    {directed ? "" : w}
                  </text>
                </g>
              );
            })}
            {NODE_POS.map(([cx, cy], i) => {
              const hl = frame.highlightNodes && frame.highlightNodes.includes(i);
              const cur = frame.current === i;
              const khl = frame.highlightK === i;
              const d = frame.dist && frame.dist[i];
              let distLabel = "";
              if (algorithm === "BFS" && frame.visitOrder && frame.visitOrder[i] > 0) {
                distLabel = `#${frame.visitOrder[i]}`;
              } else if (algorithm === "Bidirectional BFS" && frame.distF && frame.distB) {
                const df = frame.distF[i];
                const db = frame.distB[i];
                if (df >= 0 && db >= 0) distLabel = `f=${df},b=${db}`;
                else if (df >= 0) distLabel = `f=${df}`;
                else if (db >= 0) distLabel = `b=${db}`;
              } else if (
                algorithm === "Multi-Source BFS" &&
                frame.nearestSource &&
                d !== null &&
                d !== undefined &&
                d !== -1 &&
                !(typeof d === "number" && !Number.isFinite(d))
              ) {
                distLabel = `d=${d}·${frame.nearestSource[i]}`;
              } else if (d !== null && d !== undefined && d !== -1 && !(typeof d === "number" && !Number.isFinite(d))) {
                distLabel = `d=${d}`;
              }
              return (
                <g key={`n-${i}`}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={22}
                    className={`graph-node ${hl || khl ? "graph-node-active" : ""} ${cur ? "graph-node-current" : ""}`}
                  />
                  <text x={cx} y={cy + 5} className="graph-node-id" textAnchor="middle">
                    {i}
                  </text>
                  {distLabel ? (
                    <text x={cx} y={cy + 36} className="graph-node-dist" textAnchor="middle">
                      {distLabel}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>
        )}
      </div>

      {frame.matrix ? (
        <div className="graph-fw-matrix-wrap">
          <div className="graph-fw-matrix-title">All-pairs dist (Floyd-Warshall)</div>
          <table className="graph-fw-matrix">
            <thead>
              <tr>
                <th className="graph-fw-corner" />
                {Array.from({ length: N }, (_, j) => (
                  <th key={j}>{j}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {frame.matrix.map((row, i) => (
                <tr key={i}>
                  <th>{i}</th>
                  {row.map((cell, j) => {
                    const active =
                      frame.highlightK != null &&
                      frame.highlightK >= 0 &&
                      (i === frame.highlightK || j === frame.highlightK);
                    return (
                      <td key={j} className={active ? "graph-fw-cell-active" : ""}>
                        {fmtMatrixCell(cell)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {isJohnson && frame.h ? (
        <div className="graph-johnson-panel">
          <div className="graph-johnson-panel-title">Potentials h[v] = δ(S, v) after Bellman–Ford</div>
          <div className="graph-johnson-h-row">
            {Array.from({ length: JOHNSON_V }, (_, v) => (
              <span key={v} className="graph-johnson-h-chip">
                h[{v}]={frame.h[v] >= INF / 2 ? "∞" : frame.h[v]}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {isJohnson && frame.matrixPrime ? (
        <div className="graph-fw-matrix-wrap graph-johnson-matrix-wrap">
          <div className="graph-fw-matrix-title">d′(s,t) — Dijkstra on reweighted edges</div>
          <table className="graph-fw-matrix">
            <thead>
              <tr>
                <th className="graph-fw-corner">d′</th>
                {Array.from({ length: JOHNSON_V }, (_, j) => (
                  <th key={j}>{j}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {frame.matrixPrime.map((row, i) => (
                <tr key={i}>
                  <th>{i}</th>
                  {row.map((cell, j) => (
                    <td key={j}>{fmtMatrixCell(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {isJohnson && frame.matrixFinal ? (
        <div className="graph-fw-matrix-wrap graph-johnson-matrix-wrap">
          <div className="graph-fw-matrix-title">All-pairs shortest paths d(s,t) (original weights)</div>
          <table className="graph-fw-matrix">
            <thead>
              <tr>
                <th className="graph-fw-corner">d</th>
                {Array.from({ length: JOHNSON_V }, (_, j) => (
                  <th key={j}>{j}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {frame.matrixFinal.map((row, i) => (
                <tr key={i}>
                  <th>{i}</th>
                  {row.map((cell, j) => (
                    <td key={j}>{fmtMatrixCell(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="graph-algo-meta">
        {algorithm === "BFS" && frame.queue ? (
          <div className="graph-meta-row">
            <strong>Queue:</strong>{" "}
            <span className="graph-meta-mono">[{frame.queue.join(", ") || " "}]</span>
          </div>
        ) : null}
        {algorithm === "Multi-Source BFS" && frame.queue ? (
          <div className="graph-meta-row">
            <strong>Queue:</strong>{" "}
            <span className="graph-meta-mono">[{frame.queue.join(", ") || " "}]</span>
          </div>
        ) : null}
        {algorithm === "Multi-Source BFS" && frame.nearestSource ? (
          <div className="graph-meta-row">
            <strong>nearest[] (source id):</strong>{" "}
            <span className="graph-meta-mono">[{frame.nearestSource.join(", ")}]</span>
          </div>
        ) : null}
        {algorithm === "DFS" && frame.stack ? (
          <div className="graph-meta-row">
            <strong>Stack:</strong>{" "}
            <span className="graph-meta-mono">[{frame.stack.join(", ") || " "}]</span>
          </div>
        ) : null}
        {algorithm === "Bidirectional BFS" && frame.queueF ? (
          <div className="graph-meta-row">
            <strong>Forward Q:</strong>{" "}
            <span className="graph-meta-mono">[{frame.queueF.join(", ") || " "}]</span>
          </div>
        ) : null}
        {algorithm === "Bidirectional BFS" && frame.queueB ? (
          <div className="graph-meta-row">
            <strong>Backward Q:</strong>{" "}
            <span className="graph-meta-mono">[{frame.queueB.join(", ") || " "}]</span>
          </div>
        ) : null}
        {algorithm === "Dijkstra" && frame.pq && frame.pq.length > 0 ? (
          <div className="graph-meta-row">
            <strong>Min-heap (dist, node):</strong>{" "}
            <span className="graph-meta-mono">
              [{frame.pq.map(([d, u]) => `(${d},${u})`).join(", ")}]
            </span>
          </div>
        ) : null}
        {algorithm === "Dijkstra" && frame.pq && frame.pq.length === 0 && idx > 0 && idx < frames.length - 1 ? (
          <div className="graph-meta-row muted">Heap empty after this settle.</div>
        ) : null}
        {algorithm === "BFS" && frame.visitOrder ? (
          <div className="graph-meta-row">
            <strong>Traversal # (dequeue order):</strong>{" "}
            <span className="graph-meta-mono">[{visitOrderLine}]</span>
          </div>
        ) : null}
        {frame.dist && algorithm !== "Bidirectional BFS" && algorithm !== "Multi-Source BFS" && algorithm !== "BFS" ? (
          <div className="graph-meta-row">
            <strong>{algorithm === "Prim (MST)" ? "key[]" : "dist[]"}:</strong>{" "}
            <span className="graph-meta-mono">[{distLine}]</span>
          </div>
        ) : null}
        {algorithm === "Multi-Source BFS" && frame.dist ? (
          <div className="graph-meta-row">
            <strong>dist[]:</strong> <span className="graph-meta-mono">[{distLine}]</span>
          </div>
        ) : null}
        {algorithm === "Bidirectional BFS" && frame.distF ? (
          <div className="graph-meta-row">
            <strong>distF[]:</strong>{" "}
            <span className="graph-meta-mono">
              [{frame.distF.map((d) => (d === -1 ? "∞" : String(d))).join(", ")}]
            </span>
          </div>
        ) : null}
        {algorithm === "Bidirectional BFS" && frame.distB ? (
          <div className="graph-meta-row">
            <strong>distB[]:</strong>{" "}
            <span className="graph-meta-mono">
              [{frame.distB.map((d) => (d === -1 ? "∞" : String(d))).join(", ")}]
            </span>
          </div>
        ) : null}
        {algorithm === "Bellman-Ford" && frame.round != null ? (
          <div className="graph-meta-row">
            <strong>Relaxation round:</strong> {frame.round}
          </div>
        ) : null}
        {algorithm === "Topological Sort (Kahn)" && frame.topoQueue ? (
          <div className="graph-meta-row">
            <strong>Ready (indegree 0):</strong>{" "}
            <span className="graph-meta-mono">[{frame.topoQueue.join(", ") || " "}]</span>
          </div>
        ) : null}
        {algorithm === "Topological Sort (Kahn)" && frame.topoOrder ? (
          <div className="graph-meta-row">
            <strong>Order so far:</strong>{" "}
            <span className="graph-meta-mono">[{frame.topoOrder.join(", ")}]</span>
          </div>
        ) : null}
        {(algorithm === "Kruskal (MST)" || algorithm === "Prim (MST)") && frame.mstEdges ? (
          <div className="graph-meta-row">
            <strong>MST edges:</strong>{" "}
            <span className="graph-meta-mono">
              [{frame.mstEdges.map(([a, b]) => `(${a}—${b})`).join(", ")}]
            </span>
          </div>
        ) : null}
        {isJohnson && frame.dijkstraSource != null && frame.distPrimeRow ? (
          <div className="graph-meta-row">
            <strong>
              d′[{frame.dijkstraSource}][·] (reweighted):
            </strong>{" "}
            <span className="graph-meta-mono">
              [{frame.distPrimeRow.map((x) => (x >= INF / 2 ? "∞" : String(x))).join(", ")}]
            </span>
          </div>
        ) : null}
      </div>

      <p className="graph-algo-viz-hint muted">
        {algorithm === "Floyd-Warshall"
          ? `All-pairs shortest paths on ${N} nodes; matrix updates after each intermediate k.`
          : algorithm === "Topological Sort (Kahn)"
            ? `DAG demo: ${TOPO_DAG_EDGES.length} directed edges; arrows show prerequisite direction.`
            : algorithm === "Bidirectional BFS"
              ? `Unweighted demo; forward from ${SRC}, backward from ${DST}.`
              : algorithm === "Multi-Source BFS"
                ? `Sources = ${MULTI_SOURCES.join(", ")}; labels show d=hops·nearestSource.`
              : algorithm === "BFS"
                ? `Traversal from start ${SRC}; node labels are dequeue order (#1, #2, …).`
                : isJohnson
                  ? "Directed graph with super-source S (dashed zero edges); one negative edge 1→2. Labels show w or w→w′; nodes 0–3 show h when known."
                  : `Demo uses ${N} nodes and undirected edges (arrows show relaxation direction in text). Source = ${SRC}.`}
      </p>
    </div>
  );
}
