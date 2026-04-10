import { JAVA_SNIPPETS } from './javaSnippets.js';

export const DP_CODE_VARIANTS = {
  "DP Variation: 1D Linear DP": [
    {
      title: "1) Recursive (plain)",
      code: `int climbRec(int n) {
  if (n <= 2) return n;
  return climbRec(n - 1) + climbRec(n - 2);
}`,
    },
    {
      title: "2) Memoization + recursion (top-down)",
      code: `int climbMemo(int n, int[] memo) {
  if (n <= 2) return n;
  if (memo[n] != 0) return memo[n];
  memo[n] = climbMemo(n - 1, memo) + climbMemo(n - 2, memo);
  return memo[n];
}`,
    },
    { title: "3) Iterative DP (bottom-up)", code: JAVA_SNIPPETS.dpLinear1d },
  ],
  "DP Variation: 2D Grid DP": [
    {
      title: "1) Recursive (plain)",
      code: `int solve(int r, int c, int[][] g) {
  if (r == 0 && c == 0) return g[0][0];
  if (r < 0 || c < 0) return Integer.MAX_VALUE / 2;
  return g[r][c] + Math.min(solve(r - 1, c, g), solve(r, c - 1, g));
}`,
    },
    {
      title: "2) Memoization + recursion (top-down)",
      code: `int solveMemo(int r, int c, int[][] g, Integer[][] memo) {
  if (r == 0 && c == 0) return g[0][0];
  if (r < 0 || c < 0) return Integer.MAX_VALUE / 2;
  if (memo[r][c] != null) return memo[r][c];
  memo[r][c] = g[r][c] + Math.min(
      solveMemo(r - 1, c, g, memo),
      solveMemo(r, c - 1, g, memo)
  );
  return memo[r][c];
}`,
    },
    { title: "3) Iterative DP (bottom-up)", code: JAVA_SNIPPETS.dpGrid2d },
  ],
  "DP Variation: Subsequence (i,j) DP": [
    {
      title: "1) Recursive (plain)",
      code: `int lcsRec(String a, String b, int i, int j) {
  if (i == 0 || j == 0) return 0;
  if (a.charAt(i - 1) == b.charAt(j - 1)) return 1 + lcsRec(a, b, i - 1, j - 1);
  return Math.max(lcsRec(a, b, i - 1, j), lcsRec(a, b, i, j - 1));
}`,
    },
    {
      title: "2) Memoization + recursion (top-down)",
      code: `int lcsMemo(String a, String b, int i, int j, Integer[][] memo) {
  if (i == 0 || j == 0) return 0;
  if (memo[i][j] != null) return memo[i][j];
  if (a.charAt(i - 1) == b.charAt(j - 1)) memo[i][j] = 1 + lcsMemo(a, b, i - 1, j - 1, memo);
  else memo[i][j] = Math.max(lcsMemo(a, b, i - 1, j, memo), lcsMemo(a, b, i, j - 1, memo));
  return memo[i][j];
}`,
    },
    { title: "3) Iterative DP (bottom-up)", code: JAVA_SNIPPETS.dpLcs2d },
  ],
  "DP Variation: Knapsack Family": [
    {
      title: "1) Recursive (plain)",
      code: `int ksRec(int i, int cap, int[] wt, int[] val) {
  if (i == wt.length || cap == 0) return 0;
  int skip = ksRec(i + 1, cap, wt, val);
  int take = cap >= wt[i] ? val[i] + ksRec(i + 1, cap - wt[i], wt, val) : 0;
  return Math.max(skip, take);
}`,
    },
    {
      title: "2) Memoization + recursion (top-down)",
      code: `int ksMemo(int i, int cap, int[] wt, int[] val, Integer[][] memo) {
  if (i == wt.length || cap == 0) return 0;
  if (memo[i][cap] != null) return memo[i][cap];
  int skip = ksMemo(i + 1, cap, wt, val, memo);
  int take = cap >= wt[i] ? val[i] + ksMemo(i + 1, cap - wt[i], wt, val, memo) : 0;
  memo[i][cap] = Math.max(skip, take);
  return memo[i][cap];
}`,
    },
    { title: "3) Iterative DP (bottom-up)", code: JAVA_SNIPPETS.dpKnapsack01 },
  ],
  "DP Variation: State Design - Index i": [
    {
      title: "1) Recursive (plain)",
      code: `int f(int i) {
  if (i <= 2) return i;
  return f(i - 1) + f(i - 2);
}`,
    },
    {
      title: "2) Memoization + recursion (top-down)",
      code: `int fMemo(int i, int[] memo) {
  if (i <= 2) return i;
  if (memo[i] != 0) return memo[i];
  memo[i] = fMemo(i - 1, memo) + fMemo(i - 2, memo);
  return memo[i];
}`,
    },
    { title: "3) Iterative DP (bottom-up)", code: JAVA_SNIPPETS.dpLinear1d },
  ],
  "DP Variation: State Design - Pair (i,j)": [
    {
      title: "1) Recursive (plain)",
      code: `int solve(int i, int j, String a, String b) {
  if (i == 0 || j == 0) return 0;
  if (a.charAt(i - 1) == b.charAt(j - 1)) return 1 + solve(i - 1, j - 1, a, b);
  return Math.max(solve(i - 1, j, a, b), solve(i, j - 1, a, b));
}`,
    },
    {
      title: "2) Memoization + recursion (top-down)",
      code: `int solveMemo(int i, int j, String a, String b, Integer[][] memo) {
  if (i == 0 || j == 0) return 0;
  if (memo[i][j] != null) return memo[i][j];
  if (a.charAt(i - 1) == b.charAt(j - 1)) memo[i][j] = 1 + solveMemo(i - 1, j - 1, a, b, memo);
  else memo[i][j] = Math.max(solveMemo(i - 1, j, a, b, memo), solveMemo(i, j - 1, a, b, memo));
  return memo[i][j];
}`,
    },
    { title: "3) Iterative DP (bottom-up)", code: JAVA_SNIPPETS.dpLcs2d },
  ],
  "DP Variation: State Design - Position + Capacity": [
    {
      title: "1) Recursive (plain)",
      code: `int ks(int i, int cap, int[] wt, int[] val) {
  if (i == wt.length || cap == 0) return 0;
  int skip = ks(i + 1, cap, wt, val);
  int take = cap >= wt[i] ? val[i] + ks(i + 1, cap - wt[i], wt, val) : 0;
  return Math.max(skip, take);
}`,
    },
    {
      title: "2) Memoization + recursion (top-down)",
      code: `int ksMemo(int i, int cap, int[] wt, int[] val, Integer[][] memo) {
  if (i == wt.length || cap == 0) return 0;
  if (memo[i][cap] != null) return memo[i][cap];
  int skip = ksMemo(i + 1, cap, wt, val, memo);
  int take = cap >= wt[i] ? val[i] + ksMemo(i + 1, cap - wt[i], wt, val, memo) : 0;
  memo[i][cap] = Math.max(skip, take);
  return memo[i][cap];
}`,
    },
    { title: "3) Iterative DP (bottom-up)", code: JAVA_SNIPPETS.dpKnapsack01 },
  ],
  "DP Variation: State Design - Index + Sum": [
    {
      title: "1) Recursive (plain)",
      code: `int ways(int i, int sum, int[] a) {
  if (i == a.length) return sum == 0 ? 1 : 0;
  return ways(i + 1, sum, a) + ways(i + 1, sum - a[i], a);
}`,
    },
    {
      title: "2) Memoization + recursion (top-down)",
      code: `int waysMemo(int i, int sum, int[] a, Map<String, Integer> memo) {
  if (i == a.length) return sum == 0 ? 1 : 0;
  String key = i + "#" + sum;
  if (memo.containsKey(key)) return memo.get(key);
  int ans = waysMemo(i + 1, sum, a, memo) + waysMemo(i + 1, sum - a[i], a, memo);
  memo.put(key, ans);
  return ans;
}`,
    },
    { title: "3) Iterative DP (bottom-up)", code: JAVA_SNIPPETS.topDownDp },
  ],
  "DP Variation: State Design - Interval (l,r)": [
    {
      title: "1) Recursive (plain)",
      code: `int burst(int l, int r, int[] a) {
  if (l + 1 == r) return 0;
  int best = 0;
  for (int k = l + 1; k < r; k++) {
    best = Math.max(best, burst(l, k, a) + burst(k, r, a) + a[l] * a[k] * a[r]);
  }
  return best;
}`,
    },
    {
      title: "2) Memoization + recursion (top-down)",
      code: `int burstMemo(int l, int r, int[] a, Integer[][] memo) {
  if (l + 1 == r) return 0;
  if (memo[l][r] != null) return memo[l][r];
  int best = 0;
  for (int k = l + 1; k < r; k++) {
    best = Math.max(best, burstMemo(l, k, a, memo) + burstMemo(k, r, a, memo) + a[l] * a[k] * a[r]);
  }
  memo[l][r] = best;
  return best;
}`,
    },
    { title: "3) Iterative DP (bottom-up)", code: JAVA_SNIPPETS.dpInterval },
  ],
  "DP Variation: State Design - Tree Node": [
    {
      title: "1) Recursive (plain)",
      code: `int[] dfs(int u, int p, List<List<Integer>> g, int[] val) {
  int take = val[u], skip = 0;
  for (int v : g.get(u)) if (v != p) {
    int[] ch = dfs(v, u, g, val);
    take += ch[1];
    skip += Math.max(ch[0], ch[1]);
  }
  return new int[]{take, skip};
}`,
    },
    {
      title: "2) Memoization + recursion (top-down)",
      code: `// Tree DP usually memoizes by (node,parent-state) implicitly in DFS.
// Revisit only through parent filter; each edge processed once.`,
    },
    { title: "3) Iterative DP (bottom-up)", code: JAVA_SNIPPETS.dpTree },
  ],
  "DP Variation: State Design - Bitmask + Last": [
    {
      title: "1) Recursive (plain)",
      code: `int tsp(int mask, int last, int[][] d) {
  if (mask == (1 << d.length) - 1) return d[last][0];
  int ans = Integer.MAX_VALUE / 4;
  for (int nxt = 0; nxt < d.length; nxt++) {
    if ((mask & (1 << nxt)) != 0) continue;
    ans = Math.min(ans, d[last][nxt] + tsp(mask | (1 << nxt), nxt, d));
  }
  return ans;
}`,
    },
    {
      title: "2) Memoization + recursion (top-down)",
      code: `int tspMemo(int mask, int last, int[][] d, int[][] memo) {
  if (mask == (1 << d.length) - 1) return d[last][0];
  if (memo[mask][last] != -1) return memo[mask][last];
  int ans = Integer.MAX_VALUE / 4;
  for (int nxt = 0; nxt < d.length; nxt++) {
    if ((mask & (1 << nxt)) == 0) ans = Math.min(ans, d[last][nxt] + tspMemo(mask | (1 << nxt), nxt, d, memo));
  }
  return memo[mask][last] = ans;
}`,
    },
    { title: "3) Iterative DP (bottom-up)", code: JAVA_SNIPPETS.dpBitmask },
  ],
  "DP Variation: State Design - Digit": [
    {
      title: "1) Recursive (plain)",
      code: `long dfs(int pos, int prev, boolean tight, boolean started, char[] dig) {
  if (pos == dig.length) return 1;
  int lim = tight ? dig[pos] - '0' : 9;
  long ans = 0;
  for (int d = 0; d <= lim; d++) {
    boolean ns = started || d != 0;
    if (ns && started && d == prev) continue;
    ans += dfs(pos + 1, ns ? d : 10, tight && d == lim, ns, dig);
  }
  return ans;
}`,
    },
    {
      title: "2) Memoization + recursion (top-down)",
      code: `Long[][][][] memo = new Long[20][11][2][2];
long dfsMemo(int pos, int prev, int tight, int started, char[] dig) { /* same transitions + memo */ }`,
    },
    { title: "3) Iterative DP (bottom-up)", code: JAVA_SNIPPETS.dpDigit },
  ],
  "DP Variation: State Design - DAG Node": [
    {
      title: "1) Recursive (plain)",
      code: `int solve(int u, List<List<Integer>> g) {
  int best = 0;
  for (int v : g.get(u)) best = Math.max(best, 1 + solve(v, g));
  return best;
}`,
    },
    {
      title: "2) Memoization + recursion (top-down)",
      code: `int solveMemo(int u, List<List<Integer>> g, int[] memo) {
  if (memo[u] != -1) return memo[u];
  int best = 0;
  for (int v : g.get(u)) best = Math.max(best, 1 + solveMemo(v, g, memo));
  return memo[u] = best;
}`,
    },
    { title: "3) Iterative DP (bottom-up)", code: JAVA_SNIPPETS.dpDag },
  ],
  "DP Variation: State Design - Finite State Machine": [
    {
      title: "1) Recursive (plain)",
      code: `int solve(int i, int state, int[] p) {
  if (i == p.length) return state == 1 ? Integer.MIN_VALUE / 4 : 0;
  // state: 0=rest,1=hold,2=cooldown (example)
  // Try valid transitions from current state.
  return 0; // expand transitions per problem
}`,
    },
    {
      title: "2) Memoization + recursion (top-down)",
      code: `int solveMemo(int i, int state, int[] p, Integer[][] memo) {
  if (i == p.length) return state == 1 ? Integer.MIN_VALUE / 4 : 0;
  if (memo[i][state] != null) return memo[i][state];
  // compute transitions and cache
  return memo[i][state] = 0;
}`,
    },
    { title: "3) Iterative DP (bottom-up)", code: JAVA_SNIPPETS.dpStateMachine },
  ],
};
