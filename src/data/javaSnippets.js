export const JAVA_SNIPPETS = {
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
}
void merge(int[] a, int l, int m, int r) {
    int n1 = m - l + 1, n2 = r - m;
    int[] L = new int[n1], R = new int[n2];
    for (int i = 0; i < n1; i++) L[i] = a[l + i];
    for (int j = 0; j < n2; j++) R[j] = a[m + 1 + j];
    int i = 0, j = 0, k = l;
    while (i < n1 && j < n2) {
        if (L[i] <= R[j]) a[k++] = L[i++];
        else a[k++] = R[j++];
    }
    while (i < n1) a[k++] = L[i++];
    while (j < n2) a[k++] = R[j++];
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
  bubbleSort: `void bubbleSort(int[] a) {
    int n = a.length;
    for (int i = 0; i < n; i++) {
        boolean swapped = false;
        for (int j = 0; j < n - 1 - i; j++) {
            if (a[j] > a[j + 1]) {
                int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;
                swapped = true;
            }
        }
        if (!swapped) break;
    }
}`,
  selectionSort: `void selectionSort(int[] a) {
    int n = a.length;
    for (int i = 0; i < n; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (a[j] < a[minIdx]) minIdx = j;
        }
        if (minIdx != i) {
            int t = a[i]; a[i] = a[minIdx]; a[minIdx] = t;
        }
    }
}`,
  heapSort: `void heapSort(int[] a) {
    int n = a.length;
    for (int i = n / 2 - 1; i >= 0; i--) heapify(a, n, i);
    for (int end = n - 1; end > 0; end--) {
        int t = a[0]; a[0] = a[end]; a[end] = t;
        heapify(a, end, 0);
    }
}
void heapify(int[] a, int n, int i) {
    int best = i, l = 2 * i + 1, r = 2 * i + 2;
    if (l < n && a[l] > a[best]) best = l;
    if (r < n && a[r] > a[best]) best = r;
    if (best != i) {
        int t = a[i]; a[i] = a[best]; a[best] = t;
        heapify(a, n, best);
    }
}`,
  radixSort: `void radixSort(int[] a) {
    int max = Arrays.stream(a).max().orElse(0);
    for (int exp = 1; max / exp > 0; exp *= 10) {
        countingSortByDigit(a, exp);
    }
}
void countingSortByDigit(int[] a, int exp) {
    int n = a.length;
    int[] out = new int[n];
    int[] cnt = new int[10];
    for (int x : a) cnt[(x / exp) % 10]++;
    for (int i = 1; i < 10; i++) cnt[i] += cnt[i - 1];
    for (int i = n - 1; i >= 0; i--) {
        int d = (a[i] / exp) % 10;
        out[--cnt[d]] = a[i];
    }
    System.arraycopy(out, 0, a, 0, n);
}`,
  bfsTraversal: `void bfs(int start, List<List<Integer>> g, boolean[] vis) {
    Queue<Integer> q = new ArrayDeque<>();
    q.offer(start);
    vis[start] = true;
    while (!q.isEmpty()) {
        int u = q.poll();
        // process u in BFS traversal (level-order)
        for (int v : g.get(u)) {
            if (!vis[v]) {
                vis[v] = true;
                q.offer(v);
            }
        }
    }
}`,
  multiSourceBfsGraph: `int[] multiSourceBfs(int n, List<List<Integer>> g, int[] sources) {
    int[] dist = new int[n];
    Arrays.fill(dist, -1);
    Queue<Integer> q = new ArrayDeque<>();
    for (int s : sources) {
      dist[s] = 0;
      q.offer(s);
    }
    while (!q.isEmpty()) {
      int u = q.poll();
      for (int v : g.get(u)) {
        if (dist[v] == -1) {
          dist[v] = dist[u] + 1;
          q.offer(v);
        }
      }
    }
    return dist;
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
  dfsGraph: `void dfs(int u, List<List<Integer>> g, boolean[] vis) {
    vis[u] = true;
    for (int v : g.get(u)) {
      if (!vis[v]) dfs(v, g, vis);
    }
}`,
  floydWarshall: `void floydWarshall(int[][] dist) {
    int n = dist.length;
    for (int k = 0; k < n; k++)
      for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++)
          if (dist[i][k] != INF && dist[k][j] != INF)
            dist[i][j] = Math.min(dist[i][j], dist[i][k] + dist[k][j]);
}`,
  kruskalMST: `int find(int[] p, int x) { return p[x] == x ? x : (p[x] = find(p, p[x])); }
