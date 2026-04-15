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
    gotcha:
      "setDaemon(true) must be called BEFORE start(). Calling it after start() throws IllegalThreadStateException. Also: thread subclasses (extends Thread) make Callable impossible — you'd need a FutureTask wrapper anyway.",
    takeaway:
      "In modern Java: use lambdas + ExecutorService for production tasks. Use Thread.Builder when you need explicit naming or daemon control. Use Callable when the task returns a value. Never subclass Thread.",
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
    gotcha:
      "Fair locks (ReentrantLock(true)) prevent starvation but reduce throughput — FIFO ordering means threads wake one at a time. Only use when fairness is a hard requirement.",
    takeaway:
      "Livelock → add randomness to break symmetry. Starvation → use fair queuing or restructure so long-running tasks don't hog resources.",
  },
];

export const CATEGORY_META = {
  Fundamentals: { color: "var(--blue)", bg: "var(--blue-subtle)", count: CONCEPTS.filter(c => c.category === "Fundamentals").length },
  Synchronization: { color: "var(--red)", bg: "var(--red-subtle)", count: CONCEPTS.filter(c => c.category === "Synchronization").length },
  Pitfalls: { color: "var(--gold)", bg: "var(--gold-subtle)", count: CONCEPTS.filter(c => c.category === "Pitfalls").length },
};
