export const JAVA_API = [
  // ─────────────────── THREAD API ─────────────────────────────────────────
  {
    id: "thread-class-methods",
    title: "Thread Class — Core Methods",
    category: "Thread API",
    tags: ["Thread", "start", "sleep", "join", "interrupt", "yield", "daemon", "priority", "currentThread"],
    purpose:
      "The Thread class is the foundation of Java concurrency. Its methods control thread lifecycle (start, join), communication (interrupt, sleep), identity (getName, getId, currentThread), and scheduler hints (yield, priority, daemon).",
    signature: `// Lifecycle
Thread.start()                    // schedule thread for execution (ONE TIME only)
Thread.join()                     // block caller until this thread finishes
Thread.join(long millis)          // block with timeout; returns even if not done
Thread.isAlive()                  // true if started and not yet terminated

// Sleeping & yielding
Thread.sleep(long millis)         // static — sleep current thread (keeps locks)
Thread.sleep(long millis, int ns) // nanosecond precision
Thread.yield()                    // static — hint: relinquish CPU time slice

// Interruption
thread.interrupt()                // set interrupt flag on target thread
Thread.interrupted()              // static — check & CLEAR flag on current thread
thread.isInterrupted()            // check flag WITHOUT clearing it

// Identity & state
Thread.currentThread()            // static — returns reference to running thread
thread.getId()                    // unique long ID
thread.getName() / setName(s)
thread.getState()                 // Thread.State enum
thread.getStackTrace()            // snapshot of current call stack

// Configuration (must set BEFORE start())
thread.setDaemon(boolean)         // true = killed when non-daemon threads finish
thread.setPriority(int)           // 1 (MIN) … 5 (NORM) … 10 (MAX) — hint only
thread.setUncaughtExceptionHandler(handler)
thread.getThreadGroup()`,
    codeExamples: [
      {
        title: "start() and join() — Basic Thread Control",
        description: "start() schedules the thread; run() executes in the new thread. join() blocks the calling thread until the target terminates. Calling start() twice on the same thread throws IllegalThreadStateException.",
        code: `Thread worker = new Thread(() -> {
    System.out.println("Worker running: " + Thread.currentThread().getName());
    try { Thread.sleep(500); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    System.out.println("Worker done");
}, "my-worker");

worker.start();       // schedules worker on a new OS thread
// worker.start();    // IllegalThreadStateException — can't start twice

System.out.println("Main continues while worker runs");
worker.join();        // blocks main until worker terminates
System.out.println("Worker state after join: " + worker.getState()); // TERMINATED
System.out.println("Main resumes");`,
      },
      {
        title: "Thread.sleep() — Pause Without CPU Spinning",
        description: "sleep() suspends the current thread for at least the given time. It holds all locks — other threads wanting the same synchronized block will still be blocked. Always catch InterruptedException and restore the interrupt flag.",
        code: `// Pause the current thread — does NOT release any held locks
try {
    Thread.sleep(2000);          // sleep 2 seconds
    Thread.sleep(500, 999_000);  // 500ms + 999,999 nanoseconds (nanosecond precision)
} catch (InterruptedException e) {
    Thread.currentThread().interrupt(); // restore interrupt flag — never swallow it
    return; // decide whether to exit or continue
}

// sleep() inside synchronized — BAD for other threads wanting the same lock
synchronized (myLock) {
    Thread.sleep(1000); // myLock is held for 1 second — other threads are BLOCKED
}

// Alternative: Object.wait() releases the lock while waiting
synchronized (myLock) {
    myLock.wait(1000); // lock released during wait — other threads CAN enter
}`,
      },
      {
        title: "interrupt() / isInterrupted() — Cooperative Cancellation",
        description: "interrupt() sets a flag. Blocking methods detect it and throw InterruptedException. Non-blocking loops must check isInterrupted() manually. Use interrupted() (static, clears flag) only when you want to consume the interrupt and not propagate it.",
        code: `Thread worker = new Thread(() -> {
    while (!Thread.currentThread().isInterrupted()) {  // check in non-blocking loop
        processItem();
    }
    System.out.println("Exiting — interrupted flag was set");
});
worker.start();

// Interrupt from another thread
worker.interrupt(); // sets flag — thread will notice on next isInterrupted() check

// isInterrupted(): check WITHOUT clearing the flag
worker.isInterrupted(); // just peek

// Thread.interrupted(): check AND CLEAR the flag (static, acts on current thread)
boolean wasInterrupted = Thread.interrupted(); // flag is now false

// Difference: always prefer isInterrupted() unless you explicitly want to consume it
// Never swallow InterruptedException without restoring the flag:
try { Thread.sleep(1000); }
catch (InterruptedException e) {
    Thread.currentThread().interrupt(); // restore flag
    throw new RuntimeException("Interrupted", e); // or return/cleanup
}`,
      },
      {
        title: "Daemon Threads and UncaughtExceptionHandler",
        description: "Daemon threads are background threads that the JVM silently kills when all non-daemon threads exit. setDaemon() must be called before start(). UncaughtExceptionHandler lets you log crashes instead of silently losing them.",
        code: `// Daemon thread — JVM won't wait for it to finish
Thread heartbeat = new Thread(() -> {
    while (true) {
        try { sendHeartbeat(); Thread.sleep(5000); }
        catch (InterruptedException e) { break; }
    }
}, "heartbeat");
heartbeat.setDaemon(true); // MUST be before start()
heartbeat.start();

// UncaughtExceptionHandler — catch crashes from any thread
Thread worker = new Thread(() -> {
    throw new RuntimeException("Something broke");
});
worker.setUncaughtExceptionHandler((t, ex) -> {
    System.err.println("Thread " + t.getName() + " threw: " + ex.getMessage());
    // log to monitoring system, alert, etc.
});
worker.start();

// Default handler for all threads (global fallback)
Thread.setDefaultUncaughtExceptionHandler((t, ex) ->
    log.error("Unhandled exception in thread {}", t.getName(), ex)
);`,
      },
      {
        title: "currentThread(), getName(), getState(), getStackTrace()",
        description: "Thread.currentThread() gives you a reference to the running thread from anywhere — useful for naming, logging, and interrupt checks. getState() returns the Thread.State enum; getStackTrace() gives a live snapshot for diagnostics.",
        code: `// currentThread() — get a reference to the thread you're currently running in
Thread me = Thread.currentThread();
System.out.println(me.getName());       // thread name
System.out.println(me.getId());         // unique numeric ID
System.out.println(me.isDaemon());      // daemon status
System.out.println(me.getPriority());   // 1-10

// getState() — useful for monitoring and debugging
Thread.State state = worker.getState();
switch (state) {
    case NEW          -> System.out.println("Not started");
    case RUNNABLE     -> System.out.println("Running or ready");
    case BLOCKED      -> System.out.println("Waiting for a lock");
    case WAITING      -> System.out.println("Waiting indefinitely (wait/join/park)");
    case TIMED_WAITING -> System.out.println("Waiting with timeout");
    case TERMINATED   -> System.out.println("Finished");
}

// getStackTrace() — diagnostic snapshot (expensive; use for debugging only)
StackTraceElement[] stack = worker.getStackTrace();
for (StackTraceElement frame : stack) {
    System.out.println("  at " + frame);
}`,
      },
    ],
    pitfalls: [
      "Never call run() directly — it executes in the CURRENT thread, not a new one. Always call start().",
      "start() can only be called once. To rerun a task, create a new Thread or resubmit to an ExecutorService.",
      "Thread.sleep() holds locks — never sleep inside a synchronized block if other threads need the lock.",
      "Thread.interrupted() (static) clears the flag; thread.isInterrupted() (instance) does not. Mixing them up causes bugs.",
      "Thread priorities are JVM hints only — the OS may ignore them entirely. Never rely on priorities for program correctness.",
    ],
  },

  {
    id: "object-monitor-methods",
    title: "Object Monitor Methods — wait / notify / notifyAll",
    category: "Thread API",
    tags: ["wait", "notify", "notifyAll", "monitor", "intrinsic lock", "condition"],
    purpose:
      "Every Java object is a monitor with a built-in condition queue. wait() atomically releases the lock and suspends the calling thread until another thread calls notify() or notifyAll() on the same object. These are the lowest-level inter-thread signalling primitives in Java.",
    signature: `// All must be called while holding the lock on 'obj' (inside synchronized(obj))
obj.wait()                    // release lock; suspend until notify/notifyAll
obj.wait(long millis)         // release lock; suspend until notify OR timeout
obj.wait(long millis, int ns) // nanosecond precision timeout

obj.notify()                  // wake ONE arbitrary waiting thread (re-acquires lock before running)
obj.notifyAll()               // wake ALL waiting threads (each re-acquires lock before running)

// Called without holding the lock → throws IllegalMonitorStateException`,
    codeExamples: [
      {
        title: "wait() / notifyAll() — The Correct Template",
        description: "The canonical pattern: always call wait() in a while loop that re-checks the condition. This guards against spurious wakeups (JVM may wake a thread without notify()) and wrong-side wakeups (a thread on the same lock for a different condition).",
        code: `class SharedBuffer {
    private final List<Integer> items = new ArrayList<>();
    private final int MAX = 10;

    // Producer
    public synchronized void produce(int item) throws InterruptedException {
        while (items.size() == MAX) {   // WHILE — not IF (re-check after wakeup)
            wait();                     // atomically: release lock AND suspend
        }
        items.add(item);
        notifyAll();                    // wake all threads waiting on 'this'
    }

    // Consumer
    public synchronized int consume() throws InterruptedException {
        while (items.isEmpty()) {       // WHILE — not IF
            wait();
        }
        int item = items.remove(0);
        notifyAll();                    // wake all threads waiting on 'this'
        return item;
    }
}

// Pattern to remember:
// synchronized (lock) {
//     while (!condition) lock.wait();  // always while loop
//     // ... do the work ...
//     lock.notifyAll();
// }`,
      },
      {
        title: "Timed wait() — Wait with a Deadline",
        description: "wait(millis) behaves like wait() but also returns after the timeout. Always re-check the condition after returning — you don't know if it was a notify or a timeout.",
        code: `class RequestHandler {
    private String response = null;

    public synchronized String waitForResponse(long timeoutMs)
            throws InterruptedException {
        long deadline = System.currentTimeMillis() + timeoutMs;

        while (response == null) {
            long remaining = deadline - System.currentTimeMillis();
            if (remaining <= 0) {
                throw new TimeoutException("No response in " + timeoutMs + "ms");
            }
            wait(remaining); // re-check after each wake (notify or timeout)
        }
        return response;
    }

    public synchronized void setResponse(String r) {
        this.response = r;
        notifyAll();
    }
}`,
      },
      {
        title: "notify() vs notifyAll() — When Each Is Safe",
        description: "notify() is a targeted optimization: safe only when all waiters are interchangeable (same condition, any one can proceed). notifyAll() is always safe. Prefer notifyAll() unless you have a measured performance reason.",
        code: `class ResourcePool {
    private final Queue<Resource> available = new ArrayDeque<>();

    // notifyAll: correct here — all waiters want 'any available resource'
    public synchronized void release(Resource r) {
        available.add(r);
        notifyAll(); // wake all; each checks available.isEmpty() and one takes it

        // notify() would ALSO work here because all waiters are identical
        // But notifyAll() is safer if the code ever gets more complex
    }

    public synchronized Resource acquire() throws InterruptedException {
        while (available.isEmpty()) wait();
        return available.poll();
    }
}

// When notify() is WRONG:
class MessageBox {
    private String msg;

    // TWO types of waiters: senders (wait for null) and receivers (wait for non-null)
    public synchronized void send(String m) throws InterruptedException {
        while (msg != null) wait();
        msg = m;
        notify(); // DANGEROUS: may wake another sender instead of the receiver!
        // notifyAll() is correct here
    }
}`,
      },
      {
        title: "IllegalMonitorStateException — The Lock Rule",
        description: "wait(), notify(), and notifyAll() must be called while holding the lock on 'this' (or the specific object). Calling them without the lock throws IllegalMonitorStateException at runtime — the compiler won't catch it.",
        code: `Object lock = new Object();

// CORRECT — inside synchronized block on 'lock'
synchronized (lock) {
    lock.wait();      // fine — we hold 'lock'
    lock.notify();    // fine
    lock.notifyAll(); // fine
}

// WRONG — not inside synchronized block
lock.wait();   // throws IllegalMonitorStateException at runtime

// WRONG — synchronized on the wrong object
synchronized (this) {
    lock.wait(); // throws! We hold 'this', not 'lock'
}

// Rule: the object you call wait/notify on must be the one you synchronized on`,
      },
    ],
    pitfalls: [
      "Always use while(condition) wait() — never if(condition) wait(). Spurious wakeups are specified in the JVM spec.",
      "wait() and notify() require the lock — call without it and you get IllegalMonitorStateException at runtime (compiler doesn't catch this).",
      "notifyAll() is almost always safer than notify(). Use notify() only as a deliberate optimization after proving all waiters are identical.",
      "Prefer java.util.concurrent.locks.Condition (from ReentrantLock) for new code — it supports multiple condition queues on one lock and is more debuggable.",
    ],
  },

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
    codeExamples: [
      {
        title: "Submit a Callable and Get the Result",
        description: "submit() returns a Future. The task runs asynchronously in a pool thread. future.get() blocks until done — always use the timeout overload to prevent hanging forever.",
        code: `import java.util.concurrent.*;

ExecutorService pool = Executors.newFixedThreadPool(
    Runtime.getRuntime().availableProcessors() + 1
);

Future<Integer> future = pool.submit(() -> {
    Thread.sleep(100);
    return 42;
});

// Do other work while the task runs concurrently...
System.out.println("Task is running in background");

// Block until result is ready (use timeout to avoid hanging forever)
int result = future.get(5, TimeUnit.SECONDS);
System.out.println("Result: " + result);

// Always shut down — an unshut executor keeps the JVM alive
pool.shutdown();
if (!pool.awaitTermination(10, TimeUnit.SECONDS)) {
    pool.shutdownNow();
}`,
      },
      {
        title: "Factory Methods — Choosing the Right Pool Type",
        description: "Executors provides convenience factory methods for common thread pool configurations. Pick the type that matches your workload's characteristics.",
        code: `// Fixed pool: bounded, predictable resource usage — good for CPU-bound tasks
ExecutorService fixed = Executors.newFixedThreadPool(4);

// Cached pool: creates threads on demand, reuses idle ones — good for bursts of short tasks
// WARNING: unbounded — can exhaust OS threads under sustained load
ExecutorService cached = Executors.newCachedThreadPool();

// Single thread: serial execution, ordered — good for event queues
ExecutorService single = Executors.newSingleThreadExecutor();

// Scheduled: run tasks after a delay or at fixed intervals
ScheduledExecutorService sched = Executors.newScheduledThreadPool(2);
sched.scheduleAtFixedRate(() -> healthCheck(), 0, 30, TimeUnit.SECONDS);`,
      },
    ],
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
    codeExamples: [
      {
        title: "Basic Pipeline — thenApply and exceptionally",
        description: "thenApply transforms the result synchronously in the same thread. exceptionally catches any exception in the pipeline and provides a fallback value.",
        code: `import java.util.concurrent.*;

CompletableFuture<String> pipeline =
    CompletableFuture.supplyAsync(() -> fetchUserId("alice"))   // runs async
        .thenApply(id   -> fetchUserProfile(id))                // transform result
        .thenApply(prof -> "Hello, " + prof.getName())          // chain transforms
        .exceptionally(ex -> "Error: " + ex.getMessage());     // fallback on any error

String result = pipeline.get(); // blocks until complete`,
      },
      {
        title: "thenCompose — Flat-Mapping Async Steps",
        description: "Use thenCompose when the next step itself returns a CompletableFuture. thenApply would give you a nested CompletableFuture<CompletableFuture<T>> — thenCompose flattens it.",
        code: `// thenApply: mapping function returns a plain value
CompletableFuture<String> cf1 =
    CompletableFuture.supplyAsync(() -> "hello")
        .thenApply(s -> s.toUpperCase()); // String → String → CompletableFuture<String>

// thenCompose: mapping function returns a CompletableFuture
CompletableFuture<Order> cf2 =
    CompletableFuture.supplyAsync(() -> fetchUserId("alice"))
        .thenCompose(id -> fetchOrdersAsync(id)); // avoids CF<CF<Order>>`,
      },
      {
        title: "thenCombine — Merging Two Independent Futures",
        description: "thenCombine runs two CompletableFutures concurrently and merges their results with a BiFunction when both complete. Use this instead of sequential calls.",
        code: `// Both futures run concurrently — not sequentially
CompletableFuture<Double>  price = CompletableFuture.supplyAsync(() -> fetchPrice("AAPL"));
CompletableFuture<Integer> qty   = CompletableFuture.supplyAsync(() -> fetchQuantity("AAPL"));

// Merge when both complete
CompletableFuture<Double> total = price.thenCombine(qty, (p, q) -> p * q);
System.out.println("Total: " + total.get());`,
      },
      {
        title: "allOf — Fan-Out Pattern (Wait for All)",
        description: "allOf waits for all futures to complete. Note: it returns CompletableFuture<Void>, so you must collect individual results manually via join().",
        code: `List<CompletableFuture<String>> futures = List.of(
    CompletableFuture.supplyAsync(() -> callServiceA()),
    CompletableFuture.supplyAsync(() -> callServiceB()),
    CompletableFuture.supplyAsync(() -> callServiceC())
);

CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
    .thenRun(() -> {
        // All three have completed — safe to call join() (won't block)
        List<String> results = futures.stream()
            .map(CompletableFuture::join)
            .collect(Collectors.toList());
        System.out.println(results);
    });`,
      },
    ],
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
    codeExamples: [
      {
        title: "Pattern 1 — Wait for N Tasks to Complete",
        description: "Initialize the latch with the number of tasks. Each task calls countDown() in its finally block. The main thread calls await() and unblocks when all tasks have counted down to 0.",
        code: `import java.util.concurrent.*;

int N = 5;
CountDownLatch doneSignal = new CountDownLatch(N);
ExecutorService pool = Executors.newFixedThreadPool(N);

for (int i = 0; i < N; i++) {
    final int taskId = i;
    pool.execute(() -> {
        try {
            doWork(taskId);
        } finally {
            doneSignal.countDown(); // ALWAYS in finally — even on exception
        }
    });
}

doneSignal.await(); // blocks until count reaches 0 (all 5 tasks done)
System.out.println("All tasks complete!");`,
      },
      {
        title: "Pattern 2 — Starting Pistol (Release All at Once)",
        description: "Initialize with count=1. All threads call await() and park. When the starter calls countDown(), all N threads are released simultaneously — useful for load testing or race-condition tests.",
        code: `int N = 10;
CountDownLatch startSignal = new CountDownLatch(1);

for (int i = 0; i < N; i++) {
    new Thread(() -> {
        try {
            startSignal.await(); // all threads wait at the start line
            doWork();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }).start();
}

// ... do any setup work here while threads wait ...
System.out.println("Ready — GO!");
startSignal.countDown(); // releases ALL N threads simultaneously — count goes 1→0`,
      },
    ],
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

  {
    id: "phaser",
    title: "Phaser",
    category: "Synchronizers",
    tags: ["Phaser", "phases", "dynamic parties", "arrive", "advance"],
    purpose:
      "A reusable, flexible synchronization barrier that supports dynamic registration of parties and multiple named phases. More powerful than CyclicBarrier — parties can register/deregister at runtime, and you can query and skip phases.",
    signature: `new Phaser(int parties)
phaser.register()              // add one more party dynamically
phaser.bulkRegister(int n)     // add n parties at once
phaser.arrive()                // record arrival WITHOUT waiting for others
phaser.arriveAndAwaitAdvance() // arrive AND wait for all parties (like CyclicBarrier.await())
phaser.arriveAndDeregister()   // arrive and permanently remove self from future phases
phaser.awaitAdvance(int phase) // wait for a specific phase to complete
phaser.getPhase()              // current phase number (starts at 0)
phaser.getRegisteredParties()  // total registered
phaser.getArrivedParties()     // how many have arrived so far
phaser.isTerminated()          // true if phaser has been terminated`,
    codeExamples: [
      {
        title: "Multi-Phase Algorithm — Parallel Sort",
        description: "Phaser coordinates threads across multiple phases. Each call to arriveAndAwaitAdvance() acts as a phase barrier — all threads synchronize before moving to the next phase.",
        code: `import java.util.concurrent.*;

Phaser phaser = new Phaser(4); // 4 threads registered

for (int t = 0; t < 4; t++) {
    final int id = t;
    new Thread(() -> {
        // Phase 0: each thread sorts its segment
        sortSegment(data, id);
        phaser.arriveAndAwaitAdvance(); // wait for all 4 to finish phase 0

        // Phase 1: merge adjacent sorted segments
        mergeSegments(data, id);
        phaser.arriveAndAwaitAdvance(); // wait for all merges to complete

        // Phase 2: final validation
        validate(data, id);
        phaser.arriveAndDeregister();   // done — deregister from future phases
    }).start();
}`,
      },
      {
        title: "Dynamic Registration — Threads Joining Mid-Execution",
        description: "Unlike CyclicBarrier (fixed parties), Phaser allows parties to register and deregister at runtime. arrive() records arrival without blocking — useful when a thread doesn't need to wait.",
        code: `Phaser phaser = new Phaser(1); // register main thread as 1 party

// Dynamically spawn and register workers
for (int i = 0; i < 5; i++) {
    phaser.register(); // add one more party
    new Thread(() -> {
        doWork();
        phaser.arriveAndDeregister(); // arrive and remove self
    }).start();
}

// Main thread arrives last — triggers phase advance and all workers unblock
phaser.arriveAndAwaitAdvance();
System.out.println("All workers done with phase " + (phaser.getPhase() - 1));

// arrive() without waiting — useful for non-blocking progress tracking
phaser.arrive();    // "I'm done, but I don't need to wait for others"
int currentPhase = phaser.awaitAdvance(phaser.getPhase()); // wait for others later`,
      },
    ],
    pitfalls: [
      "arriveAndDeregister() on the last party terminates the Phaser — subsequent operations throw IllegalStateException.",
      "arrive() does not block; arriveAndAwaitAdvance() does. Use arrive() when you want to 'check in' and continue without waiting.",
      "Phase numbers wrap around at Integer.MAX_VALUE — not a concern in practice but worth knowing.",
    ],
  },

  {
    id: "exchanger",
    title: "Exchanger",
    category: "Synchronizers",
    tags: ["Exchanger", "handoff", "two-thread", "swap", "rendezvous"],
    purpose:
      "A synchronization point for exactly two threads to exchange objects. Each thread calls exchange() and blocks until the other arrives, then both receive each other's object. Useful for pipeline handoffs and two-thread producer-consumer variants.",
    signature: `Exchanger<T> ex = new Exchanger<>();
T result = ex.exchange(myObject)             // block until partner arrives; return partner's object
T result = ex.exchange(myObject, timeout, unit) // with timeout; throws TimeoutException`,
    codeExamples: [
      {
        title: "Double-Buffer Pipeline — Fill and Drain",
        description: "A classic Exchanger use case: one thread fills a buffer while another drains (processes) it. They swap buffers at the synchronization point — no copying needed.",
        code: `import java.util.concurrent.*;

Exchanger<List<String>> exchanger = new Exchanger<>();

// Filler thread: fills a buffer then exchanges for an empty one
Thread filler = new Thread(() -> {
    List<String> buffer = new ArrayList<>();
    try {
        while (true) {
            // Fill this buffer
            for (int i = 0; i < 10; i++) {
                buffer.add(fetchNextItem());
            }
            // Exchange filled buffer for the empty one from the drainer
            buffer = exchanger.exchange(buffer);
            buffer.clear(); // now have the empty buffer back
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    }
}, "filler");

// Drainer thread: processes the filled buffer then exchanges for a new filled one
Thread drainer = new Thread(() -> {
    List<String> buffer = new ArrayList<>(); // starts with empty buffer
    try {
        while (true) {
            // Exchange empty buffer for the filled one from the filler
            buffer = exchanger.exchange(buffer);
            // Process the filled buffer
            buffer.forEach(item -> process(item));
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    }
}, "drainer");

filler.start();
drainer.start();`,
      },
      {
        title: "Timed Exchange — Avoid Deadlock When Partner Never Arrives",
        description: "exchange(obj, timeout, unit) throws TimeoutException if the partner thread doesn't arrive within the timeout. Use this to avoid hanging forever if the other thread has died or is stuck.",
        code: `Exchanger<Integer> exchanger = new Exchanger<>();

Thread t1 = new Thread(() -> {
    try {
        Integer result = exchanger.exchange(42, 5, TimeUnit.SECONDS);
        System.out.println("t1 received: " + result); // from t2
    } catch (TimeoutException e) {
        System.out.println("t1: partner never arrived");
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    }
});

Thread t2 = new Thread(() -> {
    try {
        Thread.sleep(1000); // simulate late arrival — still within 5s timeout
        Integer result = exchanger.exchange(100);
        System.out.println("t2 received: " + result); // 42 from t1
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    }
});

t1.start();
t2.start();`,
      },
    ],
    pitfalls: [
      "Exchanger is strictly two-thread. If three threads call exchange(), the third blocks forever (or times out).",
      "If one thread is interrupted while waiting, the other thread's exchange() throws InterruptedException as well.",
      "For more than two threads or asymmetric patterns, use BlockingQueue or Phaser instead.",
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
    codeExamples: [
      {
        title: "AtomicInteger — Thread-Safe Counter",
        description: "AtomicInteger's methods map directly to hardware CAS instructions. They're lock-free — much faster than synchronized for simple counter operations.",
        code: `import java.util.concurrent.atomic.*;

AtomicInteger counter = new AtomicInteger(0);

counter.incrementAndGet();    // ++i — returns new value
counter.getAndIncrement();    // i++ — returns old value
counter.addAndGet(5);         // i += 5 — returns new value
counter.get();                // plain read`,
      },
      {
        title: "CAS-Based Optimistic Withdrawal",
        description: "compareAndSet(expected, update) atomically updates the value only if it equals expected. If another thread modified it first, CAS returns false and you retry — this is the optimistic locking pattern.",
        code: `AtomicInteger balance = new AtomicInteger(100);

boolean withdraw(int amount) {
    while (true) {
        int current = balance.get();
        if (current < amount) return false;           // insufficient funds
        if (balance.compareAndSet(current, current - amount)) {
            return true;                              // atomic success
        }
        // Another thread modified balance between get() and CAS — retry
    }
}`,
      },
      {
        title: "AtomicReference — Atomic Object Swap",
        description: "AtomicReference makes the reference update atomic — reading the old value and writing the new one is a single CAS. The object pointed to is not protected; make it immutable.",
        code: `AtomicReference<List<String>> cache = new AtomicReference<>(Collections.emptyList());

void updateCache(List<String> newData) {
    // Create an immutable copy, then atomically publish it
    cache.set(Collections.unmodifiableList(new ArrayList<>(newData)));
}

List<String> readCache() {
    return cache.get(); // always returns a consistent, complete list
}`,
      },
      {
        title: "LongAdder — High-Contention Counters",
        description: "LongAdder outperforms AtomicLong under high contention by using striped cells — each thread updates its own cell, reducing CAS failures. sum() aggregates all cells.",
        code: `LongAdder hitCount = new LongAdder();

// Each thread increments its own cell — no contention
hitCount.increment();        // thread-safe, fast under high load
hitCount.add(5);

long total = hitCount.sum(); // aggregates all cells — slightly approximate under concurrent updates
// Use LongAdder instead of AtomicLong when many threads update a single counter`,
      },
    ],
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
    codeExamples: [
      {
        title: "Basic Usage — Always Unlock in finally",
        description: "Unlike synchronized, ReentrantLock requires explicit unlock(). Wrap the critical section in try-finally to guarantee the lock is released even if an exception is thrown.",
        code: `import java.util.concurrent.locks.*;

ReentrantLock lock = new ReentrantLock();

void safeOp() {
    lock.lock();             // acquire lock; blocks until available
    try {
        // critical section — only one thread here at a time
    } finally {
        lock.unlock();       // ALWAYS in finally — must run even on exception
    }
}`,
      },
      {
        title: "tryLock — Deadlock-Safe Resource Transfer",
        description: "tryLock() returns immediately if the lock is unavailable instead of blocking. This allows 'back off and retry' logic that breaks the hold-and-wait deadlock condition.",
        code: `boolean transfer(Account from, Account to, int amount) {
    while (true) {
        if (from.lock.tryLock()) {          // try first lock — non-blocking
            try {
                if (to.lock.tryLock()) {    // try second lock — non-blocking
                    try {
                        from.balance -= amount;
                        to.balance   += amount;
                        return true;
                    } finally { to.lock.unlock(); }
                }
                // Couldn't get second lock — release first and retry
            } finally { from.lock.unlock(); }
        }
        Thread.yield(); // briefly yield before retrying
    }
}`,
      },
      {
        title: "Multiple Conditions — Precise Signalling",
        description: "A single ReentrantLock can have multiple Condition objects. This lets producers wake only consumers (not all threads) and vice versa — more efficient than Object.notifyAll() which wakes everyone.",
        code: `class BoundedBuffer<T> {
    private final ReentrantLock lock    = new ReentrantLock();
    private final Condition     notFull  = lock.newCondition(); // signalled when space opens
    private final Condition     notEmpty = lock.newCondition(); // signalled when item added
    private final Queue<T>      queue    = new LinkedList<>();
    private final int           capacity;

    BoundedBuffer(int cap) { this.capacity = cap; }

    public void put(T item) throws InterruptedException {
        lock.lock();
        try {
            while (queue.size() == capacity) notFull.await(); // park until space
            queue.add(item);
            notEmpty.signal(); // wake exactly ONE consumer — not everyone
        } finally { lock.unlock(); }
    }

    public T take() throws InterruptedException {
        lock.lock();
        try {
            while (queue.isEmpty()) notEmpty.await(); // park until item
            T item = queue.poll();
            notFull.signal();  // wake exactly ONE producer
            return item;
        } finally { lock.unlock(); }
    }
}`,
      },
    ],
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
    id: "lock-support",
    title: "LockSupport — Park & Unpark",
    category: "Locks",
    tags: ["LockSupport", "park", "unpark", "permit", "blocking primitives"],
    purpose:
      "The low-level thread blocking/unblocking primitive that all java.util.concurrent locks (ReentrantLock, Semaphore, etc.) are built on. park() suspends the current thread; unpark(thread) resumes a specific thread. Unlike wait/notify, unpark can be called BEFORE park — the permit is stored.",
    signature: `LockSupport.park()                     // suspend current thread (no lock needed)
LockSupport.park(Object blocker)       // suspend + record a 'blocker' object for diagnostics
LockSupport.parkNanos(long nanos)      // suspend with nanosecond timeout
LockSupport.parkNanos(Object blocker, long nanos)
LockSupport.parkUntil(long deadline)   // suspend until absolute epoch millis
LockSupport.unpark(Thread thread)      // wake the target thread (or store a permit)
LockSupport.getBlocker(Thread t)       // inspect what a thread is parked on`,
    codeExamples: [
      {
        title: "park() and unpark() — Basic Blocking",
        description: "park() suspends the current thread until unpark() is called on it, or the thread is interrupted. Unlike wait(), no lock is required. unpark() can be called before park() — the permit is consumed on the next park() call.",
        code: `import java.util.concurrent.locks.LockSupport;

Thread waiter = new Thread(() -> {
    System.out.println("About to park");
    LockSupport.park();              // suspend — no lock required
    System.out.println("Unparked: " + Thread.currentThread().isInterrupted());
}, "waiter");

waiter.start();
Thread.sleep(500);                   // let waiter reach park()

LockSupport.unpark(waiter);         // wake the waiter thread
waiter.join();

// Key difference from wait/notify:
// 1. No synchronized block required
// 2. unpark() can be called BEFORE park() — permit is stored
// 3. park() is not re-entrant — a single unpark() stores one permit`,
      },
      {
        title: "parkNanos() — Timed Parking",
        description: "parkNanos() parks for at most N nanoseconds. Unlike Thread.sleep(), it doesn't require a try/catch for InterruptedException — interruption just causes early return with interrupt flag set.",
        code: `Thread worker = new Thread(() -> {
    System.out.println("Waiting for up to 2 seconds...");
    LockSupport.parkNanos(2_000_000_000L); // 2 seconds in nanoseconds

    if (Thread.currentThread().isInterrupted()) {
        System.out.println("Was interrupted");
    } else {
        System.out.println("Timed out or unparked normally");
    }
    // No InterruptedException to catch — cleaner than Thread.sleep()
});
worker.start();

Thread.sleep(500);
LockSupport.unpark(worker); // wake early (before 2-second timeout)
worker.join();`,
      },
      {
        title: "Blocker Object — Diagnostics with jstack",
        description: "park(blocker) records a 'blocker' object on the thread for diagnostic tools. jstack and thread dumps display the blocker class name — making it much easier to understand why a thread is parked.",
        code: `// Without blocker: jstack shows "parking to wait for <unknown>"
LockSupport.park();

// With blocker: jstack shows "parking to wait for <0x...> (a com.example.MyLock)"
LockSupport.park(this);   // 'this' is the blocker — usually the lock object

// How ReentrantLock uses it internally:
class SimpleLock {
    private final AtomicReference<Thread> owner = new AtomicReference<>();
    private final Queue<Thread> waiters = new ConcurrentLinkedQueue<>();

    public void lock() {
        while (!owner.compareAndSet(null, Thread.currentThread())) {
            waiters.add(Thread.currentThread());
            LockSupport.park(this); // blocks here; 'this' shows in thread dumps
            waiters.remove(Thread.currentThread());
        }
    }

    public void unlock() {
        owner.set(null);
        Thread next = waiters.peek();
        if (next != null) LockSupport.unpark(next);
    }
}`,
      },
    ],
    pitfalls: [
      "park() can return spuriously (without unpark or interrupt) — always re-check your condition in a loop after park().",
      "A single unpark() stores exactly one permit. Calling unpark() 3 times then park() 3 times: only the first park() returns immediately — the others block.",
      "LockSupport is rarely used directly in application code. Use ReentrantLock, Semaphore, or CountDownLatch instead. LockSupport is for building new synchronization primitives.",
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
  // ─────────────────── VIRTUAL THREADS ───────────────────────────────────────
  {
    id: "virtual-threads-api",
    title: "Virtual Threads & StructuredTaskScope",
    category: "Virtual Threads",
    tags: ["virtual threads", "Project Loom", "StructuredTaskScope", "carrier thread", "Java 21"],
    purpose:
      "Virtual threads (Java 21) are JVM-managed, lightweight threads that allow millions of concurrent threads without the memory overhead of platform threads. `StructuredTaskScope` (Java 23 stable, preview in 21) enforces structured concurrency — all forked threads are automatically cancelled when the scope exits.",
    signature: `// Virtual thread creation
Thread.ofVirtual().start(Runnable)
Thread.ofVirtual().name(String).unstarted(Runnable)
Thread.startVirtualThread(Runnable)             // shortcut
thread.isVirtual()                              // true for virtual threads

// Executor (preferred — one virtual thread per submitted task)
ExecutorService exec = Executors.newVirtualThreadPerTaskExecutor()

// Structured concurrency (java.util.concurrent)
StructuredTaskScope.ShutdownOnFailure scope     // cancel all if any fails
StructuredTaskScope.ShutdownOnSuccess<T> scope  // cancel all on first success
scope.fork(Callable<T>)   → Subtask<T>          // submit a child task
scope.join()                                    // wait for all forks
scope.throwIfFailed()                           // propagate exception
subtask.get()                                   // retrieve result`,
    codeExamples: [
      {
        title: "Creating and Starting Virtual Threads",
        description: "The API mirrors platform threads. Virtual threads are JVM-managed — creating millions of them is fine. Name them for thread dumps.",
        code: `import java.util.concurrent.*;

Thread vt = Thread.ofVirtual()
    .name("vt-worker")
    .start(() -> System.out.println(
        "Virtual? " + Thread.currentThread().isVirtual() // true
    ));
vt.join();

// Thread.startVirtualThread is a convenient shortcut
Thread.startVirtualThread(() -> doWork());`,
      },
      {
        title: "Virtual Thread Executor — Scalable I/O",
        description: "newVirtualThreadPerTaskExecutor() creates one virtual thread per submitted task. No pool sizing — submit 100k tasks and the JVM handles multiplexing them onto OS threads automatically.",
        code: `try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    List<Future<String>> futures = new ArrayList<>();
    for (String url : urls) {
        futures.add(executor.submit(() -> fetch(url)));  // each gets its own VT
    }
    for (var f : futures) {
        System.out.println(f.get());
    }
} // try-with-resources: waits for all tasks to complete`,
      },
      {
        title: "StructuredTaskScope — Fan-Out with Failure Propagation",
        description: "ShutdownOnFailure runs all forked tasks concurrently. If any fails, all siblings are cancelled. The scope.join() + throwIfFailed() pattern is the structured concurrency idiom.",
        code: `record UserPage(User user, List<Order> orders, List<Product> recs) {}

UserPage buildPage(long userId) throws Exception {
    try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
        // Three concurrent virtual threads
        var user   = scope.fork(() -> userService.find(userId));
        var orders = scope.fork(() -> orderService.findByUser(userId));
        var recs   = scope.fork(() -> recService.forUser(userId));

        scope.join();           // waits for all three (or first failure)
        scope.throwIfFailed();  // re-throws exception if any fork failed

        return new UserPage(user.get(), orders.get(), recs.get());
    }
    // Exiting scope: all unfinished threads are guaranteed cancelled — no leaks
}`,
      },
      {
        title: "StructuredTaskScope.ShutdownOnSuccess — Race to First Result",
        description: "ShutdownOnSuccess returns as soon as the first task succeeds and cancels all remaining tasks. Perfect for geo-routing, hedged requests, or any 'fastest response wins' pattern.",
        code: `String fastestServer(List<String> servers) throws Exception {
    try (var scope = new StructuredTaskScope.ShutdownOnSuccess<String>()) {
        for (String server : servers) {
            scope.fork(() -> probe(server));  // all start concurrently
        }
        scope.join();            // returns when first task succeeds
        return scope.result();   // the winning result
    }
    // All other probes are cancelled when scope exits
}`,
      },
      {
        title: "Avoid Pinning — Replace synchronized with ReentrantLock",
        description: "Virtual threads cannot unmount from their carrier thread while inside a synchronized block. If I/O blocks there, the carrier OS thread is stuck. ReentrantLock allows the virtual thread to unmount during the blocked period.",
        code: `// PROBLEM: synchronized pins virtual thread → carrier blocked during I/O
class PinnedDbConn {
    synchronized void query() {
        resultSet = jdbc.executeQuery(); // I/O inside synchronized = carrier stuck
    }
}

// FIX: ReentrantLock allows virtual thread to unmount while waiting for I/O
class UnpinnedDbConn {
    private final ReentrantLock lock = new ReentrantLock();

    void query() {
        lock.lock();
        try {
            resultSet = jdbc.executeQuery(); // VT can unmount — carrier is free
        } finally {
            lock.unlock();
        }
    }
}`,
      },
    ],
    pitfalls: [
      "Do NOT pool virtual threads. `newVirtualThreadPerTaskExecutor()` creates one per task intentionally — that's the design. Using `newFixedThreadPool` or `newCachedThreadPool` with virtual threads defeats the purpose.",
      "synchronized blocks PIN the virtual thread to its carrier thread for the duration of the block. If the pinned code then blocks on I/O, the carrier thread is occupied. Migrate to ReentrantLock in hot paths.",
      "ThreadLocal works with virtual threads but memory leaks are worse — each of millions of virtual threads can have its own ThreadLocal entry. Prefer ScopedValue (Java 21 preview, stable in 23) for per-virtual-thread context.",
      "CPU-bound tasks gain NOTHING from virtual threads — the JVM has the same number of carrier threads as CPU cores. Virtual threads help I/O-bound workloads only.",
      "JDK 21: StructuredTaskScope is in preview. Enable with --enable-preview --source 21. Stable in JDK 23+.",
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
  Locks:          { color: "var(--red)",   bg: "var(--red-subtle)",   count: JAVA_API.filter(a => a.category === "Locks").length },
  "Virtual Threads": { color: "#A78BFA", bg: "rgba(167,139,250,.12)", count: JAVA_API.filter(a => a.category === "Virtual Threads").length },
  Misc:           { color: "var(--ink-3)", bg: "var(--paper-2)",      count: JAVA_API.filter(a => a.category === "Misc").length },
};
