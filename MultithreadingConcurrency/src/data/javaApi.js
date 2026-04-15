export const JAVA_API = [
  // ─────────────────── EXECUTORS ──────────────────────────────────────────
  {
    id: "executor-service",
    title: "ExecutorService",
    category: "Executors",
    tags: ["thread pool", "executor", "task submission"],
    purpose:
      "ExecutorService decouples task submission from thread management. You submit tasks (Runnable or Callable) and the service manages the thread pool, lifecycle, and scheduling.",
    signature: `ExecutorService exec = Executors.newFixedThreadPool(4);
Future<T>  future = exec.submit(Callable<T>);
void       exec.execute(Runnable);
void       exec.shutdown();         // graceful: wait for queued tasks
List<Runnable> exec.shutdownNow(); // aggressive: interrupt running tasks`,
    codeExample: `import java.util.concurrent.*;

public class ExecutorDemo {
    public static void main(String[] args) throws Exception {
        // Fixed pool — good for CPU-bound tasks (cores + 1 threads)
        ExecutorService pool = Executors.newFixedThreadPool(
            Runtime.getRuntime().availableProcessors() + 1
        );

        // Submit a Callable — returns a Future
        Future<Integer> future = pool.submit(() -> {
            Thread.sleep(100);
            return 42;
        });

        // Do other work while task runs...
        System.out.println("Task submitted, doing other work");

        // Block until result is ready (timeout to avoid hanging forever)
        int result = future.get(5, TimeUnit.SECONDS);
        System.out.println("Result: " + result);

        // Always shut down — otherwise JVM won't exit
        pool.shutdown();
        if (!pool.awaitTermination(10, TimeUnit.SECONDS)) {
            pool.shutdownNow();
        }
    }
}

// Factory methods for common pools
ExecutorService fixed     = Executors.newFixedThreadPool(4);        // bounded, predictable
ExecutorService cached    = Executors.newCachedThreadPool();        // unbounded, short tasks
ExecutorService single    = Executors.newSingleThreadExecutor();    // serial execution
ScheduledExecutorService sched = Executors.newScheduledThreadPool(2);`,
    pitfalls: [
      "Always call shutdown() or shutdownNow() — an unshut executor keeps the JVM alive.",
      "newCachedThreadPool() creates unbounded threads — can exhaust OS resources under load. Prefer a bounded ThreadPoolExecutor for production.",
      "future.get() blocks indefinitely. Always use the get(timeout, unit) overload.",
      "Swallowed exceptions: a Callable that throws stores the exception in the Future. It only surfaces when you call future.get().",
    ],
  },

  {
    id: "thread-pool-executor",
    title: "ThreadPoolExecutor",
    category: "Executors",
    tags: ["thread pool", "core pool", "queue", "rejection"],
    purpose:
      "The full-featured thread pool implementation underlying all Executors factory methods. Use it directly when you need fine control over pool size, queue type, keep-alive time, and rejection policy.",
    signature: `new ThreadPoolExecutor(
    int corePoolSize,     // min threads always alive
    int maximumPoolSize,  // max threads when queue is full
    long keepAliveTime,   // how long idle extra threads wait before terminating
    TimeUnit unit,
    BlockingQueue<Runnable> workQueue,
    ThreadFactory threadFactory,    // optional: name threads
    RejectedExecutionHandler handler // optional: what to do when full
)`,
    codeExample: `import java.util.concurrent.*;

ThreadPoolExecutor executor = new ThreadPoolExecutor(
    4,                            // core: always keep 4 threads
    10,                           // max: up to 10 threads when queue full
    60, TimeUnit.SECONDS,         // idle threads > core die after 60s
    new LinkedBlockingQueue<>(100), // bounded queue — prevents OOM
    new ThreadPoolExecutor.CallerRunsPolicy() // rejection: caller runs the task
);

// Custom thread names (invaluable for debugging thread dumps)
ThreadFactory namedFactory = new ThreadFactory() {
    private final AtomicInteger count = new AtomicInteger(0);
    @Override
    public Thread newThread(Runnable r) {
        Thread t = new Thread(r, "worker-" + count.incrementAndGet());
        t.setDaemon(false);
        return t;
    }
};

// Monitor pool health
System.out.println("Pool size:   " + executor.getPoolSize());
System.out.println("Active:      " + executor.getActiveCount());
System.out.println("Queue size:  " + executor.getQueue().size());
System.out.println("Completed:   " + executor.getCompletedTaskCount());

// Rejection policies:
// AbortPolicy       — throw RejectedExecutionException (default)
// CallerRunsPolicy  — caller thread runs the task (back-pressure)
// DiscardPolicy     — silently discard
// DiscardOldestPolicy — discard oldest waiting task`,
    pitfalls: [
      "Thread growth: threads only grow beyond corePoolSize when the queue is FULL. With an unbounded queue, you'll never see more than corePoolSize threads.",
      "Bounded queue + CallerRunsPolicy is the most common production pattern for back-pressure.",
      "Always name your threads — it makes thread dumps 10x easier to read.",
    ],
  },

  {
    id: "completable-future",
    title: "CompletableFuture",
    category: "Futures",
    tags: ["CompletableFuture", "async", "non-blocking", "chaining"],
    purpose:
      "CompletableFuture is Java 8+'s async pipeline API. It lets you compose async operations with thenApply, thenCompose, thenCombine, allOf, anyOf — without blocking threads.",
    signature: `CompletableFuture.supplyAsync(Supplier<T>)          // async computation
CompletableFuture.supplyAsync(Supplier<T>, Executor) // with custom executor
cf.thenApply(fn)         // transform result (same thread)
cf.thenApplyAsync(fn)    // transform on ForkJoinPool.commonPool()
cf.thenCompose(fn)       // flat-map (fn returns CompletableFuture)
cf.thenCombine(cf2, fn)  // combine two futures
cf.exceptionally(fn)     // recover from exception
CompletableFuture.allOf(cf1, cf2, ...)  // wait for all
CompletableFuture.anyOf(cf1, cf2, ...)  // wait for first`,
    codeExample: `import java.util.concurrent.*;

// Basic pipeline
CompletableFuture<String> pipeline =
    CompletableFuture.supplyAsync(() -> fetchUserId("alice"))      // async
        .thenApply(id -> fetchUserProfile(id))                      // transform
        .thenApply(profile -> "Hello, " + profile.getName())        // transform
        .exceptionally(ex -> "Error: " + ex.getMessage());         // recover

// thenCompose: when the next step is itself async
CompletableFuture<Order> order =
    CompletableFuture.supplyAsync(() -> fetchUserId("alice"))
        .thenCompose(id -> fetchOrdersAsync(id));  // flat-map (no nested CF)

// Combine two independent futures
CompletableFuture<Double> price  = CompletableFuture.supplyAsync(() -> fetchPrice("AAPL"));
CompletableFuture<Integer> qty   = CompletableFuture.supplyAsync(() -> fetchQuantity("AAPL"));
CompletableFuture<Double> total  = price.thenCombine(qty, (p, q) -> p * q);

// Wait for all — fan-out pattern
List<CompletableFuture<String>> futures = List.of(
    CompletableFuture.supplyAsync(() -> callServiceA()),
    CompletableFuture.supplyAsync(() -> callServiceB()),
    CompletableFuture.supplyAsync(() -> callServiceC())
);
CompletableFuture<Void> allDone = CompletableFuture.allOf(
    futures.toArray(new CompletableFuture[0])
);
// Collect results after all complete
allDone.thenRun(() -> {
    List<String> results = futures.stream()
        .map(CompletableFuture::join)
        .collect(Collectors.toList());
    System.out.println(results);
});

// Manual completion
CompletableFuture<String> manual = new CompletableFuture<>();
manual.complete("done");           // complete normally
manual.completeExceptionally(ex);  // complete with exception`,
    pitfalls: [
      "thenApply vs thenCompose: use thenCompose when the mapping function itself returns a CompletableFuture — avoids CompletableFuture<CompletableFuture<T>>.",
      "Async suffix: thenApplyAsync runs on ForkJoinPool.commonPool() by default. For blocking I/O, always supply a dedicated executor.",
      "Exception handling: exceptions short-circuit the pipeline. Use exceptionally() or handle() to recover; otherwise the exception is silently swallowed until you call get().",
      "allOf returns CompletableFuture<Void> — you must collect the individual futures' results yourself via join().",
    ],
  },

  // ─────────────────── SYNCHRONIZERS ──────────────────────────────────────
  {
    id: "count-down-latch",
    title: "CountDownLatch",
    category: "Synchronizers",
    tags: ["CountDownLatch", "await", "countDown", "one-shot"],
    purpose:
      "Allows one or more threads to wait until a set of operations in other threads have completed. The count is set once and cannot be reset — it's a one-shot gate.",
    signature: `new CountDownLatch(int count)
latch.countDown()         // decrement count; releases waiting threads when count == 0
latch.await()             // block until count reaches 0
latch.await(timeout, unit) // block with timeout; returns false if timed out
latch.getCount()          // check remaining count`,
    codeExample: `import java.util.concurrent.*;

// Pattern 1: Wait for N tasks to complete
int N = 5;
CountDownLatch doneSignal = new CountDownLatch(N);

ExecutorService pool = Executors.newFixedThreadPool(N);
for (int i = 0; i < N; i++) {
    final int taskId = i;
    pool.execute(() -> {
        try {
            doWork(taskId);
        } finally {
            doneSignal.countDown(); // always countDown, even on exception
        }
    });
}
doneSignal.await(); // main thread waits here until all 5 tasks finish
System.out.println("All tasks done");

// Pattern 2: Starting pistol — release all threads simultaneously
CountDownLatch startSignal = new CountDownLatch(1);
for (int i = 0; i < N; i++) {
    new Thread(() -> {
        try {
            startSignal.await(); // wait at the start line
            doWork();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }).start();
}
// ... set up everything ...
startSignal.countDown(); // fire! All threads start simultaneously`,
    pitfalls: [
      "CountDownLatch is single-use. If you need a resettable barrier, use CyclicBarrier.",
      "Always countDown() in a finally block — a task that throws without counting down will leave waiting threads blocked forever.",
      "countDown() never throws — safe to call from any context.",
    ],
  },

  {
    id: "cyclic-barrier",
    title: "CyclicBarrier",
    category: "Synchronizers",
    tags: ["CyclicBarrier", "barrier", "phases", "reusable"],
    purpose:
      "A synchronization point where a fixed number of threads must all arrive before any can proceed. Unlike CountDownLatch it is reusable — after all threads pass, the barrier automatically resets for the next cycle.",
    signature: `new CyclicBarrier(int parties)
new CyclicBarrier(int parties, Runnable barrierAction)  // run after all arrive
barrier.await()           // wait at barrier; throws BrokenBarrierException if interrupted
barrier.await(timeout, unit)
barrier.reset()           // reset the barrier (breaks waiting threads)
barrier.getNumberWaiting()`,
    codeExample: `import java.util.concurrent.*;

// Matrix row computation in parallel phases
int THREADS = 4;
CyclicBarrier barrier = new CyclicBarrier(THREADS, () -> {
    System.out.println("--- Phase complete, merging results ---");
    mergeResults(); // optional barrier action, runs in the last arriving thread
});

double[][] matrix = new double[1000][1000];
ExecutorService pool = Executors.newFixedThreadPool(THREADS);

for (int t = 0; t < THREADS; t++) {
    final int threadId = t;
    pool.execute(() -> {
        try {
            for (int phase = 0; phase < 10; phase++) {
                // Each thread processes its slice
                processRows(matrix, threadId, THREADS);

                barrier.await(); // all threads synchronize between phases

                // barrier automatically resets — next phase begins
            }
        } catch (InterruptedException | BrokenBarrierException e) {
            Thread.currentThread().interrupt();
        }
    });
}`,
    pitfalls: [
      "BrokenBarrierException: if any thread is interrupted while waiting, the barrier is 'broken' — all other waiting threads throw BrokenBarrierException. Handle it and decide whether to reset or shut down.",
      "The barrier action runs in the last thread to arrive, on that thread. Keep it short.",
      "CyclicBarrier vs CountDownLatch: CyclicBarrier is for N threads waiting for each other; CountDownLatch is for M threads waiting for N events.",
    ],
  },

  {
    id: "semaphore",
    title: "Semaphore",
    category: "Synchronizers",
    tags: ["Semaphore", "permits", "throttling", "resource pool"],
    purpose:
      "Controls access to a shared resource by maintaining a set of permits. Useful for rate-limiting, connection pooling, or limiting concurrent access to a resource.",
    signature: `new Semaphore(int permits)
new Semaphore(int permits, boolean fair)
sem.acquire()             // block until a permit is available
sem.acquire(int n)        // acquire n permits
sem.tryAcquire()          // non-blocking; returns false immediately if none available
sem.tryAcquire(timeout, unit)
sem.release()             // return a permit
sem.release(int n)
sem.availablePermits()`,
    codeExample: `import java.util.concurrent.*;

// Limit concurrent database connections to 10
Semaphore dbPool = new Semaphore(10, true); // fair

public void queryDatabase(String sql) throws InterruptedException {
    dbPool.acquire();          // wait for a connection slot
    try {
        executeQuery(sql);
    } finally {
        dbPool.release();      // always release in finally
    }
}

// Rate limiter: max 5 simultaneous requests
Semaphore rateLimiter = new Semaphore(5);

CompletableFuture.runAsync(() -> {
    try {
        rateLimiter.acquire();
        try {
            callExternalApi();
        } finally {
            rateLimiter.release();
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    }
});

// Non-blocking try
if (dbPool.tryAcquire(500, TimeUnit.MILLISECONDS)) {
    try {
        executeQuery(sql);
    } finally {
        dbPool.release();
    }
} else {
    throw new ServiceUnavailableException("DB pool exhausted");
}`,
    pitfalls: [
      "Always release() in a finally block — an exception without release permanently drains a permit.",
      "Semaphore does NOT require the same thread to release that acquired — any thread can release. This is intentional but can be misused.",
      "For mutual exclusion, synchronized or ReentrantLock is clearer. Semaphore(1) works but has no 'owner' concept.",
    ],
  },

  // ─────────────────── QUEUES ─────────────────────────────────────────────
  {
    id: "blocking-queue",
    title: "BlockingQueue",
    category: "Queues",
    tags: ["BlockingQueue", "producer-consumer", "LinkedBlockingQueue", "ArrayBlockingQueue"],
    purpose:
      "Thread-safe queue that blocks producers when full and blocks consumers when empty. The foundation for the producer-consumer pattern without manual wait/notify.",
    signature: `// Blocking operations (wait indefinitely)
queue.put(e)    // block if full
queue.take()    // block if empty

// Timed operations
queue.offer(e, timeout, unit)  // return false if full after timeout
queue.poll(timeout, unit)      // return null if empty after timeout

// Non-blocking (return false/null immediately)
queue.offer(e)
queue.poll()`,
    codeExample: `import java.util.concurrent.*;

// Producer-Consumer with BlockingQueue
BlockingQueue<String> queue = new LinkedBlockingQueue<>(100); // bounded

// Producer thread
Thread producer = new Thread(() -> {
    try {
        for (int i = 0; i < 1000; i++) {
            queue.put("task-" + i); // blocks if queue full (back-pressure)
        }
        queue.put("POISON_PILL");   // signal consumers to stop
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    }
});

// Consumer thread
Thread consumer = new Thread(() -> {
    try {
        while (true) {
            String item = queue.take(); // blocks if queue empty
            if ("POISON_PILL".equals(item)) break;
            process(item);
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    }
});

// Common implementations:
// LinkedBlockingQueue(capacity) — optionally bounded, high throughput, separate head/tail locks
// ArrayBlockingQueue(capacity)  — always bounded, array-backed, single lock
// PriorityBlockingQueue()       — unbounded, priority-ordered (Comparator)
// SynchronousQueue()            — zero capacity; each put() waits for a take() (direct handoff)
// DelayQueue<E extends Delayed> — elements available only after their delay expires`,
    pitfalls: [
      "LinkedBlockingQueue has separate locks for head and tail — higher concurrency than ArrayBlockingQueue for high-throughput scenarios.",
      "SynchronousQueue has zero capacity — put() blocks until a consumer calls take(). Used in Executors.newCachedThreadPool().",
      "Poison pill pattern: put a sentinel value to signal consumers to stop. Use one pill per consumer thread.",
    ],
  },

  // ─────────────────── CONCURRENT COLLECTIONS ─────────────────────────────
  {
    id: "concurrent-hash-map",
    title: "ConcurrentHashMap",
    category: "Collections",
    tags: ["ConcurrentHashMap", "thread-safe", "map", "atomic"],
    purpose:
      "Thread-safe HashMap with high concurrency. Uses segment-level locking (Java 7) / CAS + bin locking (Java 8+). Reads are lock-free; writes lock only the affected bucket.",
    signature: `map.get(key)
map.put(key, value)
map.putIfAbsent(key, value)          // atomic check-then-put
map.computeIfAbsent(key, fn)         // atomic; only compute if absent
map.compute(key, (k, v) -> newVal)   // atomic read-modify-write
map.merge(key, value, (old, v) -> .) // atomic merge/upsert
map.getOrDefault(key, defaultVal)`,
    codeExample: `import java.util.concurrent.*;

ConcurrentHashMap<String, Integer> wordCount = new ConcurrentHashMap<>();

// Thread-safe word counting
void countWord(String word) {
    wordCount.merge(word, 1, Integer::sum);  // atomic: increment or init to 1
}

// Atomic cache / lazy init
ConcurrentHashMap<String, ExpensiveObject> cache = new ConcurrentHashMap<>();

ExpensiveObject getOrCreate(String key) {
    return cache.computeIfAbsent(key, k -> new ExpensiveObject(k));
    // Only one thread computes for a given key — others wait
}

// WRONG: non-atomic compound operation
if (!map.containsKey("key")) { map.put("key", compute()); }  // race!

// RIGHT: atomic
map.putIfAbsent("key", compute());  // but compute() always called — wasteful
map.computeIfAbsent("key", k -> compute());  // compute() called at most once

// Concurrent iteration (snapshot semantics — won't throw ConcurrentModificationException)
map.forEach((k, v) -> System.out.println(k + "=" + v));

// Aggregate operations
long total = map.reduceValues(1, Integer::sum);  // parallelism threshold 1`,
    pitfalls: [
      "null keys and null values are NOT allowed (unlike HashMap) — throws NullPointerException.",
      "size() is approximate during concurrent modifications. Use mappingCount() for large maps.",
      "Individual operations are atomic, but sequences are not — always use compute/merge/putIfAbsent for compound operations.",
    ],
  },

  // ─────────────────── ATOMICS ────────────────────────────────────────────
  {
    id: "atomic-classes",
    title: "Atomic Classes (AtomicInteger, AtomicLong, AtomicReference)",
    category: "Atomics",
    tags: ["AtomicInteger", "AtomicLong", "AtomicReference", "CAS", "lock-free"],
    purpose:
      "Lock-free, thread-safe wrappers for single variables using Compare-And-Set (CAS) hardware instructions. Much faster than synchronized for counters and simple state.",
    signature: `AtomicInteger ai = new AtomicInteger(0);
ai.get()                          // read
ai.set(value)                     // write
ai.incrementAndGet()              // ++i
ai.getAndIncrement()              // i++
ai.addAndGet(delta)               // i += delta
ai.compareAndSet(expected, update) // CAS: update only if current == expected
ai.updateAndGet(fn)               // apply function atomically
ai.accumulateAndGet(x, fn)        // accumulate atomically

AtomicReference<T> ref = new AtomicReference<>(initial);
ref.get(); ref.set(val); ref.compareAndSet(expected, update)`,
    codeExample: `import java.util.concurrent.atomic.*;

// Simple counter (replaces synchronized counter)
AtomicInteger counter = new AtomicInteger(0);
counter.incrementAndGet();   // thread-safe increment
counter.addAndGet(5);        // thread-safe add

// CAS-based optimistic update
AtomicInteger balance = new AtomicInteger(100);

boolean withdraw(int amount) {
    while (true) {
        int current = balance.get();
        if (current < amount) return false;
        if (balance.compareAndSet(current, current - amount)) {
            return true; // CAS succeeded
        }
        // CAS failed: another thread modified balance — retry
    }
}

// AtomicReference for immutable value replacement
AtomicReference<List<String>> cache = new AtomicReference<>(Collections.emptyList());

void updateCache(List<String> newData) {
    cache.set(Collections.unmodifiableList(new ArrayList<>(newData)));
}

// LongAdder — better than AtomicLong for high-contention counters
// Uses striped cells to reduce CAS contention
LongAdder hitCount = new LongAdder();
hitCount.increment();
long total = hitCount.sum(); // read (approximate under concurrent updates)`,
    pitfalls: [
      "ABA problem: CAS sees old value A, another thread changes to B then back to A — CAS incorrectly succeeds. Use AtomicStampedReference or AtomicMarkableReference to add a version stamp.",
      "Under very high contention, spinning CAS loops waste CPU. Use LongAdder / LongAccumulator for high-write-rate counters.",
      "AtomicReference stores a reference — it makes the reference update atomic, not the object pointed to. The object itself may still need synchronization.",
    ],
  },

  // ─────────────────── LOCKS ──────────────────────────────────────────────
  {
    id: "reentrant-lock",
    title: "ReentrantLock & Condition",
    category: "Locks",
    tags: ["ReentrantLock", "Condition", "tryLock", "lockInterruptibly"],
    purpose:
      "A flexible lock with the same mutual-exclusion semantics as synchronized but with additional features: timed/interruptible locking, fairness, and multiple Condition objects per lock.",
    signature: `ReentrantLock lock = new ReentrantLock();
lock.lock()                           // acquire; blocks
lock.lockInterruptibly()              // acquire; throws InterruptedException
lock.tryLock()                        // non-blocking; returns boolean
lock.tryLock(timeout, unit)           // timed acquire
lock.unlock()                         // release — MUST be in finally
lock.isHeldByCurrentThread()
lock.getQueueLength()

Condition cond = lock.newCondition();
cond.await()                          // like Object.wait()
cond.await(timeout, unit)
cond.signal()                         // like Object.notify()
cond.signalAll()                      // like Object.notifyAll()`,
    codeExample: `import java.util.concurrent.locks.*;

// Basic usage — always unlock in finally
ReentrantLock lock = new ReentrantLock();

void safeOp() {
    lock.lock();
    try {
        // critical section
    } finally {
        lock.unlock(); // ALWAYS in finally — even if exception thrown
    }
}

// tryLock to avoid deadlock
boolean transfer(Account from, Account to, int amount) {
    while (true) {
        if (from.lock.tryLock()) {
            try {
                if (to.lock.tryLock()) {
                    try {
                        from.balance -= amount;
                        to.balance   += amount;
                        return true;
                    } finally { to.lock.unlock(); }
                }
            } finally { from.lock.unlock(); }
        }
        Thread.yield(); // back off
    }
}

// Multiple Conditions — precise signalling (better than notifyAll on one lock)
class BoundedBuffer<T> {
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notFull  = lock.newCondition();
    private final Condition notEmpty = lock.newCondition();
    private final Queue<T> queue = new LinkedList<>();
    private final int capacity;

    BoundedBuffer(int capacity) { this.capacity = capacity; }

    public void put(T item) throws InterruptedException {
        lock.lock();
        try {
            while (queue.size() == capacity) notFull.await();
            queue.add(item);
            notEmpty.signal(); // wake only a consumer (not all threads)
        } finally { lock.unlock(); }
    }

    public T take() throws InterruptedException {
        lock.lock();
        try {
            while (queue.isEmpty()) notEmpty.await();
            T item = queue.poll();
            notFull.signal(); // wake only a producer
            return item;
        } finally { lock.unlock(); }
    }
}`,
    pitfalls: [
      "MUST call unlock() in a finally block. Forgetting this (unlike synchronized) leaves the lock permanently held if an exception occurs.",
      "Fair locks (new ReentrantLock(true)) prevent starvation but have lower throughput — use only when fairness is a hard requirement.",
      "Condition.await() must be called while holding the lock — just like Object.wait().",
    ],
  },

  {
    id: "read-write-lock",
    title: "ReentrantReadWriteLock",
    category: "Locks",
    tags: ["ReadWriteLock", "read lock", "write lock", "throughput"],
    purpose:
      "Allows multiple concurrent readers OR one exclusive writer. Perfect for read-heavy data structures where writes are infrequent, greatly increasing throughput over a plain ReentrantLock.",
    signature: `ReentrantReadWriteLock rwLock = new ReentrantReadWriteLock();
rwLock.readLock().lock() / unlock()    // shared — many threads can hold simultaneously
rwLock.writeLock().lock() / unlock()   // exclusive — only one thread

// StampedLock (Java 8): optimistic reads — even higher throughput
StampedLock sl = new StampedLock();
long stamp = sl.tryOptimisticRead();   // read without locking
// ... read data ...
if (!sl.validate(stamp)) {            // check if a write happened during read
    stamp = sl.readLock();            // fallback to real read lock
    try { /* re-read */ } finally { sl.unlockRead(stamp); }
}`,
    codeExample: `import java.util.concurrent.locks.*;

public class CachedData {
    private Map<String, String> data = new HashMap<>();
    private final ReentrantReadWriteLock rwLock = new ReentrantReadWriteLock();
    private final Lock readLock  = rwLock.readLock();
    private final Lock writeLock = rwLock.writeLock();

    // Many threads can read simultaneously
    public String get(String key) {
        readLock.lock();
        try {
            return data.get(key);
        } finally {
            readLock.unlock();
        }
    }

    // Only one thread writes; all readers blocked during write
    public void put(String key, String value) {
        writeLock.lock();
        try {
            data.put(key, value);
        } finally {
            writeLock.unlock();
        }
    }

    // Lock downgrade: write → read (allowed; reverse not allowed)
    public void updateAndRead(String key, String value) {
        writeLock.lock();
        try {
            data.put(key, value);
            readLock.lock(); // acquire read lock BEFORE releasing write lock
        } finally {
            writeLock.unlock(); // now only holding read lock
        }
        try {
            return data.get(key);
        } finally {
            readLock.unlock();
        }
    }
}`,
    pitfalls: [
      "Lock upgrade (read → write) is NOT allowed — it would deadlock. If you hold a read lock and need to write, release read first, then acquire write (and re-validate state).",
      "WriteLock is exclusive — even one writer blocks all readers. If writes are frequent, ReentrantReadWriteLock may be slower than a plain lock due to the overhead.",
      "StampedLock (Java 8) offers higher throughput via optimistic reads but lacks reentrancy and Condition support.",
    ],
  },

  {
    id: "thread-local",
    title: "ThreadLocal",
    category: "Misc",
    tags: ["ThreadLocal", "per-thread state", "SimpleDateFormat"],
    purpose:
      "Provides a variable that each thread maintains its own, independently-initialized copy of. Eliminates sharing — no synchronization needed for per-thread state.",
    signature: `ThreadLocal<T> tl = new ThreadLocal<>();
ThreadLocal<T> tl = ThreadLocal.withInitial(Supplier<T>);
tl.get()       // get current thread's value
tl.set(value)  // set current thread's value
tl.remove()    // MUST call in thread-pool threads to prevent memory leaks`,
    codeExample: `// Per-thread SimpleDateFormat (not thread-safe by itself)
private static final ThreadLocal<SimpleDateFormat> DATE_FORMAT =
    ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyy-MM-dd"));

public String formatDate(Date date) {
    return DATE_FORMAT.get().format(date); // each thread has its own SDF
}

// Per-thread database connection (used in some ORMs)
private static final ThreadLocal<Connection> CONNECTION =
    ThreadLocal.withInitial(() -> dataSource.getConnection());

// CRITICAL: in thread pools, always remove() after use
public void handleRequest(Request req) {
    USER_CONTEXT.set(req.getUser());
    try {
        processRequest(req);
    } finally {
        USER_CONTEXT.remove(); // prevents thread-pool thread from carrying stale context
    }
}`,
    pitfalls: [
      "Thread pool memory leak: thread-pool threads are reused. If you set() without remove(), the next task on the same thread sees the previous task's value.",
      "InheritableThreadLocal: child threads inherit parent's values — but this can cause unexpected sharing in thread pools (threads aren't 'children' of the submitter).",
      "ThreadLocal is not a replacement for dependency injection. It makes code harder to test. Use it only when the alternative is passing a value through many unrelated layers.",
    ],
  },
];

export const CATEGORY_META = {
  Executors:   { color: "var(--red)",   bg: "var(--red-subtle)",   count: JAVA_API.filter(a => a.category === "Executors").length },
  Futures:     { color: "var(--blue)",  bg: "var(--blue-subtle)",  count: JAVA_API.filter(a => a.category === "Futures").length },
  Synchronizers: { color: "var(--gold)", bg: "var(--gold-subtle)", count: JAVA_API.filter(a => a.category === "Synchronizers").length },
  Queues:      { color: "var(--green)", bg: "var(--green-subtle)", count: JAVA_API.filter(a => a.category === "Queues").length },
  Collections: { color: "var(--blue)",  bg: "var(--blue-subtle)",  count: JAVA_API.filter(a => a.category === "Collections").length },
  Atomics:     { color: "var(--gold)",  bg: "var(--gold-subtle)",  count: JAVA_API.filter(a => a.category === "Atomics").length },
  Locks:       { color: "var(--red)",   bg: "var(--red-subtle)",   count: JAVA_API.filter(a => a.category === "Locks").length },
  Misc:        { color: "var(--ink-3)", bg: "var(--paper-2)",      count: JAVA_API.filter(a => a.category === "Misc").length },
};
