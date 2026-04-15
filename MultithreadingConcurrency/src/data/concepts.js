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
    codeExample: `// Observe thread states
public class ThreadStateDemo {
    public static void main(String[] args) throws InterruptedException {
        Object lock = new Object();

        Thread blocked = new Thread(() -> {
            synchronized (lock) { /* never reaches here */ }
        });

        Thread waiting = new Thread(() -> {
            try { Thread.sleep(Long.MAX_VALUE); }
            catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        });

        // Lock held by main thread — blocked thread will be BLOCKED
        synchronized (lock) {
            blocked.start();
            waiting.start();
            Thread.sleep(50); // let threads settle

            System.out.println(blocked.getState()); // BLOCKED
            System.out.println(waiting.getState()); // TIMED_WAITING
        }

        blocked.join();
        waiting.interrupt();
        waiting.join();
        System.out.println(blocked.getState()); // TERMINATED
    }
}`,
    gotcha:
      "RUNNABLE does NOT mean the thread is currently executing. The OS may have preempted it. A thread in RUNNABLE is either on-CPU or in the OS ready queue.",
    takeaway:
      "Use thread dumps (kill -3 <pid> or jstack) in production to see all thread states at once — the most powerful concurrency debugging tool.",
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
    codeExample: `// Without JMM guarantee — potentially broken
class BrokenFlag {
    boolean stop = false; // not volatile

    void writer() { stop = true; }             // Thread A
    void reader() { while (!stop) {} }         // Thread B — may loop forever
}

// Fixed with volatile
class SafeFlag {
    volatile boolean stop = false;

    void writer() { stop = true; }             // flush to main memory
    void reader() { while (!stop) {} }         // always reads from main memory
}

// happens-before via synchronized
class SafeWithSync {
    boolean stop = false;

    synchronized void writer() { stop = true; }
    synchronized void reader() { while (!stop) {} }
}`,
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
    codeExample: `// Method-level lock (locks on 'this')
public class Counter {
    private int count = 0;

    public synchronized void increment() {
        count++;
    }
    public synchronized int get() {
        return count;
    }
}

// Block-level — prefer private lock object
public class SafeCounter {
    private final Object lock = new Object();
    private int count = 0;

    public void increment() {
        synchronized (lock) {
            count++;
        }
    }
    public int get() {
        synchronized (lock) {
            return count;
        }
    }
}

// wait / notify pattern (must hold the lock)
public class BoundedBuffer<T> {
    private final Queue<T> queue = new LinkedList<>();
    private final int capacity;

    public BoundedBuffer(int capacity) { this.capacity = capacity; }

    public synchronized void put(T item) throws InterruptedException {
        while (queue.size() == capacity) wait();   // release lock, wait
        queue.add(item);
        notifyAll();
    }

    public synchronized T take() throws InterruptedException {
        while (queue.isEmpty()) wait();
        T item = queue.poll();
        notifyAll();
        return item;
    }
}`,
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
    codeExample: `// Correct use: simple stop flag
public class WorkerThread extends Thread {
    private volatile boolean stopRequested = false;

    @Override
    public void run() {
        while (!stopRequested) {
            // do work
        }
        System.out.println("Thread stopped cleanly.");
    }

    public void requestStop() {
        stopRequested = true;  // visible to run() immediately
    }
}

// WRONG: volatile counter — still a race
class BrokenCounter {
    private volatile int count = 0;

    public void increment() {
        count++;  // read → increment → write — 3 non-atomic steps!
    }
}

// Correct: use AtomicInteger for counters
class SafeCounter {
    private final AtomicInteger count = new AtomicInteger(0);

    public void increment() { count.incrementAndGet(); }
    public int get()        { return count.get(); }
}`,
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
    codeExample: `// Classic deadlock pattern
class DeadlockExample {
    private final Object lockA = new Object();
    private final Object lockB = new Object();

    // Thread 1: acquires A, then B
    void methodA() {
        synchronized (lockA) {
            synchronized (lockB) { /* work */ }
        }
    }

    // Thread 2: acquires B, then A — circular wait!
    void methodB() {
        synchronized (lockB) {
            synchronized (lockA) { /* work */ }  // DEADLOCK
        }
    }
}

// Fix 1: consistent lock ordering
class FixedOrdering {
    // Always acquire lockA before lockB — everywhere in the codebase
    void methodA() {
        synchronized (lockA) { synchronized (lockB) { /* work */ } }
    }
    void methodB() {
        synchronized (lockA) { synchronized (lockB) { /* work */ } }
    }
}

// Fix 2: tryLock with timeout
class TryLockFix {
    private final ReentrantLock lockA = new ReentrantLock();
    private final ReentrantLock lockB = new ReentrantLock();

    boolean doWork() throws InterruptedException {
        while (true) {
            if (lockA.tryLock(50, TimeUnit.MILLISECONDS)) {
                try {
                    if (lockB.tryLock(50, TimeUnit.MILLISECONDS)) {
                        try {
                            // safely hold both locks
                            return true;
                        } finally { lockB.unlock(); }
                    }
                } finally { lockA.unlock(); }
            }
            Thread.sleep(1); // back off and retry
        }
    }
}`,
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
    codeExample: `// Race condition: check-then-act
class BrokenSingleton {
    private static BrokenSingleton instance;

    public static BrokenSingleton getInstance() {
        if (instance == null) {                    // Thread A reads null
            instance = new BrokenSingleton();      // Thread B ALSO reads null → two instances!
        }
        return instance;
    }
}

// Fix: double-checked locking with volatile
class SafeSingleton {
    private static volatile SafeSingleton instance;

    public static SafeSingleton getInstance() {
        if (instance == null) {
            synchronized (SafeSingleton.class) {
                if (instance == null) {
                    instance = new SafeSingleton();
                }
            }
        }
        return instance;
    }
}

// Best: initialization-on-demand holder (no sync needed)
class HolderSingleton {
    private static class Holder {
        static final HolderSingleton INSTANCE = new HolderSingleton();
    }
    public static HolderSingleton getInstance() { return Holder.INSTANCE; }
}

// Race: non-atomic compound action on ConcurrentHashMap
ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();

// WRONG — two separate atomic operations, not one
if (!map.containsKey("key")) map.put("key", 1);

// RIGHT — atomic
map.putIfAbsent("key", 1);
map.computeIfAbsent("key", k -> computeExpensiveValue(k));`,
    gotcha:
      "ConcurrentHashMap makes individual operations thread-safe, but compound operations (containsKey + put) are still races unless you use the atomic methods like putIfAbsent, compute, or merge.",
    takeaway:
      "Think in atomic units. If correctness requires 'check' + 'act' to happen with no other thread intervening, that's one operation — use synchronization or atomic API to make it so.",
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
    codeExample: `// Livelock: each thread backs off when it sees the other — forever
class LivelockExample {
    boolean leftHeld  = false;
    boolean rightHeld = false;

    // Both threads keep detecting the other and releasing — no progress
    void tryBoth(boolean isMine) {
        while (true) {
            synchronized (this) {
                if (isMine  && rightHeld) { leftHeld  = false; continue; }
                if (!isMine && leftHeld)  { rightHeld = false; continue; }
                // acquire both...
            }
        }
    }
}

// Fix: random backoff breaks the symmetry
void tryWithBackoff() throws InterruptedException {
    Random rand = new Random();
    while (true) {
        // attempt to acquire
        if (!acquired()) {
            Thread.sleep(rand.nextInt(10)); // random delay
        } else {
            break;
        }
    }
}

// Starvation fix: fair ReentrantLock
ReentrantLock fairLock = new ReentrantLock(true); // fair = FIFO ordering

void fairWork() {
    fairLock.lock();
    try {
        // no thread starves — FIFO guarantees eventual access
    } finally {
        fairLock.unlock();
    }
}`,
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
