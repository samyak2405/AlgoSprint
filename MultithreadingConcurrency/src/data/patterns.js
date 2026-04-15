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
    implementation: `// Monitor using intrinsic locks
public class BlockingStack<T> {
    private final LinkedList<T> stack = new LinkedList<>();
    private final int capacity;

    public BlockingStack(int capacity) { this.capacity = capacity; }

    public synchronized void push(T item) throws InterruptedException {
        while (stack.size() == capacity) {
            wait();               // release lock, suspend thread
        }
        stack.push(item);
        notifyAll();              // wake threads waiting on pop
    }

    public synchronized T pop() throws InterruptedException {
        while (stack.isEmpty()) {
            wait();               // release lock, suspend thread
        }
        T item = stack.pop();
        notifyAll();              // wake threads waiting on push
        return item;
    }
}

// Monitor using ReentrantLock + Condition (more precise signalling)
public class PreciseMonitor<T> {
    private final LinkedList<T> buffer = new LinkedList<>();
    private final int capacity;
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notFull  = lock.newCondition();
    private final Condition notEmpty = lock.newCondition();

    public PreciseMonitor(int capacity) { this.capacity = capacity; }

    public void put(T item) throws InterruptedException {
        lock.lock();
        try {
            while (buffer.size() == capacity) notFull.await();
            buffer.addLast(item);
            notEmpty.signal(); // wake only one consumer (not all threads)
        } finally { lock.unlock(); }
    }

    public T take() throws InterruptedException {
        lock.lock();
        try {
            while (buffer.isEmpty()) notEmpty.await();
            T item = buffer.removeFirst();
            notFull.signal(); // wake only one producer
            return item;
        } finally { lock.unlock(); }
    }
}`,
    tradeoffs: "notifyAll() wakes all waiting threads (thundering herd) but is safe. Using separate Conditions (notFull/notEmpty) and signal() avoids waking the wrong side.",
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
    implementation: `import java.util.concurrent.locks.*;

public class ThreadSafeCache<K, V> {
    private final Map<K, V> cache = new HashMap<>();
    private final ReentrantReadWriteLock rwLock = new ReentrantReadWriteLock();

    public V get(K key) {
        rwLock.readLock().lock();         // multiple threads can hold this
        try {
            return cache.get(key);
        } finally {
            rwLock.readLock().unlock();
        }
    }

    public void put(K key, V value) {
        rwLock.writeLock().lock();        // exclusive — blocks all readers
        try {
            cache.put(key, value);
        } finally {
            rwLock.writeLock().unlock();
        }
    }

    // Optimistic read with StampedLock (Java 8) — even higher throughput
    private final StampedLock stampedLock = new StampedLock();
    private double x, y; // shared state

    public double distanceTo(double ox, double oy) {
        long stamp = stampedLock.tryOptimisticRead(); // no lock!
        double curX = x, curY = y;
        if (!stampedLock.validate(stamp)) {           // check if write happened
            stamp = stampedLock.readLock();           // fall back to real lock
            try { curX = x; curY = y; }
            finally { stampedLock.unlockRead(stamp); }
        }
        return Math.hypot(curX - ox, curY - oy);
    }
}`,
    tradeoffs: "If writes are frequent, write lock blocks all reads, reducing throughput. StampedLock provides higher throughput with optimistic reads but is non-reentrant and more complex to use correctly.",
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
  },
];

export const CATEGORY_META = {
  "Resource Management": { color: "var(--blue)",  bg: "var(--blue-subtle)" },
  "Coordination":        { color: "var(--red)",   bg: "var(--red-subtle)" },
  "Synchronization":     { color: "var(--gold)",  bg: "var(--gold-subtle)" },
  "Lifecycle":           { color: "var(--green)", bg: "var(--green-subtle)" },
  "Parallelism":         { color: "var(--blue)",  bg: "var(--blue-subtle)" },
};
