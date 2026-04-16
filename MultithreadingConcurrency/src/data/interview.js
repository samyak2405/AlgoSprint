export const INTERVIEW_QUESTIONS = [
  {
    id: "q1",
    category: "Fundamentals",
    question: "What is the difference between a process and a thread?",
    answer: "A process is an independent execution environment with its own memory space (heap, stack, code, data). A thread is a unit of execution within a process — all threads in a process share the same heap but each has its own stack. Context switching between threads in the same process is cheaper than between processes (no MMU/TLB flush).",
    trap: "Don't say threads are 'lightweight processes' without explaining the shared memory — the interviewer may probe on what sharing means for thread safety.",
    keyPoints: ["Shared heap — source of all concurrency bugs", "Private stack per thread", "Process isolation vs thread communication speed tradeoff"],
  },
  {
    id: "q2",
    category: "Fundamentals",
    question: "What is a race condition? Give a concrete Java example.",
    answer: "A race condition occurs when the program's output depends on the non-deterministic timing of multiple threads. Classic example: i++ is not atomic — it's three operations (read, increment, write). Two threads incrementing a shared counter lose updates when they both read the same value, both add 1, and both write the same result.",
    trap: "Many candidates say 'volatile fixes it' — but volatile only fixes visibility, not atomicity. i++ on a volatile int is still a race. Use AtomicInteger.incrementAndGet() for correct atomic increment.",
    keyPoints: ["Check-then-act race", "Read-modify-write race", "Fixes: AtomicInteger, synchronized, or avoid sharing"],
    code: `// Race condition: counter value after 1000 increments from 2 threads
// may be anywhere from 1001 to 2000 (not deterministic)
int counter = 0; // shared
Thread t1 = new Thread(() -> { for (int i=0;i<1000;i++) counter++; });
Thread t2 = new Thread(() -> { for (int i=0;i<1000;i++) counter++; });
// Fix:
AtomicInteger atomicCounter = new AtomicInteger(0);
Thread t3 = new Thread(() -> { for(int i=0;i<1000;i++) atomicCounter.incrementAndGet(); });`,
  },
  {
    id: "q3",
    category: "Synchronization",
    question: "What is the difference between synchronized and volatile?",
    answer: "synchronized provides both mutual exclusion (only one thread enters a block at a time) AND visibility (changes made inside a synchronized block are visible to subsequent threads entering the same synchronized block). volatile provides ONLY visibility — a write to a volatile variable is immediately visible to all threads, but it provides NO atomicity for compound operations.",
    trap: "i++ on a volatile int is STILL a race condition. volatile ensures other threads see the latest value, but two threads can still both read the same value and both write the incremented version.",
    keyPoints: ["volatile = visibility only", "synchronized = visibility + mutual exclusion", "volatile write HB volatile read (JMM)", "Use volatile for simple flags; synchronized for compound operations"],
  },
  {
    id: "q4",
    category: "Deadlock",
    question: "What are the four Coffman conditions for deadlock? How do you prevent it?",
    answer: "The four Coffman conditions that must ALL hold for deadlock: (1) Mutual exclusion — resources are not shareable. (2) Hold-and-wait — a thread holds one resource while waiting for another. (3) No preemption — resources cannot be forcibly taken. (4) Circular wait — there is a circular chain of threads each waiting for a resource held by the next. Break ANY one condition to prevent deadlock. In Java: use tryLock() with timeout (breaks hold-and-wait), acquire locks in a consistent global order (breaks circular wait).",
    trap: "Interviewers often ask for a concrete code example of deadlock then ask how you'd fix it. Prepare the two-thread, two-lock deadlock and the tryLock() fix.",
    keyPoints: ["All four conditions must hold simultaneously", "Lock ordering prevents circular wait", "tryLock() breaks hold-and-wait", "Timeouts prevent indefinite blocking"],
    code: `// Classic deadlock:
synchronized (lockA) { synchronized (lockB) { ... } } // Thread 1
synchronized (lockB) { synchronized (lockA) { ... } } // Thread 2 — DEADLOCK

// Fix 1: consistent lock ordering
synchronized (lockA) { synchronized (lockB) { ... } } // both threads same order

// Fix 2: tryLock() — breaks hold-and-wait
if (lockA.tryLock(100, MILLISECONDS)) {
    try {
        if (lockB.tryLock(100, MILLISECONDS)) {
            try { ... } finally { lockB.unlock(); }
        }
    } finally { lockA.unlock(); }
}`,
  },
  {
    id: "q5",
    category: "Java API",
    question: "When would you use CountDownLatch vs CyclicBarrier vs Semaphore?",
    answer: "CountDownLatch: One-shot wait for N events. Best for 'wait until N things are done'. CyclicBarrier: Reusable rendezvous point where N threads wait for each other before proceeding. Best for multi-phase parallel algorithms. Semaphore: Controls concurrent access to a resource pool (N permits). Best for throttling, rate limiting, and resource pools. Key differences: CountDownLatch is one-shot; CyclicBarrier resets; Semaphore doesn't wait for all — it limits concurrency.",
    trap: "CyclicBarrier is for threads waiting for EACH OTHER at the same point. CountDownLatch is for one or more threads waiting for events in other threads (asymmetric). Semaphore doesn't coordinate phases at all.",
    keyPoints: ["CountDownLatch: one-shot, N events", "CyclicBarrier: N threads meet, reusable", "Semaphore: resource pool, N permits"],
  },
  {
    id: "q6",
    category: "Java API",
    question: "Explain CompletableFuture. What's the difference between thenApply and thenCompose?",
    answer: "CompletableFuture is Java 8's async pipeline API. thenApply transforms the result with a Function<T,R> — the mapping function returns a plain value, resulting in CompletableFuture<R>. thenCompose is flat-map — the function returns a CompletableFuture<R>, and thenCompose unwraps the nested future to give CompletableFuture<R> instead of CompletableFuture<CompletableFuture<R>>.",
    trap: "The most common mistake: using thenApply when the transformation is async (returns a CF). This gives you CompletableFuture<CompletableFuture<T>> — a nested future that must be manually joined.",
    keyPoints: ["thenApply = map (sync transform)", "thenCompose = flatMap (async transform)", "Async suffix runs on ForkJoinPool unless executor specified"],
    code: `// thenApply: transform to another type (function returns plain value)
CompletableFuture<String> name = cf.thenApply(user -> user.getName());

// thenCompose: chain to another async step (function returns CF)
CompletableFuture<Orders> orders = fetchUser().thenCompose(user -> fetchOrders(user.id));
// NOT: thenApply — that gives CF<CF<Orders>>`,
  },
  {
    id: "q7",
    category: "Performance",
    question: "What is false sharing and how do you avoid it?",
    answer: "False sharing occurs when two independent variables share the same CPU cache line (~64 bytes). When Thread A writes to variable X and Thread B writes to variable Y, and they share a cache line, the entire cache line is invalidated on both CPUs — causing constant cache invalidation traffic even though the variables are logically independent.",
    trap: "False sharing doesn't cause correctness issues — results are always correct. It causes PERFORMANCE issues (10–100x slowdown under contention). Profile first, then apply padding.",
    keyPoints: ["Cache line = ~64 bytes", "Padding or @Contended annotation isolates variables", "LongAdder uses striped cells to avoid false sharing on accumulators", "Only matters for HOT variables written by multiple threads"],
    code: `// Bad: x and y share a cache line — Thread A writing x invalidates Thread B's cache
long x; long y;

// Fix 1: padding between variables
long x; long p1,p2,p3,p4,p5,p6,p7; // 7 × 8 bytes = 56 bytes padding
long y;

// Fix 2: @Contended (JVM adds padding automatically — need -XX:-RestrictContended)
@jdk.internal.vm.annotation.Contended
long x;
@jdk.internal.vm.annotation.Contended
long y;

// Fix 3: Use LongAdder (already designed to avoid false sharing internally)`,
  },
  {
    id: "q8",
    category: "Java API",
    question: "What is ThreadLocal? What is the memory leak risk?",
    answer: "ThreadLocal provides a per-thread variable — each thread has its own isolated copy. No synchronization needed since threads never share the value. The memory leak risk: thread-pool threads are reused and never die. If you call ThreadLocal.set() without a matching remove() in a finally block, the value stays alive on the thread indefinitely — even after the task completes. In web containers (Tomcat), a leaked ThreadLocal entry pointing to an application class prevents the webapp's ClassLoader from being GC'd on redeployment.",
    trap: "InheritableThreadLocal doesn't solve thread-pool context propagation — pooled threads are created by the pool, not the submitting thread. The submitting thread's ThreadLocal values are not inherited.",
    keyPoints: ["Per-thread copy — no synchronization", "MUST call remove() in finally for pool threads", "ClassLoader leak in web containers", "ScopedValue (Java 21+) solves leaks by design"],
    code: `// CORRECT pattern: always remove in finally
USER_CONTEXT.set(user);
try {
    processRequest();
} finally {
    USER_CONTEXT.remove(); // prevents cross-request contamination
}`,
  },
  {
    id: "q9",
    category: "Modern Java",
    question: "What are virtual threads? When should (and shouldn't) you use them?",
    answer: "Virtual threads (Java 21) are JVM-managed threads that are multiplexed onto a small pool of OS 'carrier' threads. They cost ~few KB vs ~512KB for platform threads, and when a virtual thread blocks on I/O, it unmounts from the carrier (freeing it). This allows millions of concurrent virtual threads with the same number of CPU cores. Use when: I/O-bound services with high concurrency (REST clients, database queries, file I/O). Don't use when: CPU-bound work (no benefit), or with synchronized blocks doing I/O (pins carrier thread).",
    trap: "Virtual threads give ZERO benefit for CPU-bound work. The number of carrier threads equals the number of CPUs — the same parallelism as a fixed platform thread pool.",
    keyPoints: ["Light to create — millions per JVM", "Blocking I/O unmounts from carrier", "synchronized + I/O pins carrier — use ReentrantLock", "Do NOT pool — create one per task"],
  },
  {
    id: "q10",
    category: "Patterns",
    question: "How do you implement a thread-safe Producer-Consumer pattern?",
    answer: "The cleanest solution: BlockingQueue. Producer calls put() (blocks when full); consumer calls take() (blocks when empty). No explicit synchronization needed. For stop signal, use a poison pill. Low-level solution with synchronized: shared buffer + while loop + wait/notifyAll. ReentrantLock + two Conditions (notFull, notEmpty) allows more precise signalling.",
    trap: "Don't use if-wait — always use while-wait for re-checking the condition after wakeup (spurious wakeups are allowed). Don't use notify() when multiple producers and consumers share the condition — it might wake the wrong thread type.",
    keyPoints: ["BlockingQueue = correct, simple, production-ready", "while-wait not if-wait (spurious wakeups)", "Poison pill: one per consumer thread", "Two Conditions: notFull for producers, notEmpty for consumers"],
    code: `// Production-ready:
BlockingQueue<Task> queue = new LinkedBlockingQueue<>(100);
producer: queue.put(task); // blocks if full
consumer: Task t = queue.take(); // blocks if empty

// Low-level (for interview demonstration):
synchronized(this) {
    while (queue.isFull()) wait(); // WHILE not IF
    queue.add(item);
    notifyAll();
}`,
  },
  {
    id: "q11",
    category: "Performance",
    question: "What is Amdahl's Law and why does it matter for multithreading?",
    answer: "Amdahl's Law states that the maximum speedup of a program using N processors is limited by its serial fraction: S(N) = 1 / (serial + (1-serial)/N). If 10% of a program is serial, the maximum speedup is 10x regardless of how many CPUs you add. This means: adding threads only helps the parallel portion; synchronization points are serial; lock contention increases serial fraction.",
    trap: "The serial fraction is NOT constant — adding more threads often INCREASES the serial fraction through greater lock contention, false sharing, and coordination overhead.",
    keyPoints: ["Serial fraction is the hard ceiling", "Synchronization = serial", "More threads can make things WORSE via contention", "Profile before parallelizing"],
  },
  {
    id: "q12",
    category: "Java API",
    question: "Explain the difference between execute() and submit() in ExecutorService.",
    answer: "execute(Runnable) submits a task for execution and returns void. Any exception thrown by the task propagates to the thread's UncaughtExceptionHandler — if none is set, it's silently swallowed. submit(Callable<T>) returns a Future<T>. The exception is captured and thrown when you call Future.get() as a checked ExecutionException. submit(Runnable) also returns Future<?> — call get() to detect exceptions.",
    trap: "execute() exceptions are SILENTLY LOST if no UncaughtExceptionHandler is set. This is the #1 cause of 'task disappeared' bugs in thread pool code. Always use submit() for exception visibility.",
    keyPoints: ["execute(): void, exception lost", "submit(): Future<T>, exception in get()", "Always use submit() for visible exception handling", "Future.get() throws ExecutionException — check getCause() for the real exception"],
  },
  {
    id: "q13",
    category: "Synchronization",
    question: "What is the Java Memory Model? What is happens-before?",
    answer: "The Java Memory Model (JMM) specifies when writes by one thread are guaranteed visible to reads by another. 'Happens-before' is the JMM's ordering guarantee: if action A happens-before B, then all memory effects of A are visible to B. Key rules: synchronized unlock HB subsequent lock, volatile write HB subsequent volatile read, Thread.start() HB all actions in started thread, all actions in a thread HB Thread.join(). Without a HB edge, visibility is NOT guaranteed.",
    trap: "Happens-before is NOT about wall-clock time. A write at T=100ms is NOT visible at T=200ms without a HB edge. The JMM is about ordering guarantees, not time.",
    keyPoints: ["8 HB rules", "volatile write HB volatile read (transitively covers prior writes)", "No HB = data race = undefined behavior under JMM", "Transitivity: A HB B HB C → A HB C"],
  },
  {
    id: "q14",
    category: "Patterns",
    question: "How would you implement a read-heavy cache with thread safety?",
    answer: "Several options in increasing complexity: (1) Collections.synchronizedMap — all operations serialized, simple. (2) ConcurrentHashMap — concurrent reads (lock-free), fine-grained write locking. (3) ReentrantReadWriteLock wrapping a HashMap — multiple concurrent readers, exclusive writer. (4) ConcurrentHashMap.computeIfAbsent() — atomic lazy init without external synchronization. For production: Caffeine or Guava Cache.",
    trap: "ConcurrentHashMap individual operations are thread-safe, but compound operations are NOT. containsKey() + put() is a race; use computeIfAbsent() for atomic check-and-populate.",
    keyPoints: ["ConcurrentHashMap.computeIfAbsent() for lazy init", "Multiple concurrent readers → ReentrantReadWriteLock", "Production: Caffeine (lock-free, highly concurrent)", "size() is approximate under concurrent access"],
    code: `// Thread-safe lazy cache:
ConcurrentHashMap<String, Value> cache = new ConcurrentHashMap<>();

Value get(String key) {
    return cache.computeIfAbsent(key, k -> expensiveLoad(k));
    // Atomic: only one thread loads for a given key — others wait at the bin level
}`,
  },
  {
    id: "q15",
    category: "Java API",
    question: "What is the difference between shutdown() and shutdownNow() on an ExecutorService?",
    answer: "shutdown() initiates an orderly shutdown: previously submitted tasks are executed, but no new tasks are accepted. The method returns immediately — use awaitTermination() to block until complete. shutdownNow() attempts to stop all actively executing tasks by interrupting them, halts processing of waiting tasks, and returns the list of tasks that were awaiting execution. Tasks that don't respond to interruption continue running.",
    trap: "shutdownNow() does NOT kill threads. It calls interrupt() on running threads — which only works if the task checks isInterrupted() or calls a blocking method that throws InterruptedException. A busy-looping task will not stop.",
    keyPoints: ["shutdown(): graceful, waits for running tasks", "shutdownNow(): interrupt running tasks, return queued tasks", "Always pair with awaitTermination()", "Interrupted tasks must cooperate (check isInterrupted)"],
    code: `executor.shutdown();
try {
    if (!executor.awaitTermination(30, TimeUnit.SECONDS)) {
        List<Runnable> dropped = executor.shutdownNow();
        log.warn("{} tasks were dropped", dropped.size());
    }
} catch (InterruptedException e) {
    executor.shutdownNow();
    Thread.currentThread().interrupt();
}`,
  },
];

