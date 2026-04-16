export const PROBLEMS = [
  {
    id: "print-in-order",
    title: "Print in Order",
    subtitle: "LeetCode 1114",
    difficulty: "Easy",
    difficultyColor: "var(--green)",
    tags: ["semaphore", "CountDownLatch", "ordering"],
    description:
      "Three methods first(), second(), third() are called by three different threads (in any order). Ensure first() always prints before second(), and second() always before third().",
    approach:
      "Use two Semaphores (or CountDownLatches) as gates: second() waits until first() releases its gate; third() waits until second() releases its gate.",
    solution: `import java.util.concurrent.*;

class Foo {
    private final Semaphore s1 = new Semaphore(0); // gate before second()
    private final Semaphore s2 = new Semaphore(0); // gate before third()

    public void first(Runnable printFirst) throws InterruptedException {
        printFirst.run();   // print "first"
        s1.release();       // open gate for second()
    }

    public void second(Runnable printSecond) throws InterruptedException {
        s1.acquire();       // wait for first()
        printSecond.run();  // print "second"
        s2.release();       // open gate for third()
    }

    public void third(Runnable printThird) throws InterruptedException {
        s2.acquire();       // wait for second()
        printThird.run();   // print "third"
    }
}

// Alternative with CountDownLatch
class FooLatch {
    private final CountDownLatch latch1 = new CountDownLatch(1);
    private final CountDownLatch latch2 = new CountDownLatch(1);

    public void first(Runnable printFirst) throws InterruptedException {
        printFirst.run();
        latch1.countDown();
    }

    public void second(Runnable printSecond) throws InterruptedException {
        latch1.await();
        printSecond.run();
        latch2.countDown();
    }

    public void third(Runnable printThird) throws InterruptedException {
        latch2.await();
        printThird.run();
    }
}`,
    lessons: [
      "Semaphore(0) is a gate that starts CLOSED — acquire() blocks until someone calls release(). Perfect for 'wait until an event happens'.",
      "CountDownLatch(1) achieves the same gate semantics. The difference: Semaphore can be released multiple times; CountDownLatch is one-shot and fires when count hits 0.",
      "The key insight: ordering between threads is just 'A must complete before B can start' — model it as a gate that A opens and B waits on.",
      "Thumb rule: N-step ordering → N-1 gates (one between each adjacent pair of steps).",
    ],
    hiddenTruths: [
      "Semaphore.release() does NOT check if you've acquired — any thread can release any number of times. You can over-release a Semaphore, growing its permits beyond the initial count. This is a bug if unintentional.",
      "CountDownLatch fired (count == 0) is permanent — any future await() returns immediately. Semaphore permits are consumed — acquire() after release still works but blocks if none are left.",
    ],
  },

  {
    id: "print-foobar",
    title: "Print FooBar Alternately",
    subtitle: "LeetCode 1115",
    difficulty: "Medium",
    difficultyColor: "var(--gold)",
    tags: ["semaphore", "alternation", "two threads"],
    description:
      "Two threads share the same Foo instance: thread A calls foo() n times, thread B calls bar() n times. Ensure the output is foobarfoobar... n times.",
    approach:
      "Two semaphores acting as a toggle: fooSem starts with 1 permit (foo can go first), barSem starts with 0. After foo() runs, release barSem; after bar() runs, release fooSem.",
    solution: `import java.util.concurrent.*;

class FooBar {
    private final int n;
    private final Semaphore fooSem = new Semaphore(1); // foo goes first
    private final Semaphore barSem = new Semaphore(0);

    public FooBar(int n) { this.n = n; }

    public void foo(Runnable printFoo) throws InterruptedException {
        for (int i = 0; i < n; i++) {
            fooSem.acquire();      // wait for our turn
            printFoo.run();        // print "foo"
            barSem.release();      // signal bar
        }
    }

    public void bar(Runnable printBar) throws InterruptedException {
        for (int i = 0; i < n; i++) {
            barSem.acquire();      // wait for foo to finish
            printBar.run();        // print "bar"
            fooSem.release();      // signal foo
        }
    }
}

// Alternative with synchronized + wait/notify
class FooBarSync {
    private final int n;
    private boolean fooTurn = true;

    public FooBarSync(int n) { this.n = n; }

    public synchronized void foo(Runnable printFoo) throws InterruptedException {
        for (int i = 0; i < n; i++) {
            while (!fooTurn) wait();
            printFoo.run();
            fooTurn = false;
            notifyAll();
        }
    }

    public synchronized void bar(Runnable printBar) throws InterruptedException {
        for (int i = 0; i < n; i++) {
            while (fooTurn) wait();
            printBar.run();
            fooTurn = true;
            notifyAll();
        }
    }
}`,
    lessons: [
      "Two mutually exclusive alternating threads → two Semaphores as a toggle (one starts at 1, the other at 0)",
      "The Semaphore ping-pong pattern generalizes: for N mutually exclusive steps, use N Semaphores in a ring",
      "synchronized + boolean flag works but notifyAll() wakes both threads every iteration — Semaphores are more targeted",
      "Thumb rule: alternation between N threads = N semaphores in a ring, each thread acquires one and releases the next",
    ],
    hiddenTruths: [
      "Two Semaphores as a toggle creates an elegant ping-pong without any shared mutable state or conditions — just permit passing.",
      "The synchronized + notifyAll() approach works but has a 'thundering herd' cost for every iteration. Under N threads this becomes O(N) lock operations per step. Semaphores are O(1).",
    ],
  },

  {
    id: "print-zero-even-odd",
    title: "Print Zero Even Odd",
    subtitle: "LeetCode 1116",
    difficulty: "Medium",
    difficultyColor: "var(--gold)",
    tags: ["semaphore", "three threads", "interleaving"],
    description:
      "Three threads share an instance: zero() prints 0s, even() prints even numbers, odd() prints odd numbers. Output must be: 0102030405... up to n.",
    approach:
      "Three semaphores: zeroSem(1), oddSem(0), evenSem(0). zero() always runs first, then signals odd or even based on the counter value.",
    solution: `import java.util.concurrent.*;

class ZeroEvenOdd {
    private final int n;
    private final Semaphore zeroSem = new Semaphore(1); // zero goes first
    private final Semaphore oddSem  = new Semaphore(0);
    private final Semaphore evenSem = new Semaphore(0);

    public ZeroEvenOdd(int n) { this.n = n; }

    // Thread 1: prints zeros
    public void zero(IntConsumer printNumber) throws InterruptedException {
        for (int i = 1; i <= n; i++) {
            zeroSem.acquire();
            printNumber.accept(0);
            if (i % 2 == 1) oddSem.release();   // next is odd
            else             evenSem.release();  // next is even
        }
    }

    // Thread 2: prints odd numbers
    public void odd(IntConsumer printNumber) throws InterruptedException {
        for (int i = 1; i <= n; i += 2) {
            oddSem.acquire();
            printNumber.accept(i);
            zeroSem.release(); // let zero print next separator
        }
    }

    // Thread 3: prints even numbers
    public void even(IntConsumer printNumber) throws InterruptedException {
        for (int i = 2; i <= n; i += 2) {
            evenSem.acquire();
            printNumber.accept(i);
            zeroSem.release(); // let zero print next separator
        }
    }
}`,
    lessons: [
      "Three-semaphore coordination: one thread is the 'controller' (zero) that dispatches to two workers",
      "Initial permit counts encode the execution order: zeroSem(1) means zero goes first; oddSem/evenSem(0) means they wait",
      "Each 'handoff' has exactly one acquire and one release — tracing the permit flow is the key to getting semaphore problems right",
      "Interleaved output problems (0102030...) require the controller to alternate which worker it wakes",
    ],
    hiddenTruths: [
      "If n is even, even() iterates n/2 times; odd() iterates (n+1)/2 times. zero() iterates n times. The loop bounds must be exact — an off-by-one causes a thread to block forever waiting for a permit that will never come.",
      "If zero() releases a permit to oddSem but odd() is not yet alive, the permit is stored. Semaphores don't care about thread creation order — they're permit counters, not signals.",
      "A common mistake: releasing zeroSem inside even/odd before the number is printed. The order matters — acquire, print, release — to guarantee interleaved output.",
    ],
  },

  {
    id: "bounded-blocking-queue",
    title: "Bounded Blocking Queue",
    subtitle: "LeetCode 1188",
    difficulty: "Medium",
    difficultyColor: "var(--gold)",
    tags: ["semaphore", "blocking queue", "design"],
    description:
      "Implement a thread-safe bounded blocking queue. enqueue() blocks if the queue is full; dequeue() blocks if the queue is empty.",
    approach:
      "Two semaphores: emptyCount (initialized to capacity) controls how many items can be added; fillCount (initialized to 0) controls how many can be removed. A mutex protects the underlying queue.",
    solution: `import java.util.concurrent.*;

class BoundedBlockingQueue {
    private final Queue<Integer> queue = new LinkedList<>();
    private final Semaphore emptyCount; // counts available empty slots
    private final Semaphore fillCount;  // counts available filled slots
    private final Semaphore mutex = new Semaphore(1); // mutual exclusion for queue ops

    public BoundedBlockingQueue(int capacity) {
        this.emptyCount = new Semaphore(capacity);
        this.fillCount  = new Semaphore(0);
    }

    public void enqueue(int element) throws InterruptedException {
        emptyCount.acquire(); // wait for an empty slot
        mutex.acquire();      // exclusive access to queue
        queue.add(element);
        mutex.release();
        fillCount.release();  // signal that a filled slot is available
    }

    public int dequeue() throws InterruptedException {
        fillCount.acquire();  // wait for a filled slot
        mutex.acquire();      // exclusive access to queue
        int val = queue.poll();
        mutex.release();
        emptyCount.release(); // signal that an empty slot is available
        return val;
    }

    public int size() {
        return queue.size();
    }
}

// Simpler version using ReentrantLock + Conditions (more idiomatic Java)
class BoundedBlockingQueue2 {
    private final LinkedList<Integer> list = new LinkedList<>();
    private final int capacity;
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notFull  = lock.newCondition();
    private final Condition notEmpty = lock.newCondition();

    public BoundedBlockingQueue2(int capacity) { this.capacity = capacity; }

    public void enqueue(int element) throws InterruptedException {
        lock.lock();
        try {
            while (list.size() == capacity) notFull.await();
            list.addLast(element);
            notEmpty.signal();
        } finally { lock.unlock(); }
    }

    public int dequeue() throws InterruptedException {
        lock.lock();
        try {
            while (list.isEmpty()) notEmpty.await();
            int val = list.removeFirst();
            notFull.signal();
            return val;
        } finally { lock.unlock(); }
    }
}`,
    lessons: [
      "Two-semaphore design (emptyCount + fillCount) is the classic pattern for bounded producer-consumer without busy-waiting",
      "The mutex (Semaphore(1)) protects the non-thread-safe underlying queue — only acquired AFTER the capacity semaphore to prevent deadlock",
      "ReentrantLock + two Conditions (notFull, notEmpty) is the more idiomatic Java solution and avoids the mutex semaphore entirely",
      "BlockingQueue (LinkedBlockingQueue) is the production answer — this problem teaches the primitives that BlockingQueue uses internally",
    ],
    hiddenTruths: [
      "Acquiring emptyCount BEFORE mutex prevents a deadlock where enqueue holds the mutex and waits for emptyCount while dequeue holds emptyCount and waits for the mutex.",
      "Using Semaphore(1) as a mutex is a valid pattern but lacks owner semantics — any thread can release it. ReentrantLock is safer because only the acquiring thread can release.",
      "The size() method in the Semaphore version is NOT thread-safe — it reads queue.size() without holding the mutex. A correct implementation would need mutex.acquire() around the size check.",
      "Java's LinkedBlockingQueue internally uses exactly this two-lock design (separate putLock and takeLock) — this problem is essentially implementing a simplified version of what's in the JDK.",
    ],
  },

  {
    id: "dining-philosophers",
    title: "Dining Philosophers",
    subtitle: "LeetCode 1226",
    difficulty: "Medium",
    difficultyColor: "var(--gold)",
    tags: ["deadlock prevention", "semaphore", "philosophers"],
    description:
      "Five philosophers sit at a table with five forks. Each needs two adjacent forks to eat. Design wantsToEat() such that no philosopher starves and there is no deadlock.",
    approach:
      "Use a Semaphore per fork (permits=1) and a global Semaphore(4) to ensure at most 4 philosophers try to pick up forks simultaneously — this prevents circular wait.",
    solution: `import java.util.concurrent.*;

class DiningPhilosophers {
    // One semaphore per fork — permits=1 (only one philosopher can hold it)
    private final Semaphore[] forks = {
        new Semaphore(1), new Semaphore(1), new Semaphore(1),
        new Semaphore(1), new Semaphore(1)
    };
    // Allow at most 4 philosophers to try picking up forks at once
    // This breaks circular wait — one slot is always available to complete
    private final Semaphore limit = new Semaphore(4);

    public void wantsToEat(int philosopher,
                           Runnable pickLeftFork,
                           Runnable pickRightFork,
                           Runnable eat,
                           Runnable putLeftFork,
                           Runnable putRightFork) throws InterruptedException {

        int leftFork  = philosopher;
        int rightFork = (philosopher + 1) % 5;

        limit.acquire();              // at most 4 philosophers try simultaneously

        forks[leftFork].acquire();    // pick up left fork
        pickLeftFork.run();

        forks[rightFork].acquire();   // pick up right fork
        pickRightFork.run();

        eat.run();                    // eat

        putLeftFork.run();
        forks[leftFork].release();    // put down left fork

        putRightFork.run();
        forks[rightFork].release();   // put down right fork

        limit.release();              // free the slot
    }
}

// Alternative: lock ordering (always pick lower-numbered fork first)
class DiningPhilosophersOrdering {
    private final Semaphore[] forks = new Semaphore[5];
    { for (int i = 0; i < 5; i++) forks[i] = new Semaphore(1); }

    public void wantsToEat(int p, Runnable pickLeft, Runnable pickRight,
                           Runnable eat, Runnable putLeft, Runnable putRight)
            throws InterruptedException {
        int left  = p;
        int right = (p + 1) % 5;
        // Always pick lower-numbered fork first (breaks circular dependency)
        int first  = Math.min(left, right);
        int second = Math.max(left, right);

        forks[first].acquire();
        forks[second].acquire();
        (first == left ? pickLeft : pickRight).run();
        (second == left ? pickLeft : pickRight).run();
        eat.run();
        putLeft.run();  forks[left].release();
        putRight.run(); forks[right].release();
    }
}`,
    lessons: [
      "Circular wait is the core deadlock condition — break it with N-1 limit semaphore or global lock ordering",
      "Semaphore(N-1) limit trick: allowing at most N-1 philosophers to compete guarantees at least one can always complete and release",
      "Lock ordering (always take lower-numbered fork first) is a general deadlock prevention strategy for any multi-lock scenario",
      "Thumb rule: if you must acquire multiple locks, sort them by a consistent global order (ID, hash) before acquiring",
    ],
    hiddenTruths: [
      "Without the limit semaphore, all 5 philosophers picking up their left fork simultaneously creates a deadlock — all hold one fork and wait for the next. This is the textbook circular-wait condition.",
      "The Semaphore(N-1) trick works for ANY 'all participants need 2 adjacent resources from a ring' problem — it's not specific to dining philosophers.",
    ],
  },

  {
    id: "readers-writers",
    title: "Readers-Writers Problem",
    subtitle: "Classic Concurrency Problem",
    difficulty: "Hard",
    difficultyColor: "var(--red)",
    tags: ["readers-writers", "read-write lock", "starvation"],
    description:
      "Multiple readers can read a shared resource simultaneously, but a writer needs exclusive access. Implement with no writer starvation: if a writer is waiting, no new readers are admitted.",
    approach:
      "Use a fair ReentrantReadWriteLock. The fair flag ensures that waiting writers prevent new readers from barging in (FIFO ordering), solving writer starvation.",
    solution: `import java.util.concurrent.locks.*;

// Solution 1: ReentrantReadWriteLock (simplest, production-grade)
public class ReadersWriters {
    private final ReentrantReadWriteLock rwLock = new ReentrantReadWriteLock(true); // fair
    private int data = 0;

    public int read() {
        rwLock.readLock().lock();
        try {
            System.out.println(Thread.currentThread().getName() + " reading: " + data);
            return data;
        } finally {
            rwLock.readLock().unlock();
        }
    }

    public void write(int value) {
        rwLock.writeLock().lock();
        try {
            System.out.println(Thread.currentThread().getName() + " writing: " + value);
            data = value;
        } finally {
            rwLock.writeLock().unlock();
        }
    }
}

// Solution 2: Manual implementation (interview explanation)
// Shows the mechanics behind the scenes
public class ReadersWritersManual {
    private int readCount = 0;
    private final Object readCountLock = new Object();
    private final Semaphore resource = new Semaphore(1);  // exclusive for writer
    private final Semaphore mutex    = new Semaphore(1);  // protect readCount

    public void read() throws InterruptedException {
        mutex.acquire();
        readCount++;
        if (readCount == 1) resource.acquire(); // first reader blocks writers
        mutex.release();

        // --- critical section: reading ---
        System.out.println(Thread.currentThread().getName() + " reading");

        mutex.acquire();
        readCount--;
        if (readCount == 0) resource.release(); // last reader releases writers
        mutex.release();
    }

    public void write(int value) throws InterruptedException {
        resource.acquire();  // exclusive access
        // --- critical section: writing ---
        System.out.println(Thread.currentThread().getName() + " writing");
        resource.release();
    }
}`,
    lessons: [
      "Fair ReadWriteLock (new ReentrantReadWriteLock(true)) prevents writer starvation — FIFO ordering means waiting writers block new readers from barging",
      "The manual implementation reveals the core insight: the FIRST reader acquires the write lock; the LAST reader releases it — readers cooperate to block writers",
      "Thumb rule: if reads >> writes and starvation is acceptable → ReentrantReadWriteLock. If writes are frequent → plain ReentrantLock (write-lock overhead isn't worth it)",
      "Writer starvation is the hardest variant: continuously arriving readers never let writers in. Only fair locks or second-reader-limit variants solve this",
    ],
    hiddenTruths: [
      "The manual implementation has writer starvation — if readers arrive continuously, readCount never reaches 0, and writers never get the resource semaphore. The fair ReentrantReadWriteLock avoids this via FIFO ordering.",
      "ReentrantReadWriteLock with fair=true: once a writer is queued, no new readers can acquire the read lock (they queue behind the writer). This is the 'write-preference' variant that eliminates writer starvation.",
    ],
  },

  {
    id: "producer-consumer-classic",
    title: "Classic Producer-Consumer",
    subtitle: "Classic Concurrency Problem",
    difficulty: "Medium",
    difficultyColor: "var(--gold)",
    tags: ["wait/notify", "synchronized", "producer-consumer"],
    description:
      "Implement a thread-safe bounded buffer where producers add items and consumers remove them, using low-level wait/notify (without java.util.concurrent).",
    approach:
      "Use a synchronized bounded buffer with while-loop wait() on both put() and take(). Condition: full → producer waits; empty → consumer waits. Always use notifyAll() for correctness.",
    solutions: [
      {
        title: "Low-Level — synchronized + wait/notifyAll",
        description: "Implements bounded buffer using intrinsic locks and Object.wait/notifyAll. The while-loop guard is mandatory — spurious wakeups are specified in the JVM spec.",
        code: `// Low-level implementation with synchronized + wait/notify
public class BoundedBuffer<T> {
    private final Object[] buffer;
    private int head = 0, tail = 0, count = 0;
    private final int capacity;

    @SuppressWarnings("unchecked")
    public BoundedBuffer(int capacity) {
        this.capacity = capacity;
        this.buffer   = new Object[capacity];
    }

    public synchronized void put(T item) throws InterruptedException {
        while (count == capacity) {   // WHILE not if — guard against spurious wakeups
            wait();                   // releases lock, suspends thread
        }
        buffer[tail] = item;
        tail = (tail + 1) % capacity;
        count++;
        notifyAll();                  // wake all waiting consumers
    }

    @SuppressWarnings("unchecked")
    public synchronized T take() throws InterruptedException {
        while (count == 0) {          // WHILE — recheck after wakeup
            wait();
        }
        T item = (T) buffer[head];
        buffer[head] = null;          // help GC
        head = (head + 1) % capacity;
        count--;
        notifyAll();                  // wake all waiting producers
        return item;
    }

    public synchronized int size() { return count; }
}

// Usage
public class Demo {
    public static void main(String[] args) {
        BoundedBuffer<Integer> buffer = new BoundedBuffer<>(10);

        // Producer
        new Thread(() -> {
            try {
                for (int i = 0; i < 50; i++) {
                    buffer.put(i);
                    System.out.println("Produced: " + i);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }, "producer").start();

        // Consumer
        new Thread(() -> {
            try {
                for (int i = 0; i < 50; i++) {
                    int item = buffer.take();
                    System.out.println("Consumed: " + item);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }, "consumer").start();
    }
}`,
      },
    ],
    lessons: [
      "while (!condition) wait() is mandatory — never if (!condition). Spurious wakeups are specified in the JVM spec.",
      "notifyAll() is safer than notify() when multiple producer/consumer threads share the same lock — notify() may wake the wrong side",
      "The real lesson: this is a teaching exercise. In production, always use LinkedBlockingQueue or ArrayBlockingQueue — they implement this correctly.",
      "Null out consumed slots (buffer[head] = null) to help GC — a subtle but important production detail",
    ],
    hiddenTruths: [
      "Using if() instead of while() for wait() is the most common concurrency bug. Spurious wakeups happen on Linux (POSIX spec allows them). The while loop is required, not just defensive.",
      "notifyAll() after every put() and take() causes O(N) wakeups under many threads. ReentrantLock + separate Conditions (notFull/notEmpty) with signal() is the production-grade fix.",
    ],
  },

  {
    id: "building-h2o",
    title: "Building H2O",
    subtitle: "LeetCode 1117",
    difficulty: "Medium",
    difficultyColor: "var(--gold)",
    tags: ["semaphore", "CyclicBarrier", "ratio"],
    description:
      "Two types of threads: hydrogen and oxygen. Three threads (2H + 1O) must release together to form water. Implement hydrogen() and oxygen() so they output in the correct H2O ratio.",
    approach:
      "Use two Semaphores to control hydrogen (2 per water) and oxygen (1 per water) and a CyclicBarrier(3) to synchronize the three threads before releasing.",
    solution: `import java.util.concurrent.*;

class H2O {
    private final Semaphore hydrogen = new Semaphore(2); // 2 H per water
    private final Semaphore oxygen   = new Semaphore(1); // 1 O per water
    private final CyclicBarrier barrier;

    public H2O() {
        // Barrier action: after all 3 (2H + 1O) arrive, release for next molecule
        barrier = new CyclicBarrier(3, () -> {
            hydrogen.release(2); // refill H slots for next molecule
            oxygen.release(1);   // refill O slot for next molecule
        });
    }

    public void hydrogen(Runnable releaseHydrogen) throws InterruptedException {
        hydrogen.acquire();         // acquire one H slot
        try {
            releaseHydrogen.run();  // bond hydrogen
            barrier.await();       // wait for 2H + 1O to all arrive
        } catch (BrokenBarrierException e) {
            throw new RuntimeException(e);
        }
    }

    public void oxygen(Runnable releaseOxygen) throws InterruptedException {
        oxygen.acquire();           // acquire the O slot
        try {
            releaseOxygen.run();    // bond oxygen
            barrier.await();       // wait for 2H + 1O to all arrive
        } catch (BrokenBarrierException e) {
            throw new RuntimeException(e);
        }
    }
}`,
    lessons: [
      "CyclicBarrier(N, action) is ideal when N threads must rendezvous before any proceeds — the barrier action runs ONCE in the last arriving thread",
      "Semaphore controls admission (how many of each type can enter), CyclicBarrier synchronizes departure (all must arrive before any continues)",
      "CyclicBarrier automatically resets after firing — this is why it works for repeated molecule formation (unlike CountDownLatch which is one-shot)",
      "Thumb rule: use Semaphore for ratio constraints, CyclicBarrier for group synchronization",
    ],
    hiddenTruths: [
      "The CyclicBarrier barrier action runs in the thread that arrived LAST at the barrier. If that thread throws, BrokenBarrierException is thrown in ALL waiting threads. Always handle it.",
      "CyclicBarrier.reset() while threads are waiting throws BrokenBarrierException in those threads. Never reset while active — only in error recovery.",
    ],
  },

  {
    id: "fizzbuzz-multithreaded",
    title: "FizzBuzz Multithreaded",
    subtitle: "LeetCode 1195",
    difficulty: "Medium",
    difficultyColor: "var(--gold)",
    tags: ["semaphore", "four threads", "interleaving", "fizzbuzz"],
    description:
      "Four threads share a FizzBuzz instance: fizz() prints 'Fizz', buzz() prints 'Buzz', fizzbuzz() prints 'FizzBuzz', number() prints the number. Threads must coordinate to produce the standard FizzBuzz output from 1 to n.",
    approach:
      "Four semaphores: one per category (number, fizz, buzz, fizzbuzz). The number() thread runs the loop — it acquires numberSem and releases the correct semaphore based on i % 3 and i % 5. The specialist threads (fizz, buzz, fizzbuzz) acquire their semaphore and release numberSem after printing.",
    solution: `import java.util.concurrent.*;
import java.util.function.IntConsumer;

class FizzBuzz {
    private final int n;
    private final Semaphore numSem    = new Semaphore(1); // number goes first
    private final Semaphore fizzSem   = new Semaphore(0);
    private final Semaphore buzzSem   = new Semaphore(0);
    private final Semaphore fizzBuzzSem = new Semaphore(0);

    public FizzBuzz(int n) { this.n = n; }

    // Controller: determines which thread goes next
    public void number(IntConsumer printNumber) throws InterruptedException {
        for (int i = 1; i <= n; i++) {
            numSem.acquire();
            if      (i % 15 == 0) fizzBuzzSem.release();
            else if (i % 3  == 0) fizzSem.release();
            else if (i % 5  == 0) buzzSem.release();
            else {
                printNumber.accept(i);
                numSem.release(); // number was printed — controller goes again
            }
        }
    }

    public void fizz(Runnable printFizz) throws InterruptedException {
        for (int i = 3; i <= n; i += 3) {
            if (i % 15 == 0) continue; // skip FizzBuzz — handled by fizzbuzz()
            fizzSem.acquire();
            printFizz.run();
            numSem.release();
        }
    }

    public void buzz(Runnable printBuzz) throws InterruptedException {
        for (int i = 5; i <= n; i += 5) {
            if (i % 15 == 0) continue;
            buzzSem.acquire();
            printBuzz.run();
            numSem.release();
        }
    }

    public void fizzbuzz(Runnable printFizzBuzz) throws InterruptedException {
        for (int i = 15; i <= n; i += 15) {
            fizzBuzzSem.acquire();
            printFizzBuzz.run();
            numSem.release();
        }
    }
}`,
    complexity: "Time: O(n) | Space: O(1)",
    lessons: [
      "One 'controller' thread that determines routing is cleaner than having all four threads check the condition independently",
      "The skip pattern in fizz/buzz loops (if i % 15 == 0 continue) avoids acquiring a semaphore that the controller won't release for that i",
      "Each thread's loop bounds must be exact — fizz iterates 3,6,9,...; buzz iterates 5,10,15,... but skips multiples of 15",
      "Four-thread interleaving is a generalization of the three-semaphore pattern — same principle, more cases",
    ],
    hiddenTruths: [
      "The iteration counts must match exactly: fizz() should iterate ⌊n/3⌋ - ⌊n/15⌋ times; buzz() should iterate ⌊n/5⌋ - ⌊n/15⌋ times; fizzbuzz() should iterate ⌊n/15⌋ times. If they don't match, a thread will block forever on its acquire()",
      "A simpler but less efficient approach: have all four threads check i % 3 and i % 5 and use a single shared counter + AtomicInteger. This avoids complex loop bounds but requires volatile or atomic for the counter.",
      "In the skip pattern for fizz/buzz, the 'continue' must happen BEFORE acquire() — if you acquire and then skip, you're consuming a permit that the controller never released for that i.",
    ],
  },

  {
    id: "thread-safe-singleton",
    title: "Thread-Safe Singleton",
    subtitle: "Interview Classic",
    difficulty: "Easy",
    difficultyColor: "var(--green)",
    tags: ["singleton", "DCL", "volatile", "initialization-on-demand", "enum"],
    description:
      "Implement a thread-safe singleton — an object that is created exactly once, lazily, and is safely accessible from multiple threads. Demonstrate at least three approaches: synchronized getInstance(), DCL with volatile, and Initialization-on-Demand Holder.",
    approach:
      "Three valid solutions from simplest (most overhead) to most elegant: (1) synchronized getInstance() — correct but locks on every read, (2) DCL with volatile — correct, read-path lock-free, (3) Initialization-on-Demand Holder — correct, no locking at all, lazily initialized.",
    solutions: [
      {
        title: "Approach 1: synchronized getInstance() — Simple but Slow",
        description: "Every read acquires a lock. Correct but unnecessary overhead after initialization.",
        code: `public class SimpleSingleton {
    private static SimpleSingleton instance;

    private SimpleSingleton() { /* expensive init */ }

    // Every call acquires the class-level lock — even after instance is initialized
    public static synchronized SimpleSingleton getInstance() {
        if (instance == null) {
            instance = new SimpleSingleton();
        }
        return instance;
    }
}`,
      },
      {
        title: "Approach 2: Double-Checked Locking with volatile — Read Lock-Free",
        description: "First check avoids locking on the fast path. volatile prevents constructor/reference reordering.",
        code: `public class DCLSingleton {
    private static volatile DCLSingleton instance; // volatile is REQUIRED

    private DCLSingleton() { /* expensive init */ }

    public static DCLSingleton getInstance() {
        if (instance == null) {              // Check 1: no lock (fast path)
            synchronized (DCLSingleton.class) {
                if (instance == null) {      // Check 2: under lock (slow path)
                    instance = new DCLSingleton();
                }
            }
        }
        return instance;
    }
}`,
      },
      {
        title: "Approach 3: Initialization-on-Demand Holder — Best",
        description: "Lazy initialization via class loading — the JVM class loader is already synchronized. Zero locking overhead on reads.",
        code: `public class HolderSingleton {
    private HolderSingleton() { /* expensive init */ }

    // Inner class is loaded only when getInstance() is first called
    // JVM guarantees class initialization is thread-safe
    private static class Holder {
        static final HolderSingleton INSTANCE = new HolderSingleton();
    }

    public static HolderSingleton getInstance() {
        return Holder.INSTANCE; // no lock, no volatile, lazy, thread-safe
    }
}

// Approach 4: Enum — serialization-safe (Effective Java Item 89)
public enum EnumSingleton {
    INSTANCE;
    public void doWork() { ... }
}
// Usage: EnumSingleton.INSTANCE.doWork()`,
      },
    ],
    complexity: "All approaches: Time O(1) after init | Space O(1)",
    lessons: [
      "Prefer Initialization-on-Demand Holder — it's zero overhead, lazy, and impossible to break",
      "If you use DCL, volatile is NON-OPTIONAL — non-volatile DCL is broken and has been deployed widely",
      "Enum singleton is the only approach that handles Java serialization correctly out of the box",
      "Spring and dependency injection frameworks make singletons easy — raw singletons are an anti-pattern in most modern Java code",
    ],
    hiddenTruths: [
      "Broken DCL (without volatile) 'works' in most JVMs most of the time because the JIT doesn't always reorder. It fails non-deterministically under optimization — the worst kind of bug.",
      "The Initialization-on-Demand Holder works because the JVM specification (JLS §12.4.2) guarantees that class initialization is atomic and happens before any member of the class is accessed.",
      "Enum singleton survives serialization: Java's serialization mechanism guarantees that deserializing an enum constant returns the same JVM instance. A non-enum singleton class returns a NEW instance on deserialization unless readResolve() is implemented.",
      "In multi-classloader environments (OSGi, web containers), each classloader has its own version of the singleton class. Holder.INSTANCE is 'singleton per classloader' — not globally unique. This breaks singleton semantics in plugin systems.",
    ],
  },

  {
    id: "concurrent-lru-cache",
    title: "Concurrent LRU Cache",
    subtitle: "Design Problem",
    difficulty: "Hard",
    difficultyColor: "var(--red)",
    tags: ["LinkedHashMap", "ReentrantReadWriteLock", "ConcurrentHashMap", "LRU", "design"],
    description:
      "Design a thread-safe LRU (Least Recently Used) cache with O(1) get and put operations. The cache has a fixed capacity; when full, it evicts the least recently accessed entry. Must handle concurrent reads and writes efficiently.",
    approach:
      "Two approaches: (1) Synchronized LinkedHashMap — simple, coarse-grained locking, all operations serialized. (2) ConcurrentHashMap + doubly-linked list with fine-grained locking — complex but allows concurrent reads. Most interviews accept approach 1 with a discussion of approach 2's tradeoffs.",
    solutions: [
      {
        title: "Approach 1: LinkedHashMap with synchronized wrapper — Simple, Interview-Accepted",
        description: "LinkedHashMap in access-order mode maintains LRU order automatically. Override removeEldestEntry() for eviction. Synchronize all operations with a single lock.",
        code: `import java.util.*;

public class LRUCache<K, V> {
    private final int capacity;
    private final Map<K, V> cache;

    public LRUCache(int capacity) {
        this.capacity = capacity;
        // true = access order (most recently accessed at tail)
        this.cache = Collections.synchronizedMap(
            new LinkedHashMap<K, V>(capacity, 0.75f, true) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
                    return size() > capacity; // evict oldest on overflow
                }
            }
        );
    }

    public V get(K key) {
        return cache.getOrDefault(key, null); // access-order: moves to tail
    }

    public void put(K key, V value) {
        cache.put(key, value); // access-order: new entries at tail; evict head if over capacity
    }
}

// NOTE: Collections.synchronizedMap wraps each operation in a synchronized block
// BUT compound operations (check size + evict + put) are NOT atomic without external lock
// For production: see approach 2 or use Caffeine/Guava cache`,
      },
      {
        title: "Approach 2: ReentrantReadWriteLock — Better Read Concurrency",
        description: "Allow concurrent reads (no eviction check needed on get), serialize writes with a write lock. Manual doubly-linked list + HashMap for O(1) both operations.",
        code: `import java.util.concurrent.locks.*;
import java.util.*;

public class ConcurrentLRUCache<K, V> {
    private final int capacity;
    private final Map<K, Node<K,V>> map = new HashMap<>();
    private final Node<K,V> head = new Node<>(null, null); // sentinel head (LRU)
    private final Node<K,V> tail = new Node<>(null, null); // sentinel tail (MRU)
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();

    public ConcurrentLRUCache(int capacity) {
        this.capacity = capacity;
        head.next = tail;
        tail.prev = head;
    }

    public V get(K key) {
        lock.writeLock().lock(); // write lock: get modifies order
        try {
            Node<K,V> node = map.get(key);
            if (node == null) return null;
            moveToTail(node); // most recently used
            return node.value;
        } finally { lock.writeLock().unlock(); }
    }

    public void put(K key, V value) {
        lock.writeLock().lock();
        try {
            if (map.containsKey(key)) {
                Node<K,V> node = map.get(key);
                node.value = value;
                moveToTail(node);
            } else {
                if (map.size() == capacity) {
                    Node<K,V> lru = head.next; // LRU is just after head sentinel
                    removeNode(lru);
                    map.remove(lru.key);
                }
                Node<K,V> newNode = new Node<>(key, value);
                addToTail(newNode);
                map.put(key, newNode);
            }
        } finally { lock.writeLock().unlock(); }
    }

    private void removeNode(Node<K,V> n) {
        n.prev.next = n.next;
        n.next.prev = n.prev;
    }
    private void addToTail(Node<K,V> n) {
        n.prev = tail.prev;
        n.next = tail;
        tail.prev.next = n;
        tail.prev = n;
    }
    private void moveToTail(Node<K,V> n) { removeNode(n); addToTail(n); }

    static class Node<K,V> {
        K key; V value; Node<K,V> prev, next;
        Node(K k, V v) { key=k; value=v; }
    }
}`,
      },
    ],
    complexity: "Both: get O(1), put O(1) amortized | Space O(capacity)",
    lessons: [
      "LinkedHashMap(capacity, 0.75, true) with overridden removeEldestEntry() is the simplest LRU implementation — use it unless performance demands otherwise",
      "get() must also acquire a write lock in the RWLock version because it modifies the access order (moves node to tail)",
      "Production caches use segment-locking (Caffeine) or lock-free algorithms — the interview version is a starting point",
      "Always discuss the read/write lock tradeoff: does get() need a write lock? Yes — it modifies the linked list order",
    ],
    hiddenTruths: [
      "LinkedHashMap maintains order via a doubly-linked list internally. The 'access order' mode (third constructor argument = true) moves the accessed entry to the tail on every get() and put(). This is the LRU order maintenance — O(1) per operation.",
      "Collections.synchronizedMap's iterator still requires external synchronization. If you iterate the LRU cache (e.g., for eviction inspection), you must hold the synchronizedMap's lock: synchronized(cache) { iterator = cache.entrySet().iterator() }.",
      "Caffeine cache (the modern successor to Guava Cache) uses a W-TinyLFU admission policy and a ring buffer for recording accesses — avoiding synchronization on reads entirely. For production caches, Caffeine is orders of magnitude more scalable than any manually-synchronized LinkedHashMap.",
      "This problem exposes a subtle issue: in the RWLock version, get() logically reads but physically WRITES (modifies the linked list). This means get() needs the write lock, not the read lock — eliminating most of the benefit of using a read-write lock. This is why ConcurrentLinkedHashMap is hard to implement correctly.",
    ],
  },

  {
    id: "rate-limiter-concurrent",
    title: "Concurrent Rate Limiter (Token Bucket)",
    subtitle: "Design Problem",
    difficulty: "Medium",
    difficultyColor: "var(--gold)",
    tags: ["token bucket", "Semaphore", "AtomicLong", "rate limiting", "design"],
    description:
      "Design a thread-safe rate limiter that allows at most N requests per second. Multiple threads call allow() concurrently. Design the Token Bucket algorithm: tokens are added at a fixed rate, and each request consumes a token. If no tokens are available, the request is rejected or blocked.",
    approach:
      "Two approaches: (1) Semaphore-based: use a Semaphore(N) and a ScheduledExecutorService to release permits periodically. (2) AtomicLong + timestamp: track last refill time and current token count atomically — no background thread needed.",
    solutions: [
      {
        title: "Approach 1: Semaphore + ScheduledExecutor — Simple Non-Blocking",
        description: "ScheduledExecutorService releases a token permit every 1/N seconds. Clients call tryAcquire() — non-blocking rejection if no tokens.",
        code: `import java.util.concurrent.*;

public class TokenBucketRateLimiter {
    private final Semaphore tokens;
    private final ScheduledExecutorService refiller;
    private final int maxTokens;

    public TokenBucketRateLimiter(int permitsPerSecond, int burstCapacity) {
        this.maxTokens = burstCapacity;
        this.tokens    = new Semaphore(burstCapacity);

        // Release one permit every (1000/permitsPerSecond) ms
        long intervalMs = 1000L / permitsPerSecond;
        this.refiller = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "rate-limiter-refiller");
            t.setDaemon(true);
            return t;
        });
        this.refiller.scheduleAtFixedRate(() -> {
            int available = tokens.availablePermits();
            if (available < maxTokens) {
                tokens.release(1); // add one token (up to burst capacity)
            }
        }, 0, intervalMs, TimeUnit.MILLISECONDS);
    }

    // Non-blocking: returns true if token available, false if rate limit exceeded
    public boolean tryAcquire() {
        return tokens.tryAcquire();
    }

    // Blocking: waits up to timeoutMs for a token
    public boolean tryAcquire(long timeoutMs) throws InterruptedException {
        return tokens.tryAcquire(timeoutMs, TimeUnit.MILLISECONDS);
    }

    public void shutdown() {
        refiller.shutdown();
    }
}`,
      },
      {
        title: "Approach 2: AtomicLong + Timestamp — No Background Thread",
        description: "CAS-based token bucket. Lazy refill: calculate how many tokens to add since last refill on every tryAcquire() call. No scheduler needed — simpler and more precise.",
        code: `import java.util.concurrent.atomic.*;

public class AtomicRateLimiter {
    private final long maxTokens;
    private final long refillRateNanos; // nanoseconds per token
    private final AtomicLong tokens;
    private final AtomicLong lastRefillTime;

    public AtomicRateLimiter(long permitsPerSecond, long burstCapacity) {
        this.maxTokens       = burstCapacity;
        this.refillRateNanos = 1_000_000_000L / permitsPerSecond;
        this.tokens          = new AtomicLong(burstCapacity);
        this.lastRefillTime  = new AtomicLong(System.nanoTime());
    }

    public boolean tryAcquire() {
        refill(); // lazy refill on every call
        // CAS loop: atomically decrement if tokens > 0
        long current;
        do {
            current = tokens.get();
            if (current <= 0) return false; // no tokens — reject
        } while (!tokens.compareAndSet(current, current - 1));
        return true;
    }

    private void refill() {
        long now         = System.nanoTime();
        long lastRefill  = lastRefillTime.get();
        long elapsed     = now - lastRefill;
        long tokensToAdd = elapsed / refillRateNanos;

        if (tokensToAdd > 0) {
            // Try to update lastRefillTime — only one thread should do the refill
            if (lastRefillTime.compareAndSet(lastRefill, lastRefill + tokensToAdd * refillRateNanos)) {
                long newTokens = Math.min(maxTokens, tokens.get() + tokensToAdd);
                tokens.set(newTokens);
            }
        }
    }
}`,
      },
    ],
    complexity: "tryAcquire(): O(1) | Space: O(1)",
    lessons: [
      "Token Bucket allows burst up to burstCapacity then limits to the steady-state rate — distinguishes from fixed-window counters",
      "Lazy refill (compute tokens-to-add on each acquire) avoids a background thread and is more accurate under low traffic",
      "AtomicLong + CAS is lock-free — no thread can block another in tryAcquire()",
      "Semaphore-based approach is simpler but the background refiller thread has scheduling jitter",
    ],
    hiddenTruths: [
      "Semaphore.availablePermits() is NOT guaranteed accurate — it may be stale by the time you act on it. The check-then-release in the refiller is NOT atomic. Multiple refiller ticks could add more than one permit if the timer fires faster than expected. Cap the permits explicitly.",
      "The AtomicLong approach has a subtle issue: between refill() and the CAS decrement, another thread could drain the tokens. The CAS loop handles this correctly — it retries if the value changed. But the refill itself uses its own CAS to ensure only one thread adds tokens for a given time window.",
      "Guava's RateLimiter.create(N) implements a smooth token bucket with warmup support. It uses synchronization internally but is highly optimized and handles burst/starvation correctly. In production, prefer Guava or Resilience4j over a hand-rolled implementation.",
      "Fixed-window rate limiters (count requests in a 1-second window, reset at T=0) have a 2x burst problem: N requests at T=0.9s and N requests at T=1.1s both pass within a 2-second span. Token Bucket avoids this by smoothing the rate over time.",
    ],
  },

  {
    id: "concurrent-stack",
    title: "Concurrent Stack (Treiber Stack)",
    subtitle: "Lock-Free Design Problem",
    difficulty: "Hard",
    difficultyColor: "var(--red)",
    tags: ["lock-free", "CAS", "AtomicReference", "Treiber stack", "ABA problem"],
    description:
      "Implement a lock-free thread-safe stack using AtomicReference and Compare-And-Set (CAS). The Treiber Stack is the classic lock-free stack algorithm. Discuss the ABA problem and how to handle it.",
    approach:
      "Maintain a head reference as an AtomicReference<Node>. push() creates a new node and CAS-es the head from the old head to the new node. pop() reads the head, reads next, and CAS-es from head to next. If the CAS fails (another thread modified head), retry.",
    solutions: [
      {
        title: "Treiber Stack — Lock-Free with AtomicReference",
        description: "CAS loop for both push and pop. If any other thread modifies the head between our read and our CAS, the CAS fails and we retry.",
        code: `import java.util.concurrent.atomic.*;

public class TreiberStack<T> {
    private final AtomicReference<Node<T>> head = new AtomicReference<>(null);

    public void push(T value) {
        Node<T> newHead = new Node<>(value);
        Node<T> oldHead;
        do {
            oldHead = head.get();          // read current head
            newHead.next = oldHead;        // point new node to current head
        } while (!head.compareAndSet(oldHead, newHead)); // CAS: set head to newHead
        // CAS fails if another thread changed head between get() and compareAndSet()
        // In that case, loop retries with the updated head
    }

    public T pop() {
        Node<T> oldHead;
        Node<T> newHead;
        do {
            oldHead = head.get();
            if (oldHead == null) return null; // empty stack
            newHead = oldHead.next;
        } while (!head.compareAndSet(oldHead, newHead)); // CAS: advance head
        return oldHead.value;
    }

    public T peek() {
        Node<T> top = head.get();
        return top == null ? null : top.value;
    }

    private static class Node<T> {
        final T value;
        Node<T> next;
        Node(T v) { this.value = v; }
    }
}`,
      },
      {
        title: "ABA Problem and the Fix: AtomicStampedReference",
        description: "The ABA problem: Thread 1 reads head=A. Thread 2 pops A, pushes B, pushes A (new A object). Thread 1's CAS sees head=A and succeeds — but it's a DIFFERENT A. The stamp counter detects this.",
        code: `import java.util.concurrent.atomic.*;

// ABA scenario:
// Stack: A → B → null
// Thread 1: reads head=A (to pop A)
// Thread 2: pops A, pops B, pushes A (reuses A node)
// Stack now: A → null (but it's "the same" A by reference)
// Thread 1: CAS(expected=A, new=B) SUCCEEDS — but B was already popped!
// Now stack is A → B → null but B was supposed to be removed

// FIX: AtomicStampedReference — pairs reference with a version counter
public class ABASafeStack<T> {
    private final AtomicStampedReference<Node<T>> head =
        new AtomicStampedReference<>(null, 0); // (reference, stamp)

    public void push(T value) {
        Node<T> newHead = new Node<>(value);
        int[] stampHolder = new int[1];
        Node<T> oldHead;
        do {
            oldHead = head.get(stampHolder);    // reads reference AND stamp
            newHead.next = oldHead;
        } while (!head.compareAndSet(
            oldHead, newHead,
            stampHolder[0], stampHolder[0] + 1  // increment stamp on each CAS
        ));
    }

    public T pop() {
        int[] stampHolder = new int[1];
        Node<T> oldHead, newHead;
        do {
            oldHead = head.get(stampHolder);
            if (oldHead == null) return null;
            newHead = oldHead.next;
        } while (!head.compareAndSet(
            oldHead, newHead,
            stampHolder[0], stampHolder[0] + 1  // stamp prevents ABA
        ));
        return oldHead.value;
    }

    static class Node<T> { final T value; Node<T> next; Node(T v) { value=v; } }
}`,
      },
    ],
    complexity: "push/pop O(1) amortized (CAS retries under high contention) | Space O(n)",
    lessons: [
      "CAS loop pattern: read, compute new state, CAS — if CAS fails, retry from the read step",
      "Lock-free does NOT mean wait-free: under high contention, threads spin retrying CAS — equivalent to a spin lock",
      "ABA problem: same reference value ≠ same logical state. AtomicStampedReference adds a version counter to detect ABA",
      "For most production use cases, ConcurrentLinkedDeque (JDK lock-free deque) is better than a hand-rolled Treiber stack",
    ],
    hiddenTruths: [
      "Under high contention, CAS loops can livelock — every thread retries CAS but each succeeds only to find another thread has already changed the head. This is why lock-free ≠ better in all cases. Locks park waiting threads; CAS loops spin.",
      "Java's garbage collector eliminates the classic ABA memory hazard. In C++, a popped node might be reused via malloc and assigned the same address — causing ABA without any logical reuse. In Java, the GC guarantees that a reference to a GC'd object is null or a NEW object, so pure address-based ABA requires explicit object pool reuse.",
      "AtomicStampedReference boxes both the reference and stamp into a single object. Each compareAndSet call creates a new Pair<T, Integer> object. Under high contention, this creates significant GC pressure — defeating part of the performance advantage of lock-free code.",
      "java.util.concurrent.ConcurrentLinkedDeque uses a variation of the Michael-Scott lock-free queue algorithm internally, with special sentinel nodes for the head and tail. It handles the ABA problem via CMPXCHG on reference + 'REMOVED' marker sentinel values rather than stamps.",
    ],
  },
];
