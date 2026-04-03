import React, { useMemo, useState, useCallback, useEffect } from "react";
import { buildSections } from "./src/constants/sections";
import { Header } from "./src/components/Header";
import { SectionTabs } from "./src/components/SectionTabs";
import { Breadcrumbs } from "./src/components/Breadcrumbs";
import { QuestionOptions } from "./src/components/QuestionOptions";
import { ResultCard } from "./src/components/ResultCard";
import { useDecisionTreeNavigation } from "./src/hooks/useDecisionTreeNavigation";
import { RevisionModeSwitcher } from "./src/components/RevisionModeSwitcher";
import { SearchBar } from "./src/components/SearchBar";
import { CommandPalette } from "./src/components/CommandPalette";
import { CompareView } from "./src/components/CompareView";
import { DecisionDebugger } from "./src/components/DecisionDebugger";
import { ComplexityHeatmap } from "./src/components/ComplexityHeatmap";
import { MistakeBank } from "./src/components/MistakeBank";
import { ProblemCueMapper } from "./src/components/ProblemCueMapper";
import { buildSearchIndex } from "./src/utils/searchIndex";
import { collectComplexityInsights } from "./src/utils/complexityInsights";
import { mapProblemCuesToPatterns } from "./src/utils/problemCueMapper";
import { MISTAKES_CATALOG } from "./src/data/mistakesCatalog";
import { useKeyboardNavigation } from "./src/hooks/useKeyboardNavigation";

const OBJECTIVE_VIEWS = [
  { id: "core", label: "Core Revision" },
  { id: "insights", label: "Insights" },
];

