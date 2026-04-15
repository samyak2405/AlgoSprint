import React, { useState } from "react";

// Flat revision cards drawn from all sections
const REVISION_CARDS = [
  // ── Fundamentals ──────────────────────────────────────────────────────
  { id: "r1",  category: "Fundamentals", color: "var(--blue)",  title: "Thread Lifecycle",
    oneliner: "NEW → RUNNABLE → (BLOCKED | WAITING | TIMED_WAITING) → TERMINATED. 6 states.",
    key: "Thread.getState()", gotcha: "RUNNABLE ≠ running. Thread may be on-CPU or in the OS ready queue." },

  { id: "r2",  category: "Fundamentals", color: "var(--blue)", title: "happens-before",
    oneliner: "If A happens-before B, all memory writes by A are visible to B. Established by: lock release → lock acquire, volatile write → volatile read, Thread.start(), Thread.join().",
    key: "JLS §17.4", gotcha: "No happens-before = no visibility guarantee, even if the CPU 'probably' flushed." },

  { id: "r3",  category: "Fundamentals", color: "var(--blue)", title: "Java Memory Model",
    oneliner: "Each thread has a local cache. Without synchronization, writes may never be flushed to main memory.",
    key: "volatile / synchronized", gotcha: "Long and double reads/writes are non-atomic on 32-bit JVMs without volatile." },

  // ── Synchronization ────────────────────────────────────────────────────
  { id: "r4",  category: "Synchronization", color: "var(--red)", title: "synchronized",
    oneliner: "Acquires the intrinsic monitor lock. Provides mutual exclusion + happens-before. Reentrant.",
    key: "synchronized(this) / static", gotcha: "Always use while() wait(), never if() — spurious wakeups are real." },

  { id: "r5",  category: "Synchronization", color: "var(--red)", title: "volatile",
    oneliner: "Visibility only. Reads/writes go to main memory. Prevents reordering. Does NOT guarantee atomicity.",
    key: "volatile boolean flag", gotcha: "volatile int counter; counter++ is still a race (read-modify-write = 3 ops)." },

  { id: "r6",  category: "Synchronization", color: "var(--red)", title: "wait() / notify()",
    oneliner: "Must hold the lock. wait() releases lock and suspends. notify() wakes one thread. notifyAll() wakes all.",
    key: "Object.wait() / notifyAll()", gotcha: "Call notify/notifyAll before release; missed notification = permanent wait." },

  // ── Pitfalls ───────────────────────────────────────────────────────────
  { id: "r7",  category: "Pitfalls", color: "var(--gold)", title: "Deadlock",
    oneliner: "Circular lock dependency — A waits for B, B waits for A. Prevention: consistent lock ordering.",
    key: "ReentrantLock.tryLock()", gotcha: "Detect with jstack — it prints 'Found 1 deadlock' with the full chain." },

  { id: "r8",  category: "Pitfalls", color: "var(--gold)", title: "Race Condition",
    oneliner: "Correctness depends on thread interleaving. Check-then-act and read-modify-write are classic patterns.",
    key: "ConcurrentHashMap.putIfAbsent()", gotcha: "ConcurrentHashMap individual ops are atomic; compound ops are not." },

  { id: "r9",  category: "Pitfalls", color: "var(--gold)", title: "Livelock",
    oneliner: "Threads change state in response to each other but make no progress. High CPU, zero output.",
    key: "Random backoff", gotcha: "Fix with randomised backoff — breaks the symmetry." },

  { id: "r10", category: "Pitfalls", color: "var(--gold)", title: "Starvation",
    oneliner: "A thread is permanently denied CPU time because other threads monopolise resources.",
    key: "new ReentrantLock(true)", gotcha: "Fair lock = FIFO but lower throughput. Use only when fairness is a hard requirement." },

  // ── Executors ──────────────────────────────────────────────────────────
  { id: "r11", category: "Executors", color: "var(--red)", title: "ExecutorService",
    oneliner: "Thread pool + task queue. submit(Callable) → Future. Always shutdown().",
    key: "Executors.newFixedThreadPool(n)", gotcha: "Always call shutdown(). Forgetting keeps the JVM alive." },

  { id: "r12", category: "Executors", color: "var(--red)", title: "ThreadPoolExecutor",
    oneliner: "Threads grow beyond corePoolSize only when the queue is FULL. Unbounded queue → never more than core threads.",
    key: "ThreadPoolExecutor(core, max, ...)", gotcha: "Name your threads — unnamed threads make thread dumps unreadable." },

  { id: "r13", category: "Executors", color: "var(--red)", title: "ScheduledExecutorService",
    oneliner: "Run tasks at a fixed rate or after a delay. Replace Timer — it's single-threaded and swallows exceptions.",
    key: "scheduleAtFixedRate() / scheduleWithFixedDelay()", gotcha: "An exception in a scheduled task cancels future executions silently." },

  // ── Futures ────────────────────────────────────────────────────────────
  { id: "r14", category: "Futures", color: "var(--blue)", title: "Future<T>",
    oneliner: "Represents a pending result. get() blocks. Exceptions surface only on get().",
    key: "future.get(timeout, unit)", gotcha: "Never call get() without a timeout — it blocks forever if the task hangs." },

  { id: "r15", category: "Futures", color: "var(--blue)", title: "CompletableFuture",
    oneliner: "Async pipeline. thenApply = transform. thenCompose = flatMap. allOf = fan-out.",
    key: "CompletableFuture.supplyAsync()", gotcha: "thenApplyAsync uses commonPool by default — provide an executor for I/O tasks." },

  // ── Synchronizers ──────────────────────────────────────────────────────
  { id: "r16", category: "Synchronizers", color: "var(--gold)", title: "CountDownLatch",
    oneliner: "One-shot gate. N events countDown → waiting threads released. Not reusable.",
    key: "new CountDownLatch(n)", gotcha: "Always countDown() in finally. One missed call = threads wait forever." },

  { id: "r17", category: "Synchronizers", color: "var(--gold)", title: "CyclicBarrier",
    oneliner: "N threads wait for each other. After all arrive, barrier resets automatically.",
    key: "new CyclicBarrier(n, barrierAction)", gotcha: "BrokenBarrierException if any thread is interrupted — all waiting threads get it." },

  { id: "r18", category: "Synchronizers", color: "var(--gold)", title: "Semaphore",
    oneliner: "Controls access via permits. acquire() blocks; release() returns. Great for connection pools.",
    key: "new Semaphore(n, fair)", gotcha: "Always release() in finally. Any thread can release — not just the acquirer." },

  // ── Queues ─────────────────────────────────────────────────────────────
  { id: "r19", category: "Queues", color: "var(--green)", title: "LinkedBlockingQueue",
    oneliner: "Bounded optional. put() blocks when full. take() blocks when empty. Separate head/tail locks — high throughput.",
    key: "new LinkedBlockingQueue<>(capacity)", gotcha: "Unbounded by default — can OOM under load. Always specify capacity in production." },

  { id: "r20", category: "Queues", color: "var(--green)", title: "SynchronousQueue",
    oneliner: "Zero capacity. Each put() waits for a take() — direct handoff. Used in newCachedThreadPool().",
    key: "new SynchronousQueue<>()", gotcha: "Not a queue you iterate — it's a rendezvous point. size() always returns 0." },

  // ── Collections ────────────────────────────────────────────────────────
  { id: "r21", category: "Collections", color: "var(--blue)", title: "ConcurrentHashMap",
    oneliner: "Segment/bucket-level locking. Lock-free reads. Null keys/values NOT allowed.",
    key: "computeIfAbsent / merge / putIfAbsent", gotcha: "Individual ops atomic; compound ops are not — use compute/merge for atomicity." },

  { id: "r22", category: "Collections", color: "var(--blue)", title: "CopyOnWriteArrayList",
    oneliner: "Each mutation creates a new copy. Reads lock-free. Write-heavy = terrible performance.",
    key: "CopyOnWriteArrayList<T>", gotcha: "Only use for read-heavy, write-rare lists (e.g., event listener registries)." },

  // ── Atomics ────────────────────────────────────────────────────────────
  { id: "r23", category: "Atomics", color: "var(--gold)", title: "AtomicInteger",
    oneliner: "Lock-free counter. incrementAndGet() is atomic. CAS-based.",
    key: "compareAndSet(expected, update)", gotcha: "ABA problem: value changes A→B→A; CAS passes incorrectly. Use AtomicStampedReference." },

  { id: "r24", category: "Atomics", color: "var(--gold)", title: "LongAdder",
    oneliner: "Better than AtomicLong under high contention. Striped cells reduce CAS contention. sum() is approximate.",
    key: "longAdder.increment() / sum()", gotcha: "sum() is not atomic — reads may reflect partial updates under concurrency." },

  // ── Locks ──────────────────────────────────────────────────────────────
  { id: "r25", category: "Locks", color: "var(--red)", title: "ReentrantLock",
    oneliner: "Same as synchronized + tryLock, lockInterruptibly, fairness, multiple Conditions.",
    key: "lock.lock() / unlock() in finally", gotcha: "MUST unlock() in finally — no compiler enforcement unlike synchronized." },

  { id: "r26", category: "Locks", color: "var(--red)", title: "ReentrantReadWriteLock",
    oneliner: "Multiple readers OR one exclusive writer. Use when reads vastly outnumber writes.",
    key: "rwLock.readLock() / writeLock()", gotcha: "Lock UPGRADE (read→write) is NOT allowed — causes deadlock. Downgrade is fine." },

  // ── Locking ────────────────────────────────────────────────────────────
  { id: "r29", category: "Locking", color: "#E07060", title: "Intrinsic Lock",
    oneliner: "Every Java object has one. synchronized acquires it. Automatically released on block exit. Reentrant by default.",
    key: "synchronized(obj) { }", gotcha: "You cannot interrupt a thread waiting for an intrinsic lock. Use ReentrantLock.lockInterruptibly() when you need that." },

  { id: "r30", category: "Locking", color: "#E07060", title: "Lock Granularity",
    oneliner: "Coarse-grained (one lock for all) = simple but bottleneck. Fine-grained (per-bucket/per-row) = throughput but deadlock risk.",
    key: "ConcurrentHashMap (bucket-level)", gotcha: "Too-fine granularity means more locks to acquire in order — deadlock becomes easier to introduce." },

  { id: "r31", category: "Locking", color: "#E07060", title: "Monitor Pattern",
    oneliner: "A lock + condition variable + the protected data bundled together. Every synchronized Java object is a monitor.",
    key: "wait() / notify() inside synchronized", gotcha: "Condition.await() releases the lock, just like Object.wait(). Call inside a while(), never an if()." },

  // ── Types of Locking ──────────────────────────────────────────────────
  { id: "r32", category: "Types of Locking", color: "#A78BFA", title: "Pessimistic vs Optimistic",
    oneliner: "Pessimistic: lock before read/write (assumes conflict). Optimistic: read freely, validate before commit (assumes no conflict).",
    key: "CAS / AtomicInteger.compareAndSet()", gotcha: "Optimistic fails under high contention — CAS retries burn CPU. Switch to pessimistic when retry rate is high." },

  { id: "r33", category: "Types of Locking", color: "#A78BFA", title: "Spin Lock",
    oneliner: "Thread loops (spins) on CAS instead of sleeping. No OS context switch. Ideal for microsecond-scale critical sections.",
    key: "AtomicReference.compareAndSet()", gotcha: "Spinning under long waits wastes CPU — prefer a blocking lock for anything > a few microseconds." },

  { id: "r34", category: "Types of Locking", color: "#A78BFA", title: "Reentrant Lock",
    oneliner: "A thread already holding the lock can acquire it again. Hold count increments; releases when count reaches zero.",
    key: "synchronized & ReentrantLock are both reentrant", gotcha: "Non-reentrant locks (rare) deadlock if the same thread re-acquires. Always know if your lock is reentrant." },

  { id: "r35", category: "Types of Locking", color: "#A78BFA", title: "Read-Write Lock",
    oneliner: "Shared read (many concurrent readers OK) OR exclusive write (one writer, zero readers). Maximises read throughput.",
    key: "ReentrantReadWriteLock / StampedLock", gotcha: "Lock UPGRADE (read→write) deadlocks. Lock DOWNGRADE (write→read) is allowed. StampedLock adds optimistic reads." },

  { id: "r36", category: "Types of Locking", color: "#A78BFA", title: "Fair vs Unfair Lock",
    oneliner: "Fair (FIFO): longest-waiter goes next — no starvation. Unfair (barging): any thread can barge in — higher throughput.",
    key: "new ReentrantLock(true) // fair", gotcha: "Fair locks can be 5–10× slower than unfair. Only use fairness when starvation is a proven production issue." },

  { id: "r37", category: "Types of Locking", color: "#A78BFA", title: "StampedLock",
    oneliner: "Java 8. Three modes: write (exclusive), read (shared), optimistic-read (no lock + validate). Highest throughput for read-heavy.",
    key: "sl.tryOptimisticRead() + sl.validate(stamp)", gotcha: "StampedLock is NOT reentrant. Calling writeLock() while holding readLock() deadlocks." },

  // ── Virtual Threads ────────────────────────────────────────────────────
  { id: "r38", category: "Virtual Threads", color: "#4ADE80", title: "Virtual Threads",
    oneliner: "Java 21. JVM-managed lightweight threads (~KB each). Millions can coexist. Ideal for I/O-bound work.",
    key: "Thread.ofVirtual().start(r) / Executors.newVirtualThreadPerTaskExecutor()", gotcha: "synchronized blocks PIN the virtual thread to its carrier — use ReentrantLock in hot I/O paths." },

  { id: "r39", category: "Virtual Threads", color: "#4ADE80", title: "Carrier Thread",
    oneliner: "The OS thread a virtual thread runs on. When the virtual thread blocks on I/O, it unmounts — carrier is free for others.",
    key: "Runtime.getRuntime().availableProcessors()", gotcha: "JVM has one carrier per CPU core (ForkJoin common pool). If all carriers are pinned, virtual threads queue up." },

  { id: "r40", category: "Virtual Threads", color: "#4ADE80", title: "StructuredTaskScope",
    oneliner: "Structured concurrency: fork child tasks, join all, guarantee all are cancelled on scope exit. No thread leaks.",
    key: "StructuredTaskScope.ShutdownOnFailure / ShutdownOnSuccess", gotcha: "Java 21 = preview feature (--enable-preview). Stable in Java 23+. Do NOT call scope.fork() after scope.join()." },

  { id: "r41", category: "Virtual Threads", color: "#4ADE80", title: "Virtual Thread Pitfalls",
    oneliner: "Do NOT pool them (cheap to create). Do NOT use for CPU-bound work. Avoid ThreadLocal (prefer ScopedValue).",
    key: "spring.threads.virtual.enabled=true (Spring Boot 3.2+)", gotcha: "ThreadLocal works but has worse GC pressure with millions of virtual threads — each thread has its own map entry." },

  // ── Misc ───────────────────────────────────────────────────────────────
  { id: "r27", category: "Misc", color: "var(--ink-3)", title: "ThreadLocal",
    oneliner: "Per-thread copy of a variable. No synchronization needed. Common use: SimpleDateFormat, DB connections.",
    key: "ThreadLocal.withInitial(() -> ...)", gotcha: "In thread pools: always remove() in finally — stale values leak to the next task." },

  { id: "r28", category: "Misc", color: "var(--ink-3)", title: "ForkJoinPool",
    oneliner: "Work-stealing pool for recursive divide-and-conquer. RecursiveTask<V> for results.",
    key: "ForkJoinPool.commonPool().invoke(task)", gotcha: "NOT for I/O-bound tasks — use a dedicated thread pool. Overhead kills small datasets." },
];