export const INTERVIEW_TRAPS = [
  {
    trap: "i++ on volatile is a race condition",
    detail: "volatile gives visibility, not atomicity. Read-modify-write operations (i++, i+=N) are still races on volatile. Use AtomicInteger.incrementAndGet().",
  },
  {
    trap: "notify() vs notifyAll() — wrong choice blocks threads",
    detail: "notify() wakes ONE arbitrary thread. If you have multiple producer/consumer threads and notify() wakes a producer when you need a consumer, that consumer stays blocked. Use notifyAll() unless all waiting threads are identical.",
  },
  {
    trap: "if-wait instead of while-wait",
    detail: "Spurious wakeups are allowed. If you use if(condition) wait(), a spurious wakeup breaks the guard. Always use while(condition) wait().",
  },
  {
    trap: "ThreadPoolExecutor grows beyond corePoolSize only when queue is FULL",
    detail: "Most developers expect: fill cores → grow to max → fill queue. Actual: fill cores → fill queue → grow to max → reject. An unbounded queue prevents growth beyond corePoolSize.",
  },
  {
    trap: "CompletableFuture.cancel() does NOT interrupt the thread",
    detail: "cancel(true) marks the future cancelled but does NOT interrupt the underlying computation. The task continues to completion.",
  },
  {
    trap: "synchronized on String literals shares locks globally",
    detail: "String literals are interned — synchronized('lock') shares the same monitor object with ANY other class using the same literal. This causes mysterious cross-class deadlocks.",
  },
  {
    trap: "execute() swallows exceptions silently",
    detail: "Exceptions from execute(Runnable) go to UncaughtExceptionHandler. If not set, they are printed to stderr and LOST. Use submit() to get exceptions via Future.get().",
  },
  {
    trap: "StampedLock is NOT reentrant",
    detail: "Unlike ReentrantLock, a thread that calls readLock() while already holding a read stamp will DEADLOCK. Never use StampedLock in recursive code.",
  },
  {
    trap: "Virtual threads give zero benefit for CPU-bound work",
    detail: "The number of carrier threads = number of CPUs. CPU-bound virtual threads compete for the same carriers as platform threads. No parallelism benefit.",
  },
  {
    trap: "ThreadLocal without remove() leaks in thread pools",
    detail: "Thread-pool threads live forever. A ThreadLocal.set() without remove() leaves the value on the thread permanently, causing memory leaks and cross-request data contamination.",
  },
];

