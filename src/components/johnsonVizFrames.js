/**
 * Johnson APSP demo: 4 vertices + super-source S (index 4).
 * Directed edges include one negative weight; no negative cycle.
 */

export const JOHNSON_V = 4;
export const JOHNSON_SUPER = 4;
export const JOHNSON_N = 5;

/** [u, v, w] directed */
export const JOHNSON_EDGES = [
  [0, 1, 3],
  [0, 2, 5],
  [1, 2, -2],
  [1, 3, 4],
  [2, 3, 1],
];

/** Layout: 0,1,2 top; 3 left mid; 4 = super bottom */
export const JOHNSON_POS = [
  [60, 45],
  [200, 45],
  [340, 45],
  [60, 155],
  [200, 248],
];

const INF = 1e9;

function bellmanFord(n, edges, src) {
  const dist = Array(n).fill(INF);
  dist[src] = 0;
  for (let i = 0; i < n - 1; i++) {
    for (const [u, v, w] of edges) {
      if (dist[u] < INF && dist[v] > dist[u] + w) dist[v] = dist[u] + w;
    }
  }
  for (const [u, v, w] of edges) {
    if (dist[u] < INF && dist[v] > dist[u] + w) return null;
  }
  return dist;
}

function dijkstra(n, adj, src) {
  const dist = Array(n).fill(INF);
  dist[src] = 0;
  const pq = [];
  const push = (d, u) => {
    pq.push([d, u]);
    pq.sort((a, b) => a[0] - b[0]);
  };
  push(0, src);
  while (pq.length) {
    const [d, u] = pq.shift();
    if (d > dist[u]) continue;
    for (const [v, w] of adj[u]) {
      if (dist[v] > d + w) {
        dist[v] = d + w;
        push(dist[v], v);
      }
    }
  }
  return dist;
}

export function buildJohnsonFrames() {
  const superEdges = [];
  for (let i = 0; i < JOHNSON_V; i++) superEdges.push([JOHNSON_SUPER, i, 0]);
  const augEdges = [...JOHNSON_EDGES.map((e) => [...e]), ...superEdges.map((e) => [...e])];

  const hFull = bellmanFord(JOHNSON_N, augEdges, JOHNSON_SUPER);
  if (!hFull) return [{ msg: "Error: negative cycle (demo graph should not hit this).", phase: "error" }];

  const h = hFull.slice(0, JOHNSON_V);
  const reweighted = JOHNSON_EDGES.map(([u, v, w]) => {
    const wp = w + h[u] - h[v];
    return { u, v, w, wp };
  });

  const adj = Array.from({ length: JOHNSON_V }, () => []);
  for (const { u, v, wp } of reweighted) {
    adj[u].push([v, wp]);
  }
  for (let i = 0; i < JOHNSON_V; i++) adj[i].sort((a, b) => a[0] - b[0]);

  const distPrime = [];
  for (let s = 0; s < JOHNSON_V; s++) {
    distPrime.push(dijkstra(JOHNSON_V, adj, s));
  }

  const final = Array.from({ length: JOHNSON_V }, () => Array(JOHNSON_V).fill(0));
  for (let s = 0; s < JOHNSON_V; s++) {
    for (let t = 0; t < JOHNSON_V; t++) {
      const dp = distPrime[s][t];
      final[s][t] = dp >= INF / 2 ? INF : dp - h[s] + h[t];
    }
  }

  const frames = [];

  const snap = (extra) => ({
    phase: "main",
    highlightNodes: [],
    highlightEdges: [],
    showSuper: true,
    showReweight: false,
    h: null,
    reweighted: null,
    matrixPrime: null,
    matrixFinal: null,
    dijkstraSource: null,
    distPrimeRow: null,
    edgeHighlight: null,
    ...extra,
  });

  frames.push(
    snap({
      msg: "Johnson APSP: all-pairs shortest paths on sparse graphs that may have negative edges (no negative cycles). Five phases: augment → Bellman-Ford → reweight → Dijkstra × V → recover.",
      showSuper: false,
    }),
  );

  frames.push(
    snap({
      msg: "Phase 1 — Add super-source S (node 4) with edges (S→v, w=0) for every vertex v. This makes all vertices reachable so BF can compute potentials h[v] = δ(S,v).",
      highlightNodes: [JOHNSON_SUPER],
      showSuper: true,
    }),
  );

  frames.push(
    snap({
      msg: "Augmented edge set = original directed edges + zero edges from S. Original graph has a negative edge 1→2 (w = −2) but no negative cycle.",
      highlightNodes: [1, 2],
      highlightEdges: [[1, 2]],
    }),
  );

  frames.push(
    snap({
      msg: "Phase 2 — Bellman-Ford on the augmented graph from S. After V−1 relaxation rounds, h[v] = shortest distance from S to v (here h is the potential for reweighting).",
      showSuper: true,
    }),
  );

  frames.push(
    snap({
      msg: `Bellman-Ford finished. Potentials h[0..3] = [${h.map((x) => (x >= INF / 2 ? "∞" : x)).join(", ")}]. If any edge still relaxes, report negative cycle and abort.`,
      h: [...h],
      showSuper: true,
    }),
  );

  frames.push(
    snap({
      msg: "Phase 3 — Reweight each original edge: w′(u,v) = w(u,v) + h[u] − h[v]. By telescoping along any path, all w′ are ≥ 0, so Dijkstra applies.",
      showSuper: false,
      showReweight: true,
      h: [...h],
      reweighted: reweighted.map((x) => ({ ...x })),
    }),
  );

  for (let i = 0; i < reweighted.length; i++) {
    const e = reweighted[i];
    frames.push(
      snap({
        msg: `Edge (${e.u}→${e.v}): w=${e.w}, w′ = ${e.w} + h[${e.u}] − h[${e.v}] = ${e.wp}.`,
        showSuper: false,
        showReweight: true,
        h: [...h],
        reweighted: reweighted.map((x) => ({ ...x })),
        highlightEdges: [[e.u, e.v]],
        highlightNodes: [e.u, e.v],
        edgeHighlight: i,
      }),
    );
  }

  for (let s = 0; s < JOHNSON_V; s++) {
    frames.push(
      snap({
        msg: `Phase 4 — Dijkstra from source ${s} on the reweighted graph (only vertices 0..3, non-negative w′).`,
        showSuper: false,
        showReweight: true,
        h: [...h],
        reweighted: reweighted.map((x) => ({ ...x })),
        dijkstraSource: s,
        highlightNodes: [s],
      }),
    );
    frames.push(
      snap({
        msg: `d′[${s}][·] = [${distPrime[s].map((x) => (x >= INF / 2 ? "∞" : x)).join(", ")}].`,
        dijkstraSource: s,
        distPrimeRow: [...distPrime[s]],
        h: [...h],
      }),
    );
  }

  frames.push(
    snap({
      msg: "Phase 5 — Recover true lengths: d(s,t) = d′(s,t) − h(s) + h(t). Diagonal entries stay 0; unreachable pairs stay ∞.",
      h: [...h],
      matrixPrime: distPrime.map((r) => [...r]),
    }),
  );

  frames.push(
    snap({
      msg: `All-pairs shortest path lengths (original weights): complete.`,
      matrixPrime: distPrime.map((r) => [...r]),
      matrixFinal: final.map((r) => [...r]),
      h: [...h],
    }),
  );

  return frames;
}