const JAVA_SNIPPETS = {
  arrayList: `List<Integer> list = new ArrayList<>();
list.add(10);
list.add(20);
int x = list.get(1);       // O(1)
list.remove(0);            // O(n) shift`,
  linkedList: `Deque<Integer> deque = new LinkedList<>();
deque.addFirst(10);
deque.addLast(20);
int first = deque.removeFirst(); // O(1)`,
  arrayDequeStack: `Deque<Integer> st = new ArrayDeque<>();
st.push(10);
st.push(20);
int top = st.pop();        // 20`,
  stackWaysJava: `// 1) Recommended: ArrayDeque
Deque<Integer> s1 = new ArrayDeque<>();
s1.push(10); s1.push(20); int a = s1.pop();

// 2) Legacy Stack class (synchronized, usually slower)
Stack<Integer> s2 = new Stack<>();
s2.push(10); s2.push(20); int b = s2.pop();

// 3) LinkedList as Deque (works, more node overhead)
Deque<Integer> s3 = new LinkedList<>();
s3.push(10); s3.push(20); int c = s3.pop();`,
  stackFromScratch: `class IntStack {
  private int[] a;
  private int top;

  IntStack(int cap) {
    a = new int[Math.max(1, cap)];
    top = -1;
  }

  void push(int x) {
    if (top + 1 == a.length) grow();
    a[++top] = x;
  }

  int pop() {
    if (isEmpty()) throw new RuntimeException("Stack underflow");
    return a[top--];
  }

  int peek() {
    if (isEmpty()) throw new RuntimeException("Stack is empty");
    return a[top];
  }

  boolean isEmpty() { return top == -1; }
  int size() { return top + 1; }

  private void grow() {
    int[] b = new int[a.length * 2];
    System.arraycopy(a, 0, b, 0, a.length);
    a = b;
  }
}`,
  arrayDequeQueue: `Queue<Integer> q = new ArrayDeque<>();
q.offer(10);
q.offer(20);
int front = q.poll();      // 10`,
  queueWaysJava: `// 1) Recommended: ArrayDeque
Queue<Integer> q1 = new ArrayDeque<>();
q1.offer(10); q1.offer(20); int a = q1.poll();

// 2) LinkedList as Queue (works, more node overhead)
Queue<Integer> q2 = new LinkedList<>();
q2.offer(10); q2.offer(20); int b = q2.poll();

// 3) PriorityQueue (NOT FIFO queue; removes by priority)
Queue<Integer> q3 = new PriorityQueue<>();
q3.offer(10); q3.offer(1); int c = q3.poll(); // 1`,
  queueFromScratch: `class IntQueue {
  private int[] a;
  private int head, tail, size;

  IntQueue(int cap) {
    a = new int[Math.max(2, cap)];
    head = 0; tail = 0; size = 0;
  }

  void offer(int x) {
    if (size == a.length) grow();
    a[tail] = x;
    tail = (tail + 1) % a.length;
    size++;
  }

  int poll() {
    if (isEmpty()) throw new RuntimeException("Queue underflow");
    int x = a[head];
    head = (head + 1) % a.length;
    size--;
    return x;
  }

  int peek() {
    if (isEmpty()) throw new RuntimeException("Queue is empty");
    return a[head];
  }

  boolean isEmpty() { return size == 0; }
  int size() { return size; }

  private void grow() {
    int[] b = new int[a.length * 2];
    for (int i = 0; i < size; i++) b[i] = a[(head + i) % a.length];
    a = b;
    head = 0;
    tail = size;
  }
}`,
  priorityQueue: `PriorityQueue<Integer> pq = new PriorityQueue<>();
pq.offer(5);
pq.offer(1);
pq.offer(9);
while (!pq.isEmpty()) {
    System.out.println(pq.poll()); // 1, 5, 9
}`,
  priorityQueueMinHeap: `// MinHeap in Java (default PriorityQueue)
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
minHeap.offer(7);
minHeap.offer(2);
minHeap.offer(10);
System.out.println(minHeap.peek()); // 2 (smallest)
while (!minHeap.isEmpty()) {
  System.out.print(minHeap.poll() + " "); // 2 7 10
}`,
  priorityQueueMaxHeap: `// MaxHeap in Java
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
maxHeap.offer(7);
maxHeap.offer(2);
maxHeap.offer(10);
System.out.println(maxHeap.peek()); // 10 (largest)
while (!maxHeap.isEmpty()) {
  System.out.print(maxHeap.poll() + " "); // 10 7 2
}`,
  minHeapFromScratch: `class MinHeap {
  private final List<Integer> h = new ArrayList<>();

  void offer(int x) {
    h.add(x);
    int i = h.size() - 1;
    while (i > 0) {
      int p = (i - 1) / 2;
      if (h.get(p) <= h.get(i)) break;
      swap(i, p);
      i = p;
    }
  }

  int poll() {
    if (h.isEmpty()) throw new RuntimeException("Heap empty");
    int ans = h.get(0);
    int last = h.remove(h.size() - 1);
    if (!h.isEmpty()) {
      h.set(0, last);
      heapifyDown(0);
    }
    return ans;
  }

  int peek() {
    if (h.isEmpty()) throw new RuntimeException("Heap empty");
    return h.get(0);
  }

  private void heapifyDown(int i) {
    int n = h.size();
    while (true) {
      int l = i * 2 + 1, r = i * 2 + 2, best = i;
      if (l < n && h.get(l) < h.get(best)) best = l;
      if (r < n && h.get(r) < h.get(best)) best = r;
      if (best == i) break;
      swap(i, best);
      i = best;
    }
  }

  private void swap(int i, int j) {
    int t = h.get(i); h.set(i, h.get(j)); h.set(j, t);
  }
}`,
  maxHeapFromScratch: `class MaxHeap {
  private final List<Integer> h = new ArrayList<>();

  void offer(int x) {
    h.add(x);
    int i = h.size() - 1;
    while (i > 0) {
      int p = (i - 1) / 2;
      if (h.get(p) >= h.get(i)) break;
      swap(i, p);
      i = p;
    }
  }

  int poll() {
    if (h.isEmpty()) throw new RuntimeException("Heap empty");
    int ans = h.get(0);
    int last = h.remove(h.size() - 1);
    if (!h.isEmpty()) {
      h.set(0, last);
      heapifyDown(0);
    }
    return ans;
  }

  int peek() {
    if (h.isEmpty()) throw new RuntimeException("Heap empty");
    return h.get(0);
  }

  private void heapifyDown(int i) {
    int n = h.size();
    while (true) {
      int l = i * 2 + 1, r = i * 2 + 2, best = i;
      if (l < n && h.get(l) > h.get(best)) best = l;
      if (r < n && h.get(r) > h.get(best)) best = r;
      if (best == i) break;
      swap(i, best);
      i = best;
    }
  }

  private void swap(int i, int j) {
    int t = h.get(i); h.set(i, h.get(j)); h.set(j, t);
  }
}`,
  hashMap: `Map<String, Integer> freq = new HashMap<>();
freq.put("apple", 1);
freq.merge("apple", 1, Integer::sum);
int count = freq.getOrDefault("apple", 0);`,
  hashMapInternals: `// HashMap internals in Java (JDK 8+):
// Capacity is power of 2, default 16, loadFactor default 0.75.
//
// put(key, value):
// 1) hash = spread(key.hashCode())  // mixes high bits to reduce collisions
// 2) index = (table.length - 1) & hash
// 3) If bucket empty -> place node directly.
// 4) Else walk bucket:
//    - same key found -> overwrite value
//    - otherwise append/insert in bucket structure
// 5) size++ ; if size > threshold (capacity * loadFactor) -> resize (x2)
// 6) During resize, nodes are re-distributed to new buckets.
//
// get(key):
// 1) Compute same hash + index.
// 2) Scan bucket and compare hash + equals(key).
// 3) Return value or null.
//
// Collision handling:
// - starts as linked list in bucket
// - if bucket gets too long and table is sufficiently large, bucket may treeify
//   into a red-black tree for better worst-case lookup.
//
// Typical complexity:
// - put/get/remove: O(1) average
// - worst-case: O(n), improved in heavy-collision scenarios via treeified buckets.`,
  linkedHashMap: `Map<Integer, String> map = new LinkedHashMap<>();
map.put(3, "C");
map.put(1, "A");
map.put(2, "B");
for (int key : map.keySet()) {
    System.out.println(key); // 3, 1, 2
}`,
  treeMap: `TreeMap<Integer, String> tm = new TreeMap<>();
tm.put(30, "C");
tm.put(10, "A");
tm.put(20, "B");
System.out.println(tm.floorKey(25)); // 20`,
  hashSet: `Set<String> seen = new HashSet<>();
seen.add("a");
seen.add("b");
boolean hasA = seen.contains("a");`,
  linkedHashSet: `Set<Integer> set = new LinkedHashSet<>();
set.add(5);
set.add(1);
set.add(5);
System.out.println(set); // [5, 1]`,
  treeSet: `TreeSet<Integer> ts = new TreeSet<>();
ts.add(10);
ts.add(4);
ts.add(8);
System.out.println(ts.ceiling(7)); // 8`,
  concurrentHashMap: `ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();
map.put("k", 1);
map.compute("k", (k, v) -> v == null ? 1 : v + 1);`,
  binarySearch: `int binarySearch(int[] a, int target) {
    int l = 0, r = a.length - 1;
    while (l <= r) {
        int m = l + (r - l) / 2;
        if (a[m] == target) return m;
        if (a[m] < target) l = m + 1;
        else r = m - 1;
    }
    return -1;
}`,
  lowerBound: `int lowerBound(int[] a, int target) {
  int l = 0, r = a.length; // [l, r)
  while (l < r) {
    int m = l + (r - l) / 2;
    if (a[m] < target) l = m + 1;
    else r = m;
  }
  return l; // first index with a[i] >= target
}`,
  upperBound: `int upperBound(int[] a, int target) {
  int l = 0, r = a.length; // [l, r)
  while (l < r) {
    int m = l + (r - l) / 2;
    if (a[m] <= target) l = m + 1;
    else r = m;
  }
  return l; // first index with a[i] > target
}`,
  firstLastPosition: `int[] searchRange(int[] a, int target) {
  int left = lowerBound(a, target);
  int right = upperBound(a, target) - 1;
  if (left >= a.length || a[left] != target) return new int[]{-1, -1};
  return new int[]{left, right};
}`,
  rotatedArraySearch: `int searchRotated(int[] a, int target) {
  int l = 0, r = a.length - 1;
  while (l <= r) {
    int m = l + (r - l) / 2;
    if (a[m] == target) return m;
    if (a[l] <= a[m]) { // left sorted
      if (a[l] <= target && target < a[m]) r = m - 1;
      else l = m + 1;
    } else { // right sorted
      if (a[m] < target && target <= a[r]) l = m + 1;
      else r = m - 1;
    }
  }
  return -1;
}`,
  peakElement: `int findPeakElement(int[] a) {
  int l = 0, r = a.length - 1;
  while (l < r) {
    int m = l + (r - l) / 2;
    if (a[m] < a[m + 1]) l = m + 1;
    else r = m;
  }
  return l;
}`,
  linearSearch: `int linearSearch(int[] a, int target) {
    for (int i = 0; i < a.length; i++) {
        if (a[i] == target) return i;
    }
    return -1;
}`,
  quickSort: `void quickSort(int[] a, int l, int r) {
    if (l >= r) return;
    int p = partition(a, l, r);
    quickSort(a, l, p - 1);
    quickSort(a, p + 1, r);
}
int partition(int[] a, int l, int r) {
    int pivot = a[r], i = l;
    for (int j = l; j < r; j++) {
        if (a[j] <= pivot) {
            int t = a[i]; a[i] = a[j]; a[j] = t;
            i++;
        }
    }
    int t = a[i]; a[i] = a[r]; a[r] = t;
    return i;
}`,
  mergeSort: `void mergeSort(int[] a, int l, int r) {
    if (l >= r) return;
    int m = l + (r - l) / 2;
    mergeSort(a, l, m);
    mergeSort(a, m + 1, r);
    merge(a, l, m, r);
}`,
  insertionSort: `void insertionSort(int[] a) {
    for (int i = 1; i < a.length; i++) {
        int key = a[i], j = i - 1;
        while (j >= 0 && a[j] > key) {
            a[j + 1] = a[j];
            j--;
        }
        a[j + 1] = key;
    }
}`,
  countingSort: `int[] countingSort(int[] a, int maxVal) {
    int[] cnt = new int[maxVal + 1];
    for (int x : a) cnt[x]++;
    int idx = 0;
    int[] out = new int[a.length];
    for (int v = 0; v <= maxVal; v++) {
        while (cnt[v]-- > 0) out[idx++] = v;
    }
    return out;
}`,
  bfsShortestPath: `int shortestPath(int n, List<List<Integer>> g, int src, int dst) {
    int[] dist = new int[n];
    Arrays.fill(dist, -1);
    Queue<Integer> q = new ArrayDeque<>();
    q.offer(src);
    dist[src] = 0;
    while (!q.isEmpty()) {
        int u = q.poll();
        for (int v : g.get(u)) {
            if (dist[v] == -1) {
                dist[v] = dist[u] + 1;
                q.offer(v);
            }
        }
    }
    return dist[dst];
}`,
  dijkstra: `int[] dijkstra(int n, List<List<int[]>> g, int src) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;
    PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[1]));
    pq.offer(new int[]{src, 0});
    while (!pq.isEmpty()) {
      int[] cur = pq.poll();
      int u = cur[0], d = cur[1];
      if (d != dist[u]) continue;
      for (int[] e : g.get(u)) {
        int v = e[0], w = e[1];
        if (dist[v] > d + w) {
          dist[v] = d + w;
          pq.offer(new int[]{v, dist[v]});
        }
      }
    }
    return dist;
}`,
  bellmanFord: `int[] bellmanFord(int n, int[][] edges, int src) {
    int INF = 1_000_000_000;
    int[] dist = new int[n];
    Arrays.fill(dist, INF);
    dist[src] = 0;
    for (int i = 1; i < n; i++) {
      for (int[] e : edges) {
        int u = e[0], v = e[1], w = e[2];
        if (dist[u] != INF && dist[v] > dist[u] + w) {
          dist[v] = dist[u] + w;
        }
      }
    }
    return dist;
}`,
  kmp: `int[] lps(String p) {
    int[] lps = new int[p.length()];
    for (int i = 1, len = 0; i < p.length();) {
      if (p.charAt(i) == p.charAt(len)) lps[i++] = ++len;
      else if (len > 0) len = lps[len - 1];
      else i++;
    }
    return lps;
}`,
  topDownDp: `Map<String, Integer> memo = new HashMap<>();
int solve(int i, int remain, int[] a) {
    if (remain == 0) return 1;
    if (i == a.length || remain < 0) return 0;
    String key = i + "#" + remain;
    if (memo.containsKey(key)) return memo.get(key);
    int ans = solve(i + 1, remain, a) + solve(i + 1, remain - a[i], a);
    memo.put(key, ans);
    return ans;
}`,
  fenwick: `class Fenwick {
  int[] bit;
  Fenwick(int n) { bit = new int[n + 1]; }
  void add(int idx, int delta) {
    for (idx++; idx < bit.length; idx += idx & -idx) bit[idx] += delta;
  }
  int sum(int idx) {
    int s = 0;
    for (idx++; idx > 0; idx -= idx & -idx) s += bit[idx];
    return s;
  }
}`,
  slidingWindow: `int longestOnes(int[] nums, int k) {
  int left = 0, zeros = 0, best = 0;
  for (int right = 0; right < nums.length; right++) {
    if (nums[right] == 0) zeros++;
    while (zeros > k) {
      if (nums[left++] == 0) zeros--;
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
}`,
  twoPointers: `int[] twoSumSorted(int[] a, int target) {
  int l = 0, r = a.length - 1;
  while (l < r) {
    int sum = a[l] + a[r];
    if (sum == target) return new int[]{l, r};
    if (sum < target) l++;
    else r--;
  }
  return new int[]{-1, -1};
}`,
  fastSlow: `ListNode detectCycle(ListNode head) {
  ListNode slow = head, fast = head;
  while (fast != null && fast.next != null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow == fast) {
      ListNode p = head;
      while (p != slow) {
        p = p.next;
        slow = slow.next;
      }
      return p;
    }
  }
  return null;
}`,
  swFixedSize: `double[] maxAvgInFixedWindow(int[] a, int k) {
  if (a.length < k) return new double[0];
  long sum = 0;
  for (int i = 0; i < k; i++) sum += a[i];
  List<Double> out = new ArrayList<>();
  out.add(sum * 1.0 / k);
  for (int r = k; r < a.length; r++) {
    sum += a[r] - a[r - k];
    out.add(sum * 1.0 / k);
  }
  return out.stream().mapToDouble(d -> d).toArray();
}`,
  swAtMostKDistinct: `int longestAtMostKDistinct(int[] a, int k) {
  Map<Integer, Integer> freq = new HashMap<>();
  int l = 0, best = 0;
  for (int r = 0; r < a.length; r++) {
    freq.put(a[r], freq.getOrDefault(a[r], 0) + 1);
    while (freq.size() > k) {
      int c = freq.get(a[l]) - 1;
      if (c == 0) freq.remove(a[l]);
      else freq.put(a[l], c);
      l++;
    }
    best = Math.max(best, r - l + 1);
  }
  return best;
}`,
  swExactlyKDistinct: `int countExactlyKDistinct(int[] a, int k) {
  return countAtMost(a, k) - countAtMost(a, k - 1);
}
int countAtMost(int[] a, int k) {
  Map<Integer, Integer> freq = new HashMap<>();
  int l = 0, ans = 0;
  for (int r = 0; r < a.length; r++) {
    freq.put(a[r], freq.getOrDefault(a[r], 0) + 1);
    while (freq.size() > k) {
      int c = freq.get(a[l]) - 1;
      if (c == 0) freq.remove(a[l]);
      else freq.put(a[l], c);
      l++;
    }
    ans += r - l + 1;
  }
  return ans;
}`,
  swAnagramFrequency: `List<Integer> findAnagrams(String s, String p) {
  int[] need = new int[26], win = new int[26];
  for (char c : p.toCharArray()) need[c - 'a']++;
  List<Integer> ans = new ArrayList<>();
  int k = p.length();
  for (int r = 0; r < s.length(); r++) {
    win[s.charAt(r) - 'a']++;
    if (r >= k) win[s.charAt(r - k) - 'a']--;
    if (r + 1 >= k && Arrays.equals(need, win)) ans.add(r - k + 1);
  }
  return ans;
}`,
  swMonotonicDeque: `int[] maxSlidingWindow(int[] a, int k) {
  Deque<Integer> dq = new ArrayDeque<>(); // indices, decreasing values
  int[] out = new int[a.length - k + 1];
  for (int r = 0; r < a.length; r++) {
    while (!dq.isEmpty() && dq.peekFirst() <= r - k) dq.pollFirst();
    while (!dq.isEmpty() && a[dq.peekLast()] <= a[r]) dq.pollLast();
    dq.offerLast(r);
    if (r >= k - 1) out[r - k + 1] = a[dq.peekFirst()];
  }
  return out;
}`,
  tpOppositeEnds: `int[] twoSumSorted(int[] a, int target) {
  int l = 0, r = a.length - 1;
  while (l < r) {
    int sum = a[l] + a[r];
    if (sum == target) return new int[]{l, r};
    if (sum < target) l++;
    else r--;
  }
  return new int[]{-1, -1};
}`,
  tpDutchFlag: `void sortColors(int[] a) {
  int low = 0, mid = 0, high = a.length - 1;
  while (mid <= high) {
    if (a[mid] == 0) {
      int t = a[low]; a[low++] = a[mid]; a[mid++] = t;
    } else if (a[mid] == 1) mid++;
    else {
      int t = a[mid]; a[mid] = a[high]; a[high--] = t;
    }
  }
}`,
  tpMergeIntersection: `List<Integer> intersection(int[] a, int[] b) {
  int i = 0, j = 0;
  List<Integer> out = new ArrayList<>();
  while (i < a.length && j < b.length) {
    if (a[i] == b[j]) {
      if (out.isEmpty() || out.get(out.size() - 1) != a[i]) out.add(a[i]);
      i++; j++;
    } else if (a[i] < b[j]) i++;
    else j++;
  }
  return out;
}`,
  tpKSumReduction: `List<List<Integer>> threeSum(int[] a) {
  Arrays.sort(a);
  List<List<Integer>> ans = new ArrayList<>();
  for (int i = 0; i < a.length; i++) {
    if (i > 0 && a[i] == a[i - 1]) continue;
    int l = i + 1, r = a.length - 1;
    while (l < r) {
      int sum = a[i] + a[l] + a[r];
      if (sum == 0) {
        ans.add(Arrays.asList(a[i], a[l], a[r]));
        while (l < r && a[l] == a[l + 1]) l++;
        while (l < r && a[r] == a[r - 1]) r--;
        l++; r--;
      } else if (sum < 0) l++;
      else r--;
    }
  }
  return ans;
}`,
  graphDfsComponents: `int countComponents(int n, List<List<Integer>> g) {
  boolean[] vis = new boolean[n];
  int comps = 0;
  for (int i = 0; i < n; i++) {
    if (vis[i]) continue;
    comps++;
    Deque<Integer> st = new ArrayDeque<>();
    st.push(i); vis[i] = true;
    while (!st.isEmpty()) {
      int u = st.pop();
      for (int v : g.get(u)) {
        if (!vis[v]) { vis[v] = true; st.push(v); }
      }
    }
  }
  return comps;
}`,
  graphMultiSourceBfs: `int[][] nearestZero(int[][] grid) {
  int n = grid.length, m = grid[0].length;
  int[][] dist = new int[n][m];
  for (int[] row : dist) Arrays.fill(row, -1);
  Queue<int[]> q = new ArrayDeque<>();
  for (int i = 0; i < n; i++) {
    for (int j = 0; j < m; j++) {
      if (grid[i][j] == 0) { dist[i][j] = 0; q.offer(new int[]{i, j}); }
    }
  }
  int[][] d = {{1,0},{-1,0},{0,1},{0,-1}};
  while (!q.isEmpty()) {
    int[] cur = q.poll();
    for (int[] mv : d) {
      int nr = cur[0] + mv[0], nc = cur[1] + mv[1];
      if (nr >= 0 && nr < n && nc >= 0 && nc < m && dist[nr][nc] == -1) {
        dist[nr][nc] = dist[cur[0]][cur[1]] + 1;
        q.offer(new int[]{nr, nc});
      }
    }
  }
  return dist;
}`,
  graphTopoKahn: `List<Integer> topoSort(int n, List<List<Integer>> g, int[] indeg) {
  Queue<Integer> q = new ArrayDeque<>();
  for (int i = 0; i < n; i++) if (indeg[i] == 0) q.offer(i);
  List<Integer> order = new ArrayList<>();
  while (!q.isEmpty()) {
    int u = q.poll();
    order.add(u);
    for (int v : g.get(u)) if (--indeg[v] == 0) q.offer(v);
  }
  return order.size() == n ? order : List.of(); // empty means cycle
}`,
  graphCycleDfsDirected: `boolean hasCycle(int n, List<List<Integer>> g) {
  int[] state = new int[n]; // 0=unseen,1=visiting,2=done
  for (int i = 0; i < n; i++) if (state[i] == 0 && dfs(i, g, state)) return true;
  return false;
}
boolean dfs(int u, List<List<Integer>> g, int[] state) {
  state[u] = 1;
  for (int v : g.get(u)) {
    if (state[v] == 1) return true;
    if (state[v] == 0 && dfs(v, g, state)) return true;
  }
  state[u] = 2;
  return false;
}`,
  graphBipartiteBfs: `boolean isBipartite(int n, List<List<Integer>> g) {
  int[] color = new int[n];
  Arrays.fill(color, -1);
  for (int s = 0; s < n; s++) {
    if (color[s] != -1) continue;
    Queue<Integer> q = new ArrayDeque<>();
    q.offer(s); color[s] = 0;
    while (!q.isEmpty()) {
      int u = q.poll();
      for (int v : g.get(u)) {
        if (color[v] == -1) { color[v] = color[u] ^ 1; q.offer(v); }
        else if (color[v] == color[u]) return false;
      }
    }
  }
  return true;
}`,
  graphZeroOneBfs: `int[] zeroOneBfs(int n, List<List<int[]>> g, int src) {
  int INF = 1_000_000_000;
  int[] dist = new int[n];
  Arrays.fill(dist, INF);
  Deque<Integer> dq = new ArrayDeque<>();
  dist[src] = 0; dq.offerFirst(src);
  while (!dq.isEmpty()) {
    int u = dq.pollFirst();
    for (int[] e : g.get(u)) {
      int v = e[0], w = e[1]; // w is 0 or 1
      if (dist[v] > dist[u] + w) {
        dist[v] = dist[u] + w;
        if (w == 0) dq.offerFirst(v); else dq.offerLast(v);
      }
    }
  }
  return dist;
}`,
  graphFloodFill: `void floodFill(int[][] grid, int sr, int sc, int newColor) {
  int old = grid[sr][sc];
  if (old == newColor) return;
  int n = grid.length, m = grid[0].length;
  Queue<int[]> q = new ArrayDeque<>();
  q.offer(new int[]{sr, sc});
  grid[sr][sc] = newColor;
  int[][] d = {{1,0},{-1,0},{0,1},{0,-1}};
  while (!q.isEmpty()) {
    int[] cur = q.poll();
    for (int[] mv : d) {
      int nr = cur[0] + mv[0], nc = cur[1] + mv[1];
      if (nr >= 0 && nr < n && nc >= 0 && nc < m && grid[nr][nc] == old) {
        grid[nr][nc] = newColor;
        q.offer(new int[]{nr, nc});
      }
    }
  }
}`,
  segmentTree: `class SegmentTree {
  int n;
  long[] tree, lazy;
  SegmentTree(int[] a) {
    n = a.length;
    tree = new long[4 * n];
    lazy = new long[4 * n];
    build(1, 0, n - 1, a);
  }
  void build(int p, int l, int r, int[] a) {
    if (l == r) { tree[p] = a[l]; return; }
    int m = (l + r) >>> 1;
    build(p << 1, l, m, a);
    build(p << 1 | 1, m + 1, r, a);
    tree[p] = tree[p << 1] + tree[p << 1 | 1];
  }
  void push(int p, int l, int r) {
    if (lazy[p] == 0 || l == r) return;
    int m = (l + r) >>> 1;
    apply(p << 1, l, m, lazy[p]);
    apply(p << 1 | 1, m + 1, r, lazy[p]);
    lazy[p] = 0;
  }
  void apply(int p, int l, int r, long add) {
    tree[p] += (r - l + 1L) * add;
    lazy[p] += add;
  }
}`,
  sparseTable: `class SparseTableMin {
  int n, LOG;
  int[][] st;
  int[] lg;
  SparseTableMin(int[] a) {
    n = a.length;
    LOG = 32 - Integer.numberOfLeadingZeros(n);
    st = new int[LOG][n];
    lg = new int[n + 1];
    for (int i = 2; i <= n; i++) lg[i] = lg[i >> 1] + 1;
    System.arraycopy(a, 0, st[0], 0, n);
    for (int k = 1; k < LOG; k++) {
      for (int i = 0; i + (1 << k) <= n; i++) {
        st[k][i] = Math.min(st[k - 1][i], st[k - 1][i + (1 << (k - 1))]);
      }
    }
  }
  int rangeMin(int l, int r) {
    int k = lg[r - l + 1];
    return Math.min(st[k][l], st[k][r - (1 << k) + 1]);
  }
}`,
  orderedMultisetTreeMap: `class OrderedMultiset {
  private final TreeMap<Integer, Integer> cnt = new TreeMap<>();
  void add(int x) { cnt.put(x, cnt.getOrDefault(x, 0) + 1); }
  void removeOne(int x) {
    Integer c = cnt.get(x);
    if (c == null) return;
    if (c == 1) cnt.remove(x);
    else cnt.put(x, c - 1);
  }
  Integer floor(int x) { return cnt.floorKey(x); }
  Integer ceil(int x) { return cnt.ceilingKey(x); }
  int sizeDistinct() { return cnt.size(); }
}`,
  graphRepresentations: `int n = 5;
List<List<Integer>> adj = new ArrayList<>();
for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
int[][] edges = {{0,1},{1,2},{2,3}};
for (int[] e : edges) {
  adj.get(e[0]).add(e[1]);
  adj.get(e[1]).add(e[0]); // remove for directed graph
}
int[][] matrix = new int[n][n];
for (int[] e : edges) {
  matrix[e[0]][e[1]] = 1;
  matrix[e[1]][e[0]] = 1;
}`,
  twoHeapsMedian: `class MedianFinder {
  PriorityQueue<Integer> lo = new PriorityQueue<>(Comparator.reverseOrder()); // max-heap
  PriorityQueue<Integer> hi = new PriorityQueue<>(); // min-heap
  void addNum(int x) {
    if (lo.isEmpty() || x <= lo.peek()) lo.offer(x);
    else hi.offer(x);
    if (lo.size() > hi.size() + 1) hi.offer(lo.poll());
    if (hi.size() > lo.size()) lo.offer(hi.poll());
  }
  double findMedian() {
    if (lo.size() == hi.size()) return (lo.peek() + hi.peek()) / 2.0;
    return lo.peek();
  }
}`,
  binarySearchAnswer: `int minCapacity(int[] w, int days) {
  int lo = Arrays.stream(w).max().getAsInt();
  int hi = Arrays.stream(w).sum();
  while (lo < hi) {
    int mid = lo + (hi - lo) / 2;
    if (canShip(w, days, mid)) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}`,
  prefixSumHash: `int subarraySum(int[] nums, int k) {
  Map<Integer, Integer> count = new HashMap<>();
  count.put(0, 1);
  int sum = 0, ans = 0;
  for (int x : nums) {
    sum += x;
    ans += count.getOrDefault(sum - k, 0);
    count.put(sum, count.getOrDefault(sum, 0) + 1);
  }
  return ans;
}`,
  monoStack: `int[] nextGreater(int[] a) {
  int n = a.length;
  int[] ans = new int[n];
  Arrays.fill(ans, -1);
  Deque<Integer> st = new ArrayDeque<>();
  for (int i = 0; i < n; i++) {
    while (!st.isEmpty() && a[st.peek()] < a[i]) {
      ans[st.pop()] = a[i];
    }
    st.push(i);
  }
  return ans;
}`,
  heapTopK: `int[] topKFrequent(int[] nums, int k) {
  Map<Integer, Integer> freq = new HashMap<>();
  for (int x : nums) freq.merge(x, 1, Integer::sum);
  PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);
  for (var e : freq.entrySet()) {
    pq.offer(new int[]{e.getKey(), e.getValue()});
    if (pq.size() > k) pq.poll();
  }
  int[] out = new int[k];
  for (int i = k - 1; i >= 0; i--) out[i] = pq.poll()[0];
  return out;
}`,
  dfsBacktrack: `void permute(int[] nums, boolean[] used, List<Integer> path, List<List<Integer>> ans) {
  if (path.size() == nums.length) {
    ans.add(new ArrayList<>(path));
    return;
  }
  for (int i = 0; i < nums.length; i++) {
    if (used[i]) continue;
    used[i] = true;
    path.add(nums[i]);
    permute(nums, used, path, ans);
    path.remove(path.size() - 1);
    used[i] = false;
  }
}`,
  unionFind: `class DSU {
  int[] p, sz;
  DSU(int n) {
    p = new int[n];
    sz = new int[n];
    for (int i = 0; i < n; i++) { p[i] = i; sz[i] = 1; }
  }
  int find(int x) { return p[x] == x ? x : (p[x] = find(p[x])); }
  boolean union(int a, int b) {
    a = find(a); b = find(b);
    if (a == b) return false;
    if (sz[a] < sz[b]) { int t = a; a = b; b = t; }
    p[b] = a; sz[a] += sz[b];
    return true;
  }
}`,
  bfsGrid: `int bfsGrid(int[][] g, int sr, int sc) {
  int n = g.length, m = g[0].length;
  int[][] dist = new int[n][m];
  for (int[] row : dist) Arrays.fill(row, -1);
  Queue<int[]> q = new ArrayDeque<>();
  q.offer(new int[]{sr, sc});
  dist[sr][sc] = 0;
  int[][] d = {{1,0},{-1,0},{0,1},{0,-1}};
  while (!q.isEmpty()) {
    int[] cur = q.poll();
    for (int[] mv : d) {
      int nr = cur[0] + mv[0], nc = cur[1] + mv[1];
      if (nr >= 0 && nr < n && nc >= 0 && nc < m && dist[nr][nc] == -1) {
        dist[nr][nc] = dist[cur[0]][cur[1]] + 1;
        q.offer(new int[]{nr, nc});
      }
    }
  }
  return dist[n - 1][m - 1];
}`,
  dpTabulation: `int coinChange(int[] coins, int amount) {
  int INF = amount + 1;
  int[] dp = new int[amount + 1];
  Arrays.fill(dp, INF);
  dp[0] = 0;
  for (int a = 1; a <= amount; a++) {
    for (int c : coins) {
      if (a - c >= 0) dp[a] = Math.min(dp[a], dp[a - c] + 1);
    }
  }
  return dp[amount] == INF ? -1 : dp[amount];
}`,
  greedyIntervals: `int eraseOverlapIntervals(int[][] intervals) {
  Arrays.sort(intervals, Comparator.comparingInt(a -> a[1]));
  int keep = 0, end = Integer.MIN_VALUE;
  for (int[] in : intervals) {
    if (in[0] >= end) {
      keep++;
      end = in[1];
    }
  }
  return intervals.length - keep;
}`,
  dpLinear1d: `int climbStairs(int n) {
  if (n <= 2) return n;
  int prev2 = 1, prev1 = 2;
  for (int i = 3; i <= n; i++) {
    int cur = prev1 + prev2;
    prev2 = prev1;
    prev1 = cur;
  }
  return prev1;
}`,
  dpGrid2d: `int minPathSum(int[][] grid) {
  int n = grid.length, m = grid[0].length;
  int[][] dp = new int[n][m];
  dp[0][0] = grid[0][0];
  for (int i = 1; i < n; i++) dp[i][0] = dp[i - 1][0] + grid[i][0];
  for (int j = 1; j < m; j++) dp[0][j] = dp[0][j - 1] + grid[0][j];
  for (int i = 1; i < n; i++) {
    for (int j = 1; j < m; j++) {
      dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1]) + grid[i][j];
    }
  }
  return dp[n - 1][m - 1];
}`,
  dpLcs2d: `int lcs(String a, String b) {
  int n = a.length(), m = b.length();
  int[][] dp = new int[n + 1][m + 1];
  for (int i = 1; i <= n; i++) {
    for (int j = 1; j <= m; j++) {
      if (a.charAt(i - 1) == b.charAt(j - 1)) dp[i][j] = 1 + dp[i - 1][j - 1];
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[n][m];
}`,
  dpKnapsack01: `int knapsack01(int[] wt, int[] val, int cap) {
  int[] dp = new int[cap + 1];
  for (int i = 0; i < wt.length; i++) {
    for (int w = cap; w >= wt[i]; w--) {
      dp[w] = Math.max(dp[w], val[i] + dp[w - wt[i]]);
    }
  }
  return dp[cap];
}`,
  dpPartition: `int minCutPalindrome(String s) {
  int n = s.length();
  boolean[][] pal = new boolean[n][n];
  int[] cut = new int[n];
  for (int i = 0; i < n; i++) {
    cut[i] = i;
    for (int j = 0; j <= i; j++) {
      if (s.charAt(i) == s.charAt(j) && (i - j < 2 || pal[j + 1][i - 1])) {
        pal[j][i] = true;
        cut[i] = j == 0 ? 0 : Math.min(cut[i], cut[j - 1] + 1);
      }
    }
  }
  return cut[n - 1];
}`,
  dpInterval: `int burstBalloons(int[] nums) {
  int n = nums.length;
  int[] a = new int[n + 2];
  a[0] = a[n + 1] = 1;
  for (int i = 0; i < n; i++) a[i + 1] = nums[i];
  int[][] dp = new int[n + 2][n + 2];
  for (int len = 2; len <= n + 1; len++) {
    for (int l = 0; l + len <= n + 1; l++) {
      int r = l + len;
      for (int k = l + 1; k < r; k++) {
        dp[l][r] = Math.max(dp[l][r], dp[l][k] + dp[k][r] + a[l] * a[k] * a[r]);
      }
    }
  }
  return dp[0][n + 1];
}`,
  dpLisBinary: `int lis(int[] nums) {
  List<Integer> tails = new ArrayList<>();
  for (int x : nums) {
    int i = Collections.binarySearch(tails, x);
    if (i < 0) i = -i - 1;
    if (i == tails.size()) tails.add(x);
    else tails.set(i, x);
  }
  return tails.size();
}`,
  dpBitmask: `int tsp(int[][] dist) {
  int n = dist.length, INF = 1_000_000_000;
  int[][] dp = new int[1 << n][n];
  for (int[] row : dp) Arrays.fill(row, INF);
  dp[1][0] = 0;
  for (int mask = 1; mask < (1 << n); mask++) {
    for (int u = 0; u < n; u++) if ((mask & (1 << u)) != 0) {
      for (int v = 0; v < n; v++) if ((mask & (1 << v)) == 0) {
        int next = mask | (1 << v);
        dp[next][v] = Math.min(dp[next][v], dp[mask][u] + dist[u][v]);
      }
    }
  }
  int all = (1 << n) - 1, ans = INF;
  for (int u = 0; u < n; u++) ans = Math.min(ans, dp[all][u] + dist[u][0]);
  return ans;
}`,
  dpDigit: `long countNoAdjEqual(long x) {
  char[] d = String.valueOf(x).toCharArray();
  Map<String, Long> memo = new HashMap<>();
  return dfs(0, 10, true, false, d, memo);
}
long dfs(int idx, int prev, boolean tight, boolean started, char[] d, Map<String, Long> memo) {
  if (idx == d.length) return 1;
  String key = idx + "|" + prev + "|" + tight + "|" + started;
  if (!tight && memo.containsKey(key)) return memo.get(key);
  int lim = tight ? d[idx] - '0' : 9;
  long ans = 0;
  for (int dig = 0; dig <= lim; dig++) {
    boolean ns = started || dig != 0;
    if (started && ns && dig == prev) continue;
    ans += dfs(idx + 1, ns ? dig : 10, tight && dig == lim, ns, d, memo);
  }
  if (!tight) memo.put(key, ans);
  return ans;
}`,
  dpTree: `int[] dfsTree(int u, int p, List<List<Integer>> g, int[] val) {
  int include = val[u], exclude = 0;
  for (int v : g.get(u)) if (v != p) {
    int[] ch = dfsTree(v, u, g, val);
    include += ch[1];
    exclude += Math.max(ch[0], ch[1]);
  }
  return new int[]{include, exclude};
}`,
  dpRerooting: `void dfsDown(int u, int p, List<List<Integer>> g, int[] sub, int[] depthSum) {
  sub[u] = 1;
  for (int v : g.get(u)) if (v != p) {
    dfsDown(v, u, g, sub, depthSum);
    sub[u] += sub[v];
    depthSum[u] += depthSum[v] + sub[v];
  }
}
void dfsUp(int u, int p, List<List<Integer>> g, int n, int[] sub, int[] ans) {
  for (int v : g.get(u)) if (v != p) {
    ans[v] = ans[u] - sub[v] + (n - sub[v]);
    dfsUp(v, u, g, n, sub, ans);
  }
}`,
  dpDag: `int longestPathDag(int n, List<List<Integer>> g, int[] indeg) {
  Queue<Integer> q = new ArrayDeque<>();
  int[] dp = new int[n];
  for (int i = 0; i < n; i++) if (indeg[i] == 0) q.offer(i);
  while (!q.isEmpty()) {
    int u = q.poll();
    for (int v : g.get(u)) {
      dp[v] = Math.max(dp[v], dp[u] + 1);
      if (--indeg[v] == 0) q.offer(v);
    }
  }
  int best = 0;
  for (int x : dp) best = Math.max(best, x);
  return best;
}`,
  dpStateMachine: `int maxProfitWithCooldown(int[] p) {
  int hold = Integer.MIN_VALUE, sold = 0, rest = 0;
  for (int x : p) {
    int prevSold = sold;
    sold = hold + x;
    hold = Math.max(hold, rest - x);
    rest = Math.max(rest, prevSold);
  }
  return Math.max(sold, rest);
}`,
  dpExpectedValue: `double expectedRolls(int n) {
  double[] e = new double[n + 1];
  for (int i = n - 1; i >= 0; i--) {
    double sum = 0;
    for (int d = 1; d <= 6; d++) sum += e[Math.min(n, i + d)];
    e[i] = 1 + sum / 6.0;
  }
  return e[0];
}`,
  dpGame: `int stoneGameDiff(int[] a) {
  int n = a.length;
  int[][] dp = new int[n][n];
  for (int i = 0; i < n; i++) dp[i][i] = a[i];
  for (int len = 2; len <= n; len++) {
    for (int l = 0; l + len - 1 < n; l++) {
      int r = l + len - 1;
      dp[l][r] = Math.max(a[l] - dp[l + 1][r], a[r] - dp[l][r - 1]);
    }
  }
  return dp[0][n - 1];
}`,
  dpMonotonicQueue: `int constrainedSubsetSum(int[] nums, int k) {
  Deque<Integer> dq = new ArrayDeque<>();
  int[] dp = new int[nums.length];
  int ans = Integer.MIN_VALUE;
  for (int i = 0; i < nums.length; i++) {
    if (!dq.isEmpty() && dq.peekFirst() < i - k) dq.pollFirst();
    dp[i] = nums[i] + Math.max(0, dq.isEmpty() ? 0 : dp[dq.peekFirst()]);
    while (!dq.isEmpty() && dp[dq.peekLast()] <= dp[i]) dq.pollLast();
    dq.offerLast(i);
    ans = Math.max(ans, dp[i]);
  }
  return ans;
}`,
  trie: `class TrieNode {
  TrieNode[] next = new TrieNode[26];
  boolean isWord;
}
class Trie {
  private final TrieNode root = new TrieNode();
  void insert(String word) {
    TrieNode cur = root;
    for (char ch : word.toCharArray()) {
      int i = ch - 'a';
      if (cur.next[i] == null) cur.next[i] = new TrieNode();
      cur = cur.next[i];
    }
    cur.isWord = true;
  }
  boolean search(String word) {
    TrieNode node = walk(word);
    return node != null && node.isWord;
  }
  boolean startsWith(String prefix) {
    return walk(prefix) != null;
  }
  private TrieNode walk(String s) {
    TrieNode cur = root;
    for (char ch : s.toCharArray()) {
      int i = ch - 'a';
      if (cur.next[i] == null) return null;
      cur = cur.next[i];
    }
    return cur;
  }
}`,
  redBlackTreeConcept: `TreeMap<Integer, String> map = new TreeMap<>();
map.put(30, "C");
map.put(10, "A");
map.put(20, "B");
System.out.println(map.firstKey());   // 10
System.out.println(map.floorKey(25)); // 20

// TreeMap/TreeSet in Java are Red-Black Tree based.`,
  redBlackTreeHowItWorks: `// Red-Black Tree properties:
// 1) Every node is RED or BLACK.
// 2) Root is BLACK.
// 3) All null leaves are BLACK.
// 4) Red node cannot have red child.
// 5) Every path from node -> null leaf has same black height.
//
// Why it stays balanced:
// - Insert/delete starts as BST operation.
// - Then rotations + recoloring restore properties.
// - Height remains O(log n), so get/put/remove are O(log n).
//
// Java usage points:
// - TreeMap: ordered key-value map.
// - TreeSet: ordered unique keys.
// - Supports floor/ceiling/lower/higher/range views.`,
  redBlackTreeFromScratch: `class RedBlackTree {
  private static final boolean RED = true, BLACK = false;
  static class Node {
    int key;
    boolean color = RED;
    Node left, right, parent;
    Node(int key) { this.key = key; }
  }

  private Node root;

  public void insert(int key) {
    Node z = new Node(key), y = null, x = root;
    while (x != null) {
      y = x;
      if (z.key < x.key) x = x.left;
      else if (z.key > x.key) x = x.right;
      else return; // ignore duplicate
    }
    z.parent = y;
    if (y == null) root = z;
    else if (z.key < y.key) y.left = z;
    else y.right = z;
    fixInsert(z);
  }

  public boolean contains(int key) {
    Node cur = root;
    while (cur != null) {
      if (key == cur.key) return true;
      cur = key < cur.key ? cur.left : cur.right;
    }
    return false;
  }

  private void rotateLeft(Node x) {
    Node y = x.right;
    x.right = y.left;
    if (y.left != null) y.left.parent = x;
    y.parent = x.parent;
    if (x.parent == null) root = y;
    else if (x == x.parent.left) x.parent.left = y;
    else x.parent.right = y;
    y.left = x;
    x.parent = y;
  }

  private void rotateRight(Node x) {
    Node y = x.left;
    x.left = y.right;
    if (y.right != null) y.right.parent = x;
    y.parent = x.parent;
    if (x.parent == null) root = y;
    else if (x == x.parent.right) x.parent.right = y;
    else x.parent.left = y;
    y.right = x;
    x.parent = y;
  }

  private void fixInsert(Node z) {
    while (z.parent != null && z.parent.color == RED) {
      Node gp = z.parent.parent;
      if (z.parent == gp.left) {
        Node uncle = gp.right;
        if (uncle != null && uncle.color == RED) {
          z.parent.color = BLACK;
          uncle.color = BLACK;
          gp.color = RED;
          z = gp;
        } else {
          if (z == z.parent.right) {
            z = z.parent;
            rotateLeft(z);
          }
          z.parent.color = BLACK;
          gp.color = RED;
          rotateRight(gp);
        }
      } else {
        Node uncle = gp.left;
        if (uncle != null && uncle.color == RED) {
          z.parent.color = BLACK;
          uncle.color = BLACK;
          gp.color = RED;
          z = gp;
        } else {
          if (z == z.parent.left) {
            z = z.parent;
            rotateRight(z);
          }
          z.parent.color = BLACK;
          gp.color = RED;
          rotateLeft(gp);
        }
      }
    }
    root.color = BLACK;
  }

  // Optional helpers to show ordering
  public Integer floor(int key) {
    Node cur = root, ans = null;
    while (cur != null) {
      if (cur.key == key) return key;
      if (cur.key < key) { ans = cur; cur = cur.right; }
      else cur = cur.left;
    }
    return ans == null ? null : ans.key;
  }

  public Integer ceiling(int key) {
    Node cur = root, ans = null;
    while (cur != null) {
      if (cur.key == key) return key;
      if (cur.key > key) { ans = cur; cur = cur.left; }
      else cur = cur.right;
    }
    return ans == null ? null : ans.key;
  }
}`,
  gcdLcm: `long gcd(long a, long b) {
  while (b != 0) {
    long t = a % b;
    a = b;
    b = t;
  }
  return Math.abs(a);
}
long lcm(long a, long b) {
  return Math.abs(a / gcd(a, b) * b);
}`,
  extendedEuclid: `long[] egcd(long a, long b) {
  if (b == 0) return new long[]{a, 1, 0};
  long[] r = egcd(b, a % b);
  long g = r[0], x1 = r[1], y1 = r[2];
  return new long[]{g, y1, x1 - (a / b) * y1};
}
// returns [gcd, x, y] with ax + by = gcd(a,b)`,
  modPow: `long modPow(long a, long e, long mod) {
  long res = 1 % mod;
  a %= mod;
  while (e > 0) {
    if ((e & 1) == 1) res = (res * a) % mod;
    a = (a * a) % mod;
    e >>= 1;
  }
  return res;
}`,
  modInverseFermat: `long modInvPrime(long a, long p) {
  // p must be prime and a % p != 0
  return modPow(a, p - 2, p);
}`,
  sieve: `int n = 1_000_000;
boolean[] isPrime = new boolean[n + 1];
Arrays.fill(isPrime, true);
isPrime[0] = isPrime[1] = false;
for (int i = 2; i * i <= n; i++) {
  if (isPrime[i]) {
    for (int j = i * i; j <= n; j += i) isPrime[j] = false;
  }
}`,
  primeFactorization: `Map<Long, Integer> factorize(long x) {
  Map<Long, Integer> f = new LinkedHashMap<>();
  for (long p = 2; p * p <= x; p++) {
    while (x % p == 0) {
      f.put(p, f.getOrDefault(p, 0) + 1);
      x /= p;
    }
  }
  if (x > 1) f.put(x, f.getOrDefault(x, 0) + 1);
  return f;
}`,
  nCrModPrime: `long nCrModPrime(int n, int r, long mod) {
  if (r < 0 || r > n) return 0;
  long[] fact = new long[n + 1];
  fact[0] = 1;
  for (int i = 1; i <= n; i++) fact[i] = (fact[i - 1] * i) % mod;
  long num = fact[n];
  long den = (fact[r] * fact[n - r]) % mod;
  return (num * modPow(den, mod - 2, mod)) % mod;
}`,
  matrixExpoFib: `long fib(long n, long mod) {
  if (n == 0) return 0;
  long[][] base = {{1, 1}, {1, 0}};
  long[][] res = {{1, 0}, {0, 1}};
  while (n > 0) {
    if ((n & 1) == 1) res = mul(res, base, mod);
    base = mul(base, base, mod);
    n >>= 1;
  }
  return res[0][1];
}`,
  geometryOrientation: `long cross(long ax, long ay, long bx, long by, long cx, long cy) {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}
int orientation(long ax, long ay, long bx, long by, long cx, long cy) {
  long c = cross(ax, ay, bx, by, cx, cy);
  if (c == 0) return 0;      // collinear
  return c > 0 ? 1 : -1;     // 1: ccw, -1: cw
}`,
  bitMath: `boolean isPowerOfTwo(int x) {
  return x > 0 && (x & (x - 1)) == 0;
}
int pop = Integer.bitCount(mask); // number of set bits
int lowBit = x & -x;              // lowest set bit`,
  bitBasicsOps: `int setBit(int x, int i) { return x | (1 << i); }
int clearBit(int x, int i) { return x & ~(1 << i); }
int toggleBit(int x, int i) { return x ^ (1 << i); }
boolean isSet(int x, int i) { return ((x >> i) & 1) == 1; }`,
  bitUniqueWithXor: `int singleNumber(int[] a) {
  int x = 0;
  for (int v : a) x ^= v;
  return x;
}
// If every element appears twice except one.`,
  bitTwoUniques: `int[] twoSingles(int[] a) {
  int xr = 0;
  for (int v : a) xr ^= v;
  int diff = xr & -xr; // rightmost set bit
  int p = 0, q = 0;
  for (int v : a) {
    if ((v & diff) == 0) p ^= v;
    else q ^= v;
  }
  return new int[]{p, q};
}`,
  bitSubmaskIteration: `for (int sub = mask; sub > 0; sub = (sub - 1) & mask) {
  // process each non-empty submask of mask
}
// include empty: handle separately`,
  bitSupersetDp: `int n = 1 << k;
for (int bit = 0; bit < k; bit++) {
  for (int mask = 0; mask < n; mask++) {
    if ((mask & (1 << bit)) != 0) {
      f[mask] += f[mask ^ (1 << bit)];
    }
  }
}
// SOS DP: aggregate over submasks`,
  bitCountBits: `int[] countBits(int n) {
  int[] dp = new int[n + 1];
  for (int i = 1; i <= n; i++) dp[i] = dp[i >> 1] + (i & 1);
  return dp;
}`,
  bitPowerChecks: `boolean isPowerOfTwo(int x) {
  return x > 0 && (x & (x - 1)) == 0;
}
boolean isPowerOfFour(int x) {
  return x > 0 && (x & (x - 1)) == 0 && (x & 0x55555555) != 0;
}`,
  bitTrieMaxXor: `class Node { Node[] ch = new Node[2]; }
int maxXorPair(int[] a) {
  Node root = new Node();
  int ans = 0;
  for (int x : a) {
    Node cur = root;
    for (int b = 31; b >= 0; b--) {
      int bit = (x >> b) & 1;
      if (cur.ch[bit] == null) cur.ch[bit] = new Node();
      cur = cur.ch[bit];
    }
  }
  for (int x : a) {
    Node cur = root;
    int val = 0;
    for (int b = 31; b >= 0; b--) {
      int bit = (x >> b) & 1, want = bit ^ 1;
      if (cur.ch[want] != null) { val |= (1 << b); cur = cur.ch[want]; }
      else cur = cur.ch[bit];
    }
    ans = Math.max(ans, val);
  }
  return ans;
}`,
  bitAndRange: `int rangeBitwiseAnd(int left, int right) {
  int shift = 0;
  while (left < right) {
    left >>= 1;
    right >>= 1;
    shift++;
  }
  return left << shift;
}`,
  prefixSumMath: `long[] pref = new long[a.length + 1];
for (int i = 0; i < a.length; i++) pref[i + 1] = pref[i] + a[i];
long rangeSum(int l, int r) { // inclusive
  return pref[r + 1] - pref[l];
}`,
  inclusionExclusion: `long countDivBy2Or3Or5(long n) {
  long a = n / 2 + n / 3 + n / 5;
  long b = n / 6 + n / 10 + n / 15;
  long c = n / 30;
  return a - b + c;
}`,
  expectedValueDice: `double expectedRollsToReachN(int n) {
  double[] dp = new double[n + 1];
  for (int i = n - 1; i >= 0; i--) {
    double sum = 0;
    for (int d = 1; d <= 6; d++) sum += dp[Math.min(n, i + d)];
    dp[i] = 1 + sum / 6.0;
  }
  return dp[0];
}`,
};

