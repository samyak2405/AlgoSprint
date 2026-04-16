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

  // ── Thread API ────────────────────────────────────────────────────────
  { id: "r42", category: "Thread API", color: "var(--blue)", title: "Thread Creation — 6 Ways",
    oneliner: "extends Thread (avoid) · implements Runnable · Callable+Future · lambda · ExecutorService.submit() · Thread.Builder (Java 21)",
    key: "Thread.ofVirtual() / Thread.ofPlatform()", gotcha: "Never call run() directly — it runs on the CURRENT thread. Always call start()." },

  { id: "r43", category: "Thread API", color: "var(--blue)", title: "Runnable vs Callable",
    oneliner: "Runnable: no return value, no checked exceptions. Callable<T>: returns T, can throw checked exceptions. Both are @FunctionalInterface.",
    key: "ExecutorService.submit(Callable<T>) → Future<T>", gotcha: "A Callable's exception is stored in the Future — it only surfaces when you call future.get()." },

  { id: "r44", category: "Thread API", color: "var(--blue)", title: "Thread.sleep()",
    oneliner: "Suspends current thread for given time. HOLDS all locks. Throws InterruptedException. Static method — acts on calling thread.",
    key: "Thread.sleep(millis)", gotcha: "sleep() holds locks — never sleep inside synchronized if other threads need that lock. Use wait() to release." },

  { id: "r45", category: "Thread API", color: "var(--blue)", title: "Thread.join()",
    oneliner: "Blocks calling thread until target thread terminates. Establishes happens-before: target's writes visible after join() returns.",
    key: "thread.join(timeout)", gotcha: "Always use join(timeout) in production — join() without timeout blocks forever if the thread hangs." },

  { id: "r46", category: "Thread API", color: "var(--blue)", title: "interrupt() / isInterrupted()",
    oneliner: "interrupt() sets a flag. Blocking methods (sleep/wait/join) throw InterruptedException. Non-blocking loops must check isInterrupted().",
    key: "Thread.currentThread().isInterrupted()", gotcha: "Never swallow InterruptedException silently. Always call Thread.currentThread().interrupt() to restore the flag." },

  { id: "r47", category: "Thread API", color: "var(--blue)", title: "Daemon Threads",
    oneliner: "Daemon threads are killed when all non-daemon threads finish. Use for background housekeeping. setDaemon(true) BEFORE start().",
    key: "thread.setDaemon(true)", gotcha: "setDaemon() after start() throws IllegalThreadStateException. Daemon threads cannot guarantee their finally blocks run." },

  // ── Inter-Thread Communication ─────────────────────────────────────────
  { id: "r48", category: "Inter-Thread Comm", color: "var(--red)", title: "wait() / notify()",
    oneliner: "Must hold the lock. wait() atomically releases lock + suspends. notify() wakes one. notifyAll() wakes all. Always while() not if().",
    key: "synchronized(lock) { while(!cond) lock.wait(); }", gotcha: "sleep() keeps the lock. wait() releases it. Confusing these is the #1 deadlock source." },

  { id: "r49", category: "Inter-Thread Comm", color: "var(--red)", title: "notify() vs notifyAll()",
    oneliner: "notify() wakes one arbitrary thread. notifyAll() wakes all — each re-checks its condition. notifyAll() is almost always the safe choice.",
    key: "lock.notifyAll()", gotcha: "notify() is only safe when ALL waiters are interchangeable (same condition, any one can proceed). Otherwise, use notifyAll()." },

  { id: "r50", category: "Inter-Thread Comm", color: "var(--red)", title: "Thread.yield()",
    oneliner: "Hint to the OS scheduler: 'I'm willing to give up my time slice'. Not guaranteed to pause. Rarely useful in production code.",
    key: "Thread.yield()", gotcha: "yield() is a hint only — the OS may ignore it. Never rely on yield() for correctness or ordering." },

  { id: "r51", category: "Inter-Thread Comm", color: "var(--red)", title: "Exchanger",
    oneliner: "Exactly two threads swap objects at a synchronization point. Each call to exchange() blocks until the partner arrives.",
    key: "new Exchanger<T>() / exchanger.exchange(obj)", gotcha: "Strictly two-thread. A third thread calling exchange() blocks forever (or times out)." },

  // ── Synchronizers (new entries) ────────────────────────────────────────
  { id: "r52", category: "Synchronizers", color: "var(--gold)", title: "Phaser",
    oneliner: "Reusable multi-phase barrier with dynamic party registration. More flexible than CyclicBarrier — parties can join/leave at runtime.",
    key: "phaser.arriveAndAwaitAdvance()", gotcha: "arriveAndDeregister() on the last party terminates the Phaser. Subsequent operations throw IllegalStateException." },

  // ── Locks (new entry) ─────────────────────────────────────────────────
  { id: "r53", category: "Locks", color: "var(--red)", title: "LockSupport",
    oneliner: "Primitive blocking. park() suspends current thread; unpark(t) resumes it. No lock required. unpark() before park() stores one permit.",
    key: "LockSupport.park() / LockSupport.unpark(thread)", gotcha: "park() returns spuriously — always re-check condition in a loop after park()." },

  // ── Types of Threads ──────────────────────────────────────────────────
  { id: "r54", category: "Types of Threads", color: "var(--blue)", title: "Main Thread",
    oneliner: "Entry point thread started by the JVM. Runs main(). Default name 'main', ID always 1. Non-daemon — JVM waits for it to finish.",
    key: "Thread.currentThread().getName() → \"main\"", gotcha: "If main() spawns non-daemon threads and returns, the JVM stays alive until all non-daemon threads complete." },

  { id: "r55", category: "Types of Threads", color: "var(--blue)", title: "Platform Thread",
    oneliner: "Classic OS-mapped thread (1:1 with kernel thread). Heavy — ~1 MB stack per thread. Use for CPU-bound work sized to core count.",
    key: "Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors())", gotcha: "Creating thousands of platform threads causes memory pressure + context-switch overhead. For I/O-bound work, use virtual threads instead." },

  { id: "r56", category: "Types of Threads", color: "var(--blue)", title: "Daemon Thread",
    oneliner: "Background thread — JVM exits when ALL non-daemon threads finish, regardless of daemons still running. Use for GC, heartbeats, metrics, log flushers.",
    key: "thread.setDaemon(true) // must call before start()", gotcha: "Never do critical work (DB writes, payment processing) in daemon threads — they can be killed mid-operation when the JVM exits." },

  { id: "r57", category: "Types of Threads", color: "var(--blue)", title: "Thread Pool Thread",
    oneliner: "Reused platform threads managed by ExecutorService. Avoids thread-creation overhead. Fixed pool for CPU-bound; cached pool for short-lived I/O.",
    key: "Executors.newFixedThreadPool(n) / newCachedThreadPool()", gotcha: "ThreadPoolExecutor's default rejected policy (AbortPolicy) throws RejectedExecutionException silently — always configure a custom handler in production." },

  { id: "r58", category: "Types of Threads", color: "var(--blue)", title: "Virtual Thread",
    oneliner: "Lightweight JDK-managed thread (Java 21+). Millions can exist — each costs ~few KB. Ideal for I/O-bound work: HTTP calls, DB queries, file I/O.",
    key: "Thread.ofVirtual().start(task) / Executors.newVirtualThreadPerTaskExecutor()", gotcha: "Avoid synchronized blocks in virtual threads — they pin the carrier thread, defeating the purpose. Use ReentrantLock instead." },

  { id: "r59", category: "Types of Threads", color: "var(--blue)", title: "ForkJoin Worker Thread",
    oneliner: "Worker inside ForkJoinPool. Backs parallel streams, CompletableFuture.supplyAsync(), RecursiveTask. Uses work-stealing — idle threads steal tasks from busy threads' queues.",
    key: "ForkJoinPool.commonPool() / new ForkJoinPool(n)", gotcha: "Never use for blocking I/O — a blocking task starves all parallel streams/CompletableFutures sharing the common pool." },

  { id: "r60", category: "Types of Threads", color: "var(--blue)", title: "Scheduled Thread",
    oneliner: "Thread inside ScheduledExecutorService for delayed or periodic work. schedule() = one-shot delay; scheduleAtFixedRate() = fixed period; scheduleWithFixedDelay() = fixed gap after completion.",
    key: "Executors.newScheduledThreadPool(n)", gotcha: "scheduleAtFixedRate skips executions if a run takes longer than the period — it does NOT stack up. Use scheduleWithFixedDelay for 'wait then run' semantics." },

  { id: "r61", category: "Types of Threads", color: "var(--blue)", title: "Carrier Thread",
    oneliner: "Platform thread that 'mounts' a virtual thread for execution. When a virtual thread blocks on I/O, it unmounts and the carrier is free to run another virtual thread.",
    key: "-Djdk.tracePinnedThreads=full (diagnose pinning)", gotcha: "synchronized blocks pin the virtual thread to its carrier — the carrier is blocked too. Replace synchronized with ReentrantLock to enable proper unmounting." },

  // ── Performance ──────────────────────────────────────────────────────
  { id: "r62", category: "Performance", color: "var(--green)", title: "False Sharing",
    oneliner: "Two threads writing to different fields that share a CPU cache line (~64 bytes) cause constant cache invalidation. Performance collapses despite no logical data sharing.",
    key: "LongAdder / @Contended / ThreadLocal / 7-long padding", gotcha: "No race condition, no deadlock — purely a performance bug. Invisible in code review; only visible under high-concurrency benchmark. Use async-profiler or JFR to detect." },

  { id: "r63", category: "Performance", color: "var(--green)", title: "Amdahl's Law",
    oneliner: "Max speedup from N cores = 1 / (serial_fraction + parallel_fraction/N). 10% serial → 10x ceiling at ∞ cores. Optimize serial parts first — not parallel ones.",
    key: "S(n) = 1 / (p + (1-p)/n)", gotcha: "Adding more threads beyond Amdahl's ceiling hurts — more contention, more context switches. More threads ≠ more speed." },

  // ── New Concepts ────────────────────────────────────────────────────────
  { id: "r64", category: "Synchronization", color: "var(--red)", title: "Safe Publication",
    oneliner: "Publishing an object reference to another thread guarantees visibility only if done via: static final, volatile, final fields in constructor, or synchronized. Non-volatile fields are NOT safe publication channels.",
    key: "static final | volatile | final field | synchronized", gotcha: "Even IMMUTABLE objects need safe publication. Another thread may see the reference but find partially-initialized fields." },

  { id: "r65", category: "Synchronization", color: "var(--red)", title: "Immutability Pattern",
    oneliner: "Objects that cannot be modified after construction are inherently thread-safe. No locking, no volatile, no atomics needed. final + no setters + defensive copies + final class.",
    key: "final class, all fields final, defensive copy, record (Java 16+)", gotcha: "final reference ≠ immutable object. final List<String> list can still have list.add() called on it. Deep immutability requires the entire object graph to be immutable." },

  { id: "r66", category: "Synchronization", color: "var(--red)", title: "Thread Safety Levels",
    oneliner: "Immutable > Unconditionally Thread-Safe > Conditionally Thread-Safe > Not Thread-Safe > Thread-Hostile. Know the level of every shared class.",
    key: "@Immutable | @ThreadSafe | @NotThreadSafe", gotcha: "Collections.synchronizedList is CONDITIONALLY thread-safe — iteration still needs external synchronized(list) block." },

  { id: "r67", category: "Synchronization", color: "var(--red)", title: "Double-Checked Locking",
    oneliner: "Lazy singleton init: check null (no lock) → synchronized → check null again → create. volatile on the field is REQUIRED to prevent constructor reordering.",
    key: "private static volatile T instance", gotcha: "Without volatile, the JIT can make the reference visible BEFORE the constructor completes. Non-volatile DCL is broken and was deployed in millions of Java programs." },

  { id: "r68", category: "Pitfalls", color: "var(--gold)", title: "ThreadLocal Memory Leak",
    oneliner: "Thread-pool threads never die. ThreadLocal.set() without remove() in a finally block leaks values forever. In web containers, can prevent ClassLoader GC on redeployment.",
    key: "ThreadLocal.remove() in finally", gotcha: "The ThreadLocal variable going out of scope does NOT GC the value. The value is held by the Thread object, not the ThreadLocal reference." },

  { id: "r69", category: "Modern Java", color: "#A78BFA", title: "Structured Concurrency",
    oneliner: "StructuredTaskScope (Java 21+): fork N tasks, scope exit guarantees all cancelled. ShutdownOnFailure — cancel all if any fails. ShutdownOnSuccess — cancel all on first success.",
    key: "StructuredTaskScope.ShutdownOnFailure / ShutdownOnSuccess", gotcha: "subtask.get() can only be called AFTER scope.join() — calling it before throws IllegalStateException." },

  { id: "r70", category: "Patterns", color: "#34D399", title: "Balking Pattern",
    oneliner: "A method returns immediately if the object is not in the right state instead of blocking. 'Already initialized' → return. Atomic check+change required.",
    key: "synchronized { if (done) return; done = true; }", gotcha: "Non-atomic guard check is a race condition. Both check AND state change must be under the same lock." },

  { id: "r71", category: "Java Memory Model", color: "#F472B6", title: "Happens-Before Rules",
    oneliner: "JMM visibility guarantee: A HB B → all effects of A visible to B. Key rules: unlock HB lock, volatile write HB volatile read, Thread.start() HB started thread body, Thread.join() HB caller.",
    key: "volatile / synchronized / start() / join() / final field", gotcha: "HB ≠ wall-clock time. T1 writes at 100ms and T2 reads at 200ms — NOT guaranteed visible without a HB edge." },

  // ── New Java API ──────────────────────────────────────────────────────────
  { id: "r72", category: "Collections", color: "var(--blue)", title: "CopyOnWriteArrayList",
    oneliner: "Lock-free reads on a snapshot. Every mutation copies the entire array. Use for read-heavy listener lists that change rarely.",
    key: "CopyOnWriteArrayList / CopyOnWriteArraySet", gotcha: "O(N) per write — never use for write-heavy lists. Iterator is a snapshot — it NEVER throws ConcurrentModificationException but may be stale." },

  { id: "r73", category: "Executors", color: "var(--red)", title: "ForkJoinPool (Direct)",
    oneliner: "Work-stealing pool for divide-and-conquer. All parallel streams share commonPool(). Use a custom pool for batch jobs to avoid starving parallel streams.",
    key: "new ForkJoinPool(N) — isolate from commonPool()", gotcha: "Blocking inside ForkJoinPool without ManagedBlocker reduces parallelism. I/O work belongs in a regular ThreadPoolExecutor, not ForkJoinPool." },

  { id: "r74", category: "Executors", color: "var(--red)", title: "ScheduledExecutorService",
    oneliner: "Replacement for Timer. schedule() for one-shot, scheduleAtFixedRate() for fixed tick, scheduleWithFixedDelay() for fixed cooldown between runs.",
    key: "Executors.newScheduledThreadPool(N)", gotcha: "Uncaught exception in a periodic task SILENTLY CANCELS future executions. Always wrap task body in try-catch." },

  { id: "r75", category: "Atomics", color: "var(--gold)", title: "VarHandle (Java 9+)",
    oneliner: "Direct field-level atomic operations without wrapper object. Plain, opaque, acquire/release, volatile access modes. Replaces sun.misc.Unsafe safely.",
    key: "MethodHandles.lookup().findVarHandle(clazz, field, type)", gotcha: "Acquire/Release is WEAKER than full volatile — one-sided barrier. Use full volatile for cross-thread visibility without a lock." },

  { id: "r76", category: "Thread API", color: "var(--blue)", title: "Thread.Builder (Java 21+)",
    oneliner: "Fluent API for creating platform and virtual threads with names, daemon flag, stack size, and exception handler. Thread.ofVirtual().name('prefix-', 0).factory() for ExecutorService.",
    key: "Thread.ofVirtual().name('worker-', 0).start(task)", gotcha: "Thread.Builder is NOT reusable — each call to start() or unstarted() consumes the builder configuration. Create a factory() for reuse." },

  // ── New Patterns ─────────────────────────────────────────────────────────
  { id: "r77", category: "Patterns", color: "#34D399", title: "Active Object Pattern",
    oneliner: "Decouple method invocation from execution. Caller gets a Future; dedicated scheduler thread runs the servant. Actor-model for Java.",
    key: "ExecutorService + single thread + Callable + Future", gotcha: "The proxy must be thread-safe (multiple callers); the servant does NOT need to be (only called by scheduler thread)." },

  { id: "r78", category: "Patterns", color: "#34D399", title: "Half-Sync/Half-Async",
    oneliner: "Async layer handles I/O events (non-blocking); sync layer processes in a thread pool (blocking). A queue decouples them. Foundation of Tomcat, Netty, and every Java web server.",
    key: "NIO acceptor + BlockingQueue + ThreadPoolExecutor", gotcha: "Queue growing = sync workers are the bottleneck. Monitor queue.size() in production — it's your throughput canary." },

  // ── New Problems ──────────────────────────────────────────────────────────
  { id: "r79", category: "Problems", color: "var(--ink-1)", title: "FizzBuzz Multithreaded",
    oneliner: "Four threads: number(), fizz(), buzz(), fizzbuzz(). Controller thread determines routing via 4 semaphores. Each specialist acquires its semaphore, prints, releases the controller.",
    key: "4 Semaphores: numSem(1), fizzSem(0), buzzSem(0), fizzBuzzSem(0)", gotcha: "Loop iteration counts must be exact — off-by-one causes a thread to block forever on acquire()." },

  { id: "r80", category: "Problems", color: "var(--ink-1)", title: "Thread-Safe Singleton",
    oneliner: "Best: Initialization-on-Demand Holder (inner static class — free safe publication via class loading). DCL requires volatile. Enum singleton handles serialization.",
    key: "private static class Holder { static final T INSTANCE = new T(); }", gotcha: "Non-volatile DCL is broken. Interned String literals as locks are global — synchronized('lock') shares with all classes using the same literal." },

  { id: "r81", category: "Problems", color: "var(--ink-1)", title: "Concurrent LRU Cache",
    oneliner: "LinkedHashMap(cap, 0.75, true) with overridden removeEldestEntry() + synchronizedMap. O(1) get/put. Production: Caffeine (W-TinyLFU, lock-free reads).",
    key: "new LinkedHashMap<>(cap, 0.75f, true) { removeEldestEntry }", gotcha: "get() on LRU cache modifies access ORDER — needs write lock, not read lock in RWLock version." },

  { id: "r82", category: "Problems", color: "var(--ink-1)", title: "Rate Limiter (Token Bucket)",
    oneliner: "Semaphore(N) as token bucket. ScheduledExecutorService releases permits periodically. Non-blocking: tryAcquire() returns false if no tokens.",
    key: "Semaphore(N) + scheduleAtFixedRate(release, intervalMs)", gotcha: "Fixed-window rate limiters allow 2x burst at window boundaries. Token Bucket distributes evenly. Production: Guava RateLimiter." },

  { id: "r83", category: "Problems", color: "var(--ink-1)", title: "Treiber Stack (Lock-Free)",
    oneliner: "Lock-free stack using AtomicReference<Node> + CAS loop. push: newNode.next=head; CAS(head, oldHead, newNode). pop: CAS(head, oldHead, oldHead.next).",
    key: "AtomicReference.compareAndSet(expected, newHead)", gotcha: "ABA problem: same reference ≠ same logical state. Fix: AtomicStampedReference. Under high contention, CAS loops spin = same as a spin lock." },

  // ── Misc ───────────────────────────────────────────────────────────────
  { id: "r27", category: "Misc", color: "var(--ink-3)", title: "ThreadLocal",
    oneliner: "Per-thread copy of a variable. No synchronization needed. Common use: SimpleDateFormat, DB connections.",
    key: "ThreadLocal.withInitial(() -> ...)", gotcha: "In thread pools: always remove() in finally — stale values leak to the next task." },

  { id: "r28", category: "Misc", color: "var(--ink-3)", title: "ForkJoinPool",
    oneliner: "Work-stealing pool for recursive divide-and-conquer. RecursiveTask<V> for results.",
    key: "ForkJoinPool.commonPool().invoke(task)", gotcha: "NOT for I/O-bound tasks — use a dedicated thread pool. Overhead kills small datasets." },
];

const CATEGORIES = [
  "All",
  "Thread API", "Types of Threads", "Inter-Thread Comm", "Fundamentals",
  "Synchronization", "Locking", "Types of Locking",
  "Pitfalls", "Performance",
  "Executors", "Futures", "Synchronizers",
  "Queues", "Collections", "Atomics", "Locks",
  "Virtual Threads", "Misc",
  "Modern Java", "Java Memory Model", "Patterns", "Problems",
];

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
