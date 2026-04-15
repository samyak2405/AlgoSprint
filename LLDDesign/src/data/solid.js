export const SOLID_PRINCIPLES = [
  {
    letter: "S",
    name: "Single Responsibility Principle",
    tagline: "A class should have only one reason to change.",
    description:
      "Every class, module, or function should be responsible for exactly one part of the program's functionality. If a class handles user authentication AND sends emails AND logs activity, changes to email logic may break authentication — unrelated concerns are entangled.",
    violation: {
      title: "❌ Violation — God Class",
      code: `public class UserService {
    // Responsibility 1: user data
    public User findById(long id) { /* DB query */ }
    public void save(User user)   { /* DB insert */ }

    // Responsibility 2: email (unrelated!)
    public void sendWelcomeEmail(User user) {
        EmailClient.send(user.getEmail(), "Welcome!");
    }

    // Responsibility 3: audit logging (another concern!)
    public void logActivity(String action, User user) {
        Logger.write("[AUDIT] " + user.getId() + " -> " + action);
    }
}
// Problem: changing email provider requires touching UserService`,
    },
    fix: {
      title: "✓ Fix — Separated Responsibilities",
      code: `// Each class has ONE reason to change
public class UserRepository {
    public User findById(long id) { /* DB query */ }
    public void save(User user)   { /* DB insert */ }
}

public class EmailService {
    public void sendWelcomeEmail(User user) {
        EmailClient.send(user.getEmail(), "Welcome!");
    }
}

public class AuditLogger {
    public void log(String action, User user) {
        Logger.write("[AUDIT] " + user.getId() + " -> " + action);
    }
}
// Now email changes never touch UserRepository`,
    },
    keyTakeaway: "If you can describe two different reasons a class might change, it has too many responsibilities.",
  },
  {
    letter: "O",
    name: "Open/Closed Principle",
    tagline: "Open for extension, closed for modification.",
    description:
      "Software entities should be open for extension (you can add new behaviour) but closed for modification (you don't change existing tested code). Achieve this through abstraction and polymorphism — new types implement an interface rather than requiring conditionals in existing code.",
    violation: {
      title: "❌ Violation — Modifying existing code for every new shape",
      code: `public class AreaCalculator {
    public double calculateArea(Object shape) {
        if (shape instanceof Circle c) {
            return Math.PI * c.radius * c.radius;
        } else if (shape instanceof Rectangle r) {
            return r.width * r.height;
        }
        // Adding Triangle forces you to MODIFY this class!
        // Every new shape = touch existing tested code.
        throw new IllegalArgumentException("Unknown shape");
    }
}`,
    },
    fix: {
      title: "✓ Fix — Abstraction allows extension without modification",
      code: `public interface Shape {
    double area();
}

public class Circle implements Shape {
    private final double radius;
    public double area() { return Math.PI * radius * radius; }
}

public class Rectangle implements Shape {
    private final double width, height;
    public double area() { return width * height; }
}

// Adding Triangle needs ZERO changes to AreaCalculator
public class Triangle implements Shape {
    private final double base, height;
    public double area() { return 0.5 * base * height; }
}

public class AreaCalculator {
    public double calculateArea(Shape shape) {
        return shape.area();   // never needs to change
    }
}`,
    },
    keyTakeaway: "Use interfaces and polymorphism so new functionality is added by writing new code, not changing old code.",
  },
  {
    letter: "L",
    name: "Liskov Substitution Principle",
    tagline: "Subtypes must be substitutable for their base types.",
    description:
      "If S is a subtype of T, then objects of type T may be replaced with objects of type S without altering program correctness. Violations often appear when inheritance is misused: a subclass overrides a method to throw an exception or do nothing, breaking the parent's contract.",
    violation: {
      title: "❌ Violation — Square breaks Rectangle contract",
      code: `public class Rectangle {
    protected int width, height;
    public void setWidth(int w)  { this.width = w; }
    public void setHeight(int h) { this.height = h; }
    public int area() { return width * height; }
}

public class Square extends Rectangle {
    @Override
    public void setWidth(int w)  { this.width = this.height = w; }
    @Override
    public void setHeight(int h) { this.width = this.height = h; }
}

// This fails when Square is used as Rectangle:
Rectangle r = new Square();
r.setWidth(4);
r.setHeight(5);
// Expected area: 20, actual: 25 — LSP violation!`,
    },
    fix: {
      title: "✓ Fix — Prefer composition/interfaces over inheritance",
      code: `public interface Shape {
    int area();
}

public class Rectangle implements Shape {
    private final int width, height;
    Rectangle(int w, int h) { this.width = w; this.height = h; }
    public int area() { return width * height; }
}

public class Square implements Shape {
    private final int side;
    Square(int s) { this.side = s; }
    public int area() { return side * side; }
}

// Both are usable as Shape — no surprises
void printArea(Shape shape) {
    System.out.println("Area: " + shape.area());
}`,
    },
    keyTakeaway: "If overriding a method requires an exception or no-op, your inheritance hierarchy is wrong — prefer composition.",
  },
  {
    letter: "I",
    name: "Interface Segregation Principle",
    tagline: "No client should be forced to depend on methods it does not use.",
    description:
      "Large, fat interfaces should be split into smaller, more specific ones. Clients should only implement interfaces they actually use. When a class implements an interface and some methods don't apply, it signals the interface is too broad.",
    violation: {
      title: "❌ Violation — Fat interface forces empty implementations",
      code: `public interface Worker {
    void work();
    void eat();     // Makes sense for human workers...
    void sleep();   // ...but not for robots!
}

public class RobotWorker implements Worker {
    public void work()  { /* works fine */ }
    public void eat()   { throw new UnsupportedOperationException(); }  // ❌
    public void sleep() { throw new UnsupportedOperationException(); }  // ❌
}
// Robot is forced to implement irrelevant methods`,
    },
    fix: {
      title: "✓ Fix — Segregated interfaces for each concern",
      code: `public interface Workable    { void work(); }
public interface Feedable    { void eat(); }
public interface Restable    { void sleep(); }

public class HumanWorker implements Workable, Feedable, Restable {
    public void work()  { /* works */ }
    public void eat()   { /* eats */ }
    public void sleep() { /* sleeps */ }
}

public class RobotWorker implements Workable {
    public void work()  { /* works */ }
    // No forced empty methods!
}

// Clients depend only on what they need
public class WorkManager {
    public void manage(Workable w) { w.work(); }   // doesn't care about eating
}`,
    },
    keyTakeaway: "Prefer many small, specific interfaces over one large general-purpose interface.",
  },
  {
    letter: "D",
    name: "Dependency Inversion Principle",
    tagline: "High-level modules should not depend on low-level modules. Both should depend on abstractions.",
    description:
      "High-level business logic should not be tightly coupled to low-level implementation details (databases, APIs, file systems). Both should depend on abstractions (interfaces). This allows low-level details to vary without affecting high-level logic — and makes testing easy via mock injection.",
    violation: {
      title: "❌ Violation — High-level class directly instantiates low-level class",
      code: `public class OrderService {
    // Directly creates MySQLOrderRepository — tightly coupled!
    private final MySQLOrderRepository repo = new MySQLOrderRepository();

    public void placeOrder(Order order) {
        repo.save(order);
        // Can never swap to PostgreSQL or in-memory without editing OrderService
    }
}

public class MySQLOrderRepository {
    public void save(Order o) { /* MySQL specific query */ }
}`,
    },
    fix: {
      title: "✓ Fix — Depend on abstraction, inject the concrete implementation",
      code: `// Abstraction (interface)
public interface OrderRepository {
    void save(Order order);
    Order findById(long id);
}

// Low-level detail
public class MySQLOrderRepository implements OrderRepository {
    public void save(Order o)       { /* MySQL */ }
    public Order findById(long id)  { /* MySQL */ }
}

// High-level module depends on abstraction only
public class OrderService {
    private final OrderRepository repo;

    // Injected — not hardcoded
    public OrderService(OrderRepository repo) { this.repo = repo; }

    public void placeOrder(Order order) { repo.save(order); }
}

// Easy to swap: production vs test
OrderService prod = new OrderService(new MySQLOrderRepository());
OrderService test = new OrderService(new InMemoryOrderRepository());`,
    },
    keyTakeaway: "Inject dependencies through constructors or interfaces. Never 'new' up low-level objects inside high-level classes.",
  },
];
