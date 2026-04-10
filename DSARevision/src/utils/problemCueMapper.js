const RULES = [
  { cue: /contiguous|substring|subarray|window/i, suggest: "Sliding Window / Prefix Sum" },
  { cue: /exactly k|at most k|at least k|distinct/i, suggest: "Sliding Window Variants (AtMost/ExactlyK)" },
  { cue: /anagram|permutation in string|frequency map/i, suggest: "Sliding Window Variant: Frequency Match" },
  { cue: /window maximum|window minimum|deque/i, suggest: "Sliding Window Variant: Monotonic Deque" },
  { cue: /pair sum|two sum sorted|triplet|3sum|4sum|k sum/i, suggest: "Two Pointers Variants" },
  { cue: /cycle in linked list|middle node|fast slow/i, suggest: "Two Pointers Variant: Fast/Slow" },
  { cue: /islands|components|flood fill/i, suggest: "Graph Variant: DFS Components / Grid Flood Fill" },
  { cue: /multi source|nearest zero|nearest gate|rotten oranges/i, suggest: "Graph Variant: Multi-Source BFS" },
  { cue: /topological|prerequisite|course schedule/i, suggest: "Graph Variant: Kahn Topological BFS" },
  { cue: /bipartite|two color/i, suggest: "Graph Variant: Bipartite BFS Coloring" },
  { cue: /0-1 bfs|zero one bfs|binary weights/i, suggest: "Graph Variant: 0-1 BFS" },
  { cue: /shortest path|minimum hops|unweighted graph/i, suggest: "BFS" },
  { cue: /weighted shortest path|non-negative weights/i, suggest: "Dijkstra" },
  { cue: /sorted|monotonic|binary/i, suggest: "Binary Search (or Binary Search on Answer)" },
  { cue: /top k|kth|priority/i, suggest: "Heap / PriorityQueue" },
  { cue: /connectivity|components|union/i, suggest: "Union-Find (DSU)" },
  { cue: /prefix|autocomplete|dictionary words/i, suggest: "Trie" },
  { cue: /state design|dp state|i,j|index sum|digit dp|bitmask dp|tree dp|dag dp/i, suggest: "DP by State Design" },
  { cue: /overlapping subproblems|ways|minimum cost/i, suggest: "Dynamic Programming" },
  { cue: /next greater|span|histogram/i, suggest: "Monotonic Stack" },
];

export function mapProblemCuesToPatterns(text) {
  const normalized = (text || "").trim();
  if (!normalized) return [];
  return RULES.filter((r) => r.cue.test(normalized)).map((r) => r.suggest);
}
