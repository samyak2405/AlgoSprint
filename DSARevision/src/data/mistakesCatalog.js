export const MISTAKES_CATALOG = {
  default: [
    "Not validating constraints before selecting algorithm/data structure",
    "Ignoring edge cases: empty input, single element, overflow",
    "Choosing complex structures when simpler options are sufficient",
  ],
  "Binary Search": ["Forgetting sorted/monotonic precondition", "Infinite loop due to wrong mid updates"],
  "Union-Find (DSU)": ["Missing path compression or union by size/rank", "Using DSU where shortest-path is required"],
  "Sliding Window Pattern": [
    "Updating answer before restoring window validity",
    "Forgetting to remove left element counts while shrinking",
  ],
  "Sliding Window Variant: Exactly K": [
    "Trying direct-exact counting when atMost(K)-atMost(K-1) is simpler",
    "Mismatched handling of k=0 edge cases",
  ],
  "Two Pointers Pattern": [
    "Using two pointers without sorted/monotonic guarantee",
    "Skipping duplicate handling in pair/triplet problems",
  ],
  "Two Pointers Variant: Fast/Slow": [
    "Incorrect loop guard causing null-pointer exceptions",
    "Forgetting phase-2 reset when finding cycle entry",
  ],
  "Graph Variant: Kahn Topological BFS": [
    "Not initializing indegree correctly for all nodes",
    "Assuming ordering exists even when cycle prevents full traversal",
  ],
  "Graph Variant: 0-1 BFS": [
    "Using normal queue instead of deque for 0/1 edges",
    "Applying 0-1 BFS to weighted graphs with edge > 1",
  ],
  "DP Variation: State Design - Pair (i,j)": [
    "Mixing index semantics (length vs last-index)",
    "Wrong base case dimensions causing out-of-bounds",
  ],
  "DP Variation: State Design - Interval (l,r)": [
    "Filling intervals in wrong order (must be by length)",
    "Incorrect open/closed interval boundaries in transitions",
  ],
  "DP Variation: State Design - Digit": [
    "Incorrect tight transition propagation",
    "Leading-zero state not separated from started digits",
  ],
};