const CATEGORIES = ["All", "Fundamentals", "Synchronization", "Locking", "Types of Locking",
  "Virtual Threads", "Pitfalls", "Executors", "Futures", "Synchronizers",
  "Queues", "Collections", "Atomics", "Locks", "Misc"];

export default function Revision() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = REVISION_CARDS.filter((c) => {
    const matchCat = activeCategory === "All" || c.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      c.title.toLowerCase().includes(q) ||
      c.oneliner.toLowerCase().includes(q) ||
      c.key.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div className="container revision-page">
      <div className="page-header">
        <span className="eyebrow-tag">Revision</span>
        <h1 className="page-title">Quick Revision</h1>
        <p className="page-subtitle">
          All concepts distilled into scannable cards — one-liner, key Java API, and
          the gotcha. Filter by category for a targeted 5-minute review.
        </p>
      </div>

      <div className="page-controls">
        <div className="filter-tabs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={"filter-tab" + (activeCategory === cat ? " filter-tab--active" : "")}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <input
          type="search"
          className="page-search"
          placeholder="Search topics..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">No cards match your search.</div>
      ) : (
        <div className="revision-grid">
          {filtered.map((card) => (
            <div
              key={card.id}
              className="revision-card"
              style={{ "--cat-color": card.color }}
            >
              <div className="revision-card-category">{card.category}</div>
              <div className="revision-card-title">{card.title}</div>
              <p className="revision-card-oneliner">{card.oneliner}</p>
              <span className="revision-card-key">{card.key}</span>
              <div className="revision-card-gotcha">
                <strong>Gotcha: </strong>{card.gotcha}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