void unite(int[] p, int[] r, int a, int b) {
  int ra = find(p, a), rb = find(p, b);
  if (ra == rb) return;
  if (r[ra] < r[rb]) p[ra] = rb;
  else if (r[ra] > r[rb]) p[rb] = ra;
  else { p[rb] = ra; r[ra]++; }
}
int kruskal(int n, int[][] edges, List<int[]> mstOut) {
  Arrays.sort(edges, Comparator.comparingInt(e -> e[2]));
  int[] p = new int[n], r = new int[n];
  for (int i = 0; i < n; i++) p[i] = i;
  int cost = 0;
  for (int[] e : edges) {
    int u = e[0], v = e[1], w = e[2];
    if (find(p, u) != find(p, v)) {
      unite(p, r, u, v);
      mstOut.add(new int[]{u, v, w});
      cost += w;
    }
  }
  return cost;
}`,
  primMST: `void prim(List<List<int[]>> g, int n) {
  boolean[] inMst = new boolean[n];
  int[] key = new int[n];
  Arrays.fill(key, Integer.MAX_VALUE);
  key[0] = 0;
  for (int k = 0; k < n; k++) {
    int u = -1;
    for (int i = 0; i < n; i++)
      if (!inMst[i] && (u < 0 || key[i] < key[u])) u = i;
    inMst[u] = true;
    for (int[] e : g.get(u)) {
      int v = e[0], w = e[1];
      if (!inMst[v] && w < key[v]) key[v] = w;
    }
  }
}`,
  bidirectionalBfs: `int biBfs(List<List<Integer>> g, int src, int dst) {
    if (src == dst) return 0;
    int n = g.size();
    int[] d1 = new int[n], d2 = new int[n];
    Arrays.fill(d1, -1);
    Arrays.fill(d2, -1);
    ArrayDeque<Integer> q1 = new ArrayDeque<>(), q2 = new ArrayDeque<>();
    d1[src] = 0;
    d2[dst] = 0;
    q1.add(src);
    q2.add(dst);
    while (!q1.isEmpty() && !q2.isEmpty()) {
      // expand smaller frontier
      boolean useFirst = q1.size() <= q2.size();
      ArrayDeque<Integer> q = useFirst ? q1 : q2;
      int[] d = useFirst ? d1 : d2;
      int[] o = useFirst ? d2 : d1;
      int u = q.poll();
      for (int v : g.get(u)) {
        if (d[v] != -1) continue;
        d[v] = d[u] + 1;
        if (o[v] != -1) return d[v] + o[v];
        q.add(v);
      }
    }
    return -1;
}`,
  johnsonAPSP: `/** Johnson: all-pairs shortest paths. Negative edges OK; no negative cycles. */
class JohnsonAPSP {
  static final int INF = Integer.MAX_VALUE / 4;

  /** dist[i][j] = shortest i→j, or INF if unreachable. Null if negative cycle. */
  static int[][] johnson(int n, List<int[]> edges) {
    int S = n;
    int augN = n + 1;
    List<int[]> aug = new ArrayList<>(edges);
    for (int i = 0; i < n; i++) aug.add(new int[]{S, i, 0});

    int[] h = bellmanFord(augN, aug, S);
    if (h == null) return null;

    List<List<int[]>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
    for (int[] e : edges) {
      int u = e[0], v = e[1], w = e[2];
      int wp = w + h[u] - h[v];
      adj.get(u).add(new int[]{v, wp});
    }

    int[][] dist = new int[n][n];
    for (int i = 0; i < n; i++) Arrays.fill(dist[i], INF);

    for (int s = 0; s < n; s++) {
      int[] dPrime = dijkstra(n, adj, s);
      for (int t = 0; t < n; t++) {
        if (dPrime[t] >= INF / 2) continue;
        dist[s][t] = dPrime[t] - h[s] + h[t];
      }
    }
    return dist;
  }

  static int[] bellmanFord(int n, List<int[]> edges, int src) {
    int[] dist = new int[n];
    Arrays.fill(dist, INF);
    dist[src] = 0;
    for (int i = 1; i < n; i++) {
      for (int[] e : edges) {
        int u = e[0], v = e[1], w = e[2];
        if (dist[u] != INF && dist[v] > dist[u] + w) dist[v] = dist[u] + w;
      }
    }
    for (int[] e : edges) {
      int u = e[0], v = e[1], w = e[2];
      if (dist[u] != INF && dist[v] > dist[u] + w) return null;
    }
    return dist;
  }

  static int[] dijkstra(int n, List<List<int[]>> adj, int src) {
    int[] dist = new int[n];
    Arrays.fill(dist, INF);
    dist[src] = 0;
    PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[0]));
    pq.offer(new int[]{0, src});
    while (!pq.isEmpty()) {
      int[] cur = pq.poll();
      int d = cur[0], u = cur[1];
      if (d != dist[u]) continue;
      for (int[] e : adj.get(u)) {
        int v = e[0], w = e[1];
        if (dist[v] > dist[u] + w) {
          dist[v] = dist[u] + w;
          pq.offer(new int[]{dist[v], v});
        }
      }
    }
    return dist;
  }
}`,
  astarSearch: `int aStar(List<List<int[]>> g, int src, int dst, int[] h) {
    PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[1]));
    int[] gScore = new int[g.size()];
    Arrays.fill(gScore, Integer.MAX_VALUE);
    gScore[src] = 0;
    pq.offer(new int[]{src, h[src]});
    while (!pq.isEmpty()) {
      int u = pq.poll()[0];
      if (u == dst) return gScore[u];
      for (int[] e : g.get(u)) {
        int v = e[0], w = e[1];
        int ng = gScore[u] + w;
        if (ng < gScore[v]) {
          gScore[v] = ng;
          pq.offer(new int[]{v, ng + h[v]});
        }
      }
    }
    return -1;
}`,
  tarjanSCC: `void tarjan(int u, List<List<Integer>> g, int[] id, int[] low, Deque<Integer> st,
    boolean[] onStack, int[] time, List<List<Integer>> sccs) {
  id[u] = low[u] = ++time[0];
  st.push(u);
  onStack[u] = true;
  for (int v : g.get(u)) {
    if (id[v] == 0) {
      tarjan(v, g, id, low, st, onStack, time, sccs);
      low[u] = Math.min(low[u], low[v]);
    } else if (onStack[v]) low[u] = Math.min(low[u], id[v]);
  }
  if (low[u] == id[u]) {
    List<Integer> comp = new ArrayList<>();
    while (true) {
      int x = st.pop();
      onStack[x] = false;
      comp.add(x);
      if (x == u) break;
    }
    sccs.add(comp);
  }
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
