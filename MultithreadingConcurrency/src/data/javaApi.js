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
    bestPractices: [
      "Always name threads (setName or Thread.Builder.name()) — 'pool-2-thread-7' in a thread dump is useless; 'payment-worker-3' tells a story",
      "Set a global UncaughtExceptionHandler (Thread.setDefaultUncaughtExceptionHandler) to log all silent thread crashes",
      "Always use join(timeout) in production, never join() without timeout — an indefinitely blocked join can hang your shutdown",
      "Check isInterrupted() at the top of every iteration in long-running loops — not just when blocking",
    ],
    thumbRules: [
      "thread.run() does NOT create a new thread — only thread.start() does. This is a silent bug.",
      "Thread.interrupted() (static, clears flag) vs thread.isInterrupted() (instance, doesn't clear): never confuse them",
      "sleep() keeps all locks; wait() releases ONE lock — confusing these causes deadlocks",
      "setDaemon(true) must be before start() — after start() throws IllegalThreadStateException",
      "thread.setPriority(MAX) is a hint only — the OS is free to ignore it",
    ],
    hiddenTruths: [
      "Thread.getStackTrace() on another thread is a safe-point operation — it forces the target thread to pause briefly. Use it sparingly; heavy use in prod can cause latency spikes.",
      "Thread IDs (getId()) are unique within a JVM session but are NOT reused. If you log thread IDs over time, IDs only go up.",
      "A thread that throws an uncaught exception transitions to TERMINATED state immediately — the exception is passed to the UncaughtExceptionHandler. If no handler is set, it prints to stderr and is silently lost.",
      "Thread.currentThread() inside a virtual thread returns the virtual thread itself, not the carrier thread — virtual threads are full Thread instances.",
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
    bestPractices: [
      "Always use while(!condition) wait() — never if(!condition). JVM spec explicitly permits spurious wakeups.",
      "Prefer BlockingQueue over wait/notify for producer-consumer — it wraps all this complexity safely",
      "Use separate Condition objects (from ReentrantLock) for producers and consumers — notify() the right condition, not a mixed bag",
      "Always call notifyAll() unless you have proven all waiters are identical — one wrong notify() can permanently stall progress",
    ],
    thumbRules: [
      "Need to call wait/notify? → synchronized block on the SAME object you call them on — always",
      "Multiple types of waiters on the same lock → notifyAll(), never notify()",
      "New code needing condition wait? → ReentrantLock + Condition.await()/signal() instead of Object.wait()/notify()",
      "Timed wait needed? → wait(millis) + re-check condition — don't assume it was a timeout",
    ],
    hiddenTruths: [
      "Spurious wakeups are not just theoretical — they happen on Linux (POSIX threads standard explicitly allows them). Your while() loop is not defensive programming; it is mandatory correctness.",
      "wait() atomically releases the lock AND parks the thread in ONE operation. If it released first and then parked, there'd be a window where another thread could notify() before you're waiting — you'd miss it. The atomicity is the entire point.",
      "notifyAll() wakes ALL waiting threads, but only ONE can re-acquire the lock at a time. All the others immediately go back to BLOCKED (waiting for the lock). The 'wakeup storm' is real — but the cost is usually acceptable vs the risk of missed notify.",
      "IllegalMonitorStateException at runtime is a hint that you're calling wait/notify without holding the correct lock. The compiler NEVER catches this — it only manifests at runtime, often in rare thread interleavings.",
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
    bestPractices: [
      "Always call shutdown() in a try-finally or shutdown hook — an unshut ExecutorService keeps the JVM alive forever",
      "Use invokeAll(Collection<Callable>) to submit a batch — simpler and faster than looping submit() and collecting futures",
      "Prefer submit(Callable) over execute(Runnable) — execute swallows exceptions; submit wraps them in Future where you can retrieve them",
      "Add a custom ThreadFactory to name threads — 'request-handler-N' in a thread dump is worth 10x 'pool-1-thread-N'",
      "Use awaitTermination(timeout) after shutdown() — never assume the pool stopped just because you called shutdown()",
    ],
    thumbRules: [
      "CPU-bound work → newFixedThreadPool(Runtime.availableProcessors())",
      "Short-lived I/O bursts (legacy code) → newCachedThreadPool() with an external rate limiter",
      "Serial execution of ordered tasks → newSingleThreadExecutor()",
      "Periodic recurring work → newScheduledThreadPool(N)",
      "Java 21 I/O bound → newVirtualThreadPerTaskExecutor() — no pool sizing needed",
    ],
    hiddenTruths: [
      "execute(Runnable) silently swallows all exceptions — they go to the UncaughtExceptionHandler (which may do nothing). Use submit(Runnable) and call future.get() to surface exceptions from fire-and-forget tasks.",
      "After shutdown(), the executor still processes ALL already-queued tasks. shutdownNow() interrupts running tasks and returns unstarted ones — but only if those tasks check the interrupt flag.",
      "newCachedThreadPool() can create thousands of OS threads in seconds under sustained load. Each OS thread consumes ~1 MB of stack. 1000 threads = 1 GB RAM minimum. Use a bounded pool for production HTTP servers.",
      "An ExecutorService that isn't shut down keeps the JVM alive even after main() returns. This is one of the most common 'why won't my app exit' bugs.",
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
    bestPractices: [
      "Always use a bounded queue in production — unbounded LinkedBlockingQueue can silently queue millions of tasks until OOM",
      "Name your threads via a custom ThreadFactory — thread dumps with 'worker-1' vs 'Thread-23' are 10x easier to debug",
      "Set a RejectedExecutionHandler explicitly — the default AbortPolicy throws silently-swallowed exceptions in many codebases",
      "Call executor.shutdown() followed by awaitTermination() for graceful shutdown — never just abandon the executor",
      "Monitor getQueue().size(), getActiveCount(), and getCompletedTaskCount() in production metrics",
    ],
    thumbRules: [
      "Fixed CPU-bound work → corePoolSize = maxPoolSize = nCPU (no dynamic growth needed)",
      "Mixed I/O-bound → corePoolSize = nCPU, maxPoolSize = 2–4×nCPU, bounded queue",
      "Need back-pressure when full → CallerRunsPolicy (caller runs the task, slowing producers)",
      "Need to drop work gracefully → DiscardPolicy or DiscardOldestPolicy",
      "Threads ONLY grow past corePoolSize when the queue is FULL — if using unbounded queue, max threads are never created",
    ],
    hiddenTruths: [
      "The pool growth sequence is: fill cores → fill queue → grow to max → reject. Many developers expect cores → grow to max → fill queue. The queue fills BEFORE extra threads are created.",
      "keepAliveTime applies only to threads ABOVE corePoolSize by default. Call allowCoreThreadTimeOut(true) to also reclaim idle core threads (useful for bursty workloads).",
      "RejectedExecutionException from AbortPolicy is an unchecked RuntimeException. If no one catches it (common with execute()), it propagates to the thread's UncaughtExceptionHandler and is silently lost.",
      "getActiveCount() is approximate — it reads without locking. Use it for metrics only, never for correctness logic.",
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
    bestPractices: [
      "Always attach exceptionally() or handle() to every pipeline — unhandled CompletableFuture exceptions are silently swallowed until someone calls get()",
      "For blocking I/O steps, always use thenApplyAsync(fn, myExecutor) with a dedicated executor — never pollute ForkJoinPool.commonPool() with blocking work",
      "Prefer join() over get() inside lambda chains — join() throws unchecked CompletionException, avoiding checked exception propagation in lambdas",
      "Use CompletableFuture.delayedExecutor(N, UNIT) for retry-with-delay patterns",
    ],
    thumbRules: [
      "Transform the result synchronously → thenApply()",
      "Chain to another async step (the next step returns CF) → thenCompose() — avoids CF<CF<T>>",
      "Two independent futures, need both results → thenCombine()",
      "Fan out to N services, wait for all → allOf() + .thenRun(() -> results.stream().map(CF::join))",
      "Recover from any failure in the pipeline → exceptionally(ex -> fallback)",
    ],
    hiddenTruths: [
      "CompletableFuture.get() wraps any thrown exception in ExecutionException. The ACTUAL cause is ex.getCause(). Many developers log the wrapper and miss the real error.",
      "cancel(true) on a CompletableFuture does NOT interrupt the underlying thread. It only marks the future as cancelled. The actual Runnable/Callable running in the pool continues to run to completion.",
      "join() throws CompletionException (unchecked); get() throws ExecutionException (checked). They wrap the same underlying exception — the difference is only the wrapper class.",
      "thenApplyAsync() without an executor runs on ForkJoinPool.commonPool(). If that pool is saturated (e.g. you have parallel streams running), your async steps queue up behind them — unexpected latency in 'async' code.",
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
    bestPractices: [
      "Always call countDown() in a finally block — an exception without countDown leaves waiting threads blocked forever",
      "Use the 'starting pistol' pattern (count=1) to release all threads simultaneously for load testing",
      "Prefer CountDownLatch over manual wait/notify for 'wait for N things to happen' — it's simpler and correct by design",
    ],
    thumbRules: [
      "Wait for N tasks to complete → CountDownLatch(N), each task calls countDown() in finally",
      "Release N threads simultaneously → CountDownLatch(1), latch.countDown() to fire them all",
      "Need to RESET the barrier → use CyclicBarrier instead",
      "Need dynamic number of parties → use Phaser instead",
    ],
    hiddenTruths: [
      "CountDownLatch count can only go DOWN — countDown() decrements, there's no countUp(). If you need to add tasks after creation, use Phaser.register() instead.",
      "await() with timeout returns a boolean (false=timed out) — check the return value. If you ignore false, you'll proceed even though not all tasks completed.",
      "A CountDownLatch that reaches 0 stays at 0 forever — subsequent countDown() calls are no-ops, and await() returns immediately. Reuse the reference safely after it fires.",
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
    bestPractices: [
      "Always catch BrokenBarrierException and either reset() or shut down — a broken barrier cannot be partially recovered",
      "Keep the barrier action (the Runnable passed to constructor) very short — it runs on the last arriving thread, blocking everyone else",
      "Use CyclicBarrier for iterative algorithms with synchronization between phases (simulation steps, parallel sort phases)",
      "Prefer CountDownLatch for one-shot 'wait for N events' — CyclicBarrier is for N threads waiting for each other",
    ],
    thumbRules: [
      "N threads need to sync between algorithm phases → CyclicBarrier(N)",
      "One-shot 'wait for N events to happen' → CountDownLatch(N) (simpler, no reset needed)",
      "Need dynamic party count → Phaser (CyclicBarrier has fixed party count)",
      "Barrier broken → catch BrokenBarrierException and call reset() before next cycle",
    ],
    hiddenTruths: [
      "When any thread times out or is interrupted at the barrier, ALL waiting threads receive BrokenBarrierException — the barrier is permanently broken until reset() is called. One bad thread poisons all others.",
      "The barrier action runs in the LAST thread to arrive, not in a dedicated thread or the first thread. If the barrier action throws an exception, that thread propagates it and all others get BrokenBarrierException.",
      "CyclicBarrier.await() returns the 'arrival index' — 0 for the last arriving thread, N-1 for the first. Use this to assign the 'leader' thread for the barrier action without a separate Runnable.",
      "reset() on a CyclicBarrier while threads are waiting causes them to throw BrokenBarrierException immediately — not a graceful reset. Ensure no threads are waiting before calling reset().",
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
    bestPractices: [
      "Always release() in a finally block — one missing release permanently reduces available permits",
      "Use fair Semaphore (new Semaphore(N, true)) for resource pools where fairness matters — prevents thread starvation",
      "Use tryAcquire(timeout) for fast-fail scenarios (circuit breaker, rate limiting) — don't block indefinitely",
      "Document the purpose and initial permit count in a comment — Semaphore semantics are not obvious from the code",
    ],
    thumbRules: [
      "Limit concurrent access to N resources (DB connections, API calls) → Semaphore(N)",
      "Mutual exclusion (1 at a time) → Semaphore(1) works but prefer synchronized or ReentrantLock (has owner concept)",
      "Rate limiting N requests/second → Semaphore(N) + timed release or a proper rate limiter (Guava RateLimiter)",
      "Resource pool exhausted → tryAcquire(timeout) returns false — fail fast instead of queueing indefinitely",
    ],
    hiddenTruths: [
      "Semaphore has NO owner concept — any thread can call release() regardless of who called acquire(). You can release() more permits than you initially created, growing the pool beyond its initial size. This is intentional (useful for signaling) but a bug if accidental.",
      "Semaphore(N, fair=true) uses a FIFO queue — threads acquire in arrival order. Semaphore(N, fair=false) allows barging — the lock can go to the just-released thread, not the longest-waiting one. Unfair is faster but can starve waiting threads.",
      "A Semaphore with 0 initial permits is useful as a coordination primitive (like a one-shot gate that can be re-used) — useful for producer-consumer without a queue.",
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
    bestPractices: [
      "Use Phaser when party count changes at runtime — if fixed, CyclicBarrier is simpler",
      "Always pair register() with arriveAndDeregister() — a registered party that never arrives blocks everyone else indefinitely",
      "Override onAdvance(phase, registeredParties) to add phase-transition logic — return true to terminate the phaser",
      "Use awaitAdvance(phase) for 'wait for a specific phase without registering' — a lightweight observer pattern",
    ],
    thumbRules: [
      "Dynamic threads joining/leaving → Phaser.register() / arriveAndDeregister()",
      "Fixed-party multi-phase work → CyclicBarrier is simpler",
      "Need per-phase callback → override Phaser.onAdvance()",
      "Non-blocking 'I'm done, check in' → arrive() (does not wait for others)",
      "Need to observe phase N without being a participant → awaitAdvance(N)",
    ],
    hiddenTruths: [
      "Phaser.register() increments unarrived parties — calling it after all current parties have arrived can race with phase advancement. Register BEFORE the phase you want to participate in.",
      "Phaser can be hierarchical — pass a parent Phaser to the constructor. Child phasers report arrivals to the parent. This scales to thousands of threads without a single contended counter.",
      "arriveAndDeregister() returns the phase number at time of deregistration. When the last party deregisters, onAdvance() is called with registeredParties=0 — useful for detecting natural termination.",
      "awaitAdvance() does NOT register the calling thread as a party. It's purely observational — the thread waits for the phase to advance without contributing to the arrival count.",
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
    bestPractices: [
      "Always use exchange(obj, timeout, unit) in production — plain exchange() blocks forever if the partner thread dies",
      "Use Exchanger only for exactly two threads doing symmetric handoffs — any other pattern, use BlockingQueue",
      "The double-buffer fill/drain pattern is the classic correct use case — filler fills, drainer drains, they swap at sync point",
    ],
    thumbRules: [
      "Exactly two threads exchanging data at a synchronization point → Exchanger",
      "More than two threads, or asymmetric producer/consumer → BlockingQueue",
      "Need to avoid indefinite blocking → exchange(obj, timeout, unit) with a meaningful timeout",
    ],
    hiddenTruths: [
      "When one thread times out (TimeoutException), the partner thread is NOT notified — it remains blocked until its own timeout or until another thread shows up. Design both threads to use the same timeout.",
      "Exchanger uses an internal arena for high-contention scenarios — under high parallelism it can use multiple slots to reduce contention. This makes it unsuitable for exactly-2-thread guarantees under concurrent access.",
      "The exchange is atomic from both threads' perspective — both see each other's objects at the same logical instant. Neither thread can observe the 'old' object after exchange() returns.",
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
    bestPractices: [
      "Always use a bounded queue in production — unbounded LinkedBlockingQueue(no capacity) can silently accumulate tasks until OOM",
      "Use put()/take() for back-pressure (blocking) — use offer(timeout)/poll(timeout) for timeouts with circuit-breaking",
      "Poison pill shutdown: one pill per consumer thread — don't reuse the same pill across multiple consumers",
      "Prefer LinkedBlockingQueue for high throughput (separate head/tail locks); ArrayBlockingQueue for fairness and predictable memory",
    ],
    thumbRules: [
      "Producer-consumer with back-pressure → LinkedBlockingQueue(bounded capacity) + put()/take()",
      "Bound memory and prevent OOM → always set capacity: new LinkedBlockingQueue<>(1000)",
      "Direct handoff (no buffering, one producer per consumer) → SynchronousQueue",
      "Priority-ordered processing → PriorityBlockingQueue (unbounded — watch memory)",
      "Delayed/scheduled work → DelayQueue<E extends Delayed>",
    ],
    hiddenTruths: [
      "ArrayBlockingQueue(capacity, fair=true) uses a ReentrantLock with fairness. This gives FIFO ordering but dramatically reduces throughput — all threads contend on the same lock. Use fair only when starvation is a measured problem.",
      "LinkedBlockingQueue uses TWO separate locks (putLock and takeLock) — one for the tail and one for the head. Producers and consumers can operate simultaneously, making it much faster than ArrayBlockingQueue under concurrent access.",
      "SynchronousQueue with fair=false (default) allows 'barging' — a new producer can jump ahead of waiting producers. Use fair=true if you need strict FIFO transfer order.",
      "BlockingQueue.size() is O(1) for ArrayBlockingQueue but O(n) for some implementations. Always check the implementation before using size() in hot loops.",
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
    bestPractices: [
      "For counters: use merge(key, 1, Integer::sum) — atomic increment-or-initialize in one call",
      "For lazy init / caching: use computeIfAbsent(key, fn) — fn is called at most once per key",
      "For atomic read-modify-write: use compute(key, (k, v) -> ...) — v is null on first call",
      "Replace the entire map atomically: snapshot via new HashMap<>(concurrentMap) inside a single compute call",
      "Never synchronize externally on a ConcurrentHashMap — you lose all its concurrency benefits",
    ],
    thumbRules: [
      "Thread-safe word count / frequency map → merge(word, 1, Integer::sum)",
      "Thread-safe cache with lazy init → computeIfAbsent(key, k -> expensive())",
      "Atomic put-only-if-absent → putIfAbsent (avoids separate containsKey + put race)",
      "Need approximate size → size() is fine; need exact count → mappingCount() returns long",
      "Check-then-act on a map → always use compute/merge/putIfAbsent — never containsKey() + put()",
    ],
    hiddenTruths: [
      "computeIfAbsent() blocks other threads trying to compute the SAME key (it locks the bin). But two threads computing DIFFERENT keys proceed concurrently — this is fine-grained, not map-wide locking.",
      "size() and isEmpty() are NOT guaranteed accurate under concurrent modifications. They use a counter that may lag writes. mappingCount() is the correct method for large maps.",
      "ConcurrentHashMap does NOT support null keys or values. Attempting to put null throws NullPointerException immediately. This is intentional — null was used in HashMap to mean 'key not present', which is ambiguous in a concurrent context.",
      "forEach, keys(), values(), and entrySet() use weakly-consistent iterators — they reflect some (but not necessarily all) changes made after the iterator was created. They will NEVER throw ConcurrentModificationException.",
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
    bestPractices: [
      "Use LongAdder instead of AtomicLong for high-contention counters (metrics, request counts) — it distributes writes to reduce CAS failures",
      "Use AtomicReference to publish immutable object snapshots — combine atomic reference swap with an immutable value object",
      "For ABA-sensitive operations (lock-free queues, stacks) → use AtomicStampedReference to add a version counter",
      "Prefer updateAndGet(fn) over CAS loops — it retries automatically and is cleaner",
    ],
    thumbRules: [
      "Single counter, one thread writes → volatile int (cheapest)",
      "Counter incremented by multiple threads → AtomicInteger.incrementAndGet()",
      "Counter under high contention (>8 threads) → LongAdder (cells eliminate CAS contention)",
      "Need precise CAS semantics (unique ID generation, lock-free algorithms) → AtomicLong.compareAndSet()",
      "Reference swap (publish new snapshot) → AtomicReference.set() or compareAndSet()",
    ],
    hiddenTruths: [
      "CAS loops (compareAndSet in a while(true)) are actually spin locks at the application level. Under very high contention, they waste CPU in busy-spinning — identical to a classic spin lock. This is why LongAdder uses striped cells instead.",
      "The ABA problem is real in practice: link-based lock-free stacks and queues are vulnerable. AtomicStampedReference solves it by pairing the reference with an integer stamp. Every update increments the stamp, making A→B→A detectable.",
      "AtomicInteger.incrementAndGet() is NOT always faster than synchronized. For a single thread, synchronized with biased locking can be faster. AtomicInteger wins only when there are multiple threads and the lock would be contended.",
      "VarHandle (Java 9+) is the new low-level alternative to Unsafe for atomic operations. It provides the same CAS semantics as AtomicXxx but for ANY field, including array elements, without boxing overhead.",
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
    bestPractices: [
      "ALWAYS put unlock() in a finally block — missing it on exception path is the #1 ReentrantLock bug",
      "Name your Condition objects (final Condition notFull = lock.newCondition()) — explains purpose in code and thread dumps",
      "Use tryLock(timeout) when acquiring multiple locks — breaks hold-and-wait deadlock condition",
      "Use lockInterruptibly() for long-wait lock acquisitions in interruptible operations — allows graceful shutdown",
    ],
    thumbRules: [
      "Simple mutual exclusion → synchronized (no unlock-in-finally mistake possible)",
      "Need tryLock/timeout on lock acquisition → ReentrantLock.tryLock(timeout, unit)",
      "Multiple wait conditions on one lock → ReentrantLock + multiple Condition objects (not possible with synchronized)",
      "Need to cancel a thread waiting for a lock → lockInterruptibly() (synchronized cannot be interrupted)",
      "Starvation is a measured problem → new ReentrantLock(true) for fair FIFO ordering",
    ],
    hiddenTruths: [
      "ReentrantLock.lock() IGNORES interrupts — it will not throw InterruptedException even if the thread is interrupted while waiting. Use lockInterruptibly() if you want the acquisition to be interruptible.",
      "ReentrantLock IS re-entrant — the same thread can acquire it multiple times. But you must call unlock() ONCE for EVERY lock() call, including re-entrant ones. Getting the count wrong leaves the lock permanently held or prematurely released.",
      "Condition.signal() (like Object.notify()) wakes ONE arbitrary waiter on that specific Condition queue. The key advantage over synchronized: with two Conditions (notFull and notEmpty), you can signal only producers or only consumers — not a random mix.",
      "ReentrantLock internally uses AbstractQueuedSynchronizer (AQS) — the same framework used by CountDownLatch, Semaphore, and all JUC synchronizers. Understanding AQS explains how all of them work.",
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
    bestPractices: [
      "Cache readLock() and writeLock() references as final fields — calling rwLock.readLock() on every acquisition adds overhead",
      "Keep write-locked critical sections as short as possible — every writer blocks ALL readers",
      "For read-heavy data (caches, config) → RWLock is ideal; for write-heavy data → plain ReentrantLock is often faster",
      "StampedLock optimistic read pattern: tryOptimisticRead → read data → validate(stamp) → fallback to readLock if invalid",
    ],
    thumbRules: [
      "80%+ reads, rare writes → ReentrantReadWriteLock (multiple concurrent readers)",
      "Reads and writes roughly equal → plain ReentrantLock (RWLock overhead outweighs benefit)",
      "Absolute maximum read throughput → StampedLock optimistic read (lock-free on happy path)",
      "Lock downgrade (write → read) is allowed; upgrade (read → write) is NOT — it deadlocks",
    ],
    hiddenTruths: [
      "ReentrantReadWriteLock can starve writers under continuous read load. In the default non-fair mode, a steady stream of readers can prevent a writer from ever acquiring the write lock. Use new ReentrantReadWriteLock(true) for fairness if writes starve.",
      "StampedLock is NOT reentrant — the same thread cannot acquire it twice (unlike ReentrantLock and ReentrantReadWriteLock). Calling readLock() while already holding a read stamp will deadlock.",
      "StampedLock does NOT support Condition objects. You cannot do the 'wait for condition while holding lock' pattern with it.",
      "Lock downgrade (from write to read) is explicitly supported: acquire readLock WHILE holding writeLock, then release writeLock. This prevents other writers from sneaking in. The reverse (upgrade) is not supported.",
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
    bestPractices: [
      "Always use park(this) not park() — the blocker object appears in thread dumps and makes debugging 10x easier",
      "Always re-check the condition after park() returns — spurious wakeups are allowed by the spec",
      "Use parkNanos() instead of Thread.sleep() in low-level synchronizer code — no InterruptedException wrapper needed",
      "LockSupport is infrastructure-level API — prefer ReentrantLock, CountDownLatch, or Semaphore in application code",
    ],
    thumbRules: [
      "Building a custom synchronizer primitive → LockSupport.park/unpark is the correct low-level tool",
      "Application-level blocking → use ReentrantLock.lock() or CountDownLatch.await() instead",
      "Need to wake a specific thread (not all) → LockSupport.unpark(thread) beats Object.notifyAll()",
      "After park() returns, always re-check your guard condition in a loop — spurious returns are permitted",
    ],
    hiddenTruths: [
      "unpark() can be called BEFORE park() — the permit is stored and consumed on the next park() call. This is the key advantage over wait/notify: no 'signal lost' race condition between the check and the park.",
      "park() does NOT throw InterruptedException. It simply sets the interrupt flag and returns. You must check Thread.currentThread().isInterrupted() after park() to detect interruption.",
      "A single call to unpark() stores exactly ONE permit. Multiple unpark() calls before park() do NOT accumulate — only one park() call will return immediately; subsequent ones block.",
      "All java.util.concurrent locks (ReentrantLock, Semaphore, CountDownLatch, etc.) are built on AbstractQueuedSynchronizer (AQS), which uses LockSupport.park/unpark internally. Understanding LockSupport explains why InterruptedException is never thrown from lock.lock().",
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
    bestPractices: [
      "ALWAYS call remove() in a finally block for thread-pool threads — failure causes memory leaks and cross-request data contamination",
      "Use ThreadLocal.withInitial(Supplier) for lazy initialization — avoids null checks on get()",
      "Limit use to 'ambient context' patterns (user session, request ID, MDC logging) — not for passing method parameters",
      "In virtual threads, prefer ScopedValue (Java 21+) over ThreadLocal — ScopedValue is immutable per scope, making leaks impossible",
    ],
    thumbRules: [
      "Per-thread object that's not thread-safe (SimpleDateFormat, Random) → ThreadLocal.withInitial()",
      "Request-scoped context (user ID, trace ID) in thread pools → ThreadLocal + remove() in finally",
      "Context in virtual threads → ScopedValue (Java 21+) — ThreadLocal leaks in millions of VTs",
      "Need child threads to inherit parent value → InheritableThreadLocal (but NOT in thread pools — pooled threads aren't children of the submitter)",
    ],
    hiddenTruths: [
      "ThreadLocal values are stored in the Thread object itself (Thread.threadLocals map), not in the ThreadLocal instance. When the thread dies, the values are GC'd. In thread pools, threads never die — values accumulate forever if not removed.",
      "InheritableThreadLocal copies the parent's value at Thread creation time. In an Executor, threads are created by the pool, not the submitter — so InheritableThreadLocal gives the pool thread's value, not the submitting thread's value. This surprises almost everyone.",
      "Setting ThreadLocal on a virtual thread creates an entry in the virtual thread's own map — with millions of virtual threads, each with their own ThreadLocal entries, memory usage can explode. ScopedValue avoids this entirely.",
      "ThreadLocal.remove() only removes the entry for the CURRENT thread. It does NOT clear all threads' values. There's no way to globally reset a ThreadLocal across all threads.",
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
    bestPractices: [
      "Replace newFixedThreadPool(N) with newVirtualThreadPerTaskExecutor() for I/O-bound services — no pool sizing needed",
      "Replace synchronized with ReentrantLock in any code path that performs I/O — prevents carrier thread pinning",
      "Use ScopedValue instead of ThreadLocal for per-request context — no leaks, immutable, composable",
      "Name virtual threads with Thread.ofVirtual().name('prefix-', 0).factory() — counter-based names appear in thread dumps",
      "Use StructuredTaskScope for fan-out patterns — it ensures no forked thread outlives its scope",
    ],
    thumbRules: [
      "I/O-bound service handling many concurrent requests → virtual threads + newVirtualThreadPerTaskExecutor()",
      "CPU-bound parallel computation → ForkJoinPool or fixed platform thread pool (virtual threads don't help)",
      "synchronized + I/O inside → replace synchronized with ReentrantLock to avoid pinning",
      "Fan-out: call N services concurrently, need all results → StructuredTaskScope.ShutdownOnFailure",
      "Fan-out: call N services, take the first success → StructuredTaskScope.ShutdownOnSuccess",
    ],
    hiddenTruths: [
      "Virtual threads are not 'faster' than platform threads for the same amount of CPU work — they're CHEAPER to create and block. A virtual thread that never blocks is identical in performance to a platform thread.",
      "Pinning happens with synchronized AND with native methods that block (JNI). Even if you convert all synchronized to ReentrantLock, native code (some JDBC drivers, crypto, OS calls) can still pin.",
      "The JVM creates carrier threads equal to the number of available processors (Runtime.getRuntime().availableProcessors()). All virtual threads share these carriers — if all carriers are pinned, new virtual threads queue up and stall.",
      "Thread.sleep() in a virtual thread unmounts the virtual thread from its carrier — the carrier is free during the sleep. This is why virtual thread code can use Thread.sleep() freely without worrying about wasting OS threads.",
    ],
  },
  // ─────────────────── CONCURRENT COLLECTIONS (2) ────────────────────────
  {
    id: "copy-on-write-collections",
    title: "CopyOnWriteArrayList / CopyOnWriteArraySet",
    category: "Collections",
    tags: ["CopyOnWriteArrayList", "CopyOnWriteArraySet", "read-heavy", "snapshot"],
    purpose:
      "Thread-safe List/Set where every mutating operation (add, set, remove) creates a fresh copy of the underlying array. Reads are completely lock-free — they operate on a snapshot. Ideal for read-dominated data that changes rarely.",
    signature: `CopyOnWriteArrayList<E> list = new CopyOnWriteArrayList<>();
list.add(e)           // thread-safe: copies the array, adds, replaces reference
list.remove(e)        // thread-safe: copies array, removes, replaces reference
list.get(i)           // lock-free read from current snapshot
list.iterator()       // returns snapshot iterator — never throws ConcurrentModificationException
list.addIfAbsent(e)   // atomic add-if-absent (List only)

CopyOnWriteArraySet<E> set = new CopyOnWriteArraySet<>(); // backed by COWAL`,
    codeExamples: [
      {
        title: "Event Listener Registry — Read-Heavy, Rare Writes",
        description: "The classic use case: many threads fire events (read the listener list), but listeners are rarely added or removed. CopyOnWriteArrayList gives lock-free iteration with safe concurrent modification.",
        code: `import java.util.concurrent.CopyOnWriteArrayList;

public class EventBus {
    // Listener list: read by every event — rarely modified
    private final CopyOnWriteArrayList<EventListener> listeners =
        new CopyOnWriteArrayList<>();

    // Called rarely (on startup or plugin load)
    public void register(EventListener listener) {
        listeners.addIfAbsent(listener); // atomic: add only if not already present
    }

    public void unregister(EventListener listener) {
        listeners.remove(listener); // thread-safe: copies array, removes, replaces
    }

    // Called thousands of times per second — lock-free read
    public void dispatch(Event event) {
        // iterator() returns a SNAPSHOT — safe even if listeners modified during iteration
        for (EventListener listener : listeners) {
            listener.onEvent(event);
        }
        // No ConcurrentModificationException possible
    }
}`,
      },
      {
        title: "When NOT to Use CopyOnWriteArrayList",
        description: "Every write copies the entire array — O(N) per mutation. For frequently-modified lists, the GC pressure and write cost outweigh the read benefit.",
        code: `// BAD: high-write scenario — each add copies the entire array
CopyOnWriteArrayList<String> log = new CopyOnWriteArrayList<>();
for (int i = 0; i < 100_000; i++) {
    log.add("entry-" + i); // copies 0, 1, 2, ... 99,999 elements = O(N²) total
}

// BETTER for high-write: ConcurrentLinkedQueue or synchronized ArrayList
Queue<String> log2 = new ConcurrentLinkedQueue<>();
for (int i = 0; i < 100_000; i++) {
    log2.offer("entry-" + i); // O(1) per insertion, lock-free
}

// Size check pitfall: size() reads the current snapshot reference
// Under concurrent modifications, snapshot may be stale
int size = list.size(); // snapshot size — may differ from the live list immediately after`,
      },
    ],
    pitfalls: [
      "O(N) per write — every add/remove/set copies the entire backing array. Never use in write-heavy scenarios.",
      "Memory overhead: two array copies exist briefly during mutation. For large lists, this adds GC pressure.",
      "Iterator is a snapshot — it does NOT reflect modifications made after the iterator was created. Safe for iteration but not for 'live view' use cases.",
    ],
    bestPractices: [
      "Use ONLY for read-dominated lists with rare, small writes — event listeners, plugin registries, config lists",
      "For write-heavy: use ConcurrentLinkedQueue, ConcurrentSkipListSet, or a synchronized wrapper",
      "Prefer addIfAbsent() over contains() + add() — it's atomic, avoiding the check-then-act race",
      "Document that the collection is CopyOnWrite in the class Javadoc — the performance characteristics surprise developers",
    ],
    thumbRules: [
      "Reads >> Writes and list is small (< 1000 elements) → CopyOnWriteArrayList",
      "Reads >> Writes and uniqueness needed → CopyOnWriteArraySet",
      "Write-heavy → ConcurrentLinkedQueue, ConcurrentHashMap (as set via keySet()), or LinkedBlockingQueue",
      "Need sorted concurrent set → ConcurrentSkipListSet (O(log N) reads and writes)",
    ],
    hiddenTruths: [
      "CopyOnWriteArrayList.iterator() creates a snapshot of the array at that instant. The iterator's size is fixed — even if 100 elements are added after the iterator is created, those elements won't be seen and no exception is thrown.",
      "CopyOnWriteArrayList.size() reads the current snapshot. Two consecutive size() calls may return different values if a write happens between them — size() is NOT a transactional check.",
      "Java's CopyOnWriteArrayList uses an internal volatile array reference. The write (add/remove) operation creates a new array, writes it, and does a volatile write to the reference — providing a happens-before guarantee so all subsequent reads see the new array.",
      "CopyOnWriteArraySet is backed by a CopyOnWriteArrayList, not a hash set. contains() is O(N), not O(1). For large sets, this makes containment checks expensive even for read operations.",
    ],
  },

  {
    id: "fork-join-pool-direct",
    title: "ForkJoinPool (Direct Use)",
    category: "Executors",
    tags: ["ForkJoinPool", "work-stealing", "RecursiveTask", "RecursiveAction", "commonPool"],
    purpose:
      "A specialized thread pool for divide-and-conquer recursive algorithms using work-stealing. Each worker thread has its own deque; idle threads steal tasks from other threads' deques. Used internally by parallel streams and CompletableFuture. Use directly when you need custom parallelism levels or isolated pools.",
    signature: `ForkJoinPool pool = new ForkJoinPool();          // parallelism = availableProcessors
ForkJoinPool pool = new ForkJoinPool(int parallelism); // custom parallelism
ForkJoinPool.commonPool()                            // shared JVM-wide pool
pool.invoke(ForkJoinTask<T>)   // submit and BLOCK for result
pool.submit(ForkJoinTask<T>)   // submit non-blocking, returns Future<T>
pool.execute(ForkJoinTask)     // fire-and-forget

// Task types:
RecursiveTask<T>   // compute() returns a value
RecursiveAction    // compute() returns void
CountedCompleter   // callback-based variant`,
    codeExamples: [
      {
        title: "Custom ForkJoinPool — Isolated from commonPool",
        description: "ForkJoinPool.commonPool() is shared by parallel streams and CompletableFuture across the JVM. If you run heavy work on commonPool, you can starve unrelated code. Create a dedicated pool for batch jobs.",
        code: `import java.util.concurrent.*;

// Custom pool: 4 threads, isolated from parallel streams
ForkJoinPool pool = new ForkJoinPool(4);

try {
    // Run a parallel stream on a custom pool (via submit + get trick)
    long result = pool.submit(() ->
        LongStream.rangeClosed(1, 10_000_000)
            .parallel()
            .sum()
    ).get();
    System.out.println("Sum: " + result);
} finally {
    pool.shutdown(); // MUST shutdown custom pools — they are not cleaned up automatically
}

// Why NOT to use commonPool for blocking work:
ForkJoinPool.commonPool().submit(() -> {
    Thread.sleep(10_000); // blocks one of the shared carriers — parallel streams slow down
});`,
      },
      {
        title: "ManagedBlocker — Blocking Inside ForkJoinPool",
        description: "Normal blocking inside ForkJoinPool reduces parallelism — the blocked thread still holds a pool slot. ManagedBlocker tells ForkJoinPool to spawn a compensating thread, maintaining parallelism.",
        code: `// Blocking inside ForkJoinPool without ManagedBlocker — BAD:
// Each blocked task wastes a pool thread
pool.execute(() -> {
    Result r = blockingService.call(); // this thread is now useless
});

// With ManagedBlocker — pool spawns extra thread to compensate:
ForkJoinPool.managedBlock(new ForkJoinPool.ManagedBlocker() {
    volatile Result result;
    volatile boolean done = false;

    @Override
    public boolean block() throws InterruptedException {
        if (!done) {
            result = blockingService.call(); // blocking call
            done = true;
        }
        return true;
    }

    @Override
    public boolean isReleasable() {
        return done;
    }
});`,
      },
    ],
    pitfalls: [
      "ForkJoinPool.commonPool() threads are daemon threads — they don't prevent JVM shutdown. Long-running tasks on commonPool may be aborted.",
      "Blocking in ForkJoinPool tasks without ManagedBlocker reduces effective parallelism — blocked threads hold pool slots.",
      "ForkJoinPool is NOT a replacement for a regular ExecutorService for I/O-bound tasks. Use dedicated thread pools for I/O.",
    ],
    bestPractices: [
      "For CPU-bound parallel algorithms → ForkJoinPool.commonPool() is fine",
      "For batch jobs that shouldn't interfere with parallel streams → create a dedicated ForkJoinPool",
      "Always shutdown() custom ForkJoinPool instances — they are not garbage collected automatically",
      "If you must block inside a ForkJoinPool task → use ForkJoinPool.managedBlock()",
    ],
    thumbRules: [
      "Divide-and-conquer recursion → RecursiveTask<V> in ForkJoinPool",
      "Parallel stream that must not starve other streams → custom ForkJoinPool",
      "I/O-bound work → dedicated ThreadPoolExecutor, not ForkJoinPool",
      "Blocking inside fork-join task → ForkJoinPool.managedBlock() to compensate",
    ],
    hiddenTruths: [
      "All parallel streams in the JVM share ForkJoinPool.commonPool(). A single parallel stream with a blocking operation can saturate commonPool, making ALL other parallel streams sequential until the blocker finishes.",
      "The work-stealing deque is LIFO on the owner's end and FIFO on the stealing end. This means the owner processes its most recent subtasks first (depth-first), while stealers get the oldest tasks (breadth-first). This combination minimizes stack depth while balancing load.",
      "ForkJoinPool.commonPool() size is Runtime.getRuntime().availableProcessors() - 1. On a 1-CPU machine, commonPool has ZERO background threads — all parallel() operations run sequentially on the caller's thread.",
      "The 'async mode' (new ForkJoinPool(p, factory, handler, asyncMode=true)) changes the deque to FIFO on both ends. This is useful for event-driven tasks but breaks the divide-and-conquer performance model.",
    ],
  },

  {
    id: "scheduled-executor-service",
    title: "ScheduledExecutorService",
    category: "Executors",
    tags: ["ScheduledExecutorService", "schedule", "scheduleAtFixedRate", "scheduleWithFixedDelay", "cron"],
    purpose:
      "An ExecutorService that can schedule tasks to run after a delay, or periodically. The preferred replacement for Timer/TimerTask — unlike Timer, it uses a thread pool, handles exceptions gracefully, and supports concurrent execution of periodic tasks.",
    signature: `ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(int corePoolSize);
scheduler.schedule(Runnable, delay, unit)           // run once after delay
scheduler.schedule(Callable<V>, delay, unit)        // run once, returns ScheduledFuture<V>
scheduler.scheduleAtFixedRate(r, initialDelay, period, unit)  // fixed rate (period from START)
scheduler.scheduleWithFixedDelay(r, initialDelay, delay, unit) // fixed delay (delay from END)
scheduler.shutdown()
scheduler.shutdownNow()`,
    codeExamples: [
      {
        title: "Fixed Rate vs Fixed Delay",
        description: "scheduleAtFixedRate triggers every period seconds from the START of the previous run. scheduleWithFixedDelay waits delay seconds after the END of the previous run. Use fixed delay when the task duration is variable.",
        code: `import java.util.concurrent.*;

ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);

// scheduleAtFixedRate: runs at T=0, T=1000, T=2000, ...
// If a run takes 500ms: next run starts at T=1000 (not T=1500)
// If a run takes 1500ms: next run SKIPS — fires immediately when current ends
ScheduledFuture<?> heartbeat = scheduler.scheduleAtFixedRate(
    () -> System.out.println("Heartbeat: " + System.currentTimeMillis()),
    0,    // initial delay: start immediately
    1,    // period
    TimeUnit.SECONDS
);

// scheduleWithFixedDelay: waits 500ms AFTER each run completes
// If a run takes 200ms: next run starts at T=700 (200ms run + 500ms delay)
ScheduledFuture<?> cleanup = scheduler.scheduleWithFixedDelay(
    () -> cleanTempFiles(),
    10,   // initial delay
    60,   // delay between end of one run and start of next
    TimeUnit.SECONDS
);

// Cancel a task
heartbeat.cancel(false); // false = don't interrupt if currently running

// Shutdown (waits for running tasks; cancels pending)
scheduler.shutdown();
scheduler.awaitTermination(5, TimeUnit.SECONDS);`,
      },
      {
        title: "Exception Handling in Periodic Tasks",
        description: "If a periodic task throws an uncaught exception, the ScheduledExecutorService silently cancels future executions. Always wrap the task body in try-catch.",
        code: `// DANGEROUS: if processData() throws, the task is silently stopped
scheduler.scheduleAtFixedRate(() -> processData(), 0, 1, SECONDS);

// CORRECT: catch and log, keep the task alive
scheduler.scheduleAtFixedRate(() -> {
    try {
        processData();
    } catch (Exception e) {
        log.error("processData failed", e); // log but don't rethrow
        // task continues running on next period
    }
}, 0, 1, SECONDS);

// ALSO USEFUL: check cancellation
scheduler.scheduleAtFixedRate(() -> {
    if (Thread.currentThread().isInterrupted()) return; // graceful stop
    try {
        processData();
    } catch (Exception e) {
        log.error("error", e);
    }
}, 0, 1, SECONDS);`,
      },
    ],
    pitfalls: [
      "Uncaught exceptions in periodic tasks silently cancel the task. ALWAYS wrap in try-catch.",
      "scheduleAtFixedRate skips missed executions — if execution takes longer than the period, the next run fires immediately (not in a burst).",
      "newScheduledThreadPool(1) has a single thread — if the task takes longer than the period, tasks queue up. Use newScheduledThreadPool(2+) for multiple concurrent tasks.",
    ],
    bestPractices: [
      "ALWAYS wrap periodic task bodies in try-catch — uncaught exceptions silently stop the schedule",
      "Use scheduleWithFixedDelay for tasks with variable duration (avoids overlap/queuing)",
      "Use scheduleAtFixedRate for fixed-frequency monitoring (heartbeats, metrics emission)",
      "Name the pool thread (via ThreadFactory) for easy identification in thread dumps",
      "Keep a reference to the ScheduledFuture — you'll need it to cancel the task",
    ],
    thumbRules: [
      "Run once after N seconds → schedule(task, delay, unit)",
      "Fixed tick rate (e.g., 10 Hz sensor read) → scheduleAtFixedRate",
      "Task with variable duration, fixed cooldown → scheduleWithFixedDelay",
      "Periodic task stops silently → the task threw an exception — add try-catch",
    ],
    hiddenTruths: [
      "Timer.cancel() only cancels FUTURE executions — it does not interrupt a currently running task. ScheduledFuture.cancel(true) will interrupt the running thread. Most code should use cancel(false) to avoid interrupting mid-operation.",
      "scheduleAtFixedRate does NOT fire extra executions for missed periods. If execution takes 3× the period, only one 'catch-up' execution fires when the current one ends — not three. This matches cron-style semantics.",
      "ScheduledExecutorService with a single thread (newScheduledThreadPool(1)) is NOT the same as a Timer. A Timer is fundamentally single-threaded; ScheduledExecutorService can be resized to more threads later, and it properly handles exceptions.",
      "newScheduledThreadPool(N) creates a ThreadPoolExecutor with a DelayQueue internally. The thread pool size determines how many concurrent scheduled tasks can run — not the number of tasks you can schedule.",
    ],
  },

  {
    id: "var-handle",
    title: "VarHandle (Java 9+)",
    category: "Atomics",
    tags: ["VarHandle", "CAS", "memory ordering", "atomic", "Java 9"],
    purpose:
      "A strongly-typed reference to a variable (field, array element, or static field) that supports atomic operations with configurable memory ordering. VarHandle is the modern, safe replacement for sun.misc.Unsafe — it provides the same low-level CAS, volatile read/write, and plain read/write operations without reflective overhead.",
    signature: `// Lookup in a static initializer
private static final VarHandle VALUE_HANDLE;
static {
    VALUE_HANDLE = MethodHandles.lookup()
        .findVarHandle(MyClass.class, "value", int.class);
}

// Memory ordering modes:
handle.get(obj)                  // plain read
handle.getOpaque(obj)            // ordered read (vs store-store only)
handle.getAcquire(obj)           // acquire read (vs release write)
handle.getVolatile(obj)          // full volatile read
handle.set(obj, val)             // plain write
handle.setRelease(obj, val)      // release write
handle.setVolatile(obj, val)     // full volatile write
handle.compareAndSet(obj, expect, update)   // CAS
handle.compareAndExchange(obj, expect, update) // CAS returning witness value
handle.getAndAdd(obj, delta)     // atomic fetch-and-add`,
    codeExamples: [
      {
        title: "VarHandle for Atomic Field Update (No AtomicXxx Wrapper)",
        description: "AtomicInteger boxes the int and adds overhead for the wrapper object. VarHandle applies CAS directly to a plain int field, eliminating the wrapper object and reducing GC pressure.",
        code: `import java.lang.invoke.*;

public class Counter {
    private int value = 0; // plain int field — no volatile needed, VarHandle manages it

    private static final VarHandle VALUE;
    static {
        try {
            VALUE = MethodHandles.lookup()
                .findVarHandle(Counter.class, "value", int.class);
        } catch (ReflectiveOperationException e) {
            throw new ExceptionInInitializerError(e);
        }
    }

    // CAS-based increment — equivalent to AtomicInteger.incrementAndGet()
    public int increment() {
        int prev, next;
        do {
            prev = (int) VALUE.getVolatile(this); // volatile read
            next = prev + 1;
        } while (!VALUE.compareAndSet(this, prev, next)); // CAS
        return next;
    }

    // Volatile read — equivalent to AtomicInteger.get()
    public int get() {
        return (int) VALUE.getVolatile(this);
    }
}`,
      },
      {
        title: "Memory Ordering Modes — Acquire/Release vs Full Volatile",
        description: "VarHandle exposes hardware memory ordering modes. acquire/release is cheaper than full volatile — it's a one-sided barrier. Full volatile has a two-sided barrier (LoadLoad + StoreStore). Use the weakest ordering that gives correct behavior.",
        code: `// Full volatile (most expensive): two-sided memory barrier
// Use for: flags read/written by many threads without a lock
handle.setVolatile(this, true);   // StoreLoad barrier
boolean v = (boolean) handle.getVolatile(this); // LoadLoad barrier

// Acquire/Release (cheaper): one-sided barrier, sufficient for lock implementations
// Release write: all prior writes are visible to threads doing an acquire read
handle.setRelease(this, true);   // release write — pair with getAcquire on reader
// Acquire read: sees all writes before the matching release write
boolean v2 = (boolean) handle.getAcquire(this); // acquire read

// Plain (cheapest): no barrier — Java memory model allows reordering
// Only correct if you have external synchronization guaranteeing ordering
handle.set(this, value);   // no barrier — fastest but requires careful reasoning

// Opaque: single-variable atomic coherence (no cross-variable ordering)
handle.setOpaque(this, value); // coherent for this variable, no cross-variable ordering`,
      },
    ],
    pitfalls: [
      "VarHandle type casts are unchecked at the language level — passing the wrong type throws WrongMethodTypeException at runtime.",
      "Acquire/Release semantics are weaker than volatile — do not use them for inter-thread visibility unless you understand the JMM ordering guarantees.",
      "VarHandle access to array elements uses a different lookup: MethodHandles.arrayElementVarHandle(int[].class) — not the same as field access.",
    ],
    bestPractices: [
      "Prefer AtomicInteger/AtomicReference/LongAdder for application code — VarHandle is for library/framework authors",
      "Obtain VarHandle in a static initializer, never per-operation — lookup is expensive",
      "Use setRelease/getAcquire for lock-free algorithm publication patterns — cheaper than full volatile and correct for happens-before",
      "Always cast the return value — get() returns Object, cast is required and is checked at runtime",
    ],
    thumbRules: [
      "Application-level counter → AtomicInteger (simpler, same performance for typical use)",
      "Library code avoiding object wrapper overhead → VarHandle on plain field",
      "Need acquire/release semantics (e.g., lock implementation) → VarHandle.setRelease / getAcquire",
      "CAS on a field → VarHandle.compareAndSet() (equivalent to Unsafe.compareAndSwapInt without the danger)",
    ],
    hiddenTruths: [
      "VarHandle was introduced in Java 9 specifically to replace sun.misc.Unsafe for field-level atomic operations. Unsafe is still in the JDK for legacy reasons, but new code should use VarHandle.",
      "VarHandle.compareAndExchange() (vs compareAndSet) returns the WITNESS value — the actual current value at the time of the CAS attempt. This eliminates the need for an extra get() in CAS retry loops and is how optimistic algorithms are built efficiently.",
      "Plain access (VarHandle.get/set without ordering) does NOT have any memory ordering guarantees — it's equivalent to reading/writing a non-volatile field directly. This is useful for single-threaded performance paths where the VarHandle API is used uniformly but ordering is handled externally.",
      "VarHandle method type checking happens at the MethodHandles.Lookup call, not at each access. The result is effectively a direct bytecode instruction with inlining by HotSpot — not a reflective call. This makes it as fast as direct field access after JIT compilation.",
    ],
  },

  {
    id: "thread-builder",
    title: "Thread.Builder / Thread.ofVirtual()",
    category: "Thread API",
    tags: ["Thread.Builder", "virtual threads", "Thread.ofVirtual", "Thread.ofPlatform", "Java 21"],
    purpose:
      "Java 21 introduced Thread.Builder — a fluent API for creating both platform and virtual threads with named, preconfigured settings. Replaces new Thread() + setXxx() chains. Thread.ofVirtual().start() is the preferred way to create virtual threads for one-off tasks.",
    signature: `// Virtual thread builder
Thread.Builder.OfVirtual vb = Thread.ofVirtual();
vb.name(String)               // set thread name
vb.name(String prefix, long start)  // auto-numbered: "prefix-0", "prefix-1", ...
vb.inheritInheritableThreadLocals(boolean)
vb.uncaughtExceptionHandler(handler)

Thread.Builder.OfVirtual.unstarted(Runnable) // create but don't start
Thread.Builder.OfVirtual.start(Runnable)     // create and start
Thread.Builder.OfVirtual.factory()           // returns ThreadFactory

// Platform thread builder
Thread.Builder.OfPlatform pb = Thread.ofPlatform();
pb.name(String)
pb.daemon(boolean)
pb.priority(int)
pb.stackSize(long)
pb.group(ThreadGroup)

// Shorthand
Thread.startVirtualThread(Runnable)          // simplest: create + start virtual thread`,
    codeExamples: [
      {
        title: "Building Named Virtual Threads",
        description: "Thread.ofVirtual().name() gives thread dumps meaningful names. The name(prefix, start) overload auto-numbers threads, making large thread counts debuggable.",
        code: `import java.util.concurrent.*;

// Single named virtual thread
Thread vt = Thread.ofVirtual()
    .name("request-handler")
    .start(() -> handleRequest(request));
vt.join();

// Auto-numbered virtual threads via ThreadFactory
ThreadFactory vtFactory = Thread.ofVirtual()
    .name("api-worker-", 0)  // names: api-worker-0, api-worker-1, ...
    .factory();

ExecutorService exec = Executors.newThreadPerTaskExecutor(vtFactory);
for (Request r : requests) {
    exec.submit(() -> handleRequest(r)); // each gets "api-worker-N" name
}
exec.shutdown();
exec.awaitTermination(30, TimeUnit.SECONDS);`,
      },
      {
        title: "Platform Thread Builder with Daemon and Stack Size",
        description: "Thread.ofPlatform() replaces the verbose new Thread() + setDaemon() + setPriority() pattern. Stack size can be tuned for threads needing deep recursion.",
        code: `// Old way — verbose, mutation-based
Thread t = new Thread(task, "my-thread");
t.setDaemon(true);
t.setPriority(Thread.MIN_PRIORITY);
t.start();

// New way — fluent, immutable builder
Thread t2 = Thread.ofPlatform()
    .name("my-thread")
    .daemon(true)
    .priority(Thread.MIN_PRIORITY)
    .start(task);

// Large stack for deeply recursive algorithms
Thread recursive = Thread.ofPlatform()
    .name("deep-recursion")
    .stackSize(4 * 1024 * 1024) // 4MB stack (default is ~512KB on most JVMs)
    .start(() -> deepRecursiveAlgorithm(data));

// Virtual thread with uncaught exception handler
Thread vt = Thread.ofVirtual()
    .name("monitored-task")
    .uncaughtExceptionHandler((thread, ex) ->
        log.error("Thread {} failed", thread.getName(), ex))
    .start(riskyTask);`,
      },
    ],
    pitfalls: [
      "Thread.ofVirtual().start() creates a new virtual thread for each call — this is intentional and efficient. Do NOT pool virtual threads.",
      "stackSize on virtual threads is ignored — virtual thread stacks grow and shrink dynamically.",
      "Thread.Builder instances are NOT reusable after start() or unstarted() — create a new builder for each configuration.",
    ],
    bestPractices: [
      "Always name threads (or use auto-numbered names) — unnamed threads produce meaningless thread dumps",
      "Use .factory() when passing thread creation to an ExecutorService — the factory retains the builder configuration",
      "For I/O-bound services on Java 21+, use Executors.newVirtualThreadPerTaskExecutor() (backed by Thread.ofVirtual().factory())",
      "Use unstarted() when you need a thread reference before starting — then start() the reference explicitly",
    ],
    thumbRules: [
      "Quick one-off virtual thread → Thread.startVirtualThread(task) (simplest API)",
      "Named virtual thread → Thread.ofVirtual().name('...').start(task)",
      "Many virtual threads with common config (name prefix, handler) → Thread.ofVirtual().name(prefix, 0).factory() → Executors.newThreadPerTaskExecutor(factory)",
      "Platform thread with specific stack size → Thread.ofPlatform().stackSize(N).start(task)",
    ],
    hiddenTruths: [
      "Thread.startVirtualThread(r) is strictly equivalent to Thread.ofVirtual().start(r). It's a convenience shorthand, not a different path. Both create a JVM-managed lightweight thread.",
      "Thread.Builder is immutable after construction — calling name(), daemon(), etc. returns a NEW builder with the updated setting. The original builder is unchanged. This means you can safely reuse a partially-configured builder as a template.",
      "Executors.newVirtualThreadPerTaskExecutor() creates a new virtual thread for EACH submitted task — it is NOT a pool. There is no queue, no core/max sizing, and no rejection policy. If you submit 1M tasks, 1M virtual threads are created (the JVM manages scheduling them onto carrier threads).",
      "Virtual thread names set via Thread.ofVirtual().name() appear in JFR (Java Flight Recorder) events and jstack output. For debugging production virtual-thread applications, naming threads is the single most important diagnostic investment.",
    ],
  },
];

export const CATEGORY_META = {
  "Thread API":  { color: "var(--blue)",  bg: "var(--blue-subtle)",  count: JAVA_API.filter(a => a.category === "Thread API").length },
  Executors:     { color: "var(--red)",   bg: "var(--red-subtle)",   count: JAVA_API.filter(a => a.category === "Executors").length },
  Futures:       { color: "var(--blue)",  bg: "var(--blue-subtle)",  count: JAVA_API.filter(a => a.category === "Futures").length },
  Synchronizers: { color: "var(--gold)",  bg: "var(--gold-subtle)",  count: JAVA_API.filter(a => a.category === "Synchronizers").length },
  Queues:        { color: "var(--green)", bg: "var(--green-subtle)", count: JAVA_API.filter(a => a.category === "Queues").length },
  Collections:   { color: "var(--blue)",  bg: "var(--blue-subtle)",  count: JAVA_API.filter(a => a.category === "Collections").length },
  Atomics:       { color: "var(--gold)",  bg: "var(--gold-subtle)",  count: JAVA_API.filter(a => a.category === "Atomics").length },
  Locks:         { color: "var(--red)",   bg: "var(--red-subtle)",   count: JAVA_API.filter(a => a.category === "Locks").length },
  "Virtual Threads": { color: "#A78BFA", bg: "rgba(167,139,250,.12)", count: JAVA_API.filter(a => a.category === "Virtual Threads").length },
  Misc:          { color: "var(--ink-3)", bg: "var(--paper-2)",      count: JAVA_API.filter(a => a.category === "Misc").length },
};