export const DESIGN_TEMPLATES = [
  {
    title: "Thread-Safe Counter",
    when: "When multiple threads increment/decrement a shared counter",
    solution: "AtomicLong.incrementAndGet() for simple counters. LongAdder for very high contention (striped cells). synchronized block if you need compound operations.",
    code: `// Simple: AtomicLong
AtomicLong counter = new AtomicLong();
counter.incrementAndGet();

// High contention: LongAdder
LongAdder hits = new LongAdder();
hits.increment();
long total = hits.sum(); // slightly approximate under concurrent writes`,
  },
  {
    title: "Thread-Safe Cache",
    when: "Lazy initialization of expensive objects, shared across threads",
    solution: "ConcurrentHashMap.computeIfAbsent() for per-key lazy init. Initialization-on-Demand Holder for a singleton. For full cache with eviction: Caffeine.",
    code: `ConcurrentHashMap<String, Data> cache = new ConcurrentHashMap<>();

Data get(String key) {
    return cache.computeIfAbsent(key, k -> loadFromDB(k));
}`,
  },
  {
    title: "Producer-Consumer Queue",
    when: "Decoupling work producers from workers, backpressure needed",
    solution: "LinkedBlockingQueue with bounded capacity. put() blocks producers when full (backpressure). take() blocks consumers when empty. Use poison pill for shutdown.",
    code: `BlockingQueue<Task> queue = new LinkedBlockingQueue<>(1000);
// Producer: queue.put(task); — blocks if full
// Consumer: Task t = queue.take(); — blocks if empty
// Stop: queue.put(POISON_PILL); (one per consumer thread)`,
  },
  {
    title: "Parallel Fan-Out",
    when: "Call N services concurrently and collect all results",
    solution: "Java 21+: StructuredTaskScope.ShutdownOnFailure. Earlier: CompletableFuture.allOf(). The structured version auto-cancels on failure.",
    code: `// Java 21+:
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    var a = scope.fork(() -> serviceA.call());
    var b = scope.fork(() -> serviceB.call());
    scope.join(); scope.throwIfFailed();
    return new Result(a.get(), b.get());
}`,
  },
  {
    title: "Rate Limiter",
    when: "Throttle concurrent access to a resource (API calls, DB connections)",
    solution: "Semaphore(N) limits concurrent access. tryAcquire(timeout) for non-blocking rejection. For rate-per-second: Guava RateLimiter or token bucket pattern.",
    code: `Semaphore sem = new Semaphore(10, true); // 10 concurrent max

void callApi() throws InterruptedException {
    sem.acquire();
    try { call(); } finally { sem.release(); }
}

// Non-blocking:
if (!sem.tryAcquire(100, MILLISECONDS)) {
    throw new TooManyRequestsException();
}`,
  },
];
