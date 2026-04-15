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
    solution: `// Low-level implementation with synchronized + wait/notify
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
  },
];
