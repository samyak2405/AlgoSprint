export const PATTERNS = [
  {
    id: "thread-pool",
    name: "Thread Pool",
    tagline: "Reuse threads, control parallelism",
    category: "Resource Management",
    intent:
      "Maintain a pool of worker threads that execute submitted tasks. Eliminates thread-creation overhead, caps the number of concurrent threads, and provides a task queue for bursts of work.",
    participants: ["Task (Runnable/Callable)", "ThreadPoolExecutor", "BlockingQueue (work queue)", "Worker thread"],
    whenToUse: [
      "Processing many short-lived tasks (HTTP requests, database queries)",
      "Controlling parallelism — prevent thread explosion under load",
      "Avoiding the cost of creating and destroying threads per task",
    ],
    implementation: `import java.util.concurrent.*;

// Production-grade thread pool
public class TaskProcessor {
    private final ThreadPoolExecutor executor;

    public TaskProcessor(int coreThreads, int maxThreads, int queueCapacity) {
        this.executor = new ThreadPoolExecutor(
            coreThreads,
            maxThreads,
            60L, TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(queueCapacity),
            new ThreadFactory() {
                private final AtomicInteger count = new AtomicInteger(0);
                public Thread newThread(Runnable r) {
                    Thread t = new Thread(r, "task-worker-" + count.incrementAndGet());
                    t.setDaemon(false);
                    return t;
                }
            },
            new ThreadPoolExecutor.CallerRunsPolicy() // back-pressure: caller runs if full
        );
    }

    public <T> Future<T> submit(Callable<T> task) {
        return executor.submit(task);
    }

    public void shutdown() throws InterruptedException {
        executor.shutdown();
        if (!executor.awaitTermination(30, TimeUnit.SECONDS)) {
            executor.shutdownNow();
        }
    }

    // Monitor pool health
    public void logStats() {
        System.out.printf("Pool: active=%d, queued=%d, completed=%d%n",
            executor.getActiveCount(),
            executor.getQueue().size(),
            executor.getCompletedTaskCount());
    }
}`,
    tradeoffs: "Bounded pool with bounded queue provides back-pressure but can reject tasks. Unbounded queue prevents rejection but can cause OOM under sustained load. Tune corePoolSize ≈ CPU cores for CPU-bound tasks, higher for I/O-bound.",
    bestPractices: [
      "Always use a BOUNDED queue (LinkedBlockingQueue with capacity) — unbounded queues allow OOM under sustained load",
      "Name every thread in the pool with a custom ThreadFactory — 'payment-worker-3' in a thread dump is worth more than 'pool-1-thread-3'",
      "Set a rejection handler explicitly — the default AbortPolicy throws RejectedExecutionException silently and your tasks disappear",
      "Monitor pool health: getActiveCount(), getQueue().size(), getCompletedTaskCount() — add these to metrics",
      "Implement graceful shutdown: shutdown() first (drains the queue), then awaitTermination(30s), then shutdownNow()",
    ],
    thumbRules: [
      "CPU-bound → corePoolSize = maxPoolSize = CPU core count (no benefit from more threads)",
      "I/O-bound (legacy, not virtual threads) → pool can be 5-20x core count, tune by load testing",
      "Queue full? → CallerRunsPolicy applies back-pressure by making the caller do work — prevents the queue from growing unbounded",
      "Unknown load patterns → start with corePoolSize=10, maxPoolSize=50, queue capacity=1000 and tune from metrics",
    ],
    hiddenTruths: [
      "ThreadPoolExecutor only grows beyond corePoolSize when the QUEUE IS FULL. With an unbounded queue (LinkedBlockingQueue with no capacity), the pool NEVER grows beyond corePoolSize — maximumPoolSize is ignored. This surprises almost everyone.",
      "After shutdown(), the pool's queue is still drained — queued tasks run to completion. shutdownNow() interrupts running tasks and returns the queued-but-not-started ones as a List<Runnable>.",
      "Core threads are kept alive indefinitely by default. Set allowCoreThreadTimeOut(true) if you want idle core threads to also expire — useful for pools that have bursty then idle workloads.",
    ],
  },

  {
    id: "producer-consumer",
    name: "Producer-Consumer",
    tagline: "Decouple producers from consumers with a shared queue",
    category: "Coordination",
    intent:
      "Producers generate data/tasks and put them into a shared bounded queue. Consumers take from the queue and process. The queue absorbs rate differences and decouples the two sides.",
    participants: ["Producer thread(s)", "Consumer thread(s)", "BlockingQueue (shared buffer)", "Poison Pill (stop signal)"],
    whenToUse: [
      "Producer and consumer run at different rates",
      "Pipeline stages that should run independently",
      "Buffering between an I/O-bound producer and a CPU-bound consumer",
    ],
    implementation: `import java.util.concurrent.*;

public class ProducerConsumerDemo {
    private static final String POISON_PILL = "__STOP__";

    public static void main(String[] args) throws InterruptedException {
        BlockingQueue<String> queue = new LinkedBlockingQueue<>(50);
        int consumerCount = 3;

        // Producer
        Thread producer = new Thread(() -> {
            try {
                for (int i = 0; i < 100; i++) {
                    String task = "task-" + i;
                    queue.put(task);           // blocks if queue full (back-pressure)
                    System.out.println("Produced: " + task);
                }
                // One poison pill per consumer
                for (int i = 0; i < consumerCount; i++) {
                    queue.put(POISON_PILL);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }, "producer");

        // Consumers
        ExecutorService pool = Executors.newFixedThreadPool(consumerCount);
        for (int i = 0; i < consumerCount; i++) {
            pool.execute(() -> {
                try {
                    while (true) {
                        String item = queue.take();  // blocks if queue empty
                        if (POISON_PILL.equals(item)) break;
                        process(item);
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        producer.start();
        producer.join();
        pool.shutdown();
        pool.awaitTermination(60, TimeUnit.SECONDS);
    }

    static void process(String item) {
        System.out.println(Thread.currentThread().getName() + " processed: " + item);
    }
}`,
    tradeoffs: "Poison pill is simple but requires knowing the number of consumers in advance. Alternatively, use an AtomicBoolean flag and check it before take(). A bounded queue provides back-pressure — producer slows down when consumers can't keep up.",
    bestPractices: [
      "Always use a BOUNDED queue — unbounded queues let producers run unchecked and cause OOM",
      "Use exactly ONE poison pill per consumer — not one total. Consumers stop when they receive the pill",
      "Put/take inside try-catch for InterruptedException and restore the interrupt flag on the thread",
      "Monitor queue depth as a health metric — a constantly full queue means consumers are slower than producers",
    ],
    thumbRules: [
      "Need to stop consumers → one poison pill per consumer thread",
      "Producers faster than consumers → bounded queue applies natural back-pressure (put() blocks)",
      "Need exactly-once processing → use a queue that supports acknowledgement (Kafka, RabbitMQ) — Java's BlockingQueue doesn't",
      "Multiple producer types or consumer types → consider separate queues for each type",
    ],
    hiddenTruths: [
      "BlockingQueue's put() and take() are atomic only for the single enqueue/dequeue operation. Multiple put() calls from different producers can interleave — the ordering is FIFO per-put, but different producers interleave non-deterministically.",
      "A poison pill approach requires you to know the number of consumers at stop time. If consumers are created dynamically, use an AtomicBoolean flag checked before each take() instead.",
      "ArrayBlockingQueue uses a single lock for both put and take — producers and consumers contend. LinkedBlockingQueue uses SEPARATE locks for put and take — higher throughput under contention.",
    ],
  },

  {
    id: "monitor-object",
    name: "Monitor Object",
    tagline: "Serialise concurrent method access, signal state changes",
    category: "Synchronization",
    intent:
      "An object that synchronises concurrent method execution so only one method runs at a time, and provides wait/notify to allow threads to suspend when a condition is not met.",
    participants: ["Monitor (synchronized methods/blocks)", "Condition variables (wait/notifyAll or Condition)", "Client threads"],
    whenToUse: [
      "A shared object with multiple methods that must not interleave",
      "Methods that sometimes must wait for state before proceeding",
      "Classic: blocking queue, thread-safe buffer, connection pool",
    ],
    implementations: [
      {
        title: "Monitor with Intrinsic Locks (synchronized)",
        description: "Every Java object is a monitor. synchronized methods serialize access; wait() suspends the thread and releases the lock; notifyAll() wakes all waiting threads. Simple but imprecise — notifyAll wakes both producers and consumers.",
        code: `public class BlockingStack<T> {
    private final LinkedList<T> stack = new LinkedList<>();
    private final int capacity;

    public BlockingStack(int capacity) { this.capacity = capacity; }

    public synchronized void push(T item) throws InterruptedException {
        while (stack.size() == capacity) {
            wait();        // release lock; suspend this thread
        }
        stack.push(item);
        notifyAll();       // wake ALL waiting threads (both push-waiters and pop-waiters)
    }

    public synchronized T pop() throws InterruptedException {
        while (stack.isEmpty()) {
            wait();        // release lock; suspend this thread
        }
        T item = stack.pop();
        notifyAll();       // wake ALL — some will find condition still false and re-wait
        return item;
    }
    // 'while' is mandatory — spurious wakeups and wrong-side wakeups must be re-checked
}`,
      },
      {
        title: "Monitor with ReentrantLock + Conditions (Precise Signalling)",
        description: "Using separate Condition objects (notFull, notEmpty) lets you wake only producers or only consumers. signal() wakes exactly one thread on that condition — avoiding the thundering-herd of notifyAll().",
        code: `public class PreciseMonitor<T> {
    private final LinkedList<T> buffer = new LinkedList<>();
    private final int capacity;
    private final ReentrantLock lock    = new ReentrantLock();
    private final Condition     notFull  = lock.newCondition(); // producers wait here
    private final Condition     notEmpty = lock.newCondition(); // consumers wait here

    public PreciseMonitor(int capacity) { this.capacity = capacity; }

    public void put(T item) throws InterruptedException {
        lock.lock();
        try {
            while (buffer.size() == capacity) notFull.await();  // release lock; park
            buffer.addLast(item);
            notEmpty.signal(); // wake exactly ONE consumer — not everyone
        } finally { lock.unlock(); }
    }

    public T take() throws InterruptedException {
        lock.lock();
        try {
            while (buffer.isEmpty()) notEmpty.await();           // release lock; park
            T item = buffer.removeFirst();
            notFull.signal(); // wake exactly ONE producer
            return item;
        } finally { lock.unlock(); }
    }
}`,
      },
    ],
    tradeoffs: "notifyAll() wakes all waiting threads (thundering herd) but is safe. Using separate Conditions (notFull/notEmpty) and signal() avoids waking the wrong side.",
    bestPractices: [
      "Always use while(!condition) wait() — never if(!condition) — spurious wakeups are specified in the JVM spec",
      "Prefer ReentrantLock + separate Conditions (notFull/notEmpty) for new code — signal() wakes the right side only",
      "Keep synchronized blocks as short as possible — all other threads block for the entire duration",
      "Expose the monitor's invariant as a comment — documents what condition each wait/notify is protecting",
    ],
    thumbRules: [
      "Only two wait conditions (full/empty) → synchronized + notifyAll() is simple and correct",
      "Multiple distinct wait conditions → ReentrantLock + one Condition per condition type",
      "Need to call wait/notify → MUST be inside synchronized on the same object",
      "Monitor for a simple state flag → AtomicBoolean + busy-wait or Semaphore may be simpler",
    ],
    hiddenTruths: [
      "notifyAll() causes a 'thundering herd': all N waiting threads wake up, re-acquire the lock one by one, each checks the condition, and all but one go back to sleep. For large N, this causes O(N) lock acquisitions for every single state change.",
      "wait() atomically releases the lock AND parks — the atomicity is essential. If it released and then parked, another thread could signal() before the waiting thread parked, and the signal would be lost.",
      "A monitor with intrinsic locks (synchronized) has ONE condition queue. All calls to wait() go to the same queue — producers and consumers are mixed. notifyAll() must wake everyone because you can't target one side.",
    ],
  },

  {
    id: "read-write-lock-pattern",
    name: "Read-Write Lock",
    tagline: "Concurrent reads, exclusive writes",
    category: "Synchronization",
    intent:
      "Allows many threads to read a shared resource simultaneously, but grants exclusive access to writers. Significantly improves throughput when reads vastly outnumber writes.",
    participants: ["ReadLock (shared)", "WriteLock (exclusive)", "Protected resource"],
    whenToUse: [
      "Read-heavy in-memory caches (configs, reference data)",
      "When synchronized would serialize reads unnecessarily",
      "Scenario: 95% reads, 5% writes — plain lock wastes throughput",
    ],
    implementations: [
      {
        title: "ReentrantReadWriteLock — Shared Reads, Exclusive Writes",
        description: "readLock() is shared — many threads can hold it simultaneously. writeLock() is exclusive — it blocks all readers and other writers. Ideal for read-heavy caches.",
        code: `import java.util.concurrent.locks.*;

public class ThreadSafeCache<K, V> {
    private final Map<K, V> cache = new HashMap<>();
    private final ReentrantReadWriteLock rwLock = new ReentrantReadWriteLock();

    // Many threads can read simultaneously — no contention between readers
    public V get(K key) {
        rwLock.readLock().lock();
        try {
            return cache.get(key);
        } finally {
            rwLock.readLock().unlock();
        }
    }

    // Exclusive: blocks ALL readers and other writers while updating
    public void put(K key, V value) {
        rwLock.writeLock().lock();
        try {
            cache.put(key, value);
        } finally {
            rwLock.writeLock().unlock();
        }
    }
}`,
      },
      {
        title: "StampedLock — Optimistic Reads (Higher Throughput)",
        description: "StampedLock.tryOptimisticRead() returns a version stamp WITHOUT acquiring any lock. After reading, validate(stamp) checks if a write happened. If so, fall back to a real read lock. This can be 2-3x faster than ReentrantReadWriteLock for read-heavy workloads.",
        code: `import java.util.concurrent.locks.*;

class Point {
    private double x, y;
    private final StampedLock sl = new StampedLock();

    void move(double dx, double dy) {
        long stamp = sl.writeLock();          // exclusive write — conventional
        try { x += dx; y += dy; }
        finally { sl.unlockWrite(stamp); }
    }

    double distanceTo(double ox, double oy) {
        long stamp = sl.tryOptimisticRead();  // NO lock — just a version number
        double cx = x, cy = y;               // read speculatively
        if (!sl.validate(stamp)) {           // was a write happening while we read?
            stamp = sl.readLock();           // YES — fallback to real read lock
            try { cx = x; cy = y; }
            finally { sl.unlockRead(stamp); }
        }
        return Math.hypot(cx - ox, cy - oy); // computed on consistent snapshot
    }
}`,
      },
    ],
    tradeoffs: "If writes are frequent, write lock blocks all reads, reducing throughput. StampedLock provides higher throughput with optimistic reads but is non-reentrant and more complex to use correctly.",
    bestPractices: [
      "Always validate() the stamp in StampedLock optimistic reads — skipping this gives silently inconsistent data",
      "Hold read locks for the shortest time possible — long reads block waiting writers, which then block all subsequent readers",
      "For write-heavy workloads, a plain ReentrantLock may outperform ReadWriteLock — the book-keeping overhead exceeds the benefit",
      "Consider CopyOnWriteArrayList/CopyOnWriteArraySet for read-heavy collections — zero lock cost for readers",
    ],
    thumbRules: [
      "Reads > 90%, writes < 10% → ReadWriteLock or StampedLock",
      "Reads > 99%, writes very rare → CopyOnWriteArrayList (writes are expensive but reads are zero-cost lock-free)",
      "Need optimistic reads (speculative no-lock read with validation) → StampedLock",
      "StampedLock is NOT re-entrant — never call writeLock() twice from the same thread",
    ],
    hiddenTruths: [
      "ReadWriteLock does NOT allow lock upgrade (readLock → writeLock) — it deadlocks. You must: readLock.unlock(), then writeLock.lock(). The window between the two is a race condition.",
      "Under write-heavy workloads, ReadWriteLock is SLOWER than a plain mutex — the read/write coordination overhead is non-trivial. Benchmark before choosing.",
      "StampedLock's optimistic read path has a memory barrier in validate() — it's not truly lock-free, just much cheaper than a full read lock. The benefit grows when reads greatly outnumber writes.",
    ],
  },

  {
    id: "two-phase-termination",
    name: "Two-Phase Termination",
    tagline: "Gracefully shut down a thread without abrupt kill",
    category: "Lifecycle",
    intent:
      "Give a thread the opportunity to finish its current work and clean up resources before stopping, rather than abruptly killing it. Done via an interrupt or a volatile flag.",
    participants: ["Worker thread", "Termination flag (volatile boolean or interrupt)", "Shutdown method"],
    whenToUse: [
      "Background worker threads that must release resources on stop",
      "Any thread that opens files, connections, or transactions",
      "Replacing Thread.stop() (deprecated, unsafe)",
    ],
    implementation: `// Phase 1: signal (set flag / interrupt)
// Phase 2: thread detects signal and terminates cleanly

public class GracefulWorker implements Runnable {
    private volatile boolean stopRequested = false;
    private final Thread thread;

    public GracefulWorker() {
        this.thread = new Thread(this, "graceful-worker");
    }

    public void start() { thread.start(); }

    // Phase 1: signal termination
    public void stop() throws InterruptedException {
        stopRequested = true;
        thread.interrupt();      // interrupt any blocking call (sleep, wait, I/O)
        thread.join(5000);       // wait up to 5s for clean shutdown
    }

    @Override
    public void run() {
        try {
            while (!stopRequested && !Thread.currentThread().isInterrupted()) {
                doWork();
                // If doWork() calls Thread.sleep(), InterruptedException is thrown here
            }
        } catch (InterruptedException e) {
            // Expected on shutdown — exit loop
            Thread.currentThread().interrupt(); // restore interrupt status
        } finally {
            cleanup(); // Phase 2: always run cleanup
            System.out.println("Worker shut down cleanly.");
        }
    }

    private void doWork() throws InterruptedException {
        System.out.println("Working...");
        Thread.sleep(200); // simulate work; throws if interrupted
    }

    private void cleanup() {
        System.out.println("Releasing resources...");
    }
}`,
    tradeoffs: "Using both a volatile flag AND interrupt() handles both: flag catches loops that don't call blocking methods; interrupt() unblocks sleep/wait/I/O. Using only interrupt() means the flag check in the loop is redundant but harmless.",
    bestPractices: [
      "Use BOTH a volatile flag AND interrupt() — the flag handles non-blocking loops; interrupt() unblocks sleep/wait/I/O",
      "Always put resource cleanup in the finally block — it runs whether the thread exits normally or via exception",
      "join(timeout) after requesting stop — gives a window for clean shutdown before forcing shutdown",
      "Never use Thread.stop() (deprecated) — it forces lock release mid-operation and corrupts shared state",
    ],
    thumbRules: [
      "Thread does blocking I/O (sleep, wait, socket) → interrupt() is needed to unblock",
      "Thread has a non-blocking loop → volatile flag check at top of loop is sufficient",
      "Both blocking and non-blocking work → use BOTH volatile flag AND interrupt()",
      "Thread running third-party code that swallows interrupts → volatile flag is your only option",
    ],
    hiddenTruths: [
      "Thread.interrupt() is a REQUEST — the thread may ignore it. It sets a flag that blocking methods detect. Non-blocking code must explicitly check isInterrupted(). If neither happens, the thread runs forever.",
      "When InterruptedException is thrown (from sleep/wait), the interrupt flag is CLEARED. If you catch it and don't restore the flag (Thread.currentThread().interrupt()), callers can't detect the interrupt.",
      "Thread.stop() (deprecated) works by throwing a ThreadDeath error at any point in the stack — including mid-write to a partially updated object. This leaves objects in permanently inconsistent states. There is no safe way to stop a thread except cooperative cancellation.",
    ],
  },

  {
    id: "fork-join",
    name: "Fork-Join (Divide and Conquer)",
    tagline: "Recursively split tasks and join results",
    category: "Parallelism",
    intent:
      "Split a large task recursively into smaller subtasks (fork), execute them in parallel, then combine their results (join). Uses work-stealing for load balancing.",
    participants: ["ForkJoinPool", "RecursiveTask<V> (returns result)", "RecursiveAction (no result)"],
    whenToUse: [
      "CPU-bound divide-and-conquer algorithms (parallel sort, matrix ops, tree traversal)",
      "Work can be split into independent subtasks of roughly equal size",
      "Leveraging all CPU cores for heavy computation",
    ],
    implementation: `import java.util.concurrent.*;

// Parallel array sum using Fork-Join
public class ParallelSum extends RecursiveTask<Long> {
    private static final int THRESHOLD = 1000; // switch to sequential below this
    private final long[] array;
    private final int start, end;

    public ParallelSum(long[] array, int start, int end) {
        this.array = array;
        this.start = start;
        this.end   = end;
    }

    @Override
    protected Long compute() {
        int length = end - start;

        // Base case: small enough — compute directly
        if (length <= THRESHOLD) {
            long sum = 0;
            for (int i = start; i < end; i++) sum += array[i];
            return sum;
        }

        // Recursive case: split in half
        int mid = start + length / 2;
        ParallelSum left  = new ParallelSum(array, start, mid);
        ParallelSum right = new ParallelSum(array, mid, end);

        left.fork();                        // submit left subtask asynchronously
        long rightResult = right.compute(); // compute right in current thread
        long leftResult  = left.join();     // wait for left result

        return leftResult + rightResult;
    }

    public static void main(String[] args) throws Exception {
        long[] array = new long[10_000_000];
        Arrays.fill(array, 1L);

        ForkJoinPool pool = ForkJoinPool.commonPool(); // use common pool
        Long result = pool.invoke(new ParallelSum(array, 0, array.length));
        System.out.println("Sum: " + result); // 10,000,000
    }
}`,
    tradeoffs: "Fork-Join shines for CPU-bound recursive tasks. It's NOT appropriate for I/O-bound tasks (use a dedicated thread pool). Overhead of fork/join dominates for small datasets — always benchmark against sequential code.",
    bestPractices: [
      "Always define a THRESHOLD constant — below it, compute sequentially to avoid fork/join overhead on tiny tasks",
      "Fork the LEFT subtask, compute the RIGHT in the current thread — avoids creating one extra task object",
      "Use ForkJoinPool.commonPool() for CPU-bound work — it's sized to availableProcessors() by default",
      "Prefer RecursiveTask<V> over RecursiveAction when you need results — it eliminates shared state",
      "Benchmark against sequential code — fork-join only wins for N ≥ ~10,000 elements",
    ],
    thumbRules: [
      "Divide-and-conquer on data ≥ 10K elements → ForkJoinPool + RecursiveTask",
      "Task has no return value → RecursiveAction; task returns a result → RecursiveTask<V>",
      "Threshold too small → too many fork()s, overhead dominates; too large → sequential fallback dominates",
      "I/O-bound work in compute() → DO NOT use ForkJoinPool — it starves the common pool",
      "Need work-stealing with custom parallelism → new ForkJoinPool(nThreads) instead of commonPool",
    ],
    hiddenTruths: [
      "Java's parallel streams use ForkJoinPool.commonPool() internally. If your application submits a long-running ForkJoinTask to commonPool(), it blocks the threads that all parallel streams in the JVM share — causing unexpected latency in unrelated code.",
      "fork() submits the task to the current thread's work queue (not a shared queue). This is the 'work stealing' part — idle threads steal from the tail of other threads' deques. This is why fork() is fast but submit() to the pool is slower.",
      "compute() on the right subtask (not fork) keeps the work in the current thread, avoiding thread context switches for half the work. The pattern 'left.fork(); right.compute(); left.join()' is the canonical idiom — not 'left.fork(); right.fork(); join both'.",
      "ForkJoinPool threads are daemon threads by default. If your main thread exits, all ForkJoinPool work is abandoned — with no guarantee of completion.",
    ],
  },

  {
    id: "active-object",
    name: "Active Object",
    tagline: "Decouple method invocation from execution",
    category: "Coordination",
    intent:
      "Decouples method invocation from method execution: the caller submits a request (method proxy), which is queued and executed asynchronously by a dedicated worker thread. The caller gets a Future back and can poll or block for the result.",
    participants: ["Proxy (caller-facing interface)", "MethodRequest (queued command)", "ActivationQueue (BlockingQueue)", "Scheduler (worker thread)", "Servant (actual logic)", "Future (result handle)"],
    whenToUse: [
      "Decoupling slow operations from the calling thread (UI updates, I/O requests)",
      "Converting synchronous APIs to asynchronous without changing caller code",
      "Building actor-model-style components with a private message queue",
    ],
    implementation: `import java.util.concurrent.*;

// Servant: actual implementation, NOT thread-safe (only called by scheduler thread)
class TextProcessor {
    public String process(String input) {
        // expensive operation — only runs on the scheduler thread
        return input.toUpperCase();
    }
}

// Active Object: proxy + queue + scheduler
public class ActiveTextProcessor {
    private final TextProcessor servant = new TextProcessor();
    private final ExecutorService scheduler = Executors.newSingleThreadExecutor();

    // Proxy method: submits work to the queue, returns a Future
    public Future<String> process(String input) {
        return scheduler.submit(() -> servant.process(input));
    }

    public void shutdown() throws InterruptedException {
        scheduler.shutdown();
        scheduler.awaitTermination(5, TimeUnit.SECONDS);
    }
}

// Caller: doesn't block — gets a Future and can check later
ActiveTextProcessor processor = new ActiveTextProcessor();
Future<String> f1 = processor.process("hello");
Future<String> f2 = processor.process("world");

System.out.println(f1.get()); // "HELLO"
System.out.println(f2.get()); // "WORLD"
processor.shutdown();`,
    tradeoffs: "Active Object decouples callers from execution but adds latency (queue + context switch). The servant is accessed only from the scheduler thread — no synchronization needed on the servant itself. The queue becomes a bottleneck under high load.",
    bestPractices: [
      "Use a single-threaded scheduler for the servant — eliminates synchronization on the servant entirely",
      "For high-throughput, use a bounded queue and apply back-pressure on the caller (BlockingQueue.put blocks when full)",
      "Keep the proxy interface identical to the servant interface — callers see the same API, just async",
      "Monitor queue depth — a growing queue means the servant is slower than the callers",
    ],
    thumbRules: [
      "Single-threaded object that must be called from multiple threads → Active Object (safe servant, async callers)",
      "Actor-model per-object message queue → Active Object is the Java analogue",
      "Simple fire-and-forget → CompletableFuture.runAsync() is lighter",
      "Complex state machine → Active Object keeps state confined to servant thread",
    ],
    hiddenTruths: [
      "Active Object is essentially an actor: it has a mailbox (queue), private state (servant), and processes messages sequentially. The difference from Akka/actors is it uses Java's Future for replies instead of message-passing.",
      "The proxy itself must be thread-safe (multiple callers submit concurrently). The servant does NOT need to be thread-safe — it's accessed only by the scheduler thread.",
      "Java's ExecutorService + Callable + Future is a complete implementation of Active Object. newSingleThreadExecutor() gives you the scheduler; Callable is the MethodRequest; Future is the result handle. The pattern is built into the JDK.",
    ],
  },

  {
    id: "balking",
    name: "Balking Pattern",
    tagline: "Skip execution if the object is not in the right state",
    category: "Coordination",
    intent:
      "An object balks (refuses to execute) a method if it's not in the appropriate state to handle it. Instead of blocking, the method returns immediately — either silently or with an indication that it was skipped. Useful for operations that only make sense once, or should be ignored if already in progress.",
    participants: ["Client (caller)", "BalkingObject (guard + action)", "Guard condition (boolean state check)"],
    whenToUse: [
      "An operation should only run once (initialization, shutdown signal)",
      "An operation is idempotent and should be skipped if already in progress",
      "Avoid repeated execution of a costly operation triggered by multiple events",
    ],
    implementation: `// Classic example: lazy initialization that balks if already done
public class DataLoader {
    private boolean initialized = false;
    private Map<String, String> data;

    // Balking: returns immediately if already initialized
    public synchronized void initialize() {
        if (initialized) return; // BALK — do nothing
        data = loadFromDatabase();
        initialized = true;
    }

    public Map<String, String> getData() {
        return Collections.unmodifiableMap(data);
    }
}

// More sophisticated: balk with notification
public class JobProcessor {
    private enum State { IDLE, RUNNING, DONE }
    private State state = State.IDLE;

    // Balks if already running or done
    public synchronized boolean startJob() {
        if (state != State.IDLE) {
            return false; // balk — caller knows it was skipped
        }
        state = State.RUNNING;
        new Thread(this::runJob).start();
        return true; // accepted
    }

    private synchronized void runJob() {
        try {
            performWork();
        } finally {
            state = State.DONE;
        }
    }
}

// Without balking — the naive broken version:
// public void initialize() {
//     data = loadFromDatabase(); // called multiple times if concurrent threads arrive
//     initialized = true;
// }`,
    tradeoffs: "Balking is simple and avoids unnecessary blocking. But callers that balk get no result — they must decide whether to retry, throw an exception, or ignore the skip. Unlike guarded suspension (wait), balking is 'give up immediately', not 'wait until ready'.",
    bestPractices: [
      "Return a boolean (or enum result) from balking methods so callers know whether the operation ran",
      "Make the guard check + state change atomic (synchronized or CAS) — a non-atomic guard is a race condition",
      "Consider whether 'balk' should throw (IllegalStateException) or return silently — depends on whether skipping is expected or an error",
      "Document clearly that the method can balk — callers need to know to handle the no-op case",
    ],
    thumbRules: [
      "Run-once initialization → Balking (check initialized flag, return if true)",
      "Start-only-if-not-running → Balking on a state enum",
      "Caller should wait until ready → Guarded Suspension (wait/notify) instead of Balking",
      "Shutdown (should run once, from any thread) → Balking + state machine",
    ],
    hiddenTruths: [
      "Balking is Guarded Suspension with an immediate return instead of waiting. Both use the same guard condition — the difference is: Guarded Suspension waits for the condition to become true; Balking gives up if it's false.",
      "The check-then-act must be atomic. Checking initialized outside a synchronized block and then calling initialize() creates a race — two threads can both see initialized=false and both proceed. Always check AND change state atomically.",
      "Java's Optional<T> is a natural return type for balking methods — Optional.empty() means 'balked', Optional.of(result) means 'ran'. This makes the balk visible in the type system.",
    ],
  },

  {
    id: "immutability-pattern",
    name: "Immutability Pattern",
    tagline: "Eliminate shared mutable state entirely",
    category: "Synchronization",
    intent:
      "Design objects to be unmodifiable after construction. Immutable objects can be freely shared across threads without synchronization — no locks, no volatile, no atomics needed. The pattern eliminates the root cause of race conditions: mutable shared state.",
    participants: ["Immutable value object", "Builder (for complex construction)", "Factory method (for cached instances)"],
    whenToUse: [
      "Value objects (Money, Date ranges, coordinates, config entries)",
      "Objects shared across threads that don't need to change after creation",
      "Domain events and messages in event-driven or actor systems",
    ],
    implementation: `import java.util.*;

// Fully immutable value object
public final class Money {  // final: no subclass can add mutability
    private final long   amount;   // final: set once in constructor
    private final String currency; // String is already immutable

    // No defensive copy needed for primitives and Strings
    public Money(long amount, String currency) {
        if (amount < 0) throw new IllegalArgumentException("amount must be >= 0");
        Objects.requireNonNull(currency, "currency required");
        this.amount   = amount;
        this.currency = currency;
    }

    // Accessors — no setters
    public long   getAmount()   { return amount; }
    public String getCurrency() { return currency; }

    // 'Modification' returns a NEW object — this is unchanged
    public Money add(Money other) {
        if (!currency.equals(other.currency))
            throw new IllegalArgumentException("currency mismatch");
        return new Money(amount + other.amount, currency); // NEW instance
    }

    @Override public boolean equals(Object o) {
        if (!(o instanceof Money m)) return false;
        return amount == m.amount && currency.equals(m.currency);
    }
    @Override public int hashCode() { return Objects.hash(amount, currency); }
    @Override public String toString() { return amount + " " + currency; }
}

// Java 16+ record — immutable by default (field values set once, no setters)
public record Point(int x, int y) {
    // Compact constructor for validation
    public Point {
        if (x < 0 || y < 0) throw new IllegalArgumentException("negative coordinates");
    }
    public Point translate(int dx, int dy) { return new Point(x + dx, y + dy); }
}

// Safe sharing — no synchronization needed
Money price = new Money(100, "USD");
// Many threads can read price.getAmount() simultaneously — no locks
ExecutorService pool = Executors.newFixedThreadPool(8);
for (int i = 0; i < 1000; i++) {
    pool.submit(() -> System.out.println(price.getAmount())); // always safe
}`,
    tradeoffs: "Immutability eliminates synchronization overhead completely but creates more objects (GC pressure). Modern GCs handle short-lived objects efficiently (young generation collection is cheap). The tradeoff is almost always worth it for value objects.",
    bestPractices: [
      "Declare the class final (or use private constructors + factory methods) to prevent subclass mutability",
      "Declare ALL fields final and private — no setters",
      "Defensively copy mutable arguments in constructors (Date, arrays, List)",
      "Defensively copy mutable return values in getters",
      "Use Collections.unmodifiableXxx() or List.copyOf() for collection fields",
      "Consider Java record for simple data carriers — enforces immutability by design",
    ],
    thumbRules: [
      "Value object (coordinate, range, money, event) → immutable (record or final class with final fields)",
      "Mutable collection field → deep copy in constructor and getters, or use List.copyOf()",
      "'Modify' returns new instance → correct pattern (add(), withX(), translate())",
      "Object created once, read many times → immutable = zero synchronization cost ever",
    ],
    hiddenTruths: [
      "final on a reference field makes the REFERENCE immutable, not the object. final List<String> names means you can't reassign names, but names.add('foo') still works. True immutability requires the ENTIRE object graph to be immutable.",
      "Immutable objects can still have lazy initialization of derived fields (e.g., cached hashCode). This is safe as long as the field is either int (worst-case: computed twice) or volatile (for non-primitive cached values). Bloch's Effective Java Item 17 covers this.",
      "Creating many short-lived immutable objects is NOT necessarily bad for GC. HotSpot's young-generation GC handles object allocation at near-malloc speed. The real cost of mutability (locks, volatile, cache coherence traffic) usually exceeds the GC cost of immutable objects.",
      "Java records automatically generate equals, hashCode, and toString based on components. They are shallow-immutable: a record with a mutable field (List, Date) can have its field's contents mutated. Add defensive copies in compact constructors for true deep immutability.",
    ],
  },

  {
    id: "half-sync-half-async",
    name: "Half-Sync/Half-Async",
    tagline: "Separate synchronous processing from asynchronous I/O",
    category: "Coordination",
    intent:
      "Separates a system into two layers: an asynchronous layer that handles I/O events without blocking (interrupt-driven or event-loop style) and a synchronous layer where business logic runs in regular blocking threads. A queue decouples the two layers. Common in web servers, event-driven systems, and reactive frameworks.",
    participants: ["Async Layer (event loop, NIO selector, interrupt handler)", "Queue (BlockingQueue or Disruptor)", "Sync Layer (worker thread pool with blocking I/O)", "External Client (source of requests/events)"],
    whenToUse: [
      "Separating network I/O handling (async) from business logic processing (sync)",
      "Web servers: accept connections asynchronously, process requests in a thread pool",
      "Systems where I/O layer shouldn't block on processing, and processing shouldn't busy-wait on I/O",
    ],
    implementation: `import java.util.concurrent.*;

// Async Layer: receives incoming requests (simulated here — in practice: NIO selector, netty channel)
public class AsyncEventAcceptor implements Runnable {
    private final BlockingQueue<Request> requestQueue;

    public AsyncEventAcceptor(BlockingQueue<Request> queue) {
        this.requestQueue = queue;
    }

    @Override
    public void run() {
        // In a real system: NIO selector loop, interrupt handler, or event bus subscriber
        // Here: simulated incoming requests
        while (!Thread.currentThread().isInterrupted()) {
            Request request = acceptRequest(); // non-blocking I/O read
            if (request != null) {
                requestQueue.offer(request); // hand off to sync layer
            }
        }
    }

    private Request acceptRequest() {
        // Simulate: NIO SelectionKey.OP_READ ready, create request object
        return new Request("GET /api/data HTTP/1.1");
    }
}

// Sync Layer: worker thread pool — processes requests using blocking operations
public class SyncWorkerPool {
    private final BlockingQueue<Request> requestQueue;
    private final ExecutorService workers;

    public SyncWorkerPool(BlockingQueue<Request> queue, int threadCount) {
        this.requestQueue = queue;
        this.workers = Executors.newFixedThreadPool(threadCount, r -> {
            Thread t = new Thread(r, "sync-worker");
            t.setDaemon(false);
            return t;
        });
    }

    public void start() {
        for (int i = 0; i < Runtime.getRuntime().availableProcessors(); i++) {
            workers.execute(() -> {
                while (!Thread.currentThread().isInterrupted()) {
                    try {
                        Request req = requestQueue.take(); // block until available
                        processRequest(req);               // synchronous business logic
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            });
        }
    }

    private void processRequest(Request req) {
        // Blocking database call, file I/O, computation — runs safely in sync layer
        System.out.println("Processing: " + req.path());
    }
}

// Wire together
BlockingQueue<Request> queue = new LinkedBlockingQueue<>(1000);
new Thread(new AsyncEventAcceptor(queue), "async-acceptor").start();
new SyncWorkerPool(queue, 8).start();`,
    tradeoffs: "Half-Sync/Half-Async gives high throughput by keeping I/O non-blocking while keeping business logic simple (synchronous, no callback hell). The queue is a contention point — size it carefully. Netty, Vert.x, and Node.js (adapted to Java) all implement variants of this pattern.",
    bestPractices: [
      "Size the queue capacity to bound memory usage — unbounded queues hide backpressure problems",
      "Monitor queue depth — a growing queue means the sync layer can't keep up with the async layer",
      "The async layer should be minimal — only I/O event handling, no business logic",
      "Use virtual threads (Java 21+) for the sync layer — each request can block freely without wasting OS threads",
    ],
    thumbRules: [
      "High-throughput I/O server → async acceptor + queue + sync worker pool",
      "Queue growing → sync workers are the bottleneck — add more worker threads or optimize processing",
      "Async layer blocked → I/O layer is the bottleneck — check network/disk or optimize async handling",
      "Java 21+ → replace sync worker pool with virtual thread per task executor",
    ],
    hiddenTruths: [
      "This pattern is the foundation of every Java web server: Tomcat and Jetty use NIO acceptor threads (async layer) + servlet thread pools (sync layer). The BIO connector was a fully synchronous variant; NIO connector is Half-Sync/Half-Async.",
      "Reactive frameworks (Project Reactor, RxJava) collapse the sync layer by making everything async. This eliminates the queue boundary but introduces callback complexity. Half-Sync/Half-Async is the pragmatic middle ground.",
      "The queue between layers is a natural backpressure point. When the queue is full, the async layer must decide: drop events, apply back-pressure upstream, or block. This choice determines whether the system is 'fail-safe' or 'fail-slow' under overload.",
      "Virtual threads (Java 21) change the tradeoff: the sync layer can block freely without wasting OS threads. Replacing the fixed thread pool with Executors.newVirtualThreadPerTaskExecutor() eliminates the need to size the thread pool — the JVM handles scheduling automatically.",
    ],
  },
];

export const CATEGORY_META = {
  "Resource Management": { color: "var(--blue)",  bg: "var(--blue-subtle)" },
  "Coordination":        { color: "var(--red)",   bg: "var(--red-subtle)" },
  "Synchronization":     { color: "var(--gold)",  bg: "var(--gold-subtle)" },
  "Lifecycle":           { color: "var(--green)", bg: "var(--green-subtle)" },
  "Parallelism":         { color: "var(--blue)",  bg: "var(--blue-subtle)" },
};
