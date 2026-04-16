export const CONCEPTS = [
  {
    id: "thread-lifecycle",
    title: "Thread Lifecycle",
    category: "Fundamentals",
    tags: ["thread", "state", "lifecycle"],
    definition:
      "A Java thread moves through six states: NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, and TERMINATED. Understanding these transitions is essential to diagnosing concurrency bugs.",
    whenToUse: [
      "Debugging why a thread appears stuck — check its state with thread dumps",
      "Designing synchronization — know when a thread blocks vs. waits",
      "Using monitoring tools like VisualVM or jstack to analyse live threads",
    ],
    howToThink: [
      "NEW: Thread object created, start() not yet called.",
      "RUNNABLE: After start(). Includes both executing on CPU and ready-to-run (OS schedules it).",
      "BLOCKED: Waiting to acquire an intrinsic lock (synchronized block).",
      "WAITING: Indefinitely waiting — called Object.wait(), Thread.join(), or LockSupport.park().",
      "TIMED_WAITING: Waiting with a timeout — Thread.sleep(ms), Object.wait(ms), LockSupport.parkNanos().",
      "TERMINATED: run() completed or threw an uncaught exception.",
    ],
    codeExamples: [
      {
        title: "Observing Thread States at Runtime",
        description: "Thread.getState() returns the current state. Here we deliberately create a BLOCKED thread (waiting for a held lock) and a TIMED_WAITING thread (sleeping), then observe their states with getState().",
        code: `public class ThreadStateDemo {
    public static void main(String[] args) throws InterruptedException {
        Object lock = new Object();

        Thread blocked = new Thread(() -> {
            synchronized (lock) { /* main holds the lock — this thread can't enter */ }
        });

        Thread sleeping = new Thread(() -> {
            try { Thread.sleep(Long.MAX_VALUE); }
            catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        });

        synchronized (lock) {           // main thread holds lock
            blocked.start();
            sleeping.start();
            Thread.sleep(50);           // give threads time to reach their blocked state

            System.out.println(blocked.getState());   // → BLOCKED
            System.out.println(sleeping.getState());  // → TIMED_WAITING
        }                               // main releases lock — blocked thread can now proceed

        blocked.join();
        sleeping.interrupt();
        sleeping.join();
        System.out.println(blocked.getState());       // → TERMINATED
    }
}`,
      },
    ],
    bestPractices: [
      "Name every thread (Thread.Builder.name() or thread.setName()) — anonymous threads make production thread dumps unreadable",
      "Use jstack <pid> or kill -3 <pid> to capture thread dumps when a production JVM hangs — it shows every thread state",
      "Set UncaughtExceptionHandler globally (Thread.setDefaultUncaughtExceptionHandler) so silent thread crashes are logged",
      "Prefer virtual threads (Java 21) for I/O-bound tasks — a blocked virtual thread does NOT consume an OS thread slot",
    ],
    thumbRules: [
      "Thread BLOCKED for > 1s → likely deadlock or severe lock contention — check what lock it's waiting on",
      "Thread in WAITING indefinitely → check what condition or object it's waiting on — may be a missed notify()",
      "Thread in RUNNABLE but no progress → likely busy-spinning — look for hot loops without any blocking",
      "Thread in TIMED_WAITING inside synchronized → sleep() inside a synchronized block — other threads are locked out",
    ],
    hiddenTruths: [
      "A thread in NEW state has NO OS thread yet. start() is what creates the OS thread — NEW is just a Java object.",
      "RUNNABLE threads can be preempted by the OS scheduler at any bytecode boundary. You cannot assume which line a RUNNABLE thread is executing.",
      "A thread interrupted while in TIMED_WAITING (sleep/wait with timeout) wakes IMMEDIATELY and throws InterruptedException — it does not wait for the timeout to expire.",
      "Thread.stop() (deprecated since Java 1.2) can corrupt object state — it forcibly unwinds the stack and releases all locks mid-write, leaving objects in broken intermediate states. Always use interrupt() for cooperative cancellation.",
    ],
    gotcha:
      "RUNNABLE does NOT mean the thread is currently executing. The OS may have preempted it. A thread in RUNNABLE is either on-CPU or in the OS ready queue.",
    takeaway:
      "Use thread dumps (kill -3 <pid> or jstack) in production to see all thread states at once — the most powerful concurrency debugging tool.",
  },

  {
    id: "thread-creation",
    title: "Thread Creation Methods",
    category: "Fundamentals",
    tags: ["Thread", "Runnable", "Callable", "lambda", "Thread.Builder", "virtual thread"],
    definition:
      "Java provides six main ways to create and run threads: extending Thread, implementing Runnable, implementing Callable (for a return value), using lambdas, submitting to an ExecutorService, and using the Thread.Builder API (Java 21). Each approach has different trade-offs around reusability, return values, exception handling, and resource control.",
    whenToUse: [
      "Extending Thread: never in modern code — ties your class to Thread, prevents extending anything else",
      "Implementing Runnable: fire-and-forget tasks with no return value, no checked exceptions",
      "Callable + Future/ExecutorService: tasks that return a result or throw checked exceptions",
      "Lambda: same as Runnable/Callable but inline — preferred for short, one-off tasks",
      "ExecutorService.submit(): production code — pool management, lifecycle control, Future-based results",
      "Thread.Builder (Java 21): when you need precise control over name, daemon flag, or virtual vs platform",
    ],
    howToThink: [
      "Thread is the execution vehicle; Runnable/Callable is the task. Keep them separate — prefer passing a Runnable to a Thread rather than subclassing.",
      "Callable<T> returns T and can throw checked exceptions. Runnable returns nothing and cannot throw checked exceptions.",
      "A Future<T> is the handle to a Callable's result. future.get() blocks; future.get(timeout, unit) is the safe overload.",
      "ExecutorService is the production standard — it decouples task submission from thread management and handles pooling and lifecycle.",
      "Thread.Builder replaces direct constructor calls in Java 21. Use .ofVirtual() for I/O tasks, .ofPlatform() for CPU-bound tasks with explicit naming.",
      "Daemon threads die when all non-daemon threads finish. Use for background housekeeping (log flusher, GC helper) — never for work that must complete.",
    ],
    codeExamples: [
      {
        title: "Method 1 — Extending Thread (Legacy, Avoid)",
        description: "Subclassing Thread couples your task logic to the thread mechanism. You can't reuse the task in a thread pool, and your class can't extend anything else. Acceptable only for very simple demos.",
        code: `class MyThread extends Thread {
    @Override
    public void run() {
        System.out.println("Running in: " + getName());
    }
}

MyThread t = new MyThread();
t.setName("worker-1");
t.start();   // kicks off run() on a new OS thread
t.join();    // wait for it to finish`,
      },
      {
        title: "Method 2 — Implementing Runnable",
        description: "Separates the task from the thread vehicle. The same Runnable can be reused across multiple threads or submitted to an executor. No return value, no checked exceptions.",
        code: `class PrintTask implements Runnable {
    private final String message;

    PrintTask(String message) { this.message = message; }

    @Override
    public void run() {
        System.out.println(Thread.currentThread().getName() + ": " + message);
    }
}

// Pass the task to a Thread
Runnable task = new PrintTask("hello");
Thread t = new Thread(task, "worker-1");
t.start();
t.join();`,
      },
      {
        title: "Method 3 — Lambda (Runnable inline)",
        description: "Runnable is a @FunctionalInterface, so any zero-argument lambda that returns void is a valid Runnable. This is the idiomatic modern form for short inline tasks.",
        code: `// Lambda replaces the anonymous Runnable class entirely
Thread t = new Thread(() -> {
    System.out.println("Running in: " + Thread.currentThread().getName());
}, "worker-1");
t.start();
t.join();

// Multiple threads with the same lambda task
for (int i = 0; i < 5; i++) {
    final int id = i;
    new Thread(() -> doWork(id), "task-" + id).start();
}`,
      },
      {
        title: "Method 4 — Callable + Future (Return Value)",
        description: "Callable<T> is like Runnable but returns a value and can throw checked exceptions. Wrap in a FutureTask to run on a Thread, or submit to an ExecutorService to get a Future<T>.",
        code: `import java.util.concurrent.*;

// Callable that computes and returns a result
Callable<Integer> task = () -> {
    Thread.sleep(100);   // can throw InterruptedException — unlike Runnable
    return 42;
};

// Option A: run via FutureTask (on a plain Thread)
FutureTask<Integer> futureTask = new FutureTask<>(task);
new Thread(futureTask, "callable-thread").start();
int result = futureTask.get();   // blocks until done; throws ExecutionException on error

// Option B: submit to ExecutorService (preferred)
ExecutorService pool = Executors.newFixedThreadPool(4);
Future<Integer> future = pool.submit(task);
int result2 = future.get(5, TimeUnit.SECONDS);  // timeout overload — always use this
pool.shutdown();`,
      },
      {
        title: "Method 5 — ExecutorService (Production Standard)",
        description: "ExecutorService manages a pool of threads. You submit tasks; the pool runs them. This is the preferred approach for all production code — you control pool size, rejection policy, and lifecycle.",
        code: `import java.util.concurrent.*;

// Fixed pool — capped thread count, predictable memory
ExecutorService pool = Executors.newFixedThreadPool(4);

// execute: Runnable — fire and forget
pool.execute(() -> processEvent(event));

// submit: Runnable or Callable — returns Future for tracking
Future<String> future = pool.submit(() -> fetchData(url));
String data = future.get(10, TimeUnit.SECONDS);

// Graceful shutdown — wait for in-flight tasks, then stop
pool.shutdown();
if (!pool.awaitTermination(30, TimeUnit.SECONDS)) {
    pool.shutdownNow(); // interrupt any still-running tasks
}`,
      },
      {
        title: "Method 6 — Thread.Builder API (Java 21)",
        description: "Thread.Builder replaces the constructor-with-arguments pattern. ofPlatform() builds OS-backed threads; ofVirtual() builds JVM-managed virtual threads. Both support fluent naming, daemon flag, uncaught exception handler, and priority.",
        code: `// Platform thread with full configuration
Thread platform = Thread.ofPlatform()
    .name("payment-worker-", 0)   // auto-numbered: payment-worker-0, -1, -2...
    .daemon(false)                // non-daemon: JVM waits for it to finish
    .priority(Thread.NORM_PRIORITY)
    .uncaughtExceptionHandler((t, ex) -> log.error("Thread {} threw", t.getName(), ex))
    .start(() -> processPayment(order));

// Virtual thread (Java 21) — for I/O-bound tasks
Thread virtual = Thread.ofVirtual()
    .name("io-worker-", 0)
    .start(() -> fetchFromDatabase(query));

// Builder as a factory — reuse the same configuration
Thread.Builder.OfPlatform workerFactory = Thread.ofPlatform()
    .daemon(true)
    .name("bg-", 0);

for (Runnable task : tasks) {
    workerFactory.start(task);    // each call creates a new named thread
}`,
      },
      {
        title: "Daemon vs Non-Daemon Threads",
        description: "The JVM exits when all non-daemon threads finish. Daemon threads are silently killed at that point. Use daemon threads only for background housekeeping tasks that should not block JVM shutdown.",
        code: `// Non-daemon (default): JVM waits for this to finish before exiting
Thread worker = new Thread(() -> processQueue());
worker.setDaemon(false); // default — explicit for clarity

// Daemon: JVM does NOT wait; killed when main thread exits
Thread logger = new Thread(() -> {
    while (true) { flushLogs(); sleep(5000); }
});
logger.setDaemon(true);   // MUST set before start(), or IllegalThreadStateException
logger.start();

// Java 21 Builder — daemon flag in the chain
Thread.ofPlatform().daemon(true).name("log-flusher").start(() -> flushLoop());

// Rule: if the task MUST complete (payment, write-to-DB), it must be non-daemon`,
      },
    ],
    bestPractices: [
      "In production code, always submit tasks to an ExecutorService — never create raw Thread objects for recurring work",
      "Always name your threads: Thread.Builder.name() or thread.setName('service-worker-') — mandatory for readable thread dumps",
      "Set UncaughtExceptionHandler on every pool via ThreadFactory — silent crashes are the #1 hidden reliability bug",
      "Use try-with-resources for ExecutorService (Java 19+) or explicitly call shutdown() in a finally block / shutdown hook",
      "Always use the get(timeout, unit) overload of Future — never future.get() without timeout in production code",
    ],
    thumbRules: [
      "Task returns a value or throws checked exceptions → Callable + Future, not Runnable",
      "Task runs on a repeating schedule → ScheduledExecutorService, not Thread + sleep() loop",
      "Task is one-shot and short-lived → lambda + executor.submit()",
      "Migrating blocking I/O code to Java 21 → swap newFixedThreadPool for newVirtualThreadPerTaskExecutor — one line change",
      "Need precise control over naming, daemon flag, virtual vs platform → Thread.Builder API",
    ],
    hiddenTruths: [
      "Calling thread.run() directly does NOT create a new thread — it executes in the calling thread. The code works but is entirely sequential. This is a silent bug that passes all tests.",
      "Thread IDs (Thread.getId()) are NEVER reused within a JVM session — even after a thread terminates, its ID is permanently retired.",
      "Thread.Builder.ofVirtual().start(r) creates AND starts the virtual thread in one call — there is no separate start() needed.",
      "A FutureTask wrapping a Callable IS a Runnable — you can pass it to new Thread(futureTask).start() AND call futureTask.get() to retrieve the result. It bridges both worlds.",
      "Executors.newCachedThreadPool() can create thousands of OS threads within seconds under sustained load — it's dangerous without an external rate limit or circuit breaker.",
    ],
    gotcha:
      "setDaemon(true) must be called BEFORE start(). Calling it after start() throws IllegalThreadStateException. Also: thread subclasses (extends Thread) make Callable impossible — you'd need a FutureTask wrapper anyway.",
    takeaway:
      "In modern Java: use lambdas + ExecutorService for production tasks. Use Thread.Builder when you need explicit naming or daemon control. Use Callable when the task returns a value. Never subclass Thread.",
  },

  {
    id: "types-of-threads",
    title: "Types of Threads & Real-World Usage",
    category: "Fundamentals",
    tags: ["platform thread", "virtual thread", "daemon", "main thread", "ForkJoin", "carrier thread", "thread pool", "scheduled thread"],
    definition:
      "Java has distinct thread types that differ in how they're created, who manages them, how much memory they use, and what workloads they're suited for. Choosing the wrong thread type for a workload is one of the most common sources of scalability problems — a thread pool sized for CPU work collapses under I/O load, and virtual threads give zero benefit on CPU-bound tasks.",
    whenToUse: [
      "HTTP request handler with blocking DB/HTTP calls → Virtual thread (Java 21) or bounded platform thread pool",
      "CPU-heavy work (image processing, cryptography, ML inference) → Platform thread pool sized to CPU core count",
      "Background housekeeping (log flusher, metrics reporter, heartbeat) → Daemon thread",
      "Periodic recurring tasks (cache refresh, health check, cleanup job) → ScheduledExecutorService thread",
      "Parallel divide-and-conquer algorithms (parallel sort, parallel streams) → ForkJoin worker thread",
      "Startup / orchestration logic → Main thread (then hand off to pools)",
    ],
    howToThink: [
      "Platform thread = 1 OS thread = ~1 MB stack. Creating thousands is fine; millions will OOM.",
      "Virtual thread = JVM fiber = ~few KB. Creating millions is fine. Automatically unmounts from its carrier when blocked on I/O.",
      "Daemon vs Non-Daemon is not about performance — it controls whether the JVM waits for the thread to finish before exit.",
      "A ForkJoin worker thread is a platform thread in a work-stealing pool. It's what runs parallel streams, CompletableFuture.supplyAsync(), and RecursiveTasks.",
      "A carrier thread is an OS thread that virtual threads mount onto. You never create carriers directly — the JVM manages them.",
      "Thread pool threads are platform threads reused across tasks. Reuse amortizes creation cost but ties up OS threads when tasks block on I/O.",
    ],
    codeExamples: [
      {
        title: "Main Thread — Application Entry Point",
        description: "The JVM starts with one non-daemon platform thread: the main thread. It runs main() and typically bootstraps the application — creates thread pools, starts the server, loads configuration. Everything else branches from it.",
        code: `public class Application {
    public static void main(String[] args) {
        // This IS the main thread
        System.out.println("Thread: " + Thread.currentThread().getName());  // "main"
        System.out.println("Daemon: " + Thread.currentThread().isDaemon()); // false
        System.out.println("ID:     " + Thread.currentThread().getId());    // 1 (always)

        // Main thread bootstraps and delegates work to pools
        ExecutorService requestPool = Executors.newFixedThreadPool(10);
        startWebServer(requestPool);

        // JVM stays alive until all non-daemon threads (including requestPool threads) finish
    }
}

// Real-world: Spring Boot, Quarkus, plain main() all start here
// Rule: keep main() thin — validate config, create pools, start the server, then block or exit`,
      },
      {
        title: "Platform Thread (User / Non-Daemon) — Blocking Work, Bounded Pool",
        description: "The classic Java thread — backed 1:1 by an OS thread. ~1 MB stack each. JVM waits for all non-daemon platform threads before exiting. Use a bounded pool for CPU-bound tasks or legacy blocking code that can't migrate to virtual threads.",
        code: `// Platform thread — 1:1 with an OS thread, ~1 MB stack
Thread t = Thread.ofPlatform()
    .name("payment-worker")
    .daemon(false)          // non-daemon: JVM waits for it
    .start(() -> processPayment(order));

// Production: use a bounded pool to cap resource usage
ExecutorService cpuPool = Executors.newFixedThreadPool(
    Runtime.getRuntime().availableProcessors() // # of CPU cores
);

// Real-world use cases for platform threads:
// ✓ CPU-bound: image encoding, cryptography, ML inference, compression
// ✓ Legacy blocking code that uses synchronized and can't be refactored easily
// ✓ Any task where you need a bounded concurrency cap
// ✗ NOT for thousands of simultaneous I/O-blocking tasks (use virtual threads)`,
      },
      {
        title: "Daemon Thread — Background Housekeeping",
        description: "A daemon thread is a background service that the JVM silently kills when all non-daemon (user) threads have exited. It runs alongside the application but must not do work that needs to complete — if the JVM exits, daemon finally blocks may not run.",
        code: `// Daemon thread — killed when all user threads finish
Thread metricsReporter = Thread.ofPlatform()
    .name("metrics-reporter")
    .daemon(true)           // MUST be set before start()
    .start(() -> {
        while (true) {
            try {
                flushMetricsToPrometheus();
                Thread.sleep(10_000);   // report every 10 seconds
            } catch (InterruptedException e) {
                break;
            }
        }
    });

// Real-world daemon thread use cases:
// ✓ Metrics flusher / log buffer flusher
// ✓ Heartbeat / keep-alive sender
// ✓ Garbage collection helpers
// ✓ IDE background indexer
// ✓ Cache TTL eviction loop

// Real-world NON-daemon use cases (must complete):
// ✗ Writing a payment record to DB — use non-daemon; JVM must wait
// ✗ Flushing a message to Kafka — use non-daemon or shutdown hook`,
      },
      {
        title: "Thread Pool Thread — Reused Platform Threads",
        description: "ExecutorService maintains a pool of platform threads that are reused across tasks. Thread creation cost is paid once at startup. Use for short-to-medium tasks. Under sustained blocking I/O, pool threads sit idle waiting — this is where virtual threads win.",
        code: `// Fixed pool: good for CPU-bound work — matches hardware parallelism
ExecutorService cpuPool = Executors.newFixedThreadPool(
    Runtime.getRuntime().availableProcessors() + 1
);

// Cached pool: creates threads on demand, reuses idle ones — short I/O bursts
ExecutorService burstPool = Executors.newCachedThreadPool();
// ⚠ Unbounded — can exhaust OS thread limit under sustained load

// Production pool with custom settings
ThreadPoolExecutor httpPool = new ThreadPoolExecutor(
    50,                              // core: always-alive threads (sized for normal load)
    200,                             // max: burst capacity
    60L, TimeUnit.SECONDS,           // idle timeout for extra threads
    new LinkedBlockingQueue<>(1000), // bounded queue — back-pressure when all threads busy
    r -> {
        Thread t = new Thread(r);
        t.setName("http-handler-" + t.getId());
        t.setDaemon(false);
        return t;
    },
    new ThreadPoolExecutor.CallerRunsPolicy() // if full: caller thread handles the task
);

// Real-world: Spring MVC (Tomcat default), gRPC servers, JDBC connection pools`,
      },
      {
        title: "Virtual Thread — I/O-Bound Scale (Java 21)",
        description: "Virtual threads are JVM-managed fibers (~KB each). When they block on I/O, they unmount from their carrier OS thread — the carrier is free to run other virtual threads. One virtual thread per request scales to C10K+ without pool sizing headaches.",
        code: `// Virtual thread — JVM-managed, ~KB each, millions can coexist
Thread vt = Thread.ofVirtual()
    .name("request-handler-", 0)
    .start(() -> handleRequest(request)); // blocks on DB/HTTP? Carrier is freed

// Production: submit tasks to the executor — creates one VT per task
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (HttpRequest req : incomingRequests) {
        executor.submit(() -> {
            // This blocks on a database call
            User user = db.findUser(req.getUserId());    // I/O block → VT unmounts
            Order order = db.findOrder(req.getOrderId()); // I/O block → VT unmounts
            return buildResponse(user, order);
        });
    }
}

// Spring Boot 3.2+ — one line migration
// application.properties: spring.threads.virtual.enabled=true

// Real-world: REST API servers, microservices with DB/cache calls, gRPC services
// NOT for: CPU-heavy image processing, ML inference, cryptography (use platform threads)`,
      },
      {
        title: "ForkJoin Worker Thread — Parallel Computation",
        description: "ForkJoinPool workers are platform threads in a work-stealing pool. When a worker runs out of tasks, it steals from a busier worker's queue. These are the threads behind parallel streams, CompletableFuture.supplyAsync(), and RecursiveTask. You rarely create them directly.",
        code: `import java.util.concurrent.*;
import java.util.Arrays;

// ForkJoin RecursiveTask — parallel array sum
class ParallelSum extends RecursiveTask<Long> {
    private final long[] data;
    private final int start, end;
    static final int THRESHOLD = 10_000;

    ParallelSum(long[] data, int start, int end) {
        this.data = data; this.start = start; this.end = end;
    }

    @Override
    protected Long compute() {
        if (end - start <= THRESHOLD) {
            // Small enough — do sequentially on this ForkJoin worker thread
            long sum = 0;
            for (int i = start; i < end; i++) sum += data[i];
            return sum;
        }
        int mid = (start + end) / 2;
        ParallelSum left  = new ParallelSum(data, start, mid);
        ParallelSum right = new ParallelSum(data, mid, end);
        left.fork();                        // submit left to another worker (async)
        return right.compute() + left.join(); // compute right here, wait for left
    }
}

// Used automatically by:
long[] arr = new long[10_000_000];
Arrays.parallelSort(arr);                   // ForkJoin worker threads
Arrays.stream(arr).parallel().sum();        // ForkJoin common pool
CompletableFuture.supplyAsync(() -> compute()); // ForkJoin common pool

// Real-world: parallel streams in analytics pipelines, parallel sort, image pixel processing`,
      },
      {
        title: "Scheduled Thread — Periodic & Delayed Tasks",
        description: "ScheduledExecutorService runs tasks at a fixed rate or after a delay. It replaced java.util.Timer (which was single-threaded and swallowed exceptions). Use scheduleAtFixedRate for periodic jobs and schedule for one-shot delayed tasks.",
        code: `import java.util.concurrent.*;

ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(4);

// One-shot: run once after 5 seconds
scheduler.schedule(
    () -> sendWelcomeEmail(userId),
    5, TimeUnit.SECONDS
);

// Fixed rate: run every 30 seconds regardless of how long the task takes
// If task takes > 30s, next run starts immediately (no gap)
ScheduledFuture<?> healthCheck = scheduler.scheduleAtFixedRate(
    () -> pingDependencies(),
    0,   // initial delay
    30,  TimeUnit.SECONDS
);

// Fixed delay: wait 30 seconds AFTER each run completes before starting the next
scheduler.scheduleWithFixedDelay(
    () -> cleanExpiredSessions(),
    0, 30, TimeUnit.SECONDS
);

// Real-world use cases:
// ✓ Health checks, readiness probes
// ✓ Cache refresh (reload config every 60s)
// ✓ Session cleanup, token expiry
// ✓ Metrics aggregation window
// ✓ Retry scheduler for failed operations`,
      },
      {
        title: "Carrier Thread — The OS Thread Under Virtual Threads",
        description: "A carrier thread is the OS platform thread that a virtual thread runs on. The JVM maintains a small pool of carrier threads (default: one per CPU core, backed by ForkJoinPool). You never create or interact with carriers directly — but understanding them explains virtual thread pinning.",
        code: `// Carrier threads are managed by the JVM — you never create them directly
// They live in a ForkJoinPool with parallelism = Runtime.availableProcessors()

// How mounting/unmounting works:
void handleRequest() {
    // Virtual thread running on carrier thread #3
    String data = callHttpApi();   // blocks on network I/O
    // ↑ VT UNMOUNTS from carrier #3 here
    // ↑ Carrier #3 is NOW FREE to run another virtual thread

    // ... network response arrives ...
    // ↑ VT REMOUNTS onto ANY available carrier (may be #3, #1, or #7)

    String result = processData(data); // CPU work — VT stays mounted
}

// You can observe carrier threads in thread dumps — they appear as:
// "ForkJoinPool-1-worker-1" mounting virtual threads

// Pinning — virtual thread CANNOT unmount from its carrier:
synchronized (myLock) {
    callHttpApi();  // carrier is stuck here — PINNING. Bad for throughput.
}

// Fix: use ReentrantLock so VT can unmount while waiting for I/O
lock.lock();
try {
    callHttpApi();  // carrier is FREE — VT unmounts
} finally { lock.unlock(); }

// Check pinning events: -Djdk.tracePinnedThreads=full`,
      },
    ],
    bestPractices: [
      "Match thread type to workload before writing a single line: I/O → virtual, CPU → platform pool, periodic → scheduled, divide-and-conquer → ForkJoin",
      "Size platform thread pools to CPU cores for CPU-bound work: Runtime.getRuntime().availableProcessors() — more threads won't help and will cause contention",
      "setDaemon(true) MUST be called before start() — daemon status cannot be changed after a thread starts",
      "Name every thread pool with a custom ThreadFactory — 'http-handler-3' in a thread dump is worth 100x more than 'pool-1-thread-3'",
      "When adopting virtual threads, audit all libraries for synchronized blocks that could cause pinning — replace with ReentrantLock",
    ],
    thumbRules: [
      "I/O-bound task (DB, HTTP, file, network) → Virtual thread (Java 21) — unlimited concurrency, minimal memory",
      "CPU-bound task (image processing, crypto, ML) → Platform thread pool sized to core count — more threads = more contention, not more speed",
      "Background housekeeping that MUST NOT delay JVM shutdown → Daemon thread",
      "Background housekeeping that MUST complete before JVM exits → Non-daemon thread (or shutdown hook)",
      "Divide-and-conquer parallel computation → ForkJoinPool (via parallel streams or RecursiveTask) — don't use a regular executor",
    ],
    hiddenTruths: [
      "Virtual threads give ZERO performance benefit for CPU-bound work. The JVM still has one carrier thread per CPU core. Virtual threads multiply I/O concurrency — they don't add CPU parallelism.",
      "The ForkJoin common pool is shared by ALL parallel streams, CompletableFuture.supplyAsync(), and Arrays.parallelSort() in your entire JVM. One slow blocking task in the common pool can stall all parallel streams.",
      "A carrier thread pool is not your application's thread pool — carrier threads are managed by the JVM (backed by a ForkJoinPool) and you cannot submit tasks to them. They're invisible infrastructure.",
      "Thread pool threads blocking on synchronized blocks prevent virtual threads from unmounting — migrating to virtual threads requires auditing every library your code calls for synchronized usage.",
      "Daemon threads are silently killed even if they hold resources (file handles, DB connections, uncommitted transactions). The JVM does NOT run daemon thread's finally blocks during abrupt shutdown.",
    ],
    gotcha:
      "Virtual threads give ZERO benefit for CPU-bound work — the JVM has the same number of carrier threads as CPU cores regardless. Putting CPU-heavy tasks on virtual threads just competes for carrier slots. Match thread type to workload: platform for CPU, virtual for I/O.",
    takeaway:
      "Decision tree: Is the task I/O-bound? → Virtual thread. Is it CPU-bound? → Platform thread pool sized to core count. Does it run forever in the background? → Daemon thread. Does it run periodically? → ScheduledExecutorService. Does it do divide-and-conquer computation? → ForkJoinPool (via parallel streams or RecursiveTask).",
  },

  {
    id: "inter-thread-communication",
    title: "Inter-Thread Communication",
    category: "Fundamentals",
    tags: ["wait", "notify", "notifyAll", "join", "interrupt", "Exchanger", "pipe"],
    definition:
      "Inter-thread communication is the set of mechanisms by which threads coordinate state changes and exchange data. Java provides three layers: the Object monitor methods (wait/notify — built into every object), the Thread control methods (join, interrupt, sleep, yield), and higher-level constructs (BlockingQueue, Exchanger, Phaser, CompletableFuture).",
    whenToUse: [
      "wait/notify: producer-consumer when you control the lock and need precise condition signalling",
      "join(): main thread (or coordinator) waiting for worker threads to finish",
      "interrupt(): requesting a thread to stop gracefully — it is a request, not a force-kill",
      "BlockingQueue: preferred over wait/notify for producer-consumer — simpler, no manual lock management",
      "Exchanger: exactly two threads that need to swap an object at a synchronization point",
    ],
    howToThink: [
      "wait() MUST be called inside a synchronized block on the same object — it atomically releases the lock and suspends the thread.",
      "notify() wakes one arbitrary waiting thread; notifyAll() wakes all. Prefer notifyAll() unless you know all waiters are identical.",
      "Always re-check the condition after waking from wait() in a while loop — spurious wakeups and wrong-side wakeups are real.",
      "Thread.interrupt() sets the interrupt flag. Blocking methods (sleep, wait, join) throw InterruptedException when the flag is set. Non-blocking code must check Thread.currentThread().isInterrupted() manually.",
      "join() establishes a happens-before: everything the joined thread did is visible to the joining thread after join() returns.",
      "sleep() does NOT release locks. wait() DOES release the lock — this is the critical difference.",
    ],
    codeExamples: [
      {
        title: "wait() / notify() — Condition-Based Coordination",
        description: "The classic pattern: a thread waits (releases the lock) until another thread changes a condition and calls notify(). Always guard with while(), not if() — spurious wakeups can wake threads before the condition is true.",
        code: `public class MessageBus {
    private String message = null;
    private final Object lock = new Object();

    // Producer: sets message and signals the consumer
    public void send(String msg) throws InterruptedException {
        synchronized (lock) {
            while (message != null) {
                lock.wait(); // queue full — wait for consumer to take
            }
            this.message = msg;
            lock.notifyAll(); // wake consumer(s)
        }
    }

    // Consumer: waits until a message is available
    public String receive() throws InterruptedException {
        synchronized (lock) {
            while (message == null) {
                lock.wait(); // no message — wait for producer
            }
            String msg = this.message;
            this.message = null;
            lock.notifyAll(); // wake producer(s)
            return msg;
        }
    }
    // Key rule: while(condition) wait() — never if(condition) wait()
}`,
      },
      {
        title: "notify() vs notifyAll() — When to Use Which",
        description: "notify() wakes one arbitrary waiting thread. notifyAll() wakes all of them. Use notify() only when all waiting threads are waiting for the same condition AND any one of them can proceed. In all other cases, use notifyAll().",
        code: `// SAFE: notifyAll — wakes everyone, each re-checks their condition
public synchronized void put(Object item) throws InterruptedException {
    while (queue.isFull()) wait();
    queue.add(item);
    notifyAll(); // correct: wakes both producers AND consumers, each re-checks
}

// RISKY: notify — wakes only one; if it's the wrong side, progress stops
public synchronized void put(Object item) throws InterruptedException {
    while (queue.isFull()) wait();
    queue.add(item);
    notify(); // DANGER: may wake another producer (condition still false) → all sleep forever
}

// SAFE to use notify() ONLY when:
// 1. All waiting threads have identical wait conditions
// 2. Exactly one thread needs to wake up
// 3. You can guarantee no thread in a different condition waits on the same lock
// → Otherwise: always use notifyAll()`,
      },
      {
        title: "Thread.join() — Wait for Another Thread to Finish",
        description: "join() blocks the calling thread until the target thread terminates. It establishes a happens-before: all writes by the finished thread are visible after join() returns. Use the timeout overload to avoid hanging forever.",
        code: `Thread worker = new Thread(() -> {
    doHeavyComputation();    // runs independently
    System.out.println("Worker done");
});

worker.start();

// Main thread continues running concurrently with worker...
doOtherWork();

// Now wait for worker to finish (blocking)
worker.join();               // blocks until worker terminates
// join() happens-before: doHeavyComputation()'s results are now visible here

// With timeout — safer
boolean finished = false;
try {
    worker.join(5000);                           // wait at most 5 seconds
    finished = !worker.isAlive();
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();
}
if (!finished) handleTimeout();`,
      },
      {
        title: "Thread.interrupt() — Cooperative Cancellation",
        description: "interrupt() sets a flag on the target thread. Blocking methods (sleep, wait, join) detect it and throw InterruptedException immediately. Non-blocking code must check isInterrupted() manually. It's a request — the target thread decides when to stop.",
        code: `class CancellableTask implements Runnable {
    @Override
    public void run() {
        try {
            while (!Thread.currentThread().isInterrupted()) {
                // Non-blocking work: check flag manually
                processNextItem();
                Thread.sleep(100); // blocking: throws InterruptedException if interrupted
            }
        } catch (InterruptedException e) {
            // A blocking method was interrupted — clean up and exit
            Thread.currentThread().interrupt(); // restore interrupt flag for callers
            System.out.println("Task cancelled cleanly");
        } finally {
            releaseResources();  // always run cleanup
        }
    }
}

Thread t = new Thread(new CancellableTask());
t.start();

Thread.sleep(500);
t.interrupt();  // signal cancellation — does NOT forcibly stop the thread
t.join();       // wait for clean shutdown`,
      },
      {
        title: "Thread.sleep() vs Object.wait() — Key Difference",
        description: "sleep() suspends the current thread for a time but KEEPS any locks it holds. wait() suspends the thread AND releases the lock on the object. Confusing these causes deadlocks.",
        code: `Object lock = new Object();

// sleep() — holds lock for the entire duration
synchronized (lock) {
    System.out.println("Holding lock, sleeping...");
    Thread.sleep(1000); // OTHER THREADS CANNOT ENTER synchronized(lock) for 1 second
    System.out.println("Still holding lock");
}

// wait() — releases lock, allows other threads in
synchronized (lock) {
    System.out.println("Holding lock, waiting...");
    lock.wait(); // releases lock AND suspends thread until notify()
    // At this point, lock is re-acquired before continuing
    System.out.println("Resumed — holding lock again");
}

// Summary:
// sleep(ms) — pause, keep locks, timer-based resume
// wait()    — pause, release lock, notification-based resume (must hold lock to call)`,
      },
      {
        title: "Thread.yield() and Thread Priority",
        description: "yield() hints to the scheduler that the current thread is willing to give up CPU time. It's rarely needed in modern code — the JVM scheduler handles this. Thread priorities are hints, not guarantees.",
        code: `// yield() — hint to scheduler: "I can give up my time slice"
// Rarely useful — prefer blocking constructs or sleep() for actual waits
void busyWait() {
    while (!conditionMet()) {
        Thread.yield(); // slightly more cooperative than a pure spin
    }
}

// Thread priority — hint only, not a guarantee
Thread high = new Thread(importantTask);
high.setPriority(Thread.MAX_PRIORITY);  // 10 — just a hint to the OS scheduler

Thread low = new Thread(backgroundTask);
low.setPriority(Thread.MIN_PRIORITY);   // 1

// Priorities are unreliable on modern OS — don't rely on them for correctness
// Use fair queues, executors, or explicit coordination instead`,
      },
    ],
    bestPractices: [
      "Prefer BlockingQueue (LinkedBlockingQueue, ArrayBlockingQueue) over wait/notify for producer-consumer — it handles all edge cases correctly",
      "Never swallow InterruptedException — always either re-throw it or restore the flag with Thread.currentThread().interrupt()",
      "Always check Thread.currentThread().isInterrupted() in long-running non-blocking loops — the only way interrupt works for non-blocking code",
      "Use Condition objects (from ReentrantLock.newCondition()) instead of wait/notify in new code — multiple condition queues on one lock, more debuggable",
      "Always use join(timeout) in production — join() with no timeout blocks forever if the joined thread deadlocks",
    ],
    thumbRules: [
      "Need to pass data between threads? → BlockingQueue.put()/take() — never shared variable + wait/notify",
      "Need to signal N threads simultaneously to start? → CountDownLatch(1).countDown()",
      "Need to cancel a background thread? → interrupt() + check isInterrupted() in the loop body",
      "Need a result from a thread? → CompletableFuture or Future<T> — not join() + shared field",
      "Two threads need to swap objects? → Exchanger<T> (the only safe two-thread swap primitive)",
    ],
    hiddenTruths: [
      "Thread.interrupted() (static) reads AND CLEARS the interrupt flag. thread.isInterrupted() (instance) reads WITHOUT clearing. Mixing them up is one of the most common concurrency bugs — a cleared flag means the interrupt is permanently lost.",
      "When a thread calling wait() is interrupted, it throws InterruptedException AND the interrupt flag is cleared BEFORE the exception is thrown. If you catch it without restoring the flag, the interrupt silently disappears.",
      "notify() can cause permanent livelock if different threads wait on the same lock for DIFFERENT conditions. One wrong notify() wakes the wrong waiter, which goes back to sleep — nobody makes progress.",
      "join() with no argument blocks the caller indefinitely. If the joined thread deadlocks, your thread deadlocks with it. In production, always join(5000) with a fallback timeout path.",
      "sleep() holds all locks the thread currently owns. wait() releases the SINGLE lock you called it on. A thread can hold multiple locks and call wait() — the OTHER locks are still held, potentially causing contention.",
    ],
    gotcha:
      "Never call wait() in an if() block — always while(). Spurious wakeups are guaranteed by the JVM spec to be possible. Also: sleep() does NOT release locks; wait() does. Confusing these is a classic deadlock source.",
    takeaway:
      "Prefer high-level constructs: BlockingQueue over wait/notify, CompletableFuture or ExecutorService over manual join/interrupt, Semaphore over busy-wait. Use the low-level Object monitor methods only when the higher-level tools don't fit.",
  },

  {
    id: "java-memory-model",
    title: "Java Memory Model (JMM) & happens-before",
    category: "Fundamentals",
    tags: ["JMM", "happens-before", "visibility", "memory"],
    definition:
      "The Java Memory Model (JLS §17.4) defines rules about when writes to shared variables are visible to other threads. The core concept is happens-before: if action A happens-before action B, then all memory effects of A are visible to B.",
    whenToUse: [
      "Any time two threads share mutable state without locking",
      "Understanding why volatile is needed even for boolean flags",
      "Reasoning about double-checked locking, publication safety, final fields",
    ],
    howToThink: [
      "Each thread has its own local cache. Without happens-before, writes may never be flushed to main memory.",
      "happens-before is established by: synchronized (monitor lock/unlock), volatile write → volatile read, Thread.start(), Thread.join(), and transitivity.",
      "volatile guarantees visibility AND prevents instruction reordering around the variable.",
      "final fields written in a constructor are safely published — no synchronization needed for reads after construction.",
    ],
    codeExamples: [
      {
        title: "The Problem — Missing JMM Guarantee",
        description: "Without volatile, the JVM is free to cache the `stop` flag in a CPU register. Thread B may never see Thread A's write — it loops forever.",
        code: `class BrokenFlag {
    boolean stop = false; // not volatile — JVM may cache this per-thread

    void writer() { stop = true; }         // Thread A writes to main memory
    void reader() { while (!stop) {} }     // Thread B may loop forever (stale cache)
}`,
      },
      {
        title: "Fix 1 — volatile for Visibility",
        description: "volatile forces every write to flush to main memory and every read to fetch from main memory, establishing a happens-before relationship between writer and reader threads.",
        code: `class SafeFlag {
    volatile boolean stop = false;

    void writer() { stop = true; }         // write flushes to main memory immediately
    void reader() { while (!stop) {} }     // always reads from main memory — sees the write
}`,
      },
      {
        title: "Fix 2 — synchronized for Visibility + Mutual Exclusion",
        description: "synchronized unlock happens-before the next lock acquisition on the same monitor, making the write visible. Use this when you also need atomicity for compound operations.",
        code: `class SafeWithSync {
    boolean stop = false;

    synchronized void writer() { stop = true; }
    synchronized void reader() { while (!stop) {} }
    // Monitor lock/unlock establishes happens-before — write is visible on next lock
}`,
      },
    ],
    bestPractices: [
      "When in doubt about whether synchronization is needed: if two threads share a variable and at least one writes, you MUST synchronize",
      "Use volatile for simple flags; AtomicXxx for counters/single variables with compound ops; synchronized/locks for multi-variable atomicity",
      "Declare final fields for all state that doesn't change after construction — final fields have special happens-before guarantees",
      "When publishing a mutable object to another thread, either synchronize the publication point or make the object immutable",
      "Use static initializers or Initialization-on-demand holder for lazy singletons — they are class-loader-synchronized for free",
    ],
    thumbRules: [
      "Two threads share one variable, one writes → volatile is sufficient for visibility",
      "Counter incremented by multiple threads → AtomicInteger, NOT volatile int",
      "Multiple variables must be updated as a unit → synchronized block or lock",
      "Object published to another thread after construction → volatile reference OR synchronize the publication",
      "Lazy singleton initialization → Initialization-on-demand holder pattern (safest) or volatile + DCL",
    ],
    hiddenTruths: [
      "long and double reads/writes are NOT atomic on 32-bit JVMs — the JVM can split a 64-bit value into two 32-bit halves and write them separately. Another thread can read a half-written value. Use volatile long or AtomicLong for shared 64-bit values.",
      "The JVM and CPU can reorder instructions within a thread as long as the observed result within that thread appears correct. This reordering IS visible to other threads and causes data races — the JMM exists to define exactly when this is safe.",
      "new MyObject() is NOT atomic. It expands to: allocate memory → run constructor (write fields) → assign reference. Without volatile, another thread can see the reference BEFORE the constructor finishes, reading a partially initialized object.",
      "Static initializers are thread-safe — they run under the class loader's lock. However, if two static initializers depend on each other (class A's static init calls class B, whose static init calls class A), you get a class-loading deadlock.",
    ],
    gotcha:
      "volatile prevents reordering and ensures visibility, but it does NOT make compound operations atomic. i++ on a volatile int is still a race condition (read-modify-write is three steps).",
    takeaway:
      "When in doubt: if two threads share a variable and at least one writes, you need synchronization. volatile for simple flags; synchronized / locks for compound operations.",
  },

  {
    id: "synchronized",
    title: "synchronized keyword",
    category: "Synchronization",
    tags: ["synchronized", "monitor", "intrinsic lock", "mutual exclusion"],
    definition:
      "synchronized acquires an intrinsic (monitor) lock before entering a block or method, and releases it on exit (even if an exception is thrown). Only one thread can hold the lock at a time, ensuring mutual exclusion and establishing happens-before.",
    whenToUse: [
      "Protecting shared mutable state that requires multi-step reads/writes",
      "Implementing wait/notify patterns (producer-consumer, etc.)",
      "Simple use cases where ReentrantLock's extra features aren't needed",
    ],
    howToThink: [
      "synchronized(this) or a synchronized instance method locks on the instance.",
      "synchronized on a static method or synchronized(MyClass.class) locks on the Class object — class-level lock.",
      "Prefer a private final Object lock = new Object() over locking on this — prevents external code from interfering.",
      "synchronized is reentrant: the same thread can re-enter a block it already holds the lock for.",
    ],
    codeExamples: [
      {
        title: "Method-Level Lock",
        description: "Applying synchronized to an instance method acquires the intrinsic lock on 'this'. Every synchronized instance method on the same object shares the same lock.",
        code: `public class Counter {
    private int count = 0;

    // Locks on 'this' — no two synchronized methods run concurrently on the same instance
    public synchronized void increment() {
        count++;
    }
    public synchronized int get() {
        return count;
    }
}`,
      },
      {
        title: "Block-Level Lock with Private Object",
        description: "Prefer a private final lock object over locking on 'this'. External code cannot accidentally acquire your lock, and you can use a narrower lock scope for better throughput.",
        code: `public class SafeCounter {
    private final Object lock = new Object(); // private — external code can't interfere
    private int count = 0;

    public void increment() {
        // non-critical work BEFORE the block — no lock held, runs concurrently
        synchronized (lock) {
            count++;  // only this narrow section needs mutual exclusion
        }
        // non-critical work AFTER — still no lock held
    }
    public int get() {
        synchronized (lock) { return count; }
    }
}`,
      },
      {
        title: "wait / notify Pattern — Producer-Consumer",
        description: "Object.wait() releases the lock and suspends the thread until notifyAll() wakes it. This must be called inside a synchronized block. Always use while(), not if(), to guard against spurious wakeups.",
        code: `public class BoundedBuffer<T> {
    private final Queue<T> queue = new LinkedList<>();
    private final int capacity;

    public BoundedBuffer(int capacity) { this.capacity = capacity; }

    public synchronized void put(T item) throws InterruptedException {
        while (queue.size() == capacity) wait();  // releases lock; waits for space
        queue.add(item);
        notifyAll();  // wake any waiting consumers
    }

    public synchronized T take() throws InterruptedException {
        while (queue.isEmpty()) wait();           // releases lock; waits for item
        T item = queue.poll();
        notifyAll();  // wake any waiting producers
        return item;
    }
    // Key: 'while' not 'if' — spurious wakeups can occur; re-check condition every time
}`,
      },
    ],
    bestPractices: [
      "Use a private final Object lock = new Object() instead of synchronizing on 'this' — prevents external callers from accidentally holding your lock",
      "Keep synchronized blocks as small as possible — only the minimal code that needs mutual exclusion",
      "Always use while(condition) wait() — never if(condition). Spurious wakeups and multi-condition locks make if() dangerous",
      "Prefer synchronized blocks over synchronized methods — methods lock on 'this' and you can't narrow scope",
      "Release locks as quickly as possible — never do I/O (logging, DB calls, HTTP) inside a synchronized block",
    ],
    thumbRules: [
      "Protecting one shared variable with no compound ops → AtomicXxx is better (lock-free, higher throughput)",
      "Protecting multiple variables as an atomic unit → synchronized block on a private lock",
      "Need wait/notify? → synchronized is required (the only way to call wait/notify)",
      "Need tryLock(), timeout, fairness, or multiple condition queues? → ReentrantLock instead",
      "Static shared state → synchronized(MyClass.class) or a static final lock object",
    ],
    hiddenTruths: [
      "Synchronizing on String literals is dangerous. String literals are interned and shared across class loaders. Two completely unrelated classes that both use synchronized(\"lock\") share the SAME lock object.",
      "synchronized methods are NOT inherited by subclasses. If a subclass overrides a synchronized method without adding synchronized, the override is not synchronized — calls to the override are not mutually exclusive.",
      "static synchronized methods and instance synchronized methods do NOT block each other — they use different locks (Class object vs instance). Two threads can run one of each concurrently on the same instance.",
      "synchronized prevents reordering across the lock boundary (on acquire and release), but does NOT prevent reordering of code INSIDE the synchronized block. For field visibility to be correct, the variable must be volatile OR accessed only while holding the lock consistently.",
      "The JVM's biased locking (pre-Java 15) could make uncontended synchronized essentially free. This optimization was removed in Java 17 — lightly-contested synchronized now has more overhead than before.",
    ],
    gotcha:
      "Always use while (condition) wait(), never if (condition) wait(). Spurious wakeups mean notifyAll() can wake a thread even when the condition hasn't changed.",
    takeaway:
      "synchronized is the simplest correct tool. Reach for ReentrantLock only when you need tryLock(), lockInterruptibly(), fairness, or multiple Condition objects.",
  },

  {
    id: "volatile",
    title: "volatile keyword",
    category: "Synchronization",
    tags: ["volatile", "visibility", "ordering"],
    definition:
      "volatile declares that reads and writes to a variable go directly to main memory. It prevents the CPU/compiler from caching the value in a register and prevents instruction reordering around the variable.",
    whenToUse: [
      "Simple boolean flags to signal thread termination (stopRequested, done)",
      "Single-writer, multiple-reader scalars where atomicity isn't required",
      "Publishing a safely-constructed object reference (store after construction)",
    ],
    howToThink: [
      "volatile ONLY guarantees visibility (write → read ordering) and prevents reordering.",
      "It does NOT guarantee atomicity for compound operations: volatile long/double are atomic on 64-bit JVMs but volatile int++ is still a race.",
      "A volatile write happens-before every subsequent read of the same variable.",
      "Use AtomicInteger/AtomicLong for counters, AtomicReference for CAS operations.",
    ],
    codeExamples: [
      {
        title: "Correct Use — Simple Stop Flag",
        description: "volatile is perfect for a single-writer, multiple-reader boolean flag. The write from requestStop() is immediately visible to the run() loop on any CPU.",
        code: `public class WorkerThread extends Thread {
    private volatile boolean stopRequested = false;

    @Override
    public void run() {
        while (!stopRequested) {   // always reads from main memory
            doWork();
        }
        System.out.println("Thread stopped cleanly.");
    }

    public void requestStop() {
        stopRequested = true;      // write is immediately visible to all threads
    }
}`,
      },
      {
        title: "Wrong — volatile Counter (Still a Race)",
        description: "volatile does NOT make compound operations atomic. count++ is actually three operations: read, increment, write. Two threads can interleave these steps and lose increments.",
        code: `class BrokenCounter {
    private volatile int count = 0;

    public void increment() {
        count++;
        // Looks atomic, but expands to:
        //   int temp = count;     // read
        //   temp = temp + 1;      // increment
        //   count = temp;         // write
        // Two threads can both read the same value → one increment is lost
    }
}`,
      },
      {
        title: "Correct — AtomicInteger for Counters",
        description: "Use AtomicInteger (or AtomicLong) for counters. Its methods use a single hardware CAS instruction, making them truly atomic with no race condition.",
        code: `class SafeCounter {
    private final AtomicInteger count = new AtomicInteger(0);

    public void increment() {
        count.incrementAndGet();   // single atomic CAS — no race
    }
    public int get() {
        return count.get();        // plain read — always consistent
    }
}`,
      },
    ],
    bestPractices: [
      "Use volatile ONLY for simple flags or single-variable state — not for compound operations that need atomicity",
      "Pair volatile references with immutable objects — a volatile reference to an immutable object is fully thread-safe",
      "Document every volatile field with a comment explaining why — volatile usage is non-obvious to readers",
      "Never use volatile as a substitute for synchronized on compound operations — it only guarantees visibility, not atomicity",
      "For counters, use AtomicInteger/AtomicLong. For references with CAS semantics, use AtomicReference.",
    ],
    thumbRules: [
      "Single boolean flag, one writer, many readers → volatile boolean",
      "Counter modified by multiple threads → AtomicInteger, never volatile int",
      "Reference to a newly created immutable object, safely published → volatile reference",
      "Singleton lazy initialization → volatile + DCL, or Initialization-on-demand holder",
      "64-bit value (long/double) shared between threads → volatile long or AtomicLong",
    ],
    hiddenTruths: [
      "volatile writes/reads are NOT free. They flush CPU caches and prevent compiler optimizations. In tight inner loops accessing a volatile variable, performance can drop 5–10x compared to a non-volatile field.",
      "Java's volatile is semantically STRONGER than C++'s volatile. Java volatile establishes a full happens-before relationship. C++ volatile only prevents compiler from caching the value — it gives no memory visibility guarantee across threads. Never assume they're equivalent.",
      "volatile long and volatile double ARE atomic (read or write is one operation) — unlike non-volatile long/double on 32-bit JVMs which can be torn. This is one of the rare cases where volatile adds atomicity, not just visibility.",
      "volatile prevents reordering ACROSS the volatile access, but NOT within the same thread before the write or after the read. Code between two volatile writes can still be reordered by the CPU.",
    ],
    gotcha:
      "volatile is not a drop-in replacement for synchronized. It ensures visibility but not atomicity. Use synchronized or Atomic* classes for read-modify-write operations.",
    takeaway:
      "volatile = visibility only. AtomicXxx = visibility + atomicity for single variable. synchronized = visibility + atomicity + mutual exclusion for blocks.",
  },

  {
    id: "deadlock",
    title: "Deadlock",
    category: "Pitfalls",
    tags: ["deadlock", "lock ordering", "prevention"],
    definition:
      "Deadlock occurs when two or more threads are each waiting for a lock held by the other, causing all of them to block forever. It requires four conditions simultaneously: mutual exclusion, hold-and-wait, no preemption, circular wait.",
    whenToUse: [
      "Recognising the pattern in code that acquires multiple locks",
      "Designing safe multi-lock acquisition ordering",
      "Diagnosing production hangs with thread dumps",
    ],
    howToThink: [
      "Break circular wait by establishing a global lock ordering — always acquire locks in the same order.",
      "Use tryLock(timeout) with ReentrantLock to back off instead of blocking forever.",
      "Reduce lock scope — hold locks for the shortest time possible.",
      "Prefer higher-level concurrency constructs (concurrent collections, executors) that handle locking internally.",
    ],
    codeExamples: [
      {
        title: "Classic Deadlock — Circular Wait",
        description: "Thread 1 holds lockA and waits for lockB. Thread 2 holds lockB and waits for lockA. Neither can proceed — this is the circular-wait deadlock condition.",
        code: `class DeadlockExample {
    private final Object lockA = new Object();
    private final Object lockB = new Object();

    // Thread 1: acquires A, then waits for B
    void methodA() {
        synchronized (lockA) {
            synchronized (lockB) { /* work */ }
        }
    }

    // Thread 2: acquires B, then waits for A — CIRCULAR WAIT → DEADLOCK
    void methodB() {
        synchronized (lockB) {
            synchronized (lockA) { /* work */ }
        }
    }
}`,
      },
      {
        title: "Fix 1 — Consistent Global Lock Ordering",
        description: "Always acquire locks in the same global order everywhere in the codebase. This breaks circular wait — if every thread acquires lockA before lockB, there is no cycle.",
        code: `class FixedOrdering {
    private final Object lockA = new Object();
    private final Object lockB = new Object();

    // Both methods acquire in the same order: A then B — no cycle possible
    void methodA() {
        synchronized (lockA) { synchronized (lockB) { /* work */ } }
    }
    void methodB() {
        synchronized (lockA) { synchronized (lockB) { /* work */ } }
    }
    // Rule: document the lock ordering; enforce it in code review
}`,
      },
      {
        title: "Fix 2 — tryLock with Timeout (Back-Off)",
        description: "ReentrantLock.tryLock(timeout) returns false instead of blocking forever. If you can't acquire both locks in time, release what you have and retry — this breaks hold-and-wait.",
        code: `class TryLockFix {
    private final ReentrantLock lockA = new ReentrantLock();
    private final ReentrantLock lockB = new ReentrantLock();

    boolean doWork() throws InterruptedException {
        while (true) {
            if (lockA.tryLock(50, TimeUnit.MILLISECONDS)) {
                try {
                    if (lockB.tryLock(50, TimeUnit.MILLISECONDS)) {
                        try {
                            // We hold both locks safely
                            return true;
                        } finally { lockB.unlock(); }
                    }
                    // Could not get lockB — release lockA and retry
                } finally { lockA.unlock(); }
            }
            Thread.sleep(1); // small back-off before next attempt
        }
    }
}`,
      },
    ],
    bestPractices: [
      "Establish and DOCUMENT a global lock acquisition order — enforce it in code reviews. One violation anywhere in the codebase is enough to deadlock.",
      "Prefer acquiring at most one lock at a time — design your objects so that one lock per operation is sufficient",
      "Use tryLock(timeout, unit) for any code path where waiting long is possible — it breaks the hold-and-wait condition",
      "Add thread dump analysis to your incident runbooks — jstack clearly labels deadlocks with the full chain",
      "Prefer higher-level abstractions (ConcurrentHashMap, BlockingQueue, Executors) that manage their own internal locking",
    ],
    thumbRules: [
      "Production JVM hangs with BLOCKED threads → take a thread dump immediately: jstack <pid>",
      "Must acquire two locks? → sort them by identity hash (System.identityHashCode) or a stable constant for consistent ordering",
      "Library code where lock order is unknown (3rd party) → use tryLock(timeout) with back-off and retry",
      "Nested method calls that cross lock boundaries? → extract to avoid holding a lock while calling external code",
    ],
    hiddenTruths: [
      "Java does NOT automatically detect or break deadlocks at runtime. The JVM has no deadlock-breaker — deadlocked threads sit blocked forever until a human takes a thread dump or kills the process.",
      "Database deadlocks are different — most DBs (PostgreSQL, MySQL, SQL Server) detect and automatically break deadlocks by rolling back one victim transaction. Thread deadlocks in the JVM are permanently fatal without intervention.",
      "Livelock is 'deadlock with motion' — threads are running, CPU is high, but no useful work is done. Harder to detect because CPU is pegged. Fix with randomized back-off to break symmetry.",
      "A thread can deadlock with itself in rare cases — not via re-entrant locks (which are fine), but via a blocking call between two synchronized methods on different objects where the second locks back to the first.",
      "Object.wait() inside a synchronized block that holds multiple locks is a deadlock trap: wait() releases only ONE lock (the one you called wait() on) — all other held locks stay locked.",
    ],
    gotcha:
      "Thread dumps (jstack) show 'Found 1 deadlock' with the full chain of threads and locks. Run jstack on prod when threads stop making progress.",
    takeaway:
      "The single most effective prevention: establish a global lock acquisition order and document it. Every team member must follow it — one violation is enough to deadlock.",
  },

  {
    id: "race-condition",
    title: "Race Condition",
    category: "Pitfalls",
    tags: ["race condition", "data race", "atomicity"],
    definition:
      "A race condition occurs when the correctness of a program depends on the relative timing or interleaving of threads. The program may produce different results on each run, making it extremely hard to reproduce and debug.",
    whenToUse: [
      "Any shared mutable state accessed by multiple threads without proper synchronization",
      "Check-then-act patterns (if !map.containsKey(k) map.put(k, v)) under concurrency",
      "Lazy initialization without double-checked locking",
    ],
    howToThink: [
      "Identify: what data is shared? Which threads write? Are read-modify-write operations atomic?",
      "Atomicity violations: count++ looks like one instruction but is three (load, add, store).",
      "Check-then-act: the state may change between the check and the action — use atomic operations or synchronization to make it one step.",
      "Use java.util.concurrent collections (ConcurrentHashMap, CopyOnWriteArrayList) instead of wrapping plain collections with synchronized.",
    ],
    codeExamples: [
      {
        title: "The Problem — Check-Then-Act Race (Broken Singleton)",
        description: "Between the null check and the construction, another thread may also see null and create a second instance. The 'check' and 'act' must be one atomic operation.",
        code: `class BrokenSingleton {
    private static BrokenSingleton instance;

    public static BrokenSingleton getInstance() {
        if (instance == null) {               // Thread A checks: null
            instance = new BrokenSingleton(); // Thread B ALSO sees null → two objects!
        }
        return instance;
    }
}`,
      },
      {
        title: "Fix 1 — Double-Checked Locking with volatile",
        description: "The outer null check avoids synchronization on every call (fast path). The inner check inside synchronized prevents duplicate construction. volatile prevents reordering of the assignment.",
        code: `class SafeSingleton {
    private static volatile SafeSingleton instance; // volatile is required here!

    public static SafeSingleton getInstance() {
        if (instance == null) {                      // first check (no lock, fast)
            synchronized (SafeSingleton.class) {
                if (instance == null) {              // second check (inside lock)
                    instance = new SafeSingleton();  // volatile prevents partial publish
                }
            }
        }
        return instance;
    }
}`,
      },
      {
        title: "Fix 2 — Initialization-on-Demand Holder (Best Practice)",
        description: "The JVM guarantees class loading is thread-safe. The Holder class is loaded only when getInstance() is first called, constructing INSTANCE exactly once with no synchronization overhead.",
        code: `class HolderSingleton {
    private static class Holder {
        // JVM loads this class lazily and safely — only when Holder is first referenced
        static final HolderSingleton INSTANCE = new HolderSingleton();
    }

    public static HolderSingleton getInstance() {
        return Holder.INSTANCE; // triggers class loading on first call only
    }
    // No synchronized, no volatile — correctness guaranteed by JVM class loading
}`,
      },
      {
        title: "Fix 3 — Atomic Operations on ConcurrentHashMap",
        description: "Even thread-safe collections have race conditions when you combine multiple operations. Use the atomic methods that make check-and-act a single step.",
        code: `ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();

// WRONG: two atomic operations, but the combined check+put is still a race
if (!map.containsKey("key")) {
    map.put("key", 1); // another thread may have put by now
}

// RIGHT: putIfAbsent — atomic check-then-put
map.putIfAbsent("key", 1);

// BEST: computeIfAbsent — only calls the factory function if key is absent
map.computeIfAbsent("key", k -> computeExpensiveValue(k));`,
      },
    ],
    bestPractices: [
      "Mark every shared mutable field and reason about who writes, who reads, and whether they need synchronization",
      "Use ConcurrentHashMap.computeIfAbsent() for check-then-create patterns — never containsKey() + put() under concurrency",
      "Prefer immutable objects — they are inherently race-free. No synchronization needed for reads",
      "Write multi-threaded tests that run many iterations with random scheduling (use Thread.yield() or Thread.sleep(1) at race-prone points) — races are timing-dependent and won't show in single-threaded tests",
      "Use tools: Java's -ea (assertions), ThreadSanitizer, ErrorProne's thread safety annotations (@GuardedBy)",
    ],
    thumbRules: [
      "Any shared variable with at least one writer → needs synchronized, volatile, or AtomicXxx",
      "if (!map.containsKey(k)) map.put(k, v) → replace with map.putIfAbsent(k, v)",
      "Lazy init without synchronization → safe only with Initialization-on-demand Holder or volatile + DCL",
      "counter++ on a shared variable → AtomicInteger.incrementAndGet()",
      "Object published to another thread after construction → volatile reference OR synchronize the publication",
    ],
    hiddenTruths: [
      "Race conditions don't always produce wrong results on every run — they're timing-dependent. A race that fires 1 in 10,000 executions will pass all local tests and blow up in production on high-traffic days.",
      "ConcurrentHashMap's individual operations (get, put, remove) are atomic, but compound operations are NOT: if (!map.containsKey(k)) map.put(k,v) is still a race. Always use the atomic compound methods: putIfAbsent, computeIfAbsent, compute, merge.",
      "StringBuilder is NOT thread-safe. Shared StringBuilder used by multiple threads causes garbled strings. Use StringBuffer (synchronized) or collect per-thread and merge at the end.",
      "The JVM JIT compiler can cache reads of non-volatile shared variables in CPU registers, making a fresh read completely invisible across threads — your 'correct looking' code may race indefinitely in optimized builds under high load.",
    ],
    gotcha:
      "ConcurrentHashMap makes individual operations thread-safe, but compound operations (containsKey + put) are still races unless you use the atomic methods like putIfAbsent, compute, or merge.",
    takeaway:
      "Think in atomic units. If correctness requires 'check' + 'act' to happen with no other thread intervening, that's one operation — use synchronization or atomic API to make it so.",
  },

  {
    id: "locking-fundamentals",
    title: "Locking Fundamentals",
    category: "Synchronization",
    tags: ["lock", "mutex", "monitor", "intrinsic lock", "explicit lock"],
    definition:
      "A lock is a synchronization primitive that enforces mutual exclusion — at most one thread can hold the lock at a time, ensuring that a critical section is never executed concurrently. Java provides two lock families: intrinsic locks (every object has one, used with `synchronized`) and explicit locks (`java.util.concurrent.locks.Lock`).",
    whenToUse: [
      "Any time multiple threads read AND write a shared mutable variable",
      "Protecting compound check-then-act operations (e.g. if-absent-then-put)",
      "Coordinating access to a shared resource (file, DB connection, data structure)",
      "When you need features beyond synchronized: tryLock, timed lock, interruptible lock",
    ],
    howToThink: [
      "Intrinsic lock (monitor lock): every Java object has one. synchronized(obj) acquires it; the block exit releases it. Built-in, simple, but not flexible.",
      "Explicit lock (ReentrantLock): implements Lock interface. Must always call unlock() in a finally block — no automatic release like synchronized.",
      "A lock protects a resource, not a thread. Multiple threads can contend for the same lock; only one wins at a time.",
      "Lock granularity matters: a coarse-grained lock (one lock for everything) is simple but a bottleneck. Fine-grained locks (per-row, per-bucket) improve throughput but raise deadlock risk.",
      "Monitor pattern: a lock + condition variable + the protected data bundled together. Every synchronized Java object is a monitor.",
    ],
    codeExamples: [
      {
        title: "Intrinsic Lock — synchronized",
        description: "Every Java object has a built-in monitor lock. synchronized(obj) acquires it; the block exit releases it automatically, even on exception. Two modes: method-level (locks on 'this') and block-level (locks on any object).",
        code: `public class Counter {
    private int count = 0;

    // Method-level: locks on 'this' for the duration of the call
    public synchronized void increment() {
        count++;
    }

    // Block-level with private lock: finer control, immune to external lock interference
    private final Object lock = new Object();

    public void incrementBlock() {
        doNonCriticalWork();           // no lock held — runs concurrently
        synchronized (lock) {
            count++;                   // only this critical line holds the lock
        }
        doMoreNonCriticalWork();       // lock released, runs concurrently again
    }
}`,
      },
      {
        title: "Explicit Lock — ReentrantLock",
        description: "ReentrantLock gives you tryLock(), timed acquire, and interruptible locking — features synchronized lacks. The trade-off: you must always release in a finally block (no automatic release).",
        code: `import java.util.concurrent.locks.ReentrantLock;

public class SafeCounter {
    private int count = 0;
    private final ReentrantLock lock = new ReentrantLock();

    public void increment() {
        lock.lock();              // blocks until lock is acquired
        try {
            count++;
        } finally {
            lock.unlock();        // ALWAYS in finally — must run even on exception
        }
    }

    // tryLock: returns false immediately if lock is unavailable — never blocks
    public boolean tryIncrement() {
        if (lock.tryLock()) {
            try {
                count++;
                return true;
            } finally {
                lock.unlock();
            }
        }
        return false;             // caller decides what to do (retry, skip, fail)
    }
}`,
      },
      {
        title: "Monitor Pattern — Lock + Condition + Data",
        description: "A monitor bundles a lock with condition variables for precise signalling. ReentrantLock lets you create multiple Conditions on one lock — signal consumers separately from producers without waking everyone.",
        code: `import java.util.concurrent.locks.*;

public class BoundedBuffer<T> {
    private final ReentrantLock lock     = new ReentrantLock();
    private final Condition     notFull  = lock.newCondition(); // signalled when space opens
    private final Condition     notEmpty = lock.newCondition(); // signalled when item added
    private final Object[]      items;
    private int head, tail, count;

    BoundedBuffer(int capacity) { items = new Object[capacity]; }

    public void put(T item) throws InterruptedException {
        lock.lock();
        try {
            while (count == items.length) notFull.await(); // park until space available
            items[tail] = item;
            tail = (tail + 1) % items.length;
            count++;
            notEmpty.signal(); // wake exactly one consumer — not all threads (unlike notifyAll)
        } finally { lock.unlock(); }
    }

    @SuppressWarnings("unchecked")
    public T take() throws InterruptedException {
        lock.lock();
        try {
            while (count == 0) notEmpty.await();           // park until item available
            T item = (T) items[head];
            head = (head + 1) % items.length;
            count--;
            notFull.signal();  // wake exactly one producer
            return item;
        } finally { lock.unlock(); }
    }
}`,
      },
    ],
    bestPractices: [
      "Always put lock.unlock() in a finally block — a single missing unlock leaves the lock held forever",
      "Use private final lock objects — never expose your lock so external code can't interfere",
      "Keep the lock scope as narrow as possible: only the exact code that needs mutual exclusion inside the lock",
      "Avoid holding locks during I/O, network calls, or any long-running operations — other threads starve",
      "For simple cases, prefer synchronized over ReentrantLock — it's shorter and the JVM can optimize it",
    ],
    thumbRules: [
      "Simple mutual exclusion, no fancy features needed → synchronized (no unlock-in-finally mistake possible)",
      "Need tryLock(), timeout, or interruptible lock acquisition → ReentrantLock",
      "Need multiple wait conditions on one lock → ReentrantLock + newCondition()",
      "Need read concurrency (many readers, one writer) → ReadWriteLock or StampedLock",
      "Fine-grained per-entry locking on a map → ConcurrentHashMap (handles its own sharded locking)",
    ],
    hiddenTruths: [
      "Lock granularity is a trade-off: one coarse lock is simple but a bottleneck. Fine-grained locks improve throughput but multiply deadlock risk — each additional lock is another edge in the deadlock graph.",
      "The JVM may perform lock elision: if a lock is provably not visible to other threads (e.g. a local variable), the JIT removes the locking overhead entirely. Writing 'unnecessary' synchronized code in local scope doesn't cost you.",
      "ReentrantLock is re-entrant but you must call unlock() for EVERY lock() call — even in re-entrant code. A lock acquired twice needs two unlocks. Forgetting one is a permanent hold.",
      "Object.notify() releases the lock momentarily to wake a thread, then the woken thread must re-acquire the lock before continuing. The notifier can acquire the lock again before the woken thread does — woken threads don't jump the queue.",
    ],
    gotcha:
      "Forgetting `unlock()` in a finally block with ReentrantLock leaves the lock permanently held — every subsequent thread blocks forever. Unlike `synchronized`, there is no automatic release.",
    takeaway:
      "Prefer `synchronized` for simple mutual exclusion — it's shorter, immune to the unlock-in-finally mistake, and the JVM optimises it heavily (biased locking, lock elision). Reach for `ReentrantLock` only when you need `tryLock`, timed acquire, interruptible locking, or multiple Conditions.",
  },

  {
    id: "types-of-locking",
    title: "Types of Locking",
    category: "Synchronization",
    tags: ["spin lock", "reentrant", "read-write lock", "optimistic", "pessimistic", "fair lock", "biased locking"],
    definition:
      "Locks differ in how they block, how many holders they allow, whether they distinguish reads from writes, and whether they assume contention. Choosing the right lock type is critical for correctness and performance.",
    whenToUse: [
      "Read-heavy data: ReadWriteLock or StampedLock to allow concurrent reads",
      "Low contention, short critical sections: spin lock (CAS) to avoid OS context switch",
      "Same thread re-entering its own lock: reentrant lock (Java default for synchronized and ReentrantLock)",
      "Optimistic concurrency (databases, ConcurrentHashMap): version-checked writes — no lock held during read",
      "Starvation prevention: fair lock (FIFO ordering)",
    ],
    howToThink: [
      "Pessimistic locking: assume contention, acquire lock before reading/writing. Safe but slow when contention is low.",
      "Optimistic locking: read without a lock, then validate (CAS / version stamp) before committing. Fast when contention is low; retry on conflict.",
      "Spin lock: thread loops (spins) on a CAS until it succeeds instead of sleeping. Avoids OS scheduling overhead — ideal for microsecond-scale critical sections. Bad for long waits (wastes CPU).",
      "Blocking lock: thread parks (OS-level sleep) when it can't acquire. Efficient for long waits; overhead for short ones.",
      "Reentrant lock: a thread that already holds the lock can acquire it again without deadlocking. Tracks a hold count; releases when count reaches zero.",
      "Read-Write lock: shared read (many concurrent readers), exclusive write (one writer, no readers). Maximises read throughput.",
      "Fair lock: FIFO order — longest-waiting thread gets the lock next. Prevents starvation but reduces throughput vs. barging (unfair).",
      "Biased locking (JVM): JVM optimises the common case where a lock is always taken by the same thread — avoids CAS entirely. Removed/deprecated in Java 15+.",
    ],
    codeExamples: [
      {
        title: "Optimistic Locking — CAS with AtomicInteger",
        description: "CAS (compare-and-swap) reads a value, computes a new value, then atomically swaps only if the value hasn't changed. No thread parks — this is a spin lock at the hardware level, ideal for short-lived contention.",
        code: `AtomicInteger counter = new AtomicInteger(0);

void increment() {
    int expected, updated;
    do {
        expected = counter.get();       // 1. read current value
        updated  = expected + 1;        // 2. compute desired value
    } while (!counter.compareAndSet(expected, updated));
    // 3. swap only if counter still equals 'expected'
    // If another thread changed it, the loop retries — this is the "optimistic" part
}
// Equivalent to: counter.incrementAndGet() — use that in practice`,
      },
      {
        title: "Optimistic Locking — StampedLock for Read-Heavy Data",
        description: "StampedLock's optimistic read acquires no lock — it gets a 'version stamp'. After reading, it validates the stamp. If a write happened during the read, it falls back to a real read lock. This gives much higher read throughput.",
        code: `import java.util.concurrent.locks.StampedLock;

class Point {
    private double x, y;
    private final StampedLock sl = new StampedLock();

    void move(double deltaX, double deltaY) {
        long stamp = sl.writeLock();              // exclusive write — normal lock
        try { x += deltaX; y += deltaY; }
        finally { sl.unlockWrite(stamp); }
    }

    double distanceFromOrigin() {
        long stamp = sl.tryOptimisticRead();      // NO lock acquired — just a version stamp
        double cx = x, cy = y;                   // read speculatively (may be stale)
        if (!sl.validate(stamp)) {               // did a write happen while we read?
            stamp = sl.readLock();               // YES: fallback to real read lock
            try { cx = x; cy = y; }
            finally { sl.unlockRead(stamp); }
        }
        return Math.sqrt(cx * cx + cy * cy);     // result guaranteed consistent
    }
}`,
      },
      {
        title: "Reentrant Lock — Same Thread Re-Enters Its Own Lock",
        description: "Java's synchronized (and ReentrantLock) are reentrant: a thread that already holds the lock can acquire it again without deadlocking. The lock tracks a hold count; it's released when the count returns to zero.",
        code: `class Widget {
    public synchronized void doSomething() {
        // Thread holds 'this' lock — hold count = 1
        doSomethingElse();  // re-enters the same lock — hold count = 2
        // returns — hold count = 1
    }

    public synchronized void doSomethingElse() {
        // Without reentrancy this would deadlock —
        // the thread would wait for itself to release the lock
    }
}`,
      },
      {
        title: "Fair Lock — FIFO Ordering with ReentrantLock",
        description: "A fair lock grants access in the order threads arrived. This prevents starvation — no thread waits indefinitely. The cost: lower throughput, because the JVM can't do 'barging' (giving the lock to the thread already on-CPU).",
        code: `// Unfair (default): lock may go to any waiting thread — higher throughput
ReentrantLock unfairLock = new ReentrantLock();

// Fair: lock goes to the longest-waiting thread — prevents starvation
ReentrantLock fairLock = new ReentrantLock(true);

// Use fair locks only when you have evidence of starvation — they're 2-5x slower`,
      },
      {
        title: "Read-Write Lock — Concurrent Reads, Exclusive Write",
        description: "ReentrantReadWriteLock allows many threads to read simultaneously, but only one thread to write (and no reads during write). Perfect for read-heavy shared state like caches.",
        code: `import java.util.concurrent.locks.*;

class Cache {
    private final Map<String, String> map = new HashMap<>();
    private final ReentrantReadWriteLock rwl = new ReentrantReadWriteLock();

    // Shared lock: many threads can call get() simultaneously
    String get(String key) {
        rwl.readLock().lock();
        try { return map.get(key); }
        finally { rwl.readLock().unlock(); }
    }

    // Exclusive lock: blocks ALL readers and other writers while writing
    void put(String key, String value) {
        rwl.writeLock().lock();
        try { map.put(key, value); }
        finally { rwl.writeLock().unlock(); }
    }
}`,
      },
    ],
    bestPractices: [
      "Default to synchronized or ReentrantLock. Upgrade to ReadWriteLock only when you have measured read-heavy contention",
      "StampedLock's optimistic read is the fastest option for read-heavy data, but requires validating the stamp — never skip the validate() call",
      "Fair locks: use only when you have evidence of thread starvation — they're 2-5x slower than unfair locks",
      "Document every non-trivial lock type choice — the rationale for choosing StampedLock vs ReadWriteLock vs synchronized is not obvious",
    ],
    thumbRules: [
      "Mostly reads, occasional writes → ReadWriteLock or StampedLock",
      "Very short critical sections, low contention → CAS (AtomicXxx) — avoids OS-level blocking entirely",
      "Long hold times → blocking lock (ReentrantLock) — spin lock wastes CPU while waiting long",
      "Starvation is a measured problem → fair ReentrantLock(true)",
      "Re-entrant by default? YES for synchronized and ReentrantLock. NO for StampedLock (re-entering deadlocks)",
    ],
    hiddenTruths: [
      "StampedLock is NOT re-entrant. If a thread holds a StampedLock write lock and tries to acquire it again, it deadlocks itself. Unlike ReentrantLock, this is a fatal mistake.",
      "ReentrantReadWriteLock does NOT support lock UPGRADE (read → write). You must release the read lock first, then acquire write. Any attempt to upgrade directly causes deadlock — all readers wait for each other to release.",
      "Optimistic reading with StampedLock is NOT free — the validate() call adds a memory barrier. It's still faster than a full read lock for very short reads, but the benefit shrinks for longer read operations.",
      "CAS spin locks can cause cache line thrashing: if many threads CAS the same memory location, the cache line bounces between CPUs. AtomicInteger.incrementAndGet() on a shared counter under high contention can be slower than synchronized.",
    ],
    gotcha:
      "Lock upgrade (read lock → write lock) is NOT allowed in ReentrantReadWriteLock — it always deadlocks because each reader is waiting for the other to release. Always release the read lock first, then acquire write.",
    takeaway:
      "Match the lock type to the access pattern: optimistic (CAS/StampedLock) for low-contention reads, ReadWriteLock for read-heavy shared state, fair lock only when starvation is a proven problem. Every lock type is a trade-off between safety, throughput, and latency.",
  },

  {
    id: "virtual-threads",
    title: "Virtual Threads (Java 21)",
    category: "Fundamentals",
    tags: ["virtual threads", "Project Loom", "carrier thread", "structured concurrency", "Java 21"],
    definition:
      "Virtual threads are lightweight, JVM-managed threads introduced as a stable feature in Java 21 (Project Loom). Unlike platform threads (1:1 with OS threads), millions of virtual threads can exist concurrently. The JVM multiplexes them onto a small pool of OS threads called carrier threads — automatically unmounting a virtual thread when it blocks on I/O and remounting it when I/O completes.",
    whenToUse: [
      "I/O-bound workloads: HTTP calls, database queries, file reads — virtual threads eliminate thread-pool sizing headaches",
      "Replacing thread-per-request models (e.g. traditional Spring MVC) without rewriting to reactive/async",
      "High-concurrency scenarios: handling thousands of simultaneous connections where platform threads would exhaust memory",
      "Migrating legacy blocking code to be concurrent without rewriting to CompletableFuture chains",
    ],
    howToThink: [
      "Platform thread = 1 OS thread = ~1 MB stack. Virtual thread = JVM object = ~few KB. This is why millions can coexist.",
      "Carrier thread: the OS thread that a virtual thread runs on. When a virtual thread blocks (on I/O, sleep, lock), it unmounts from its carrier, freeing the carrier to run another virtual thread.",
      "Pinning: a virtual thread is 'pinned' to its carrier and CANNOT unmount when inside a synchronized block/method or a native frame. Use ReentrantLock instead of synchronized in carrier-critical paths.",
      "CPU-bound tasks: virtual threads offer NO benefit over platform threads for CPU-heavy work — the JVM has the same number of carrier threads as CPU cores.",
      "Structured concurrency (Java 23 stable): StructuredTaskScope groups virtual threads into a scope — all child threads are cancelled when the scope exits, preventing thread leaks.",
      "Do NOT pool virtual threads. Creating them is cheap. Executors.newVirtualThreadPerTaskExecutor() creates a new virtual thread per task (unlike cached thread pools which reuse).",
    ],
    codeExamples: [
      {
        title: "Creating Virtual Threads",
        description: "The Thread.ofVirtual() API mirrors Thread.ofPlatform(). Virtual threads are cheap — millions can exist simultaneously. Name them for easier thread-dump debugging.",
        code: `// Create and start a virtual thread — API identical to platform threads
Thread vt = Thread.ofVirtual().start(() -> {
    System.out.println("Virtual? " + Thread.currentThread().isVirtual()); // true
});
vt.join();

// Named virtual threads — shows up in jstack / thread dumps as "worker-0", "worker-1"
Thread named = Thread.ofVirtual()
    .name("worker-", 0)
    .start(() -> doWork());

// Shortcut for simple fire-and-forget
Thread.startVirtualThread(() -> System.out.println("hello"));`,
      },
      {
        title: "Virtual Thread Executor — One Thread Per Task",
        description: "newVirtualThreadPerTaskExecutor() is a drop-in replacement for newFixedThreadPool(). No pool sizing required — it creates a fresh virtual thread per submitted task. The try-with-resources pattern waits for all tasks to complete.",
        code: `// Before: you had to tune pool size
ExecutorService old = Executors.newFixedThreadPool(200);

// After: no pool sizing — scale to 100,000 I/O tasks easily
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 100_000; i++) {
        final int id = i;
        executor.submit(() -> {
            String result = httpClient.get("https://api.example.com/" + id);
            process(result);          // blocks in I/O → carrier thread is freed
        });
    }
} // auto-closes: waits for all 100,000 virtual threads to finish`,
      },
      {
        title: "Spring Boot Migration — Enable Virtual Threads",
        description: "In Spring Boot 3.2+ (requires Java 21), a single property switches the embedded Tomcat/Jetty to use a virtual thread per request instead of a platform thread pool.",
        code: `# application.properties — one line migration
spring.threads.virtual.enabled=true

# Before: Tomcat bounded thread pool — blocks at ~200 concurrent requests
# After:  Tomcat uses newVirtualThreadPerTaskExecutor — handles thousands

# No code changes needed for blocking MVC controllers — the framework handles it`,
      },
      {
        title: "Structured Concurrency — ShutdownOnFailure",
        description: "StructuredTaskScope groups concurrent subtasks under a single scope. When the scope exits, all forked threads are guaranteed finished or cancelled — no thread leaks. ShutdownOnFailure cancels all siblings if any task fails.",
        code: `import java.util.concurrent.StructuredTaskScope;

String fetchUserAndOrders(long userId) throws Exception {
    try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
        // Both tasks start immediately in their own virtual threads
        var userFuture   = scope.fork(() -> fetchUser(userId));
        var ordersFuture = scope.fork(() -> fetchOrders(userId));

        scope.join();            // waits for both to complete (or one to fail)
        scope.throwIfFailed();   // re-throws the first exception, if any

        return combine(userFuture.get(), ordersFuture.get());
    }
    // Scope exit: any still-running threads are cancelled — guaranteed no leaks
}`,
      },
      {
        title: "Avoid Pinning — Replace synchronized with ReentrantLock",
        description: "A virtual thread inside a synchronized block is 'pinned' to its carrier OS thread. If it then blocks on I/O, the carrier is stuck too. Replacing synchronized with ReentrantLock lets the virtual thread unmount, freeing the carrier.",
        code: `// BAD: synchronized pins the virtual thread to its carrier thread
class PinningProblem {
    synchronized void processRequest() throws InterruptedException {
        // Virtual thread is PINNED here — carrier thread is blocked too
        Thread.sleep(1000);  // 1 second where the OS thread is wasted
    }
}

// GOOD: ReentrantLock — virtual thread unmounts while waiting for lock/sleep
class NoPinning {
    private final ReentrantLock lock = new ReentrantLock();

    void processRequest() throws InterruptedException {
        lock.lock();
        try {
            Thread.sleep(1000); // virtual thread unmounts; carrier runs other tasks
        } finally {
            lock.unlock();
        }
    }
}`,
      },
    ],
    bestPractices: [
      "Do NOT pool virtual threads — creating them is cheap (~few KB). Executors.newVirtualThreadPerTaskExecutor() creates a fresh VT per task by design",
      "Audit your codebase for synchronized blocks in hot paths before migrating to virtual threads — each one is a potential pinning point",
      "Use ReentrantLock (not synchronized) in code paths that block on I/O — allows the virtual thread to unmount from its carrier",
      "Use -Djdk.tracePinnedThreads=full to discover pinning events in your application before going to production",
      "Don't mix virtual thread executors with code that uses ThreadLocal heavily — stale ThreadLocal values cause subtle bugs (clean up in finally blocks)",
    ],
    thumbRules: [
      "I/O-bound service on Java 21 → Executors.newVirtualThreadPerTaskExecutor() or spring.threads.virtual.enabled=true",
      "CPU-bound task → platform thread pool (virtual threads won't help, may hurt)",
      "Library uses synchronized internally (many JDBC drivers, some frameworks) → virtual threads will pin on those paths — benchmark before deploying",
      "Want to check if current thread is virtual → Thread.currentThread().isVirtual()",
      "Need structured parent-child cancellation → StructuredTaskScope (Java 21 preview, 23 stable)",
    ],
    hiddenTruths: [
      "Virtual threads do NOT eliminate the need for synchronized or locks on shared mutable state. They are a concurrency scaling solution, not a thread-safety solution. You still need proper synchronization.",
      "ThreadLocal values ARE inherited by virtual threads by default. This means ThreadLocal-based context propagation (MDC, Spring SecurityContext, HTTP request scope) can leak from one request's virtual thread to another if not cleaned up.",
      "Virtual threads perform slightly WORSE than platform threads for pure CPU work — the mounting/unmounting mechanism adds overhead. Only use them where blocking I/O is the bottleneck.",
      "The JVM carrier thread pool size defaults to Runtime.availableProcessors() and can be configured via -Djdk.virtualThreadScheduler.parallelism=N. Too few carriers bottleneck CPU-heavy virtual thread work.",
    ],
    gotcha:
      "Virtual threads are pinned (cannot unmount) inside `synchronized` blocks. If your pinned code then blocks on I/O or sleep, the carrier thread is fully occupied — you lose all benefits. Migrate hot `synchronized` blocks to `ReentrantLock` when using virtual threads.",
    takeaway:
      "Virtual threads solve the throughput problem of blocking I/O by making threads cheap enough to have one per task. They do NOT make code faster — they make servers scalable. Use `Executors.newVirtualThreadPerTaskExecutor()` as a drop-in replacement for fixed thread pools in I/O-bound services.",
  },

  {
    id: "livelock-starvation",
    title: "Livelock & Starvation",
    category: "Pitfalls",
    tags: ["livelock", "starvation", "fairness"],
    definition:
      "Livelock: threads are not blocked but keep changing state in response to each other without making progress (like two people dodging the same direction in a hallway). Starvation: a thread is perpetually denied access to resources because other threads monopolise them.",
    whenToUse: [
      "Spotting threads with 100% CPU but no output — suspect livelock",
      "Threads that never complete while others do — suspect starvation",
      "Designing fair retry/backoff logic for resource contention",
    ],
    howToThink: [
      "Livelock fix: introduce randomness in the retry/backoff strategy so threads don't always respond in sync.",
      "Starvation fix: use fair locks (new ReentrantLock(true)) or structured priority so no thread waits indefinitely.",
      "Both are hard to detect. Livelock shows high CPU. Starvation shows some threads never completing.",
    ],
    codeExamples: [
      {
        title: "Livelock — Threads Keep Responding to Each Other",
        description: "Unlike deadlock (threads sleep), livelock threads are active — they keep changing state in response to each other but make no real progress. CPU usage is 100% with no output.",
        code: `// Each thread detects the other and backs off — forever
class LivelockExample {
    volatile boolean leftHeld  = false;
    volatile boolean rightHeld = false;

    void tryBoth(boolean isLeft) {
        while (true) {
            if (isLeft) {
                leftHeld = true;
                if (rightHeld) {        // "the other thread has it, I'll back off"
                    leftHeld = false;
                    continue;           // retry → but the other thread is doing the same!
                }
                // never gets here — both threads keep backing off in sync
            }
        }
    }
    // CPU: 100%. Progress: 0%. This is livelock.
}`,
      },
      {
        title: "Livelock Fix — Random Backoff Breaks Symmetry",
        description: "Adding a random delay means threads no longer respond in lockstep. One thread waits longer than the other, breaking the symmetry and allowing one to proceed.",
        code: `void tryWithRandomBackoff() throws InterruptedException {
    Random rand = new Random();
    while (true) {
        if (tryAcquireResources()) {
            break;               // success — proceed
        }
        // random backoff: threads won't retry at the same time
        Thread.sleep(rand.nextInt(10)); // 0–9 ms — asymmetric timing breaks livelock
    }
}`,
      },
      {
        title: "Starvation Fix — Fair ReentrantLock",
        description: "A fair lock (FIFO ordering) guarantees that the longest-waiting thread gets the lock next. No thread can be indefinitely bypassed by others.",
        code: `// Fair lock: threads acquire in arrival order — prevents starvation
ReentrantLock fairLock = new ReentrantLock(true); // true = FIFO fair mode

void fairWork() {
    fairLock.lock();
    try {
        // guaranteed access eventually — no thread waits forever
        doWork();
    } finally {
        fairLock.unlock();
    }
}
// Trade-off: fair locks have lower throughput than unfair (default) locks
// because the JVM can't let the currently-running thread 'barge' the queue`,
      },
    ],
    bestPractices: [
      "For livelock: always add jitter (random delay) to retry/back-off logic — deterministic back-off loops are livelock-prone",
      "For starvation: measure first before reaching for fair locks — fair locks have real throughput cost",
      "Design tasks to have similar execution times — wildly different task lengths cause starvation of long-running tasks in some schedulers",
      "In thread pools: use separate pools for long-running tasks vs short-running tasks to prevent long tasks from starving short ones",
    ],
    thumbRules: [
      "CPU high, no output, threads in RUNNABLE → livelock — add randomized back-off",
      "Some threads never progress while others complete rapidly → starvation — check lock fairness or task queue design",
      "Retry logic in multiple threads → always use exponential backoff with jitter, never fixed-interval retry",
      "Need fairness guarantee → ReentrantLock(true), but only if starvation is a measured problem, not a theoretical one",
    ],
    hiddenTruths: [
      "Livelock is harder to detect than deadlock because CPU is 100% and threads show RUNNABLE in thread dumps — it looks like the system is 'busy'. Deadlock is easier: threads are BLOCKED and jstack says 'Found N deadlocks'.",
      "Starvation can happen even with synchronized — the JVM makes no fairness guarantee with synchronized. A thread that just released a lock can immediately re-acquire it (barging), repeatedly starving others.",
      "Exponential backoff without jitter (randomness) across multiple threads STILL produces livelock — all threads back off to the same interval and retry simultaneously. The jitter is mandatory.",
      "Thread priority (setPriority) is NOT a reliable starvation fix on modern JVMs — the OS may ignore it entirely. Fair locks are the only reliable mechanism.",
    ],
    gotcha:
      "Fair locks (ReentrantLock(true)) prevent starvation but reduce throughput — FIFO ordering means threads wake one at a time. Only use when fairness is a hard requirement.",
    takeaway:
      "Livelock → add randomness to break symmetry. Starvation → use fair queuing or restructure so long-running tasks don't hog resources.",
  },

  {
    id: "false-sharing",
    title: "False Sharing & Cache Line Padding",
    category: "Performance",
    tags: ["false sharing", "cache line", "MESI protocol", "@Contended", "padding", "CPU cache"],
    definition:
      "False sharing occurs when two threads write to different variables that happen to share the same CPU cache line (~64 bytes). Even though the variables are logically unrelated, the cache coherency protocol (MESI) forces CPUs to invalidate and reload the entire cache line on every write — causing massive cache thrashing between cores and making parallel code slower than sequential.",
    whenToUse: [
      "Diagnosing parallel code that is slower than expected despite correct synchronization",
      "Designing high-performance data structures where per-thread or per-core counters are used",
      "Optimizing hot paths in lock-free algorithms where multiple threads update adjacent fields",
    ],
    howToThink: [
      "CPU cache lines are typically 64 bytes. Any two fields within 64 bytes of each other share a cache line.",
      "When Thread A writes field X and Thread B writes field Y (adjacent in memory), CPU A must invalidate CPU B's cache line (even though the data doesn't conflict logically).",
      "Fix: add padding between the two fields so they end up on different cache lines.",
      "Java 8+: @jdk.internal.vm.annotation.Contended pads the annotated field to its own cache line. Requires -XX:-RestrictContended JVM flag.",
      "java.util.concurrent.atomic.LongAdder uses internal cell padding to avoid false sharing — that's why it outperforms AtomicLong under high contention.",
    ],
    codeExamples: [
      {
        title: "The Problem — Two Threads on Adjacent Fields",
        description: "Thread A increments a.value and Thread B increments b.value. Because a and b share a cache line, every write by one thread invalidates the other thread's cache entry — performance collapses under contention.",
        code: `// BAD: adjacent fields likely share a 64-byte cache line
class SharedCounters {
    long valueA = 0;   // offset ~16 bytes from object header
    long valueB = 0;   // offset ~24 bytes — same cache line as valueA!
}

// Thread A: ++obj.valueA — writes to cache line X on CPU 0
// Thread B: ++obj.valueB — also writes cache line X on CPU 1
// Result: CPUs 0 and 1 ping-pong ownership of the same cache line
//         → can be 10-100x slower than single-threaded for hot counters`,
      },
      {
        title: "Fix 1 — Manual Padding (Pre-Java 8)",
        description: "Add padding long fields between the two counters so they end up on separate cache lines. 7 longs × 8 bytes = 56 bytes padding + 8 bytes for the actual value = 64 bytes (one full cache line).",
        code: `// Good: manually pad to separate cache lines
class PaddedCounters {
    // Cache line 1: 8B value + 7×8B padding = 64B
    long valueA = 0;
    long _p1, _p2, _p3, _p4, _p5, _p6, _p7; // padding fills the rest of the cache line

    // Cache line 2: 8B value + 7×8B padding = 64B
    long valueB = 0;
    long _q1, _q2, _q3, _q4, _q5, _q6, _q7;
}
// Thread A and B now update different cache lines — no thrashing`,
      },
      {
        title: "Fix 2 — @Contended Annotation (Java 8+)",
        description: "@jdk.internal.vm.annotation.Contended tells the JVM to pad the field to its own cache line. Cleaner than manual padding. Requires -XX:-RestrictContended JVM flag to take effect.",
        code: `import jdk.internal.vm.annotation.Contended;

class AnnotatedCounters {
    @Contended
    long valueA = 0;   // JVM pads this to its own 64-byte cache line

    @Contended
    long valueB = 0;   // Also isolated on its own cache line
}
// Start JVM with: -XX:-RestrictContended
// Used internally by: LongAdder, ConcurrentHashMap, Thread`,
      },
      {
        title: "LongAdder — The JDK's False Sharing Solution",
        description: "LongAdder distributes counting across multiple padded 'Cell' slots (one per CPU). Each thread writes to its own CPU-local cell. The total is summed lazily. Under high contention, it massively outperforms AtomicLong.",
        code: `import java.util.concurrent.atomic.*;

// AtomicLong: single CAS on one location — cache line bounces between CPUs under contention
AtomicLong atomicCounter = new AtomicLong(0);

// LongAdder: distributes writes across CPU-local padded cells
LongAdder adderCounter = new LongAdder();

// LongAdder wins under HIGH CONTENTION:
// Scenario: 8 threads each doing 10M increments
// AtomicLong: ~3.5 seconds (cache line ping-pong)
// LongAdder:  ~0.4 seconds (per-CPU local cells)

// Usage:
adderCounter.increment();              // fast — writes to thread-local cell
long total = adderCounter.sum();       // sum all cells — slightly slower read
long total2 = adderCounter.sumThenReset(); // sum and reset atomically

// Rule: prefer LongAdder for high-contention counters (metrics, event counts)
//       prefer AtomicLong when you need precise CAS operations (unique IDs)`,
      },
    ],
    bestPractices: [
      "Use LongAdder (not AtomicLong) for high-contention counters like request counts, event metrics, throughput stats",
      "Keep per-thread data in ThreadLocal — eliminates false sharing by design (each thread has its own copy)",
      "In custom data structures with per-thread or per-core fields, pad to 64-byte boundaries using @Contended or manual padding",
      "Profile first with async-profiler or JFR before adding padding — false sharing is only relevant in hot loops with >2 threads",
    ],
    thumbRules: [
      "Parallel performance < sequential performance despite no contention → suspect false sharing — profile with JFR or async-profiler",
      "Multiple counters updated by different threads in the same class → pad them or use LongAdder",
      "Cache line size is 64 bytes on x86/ARM — 8 longs exactly fill one cache line",
      "Fields in the same object are often adjacent in memory → adjacent mutable fields shared across threads = false sharing risk",
    ],
    hiddenTruths: [
      "False sharing makes correct code dramatically slower WITHOUT any data corruption, deadlock, or race condition. It is a performance bug, not a correctness bug — and it's invisible in tests unless you benchmark under realistic concurrency.",
      "java.util.concurrent.atomic.LongAdder, ConcurrentHashMap cells, and Thread fields (like the thread ID) use @Contended internally — this is why these JDK classes require -XX:-RestrictContended when used in non-bootstrap code.",
      "The JVM object layout is not predictable: the JIT can reorder fields. The @Contended annotation is the ONLY reliable way to guarantee a field is on its own cache line — manual padding can be reordered away by the JVM.",
      "False sharing between different objects (not fields of the same object) also occurs when objects are allocated adjacently in memory. LongAdder's 'Cell' array objects are also padded for this reason.",
    ],
    gotcha:
      "You can't see false sharing in a thread dump or profiler by looking at lock wait times — there are no locks involved. Use hardware performance counters (via async-profiler's --perf mode or JFR cache miss events) to detect it.",
    takeaway:
      "When parallel code is slower than expected: check for false sharing. Use LongAdder for counters, ThreadLocal for per-thread state, and @Contended for custom hot fields. Match the solution to the contention level — padding and LongAdder add memory overhead, only justified when the bottleneck is proven.",
  },

  {
    id: "amdahls-law",
    title: "Amdahl's Law & Scalability Limits",
    category: "Performance",
    tags: ["Amdahl's Law", "parallelism", "scalability", "speedup", "serial fraction", "Gustafson's Law"],
    definition:
      "Amdahl's Law states that the maximum speedup from parallelism is strictly limited by the serial (non-parallelizable) fraction of the program. If 10% of your program must run serially, you can never achieve more than 10x speedup regardless of how many threads you add. This is the fundamental upper bound of parallel programming.",
    whenToUse: [
      "Deciding whether parallelism is worth pursuing for a given problem",
      "Setting realistic expectations for the speedup a thread pool will deliver",
      "Identifying the serial bottleneck to optimize before adding more threads",
    ],
    howToThink: [
      "Speedup formula: S(n) = 1 / (p_serial + (p_parallel / n)) where p_serial = serial fraction, n = number of processors.",
      "If 50% is serial: max speedup is 2x (at infinite cores). If 5% is serial: max speedup is 20x.",
      "Serial fractions include: synchronization overhead, I/O, lock contention, startup, queue management, and memory allocation.",
      "Every lock acquisition, every synchronized section, every shared counter is a serial fraction — they add up.",
      "Gustafson's Law (less pessimistic): as problem SIZE grows with n cores, serial fraction becomes relatively smaller. Parallel programs can scale better than Amdahl predicts when problem size grows.",
    ],
    codeExamples: [
      {
        title: "Amdahl's Law — Calculating Maximum Speedup",
        description: "The formula directly computes the theoretical maximum speedup given a serial fraction. This tells you the ceiling BEFORE you write a single parallel line.",
        code: `// Amdahl's Law: S(n) = 1 / (p_serial + (p_parallel / n))
// p_serial + p_parallel = 1.0

static double amdahlSpeedup(double serialFraction, int numCores) {
    double parallelFraction = 1.0 - serialFraction;
    return 1.0 / (serialFraction + parallelFraction / numCores);
}

// Scenarios — serialFraction=0.10 (10% serial):
// 1 core:       1.0x
// 2 cores:      1.82x
// 4 cores:      3.08x
// 8 cores:      4.71x
// 16 cores:     6.40x
// 100 cores:    9.17x
// ∞ cores:     10.0x  ← THE HARD CEILING

// serialFraction=0.01 (1% serial):
// 16 cores:    14.4x
// 64 cores:    39x
// ∞ cores:    100x  ← now we have room to scale

// Key insight: halving the serial fraction doubles the theoretical max speedup
// Optimize the serial parts first — not the parallel parts`,
      },
      {
        title: "Real-World Serial Fractions",
        description: "In practice, serial fractions come from synchronization, I/O, memory allocation, and coordination. Measuring them is the first step to knowing whether more threads will help.",
        code: `import java.util.concurrent.*;
import java.util.List;
import java.util.ArrayList;

// Measuring serial vs parallel fraction with timestamps
public class ParallelTaskProfile {
    public static void main(String[] args) throws Exception {
        int N = 1_000_000;
        int THREADS = Runtime.getRuntime().availableProcessors();

        // --- Serial portion: setup, partitioning, result merging ---
        long serialStart = System.nanoTime();
        List<long[]> partitions = partition(N, THREADS);      // serial
        long serialSetupNs = System.nanoTime() - serialStart;

        // --- Parallel portion: actual computation ---
        ExecutorService pool = Executors.newFixedThreadPool(THREADS);
        List<Future<Long>> futures = new ArrayList<>();

        long parallelStart = System.nanoTime();
        for (long[] part : partitions) {
            futures.add(pool.submit(() -> sumPart(part)));
        }

        long total = 0;
        for (Future<Long> f : futures) total += f.get();   // also serial (merge)
        long parallelNs = System.nanoTime() - parallelStart;

        long mergeStart = System.nanoTime();
        processTotal(total);                                  // serial
        long mergeNs = System.nanoTime() - mergeStart;

        long totalTime = serialSetupNs + parallelNs + mergeNs;
        double serialFraction = (double)(serialSetupNs + mergeNs) / totalTime;
        System.out.printf("Serial fraction: %.1f%% → max speedup: %.1fx%n",
            serialFraction * 100, 1.0 / serialFraction);

        pool.shutdown();
    }
    static List<long[]> partition(int n, int parts) { /* ... */ return null; }
    static long sumPart(long[] part) { long s=0; for (long v : part) s+=v; return s; }
    static void processTotal(long t) {}
}`,
      },
    ],
    bestPractices: [
      "Measure the serial fraction BEFORE adding more threads — if 20% is serial, you're wasting time optimizing the parallel 80%",
      "Reduce synchronization points (lock acquisitions, shared counters, barriers) — each one adds to the serial fraction",
      "Batch results before merging — merging one result per task is O(N) serial. Batch then merge in parallel",
      "Use lock-free algorithms (LongAdder, ConcurrentHashMap) for global counters — they reduce the serial fraction from O(N) to amortized O(1)",
    ],
    thumbRules: [
      "Adding more threads than Amdahl's ceiling → no more speedup, just more contention and memory usage",
      "Serial fraction > 10% → doubling cores gives < 1.7x speedup — focus on reducing serial work first",
      "Serial fraction < 1% → parallelism scales well beyond 64 cores — worth investing in parallel algorithm",
      "Lock contention under load → the contended section is your serial fraction — measure with JFR lock profiling",
    ],
    hiddenTruths: [
      "Amdahl's Law is an OPTIMISTIC bound — it assumes zero overhead for thread creation, scheduling, synchronization, and memory. Real parallel speedup is always worse than Amdahl's prediction.",
      "The serial fraction is NOT constant — synchronization overhead GROWS with the number of threads. Adding threads can make the serial fraction larger, causing a speedup curve that peaks and then declines.",
      "Most real workloads have a serial fraction of 5–20%. This means the practical speedup ceiling is 5–20x regardless of hardware. Buying a 64-core machine does not give 64x throughput for a typical application.",
      "Gustafson's Law is more optimistic: if you scale the problem SIZE with the number of cores (like batch processing more data), the serial fraction stays constant in absolute time, allowing near-linear scaling.",
    ],
    gotcha:
      "Adding threads beyond the Amdahl ceiling doesn't just give no benefit — it actively hurts performance through increased lock contention, context switching, and cache pressure. More threads is not always better.",
    takeaway:
      "Before adding more threads: identify and minimize the serial fraction. Every synchronized block, shared counter, and coordination point is serial. The best parallel optimization is often making the serial portion faster, not adding more threads.",
  },

  // ─────────────────── SYNCHRONIZATION ─────────────────────────────────────
  {
    id: "safe-publication",
    title: "Safe Publication",
    category: "Synchronization",
    tags: ["publication", "visibility", "happens-before", "final", "volatile"],
    definition:
      "Safe publication means making an object reference visible to other threads in a way that guarantees they see the object's fully-initialized state. An object is 'safely published' when all its fields are visible to any thread that reads the reference — not just the reference itself.",
    whenToUse: [
      "Sharing objects between threads (even immutable ones need safe publication)",
      "Lazy initialization of shared resources",
      "Publishing results from background threads to the main thread",
    ],
    codeExamples: [
      {
        title: "Unsafe vs Safe Publication",
        description: "Writing a reference to a non-volatile field is NOT a safe publication mechanism. Another thread can see the reference without seeing the fully-constructed object. Use volatile, final fields, synchronized, or AtomicReference.",
        code: `// UNSAFE: non-volatile reference — reader may see partial construction
public class Holder {
    private Resource resource; // non-volatile

    public void initialize() {
        resource = new Resource(); // NOT safely published
    }
    public Resource get() {
        return resource; // reader may see null OR a partially-constructed Resource
    }
}

// SAFE OPTION 1: volatile — establishes happens-before
public class HolderSafe {
    private volatile Resource resource;

    public void initialize() {
        resource = new Resource(); // volatile write = safe publication
    }
    public Resource get() {
        return resource; // volatile read sees fully-constructed Resource
    }
}

// SAFE OPTION 2: final fields — published safely via constructor
public class ImmutableConfig {
    private final String host;    // final: safely published via constructor
    private final int    port;

    public ImmutableConfig(String host, int port) {
        this.host = host;
        this.port = port;
    }
}

// SAFE OPTION 3: synchronized (expensive but always correct)
public class HolderSync {
    private Resource resource;
    public synchronized void initialize() { resource = new Resource(); }
    public synchronized Resource get()    { return resource; }
}

// SAFE OPTION 4: AtomicReference
AtomicReference<Resource> ref = new AtomicReference<>();
ref.set(new Resource()); // safe publication`,
      },
      {
        title: "Static Initializer — Free Safe Publication",
        description: "The JVM guarantees that static initializers run under class-loading synchronization. Any object assigned during static init is safely published to all threads that access the class.",
        code: `// JVM guarantees safe publication of static fields initialized at declaration
public class Config {
    // Safely published — static initializer runs under JVM class-loading lock
    public static final Config INSTANCE = new Config();

    private final String host;
    private final int    port;

    private Config() {
        this.host = System.getProperty("app.host", "localhost");
        this.port = Integer.parseInt(System.getProperty("app.port", "8080"));
    }
}

// Any thread that accesses Config.INSTANCE sees the fully-initialized object
String host = Config.INSTANCE.host; // always safe`,
      },
    ],
    gotcha:
      "Even an IMMUTABLE object needs safe publication. If you write the reference to a non-volatile field and another thread reads it, it may see null or a stale reference — even if the object's internal state is correct once seen.",
    takeaway:
      "The four safe publication mechanisms are: (1) static initializer, (2) volatile field, (3) final field initialized in constructor, (4) synchronized block. Non-volatile, non-final fields are NOT safe publication channels.",
    bestPractices: [
      "Prefer immutable objects + static final fields for the simplest safe publication",
      "Use volatile for lazily-initialized singleton references (without DCL overhead)",
      "Use AtomicReference.set() for atomically replacing a published object",
      "Never rely on 'it works in practice' — unsafe publication bugs are timing-dependent and disappear under low load",
    ],
    thumbRules: [
      "Published once, never changed → static final (free safe publication)",
      "Published lazily, read many times → volatile reference to immutable object",
      "Need atomic compare-and-publish → AtomicReference.compareAndSet()",
      "Shared in synchronized context → synchronized handles publication implicitly",
    ],
    hiddenTruths: [
      "The Java Memory Model does NOT guarantee that a thread reading a non-volatile reference sees the most recently written value. On multicore hardware, each core has its own cache. Without a memory barrier (volatile, synchronized, final, atomic), the reader's core may have a stale value.",
      "final fields have a special JMM guarantee: a thread that obtains a reference to an object via ANY mechanism (not just safe publication channels) is guaranteed to see the final fields' values as set in the constructor — as long as the constructor doesn't leak 'this'.",
      "Publishing via a data race (non-volatile write + non-synchronized read) is called an 'improper publication'. The JVM is allowed to reorder the object's field writes relative to the reference write — so a reader may see the reference but find zero-initialized fields.",
    ],
  },

  {
    id: "immutability",
    title: "Immutability & Effective Immutability",
    category: "Synchronization",
    tags: ["immutable", "final", "effective immutability", "thread-safe"],
    definition:
      "An immutable object cannot be modified after construction — all fields are final and all referenced objects are also immutable. Immutable objects are inherently thread-safe: no synchronization is needed. Effectively immutable objects are mutable but are never modified after safe publication.",
    whenToUse: [
      "Shared data that is set once (configuration, lookup tables, constants)",
      "Value objects passed between threads (DTOs, events, messages)",
      "Reducing synchronization overhead by eliminating shared mutable state",
    ],
    codeExamples: [
      {
        title: "Truly Immutable Class",
        description: "An immutable class: all fields final, class is final (no subclassing), no setters, defensive copies of mutable fields in constructor and getters.",
        code: `// Fully immutable: safe to share across threads without synchronization
@Immutable
public final class ImmutablePoint {
    private final int x;
    private final int y;

    public ImmutablePoint(int x, int y) {
        this.x = x;
        this.y = y;
    }

    public int getX() { return x; }
    public int getY() { return y; }

    public ImmutablePoint translate(int dx, int dy) {
        return new ImmutablePoint(x + dx, y + dy); // returns NEW object — this unchanged
    }
}

// Immutable class with mutable field — defensive copy required
public final class ImmutablePeriod {
    private final Date start; // Date is mutable — must copy
    private final Date end;

    public ImmutablePeriod(Date start, Date end) {
        this.start = new Date(start.getTime()); // defensive copy in constructor
        this.end   = new Date(end.getTime());
    }

    public Date getStart() { return new Date(start.getTime()); } // defensive copy in getter
    public Date getEnd()   { return new Date(end.getTime()); }
}`,
      },
      {
        title: "Effectively Immutable — Publish Once, Never Modify",
        description: "An effectively immutable object is mutable by design but treated as read-only after safe publication. If all threads only read it after publication, no synchronization is needed.",
        code: `// Effectively immutable: mutable HashMap, but never modified after construction
public class Lookup {
    private static volatile Map<String, Integer> CODES; // volatile for safe publication

    public static void initialize(Map<String, Integer> data) {
        Map<String, Integer> copy = new HashMap<>(data); // defensive copy
        // Nobody modifies 'copy' after this point — effectively immutable
        CODES = Collections.unmodifiableMap(copy); // safe publication via volatile write
    }

    public static Integer getCode(String key) {
        return CODES.get(key); // only reads — no synchronization needed
    }
}

// Using record (Java 16+) for immutable data carriers
public record UserEvent(long userId, String action, Instant timestamp) {
    // All fields are implicitly final; compact constructor can add validation
    public UserEvent {
        Objects.requireNonNull(action, "action required");
    }
}`,
      },
    ],
    gotcha:
      "Wrapping in Collections.unmodifiableMap does NOT make the map immutable — it only prevents modifications through THAT wrapper. If the underlying map is modified directly, all readers see the change. Use a true immutable copy or Map.copyOf() (Java 10+).",
    takeaway:
      "Design data objects as immutable by default. Every mutable field is a potential race condition. Immutable objects need no locking, can be freely shared, and simplify reasoning about correctness.",
    bestPractices: [
      "Declare all fields final unless you have a specific reason to mutate them",
      "Make the class final to prevent subclasses from introducing mutability",
      "Defensively copy mutable inputs in the constructor and mutable outputs in getters",
      "Use Map.copyOf() / List.copyOf() (Java 10+) or Collections.unmodifiableXxx() for collections",
      "Use Java records for immutable data carriers — they enforce immutability by design",
    ],
    thumbRules: [
      "Shared read-only data (config, lookup tables) → immutable class or record",
      "Value objects passed between threads (events, messages) → immutable",
      "HashMap after construction never changes → wrap in Collections.unmodifiableMap() and publish via volatile",
      "All fields final + class final + no setters + defensive copies → truly immutable",
    ],
    hiddenTruths: [
      "A class with ALL final fields is NOT necessarily immutable if any field references a mutable object (e.g., final List<String> names — the list can still be modified). True immutability requires the entire object graph to be immutable.",
      "Collections.unmodifiableList() creates a VIEW of the original — not a copy. If the original list is modified, the 'unmodifiable' view reflects the change. Use List.copyOf() or new ArrayList<>(original) for a true independent copy.",
      "Java records are NOT automatically deeply immutable. A record with a List<String> field has an immutable reference but the list contents can be mutated. Always defensive-copy collection fields in record compact constructors.",
      "String is immutable but String.intern() returns a reference to a shared pool. Synchronizing on an interned string or a literal (synchronized (\"lock\")) is a severe anti-pattern — you share a lock with any code using the same literal.",
    ],
  },

  {
    id: "thread-safety-levels",
    title: "Thread Safety Levels",
    category: "Synchronization",
    tags: ["thread-safe", "conditionally safe", "not safe", "annotation", "documentation"],
    definition:
      "Thread safety has multiple levels. A class may be: Immutable (safest), Unconditionally Thread-Safe, Conditionally Thread-Safe (with external locking), Not Thread-Safe, or Thread-Hostile (breaks even with locking). Knowing the level helps you apply the right synchronization strategy.",
    whenToUse: [
      "Documenting and designing classes that will be shared across threads",
      "Evaluating whether a third-party class needs external synchronization",
      "Deciding how to protect access to a shared object",
    ],
    codeExamples: [
      {
        title: "The Five Thread Safety Levels",
        description: "Each level requires different handling when shared across threads. Always document which level your class belongs to.",
        code: `// LEVEL 1: Immutable — no synchronization needed, ever
@Immutable
public final class RGB {
    public final int r, g, b;
    public RGB(int r, int g, int b) { this.r=r; this.g=g; this.b=b; }
}

// LEVEL 2: Unconditionally Thread-Safe — synchronized internally
// Examples: ConcurrentHashMap, AtomicInteger, LinkedBlockingQueue, StringBuffer
@ThreadSafe
public class SafeCounter {
    private final AtomicInteger count = new AtomicInteger(0);
    public int increment() { return count.incrementAndGet(); } // thread-safe
}

// LEVEL 3: Conditionally Thread-Safe — some operations need external lock
// Example: Collections.synchronizedList (iteration needs caller-side lock)
List<String> syncList = Collections.synchronizedList(new ArrayList<>());
// Single operations (add, remove, get) are thread-safe
syncList.add("item"); // OK
// Iteration is NOT — requires caller-side lock
synchronized (syncList) { // external lock required for iteration
    for (String s : syncList) { process(s); }
}

// LEVEL 4: Not Thread-Safe — wrap or avoid sharing across threads
// Examples: HashMap, ArrayList, SimpleDateFormat, StringBuilder
// Solution: use thread-local, or synchronize externally, or use concurrent alternative

// LEVEL 5: Thread-Hostile — can't be made safe even with locking
// Example: calling System.setOut() while another thread reads System.out
// These are rare but exist in legacy code`,
      },
      {
        title: "Identifying and Documenting Thread Safety",
        description: "Use the @ThreadSafe, @NotThreadSafe, @Immutable annotations from jcip-annotations (Brian Goetz's JCIP) to document your design intent. Future maintainers (including you) will thank you.",
        code: `import net.jcip.annotations.*;

// Clearly documented — no guessing needed
@ThreadSafe
public class RequestCounter {
    private final LongAdder count = new LongAdder();
    public void increment() { count.increment(); }
    public long get() { return count.sum(); }
}

@NotThreadSafe
public class QueryBuilder {
    private final StringBuilder sb = new StringBuilder();
    public QueryBuilder where(String clause) { sb.append(" WHERE ").append(clause); return this; }
    public String build() { return sb.toString(); }
    // Designed for single-thread use — do not share across threads
}

@Immutable
public record Money(BigDecimal amount, Currency currency) {
    public Money add(Money other) {
        if (!currency.equals(other.currency)) throw new IllegalArgumentException("Currency mismatch");
        return new Money(amount.add(other.amount), currency);
    }
}`,
      },
    ],
    gotcha:
      "Collections.synchronizedXxx wrappers are Conditionally Thread-Safe — individual operations are atomic, but compound operations (check-then-act, iterate) require external synchronization. A very common source of bugs.",
    takeaway:
      "Know the thread safety level of every class you share. The levels from safest to most dangerous: Immutable → Unconditionally Thread-Safe → Conditionally Thread-Safe → Not Thread-Safe → Thread-Hostile.",
    bestPractices: [
      "Document thread safety level in the class Javadoc (or @ThreadSafe/@NotThreadSafe annotations)",
      "Default to 'Not Thread-Safe' if unsure — explicit external sync is better than accidental unsafety",
      "Never share 'Not Thread-Safe' objects across threads without wrapping (ThreadLocal, synchronize, or replace with concurrent alternative)",
      "For conditional thread safety, document WHICH methods need external locking in the Javadoc",
    ],
    thumbRules: [
      "HashMap / ArrayList → Not Thread-Safe → use ConcurrentHashMap / CopyOnWriteArrayList, or synchronize externally",
      "StringBuilder → Not Thread-Safe → StringBuffer (synchronized) or avoid sharing",
      "SimpleDateFormat → Not Thread-Safe → ThreadLocal<DateFormat> or DateTimeFormatter (immutable)",
      "Collections.synchronizedList → Conditionally Thread-Safe → wrap iteration in synchronized(list)",
      "AtomicInteger, ConcurrentHashMap → Unconditionally Thread-Safe → no external synchronization needed",
    ],
    hiddenTruths: [
      "StringBuffer is @ThreadSafe (synchronized methods), but this doesn't make StringBuilder thread-safe. They are different classes. Most modern code prefers StringBuilder + proper confinement rather than StringBuffer.",
      "AtomicReference is Unconditionally Thread-Safe for individual operations but Conditionally Thread-Safe for compound operations — get + conditional set is still a race unless you use compareAndSet().",
      "java.util.Random is @ThreadSafe but is a bottleneck under high thread contention (all threads share one seed AtomicLong). Use ThreadLocalRandom for per-thread random numbers without contention.",
      "An Unconditionally Thread-Safe class that calls back into client code (via a Runnable, Comparator, etc.) can lose its safety — the client callback might not be thread-safe, and calling it under the class's lock can cause deadlocks.",
    ],
  },

  {
    id: "double-checked-locking",
    title: "Double-Checked Locking (DCL)",
    category: "Synchronization",
    tags: ["DCL", "singleton", "lazy init", "volatile", "initialization-on-demand"],
    definition:
      "Double-Checked Locking (DCL) is a pattern for lazy singleton initialization that avoids the cost of synchronization on every read. The classic broken version was a widespread Java anti-pattern until volatile was fixed in Java 5's JMM. The correct version requires volatile.",
    whenToUse: [
      "Lazy initialization of an expensive singleton (DB connection pool, config loader)",
      "When the object is initialized once and read many thousands of times",
      "When synchronized access on every read would be a measurable bottleneck",
    ],
    codeExamples: [
      {
        title: "Broken DCL (pre-Java 5 / without volatile)",
        description: "The classic broken version was used everywhere before Java 5. The JMM allowed the JIT to reorder writes so that a thread could see the reference non-null but get a partially-constructed object.",
        code: `// BROKEN — do NOT use this pattern
public class BrokenSingleton {
    private static BrokenSingleton instance; // NOT volatile — broken!

    public static BrokenSingleton getInstance() {
        if (instance == null) {           // Check 1: no lock
            synchronized (BrokenSingleton.class) {
                if (instance == null) {   // Check 2: under lock
                    instance = new BrokenSingleton(); // DANGER: JIT can reorder
                    // Steps in "new BrokenSingleton()":
                    // 1. Allocate memory
                    // 2. Write reference to 'instance' (reference is now non-null)
                    // 3. Initialize the object (constructor runs)
                    // JIT can reorder 2 and 3 — another thread may see non-null 'instance'
                    // pointing to a partially-initialized object
                }
            }
        }
        return instance; // may return partially-constructed object!
    }
}`,
      },
      {
        title: "Correct DCL with volatile (Java 5+)",
        description: "volatile on the instance field adds a memory barrier after the constructor, preventing reordering. The write to instance is visible to all threads AFTER the object is fully constructed.",
        code: `// CORRECT — volatile prevents constructor/reference-write reordering
public class Singleton {
    private static volatile Singleton instance; // volatile is the key

    private Singleton() {
        // expensive initialization
    }

    public static Singleton getInstance() {
        if (instance == null) {              // Check 1: fast path (no lock)
            synchronized (Singleton.class) {
                if (instance == null) {      // Check 2: slow path (under lock)
                    instance = new Singleton(); // safe: volatile prevents reorder
                }
            }
        }
        return instance;
    }
}`,
      },
      {
        title: "Initialization-on-Demand Holder (Best Alternative)",
        description: "The Initialization-on-Demand Holder idiom is simpler, cleaner, and faster than DCL. It exploits the JVM's class-loading guarantee: inner class is loaded only when first accessed, and the JVM's class loader is already synchronized.",
        code: `// PREFERRED: no volatile, no explicit synchronization, lazy, thread-safe
public class BestSingleton {
    private BestSingleton() { /* expensive init */ }

    // Inner class is loaded (and INSTANCE initialized) only on first call to getInstance()
    // Class loading is inherently thread-safe — JVM guarantees it
    private static class Holder {
        static final BestSingleton INSTANCE = new BestSingleton();
    }

    public static BestSingleton getInstance() {
        return Holder.INSTANCE; // triggers class load on first call
    }
}

// Also acceptable: enum singleton (Effective Java Item 89)
public enum EnumSingleton {
    INSTANCE;

    public void doWork() { ... }
}
// EnumSingleton.INSTANCE — lazy, thread-safe, serialization-safe`,
      },
    ],
    gotcha:
      "The Initialization-on-Demand Holder is almost always the better choice over DCL. It's simpler (no volatile), faster (no memory barrier on reads), and impossible to break. DCL is only needed if the class has expensive static initialization you want to avoid.",
    takeaway:
      "If you need a lazy singleton: prefer Initialization-on-Demand Holder > DCL with volatile > synchronized getInstance(). The enum singleton handles serialization correctly if that's a concern.",
    bestPractices: [
      "Prefer Initialization-on-Demand Holder over DCL for lazy singleton — simpler and zero lock overhead on reads",
      "If using DCL, always declare the field volatile — non-volatile DCL is broken and has been deployed in production widely",
      "Consider enum singleton when serialization safety is required (Effective Java Item 89)",
      "If the singleton is initialized at class load anyway, skip lazy init — simple static final field is clearest",
    ],
    thumbRules: [
      "Lazy singleton, loaded once → Initialization-on-Demand Holder (inner static class)",
      "Must use DCL pattern → field MUST be volatile",
      "Singleton needs to be serializable → enum singleton",
      "Early init is fine → public static final INSTANCE = new Singleton()",
    ],
    hiddenTruths: [
      "Broken (non-volatile) DCL was deployed in millions of Java programs before Java 5. It 'works' most of the time because the JIT doesn't always reorder. But under JIT optimization or on certain architectures, it fails non-deterministically — making it one of the hardest bugs to reproduce.",
      "volatile adds a StoreStore barrier before the write and a LoadLoad barrier after the read. This prevents the JIT from reordering the constructor writes after the reference assignment. Without volatile, the CPU is allowed to make the reference visible before the object is fully initialized.",
      "The Initialization-on-Demand Holder idiom works because Java's class loader guarantees that a class is initialized at most once, under an internal lock. The JVM's class-loading protocol is a safe publication mechanism — no external sync needed.",
      "Enum singletons survive serialization correctly: Java's serialization mechanism guarantees that a deserialized enum constant is the same JVM instance as the original. A regular singleton class would create a second instance during deserialization unless readResolve() is implemented.",
    ],
  },

  {
    id: "thread-local-memory-leak",
    title: "ThreadLocal Memory Leaks",
    category: "Pitfalls",
    tags: ["ThreadLocal", "memory leak", "thread pool", "ClassLoader leak"],
    definition:
      "ThreadLocal values are stored in the Thread object's threadLocals map. Thread-pool threads are never garbage collected — so any ThreadLocal value set without calling remove() lives for the lifetime of the JVM. In web containers (Tomcat, JBoss), this causes ClassLoader leaks that prevent application redeployment.",
    whenToUse: [
      "Diagnosing memory leaks in applications using ThreadLocal",
      "Implementing request-scoped context in thread-pool environments (Servlet containers, Spring)",
      "Understanding why hot-redeployment in Tomcat causes OutOfMemoryError",
    ],
    codeExamples: [
      {
        title: "The Memory Leak Pattern",
        description: "Thread-pool threads live for the JVM lifetime. Every ThreadLocal.set() without a matching remove() in a finally block adds a permanent entry to the thread's local map.",
        code: `// LEAK: ThreadLocal without remove() in a thread-pool context
ExecutorService pool = Executors.newFixedThreadPool(10);

// This ThreadLocal stores a 10MB object
ThreadLocal<byte[]> cache = new ThreadLocal<>();

// Each pool thread will hold a 10MB reference FOREVER after first access
pool.execute(() -> {
    cache.set(new byte[10 * 1024 * 1024]); // 10MB
    doWork();
    // No cache.remove() — the 10MB lives on the thread for JVM lifetime
    // After 10 tasks on 10 threads: 100MB permanently held
});

// CORRECT: always remove in a finally block
pool.execute(() -> {
    cache.set(new byte[10 * 1024 * 1024]);
    try {
        doWork();
    } finally {
        cache.remove(); // ALWAYS — even on exception
    }
});`,
      },
      {
        title: "ClassLoader Leak in Web Containers",
        description: "The worst ThreadLocal leak: a pool thread (owned by Tomcat) holds a ThreadLocal value whose type was loaded by the webapp's ClassLoader. On redeployment, the old ClassLoader can't be GC'd — entire application classes stay in memory.",
        code: `// In webapp code (ClassLoader = WebAppClassLoader):
ThreadLocal<MyService> serviceHolder = new ThreadLocal<>();
// MyService.class was loaded by WebAppClassLoader

// When a request runs:
serviceHolder.set(new MyService()); // sets it on Tomcat's thread-pool thread
// On request end — if remove() is missed:
// Tomcat's thread holds ThreadLocal → MyService → WebAppClassLoader → all webapp classes
// On hot-redeploy: old WebAppClassLoader cannot be GC'd → PermGen/Metaspace OOM

// FIX 1: Always remove in a Servlet filter's finally block
public class CleanupFilter implements Filter {
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        try {
            chain.doFilter(req, res);
        } finally {
            serviceHolder.remove(); // runs even if request throws
        }
    }
}

// FIX 2: Use Spring's RequestContextHolder — it cleans up automatically
// FIX 3: Switch to ScopedValue (Java 21+) — immutable, no leaks possible`,
      },
    ],
    gotcha:
      "The leak happens even with small objects — the issue is the ClassLoader reference chain, not the object size. A single leaked ThreadLocal entry pointing to an object loaded by a webapp ClassLoader can prevent GC of the entire application.",
    takeaway:
      "ThreadLocal in thread-pool environments: ALWAYS remove() in a finally block. In web containers, use framework-provided request-scope abstractions (Spring's RequestContextHolder) that handle cleanup automatically.",
    bestPractices: [
      "In every code path that calls ThreadLocal.set(), pair it with remove() in a finally block",
      "Use a Servlet Filter or interceptor as the single cleanup point for request-scoped ThreadLocals",
      "Prefer ScopedValue (Java 21+) over ThreadLocal in virtual thread or scoped-execution contexts",
      "Audit ThreadLocal usage with memory profiler heap dumps — look for thread-local entries on pool threads",
      "Prefer Spring's RequestContextHolder or MDC (which handles cleanup) over raw ThreadLocal in web code",
    ],
    thumbRules: [
      "ThreadLocal + thread pool → ALWAYS remove() in finally",
      "ThreadLocal in Servlet code → use a Filter to guarantee cleanup after each request",
      "Virtual threads + context → ScopedValue (Java 21+), not ThreadLocal",
      "Memory leak suspect → heap dump → look for ThreadLocalMap$Entry references on pool threads",
    ],
    hiddenTruths: [
      "ThreadLocal does NOT hold a strong reference to the thread — the thread holds a strong reference to the ThreadLocal VALUE via its threadLocals map. Even if the ThreadLocal variable itself goes out of scope, the value stays alive as long as the thread is alive.",
      "ThreadLocalMap uses WeakReference for keys (the ThreadLocal instance) but a STRONG reference for values. When the ThreadLocal variable is GC'd, the key becomes null (phantom entry) but the value is still held — until the next ThreadLocal.set/get/remove triggers cleanup of stale entries.",
      "Java web containers like Tomcat track ThreadLocal usage and emit warnings like 'The web application appears to have started a thread named [http-nio-8080-exec-1] but has failed to stop it'. This is Tomcat detecting that pool threads have ThreadLocal entries pointing to webapp classes.",
      "ScopedValue (Java 21+) solves the leak problem by design: values are bound to a scope, not a thread. When the scope exits, the binding is automatically removed — no remove() required, no possibility of leaking.",
    ],
  },

  {
    id: "structured-concurrency",
    title: "Structured Concurrency (Java 21+)",
    category: "Modern Java",
    tags: ["StructuredTaskScope", "Java 21", "virtual threads", "scoped", "fan-out"],
    definition:
      "Structured concurrency ensures that the lifetime of concurrent tasks is bounded by their enclosing scope — just as structured programming bounded control flow to blocks. If any subtask fails, all siblings are automatically cancelled when the scope exits. No subtask outlives its creator.",
    whenToUse: [
      "Fan-out patterns: call N services concurrently, need all results",
      "Hedged requests: call N replicas, take the first to respond",
      "Replacing manual Future management with automatic lifecycle control",
    ],
    codeExamples: [
      {
        title: "ShutdownOnFailure — Fan-Out (Need All Results)",
        description: "Fork N tasks. If any fails, all siblings are cancelled. The scope.join() + throwIfFailed() pattern propagates the first failure to the caller with full stack trace.",
        code: `import java.util.concurrent.StructuredTaskScope;

record PageData(User user, List<Order> orders, List<Product> recs) {}

PageData buildPage(long userId) throws Exception {
    try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
        var userTask   = scope.fork(() -> userService.find(userId));
        var ordersTask = scope.fork(() -> orderService.findByUser(userId));
        var recsTask   = scope.fork(() -> recService.forUser(userId));

        scope.join();          // wait for all tasks (or first failure)
        scope.throwIfFailed(); // re-throw if any subtask failed

        // All three succeeded — safe to call .get()
        return new PageData(userTask.get(), ordersTask.get(), recsTask.get());
    }
    // Scope exit: all incomplete subtasks are cancelled and awaited
    // No subtask can outlive this method
}`,
      },
      {
        title: "ShutdownOnSuccess — Hedged Requests (First Wins)",
        description: "Fork N tasks. The first to SUCCEED cancels all siblings. Perfect for redundant service calls, geographic load balancing, or any 'race to first result' pattern.",
        code: `String callFastest(List<String> endpoints) throws Exception {
    try (var scope = new StructuredTaskScope.ShutdownOnSuccess<String>()) {
        for (String endpoint : endpoints) {
            scope.fork(() -> callEndpoint(endpoint)); // all start concurrently
        }
        scope.join(); // returns when first task succeeds
        return scope.result(); // the winning result
    }
    // All losing tasks are automatically cancelled on scope exit
}`,
      },
      {
        title: "Observability: Thread Dumps Show Parent-Child Relationships",
        description: "Unlike CompletableFuture chains, StructuredTaskScope forks show the call hierarchy in thread dumps. The parent scope is visible in the child thread's stack — making debugging massively easier.",
        code: `// Thread dump with StructuredTaskScope:
// "main" #1 prio=5
//   at buildPage:12 — waiting in scope.join()
//   "fork-0" #21 virtual
//     at userService.find — child of buildPage scope
//   "fork-1" #22 virtual
//     at orderService.findByUser — child of buildPage scope
//
// vs CompletableFuture:
// "ForkJoinPool.commonPool-worker-1" #21
//   at lambda$buildPage$0 — no parent relationship visible
//
// The structured version tells you WHO started the task.
// CompletableFuture does not.`,
      },
    ],
    gotcha:
      "StructuredTaskScope requires virtual threads (Java 21+). It was in preview in JDK 21 and JDK 22, and became stable (non-preview) API in JDK 25. Enable with --enable-preview in JDK 21-24.",
    takeaway:
      "Structured concurrency brings the same discipline to concurrent code that structured programming brought to control flow. Subtasks cannot outlive their scope, errors propagate naturally, and thread dumps show parent-child relationships.",
    bestPractices: [
      "Always use try-with-resources with StructuredTaskScope — the close() method ensures all forked tasks are cancelled",
      "Prefer StructuredTaskScope over CompletableFuture.allOf() for fan-out — automatic cancellation on failure",
      "Use ShutdownOnSuccess for hedged requests (geo-routing, redundant replicas)",
      "Use ShutdownOnFailure for dependent fan-out (all services must succeed to build response)",
    ],
    thumbRules: [
      "All N concurrent results needed → ShutdownOnFailure + scope.join() + throwIfFailed()",
      "First successful result needed (hedged) → ShutdownOnSuccess + scope.join() + result()",
      "Custom cancellation policy → extend StructuredTaskScope directly",
      "Java 21 preview → --enable-preview; Java 25+ → no flag needed",
    ],
    hiddenTruths: [
      "scope.fork() returns a StructuredTaskScope.Subtask<T>, not a Future<T>. Subtask.get() can only be called AFTER scope.join() — calling it before throws IllegalStateException.",
      "If the scope's owner thread is interrupted during scope.join(), the scope shuts down all forked tasks and re-throws InterruptedException. The interrupt is not silently consumed.",
      "StructuredTaskScope.close() (called by try-with-resources) blocks until all forked tasks complete. If scope.join() was called and completed, close() returns immediately. If join() wasn't called, close() cancels all pending tasks and waits.",
      "ShutdownOnFailure's throwIfFailed() throws the FIRST exception encountered, wrapped in ExecutionException. The exceptions from other failed subtasks are added as suppressed exceptions — check them if you need the full failure picture.",
    ],
  },

  {
    id: "happens-before-deep",
    title: "Happens-Before Deep Dive",
    category: "Java Memory Model",
    tags: ["JMM", "happens-before", "memory barrier", "visibility", "ordering"],
    definition:
      "The Java Memory Model (JMM) defines a happens-before relationship to specify when one thread's memory writes are guaranteed to be visible to another thread's reads. If action A happens-before action B, then all memory effects of A are visible to B. Without a happens-before edge, visibility is NOT guaranteed.",
    whenToUse: [
      "Reasoning about whether a variable write in Thread A is visible to Thread B",
      "Designing lock-free algorithms or synchronization primitives",
      "Diagnosing visibility bugs (reading stale values even when writes occurred)",
    ],
    codeExamples: [
      {
        title: "The Eight Happens-Before Rules",
        description: "Java's JMM specifies exactly eight rules that establish happens-before edges. If your code doesn't fit one of these rules, visibility is not guaranteed.",
        code: `// Rule 1: Program order — within a single thread, each action HB all subsequent actions
int a = 1;       // HB →
int b = a + 1;   // HB →
print(b);        // visible in program order within the SAME thread

// Rule 2: Monitor unlock HB subsequent lock on same monitor
synchronized (obj) { data = 42; }     // unlock HB
synchronized (obj) { System.out.println(data); } // subsequent lock — sees 42

// Rule 3: volatile write HB subsequent volatile reads of the same variable
volatile int v;
v = 42;            // volatile write HB
int x = v;         // subsequent volatile read — sees 42

// Rule 4: Thread.start() HB all actions in the started thread
data = "hello";
thread.start();    // start() HB
// thread body sees data = "hello"

// Rule 5: All actions in a thread HB Thread.join() on that thread
thread.join();     // join() HB
// after join(), caller sees all actions from the joined thread

// Rule 6: Thread interrupt HB the interrupted thread detecting the interrupt
thread.interrupt();         // interrupt() HB
thread.isInterrupted();     // returns true

// Rule 7: Constructors with final fields — writes to final fields in constructor
//         HB reads of those fields via a reference to the constructed object
//         (only if 'this' doesn't escape during construction)

// Rule 8: Transitivity — if A HB B and B HB C, then A HB C`,
      },
      {
        title: "Visibility Bug — Missing Happens-Before",
        description: "Without a happens-before edge, a thread may read a stale value indefinitely — even after the writer has committed the update. This is not a 'timing issue' — it's permitted by the JMM.",
        code: `// BUG: no happens-before between writer and reader
public class VisibilityBug {
    private boolean ready = false; // no volatile, no sync
    private int value = 0;

    // Thread 1 writes:
    void writer() {
        value = 42;
        ready = true;
    }

    // Thread 2 reads:
    void reader() {
        while (!ready) { } // may spin FOREVER — no HB edge ensures ready=true is visible
        System.out.println(value); // even if ready=true, may print 0 (value reordered)
    }
}

// FIX: volatile ready establishes HB — volatile write(ready=true) HB volatile read(ready)
// This also ensures value=42 is visible because HB is transitive
public class VisibilityFixed {
    private volatile boolean ready = false;
    private int value = 0;

    void writer() {
        value = 42;
        ready = true; // volatile write — HB for this AND all prior writes
    }

    void reader() {
        while (!ready) { }     // volatile read — establishes HB edge
        System.out.println(value); // value=42 is GUARANTEED visible
    }
}`,
      },
    ],
    gotcha:
      "Transitivity is key. A volatile write to field X creates a happens-before edge for ALL prior writes, not just writes to X. This means volatile on a 'guard flag' also covers visibility of non-volatile fields written before the flag.",
    takeaway:
      "Every shared memory access needs a happens-before edge or is a data race. Data races are not just 'timing issues' — the JMM explicitly allows a processor to return a stale cached value, forever. volatile, synchronized, Thread.start(), Thread.join(), and final fields are your happens-before tools.",
    bestPractices: [
      "Identify the happens-before edge explicitly when reviewing concurrent code — 'it works in tests' is not sufficient",
      "Use volatile for simple shared flags and references; synchronized for compound check-then-act operations",
      "Remember transitivity: writing to a volatile guard field makes ALL prior writes visible to readers of that flag",
      "When in doubt, use a higher-level abstraction (CountDownLatch, BlockingQueue) that provides HB guarantees internally",
    ],
    thumbRules: [
      "Need visibility between threads without mutual exclusion → volatile",
      "Need mutual exclusion AND visibility → synchronized or ReentrantLock",
      "Publishing results from background thread to caller → Thread.join() establishes HB",
      "Publishing object at construction → final fields + no 'this' escape",
      "No HB edge between write and read → data race → undefined behavior under JMM",
    ],
    hiddenTruths: [
      "Happens-before is NOT the same as 'happened before in wall-clock time'. Thread A may write at T=100ms and Thread B may read at T=200ms, but without a HB edge, the JMM does NOT guarantee Thread B sees Thread A's write. Time ordering ≠ JMM ordering.",
      "A volatile write creates a StoreLoad memory barrier — the most expensive kind. It flushes the store buffer and invalidates the load buffer. This is why volatile on a hot counter is slower than an AtomicLong (which uses CAS without a full StoreLoad).",
      "The JMM does NOT directly specify CPU cache coherence. It specifies 'as-if' semantics — the JVM can use any mechanism (memory barriers, cache flush, etc.) as long as the HB rules are satisfied. The CPU architecture determines which instructions are needed.",
      "Double-checked locking without volatile is broken because the JMM allows the JIT to reorder the write to 'instance' BEFORE the constructor completes. volatile on instance adds a write barrier that prevents this reordering.",
    ],
  },
];

export const CATEGORY_META = {
  Fundamentals:        { color: "var(--blue)",  bg: "var(--blue-subtle)",  count: CONCEPTS.filter(c => c.category === "Fundamentals").length },
  Synchronization:     { color: "var(--red)",   bg: "var(--red-subtle)",   count: CONCEPTS.filter(c => c.category === "Synchronization").length },
  Pitfalls:            { color: "var(--gold)",  bg: "var(--gold-subtle)",  count: CONCEPTS.filter(c => c.category === "Pitfalls").length },
  Performance:         { color: "var(--green)", bg: "var(--green-subtle, color-mix(in srgb, var(--green) 12%, transparent))", count: CONCEPTS.filter(c => c.category === "Performance").length },
  "Modern Java":       { color: "#A78BFA",      bg: "rgba(167,139,250,.12)",  count: CONCEPTS.filter(c => c.category === "Modern Java").length },
  "Java Memory Model": { color: "#F472B6",      bg: "rgba(244,114,182,.12)", count: CONCEPTS.filter(c => c.category === "Java Memory Model").length },
  Patterns:            { color: "#34D399",      bg: "rgba(52,211,153,.12)",  count: CONCEPTS.filter(c => c.category === "Patterns").length },
};