const DP_CODE_VARIANTS = {
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

const DP_INTERACTIVE_STEPS = {
  linear1d: [
    { title: "Input", note: "n = 6 (climb stairs)", view: "dp[1]=1, dp[2]=2" },
    { title: "i = 3", note: "dp[3] = dp[2] + dp[1] = 3", view: "[1,2,3]" },
    { title: "i = 4", note: "dp[4] = 5", view: "[1,2,3,5]" },
    { title: "i = 5", note: "dp[5] = 8", view: "[1,2,3,5,8]" },
    { title: "i = 6", note: "dp[6] = 13", view: "[1,2,3,5,8,13]" },
  ],
  grid2d: [
    { title: "Grid", note: "Costs", view: "1 3 1\n1 5 1\n4 2 1" },
    { title: "Init first row/col", note: "Only one path to these cells", view: "1 4 5\n2 . .\n6 . ." },
    { title: "Fill (1,1), (1,2)", note: "min(top,left)+cost", view: "1 4 5\n2 7 6\n6 . ." },
    { title: "Fill last row", note: "Continue same transition", view: "1 4 5\n2 7 6\n6 8 7" },
    { title: "Answer", note: "dp[2][2] = 7", view: "Minimum path sum is 7" },
  ],
  knapsack: [
    { title: "Items", note: "wt=[1,3,4], val=[15,20,30], cap=4", view: "Start dp=[0,0,0,0,0]" },
    { title: "After item (1,15)", note: "Reverse iterate cap", view: "[0,15,15,15,15]" },
    { title: "After item (3,20)", note: "Update dp[3],dp[4]", view: "[0,15,15,20,35]" },
    { title: "After item (4,30)", note: "Compare with existing best", view: "[0,15,15,20,35]" },
    { title: "Answer", note: "Best value at cap=4", view: "35" },
  ],
  lcs: [
    { title: "Strings", note: "a = \"abcde\", b = \"ace\"", view: "DP size = 6 x 4" },
    { title: "Match a", note: "a == a -> dp[1][1]=1", view: "1 . .\n. . .\n. . ." },
    { title: "Match c", note: "c == c -> carry +1", view: "1 . .\n1 1 .\n1 2 ." },
    { title: "Match e", note: "e == e -> final growth", view: "...\n...\n1 2 3" },
    { title: "Answer", note: "LCS length = 3", view: "\"ace\"" },
  ],
};

function getCodeVariants(result) {
  if (result.codeVariants && result.codeVariants.length) return result.codeVariants;
  if (result.name.startsWith("DP Variation:")) {
    const known = DP_CODE_VARIANTS[result.name];
    if (known) return known;
    return [
      {
        title: "1) Recursive (plain)",
        code: `// Recursive idea for ${result.name}
// Define state, recurse over choices, combine subproblems.`,
      },
      {
        title: "2) Memoization + recursion (top-down)",
        code: `// Top-down memoized version
// Cache by state key and reuse overlapping subproblems.`,
      },
      {
        title: "3) Iterative DP (bottom-up)",
        code: result.javaCode,
      },
    ];
  }
  return [{ title: "Java", code: result.javaCode }];
}

const JAVA_KEYWORDS = new Set([
  "abstract",
  "assert",
  "boolean",
  "break",
  "byte",
  "case",
  "catch",
  "char",
  "class",
  "const",
  "continue",
  "default",
  "do",
  "double",
  "else",
  "enum",
  "extends",
  "final",
  "finally",
  "float",
  "for",
  "if",
  "implements",
  "import",
  "instanceof",
  "int",
  "interface",
  "long",
  "native",
  "new",
  "package",
  "private",
  "protected",
  "public",
  "return",
  "short",
  "static",
  "strictfp",
  "super",
  "switch",
  "synchronized",
  "this",
  "throw",
  "throws",
  "transient",
  "try",
  "void",
  "volatile",
  "while",
  "var",
  "true",
  "false",
  "null",
]);

function classifyToken(token) {
  if (/^\s+$/.test(token)) return "space";
  if (/^\/\/.*$/.test(token)) return "comment";
  if (/^".*"$/.test(token) || /^'.*'$/.test(token)) return "string";
  if (/^\d+(_\d+)*(\.\d+)?$/.test(token)) return "number";
  if (/^[()[\]{}.,;]$/.test(token)) return "punct";
  if (/^[+\-*/%=&|!<>^?:]+$/.test(token)) return "operator";
  if (JAVA_KEYWORDS.has(token)) return "keyword";
  if (/^[A-Z][A-Za-z0-9_]*$/.test(token)) return "type";
  if (/^[a-zA-Z_][A-Za-z0-9_]*$/.test(token)) return "ident";
  return "plain";
}

function renderHighlightedCode(code) {
  const lines = code.split("\n");
  const tokenRe = /(\/\/.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b\d+(?:_\d+)*(?:\.\d+)?\b|[A-Za-z_][A-Za-z0-9_]*|\s+|[()[\]{}.,;]|[+\-*/%=&|!<>^?:]+)/g;
  return lines.map((line, lineIdx) => {
    const tokens = line.match(tokenRe) || [line];
    return (
      <div className="code-line" key={`line-${lineIdx}`}>
        <span className="code-content">
          {tokens.map((tok, tokIdx) => (
            <span key={`tok-${lineIdx}-${tokIdx}`} className={`tok tok-${classifyToken(tok)}`}>
              {tok}
            </span>
          ))}
        </span>
      </div>
    );
  });
}

const DATA_STRUCTURE_TREE = {
  id: "ds-root",
  icon: "🧱",
  question: "Pick a data structure to revise",
  options: [
    {
      label: "ArrayList",
      result: {
        name: "ArrayList",
        pkg: "java.util.ArrayList",
        whenToUse: "Use when reads by index dominate and inserts are mostly at the end.",
        why: "Contiguous memory gives excellent cache locality and O(1) index access.",
        complexity: { get: "O(1)", append: "O(1) amortized", insertMid: "O(n)", removeMid: "O(n)" },
        tradeoffs: "Middle inserts/deletes shift elements; pre-size if capacity growth is predictable.",
        javaCode: JAVA_SNIPPETS.arrayList,
        color: "#22c55e",
      },
    },
    {
      label: "LinkedList (Deque API)",
      result: {
        name: "LinkedList (Deque API)",
        pkg: "java.util.LinkedList",
        whenToUse: "Use when head/tail updates are far more common than random indexing.",
        why: "Doubly linked nodes allow O(1) endpoint operations.",
        complexity: { addFirst: "O(1)", addLast: "O(1)", getIndex: "O(n)", removeMiddle: "O(n)" },
        tradeoffs: "Poor locality and extra memory per node; often slower than ArrayDeque in practice.",
        javaCode: JAVA_SNIPPETS.linkedList,
        color: "#16a34a",
      },
    },
    {
      label: "Array (int[] / T[])",
      result: {
        name: "Array (int[] / T[])",
        pkg: "built-in",
        whenToUse: "Use when size is known and stable, especially for primitives.",
        why: "Lowest overhead and direct memory layout.",
        complexity: { readWriteIndex: "O(1)", search: "O(n)", binarySearchSorted: "O(log n)" },
        tradeoffs: "No dynamic resizing; manual copy needed for growth.",
        javaCode: `int[] a = new int[5];
a[0] = 10;
int x = a[0];
Arrays.sort(a);
int pos = Arrays.binarySearch(a, 10);`,
        color: "#65a30d",
      },
    },
    {
      label: "HashMap",
      result: {
        name: "HashMap",
        pkg: "java.util.HashMap",
        whenToUse: "Use for standard dictionary/frequency tasks with average O(1) operations.",
        why: "Hash buckets make get/put/remove very fast with good hash distribution.",
        complexity: { get: "O(1) avg", put: "O(1) avg", remove: "O(1) avg", iterate: "O(n)" },
        tradeoffs: "No deterministic order; poor hashCode can degrade performance.",
        codeVariants: [
          { title: "Java usage", code: JAVA_SNIPPETS.hashMap },
          { title: "How HashMap works (Java internals)", code: JAVA_SNIPPETS.hashMapInternals },
        ],
        javaCode: JAVA_SNIPPETS.hashMap,
        color: "#3b82f6",
      },
    },
    {
      label: "LinkedHashMap",
      result: {
        name: "LinkedHashMap",
        pkg: "java.util.LinkedHashMap",
        whenToUse: "Use when hash-map speed is needed and iteration must follow insertion/access order.",
        why: "Hash table + doubly linked entry list preserves deterministic order.",
        complexity: { get: "O(1) avg", put: "O(1) avg", remove: "O(1) avg", iterateOrder: "O(n)" },
        tradeoffs: "Extra pointer overhead vs HashMap.",
        javaCode: JAVA_SNIPPETS.linkedHashMap,
        color: "#0ea5e9",
      },
    },
    {
      label: "TreeMap",
      result: {
        name: "TreeMap",
        pkg: "java.util.TreeMap",
        whenToUse: "Use when floor/ceiling/range queries or sorted iteration is required.",
        why: "Balanced tree keeps keys ordered and supports navigable operations.",
        complexity: { get: "O(log n)", put: "O(log n)", floorKey: "O(log n)", iterateSorted: "O(n)" },
        tradeoffs: "Slower constants than HashMap for plain lookup.",
        javaCode: JAVA_SNIPPETS.treeMap,
        color: "#ef4444",
      },
    },
    {
      label: "HashSet",
      result: {
        name: "HashSet",
        pkg: "java.util.HashSet",
        whenToUse: "Use for deduplication and membership checks where order is irrelevant.",
        why: "Backed by hash table for average O(1) contains/add/remove.",
        complexity: { add: "O(1) avg", contains: "O(1) avg", remove: "O(1) avg", iterate: "O(n)" },
        tradeoffs: "No stable order.",
        javaCode: JAVA_SNIPPETS.hashSet,
        color: "#2563eb",
      },
    },
    {
      label: "LinkedHashSet",
      result: {
        name: "LinkedHashSet",
        pkg: "java.util.LinkedHashSet",
        whenToUse: "Use when uniqueness and insertion-order iteration both matter.",
        why: "Hash-based set with linked iteration order.",
        complexity: { add: "O(1) avg", contains: "O(1) avg", iterateInOrder: "O(n)" },
        tradeoffs: "Slightly more memory than HashSet.",
        javaCode: JAVA_SNIPPETS.linkedHashSet,
        color: "#0891b2",
      },
    },
    {
      label: "TreeSet",
      result: {
        name: "TreeSet",
        pkg: "java.util.TreeSet",
        whenToUse: "Use when you need sorted unique elements and nearest-neighbor queries.",
        why: "Balanced tree supports sorted operations efficiently.",
        complexity: { add: "O(log n)", contains: "O(log n)", ceiling: "O(log n)", iterateSorted: "O(n)" },
        tradeoffs: "Higher operation cost than hash-based sets.",
        javaCode: JAVA_SNIPPETS.treeSet,
        color: "#dc2626",
      },
    },
    {
      label: "Stack",
      result: {
        name: "Stack",
        pkg: "ArrayDeque / Stack / LinkedList / Custom Array",
        whenToUse: "Use for LIFO workflows: DFS, expression parsing, monotonic stack, undo/backtracking.",
        why: "Last pushed item is popped first, which naturally models nested decisions and reversals.",
        complexity: { push: "O(1) amortized", pop: "O(1)", peek: "O(1)" },
        tradeoffs: "Prefer ArrayDeque in modern Java; legacy Stack is synchronized and usually slower.",
        codeVariants: [
          { title: "Recommended (ArrayDeque)", code: JAVA_SNIPPETS.arrayDequeStack },
          { title: "All Java ways", code: JAVA_SNIPPETS.stackWaysJava },
          { title: "From scratch implementation", code: JAVA_SNIPPETS.stackFromScratch },
        ],
        javaCode: JAVA_SNIPPETS.arrayDequeStack,
        color: "#f59e0b",
      },
    },
    {
      label: "Queue",
      result: {
        name: "Queue",
        pkg: "ArrayDeque / LinkedList / PriorityQueue / Custom Circular Array",
        whenToUse: "Use for FIFO workflows: BFS levels, task scheduling, buffering, and event pipelines.",
        why: "First inserted element leaves first, matching arrival-order processing.",
        complexity: { offer: "O(1) amortized", poll: "O(1)", peek: "O(1)" },
        tradeoffs: "Use ArrayDeque for normal FIFO; PriorityQueue is not FIFO and serves different semantics.",
        codeVariants: [
          { title: "Recommended (ArrayDeque)", code: JAVA_SNIPPETS.arrayDequeQueue },
          { title: "All Java ways", code: JAVA_SNIPPETS.queueWaysJava },
          { title: "From scratch implementation", code: JAVA_SNIPPETS.queueFromScratch },
        ],
        javaCode: JAVA_SNIPPETS.arrayDequeQueue,
        color: "#f59e0b",
      },
    },
    {
      label: "PriorityQueue",
      result: {
        name: "PriorityQueue",
        pkg: "java.util.PriorityQueue",
        whenToUse: "Use for top-K queries, scheduling by priority, Dijkstra, and stream processing where repeated best-element extraction is needed.",
        why: "Binary heap keeps root as best candidate (min by default), making push/pop logarithmic.",
        complexity: { offer: "O(log n)", poll: "O(log n)", peek: "O(1)" },
        tradeoffs:
          "Java PriorityQueue is a MinHeap by default. For MaxHeap use Comparator.reverseOrder(). No indexed random access; arbitrary remove/contains are O(n).",
        codeVariants: [
          { title: "PriorityQueue basics", code: JAVA_SNIPPETS.priorityQueue },
          { title: "MinHeap (default)", code: JAVA_SNIPPETS.priorityQueueMinHeap },
          { title: "MaxHeap (reverse comparator)", code: JAVA_SNIPPETS.priorityQueueMaxHeap },
          { title: "MinHeap from scratch", code: JAVA_SNIPPETS.minHeapFromScratch },
          { title: "MaxHeap from scratch", code: JAVA_SNIPPETS.maxHeapFromScratch },
        ],
        javaCode: JAVA_SNIPPETS.priorityQueue,
        color: "#8b5cf6",
      },
    },
    {
      label: "Trie",
      result: {
        name: "Trie",
        pkg: "Custom trie (prefix tree)",
        whenToUse: "Use for dictionary prefix queries, autocomplete, and word search problems.",
        why: "Character-by-character branching gives fast prefix operations independent of total words.",
        complexity: { insert: "O(L)", search: "O(L)", startsWith: "O(L)", space: "O(total characters)" },
        tradeoffs: "Memory-heavy for sparse alphabets; use map-based nodes if alphabet is large.",
        javaCode: JAVA_SNIPPETS.trie,
        color: "#0ea5e9",
      },
    },
    {
      label: "Red-Black Tree (via TreeMap/TreeSet)",
      result: {
        name: "Red-Black Tree (via TreeMap/TreeSet)",
        pkg: "java.util.TreeMap / java.util.TreeSet",
        whenToUse:
          "Use when order-aware operations are mandatory: floor/ceiling/lower/higher, rank-like boundary queries, sorted iteration, and range slices/submaps. Typical use cases: interval scheduling, nearest neighbor on sorted keys, time-ordered event indexing, sweep-line problems, leaderboards with ordered keys, and any dynamic set/map where both updates and ordered queries are frequent.",
        why: "Red-Black Tree maintains near-perfect balance through recoloring and rotations after updates, guaranteeing O(log n) height while preserving BST order semantics.",
        complexity: { put: "O(log n)", get: "O(log n)", remove: "O(log n)", rangeOps: "O(log n) + output" },
        tradeoffs:
          "Higher constants and memory than hash tables; if you only need exact lookup, HashMap/HashSet is usually faster. But when sorted order and predecessor/successor queries are required, RBT-backed structures are one of the best general-purpose choices.",
        codeVariants: [
          { title: "Java TreeMap/TreeSet usage", code: JAVA_SNIPPETS.redBlackTreeConcept },
          { title: "How Red-Black Tree works", code: JAVA_SNIPPETS.redBlackTreeHowItWorks },
          { title: "From-scratch Java implementation", code: JAVA_SNIPPETS.redBlackTreeFromScratch },
        ],
        javaCode: JAVA_SNIPPETS.redBlackTreeConcept,
        color: "#ef4444",
      },
    },
    {
      label: "Union-Find (Disjoint Set Union)",
      result: {
        name: "Union-Find (Disjoint Set Union)",
        pkg: "Custom DSU",
        whenToUse: "Use for connected components, cycle detection in undirected graphs, Kruskal MST.",
        why: "Path compression + union by size keeps operations near constant amortized.",
        complexity: { findUnion: "O(alpha(n)) amortized", space: "O(n)" },
        tradeoffs: "Great for connectivity but not for shortest path or path reconstruction.",
        javaCode: JAVA_SNIPPETS.unionFind,
        color: "#22c55e",
      },
    },
    {
      label: "Fenwick Tree (BIT)",
      result: {
        name: "Fenwick Tree (BIT)",
        pkg: "Custom BIT",
        whenToUse: "Use when you need many updates and prefix/range sums on numeric arrays.",
        why: "Bitwise index jumps compress segment coverage into logarithmic updates/queries.",
        complexity: { update: "O(log n)", prefixSum: "O(log n)", rangeSum: "O(log n)", space: "O(n)" },
        tradeoffs: "Less expressive than segment tree for min/max or custom merge operations.",
        javaCode: JAVA_SNIPPETS.fenwick,
        color: "#8b5cf6",
      },
    },
    {
      label: "Segment Tree",
      result: {
        name: "Segment Tree",
        pkg: "Custom Range Query Tree",
        whenToUse: "Use when you need fast range queries (sum/min/max) and updates on mutable arrays.",
        why: "Hierarchical interval decomposition supports query/update in logarithmic time.",
        complexity: { build: "O(n)", pointUpdate: "O(log n)", rangeQuery: "O(log n)", rangeUpdateLazy: "O(log n)" },
        tradeoffs: "More code and memory (about 4n); easy to make boundary/lazy bugs.",
        javaCode: JAVA_SNIPPETS.segmentTree,
        color: "#7c3aed",
      },
    },
    {
      label: "Sparse Table",
      result: {
        name: "Sparse Table",
        pkg: "Static Range Query Structure",
        whenToUse: "Use when array is immutable and you need many idempotent range queries (min/max/gcd).",
        why: "Precomputed powers-of-two blocks answer queries in O(1) for RMQ-style operations.",
        complexity: { preprocess: "O(n log n)", queryRMQ: "O(1)", update: "Not supported efficiently" },
        tradeoffs: "Not suitable for frequent updates; rebuild required after changes.",
        javaCode: JAVA_SNIPPETS.sparseTable,
        color: "#6d28d9",
      },
    },
    {
      label: "Deque / Monotonic Queue",
      result: {
        name: "Deque / Monotonic Queue",
        pkg: "ArrayDeque Pattern",
        whenToUse: "Use for sliding-window max/min and constrained DP where stale/weak candidates must be evicted.",
        why: "Deque maintains useful candidates in monotonic order with O(1) amortized updates.",
        complexity: { pushPop: "O(1) amortized", windowQuery: "O(1)", totalForN: "O(n)" },
        tradeoffs: "Must store indices and expire out-of-window elements correctly.",
        javaCode: JAVA_SNIPPETS.swMonotonicDeque,
        color: "#0f766e",
      },
    },
    {
      label: "Ordered Multiset via TreeMap",
      result: {
        name: "Ordered Multiset (TreeMap)",
        pkg: "java.util.TreeMap + counts",
        whenToUse: "Use when duplicates matter and you need ordered operations like floor/ceiling/range by value.",
        why: "TreeMap keeps sorted keys while counts emulate multiset behavior.",
        complexity: { addRemove: "O(log n)", floorCeil: "O(log n)", iterateSorted: "O(n)" },
        tradeoffs: "More verbose than C++ multiset; no direct order-statistics rank/select.",
        javaCode: JAVA_SNIPPETS.orderedMultisetTreeMap,
        color: "#be123c",
      },
    },
    {
      label: "Graph Representations",
      result: {
        name: "Graph Representations",
        pkg: "Adjacency List / Matrix / Edge List",
        whenToUse: "Use adjacency list for sparse graphs, matrix for dense/small graphs, edge list for sorting/DSU workflows.",
        why: "Choosing the right representation directly affects memory, traversal speed, and algorithm fit.",
        complexity: { adjListSpace: "O(V+E)", matrixSpace: "O(V^2)", neighborIterAdjList: "O(deg(v))", edgeLookupMatrix: "O(1)" },
        tradeoffs: "Wrong representation can make good algorithm appear slow.",
        javaCode: JAVA_SNIPPETS.graphRepresentations,
        color: "#0ea5e9",
      },
    },
    {
      label: "Two Heaps (Median DS)",
      result: {
        name: "Two Heaps (Median DS)",
        pkg: "Dual PriorityQueue",
        whenToUse: "Use when numbers stream in and median must be queried repeatedly online.",
        why: "Max-heap for lower half + min-heap for upper half keeps middle split balanced.",
        complexity: { addNum: "O(log n)", findMedian: "O(1)", space: "O(n)" },
        tradeoffs: "Need strict rebalance invariants; deletions are non-trivial without lazy removal maps.",
        javaCode: JAVA_SNIPPETS.twoHeapsMedian,
        color: "#9333ea",
      },
    },
    {
      label: "ConcurrentHashMap",
      result: {
        name: "ConcurrentHashMap",
        pkg: "java.util.concurrent.ConcurrentHashMap",
        whenToUse: "Use when many threads read/write shared key-value state.",
        why: "Designed for high concurrency with non-blocking reads and scalable updates.",
        complexity: { get: "O(1) avg", put: "O(1) avg", compute: "O(1) avg" },
        tradeoffs: "More complexity than HashMap; avoid when single-threaded.",
        javaCode: JAVA_SNIPPETS.concurrentHashMap,
        color: "#ec4899",
      },
    },
  ],
};

const ALGORITHM_TREE = {
  id: "algo-root",
  icon: "🧠",
  question: "What type of problem are you solving?",
  options: [
    {
      label: "Search in data",
      next: {
        id: "algo-search",
        icon: "🔎",
        question: "Is the input already sorted?",
        options: [
          {
            label: "Yes",
            next: {
              id: "algo-binary-search-variants",
              icon: "🧪",
              question: "Pick the binary search variation",
              options: [
                {
                  label: "Classic exact match",
                  result: {
                    name: "Binary Search",
                    pkg: "Search / Divide and Conquer",
                    whenToUse: "Use when answer space or array is monotonic/sorted and exact value is needed.",
                    why: "Halves search space each step.",
                    complexity: { time: "O(log n)", space: "O(1)" },
                    tradeoffs: "Requires sorted/monotonic property.",
                    javaCode: JAVA_SNIPPETS.binarySearch,
                    color: "#0ea5e9",
                  },
                },
                {
                  label: "First/last occurrence",
                  result: {
                    name: "Lower Bound / Upper Bound",
                    pkg: "Search / Divide and Conquer",
                    whenToUse: "Use when duplicates exist and you need first or last index.",
                    why: "Bound searches cleanly locate range borders.",
                    complexity: { each_bound: "O(log n)", combined: "O(log n)", space: "O(1)" },
                    tradeoffs: "Boundary convention mistakes are common.",
                    codeVariants: [
                      { title: "Lower bound", code: JAVA_SNIPPETS.lowerBound },
                      { title: "Upper bound", code: JAVA_SNIPPETS.upperBound },
                      { title: "First/last range", code: JAVA_SNIPPETS.firstLastPosition },
                    ],
                    javaCode: JAVA_SNIPPETS.lowerBound,
                    color: "#0ea5e9",
                  },
                },
                {
                  label: "Rotated sorted array",
                  result: {
                    name: "Search in Rotated Sorted Array",
                    pkg: "Search / Divide and Conquer",
                    whenToUse: "Use when array is sorted then rotated, and you need target index.",
                    why: "One side is always sorted; use that invariant to discard half.",
                    complexity: { time: "O(log n)", space: "O(1)" },
                    tradeoffs: "With many duplicates, worst-case may degrade.",
                    javaCode: JAVA_SNIPPETS.rotatedArraySearch,
                    color: "#0ea5e9",
                  },
                },
                {
                  label: "Peak / mountain style",
                  result: {
                    name: "Peak Element Binary Search",
                    pkg: "Search / Divide and Conquer",
                    whenToUse: "Use when local slope information can guide toward peak/transition.",
                    why: "Comparing adjacent elements reveals direction to answer.",
                    complexity: { time: "O(log n)", space: "O(1)" },
                    tradeoffs: "Depends on guaranteed structural property (peak/bitonic pattern).",
                    javaCode: JAVA_SNIPPETS.peakElement,
                    color: "#0ea5e9",
                  },
                },
                {
                  label: "Binary search on answer",
                  result: {
                    name: "Binary Search on Answer",
                    pkg: "Optimization via Feasibility",
                    whenToUse: "Use when feasibility is monotonic over numeric answer space.",
                    why: "Transforms optimization into yes/no boundary search.",
                    complexity: { time: "O(log range * checkCost)", space: "O(1)" },
                    tradeoffs: "Need a correct monotonic predicate.",
                    javaCode: JAVA_SNIPPETS.binarySearchAnswer,
                    color: "#0ea5e9",
                  },
                },
              ],
            },
          },
          {
            label: "No",
            result: {
              name: "Linear Search",
              pkg: "Brute Force",
              whenToUse: "Use for tiny data, one-off scans, or unsorted arrays without preprocessing.",
              why: "Simplest and zero setup cost.",
              complexity: { time: "O(n)", space: "O(1)" },
              tradeoffs: "Slow for repeated queries.",
              javaCode: JAVA_SNIPPETS.linearSearch,
              color: "#475569",
            },
          },
        ],
      },
    },
    {
      label: "Sort data",
      next: {
        id: "algo-sort",
        icon: "🧮",
        question: "What is your strongest constraint?",
        options: [
          {
            label: "Fast average and in-place",
            result: {
              name: "Quick Sort",
              pkg: "Divide and Conquer",
              whenToUse: "Use for in-memory general sorting when average-case speed matters.",
              why: "Great cache behavior and low constant factors.",
              complexity: { avg: "O(n log n)", worst: "O(n^2)", space: "O(log n) recursion" },
              tradeoffs: "Worst case needs pivot care/randomization.",
              javaCode: JAVA_SNIPPETS.quickSort,
              color: "#f97316",
            },
          },
          {
            label: "Stable and guaranteed n log n",
            result: {
              name: "Merge Sort",
              pkg: "Divide and Conquer",
              whenToUse: "Use when stable sorting is needed or data is linked/external.",
              why: "Predictable runtime and stable merge behavior.",
              complexity: { time: "O(n log n)", extraSpace: "O(n)" },
              tradeoffs: "Needs extra memory for arrays.",
              javaCode: JAVA_SNIPPETS.mergeSort,
              color: "#f97316",
            },
          },
          {
            label: "Nearly sorted input",
            result: {
              name: "Insertion Sort",
              pkg: "Incremental Sorting",
              whenToUse: "Use on small or nearly sorted arrays.",
              why: "Moves few elements when disorder is low.",
              complexity: { best: "O(n)", avgWorst: "O(n^2)", space: "O(1)" },
              tradeoffs: "Bad for large random arrays.",
              javaCode: JAVA_SNIPPETS.insertionSort,
              color: "#f97316",
            },
          },
          {
            label: "Small integer key range",
            result: {
              name: "Counting Sort",
              pkg: "Non-comparison Sort",
              whenToUse: "Use when keys are bounded integers and range is not huge.",
              why: "Linear time with direct frequency counting.",
              complexity: { time: "O(n + k)", space: "O(k)" },
              tradeoffs: "Only for integer-like bounded keys.",
              javaCode: JAVA_SNIPPETS.countingSort,
              color: "#f97316",
            },
          },
        ],
      },
    },
    {
      label: "Graph shortest path / traversal",
      next: {
        id: "algo-graph",
        icon: "🕸️",
        question: "Which graph property applies?",
        options: [
          {
            label: "Unweighted shortest path",
            result: {
              name: "BFS",
              pkg: "Graph Traversal",
              whenToUse: "Use when each edge has equal cost (usually 1).",
              why: "Visits layers by distance from source.",
              complexity: { time: "O(V + E)", space: "O(V)" },
              tradeoffs: "Not correct for weighted edges.",
              javaCode: JAVA_SNIPPETS.bfsShortestPath,
              color: "#10b981",
            },
          },
          {
            label: "Weighted edges (non-negative)",
            result: {
              name: "Dijkstra",
              pkg: "Greedy + Priority Queue",
              whenToUse: "Use for single-source shortest path with non-negative weights.",
              why: "Always expands the current minimum tentative distance.",
              complexity: { time: "O((V+E) log V)", space: "O(V)" },
              tradeoffs: "Fails with negative edges.",
              javaCode: JAVA_SNIPPETS.dijkstra,
              color: "#10b981",
            },
          },
          {
            label: "Negative edge weights exist",
            result: {
              name: "Bellman-Ford",
              pkg: "Relaxation-based DP",
              whenToUse: "Use when graph may contain negative edges and cycle detection is needed.",
              why: "Repeated global relaxations handle negatives safely.",
              complexity: { time: "O(VE)", space: "O(V)" },
              tradeoffs: "Slower than Dijkstra on large dense graphs.",
              javaCode: JAVA_SNIPPETS.bellmanFord,
              color: "#10b981",
            },
          },
        ],
      },
    },
    {
      label: "String matching",
      result: {
        name: "KMP (Knuth-Morris-Pratt)",
        pkg: "Pattern Matching",
        whenToUse: "Use when searching a pattern in long text repeatedly with deterministic linear runtime.",
        why: "LPS table avoids re-checking matched prefix characters.",
        complexity: { preprocess: "O(m)", search: "O(n)", total: "O(n + m)" },
        tradeoffs: "More setup complexity than naive matching.",
        javaCode: JAVA_SNIPPETS.kmp,
        color: "#a855f7",
      },
    },
    {
      label: "Overlapping subproblems / optimization",
      result: {
        name: "Dynamic Programming (Top-down Memoization)",
        pkg: "DP",
        whenToUse: "Use when brute force has repeated states and optimal substructure.",
        why: "Caches state results to avoid exponential recomputation.",
        complexity: { time: "states * transitions", space: "states" },
        tradeoffs: "State design is the hardest part.",
        javaCode: JAVA_SNIPPETS.topDownDp,
        color: "#6366f1",
      },
    },
    {
      label: "Range sum with point updates",
      result: {
        name: "Fenwick Tree (BIT)",
        pkg: "Range Query Data Structure",
        whenToUse: "Use for frequent prefix/range sum queries and point updates.",
        why: "Bitwise index jumps keep updates/queries logarithmic.",
        complexity: { update: "O(log n)", prefixSum: "O(log n)", space: "O(n)" },
        tradeoffs: "Less flexible than full segment tree for complex operations.",
        javaCode: JAVA_SNIPPETS.fenwick,
        color: "#06b6d4",
      },
    },
  ],
};

const PATTERN_TREE = {
  id: "pattern-root",
  icon: "🧭",
  question: "What signal in the problem statement stands out?",
  options: [
    {
      label: "Deep dive: Dynamic Programming variations",
      next: {
        id: "pattern-dp-deep-dive",
        icon: "🧮",
        question: "Pick the DP variation you want to revise",
        options: [
          {
            label: "1D Linear DP",
            result: {
              name: "DP Variation: 1D Linear DP",
              pkg: "DP",
              whenToUse: "Use when answer at index i depends on a small number of previous indices.",
              why: "Transforms repeated recursion over prefixes into a single forward scan.",
              complexity: { states: "n", transition: "O(1)", total: "O(n)", space: "O(1) or O(n)" },
              tradeoffs: "Easy to off-by-one. Decide clearly whether dp[i] means inclusive or exclusive prefix.",
              javaCode: JAVA_SNIPPETS.dpLinear1d,
              interactiveKey: "linear1d",
              color: "#6366f1",
            },
          },
          {
            label: "2D Grid DP",
            result: {
              name: "DP Variation: 2D Grid DP",
              pkg: "DP",
              whenToUse: "Use on matrix path/count/min-cost problems with local move rules.",
              why: "Each cell reuses already-computed neighbor answers.",
              complexity: { states: "rows * cols", transition: "O(1)", total: "O(r*c)", space: "O(r*c)" },
              tradeoffs: "Initialization of first row/column is where most bugs happen.",
              javaCode: JAVA_SNIPPETS.dpGrid2d,
              interactiveKey: "grid2d",
              color: "#6366f1",
            },
          },
          {
            label: "Subsequence/String DP",
            result: {
              name: "DP Variation: Subsequence (i,j) DP",
              pkg: "DP",
              whenToUse: "Use when comparing two strings/sequences by prefixes.",
              why: "State (i,j) cleanly captures overlap between partial strings.",
              complexity: { states: "n*m", transition: "O(1)", total: "O(n*m)", space: "O(n*m)" },
              tradeoffs: "Index meaning (length vs last index) must stay consistent.",
              javaCode: JAVA_SNIPPETS.dpLcs2d,
              interactiveKey: "lcs",
              color: "#6366f1",
            },
          },
          {
            label: "Knapsack (pick/skip) DP",
            result: {
              name: "DP Variation: Knapsack Family",
              pkg: "DP",
              whenToUse: "Use when selecting items under capacity/target constraints.",
              why: "Pick/skip transitions model subset decisions exactly.",
              complexity: { states: "items*capacity", transition: "O(1)", total: "O(n*W)", space: "O(W)" },
              tradeoffs: "Loop direction differs: descending for 0/1, ascending for unbounded.",
              javaCode: JAVA_SNIPPETS.dpKnapsack01,
              interactiveKey: "knapsack",
              color: "#6366f1",
            },
          },
          {
            label: "Partition DP",
            result: {
              name: "DP Variation: Partition DP",
              pkg: "DP",
              whenToUse: "Use when splitting string/array into segments and optimizing over cuts.",
              why: "Each cut converts one big decision into two smaller solved pieces.",
              complexity: { states: "O(n) to O(n^2)", transition: "scan cut points", total: "often O(n^2)" },
              tradeoffs: "Without precomputation (like palindrome table), transitions become too slow.",
              javaCode: JAVA_SNIPPETS.dpPartition,
              color: "#6366f1",
            },
          },
          {
            label: "Interval DP",
            result: {
              name: "DP Variation: Interval [l,r] DP",
              pkg: "DP",
              whenToUse: "Use when operations happen on subarray/substrings and combine intervals.",
              why: "Length-based ordering ensures smaller intervals are ready first.",
              complexity: { states: "O(n^2)", transition: "O(n)", total: "O(n^3)", space: "O(n^2)" },
              tradeoffs: "Transition ordering by interval length is mandatory.",
              javaCode: JAVA_SNIPPETS.dpInterval,
              color: "#6366f1",
            },
          },
          {
            label: "LIS-style DP",
            result: {
              name: "DP Variation: LIS and Chains",
              pkg: "DP",
              whenToUse: "Use for longest increasing/compatible subsequence problems.",
              why: "Maintains best chain endings while preserving future extension potential.",
              complexity: { classicDp: "O(n^2)", optimized: "O(n log n)", space: "O(n)" },
              tradeoffs: "Binary-search LIS gives length; reconstruction needs parent tracking.",
              javaCode: JAVA_SNIPPETS.dpLisBinary,
              color: "#6366f1",
            },
          },
          {
            label: "Bitmask DP (subset states)",
            result: {
              name: "DP Variation: Bitmask DP",
              pkg: "DP",
              whenToUse: "Use when state is a subset over small N (typically N <= 20).",
              why: "Bit operations compactly encode visited/selected sets.",
              complexity: { states: "2^n * n", transition: "O(n)", total: "O(2^n * n^2)" },
              tradeoffs: "Explodes quickly with N; only feasible for small sets.",
              javaCode: JAVA_SNIPPETS.dpBitmask,
              color: "#6366f1",
            },
          },
          {
            label: "Digit DP (range counting)",
            result: {
              name: "DP Variation: Digit DP",
              pkg: "DP",
              whenToUse: "Use for counting numbers in [L, R] satisfying digit constraints.",
              why: "Tight/started/previous-digit states enforce number construction rules.",
              complexity: { states: "digits * stateSpace", transition: "10 per digit", total: "small constant * digits" },
              tradeoffs: "Leading-zero and tight flags are easy to get wrong.",
              javaCode: JAVA_SNIPPETS.dpDigit,
              color: "#6366f1",
            },
          },
          {
            label: "Tree DP",
            result: {
              name: "DP Variation: Tree DP",
              pkg: "DP on Trees",
              whenToUse: "Use when each node answer depends on children choices.",
              why: "DFS naturally aggregates child states to parent states.",
              complexity: { time: "O(n)", space: "O(n) recursion/arrays" },
              tradeoffs: "Need parent parameter/visited handling to avoid back-edge recursion.",
              javaCode: JAVA_SNIPPETS.dpTree,
              color: "#6366f1",
            },
          },
          {
            label: "Rerooting DP",
            result: {
              name: "DP Variation: Rerooting",
              pkg: "DP on Trees",
              whenToUse: "Use when you need an answer for every node treated as root.",
              why: "Two DFS passes reuse global information rather than recomputing from scratch.",
              complexity: { time: "O(n)", space: "O(n)" },
              tradeoffs: "Deriving child-from-parent transfer formula is the key difficulty.",
              javaCode: JAVA_SNIPPETS.dpRerooting,
              color: "#6366f1",
            },
          },
          {
            label: "DAG DP",
            result: {
              name: "DP Variation: DAG Topological DP",
              pkg: "DP on Graphs",
              whenToUse: "Use when dependencies form a directed acyclic graph.",
              why: "Topological order guarantees all prerequisite states are available.",
              complexity: { time: "O(V+E)", space: "O(V)" },
              tradeoffs: "Only valid for DAGs; cycle detection may be needed first.",
              javaCode: JAVA_SNIPPETS.dpDag,
              color: "#6366f1",
            },
          },
          {
            label: "State-machine DP",
            result: {
              name: "DP Variation: State Machine",
              pkg: "DP",
              whenToUse: "Use when each step can be in one of few modes (hold/sell/rest etc.).",
              why: "Finite states model legal transitions cleanly and avoid ad-hoc branching.",
              complexity: { time: "O(n * states)", space: "O(states)" },
              tradeoffs: "Wrong transition graph produces subtly incorrect answers.",
              javaCode: JAVA_SNIPPETS.dpStateMachine,
              color: "#6366f1",
            },
          },
          {
            label: "Expected-value DP",
            result: {
              name: "DP Variation: Probability / Expectation DP",
              pkg: "DP",
              whenToUse: "Use when asked expected moves/cost with random transitions.",
              why: "Linearity of expectation builds recurrence between states.",
              complexity: { time: "states * outcomes", space: "states" },
              tradeoffs: "Double precision and equation setup can be tricky.",
              javaCode: JAVA_SNIPPETS.dpExpectedValue,
              color: "#6366f1",
            },
          },
          {
            label: "Game DP / Minimax DP",
            result: {
              name: "DP Variation: Game DP",
              pkg: "DP + Minimax",
              whenToUse: "Use in two-player optimal-play turn-based games.",
              why: "State stores best score difference assuming optimal opponent response.",
              complexity: { states: "often O(n^2)", transition: "O(1) or O(n)", total: "problem-dependent" },
              tradeoffs: "Define dp as score-difference (not absolute score) to simplify transitions.",
              javaCode: JAVA_SNIPPETS.dpGame,
              color: "#6366f1",
            },
          },
          {
            label: "DP optimization techniques",
            result: {
              name: "DP Variation: Optimized Transitions",
              pkg: "Advanced DP",
              whenToUse: "Use when base DP is correct but too slow for constraints.",
              why: "Data structures/convexity reduce transition cost per state.",
              complexity: { examples: "Monotonic Queue, CHT, D&C optimization, Knuth optimization" },
              tradeoffs: "Requires strict mathematical conditions before applying optimization.",
              javaCode: JAVA_SNIPPETS.dpMonotonicQueue,
              color: "#6366f1",
            },
          },
          {
            label: "DP design checklist",
            result: {
              name: "DP Variation: Design Checklist",
              pkg: "DP Workflow",
              whenToUse: "Use before coding any DP to avoid wrong state/transition choices.",
              why: "A fixed checklist reduces mistakes and speeds up modeling.",
              complexity: {
                step1: "Define state",
                step2: "Write transition",
                step3: "Set base cases",
                step4: "Pick order (top-down/bottom-up)",
                step5: "Compute states*transitions",
              },
              tradeoffs: "Skipping explicit modeling often leads to bugs that look like implementation errors.",
              javaCode: `// DP checklist (pseudo-template)
// 1) State: dp[...]
// 2) Transition: dp[state] = combine(dp[substates])
// 3) Base cases
// 4) Traversal order
// 5) Complexity = #states * transitions/state`,
              color: "#6366f1",
            },
          },
        ],
      },
    },
    {
      label: "Deep dive: Sliding Window variations",
      next: {
        id: "pattern-sliding-variants",
        icon: "🪟",
        question: "Pick the sliding window variant",
        options: [
          {
            label: "Fixed-size window aggregation",
            result: {
              name: "Sliding Window Variant: Fixed Size",
              pkg: "Pattern / Sliding Window",
              whenToUse: "Use when every answer is computed over exactly k consecutive elements.",
              why: "One element enters and one leaves each step, so each move is O(1).",
              complexity: { time: "O(n)", space: "O(1)" },
              tradeoffs: "Window init and boundaries (first full window) are common bug points.",
              javaCode: JAVA_SNIPPETS.swFixedSize,
              color: "#22c55e",
            },
          },
          {
            label: "Variable-size window (at most K constraint)",
            result: {
              name: "Sliding Window Variant: At Most K",
              pkg: "Pattern / Sliding Window",
              whenToUse: "Use when window must satisfy a monotonic condition like at most K distinct/zeros.",
              why: "Two pointers maintain validity while scanning each index once.",
              complexity: { time: "O(n)", space: "O(k) or alphabet-size" },
              tradeoffs: "Must maintain exact invariant before using window length in answer.",
              javaCode: JAVA_SNIPPETS.swAtMostKDistinct,
              color: "#22c55e",
            },
          },
          {
            label: "Exactly K via at-most trick",
            result: {
              name: "Sliding Window Variant: Exactly K",
              pkg: "Pattern / Sliding Window",
              whenToUse: "Use when asked exactly K matches for a property that supports at-most counting.",
              why: "exactly(K) = atMost(K) - atMost(K-1) avoids complex direct counting.",
              complexity: { time: "O(n)", space: "O(k)" },
              tradeoffs: "Works only when at-most count is efficiently computable.",
              javaCode: JAVA_SNIPPETS.swExactlyKDistinct,
              color: "#22c55e",
            },
          },
          {
            label: "Frequency map / anagram window",
            result: {
              name: "Sliding Window Variant: Frequency Match",
              pkg: "Pattern / Sliding Window",
              whenToUse: "Use for permutation/anagram detection over fixed-length substring windows.",
              why: "Character frequency deltas update in O(1) per shift.",
              complexity: { time: "O(n * alphabet)", space: "O(alphabet)" },
              tradeoffs: "For larger alphabets, use hash maps instead of fixed arrays.",
              javaCode: JAVA_SNIPPETS.swAnagramFrequency,
              color: "#22c55e",
            },
          },
          {
            label: "Monotonic deque windows (max/min)",
            result: {
              name: "Sliding Window Variant: Monotonic Deque",
              pkg: "Pattern / Sliding Window + Deque",
              whenToUse: "Use when each window needs max/min quickly while sliding.",
              why: "Deque keeps only useful candidates in monotonic order.",
              complexity: { time: "O(n)", space: "O(k)" },
              tradeoffs: "Store indices, not values, to evict out-of-window elements correctly.",
              javaCode: JAVA_SNIPPETS.swMonotonicDeque,
              color: "#22c55e",
            },
          },
        ],
      },
    },
    {
      label: "Deep dive: Two Pointers variations",
      next: {
        id: "pattern-two-pointers-variants",
        icon: "👉",
        question: "Pick the two pointers variant",
        options: [
          {
            label: "Opposite ends on sorted data",
            result: {
              name: "Two Pointers Variant: Opposite Ends",
              pkg: "Pattern / Two Pointers",
              whenToUse: "Use when sorted order allows pointer movement based on comparison to target.",
              why: "Each step discards impossible pairs globally.",
              complexity: { time: "O(n)", space: "O(1)" },
              tradeoffs: "Usually requires sorted input; sort cost may dominate total runtime.",
              javaCode: JAVA_SNIPPETS.tpOppositeEnds,
              color: "#14b8a6",
            },
          },
          {
            label: "Same direction (fast/slow runner)",
            result: {
              name: "Two Pointers Variant: Fast/Slow",
              pkg: "Pattern / Linked List",
              whenToUse: "Use for cycle detection, middle node, and in-place compaction patterns.",
              why: "Relative speed exposes structural properties without extra memory.",
              complexity: { time: "O(n)", space: "O(1)" },
              tradeoffs: "Null checks and stop conditions must be exact.",
              javaCode: JAVA_SNIPPETS.fastSlow,
              color: "#14b8a6",
            },
          },
          {
            label: "Partitioning (Dutch National Flag)",
            result: {
              name: "Two Pointers Variant: Partitioning",
              pkg: "Pattern / In-place Partition",
              whenToUse: "Use when elements must be grouped by categories in-place.",
              why: "Maintains zones [0..low), [low..mid), (high..n-1] while scanning once.",
              complexity: { time: "O(n)", space: "O(1)" },
              tradeoffs: "Pointer update order is subtle; diagram zones before coding.",
              javaCode: JAVA_SNIPPETS.tpDutchFlag,
              color: "#14b8a6",
            },
          },
          {
            label: "Merge/intersection over sorted arrays",
            result: {
              name: "Two Pointers Variant: Merge / Intersection",
              pkg: "Pattern / Merge-like Scan",
              whenToUse: "Use when scanning two sorted sequences for union/intersection/matches.",
              why: "Smaller current value can be advanced safely.",
              complexity: { time: "O(n + m)", space: "O(1) to O(answer)" },
              tradeoffs: "Duplicates and dedup rules must be handled explicitly.",
              javaCode: JAVA_SNIPPETS.tpMergeIntersection,
              color: "#14b8a6",
            },
          },
          {
            label: "K-sum reduction to two-sum",
            result: {
              name: "Two Pointers Variant: K-Sum Reduction",
              pkg: "Pattern / Sorting + Two Pointers",
              whenToUse: "Use for 3Sum/4Sum style tasks where one index is fixed then two-sum is solved.",
              why: "Reduces one dimension by fixing prefixes and scanning tail with two pointers.",
              complexity: { threeSum: "O(n^2)", fourSum: "O(n^3)", space: "O(1) extra" },
              tradeoffs: "Need duplicate skipping at every fixed level.",
              javaCode: JAVA_SNIPPETS.tpKSumReduction,
              color: "#14b8a6",
            },
          },
        ],
      },
    },
    {
      label: "Deep dive: BFS/DFS graph variations",
      next: {
        id: "pattern-graph-variants",
        icon: "🕸️",
        question: "Pick the graph traversal/state variant",
        options: [
          {
            label: "DFS for connected components",
            result: {
              name: "Graph Variant: DFS Components",
              pkg: "Graph / DFS",
              whenToUse: "Use when you need number of components or to visit each component fully.",
              why: "DFS exhausts a component before moving to the next seed node.",
              complexity: { time: "O(V + E)", space: "O(V)" },
              tradeoffs: "Recursive DFS can overflow stack on deep graphs; iterative version is safer.",
              javaCode: JAVA_SNIPPETS.graphDfsComponents,
              color: "#10b981",
            },
          },
          {
            label: "Multi-source BFS",
            result: {
              name: "Graph Variant: Multi-Source BFS",
              pkg: "Graph / BFS",
              whenToUse: "Use when shortest distance is needed from any of several starting nodes.",
              why: "Pushing all sources at distance 0 computes nearest-source distances in one pass.",
              complexity: { time: "O(V + E)", space: "O(V)" },
              tradeoffs: "Must seed all sources before BFS loop begins.",
              javaCode: JAVA_SNIPPETS.graphMultiSourceBfs,
              color: "#10b981",
            },
          },
          {
            label: "Topological BFS (Kahn)",
            result: {
              name: "Graph Variant: Kahn Topological BFS",
              pkg: "Graph / DAG",
              whenToUse: "Use when dependencies form DAG and processing order must respect prerequisites.",
              why: "In-degree zero queue guarantees valid order generation.",
              complexity: { time: "O(V + E)", space: "O(V)" },
              tradeoffs: "If output size < V, graph contains a cycle.",
              javaCode: JAVA_SNIPPETS.graphTopoKahn,
              color: "#10b981",
            },
          },
          {
            label: "DFS cycle detection (directed graph)",
            result: {
              name: "Graph Variant: DFS Directed Cycle",
              pkg: "Graph / DFS",
              whenToUse: "Use when validating if directed dependencies contain cycles.",
              why: "Back-edge to a visiting node confirms a directed cycle.",
              complexity: { time: "O(V + E)", space: "O(V)" },
              tradeoffs: "Need 3-state visitation, not just visited/unvisited.",
              javaCode: JAVA_SNIPPETS.graphCycleDfsDirected,
              color: "#10b981",
            },
          },
          {
            label: "Bipartite check (BFS coloring)",
            result: {
              name: "Graph Variant: Bipartite BFS Coloring",
              pkg: "Graph / BFS",
              whenToUse: "Use when graph must be split into two conflict-free groups.",
              why: "Alternating colors per BFS level captures parity constraints.",
              complexity: { time: "O(V + E)", space: "O(V)" },
              tradeoffs: "Disconnected graphs require starting BFS from every uncolored node.",
              javaCode: JAVA_SNIPPETS.graphBipartiteBfs,
              color: "#10b981",
            },
          },
          {
            label: "0-1 BFS (edge weights 0/1)",
            result: {
              name: "Graph Variant: 0-1 BFS",
              pkg: "Graph / Deque Shortest Path",
              whenToUse: "Use for shortest path when every edge weight is either 0 or 1.",
              why: "Deque front/back pushes simulate Dijkstra faster than heap for binary weights.",
              complexity: { time: "O(V + E)", space: "O(V)" },
              tradeoffs: "Only valid for 0/1 weights; otherwise use Dijkstra.",
              javaCode: JAVA_SNIPPETS.graphZeroOneBfs,
              color: "#10b981",
            },
          },
          {
            label: "Grid flood fill / island traversal",
            result: {
              name: "Graph Variant: Grid Flood Fill",
              pkg: "Graph / Grid BFS-DFS",
              whenToUse: "Use for island counting, region fill, boundary capture in matrix graphs.",
              why: "Treat each cell as node and traverse 4/8-direction neighbors.",
              complexity: { time: "O(rows*cols)", space: "O(rows*cols)" },
              tradeoffs: "Mark visited immediately when enqueuing to avoid duplicates.",
              javaCode: JAVA_SNIPPETS.graphFloodFill,
              color: "#10b981",
            },
          },
        ],
      },
    },
    {
      label: "Deep dive: DP by state design",
      next: {
        id: "pattern-dp-state-design",
        icon: "🧩",
        question: "Pick the DP state shape that matches your problem",
        options: [
          {
            label: "State: index i (linear progression)",
            result: {
              name: "DP Variation: State Design - Index i",
              pkg: "DP State Design",
              whenToUse: "Use when answer at step i depends on few previous indices.",
              why: "Single-axis state captures progression cleanly.",
              complexity: { states: "n", transition: "O(1)", total: "O(n)", space: "O(1) or O(n)" },
              tradeoffs: "Choose whether dp[i] means prefix ending at i or length i.",
              javaCode: JAVA_SNIPPETS.dpLinear1d,
              interactiveKey: "linear1d",
              color: "#6366f1",
            },
          },
          {
            label: "State: pair (i, j) for two sequences",
            result: {
              name: "DP Variation: State Design - Pair (i,j)",
              pkg: "DP State Design",
              whenToUse: "Use for edit distance/LCS style alignment of two sequences.",
              why: "Pair state captures relative progress in both strings.",
              complexity: { states: "n*m", transition: "O(1)", total: "O(n*m)", space: "O(n*m)" },
              tradeoffs: "Index convention mistakes are common.",
              javaCode: JAVA_SNIPPETS.dpLcs2d,
              interactiveKey: "lcs",
              color: "#6366f1",
            },
          },
          {
            label: "State: (pos, capacity)",
            result: {
              name: "DP Variation: State Design - Position + Capacity",
              pkg: "DP State Design",
              whenToUse: "Use for pick/skip optimization with bounded capacity/weight.",
              why: "Second dimension tracks remaining budget.",
              complexity: { states: "n*W", transition: "O(1)", total: "O(n*W)", space: "O(W) or O(n*W)" },
              tradeoffs: "Loop direction determines 0/1 vs unbounded behavior.",
              javaCode: JAVA_SNIPPETS.dpKnapsack01,
              interactiveKey: "knapsack",
              color: "#6366f1",
            },
          },
          {
            label: "State: (index, sum/balance)",
            result: {
              name: "DP Variation: State Design - Index + Sum",
              pkg: "DP State Design",
              whenToUse: "Use when constraints involve target sum, difference, or balance.",
              why: "Tracks both position and current accumulated target.",
              complexity: { states: "n * sumRange", transition: "small constant", total: "O(n*sumRange)" },
              tradeoffs: "Negative sums need offset indexing or maps.",
              javaCode: JAVA_SNIPPETS.topDownDp,
              color: "#6366f1",
            },
          },
          {
            label: "State: interval (l, r)",
            result: {
              name: "DP Variation: State Design - Interval (l,r)",
              pkg: "DP State Design",
              whenToUse: "Use when operations consume/merge subarray or substring intervals.",
              why: "Length-ordered transitions combine smaller solved intervals.",
              complexity: { states: "O(n^2)", transition: "O(n)", total: "O(n^3)", space: "O(n^2)" },
              tradeoffs: "Must iterate by increasing interval length.",
              javaCode: JAVA_SNIPPETS.dpInterval,
              color: "#6366f1",
            },
          },
          {
            label: "State: tree node + parent/state",
            result: {
              name: "DP Variation: State Design - Tree Node",
              pkg: "DP State Design",
              whenToUse: "Use when each node answer depends on child choices and parent relation.",
              why: "Post-order DFS naturally computes child contributions first.",
              complexity: { time: "O(n)", space: "O(n)" },
              tradeoffs: "Need parent parameter/visited to avoid revisiting parent.",
              javaCode: JAVA_SNIPPETS.dpTree,
              color: "#6366f1",
            },
          },
          {
            label: "State: (mask, last)",
            result: {
              name: "DP Variation: State Design - Bitmask + Last",
              pkg: "DP State Design",
              whenToUse: "Use when visiting subsets with endpoint-dependent cost (TSP-type).",
              why: "Bitmask encodes chosen set; last encodes current endpoint.",
              complexity: { states: "2^n * n", transition: "O(n)", total: "O(2^n * n^2)" },
              tradeoffs: "Only feasible for small n (~20).",
              javaCode: JAVA_SNIPPETS.dpBitmask,
              color: "#6366f1",
            },
          },
          {
            label: "State: (pos, tight, started, meta)",
            result: {
              name: "DP Variation: State Design - Digit",
              pkg: "DP State Design",
              whenToUse: "Use for counting valid numbers in range under digit constraints.",
              why: "Tight/started flags enforce prefix bound and leading-zero behavior.",
              complexity: { states: "digits * stateSpace", transition: "10 per state", total: "small * digits" },
              tradeoffs: "Leading zeros and tight transition are frequent mistakes.",
              javaCode: JAVA_SNIPPETS.dpDigit,
              color: "#6366f1",
            },
          },
          {
            label: "State: DAG node (topological order)",
            result: {
              name: "DP Variation: State Design - DAG Node",
              pkg: "DP State Design",
              whenToUse: "Use when dependencies form DAG and node value aggregates predecessors.",
              why: "Topological order guarantees prerequisite states are already computed.",
              complexity: { time: "O(V+E)", space: "O(V)" },
              tradeoffs: "Must detect or guarantee acyclicity.",
              javaCode: JAVA_SNIPPETS.dpDag,
              color: "#6366f1",
            },
          },
          {
            label: "State: finite machine mode",
            result: {
              name: "DP Variation: State Design - Finite State Machine",
              pkg: "DP State Design",
              whenToUse: "Use when each step is in one of few legal modes (hold/sell/rest etc.).",
              why: "Explicit state graph prevents illegal transitions.",
              complexity: { time: "O(n * states)", space: "O(states)" },
              tradeoffs: "Incorrect transition graph gives subtle wrong answers.",
              javaCode: JAVA_SNIPPETS.dpStateMachine,
              color: "#6366f1",
            },
          },
        ],
      },
    },
    {
      label: "Contiguous subarray/substring constraints",
      result: {
        name: "Sliding Window Pattern",
        pkg: "Pattern",
        whenToUse: "Use when problem asks max/min/longest over contiguous range with dynamic validity.",
        why: "Two moving boundaries avoid recomputing every subarray.",
        complexity: { time: "O(n)", space: "O(1) to O(k)" },
        tradeoffs: "Requires valid window invariant.",
        javaCode: JAVA_SNIPPETS.slidingWindow,
        color: "#22c55e",
      },
    },
    {
      label: "Pair/triplet on sorted array",
      result: {
        name: "Two Pointers Pattern",
        pkg: "Pattern",
        whenToUse: "Use when order allows opposing pointers to converge toward a condition.",
        why: "Prunes search space from O(n^2) to O(n) in many pair problems.",
        complexity: { time: "O(n)", space: "O(1)" },
        tradeoffs: "Usually requires sorted input or monotonicity.",
        javaCode: JAVA_SNIPPETS.twoPointers,
        color: "#22c55e",
      },
    },
    {
      label: "Cycle/middle detection in linked structures",
      result: {
        name: "Fast and Slow Pointers",
        pkg: "Pattern",
        whenToUse: "Use for cycle detection, cycle entry, middle node checks.",
        why: "Relative speed difference reveals loops without extra memory.",
        complexity: { time: "O(n)", space: "O(1)" },
        tradeoffs: "Pointer movement logic must be careful with null checks.",
        javaCode: JAVA_SNIPPETS.fastSlow,
        color: "#22c55e",
      },
    },
    {
      label: "Find minimum/maximum feasible value",
      result: {
        name: "Binary Search on Answer",
        pkg: "Pattern",
        whenToUse: "Use when feasibility is monotonic over numeric answer space.",
        why: "Converts optimization problem into repeated yes/no checks.",
        complexity: { time: "O(log range * checkCost)", space: "O(1)" },
        tradeoffs: "Need a correct monotonic predicate.",
        javaCode: JAVA_SNIPPETS.binarySearchAnswer,
        color: "#22c55e",
      },
    },
    {
      label: "Count subarrays efficiently",
      result: {
        name: "Prefix Sum + HashMap",
        pkg: "Pattern",
        whenToUse: "Use for counting subarrays with target sum/xor/mod conditions.",
        why: "Transforms range condition into hash lookup on previous prefixes.",
        complexity: { time: "O(n)", space: "O(n)" },
        tradeoffs: "Needs careful handling of initial prefix base case.",
        javaCode: JAVA_SNIPPETS.prefixSumHash,
        color: "#22c55e",
      },
    },
    {
      label: "Nearest greater/smaller element",
      result: {
        name: "Monotonic Stack",
        pkg: "Pattern",
        whenToUse: "Use when each element needs nearest prior/next larger/smaller element.",
        why: "Maintains useful candidates in monotonic order.",
        complexity: { time: "O(n)", space: "O(n)" },
        tradeoffs: "Stack direction/order mistakes are common.",
        javaCode: JAVA_SNIPPETS.monoStack,
        color: "#22c55e",
      },
    },
    {
      label: "Top K / streaming best candidates",
      result: {
        name: "Heap (Top-K Pattern)",
        pkg: "Pattern",
        whenToUse: "Use when only K best items are needed from large data.",
        why: "Keeps small candidate set instead of fully sorting.",
        complexity: { time: "O(n log k)", space: "O(k)" },
        tradeoffs: "Need correct min-heap vs max-heap orientation.",
        javaCode: JAVA_SNIPPETS.heapTopK,
        color: "#22c55e",
      },
    },
    {
      label: "Generate combinations/permutations",
      result: {
        name: "Backtracking (DFS with choices)",
        pkg: "Pattern",
        whenToUse: "Use for explore-all solutions with prune-able decision tree.",
        why: "Builds candidates incrementally and undoes choices cleanly.",
        complexity: { time: "Exponential worst-case", space: "Depth of recursion" },
        tradeoffs: "Without pruning, search explodes quickly.",
        javaCode: JAVA_SNIPPETS.dfsBacktrack,
        color: "#22c55e",
      },
    },
    {
      label: "Connectivity / components / cycle in undirected graph",
      result: {
        name: "Union-Find (DSU)",
        pkg: "Pattern",
        whenToUse: "Use for dynamic connectivity, Kruskal MST, redundant edge checks.",
        why: "Near-constant amortized merge/find operations.",
        complexity: { findUnion: "O(alpha(n)) amortized", space: "O(n)" },
        tradeoffs: "Not suitable for shortest path queries.",
        javaCode: JAVA_SNIPPETS.unionFind,
        color: "#22c55e",
      },
    },
    {
      label: "Level-wise shortest steps on grid/graph",
      result: {
        name: "BFS Layer Traversal",
        pkg: "Pattern",
        whenToUse: "Use for minimum moves in unweighted state-space.",
        why: "First time reaching a node is guaranteed shortest distance.",
        complexity: { time: "O(V + E)", space: "O(V)" },
        tradeoffs: "Can consume large memory with wide frontiers.",
        javaCode: JAVA_SNIPPETS.bfsGrid,
        color: "#22c55e",
      },
    },
    {
      label: "Optimal substructure with reusable states",
      result: {
        name: "DP State Transition",
        pkg: "Pattern",
        whenToUse: "Use when result can be defined from smaller state transitions.",
        why: "Tabulation/memoization avoids repeated decisions.",
        complexity: { time: "states * transitions", space: "states" },
        tradeoffs: "Incorrect state definition gives wrong answers.",
        javaCode: JAVA_SNIPPETS.dpTabulation,
        color: "#22c55e",
      },
    },
    {
      label: "Choose best local option repeatedly",
      result: {
        name: "Greedy Choice Pattern",
        pkg: "Pattern",
        whenToUse: "Use when local optimal steps can be proven globally optimal.",
        why: "Produces simple and fast solutions without full search.",
        complexity: { typical: "O(n log n) due to sorting", space: "O(1) to O(n)" },
        tradeoffs: "Needs proof/exchange argument; not always valid.",
        javaCode: JAVA_SNIPPETS.greedyIntervals,
        color: "#22c55e",
      },
    },
  ],
};

const MATH_TREE = {
  id: "math-root",
  icon: "📐",
  question: "Which math area do you want to revise quickly?",
  options: [
    {
      label: "Number Theory Essentials",
      next: {
        id: "math-number-theory",
        icon: "🔢",
        question: "Pick a number theory tool",
        options: [
          {
            label: "GCD / LCM",
            result: {
              name: "GCD and LCM",
              pkg: "Number Theory",
              whenToUse: "Use for divisibility, ratio simplification, periodic events, and fractions.",
              why: "GCD solves common factors quickly; LCM gives first common multiple for cycle alignment.",
              complexity: { gcd: "O(log min(a,b))", lcm: "O(log min(a,b))" },
              tradeoffs: "Use long to avoid overflow in LCM multiplication.",
              javaCode: JAVA_SNIPPETS.gcdLcm,
              color: "#0284c7",
            },
          },
          {
            label: "Extended Euclid",
            result: {
              name: "Extended Euclidean Algorithm",
              pkg: "Number Theory",
              whenToUse: "Use when you need coefficients x,y such that ax + by = gcd(a,b).",
              why: "Builds Bezout coefficients and enables modular inverse for non-prime mod in valid cases.",
              complexity: { time: "O(log min(a,b))", space: "O(log min(a,b)) recursion" },
              tradeoffs: "Inverse exists only when gcd(a,mod)=1.",
              javaCode: JAVA_SNIPPETS.extendedEuclid,
              color: "#0284c7",
            },
          },
          {
            label: "Fast Power / Modular Inverse",
            result: {
              name: "Binary Exponentiation + Fermat Inverse",
              pkg: "Modular Arithmetic",
              whenToUse: "Use for huge powers, modular combinations, hashing, and inverses under prime mod.",
              why: "Exponentiation by squaring reduces linear power time to logarithmic.",
              complexity: { modPow: "O(log e)", modInversePrime: "O(log mod)" },
              tradeoffs: "Fermat inverse requires prime modulus and non-zero base modulo mod.",
              codeVariants: [
                { title: "Fast power", code: JAVA_SNIPPETS.modPow },
                { title: "Inverse (prime mod)", code: JAVA_SNIPPETS.modInverseFermat },
              ],
              javaCode: JAVA_SNIPPETS.modPow,
              color: "#0284c7",
            },
          },
        ],
      },
    },
    {
      label: "Primes and Factorization",
      next: {
        id: "math-prime",
        icon: "🧪",
        question: "Choose prime processing method",
        options: [
          {
            label: "Many prime queries up to N",
            result: {
              name: "Sieve of Eratosthenes",
              pkg: "Prime Preprocessing",
              whenToUse: "Use when multiple primality checks are needed in range [1..N].",
              why: "One preprocessing pass gives O(1) primality lookup per value.",
              complexity: { preprocess: "O(N log log N)", query: "O(1)", space: "O(N)" },
              tradeoffs: "Memory heavy for huge N; segmented sieve is better for very large ranges.",
              javaCode: JAVA_SNIPPETS.sieve,
              color: "#16a34a",
            },
          },
          {
            label: "Prime factors of one/few numbers",
            result: {
              name: "Trial Division Factorization",
              pkg: "Prime Factorization",
              whenToUse: "Use when factoring a small number of values and constraints are moderate.",
              why: "Dividing by candidates up to sqrt(n) gives exact prime exponents.",
              complexity: { time: "O(sqrt(n))", space: "O(number of prime factors)" },
              tradeoffs: "For many factorization queries, precompute SPF array instead.",
              javaCode: JAVA_SNIPPETS.primeFactorization,
              color: "#16a34a",
            },
          },
        ],
      },
    },
    {
      label: "Combinatorics and Counting",
      next: {
        id: "math-comb",
        icon: "🧮",
        question: "What counting style do you need?",
        options: [
          {
            label: "nCr under large modulo",
            result: {
              name: "nCr mod prime",
              pkg: "Combinatorics",
              whenToUse: "Use in counting problems with large values where exact factorials overflow.",
              why: "Factorials with modular inverse compute combinations efficiently.",
              complexity: { precomputeFact: "O(n)", each_nCr: "O(log mod)", space: "O(n)" },
              tradeoffs: "This version assumes prime mod; non-prime requires other methods.",
              javaCode: JAVA_SNIPPETS.nCrModPrime,
              color: "#7c3aed",
            },
          },
          {
            label: "Count union of overlapping sets",
            result: {
              name: "Inclusion-Exclusion Principle",
              pkg: "Counting",
              whenToUse: "Use when counting elements satisfying at least one of multiple conditions.",
              why: "Adds single sets, subtracts pair overlaps, then adds triple overlaps, etc.",
              complexity: { time: "O(2^k) for k sets", space: "O(1) to O(2^k)" },
              tradeoffs: "Scales poorly if conditions are too many.",
              javaCode: JAVA_SNIPPETS.inclusionExclusion,
              color: "#7c3aed",
            },
          },
        ],
      },
    },
    {
      label: "Matrix and Recurrence Math",
      result: {
        name: "Matrix Exponentiation",
        pkg: "Linear Recurrences",
        whenToUse: "Use for recurrences like Fibonacci where transitions are linear and n is huge.",
        why: "Raises transition matrix in O(log n), far faster than O(n) DP for large n.",
        complexity: { matrixMul: "O(k^3)", exponentiation: "O(k^3 log n)", space: "O(k^2)" },
        tradeoffs: "Constant factors are higher; only worth it when n is large.",
        javaCode: JAVA_SNIPPETS.matrixExpoFib,
        color: "#0f766e",
      },
    },
    {
      label: "Geometry basics for DSA/interviews",
      result: {
        name: "Orientation and Cross Product",
        pkg: "Computational Geometry",
        whenToUse: "Use in segment intersection, convex hull, polygon winding, and turn direction checks.",
        why: "Cross product sign gives clockwise/counterclockwise/collinear instantly.",
        complexity: { oneCheck: "O(1)", segmentIntersection: "O(1) per pair" },
        tradeoffs: "Use long for coordinate products to avoid overflow.",
        javaCode: JAVA_SNIPPETS.geometryOrientation,
        color: "#ea580c",
      },
    },
    {
      label: "Bitwise math tricks",
      next: {
        id: "math-bitwise-detailed",
        icon: "🧠",
        question: "Which bit manipulation pattern do you want to revise?",
        options: [
          {
            label: "Core bit operations (set/clear/toggle/test)",
            result: {
              name: "Bit Basics",
              pkg: "Bit Manipulation",
              whenToUse: "Use whenever you need fast boolean flags or compact state storage.",
              why: "Single integer operations replace loops/arrays for many tiny-state tasks.",
              complexity: { eachOp: "O(1)", space: "O(1)" },
              tradeoffs: "Easy to introduce bugs with wrong shift index/precedence.",
              codeVariants: [
                { title: "Core operations", code: JAVA_SNIPPETS.bitBasicsOps },
                { title: "Power and low-bit checks", code: JAVA_SNIPPETS.bitPowerChecks },
              ],
              javaCode: JAVA_SNIPPETS.bitBasicsOps,
              color: "#be123c",
            },
          },
          {
            label: "XOR tricks (single/two unique numbers)",
            result: {
              name: "XOR Cancellation Patterns",
              pkg: "Bit Manipulation",
              whenToUse: "Use when pairs cancel and only one/two unique values remain.",
              why: "x ^ x = 0 and x ^ 0 = x enables elegant linear solutions.",
              complexity: { time: "O(n)", space: "O(1)" },
              tradeoffs: "Requires strict duplicate frequency assumptions.",
              codeVariants: [
                { title: "Single unique", code: JAVA_SNIPPETS.bitUniqueWithXor },
                { title: "Two uniques", code: JAVA_SNIPPETS.bitTwoUniques },
              ],
              javaCode: JAVA_SNIPPETS.bitUniqueWithXor,
              color: "#be123c",
            },
          },
          {
            label: "Subset masks and submask iteration",
            result: {
              name: "Mask Enumeration Tricks",
              pkg: "Bitmask Techniques",
              whenToUse: "Use in subset DP, combinational states, and feature-selection problems.",
              why: "Bitmasks compactly represent subsets and support fast transitions.",
              complexity: { allSubsets: "O(2^n)", submasksOfMask: "O(2^k)", memory: "O(1)" },
              tradeoffs: "Only practical for small n (typically <= 22).",
              codeVariants: [
                { title: "Submask iteration", code: JAVA_SNIPPETS.bitSubmaskIteration },
                { title: "SOS DP idea", code: JAVA_SNIPPETS.bitSupersetDp },
              ],
              javaCode: JAVA_SNIPPETS.bitSubmaskIteration,
              color: "#be123c",
            },
          },
          {
            label: "Bit DP/counting utilities",
            result: {
              name: "Count Bits / Prefix Bit Info",
              pkg: "Bit DP",
              whenToUse: "Use when problems depend on set-bit counts for many numbers.",
              why: "Recurrence dp[i] = dp[i>>1] + (i&1) gives linear preprocessing.",
              complexity: { preprocess: "O(n)", eachQuery: "O(1)" },
              tradeoffs: "For huge ranges, consider mathematical counting by bit positions.",
              javaCode: JAVA_SNIPPETS.bitCountBits,
              color: "#be123c",
            },
          },
          {
            label: "Maximum XOR and binary trie",
            result: {
              name: "Bit Trie for XOR Optimization",
              pkg: "Advanced Bit Structures",
              whenToUse: "Use for max XOR pair/subarray queries.",
              why: "Greedy opposite-bit traversal maximizes XOR value bit-by-bit.",
              complexity: { insert: "O(B)", query: "O(B)", total: "O(n*B)", B: "32 for int" },
              tradeoffs: "Higher constant and memory than hash-based methods.",
              javaCode: JAVA_SNIPPETS.bitTrieMaxXor,
              color: "#be123c",
            },
          },
          {
            label: "Range bitwise AND trick",
            result: {
              name: "Common Prefix Bit Trick",
              pkg: "Bitwise Range Operations",
              whenToUse: "Use for range bitwise AND over [L, R].",
              why: "Only common leading bits survive; shifting to common prefix is fastest.",
              complexity: { time: "O(log(max(L,R)))", space: "O(1)" },
              tradeoffs: "Pattern is specific to AND; does not directly transfer to OR/XOR.",
              javaCode: JAVA_SNIPPETS.bitAndRange,
              color: "#be123c",
            },
          },
          {
            label: "Quick cheatsheet of common bit tricks",
            result: {
              name: "Bit Manipulation Cheatsheet",
              pkg: "Revision Summary",
              whenToUse: "Use before contests/interviews as a memory refresher.",
              why: "Groups highest-frequency bit hacks in one place.",
              complexity: { operations: "Mostly O(1)", subsetLoops: "Exponential in bits" },
              tradeoffs: "Cheatsheet helps recall but always verify constraints/edge cases.",
              javaCode: JAVA_SNIPPETS.bitMath,
              color: "#be123c",
            },
          },
        ],
      },
    },
    {
      label: "Prefix/Suffix math tricks",
      result: {
        name: "Prefix Sum Transform",
        pkg: "Array Math Transform",
        whenToUse: "Use when many range sum queries exist on immutable data.",
        why: "Converts O(n) per query to O(1) via cumulative preprocessing.",
        complexity: { preprocess: "O(n)", query: "O(1)", space: "O(n)" },
        tradeoffs: "If updates are frequent, use Fenwick/Segment tree instead.",
        javaCode: JAVA_SNIPPETS.prefixSumMath,
        color: "#2563eb",
      },
    },
    {
      label: "Probability and expectation",
      result: {
        name: "Expected Value DP-style Setup",
        pkg: "Probability Math",
        whenToUse: "Use when asked expected number of steps/cost under random transitions.",
        why: "Linearity of expectation converts random process to deterministic recurrence.",
        complexity: { states: "n", transition: "outcomes per state", total: "O(n * outcomes)" },
        tradeoffs: "Floating point precision and equation setup need care.",
        javaCode: JAVA_SNIPPETS.expectedValueDice,
        color: "#4f46e5",
      },
    },
  ],
};

const SECTIONS = buildSections({
  dataStructuresTree: DATA_STRUCTURE_TREE,
  algorithmTree: ALGORITHM_TREE,
  patternTree: PATTERN_TREE,
  mathTree: MATH_TREE,
});

export default function App() {
  const {
    currentSection,
    sectionMeta,
    path,
    currentNode,
    result,
    animating,
    switchSection,
    reset,
    handleOption,
    goBack,
    jumpToPathIndex,
    jumpToResult,
  } = useDecisionTreeNavigation(SECTIONS, "dataStructures");

  const [mode, setMode] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [cueText, setCueText] = useState("");
  const [theme, setTheme] = useState("light");
  const [objectiveView, setObjectiveView] = useState("core");

  const searchIndex = useMemo(() => buildSearchIndex(SECTIONS), []);
  const complexityRows = useMemo(() => collectComplexityInsights(SECTIONS), []);
  const cueSuggestions = useMemo(() => mapProblemCuesToPatterns(cueText), [cueText]);

  const handleJumpFromSearch = useCallback(
    (item) => {
      setObjectiveView("core");
      jumpToResult(item.sectionKey, item.optionTrail);
    },
    [jumpToResult]
  );

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  }, [theme]);

  useKeyboardNavigation({
    onBack: goBack,
    onReset: reset,
    onTogglePalette: () => setPaletteOpen((v) => !v),
  });

  return (
    <div className="page">
      <div className="container">
        <Header />
        <div className="objective-toggle-row">
          <div className="objective-toggle-left">
            {OBJECTIVE_VIEWS.map((view) => (
              <button
                key={view.id}
                className={`objective-toggle-btn ${objectiveView === view.id ? "active" : ""}`}
                onClick={() => setObjectiveView(view.id)}
              >
                {view.label}
              </button>
            ))}
          </div>
          <button className="objective-theme-btn" onClick={toggleTheme}>
            Theme: {theme === "dark" ? "Dark" : "Light"}
          </button>
        </div>
        {objectiveView === "core" && <SectionTabs sections={SECTIONS} currentSection={currentSection} onSwitchSection={switchSection} />}

        {objectiveView === "core" && <RevisionModeSwitcher mode={mode} onChange={setMode} />}
        {objectiveView === "core" && (
          <SearchBar index={searchIndex} query={searchQuery} onQueryChange={setSearchQuery} mode={mode} onJump={handleJumpFromSearch} />
        )}
        <CommandPalette
          open={paletteOpen}
          query={searchQuery}
          onQueryChange={setSearchQuery}
          index={searchIndex}
          mode={mode}
          onClose={() => setPaletteOpen(false)}
          onJump={handleJumpFromSearch}
        />
        {objectiveView === "core" && <ProblemCueMapper value={cueText} onChange={setCueText} suggestions={cueSuggestions} />}

        {objectiveView === "core" && (
          <div className="panel">
            <h2 className="panel-title">{sectionMeta.label}</h2>

            <Breadcrumbs path={path} onReset={reset} onJumpToPath={jumpToPathIndex} />

            <div className={`fade ${animating ? "animating" : ""}`}>
              {result ? (
                <ResultCard
                  key={result.name}
                  result={result}
                  onReset={reset}
                  getCodeVariants={getCodeVariants}
                  renderHighlightedCode={renderHighlightedCode}
                  dpSteps={DP_INTERACTIVE_STEPS}
                />
              ) : (
                <QuestionOptions currentNode={currentNode} onSelectOption={handleOption} onBack={goBack} hasPath={path.length > 0} />
              )}
            </div>
          </div>
        )}

        {objectiveView === "insights" && (
          <>
            <CompareView rows={complexityRows} />
            <DecisionDebugger path={path} result={result} />
            <ComplexityHeatmap rows={complexityRows} />
            <MistakeBank resultName={result?.name} catalog={MISTAKES_CATALOG} />
          </>
        )}
      </div>
    </div>
  );
}