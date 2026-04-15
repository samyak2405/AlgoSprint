export const PATTERNS = [

  // ─────────────────────────── CREATIONAL ───────────────────────────────────
  {
    name: "Singleton",
    slug: "singleton",
    category: "Creational",
    priority: "Important",
    tagline: "One instance, globally accessible",
    quickSummary: "Restricts a class to a single instance and provides a global access point. Every call to getInstance() returns the same object. Use for shared resources like loggers, config, or DB connection pools — never for avoiding dependency injection.",
    usageSignal: "Need one shared object across the entire app lifecycle",
    watchOut: "Global state makes unit testing painful. Hides dependencies. Prefer dependency injection when you can pass the object around.",
    definition:
      "Ensures a class has exactly one instance for the entire application lifetime and provides a global access point to it.",
    whenToUse: [
      "Shared resource must exist as one instance — logger, config, thread pool, cache",
      "Object creation is expensive and should happen only once per JVM lifecycle",
      "Coordinated access to a single shared resource is needed across the codebase",
    ],
    howToThink: [
      "Ask: should two callers ever get different instances of this class? If no, Singleton.",
      "Check: is the resource stateful and shared (logger, DB pool)? Not stateless utilities.",
      "Beware: if you're using it to avoid passing dependencies, that's a design smell — prefer DI.",
      "Thread safety: always use double-checked locking or the enum idiom in Java.",
    ],
    realWorldExamples: [
      "java.lang.Runtime — Runtime.getRuntime() returns the single JVM runtime instance shared across the app",
      "Spring IoC container — one ApplicationContext per application; all beans share it",
      "HikariCP / DBCP connection pool — single shared pool handed out to every DAO",
      "Android SharedPreferences — getSharedPreferences(name, mode) always returns the same instance per name",
    ],
    pros: [
      "Controlled access to the sole instance",
      "Lazy initialization — created only when first needed",
      "Reduced memory footprint for heavyweight objects",
    ],
    cons: [
      "Global state makes unit testing difficult (hard to mock/reset)",
      "Hides dependencies and causes tight coupling",
      "Thread safety requires careful implementation",
    ],
    badCode: `// ✗ No control — any caller creates a new instance
public class Logger {
    private final PrintWriter writer;

    public Logger(String filePath) throws IOException {
        this.writer = new PrintWriter(filePath);
    }

    public void log(String msg) {
        writer.println(msg);
    }
}

// Usage — every class creates its own Logger!
public class OrderService {
    private Logger logger = new Logger("app.log"); // new file handle each time
    // ...
}

public class PaymentService {
    private Logger logger = new Logger("app.log"); // interleaved writes, lost logs
    // ...
}`,
    goodCode: `// ✓ Singleton with double-checked locking
public class Logger {
    private static volatile Logger instance;
    private final PrintWriter writer;

    private Logger() {
        try { this.writer = new PrintWriter("app.log"); }
        catch (IOException e) { throw new RuntimeException(e); }
    }

    public static Logger getInstance() {
        if (instance == null) {
            synchronized (Logger.class) {
                if (instance == null) {
                    instance = new Logger();
                }
            }
        }
        return instance;
    }

    public void log(String msg) { writer.println(msg); }
}

// Usage — everyone shares the same instance
public class OrderService {
    public void place(Order o) {
        Logger.getInstance().log("Order placed: " + o.getId());
    }
}

// Simpler alternative: enum singleton (JVM guarantees thread-safety)
public enum AppConfig {
    INSTANCE;
    private final Properties props = loadProperties();
    public String get(String key) { return props.getProperty(key); }
}`,
    classDiagram: {
      width: 340, height: 160,
      nodes: [
        {
          id: "Logger",
          type: "class",
          x: 80, y: 20,
          fields:  ["- instance: Logger", "- writer: PrintWriter"],
          methods: ["+ getInstance(): Logger", "+ log(msg: String): void", "- Logger()"],
        },
      ],
      edges: [],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Factory Method",
    slug: "factory-method",
    category: "Creational",
    priority: "Important",
    tagline: "Let subclasses decide what to create",
    quickSummary: "Defines a method for creating an object but lets subclasses override what type gets created. Removes direct `new` calls from the caller. The base class defines the algorithm; subclasses plug in the concrete product.",
    usageSignal: "Object type varies at runtime based on context or config",
    watchOut: "Can lead to subclass explosion if every variant needs its own creator class. Consider lambdas or a registry for simple cases.",
    definition:
      "Defines an interface for creating an object but lets subclasses decide which concrete class to instantiate, deferring instantiation to subclasses.",
    whenToUse: [
      "A class cannot anticipate the exact type of objects it must create",
      "Subclasses should control which product they create",
      "You want to encapsulate all creation logic in one dedicated place",
    ],
    howToThink: [
      "Spot the smell: a constructor call with a type switch (new EmailNotifier / new SMSNotifier).",
      "Replace the switch with an abstract factory method; each subclass returns its product.",
      "The creator class calls its own factory method — it never knows the concrete type.",
      "Prefer this over Abstract Factory when you only have one product family.",
    ],
    realWorldExamples: [
      "java.util.Calendar.getInstance() — returns a locale/timezone-specific Calendar subclass without exposing the concrete type",
      "JDBC DriverManager.getConnection() — returns a vendor-specific Connection implementation chosen by the registered Driver",
      "Spring's FactoryBean<T> — beans declared as factories; Spring calls getObject() to retrieve the actual product",
      "Logback / Log4j LoggerFactory.getLogger() — factory method selects the correct Logger implementation at runtime",
    ],
    pros: [
      "Decouples creator from concrete product (Open/Closed Principle)",
      "Single Responsibility: creation code lives in one place",
      "Easy to add new product types without touching existing code",
    ],
    cons: [
      "Requires a new Creator subclass per new product type",
      "Can lead to deep class hierarchies",
    ],
    badCode: `// ✗ Creator decides the concrete type — violates OCP
public class NotificationService {
    public void sendNotification(String type, String msg) {
        if (type.equals("EMAIL")) {
            EmailClient client = new EmailClient();
            client.sendEmail(msg);
        } else if (type.equals("SMS")) {
            SmsClient client = new SmsClient();
            client.sendSms(msg);
        } else if (type.equals("PUSH")) {
            PushClient client = new PushClient();
            client.sendPush(msg);
        }
        // Adding WhatsApp requires modifying this class ✗
    }
}`,
    goodCode: `// ✓ Factory Method pattern
public interface Notification {
    void send(String message);
}

public class EmailNotification implements Notification {
    public void send(String msg) { System.out.println("Email: " + msg); }
}
public class SMSNotification implements Notification {
    public void send(String msg) { System.out.println("SMS: " + msg); }
}

// Abstract creator declares the factory method
public abstract class NotificationFactory {
    public abstract Notification create();     // <-- factory method

    public void notify(String msg) {
        create().send(msg);                    // uses result without knowing type
    }
}

public class EmailFactory extends NotificationFactory {
    public Notification create() { return new EmailNotification(); }
}
public class SMSFactory extends NotificationFactory {
    public Notification create() { return new SMSNotification(); }
}

// Adding WhatsApp: new class, zero changes to existing code ✓
public class WhatsAppFactory extends NotificationFactory {
    public Notification create() { return new WhatsAppNotification(); }
}`,
    classDiagram: {
      width: 580, height: 270,
      nodes: [
        { id: "NotificationFactory", type: "abstract", x: 20, y: 25,
          fields: [], methods: ["+ create(): Notification", "+ notify(msg): void"] },
        { id: "Notification", type: "interface", x: 390, y: 25,
          fields: [], methods: ["+ send(msg: String): void"] },
        { id: "EmailFactory", type: "class", x: 20, y: 185,
          fields: [], methods: ["+ create(): Notification"] },
        { id: "SMSFactory", type: "class", x: 210, y: 185,
          fields: [], methods: ["+ create(): Notification"] },
        { id: "EmailNotification", type: "class", x: 390, y: 185,
          fields: [], methods: ["+ send(msg): void"] },
      ],
      edges: [
        { from: "EmailFactory",        to: "NotificationFactory", type: "extends" },
        { from: "SMSFactory",          to: "NotificationFactory", type: "extends" },
        { from: "EmailNotification",   to: "Notification",        type: "implements" },
        { from: "NotificationFactory", to: "Notification",        type: "dependency", label: "creates" },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Abstract Factory",
    slug: "abstract-factory",
    category: "Creational",
    priority: "Important",
    tagline: "Create families of related objects together",
    quickSummary: "Provides an interface to create families of related objects without specifying concrete classes. Think UI toolkit: a LightFactory and a DarkFactory each produce matching Buttons, Checkboxes, and Menus that look consistent together.",
    usageSignal: "Need groups of compatible objects that must always match each other",
    watchOut: "Adding a new product type requires updating every factory implementation — high change cost.",
    definition:
      "Provides an interface for creating families of related objects without specifying their concrete classes, ensuring product compatibility within a family.",
    whenToUse: [
      "System must be independent of how its products are created (platform, theme, vendor)",
      "A family of related products must always be used together — swapping one swaps all",
      "You want to enforce that products from different families are never mixed",
    ],
    howToThink: [
      "Identify the product families (Light theme vs Dark theme, Windows vs Mac widgets).",
      "Each family has the same set of products (Button, Checkbox) — model them as interfaces.",
      "The factory interface has one create method per product type.",
      "Client code depends only on the abstract factory and product interfaces.",
    ],
    realWorldExamples: [
      "Java Swing LookAndFeel — UIManager.setLookAndFeel() swaps the entire widget family (Button, Checkbox, ScrollBar) in one call",
      "JDBC — java.sql.Connection acts as an abstract factory producing Statement, PreparedStatement, and CallableStatement from the same vendor family",
      "Spring Data — JpaRepositoryFactory vs MongoRepositoryFactory each produce a compatible set of repository objects (CrudRepository, PagingRepository)",
      "AWS SDK v2 client builders — S3Client.builder() and DynamoDbClient.builder() produce clients that share the same transport and auth family",
    ],
    pros: [
      "Ensures product compatibility within a family",
      "Swapping entire families is one line change (inject different factory)",
      "Isolates concrete classes from client code",
    ],
    cons: [
      "Adding a new product type requires changing every factory interface and all its implementations",
      "More complex than Factory Method",
    ],
    badCode: `// ✗ Client decides theme-specific classes manually — breaks when themes grow
public class App {
    private final String theme;

    public App(String theme) { this.theme = theme; }

    public Button createButton() {
        if (theme.equals("light")) return new LightButton();
        else return new DarkButton();   // must change here if we add HighContrastButton
    }
    public Checkbox createCheckbox() {
        if (theme.equals("light")) return new LightCheckbox();
        else return new DarkCheckbox(); // same switch duplicated everywhere
    }
}`,
    goodCode: `// ✓ Abstract Factory pattern
public interface Button   { void render(); }
public interface Checkbox { void render(); }

// Light family
public class LightButton   implements Button   { public void render() { System.out.println("Light Button");   } }
public class LightCheckbox implements Checkbox { public void render() { System.out.println("Light Checkbox"); } }

// Dark family
public class DarkButton    implements Button   { public void render() { System.out.println("Dark Button");    } }
public class DarkCheckbox  implements Checkbox { public void render() { System.out.println("Dark Checkbox");  } }

// Abstract factory
public interface UIFactory {
    Button   createButton();
    Checkbox createCheckbox();
}

public class LightThemeFactory implements UIFactory {
    public Button   createButton()   { return new LightButton();   }
    public Checkbox createCheckbox() { return new LightCheckbox(); }
}
public class DarkThemeFactory implements UIFactory {
    public Button   createButton()   { return new DarkButton();    }
    public Checkbox createCheckbox() { return new DarkCheckbox();  }
}

// Client — knows nothing about concrete classes
public class App {
    private final Button btn;
    private final Checkbox chk;

    public App(UIFactory factory) {
        this.btn = factory.createButton();
        this.chk = factory.createCheckbox();
    }
    public void render() { btn.render(); chk.render(); }
}

// Swap entire theme in one place
App lightApp = new App(new LightThemeFactory());
App darkApp  = new App(new DarkThemeFactory());`,
    classDiagram: {
      width: 660, height: 295,
      nodes: [
        { id: "UIFactory",    type: "interface", x: 230, y: 20,
          methods: ["+ createButton(): Button", "+ createCheckbox(): Checkbox"] },
        { id: "LightFactory", type: "class", x: 30,  y: 170,
          methods: ["+ createButton(): Button", "+ createCheckbox(): Checkbox"] },
        { id: "DarkFactory",  type: "class", x: 225, y: 170,
          methods: ["+ createButton(): Button", "+ createCheckbox(): Checkbox"] },
        { id: "Button",   type: "interface", x: 460, y: 20,
          methods: ["+ render(): void"] },
        { id: "Checkbox", type: "interface", x: 460, y: 170,
          methods: ["+ render(): void"] },
      ],
      edges: [
        { from: "LightFactory", to: "UIFactory", type: "implements" },
        { from: "DarkFactory",  to: "UIFactory", type: "implements" },
        { from: "UIFactory",    to: "Button",    type: "dependency", label: "creates" },
        { from: "UIFactory",    to: "Checkbox",  type: "dependency", label: "creates" },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Builder",
    slug: "builder",
    category: "Creational",
    priority: "Important",
    tagline: "Construct complex objects step-by-step",
    quickSummary: "Separates construction of a complex object from its representation. Chain method calls (fluent API) to set only the fields you need. Eliminates telescoping constructors — no more 8-parameter `new Pizza(...)` calls.",
    usageSignal: "Object has many optional parameters or requires a specific assembly order",
    watchOut: "Overkill for simple objects with 2–3 fields. Don't add a builder just because it looks fluent.",
    definition:
      "Separates the construction of a complex object from its representation, letting the same construction process produce different representations step by step.",
    whenToUse: [
      "Object construction requires many optional parameters (telescoping constructor anti-pattern)",
      "You need immutable objects with many fields",
      "Different representations of the same object must be built using the same steps",
    ],
    howToThink: [
      "If a constructor has > 4 parameters (especially optional ones), reach for Builder.",
      "Each setter on the Builder returns `this` for fluent chaining; `build()` finalises.",
      "The outer class has a private constructor — only the Builder can create it.",
      "Validate all constraints inside `build()`, not in individual setters.",
    ],
    realWorldExamples: [
      "OkHttp Request.Builder — new Request.Builder().url(...).method('POST', body).addHeader(...).build()",
      "Lombok @Builder annotation — auto-generates a fluent builder for any class at compile time",
      "Hibernate Criteria API / JPA CriteriaBuilder — builds type-safe queries step by step before execution",
      "StringBuilder — append() chains build up a string; toString() is the final 'build' step",
    ],
    pros: [
      "Readable, fluent API — only set what you need",
      "Same builder process can produce different object states",
      "Immutable result objects are easy to achieve",
    ],
    cons: [
      "Requires a separate Builder class — more boilerplate",
      "Partial builds are silently possible if `build()` is not called",
    ],
    badCode: `// ✗ Telescoping constructors — unreadable and brittle
public class HttpRequest {
    public HttpRequest(String url) { /* ... */ }
    public HttpRequest(String url, String method) { /* ... */ }
    public HttpRequest(String url, String method, Map<String,String> headers) { /* ... */ }
    public HttpRequest(String url, String method, Map<String,String> headers,
                       String body, int timeoutMs) { /* ... */ }
}

// Caller has no idea what the 4th positional arg means
HttpRequest req = new HttpRequest(
    "https://api.example.com", "POST", null, "{}", 3000
);`,
    goodCode: `// ✓ Builder pattern
public final class HttpRequest {
    private final String url;
    private final String method;
    private final Map<String, String> headers;
    private final String body;
    private final int timeoutMs;

    private HttpRequest(Builder b) {
        this.url       = b.url;
        this.method    = b.method;
        this.headers   = Collections.unmodifiableMap(b.headers);
        this.body      = b.body;
        this.timeoutMs = b.timeoutMs;
    }

    public static class Builder {
        private final String url;
        private String method = "GET";
        private Map<String,String> headers = new HashMap<>();
        private String body;
        private int timeoutMs = 5000;

        public Builder(String url)              { this.url = url; }
        public Builder method(String m)         { this.method = m;     return this; }
        public Builder header(String k, String v){ headers.put(k,v);   return this; }
        public Builder body(String b)           { this.body = b;       return this; }
        public Builder timeout(int ms)          { this.timeoutMs = ms; return this; }

        public HttpRequest build() {
            if (url == null || url.isBlank()) throw new IllegalStateException("URL required");
            return new HttpRequest(this);
        }
    }
}

// Self-documenting call site
HttpRequest req = new HttpRequest.Builder("https://api.example.com/data")
    .method("POST")
    .header("Content-Type", "application/json")
    .body("{\"key\":\"value\"}")
    .timeout(3000)
    .build();`,
    classDiagram: {
      width: 520, height: 260,
      nodes: [
        { id: "HttpRequest", type: "class", x: 20, y: 20,
          fields:  ["- url: String", "- method: String", "- body: String"],
          methods: ["- HttpRequest(b: Builder)"] },
        { id: "Builder", type: "class", x: 300, y: 20,
          fields:  ["+ url: String", "+ method: String"],
          methods: ["+ method(m): Builder", "+ body(b): Builder", "+ build(): HttpRequest"] },
      ],
      edges: [
        { from: "Builder", to: "HttpRequest", type: "composition", label: "builds" },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Prototype",
    slug: "prototype",
    category: "Creational",
    priority: "Good to Have",
    tagline: "Clone existing objects instead of creating new ones",
    quickSummary: "Creates new objects by copying an existing instance (the prototype). Useful when creation is expensive (e.g., DB-loaded objects) or when you need many near-identical objects with slight variations.",
    usageSignal: "Creating a fresh instance is expensive; a ready-made template already exists",
    watchOut: "Deep vs. shallow copy bugs — cloned references still point to the originals. Always define clone() deliberately.",
    definition:
      "Creates new objects by cloning an existing prototype instance, bypassing expensive re-initialisation.",
    whenToUse: [
      "Object creation is costly (DB, network, complex setup) and a similar object already exists",
      "Classes to instantiate are specified at runtime",
      "You need many slightly different variations of the same object",
    ],
    howToThink: [
      "If `new MyObject()` is slow but you already have one in memory, clone it instead.",
      "Decide shallow vs deep copy: if fields reference mutable objects, a deep copy is safer.",
      "A Prototype Registry (cache of named prototypes) lets you pick-and-clone by key.",
      "In Java, implementing `Cloneable` + `clone()` is one approach; a copy constructor is cleaner.",
    ],
    realWorldExamples: [
      "Java Object.clone() / Cloneable — the original built-in prototype mechanism for copying objects",
      "Spring prototype-scoped beans — @Scope('prototype') clones a fresh bean instance for every injection point",
      "Unity3D Instantiate() — clones a prefab (prototype) to spawn game entities without re-loading assets",
      "JavaScript Object.create(proto) — new objects inherit from a prototype, with own properties layered on top",
    ],
    pros: [
      "Cloning is much faster than full re-initialisation",
      "Reduces subclassing for object variations",
      "Dynamic addition/removal of prototypes at runtime",
    ],
    cons: [
      "Deep cloning objects with circular references is tricky",
      "Cloning may require exposing or accessing private state",
    ],
    badCode: `// ✗ Every caller manually re-constructs an expensive template object
public class ReportTemplate {
    private List<String> sections;
    private Map<String, String> styles;

    public ReportTemplate() {
        // expensive: loads 50 KB template from disk, parses XML, etc.
        this.sections = loadSectionsFromDisk();
        this.styles   = loadStylesFromDisk();
    }
}

// Every new report re-reads disk — slow and wasteful
Report r1 = new Report(new ReportTemplate());
Report r2 = new Report(new ReportTemplate()); // disk read again`,
    goodCode: `// ✓ Prototype pattern
public class ReportTemplate implements Cloneable {
    private List<String> sections;
    private Map<String, String> styles;

    // Expensive init happens ONCE
    public ReportTemplate() {
        this.sections = loadSectionsFromDisk();
        this.styles   = loadStylesFromDisk();
    }

    @Override
    public ReportTemplate clone() {
        try {
            ReportTemplate copy = (ReportTemplate) super.clone();
            copy.sections = new ArrayList<>(this.sections); // deep copy list
            copy.styles   = new HashMap<>(this.styles);
            return copy;
        } catch (CloneNotSupportedException e) {
            throw new RuntimeException(e);
        }
    }
}

// Prototype registry — load once, clone many times
public class TemplateRegistry {
    private static final ReportTemplate MASTER = new ReportTemplate(); // loaded once

    public static ReportTemplate get() {
        return MASTER.clone();  // instant copy, no disk access
    }
}

Report r1 = new Report(TemplateRegistry.get()); // fast clone
Report r2 = new Report(TemplateRegistry.get()); // another fast clone`,
    classDiagram: {
      width: 620, height: 310,
      nodes: [
        { id: "Prototype", type: "interface", x: 215, y: 20,
          methods: ["+ clone(): Prototype"] },
        { id: "ReportTemplate", type: "class", x: 20, y: 165,
          fields:  ["- sections: List", "- styles: Map"],
          methods: ["+ clone(): ReportTemplate"] },
        { id: "ShapeTemplate", type: "class", x: 215, y: 165,
          fields:  ["- color: String", "- size: int"],
          methods: ["+ clone(): ShapeTemplate"] },
        { id: "TemplateRegistry", type: "class", x: 430, y: 165,
          fields:  ["- cache: Map<String,Prototype>"],
          methods: ["+ get(key): Prototype", "+ register(k,p): void"] },
      ],
      edges: [
        { from: "ReportTemplate",   to: "Prototype", type: "implements" },
        { from: "ShapeTemplate",    to: "Prototype", type: "implements" },
        { from: "TemplateRegistry", to: "Prototype", type: "aggregation", label: "caches" },
      ],
    },
  },

  // ─────────────────────────── STRUCTURAL ───────────────────────────────────
  {
    name: "Adapter",
    slug: "adapter",
    category: "Structural",
    priority: "Important",
    tagline: "Make incompatible interfaces work together",
    quickSummary: "Wraps an existing class with a new interface so it works with code expecting a different interface. The go-to fix for integrating third-party or legacy code. You write to the target interface; the adapter translates to the adaptee.",
    usageSignal: "You have a class with the right behavior but the wrong method signature",
    watchOut: "Only converts interface, not behavior. If the underlying logic is wrong, the adapter won't fix it.",
    definition:
      "Converts the interface of a class into another interface clients expect, letting classes work together that otherwise couldn't due to incompatible interfaces.",
    whenToUse: [
      "Integrating a third-party or legacy class whose interface doesn't match your system",
      "Reusing existing code without modifying it",
      "Providing a stable interface over volatile external APIs",
    ],
    howToThink: [
      "Identify the Target interface your system expects and the Adaptee you cannot change.",
      "The Adapter implements Target and wraps (holds) an instance of Adaptee.",
      "Adapter methods translate calls: convert parameters, delegate to Adaptee, convert return values.",
      "Prefer object adapter (composition) over class adapter (multiple inheritance) in Java.",
    ],
    realWorldExamples: [
      "java.io.InputStreamReader — adapts InputStream (byte stream) to the Reader (character stream) interface expected by BufferedReader",
      "Spring MVC HandlerAdapter — adapts @Controller, HttpRequestHandler, and Servlet into the DispatcherServlet's uniform handler interface",
      "Retrofit — adapts a Java interface with annotations into HTTP calls against a REST API",
      "Arrays.asList() — adapts a fixed-length array to the java.util.List interface without copying data",
    ],
    pros: [
      "Reuse existing code without modification (Open/Closed Principle)",
      "Single Responsibility: translation logic lives in one class",
      "Enables integration of incompatible systems",
    ],
    cons: [
      "Extra layer of indirection adds complexity",
      "Many adapters can make the codebase hard to navigate",
    ],
    badCode: `// ✗ Client directly uses LegacyPaymentGateway — tightly coupled to its API
public class CheckoutService {
    private LegacyPaymentGateway gateway = new LegacyPaymentGateway();

    public void checkout(double amountUSD) {
        int cents   = (int)(amountUSD * 100);        // format conversion duplicated everywhere
        String key  = System.getenv("LEGACY_API_KEY");
        gateway.makePayment(cents, "USD", key);       // caller knows internals
    }
}`,
    goodCode: `// ✓ Adapter pattern
// Target — the interface your system speaks
public interface PaymentProcessor {
    void pay(double amount, String currency);
}

// Adaptee — existing legacy class, cannot be modified
public class LegacyPaymentGateway {
    public void makePayment(int amountCents, String currencyCode, String apiKey) {
        System.out.println("Legacy payment: " + amountCents + " " + currencyCode);
    }
}

// Adapter — wraps the Adaptee, implements the Target
public class PaymentGatewayAdapter implements PaymentProcessor {
    private final LegacyPaymentGateway gateway;
    private final String apiKey;

    public PaymentGatewayAdapter(LegacyPaymentGateway gw, String key) {
        this.gateway = gw;
        this.apiKey  = key;
    }

    @Override
    public void pay(double amount, String currency) {
        int cents = (int)(amount * 100);           // translation lives here once
        gateway.makePayment(cents, currency, apiKey);
    }
}

// Client depends only on PaymentProcessor — swap adapters freely
public class CheckoutService {
    private final PaymentProcessor processor;
    public CheckoutService(PaymentProcessor p) { this.processor = p; }
    public void checkout(double amt) { processor.pay(amt, "USD"); }
}`,
    classDiagram: {
      width: 620, height: 210,
      nodes: [
        { id: "PaymentProcessor", type: "interface", x: 20, y: 65,
          methods: ["+ pay(amount, currency): void"] },
        { id: "PaymentGatewayAdapter", type: "class", x: 215, y: 20,
          fields:  ["- gateway: LegacyGateway", "- apiKey: String"],
          methods: ["+ pay(amount, currency): void"] },
        { id: "LegacyPaymentGateway", type: "class", x: 430, y: 65,
          methods: ["+ makePayment(cents, cc, key)"] },
      ],
      edges: [
        { from: "PaymentGatewayAdapter", to: "PaymentProcessor",      type: "implements" },
        { from: "PaymentGatewayAdapter", to: "LegacyPaymentGateway",  type: "composition", label: "wraps" },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Bridge",
    slug: "bridge",
    category: "Structural",
    priority: "Good to Have",
    tagline: "Separate abstraction from implementation",
    quickSummary: "Decouples what you do (abstraction) from how you do it (implementation) so both can evolve independently. Example: a Shape abstraction (Circle, Square) over multiple Renderer implementations (SVG, Canvas). Avoids the 2×N subclass explosion.",
    usageSignal: "You want to vary both abstraction and implementation independently along two axes",
    watchOut: "Adds indirection upfront. Only justified when you genuinely foresee multiple independent variation dimensions.",
    definition:
      "Decouples an abstraction from its implementation so both can vary independently, avoiding the combinatorial explosion of subclasses.",
    whenToUse: [
      "You need to extend a class in two independent dimensions (e.g., shape × color)",
      "Implementation should be switchable at runtime",
      "Changes to the implementation should not affect client code",
    ],
    howToThink: [
      "Spot two independent dimensions that both need subclassing — that's a Bridge candidate.",
      "One dimension becomes the Abstraction hierarchy, the other becomes the Implementor hierarchy.",
      "Abstraction holds a reference (bridge) to an Implementor — inject via constructor.",
      "Client talks to Abstraction; Abstraction delegates to Implementor.",
    ],
    realWorldExamples: [
      "JDBC — Java code talks to the Driver abstraction; MySQL, PostgreSQL, Oracle each provide their own Implementor",
      "SLF4J — the SLF4J API is the abstraction; Logback, Log4j2, and java.util.logging are swappable implementors",
      "Spring PlatformTransactionManager — one abstraction bridges JPA, JDBC, Hibernate, and JTA transaction implementors",
      "AWT Peer classes — the abstract Window/Button abstraction delegates to OS-native Win32, Cocoa, or X11 peers",
    ],
    pros: [
      "Abstraction and implementation can evolve independently",
      "Avoids the subclass explosion of inheritance",
      "Implementation can be swapped at runtime",
    ],
    cons: [
      "Adds indirection — can be over-engineering for simple hierarchies",
      "Requires upfront design; hard to retrofit into existing code",
    ],
    badCode: `// ✗ Combinatorial explosion: need a class for every Remote×Device combination
class TVBasicRemote    { void volumeUp() { /* TV-specific */ } }
class TVAdvancedRemote { void volumeUp() { /* TV-specific */ } void mute() {} }
class RadioBasicRemote    { void volumeUp() { /* Radio-specific */ } }
class RadioAdvancedRemote { void volumeUp() { /* Radio-specific */ } void mute() {} }
// Adding a 3rd device type multiplies classes again`,
    goodCode: `// ✓ Bridge pattern
// Implementor hierarchy
public interface Device {
    void powerOn();
    void powerOff();
    void setVolume(int level);
    int  getVolume();
}
public class TV    implements Device { /* TV-specific impl */ }
public class Radio implements Device { /* Radio-specific impl */ }

// Abstraction hierarchy — holds a reference (the bridge) to Device
public abstract class RemoteControl {
    protected final Device device;
    protected RemoteControl(Device d) { this.device = d; }

    public void togglePower() {
        // logic shared across all remotes
    }
}

public class BasicRemote extends RemoteControl {
    public BasicRemote(Device d) { super(d); }
    public void volumeUp()   { device.setVolume(device.getVolume() + 10); }
    public void volumeDown() { device.setVolume(device.getVolume() - 10); }
}

public class AdvancedRemote extends RemoteControl {
    public AdvancedRemote(Device d) { super(d); }
    public void mute() { device.setVolume(0); }
}

// Mix any Remote with any Device at runtime — no new classes needed
RemoteControl tvRemote    = new AdvancedRemote(new TV());
RemoteControl radioRemote = new BasicRemote(new Radio());`,
    classDiagram: {
      width: 680, height: 355,
      nodes: [
        { id: "RemoteControl", type: "abstract", x: 20, y: 20,
          fields:  ["# device: Device"],
          methods: ["+ togglePower(): void"] },
        { id: "BasicRemote", type: "class", x: 20, y: 190,
          methods: ["+ volumeUp(): void", "+ volumeDown(): void"] },
        { id: "AdvancedRemote", type: "class", x: 215, y: 190,
          methods: ["+ mute(): void"] },
        { id: "Device", type: "interface", x: 480, y: 20,
          methods: ["+ powerOn(): void", "+ setVolume(n): void"] },
        { id: "TV",    type: "class", x: 480, y: 200,
          methods: ["+ setVolume(n): void"] },
        { id: "Radio", type: "class", x: 480, y: 280,
          methods: ["+ setVolume(n): void"] },
      ],
      edges: [
        { from: "BasicRemote",    to: "RemoteControl", type: "extends" },
        { from: "AdvancedRemote", to: "RemoteControl", type: "extends" },
        { from: "TV",             to: "Device",        type: "implements" },
        { from: "Radio",          to: "Device",        type: "implements" },
        { from: "RemoteControl",  to: "Device",        type: "aggregation", label: "bridge" },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Composite",
    slug: "composite",
    category: "Structural",
    priority: "Good to Have",
    tagline: "Treat individual items and groups the same way",
    quickSummary: "Composes objects into tree structures. Clients use the same interface for a single leaf and an entire subtree. Classic example: file system — File and Folder both implement getSize(). You call folder.getSize() and it recursively totals everything inside.",
    usageSignal: "You have part–whole hierarchies and want uniform treatment at every level",
    watchOut: "Forcing all operations onto both leaf and composite can produce awkward no-op implementations on leaves.",
    definition:
      "Composes objects into tree structures to represent part-whole hierarchies, letting clients treat individual objects and compositions uniformly.",
    whenToUse: [
      "You need to represent a hierarchy: file system, UI component tree, org chart",
      "Client code should treat leaf and container nodes identically",
      "Operations should propagate through the tree (render all, calculate total price)",
    ],
    howToThink: [
      "Model a Component interface with the operation all nodes share (render, getPrice, etc.).",
      "Leaf implements Component directly with concrete logic.",
      "Composite implements Component, holds a List<Component>, and delegates to all children.",
      "Client only ever holds a Component reference — no instanceof checks.",
    ],
    realWorldExamples: [
      "Java Swing — JPanel (composite) and JButton (leaf) both implement java.awt.Component; layouts nest them uniformly",
      "HTML/XML DOM — Element nodes can contain other Elements or Text nodes; browsers traverse the tree without instanceof checks",
      "java.io.File — getSize() on a File returns bytes; on a Directory it recurses and sums children",
      "Spring Security FilterChainProxy — composes a chain of SecurityFilterChain objects; each chain itself holds leaf Filter instances",
    ],
    pros: [
      "Uniform treatment of leaves and composites simplifies client code",
      "Easy to add new node types without changing existing code",
      "Recursive structure naturally represents hierarchies",
    ],
    cons: [
      "Hard to restrict which node types can be children of which composites",
      "Operations that only make sense on leaves are awkward to define on the Component interface",
    ],
    badCode: `// ✗ Client must check type at every step — doesn't scale
public class FileSystem {
    public long getTotalSize(Object node) {
        if (node instanceof File) {
            return ((File) node).getSize();
        } else if (node instanceof Directory) {
            long total = 0;
            for (Object child : ((Directory) node).getChildren()) {
                total += getTotalSize(child); // manual recursion, scattered logic
            }
            return total;
        }
        throw new IllegalArgumentException("Unknown type");
    }
}`,
    goodCode: `// ✓ Composite pattern
public interface FileSystemComponent {
    String getName();
    long   getSize();
    void   print(String indent);
}

// Leaf
public class File implements FileSystemComponent {
    private final String name;
    private final long   size;

    public File(String name, long size) { this.name = name; this.size = size; }

    public String getName() { return name; }
    public long   getSize() { return size; }
    public void   print(String indent) {
        System.out.println(indent + "📄 " + name + " (" + size + " B)");
    }
}

// Composite
public class Directory implements FileSystemComponent {
    private final String name;
    private final List<FileSystemComponent> children = new ArrayList<>();

    public Directory(String name) { this.name = name; }

    public void add(FileSystemComponent c) { children.add(c); }

    public String getName() { return name; }
    public long   getSize() { return children.stream().mapToLong(FileSystemComponent::getSize).sum(); }
    public void   print(String indent) {
        System.out.println(indent + "📁 " + name);
        children.forEach(c -> c.print(indent + "  "));
    }
}

// Client — treats File and Directory identically
FileSystemComponent root = new Directory("root");
((Directory) root).add(new File("readme.txt", 1024));
Directory src = new Directory("src");
src.add(new File("Main.java", 4096));
((Directory) root).add(src);

root.print("");      // recursive print
root.getSize();      // recursive size`,
    classDiagram: {
      width: 560, height: 340,
      nodes: [
        { id: "FileSystemComponent", type: "interface", x: 191, y: 20,
          methods: ["+ getName(): String", "+ getSize(): long", "+ print(indent): void"] },
        { id: "File", type: "class", x: 20, y: 190,
          fields:  ["- name: String", "- size: long"],
          methods: ["+ getSize(): long", "+ print(indent): void"] },
        { id: "Directory", type: "class", x: 280, y: 190,
          fields:  ["- children: List<Component>"],
          methods: ["+ add(c): void", "+ getSize(): long", "+ print(indent): void"] },
      ],
      edges: [
        { from: "File",      to: "FileSystemComponent", type: "implements" },
        { from: "Directory", to: "FileSystemComponent", type: "implements" },
        { from: "Directory", to: "FileSystemComponent", type: "composition", label: "children *" },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Decorator",
    slug: "decorator",
    category: "Structural",
    priority: "Important",
    tagline: "Add behavior without changing the class",
    quickSummary: "Wraps an object to add new behavior dynamically, at runtime. Stack as many decorators as you need. Java's I/O library is the textbook example: new BufferedReader(new FileReader(path)) layers buffering onto file reading.",
    usageSignal: "You need to add responsibilities to individual objects, not the entire class",
    watchOut: "Many stacked decorators make debugging tricky — stack traces become deep chains. Don't use instead of proper OO design.",
    definition:
      "Attaches additional responsibilities to an object dynamically by wrapping it in decorator objects, providing a flexible alternative to subclassing.",
    whenToUse: [
      "You need to add behaviour to individual objects at runtime, not all instances of a class",
      "Extending by subclassing is impractical due to combinatorial growth",
      "Responsibilities should be removable (stacked and unstacked)",
    ],
    howToThink: [
      "Define a Component interface shared by the real object and all decorators.",
      "The Decorator wraps a Component reference and delegates to it before/after its own logic.",
      "Decorators can be stacked: new LoggingDecorator(new CompressionDecorator(realStream)).",
      "Each decorator adds exactly one concern — Single Responsibility.",
    ],
    realWorldExamples: [
      "Java I/O streams — new BufferedReader(new InputStreamReader(new FileInputStream(f))) stacks compression, buffering, and encoding decorators",
      "Collections.unmodifiableList() / synchronizedList() — wrap any List to add a single cross-cutting concern without subclassing",
      "Spring's HttpServletRequestWrapper — wraps the raw request to add caching, logging, or multi-read body support",
      "Middleware in web frameworks (Express, Spring interceptors) — each middleware layer wraps the request/response pipeline with one concern",
    ],
    pros: [
      "Add/remove behaviours at runtime without touching the original class",
      "Avoids subclass explosion for combinations of features",
      "Follows Open/Closed and Single Responsibility Principles",
    ],
    cons: [
      "Many small wrapper objects can make debugging harder",
      "Order of wrapping matters — can be confusing",
    ],
    badCode: `// ✗ Subclass per combination — explodes with each new feature
public class Coffee           { double cost() { return 1.0; } }
public class CoffeeWithMilk   extends Coffee { double cost() { return 1.5; } }
public class CoffeeWithSugar  extends Coffee { double cost() { return 1.2; } }
public class CoffeeWithMilkAndSugar extends Coffee { double cost() { return 1.7; } }
// Adding "extra shot" doubles the subclasses again`,
    goodCode: `// ✓ Decorator pattern
public interface Coffee {
    double cost();
    String description();
}

// Concrete component
public class SimpleCoffee implements Coffee {
    public double cost()        { return 1.0; }
    public String description() { return "Coffee"; }
}

// Abstract decorator
public abstract class CoffeeDecorator implements Coffee {
    protected final Coffee coffee;
    protected CoffeeDecorator(Coffee c) { this.coffee = c; }
}

// Concrete decorators
public class MilkDecorator extends CoffeeDecorator {
    public MilkDecorator(Coffee c) { super(c); }
    public double cost()        { return coffee.cost() + 0.5; }
    public String description() { return coffee.description() + ", Milk"; }
}

public class SugarDecorator extends CoffeeDecorator {
    public SugarDecorator(Coffee c) { super(c); }
    public double cost()        { return coffee.cost() + 0.2; }
    public String description() { return coffee.description() + ", Sugar"; }
}

public class ExtraShotDecorator extends CoffeeDecorator {
    public ExtraShotDecorator(Coffee c) { super(c); }
    public double cost()        { return coffee.cost() + 0.8; }
    public String description() { return coffee.description() + ", Extra Shot"; }
}

// Stack decorators at runtime — any combination, no new classes
Coffee order = new SugarDecorator(new MilkDecorator(new SimpleCoffee()));
System.out.println(order.description() + " = $" + order.cost());
// Coffee, Milk, Sugar = $1.7`,
    classDiagram: {
      width: 580, height: 390,
      nodes: [
        { id: "Coffee", type: "interface", x: 200, y: 20,
          methods: ["+ cost(): double", "+ description(): String"] },
        { id: "SimpleCoffee", type: "class", x: 20, y: 185,
          methods: ["+ cost(): double", "+ description(): String"] },
        { id: "CoffeeDecorator", type: "abstract", x: 215, y: 185,
          fields:  ["# coffee: Coffee"],
          methods: ["+ cost(): double"] },
        { id: "MilkDecorator",  type: "class", x: 120, y: 320, methods: ["+ cost(): double"] },
        { id: "SugarDecorator", type: "class", x: 395, y: 320, methods: ["+ cost(): double"] },
      ],
      edges: [
        { from: "SimpleCoffee",    to: "Coffee",          type: "implements" },
        { from: "CoffeeDecorator", to: "Coffee",          type: "implements" },
        { from: "CoffeeDecorator", to: "Coffee",          type: "aggregation", label: "wraps" },
        { from: "MilkDecorator",   to: "CoffeeDecorator", type: "extends" },
        { from: "SugarDecorator",  to: "CoffeeDecorator", type: "extends" },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Facade",
    slug: "facade",
    category: "Structural",
    priority: "Important",
    tagline: "One clean interface over a complex subsystem",
    quickSummary: "Provides a single simplified API over a complex set of subsystems. Clients interact with the Facade, not the internals. Home theater analogy: one watchMovie() button hides interactions with projector, speakers, streaming box, and lights.",
    usageSignal: "Clients need a simple entry point into a complex or multi-class subsystem",
    watchOut: "If over-relied on, the Facade becomes a god class that knows too much. Keep it thin — delegate, don't absorb logic.",
    definition:
      "Provides a simplified, unified interface to a complex subsystem, hiding its internal complexity from clients.",
    whenToUse: [
      "You want a simple interface over a complex set of subsystem classes",
      "You need to layer subsystems and want to define an entry point for each layer",
      "Decoupling client code from the many subsystem classes it would otherwise depend on",
    ],
    howToThink: [
      "Identify the complex subsystem (video codec, payment system, email pipeline).",
      "Create a Facade class that orchestrates the subsystem objects in a single method.",
      "Clients call the Facade; only the Facade knows about subsystem internals.",
      "Facade doesn't prevent direct access to subsystem — it's a convenience layer, not a lock.",
    ],
    realWorldExamples: [
      "Spring JdbcTemplate — hides Connection, Statement, ResultSet boilerplate behind query() and update() methods",
      "SLF4J LoggerFactory — one getLogger() call hides Logback appender config, MDC wiring, and level routing",
      "java.net.URL.openStream() — facades socket creation, protocol negotiation, redirect handling, and stream wrapping",
      "AWS S3TransferManager — single uploadFile() call coordinates multipart upload, retry, progress tracking, and checksum verification",
    ],
    pros: [
      "Dramatically simplifies the client's view of a subsystem",
      "Decouples client from subsystem — swap internals without affecting client",
      "Provides a well-defined entry point for each layer",
    ],
    cons: [
      "Risk of the Facade becoming a God object if over-used",
      "May limit fine-grained control needed by power users",
    ],
    badCode: `// ✗ Client manually orchestrates 6 subsystem classes
public class VideoConverter {
    public void convert(String file, String format) {
        VideoFile    video   = new VideoFile(file);
        Codec        codec   = CodecFactory.extract(video);
        BitrateReader reader  = new BitrateReader();
        byte[]        buffer  = reader.read(video, codec);
        AudioMixer    mixer   = new AudioMixer();
        byte[]        audio   = mixer.fix(buffer);
        VideoFile    result  = new VideoFile(format);
        result.save(audio);
        // 6 subsystem classes the caller must know about
    }
}`,
    goodCode: `// ✓ Facade pattern
// Subsystem classes (unchanged)
public class VideoFile    { /* reads video data */ }
public class Codec        { /* encodes/decodes */ }
public class CodecFactory { public static Codec extract(VideoFile f) { return new Codec(); } }
public class BitrateReader{ public byte[] read(VideoFile f, Codec c) { return new byte[0]; } }
public class AudioMixer   { public byte[] fix(byte[] b) { return b; } }

// Facade — single simple interface over all of the above
public class VideoConversionFacade {
    public void convertVideo(String filename, String format) {
        VideoFile     video  = new VideoFile(filename);
        Codec         codec  = CodecFactory.extract(video);
        BitrateReader reader = new BitrateReader();
        byte[]        buffer = reader.read(video, codec);
        AudioMixer    mixer  = new AudioMixer();
        byte[]        audio  = mixer.fix(buffer);
        // save result...
        System.out.println("Converted " + filename + " → " + format);
    }
}

// Client only sees one class and one method
VideoConversionFacade facade = new VideoConversionFacade();
facade.convertVideo("interview.mp4", "mov");`,
    classDiagram: {
      width: 640, height: 260,
      nodes: [
        { id: "VideoConversionFacade", type: "class", x: 20, y: 80,
          methods: ["+ convertVideo(file, fmt): void"] },
        { id: "VideoFile",     type: "class", x: 280, y: 20,  methods: ["+ save(data): void"] },
        { id: "CodecFactory",  type: "class", x: 280, y: 110, methods: ["+ extract(v): Codec"] },
        { id: "BitrateReader", type: "class", x: 460, y: 20,  methods: ["+ read(v, c): byte[]"] },
        { id: "AudioMixer",    type: "class", x: 460, y: 110, methods: ["+ fix(b): byte[]"] },
      ],
      edges: [
        { from: "VideoConversionFacade", to: "VideoFile",     type: "uses" },
        { from: "VideoConversionFacade", to: "CodecFactory",  type: "uses" },
        { from: "VideoConversionFacade", to: "BitrateReader", type: "uses" },
        { from: "VideoConversionFacade", to: "AudioMixer",    type: "uses" },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Flyweight",
    slug: "flyweight",
    category: "Structural",
    priority: "Rarely Used",
    tagline: "Share common state to slash memory footprint",
    quickSummary: "Stores shared, immutable (intrinsic) state in a factory-managed pool. Objects hold only their unique (extrinsic) state and look it up when needed. Used in game engines for thousands of identical bullets, particles, or glyphs.",
    usageSignal: "You have millions of similar objects and profiling confirms memory is the bottleneck",
    watchOut: "Adds significant complexity. Never use speculatively — only after memory profiling confirms the problem.",
    definition:
      "Uses sharing to support a large number of fine-grained objects efficiently by separating intrinsic (shared) state from extrinsic (per-instance) state.",
    whenToUse: [
      "The application needs a huge number of similar objects (thousands of particles, characters, trees)",
      "Most object state can be externalised and passed as arguments",
      "Memory reduction outweighs the cost of externalising state",
    ],
    howToThink: [
      "Split object state: intrinsic (shared, immutable — color, texture) vs extrinsic (per-call — position, size).",
      "Flyweight stores only intrinsic state; extrinsic state is passed to its methods.",
      "A FlyweightFactory caches and returns shared instances by key.",
      "Callers hold extrinsic state and pass it on each operation call.",
    ],
    realWorldExamples: [
      "Java Integer.valueOf(-128 to 127) — the JVM caches this range; the same Integer object is returned every time, saving heap allocations",
      "String.intern() — returns a canonical shared String instance from the JVM string pool",
      "Font glyph caches in text renderers — one immutable Glyph object (shape, metrics) is shared by every character occurrence in a document",
      "Game particle systems — thousands of bullets or sparks share one Flyweight holding the mesh/texture; each context stores only position and velocity",
    ],
    pros: [
      "Dramatic memory savings when many objects share the same intrinsic state",
      "Can improve cache performance through object reuse",
    ],
    cons: [
      "Trades CPU time for memory — extrinsic state must be computed/passed each call",
      "Complex to implement correctly; code becomes harder to read",
    ],
    badCode: `// ✗ One object per tree — 1,000,000 trees = 1,000,000 full objects in memory
public class Tree {
    private double x, y;
    private String type;    // "Oak", "Pine" — same for thousands of trees
    private Color  color;   // same object for all oaks
    private byte[] texture; // 50KB texture, duplicated millions of times
}

List<Tree> forest = new ArrayList<>();
for (int i = 0; i < 1_000_000; i++) {
    forest.add(new Tree(rand.nextDouble(), rand.nextDouble(), "Oak", OAK_COLOR, OAK_TEXTURE));
}`,
    goodCode: `// ✓ Flyweight pattern
// Flyweight — intrinsic (shared) state only
public class TreeType {
    private final String name;    // "Oak"
    private final Color  color;
    private final byte[] texture; // 50 KB — shared among all oak trees

    public TreeType(String name, Color color, byte[] texture) { /* ... */ }

    public void draw(double x, double y) {
        // uses intrinsic state + extrinsic (x, y) passed in
        System.out.println("Draw " + name + " at (" + x + "," + y + ")");
    }
}

// Factory — returns cached (shared) flyweights
public class TreeFactory {
    private static final Map<String, TreeType> cache = new HashMap<>();

    public static TreeType get(String name, Color color, byte[] texture) {
        return cache.computeIfAbsent(name, k -> new TreeType(name, color, texture));
    }
}

// Context — stores only extrinsic state (position) + a shared TreeType reference
public class Tree {
    private final double   x, y;          // extrinsic: unique per tree
    private final TreeType type;          // intrinsic: shared flyweight

    public Tree(double x, double y, TreeType type) { this.x = x; this.y = y; this.type = type; }
    public void draw() { type.draw(x, y); }
}

// 1,000,000 Tree objects — each holds only 2 doubles + a shared TreeType reference
TreeType oak = TreeFactory.get("Oak", Color.GREEN, OAK_TEXTURE); // texture loaded ONCE
for (int i = 0; i < 1_000_000; i++) {
    forest.add(new Tree(rand.nextDouble(), rand.nextDouble(), oak));
}`,
    classDiagram: {
      width: 580, height: 335,
      nodes: [
        { id: "TreeFactory",  type: "class", x: 20, y: 20,
          fields:  ["- cache: Map<String,TreeType>"],
          methods: ["+ get(name, color): TreeType"] },
        { id: "TreeType", type: "class", x: 260, y: 20,
          fields:  ["- name: String", "- color: Color", "- texture: byte[]"],
          methods: ["+ draw(x, y): void"] },
        { id: "Tree", type: "class", x: 260, y: 185,
          fields:  ["- x: double", "- y: double", "- type: TreeType"],
          methods: ["+ draw(): void"] },
      ],
      edges: [
        { from: "TreeFactory", to: "TreeType", type: "composition", label: "caches" },
        { from: "Tree",        to: "TreeType", type: "aggregation", label: "shared ref" },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Proxy",
    slug: "proxy",
    category: "Structural",
    priority: "Important",
    tagline: "Control access to another object",
    quickSummary: "A surrogate object that controls access to the real subject. Add lazy loading, caching, access control, or logging without touching the original class. Spring AOP is built entirely on dynamic proxies. Remote method invocation uses it too.",
    usageSignal: "You need to intercept, guard, or augment access to an object",
    watchOut: "Thin proxies can quietly grow into god classes. Keep each proxy focused on one concern.",
    definition:
      "Provides a surrogate object that controls access to another object, adding functionality such as lazy loading, caching, access control, or logging transparently.",
    whenToUse: [
      "Lazy initialisation: defer creation of a heavyweight object until first access (Virtual Proxy)",
      "Access control: check permissions before forwarding to the real object (Protection Proxy)",
      "Logging / caching: intercept calls without modifying the real object (Smart Proxy)",
    ],
    howToThink: [
      "Both Proxy and RealSubject implement the same Subject interface.",
      "Proxy holds a reference to RealSubject; it may create it lazily.",
      "Every method in Proxy delegates to RealSubject after performing its cross-cutting concern.",
      "Client holds a Subject reference — it doesn't know if it's talking to a Proxy or the real thing.",
    ],
    realWorldExamples: [
      "Spring AOP — @Transactional and @Cacheable create dynamic proxies that wrap the real bean with transaction or cache logic transparently",
      "Hibernate lazy loading — a @OneToMany collection is a proxy object that fires a SELECT query only on first access",
      "java.lang.reflect.Proxy — creates a dynamic proxy at runtime that intercepts interface method calls (used by Spring, MyBatis, Mockito)",
      "CDN servers — act as a caching proxy in front of the origin server, serving cached content without the client knowing",
    ],
    pros: [
      "Transparent to the client — no code changes required",
      "Can introduce lazy loading, caching, or security without modifying RealSubject",
      "Follows Open/Closed Principle",
    ],
    cons: [
      "Response time may increase due to the extra layer",
      "Complex proxy hierarchies can be hard to maintain",
    ],
    badCode: `// ✗ Image loaded eagerly even if it's never displayed
public class Gallery {
    private List<Image> images = new ArrayList<>();

    public Gallery(List<String> paths) {
        for (String path : paths) {
            images.add(new Image(path)); // all 500 images loaded into RAM at startup
        }
    }
    public void show(int index) { images.get(index).display(); }
}`,
    goodCode: `// ✓ Virtual Proxy — lazy loading
public interface Image {
    void display();
}

// Real heavyweight object
public class RealImage implements Image {
    private final String filename;
    private byte[] data;

    public RealImage(String filename) {
        this.filename = filename;
        this.data = loadFromDisk(filename); // expensive
        System.out.println("Loaded: " + filename);
    }
    public void display() { System.out.println("Displaying: " + filename); }
}

// Proxy — wraps RealImage, creates it only on first display()
public class ImageProxy implements Image {
    private final String filename;
    private RealImage    realImage;

    public ImageProxy(String filename) {
        this.filename = filename;  // cheap — no disk access yet
    }

    @Override
    public void display() {
        if (realImage == null) {
            realImage = new RealImage(filename); // created on demand
        }
        realImage.display();
    }
}

// Gallery holds 500 proxies — no disk access until each image is shown
List<Image> gallery = paths.stream()
    .map(ImageProxy::new)
    .collect(toList());

gallery.get(0).display(); // only NOW loads image 0 from disk`,
    classDiagram: {
      width: 560, height: 315,
      nodes: [
        { id: "Image", type: "interface", x: 191, y: 20,
          methods: ["+ display(): void"] },
        { id: "RealImage", type: "class", x: 20, y: 165,
          fields:  ["- filename: String", "- data: byte[]"],
          methods: ["+ display(): void"] },
        { id: "ImageProxy", type: "class", x: 270, y: 165,
          fields:  ["- filename: String", "- realImage: RealImage"],
          methods: ["+ display(): void"] },
      ],
      edges: [
        { from: "RealImage",  to: "Image",     type: "implements" },
        { from: "ImageProxy", to: "Image",     type: "implements" },
        { from: "ImageProxy", to: "RealImage", type: "composition", label: "lazy ref" },
      ],
    },
  },

  // ─────────────────────────── BEHAVIORAL ───────────────────────────────────
  {
    name: "Chain of Responsibility",
    slug: "chain-of-responsibility",
    category: "Behavioral",
    priority: "Good to Have",
    tagline: "Pass requests along a chain until one handles it",
    quickSummary: "A chain of handlers where each decides whether to handle a request or pass it to the next handler. Decouples sender from receiver. Think HTTP middleware pipelines, event bubbling, or a leave approval chain: Team Lead → Manager → Director.",
    usageSignal: "Multiple handlers may process a request; the sender shouldn't know which one handles it",
    watchOut: "No guaranteed handler — requests may silently fall off the end of the chain. Always add a default/fallback handler.",
    definition:
      "Passes a request along a chain of handlers, each deciding to process it or forward it to the next handler in the chain.",
    whenToUse: [
      "More than one object may handle a request, and the handler isn't known a priori",
      "You want to issue a request to one of several objects without specifying the receiver explicitly",
      "Request processing pipelines: auth → rate-limit → validation → business logic",
    ],
    howToThink: [
      "Define an abstract Handler with a `setNext(handler)` and `handle(request)` method.",
      "Each concrete handler: either handles the request or calls `next.handle(request)`.",
      "Build the chain by linking handlers; order matters.",
      "The sender holds only the first handler reference — it's decoupled from the rest.",
    ],
    realWorldExamples: [
      "Java Servlet Filter chain — each Filter calls chain.doFilter() to pass the request to the next filter (auth → logging → compression → servlet)",
      "Spring Security filter chain — SecurityFilterChain links authentication, CSRF, session, and authorization handlers in order",
      "Exception handler chains in web frameworks — @ExceptionHandler methods tried in order; unhandled exceptions fall through to a global handler",
      "Node.js / Express middleware pipeline — each middleware calls next() to pass the request down the stack",
    ],
    pros: [
      "Decouples sender from receivers",
      "Handlers can be added, removed, or reordered at runtime",
      "Single Responsibility: each handler does one thing",
    ],
    cons: [
      "No guarantee the request is handled if the chain has no matching handler",
      "Hard to debug when the chain is long and dynamic",
    ],
    badCode: `// ✗ Monolithic if-else — every new approval level requires editing this class
public class PurchaseService {
    public void approve(Purchase p) {
        if (p.getAmount() < 1_000) {
            teamLead.approve(p);
        } else if (p.getAmount() < 10_000) {
            manager.approve(p);
        } else if (p.getAmount() < 100_000) {
            director.approve(p);
        } else {
            ceo.approve(p);
        }
    }
}`,
    goodCode: `// ✓ Chain of Responsibility
public abstract class ApprovalHandler {
    private ApprovalHandler next;

    public ApprovalHandler setNext(ApprovalHandler next) {
        this.next = next;
        return next;  // enables fluent chaining: lead.setNext(mgr).setNext(dir)
    }

    public abstract void handle(Purchase purchase);

    protected void passToNext(Purchase purchase) {
        if (next != null) next.handle(purchase);
        else System.out.println("No one could approve: " + purchase.getAmount());
    }
}

public class TeamLeadHandler extends ApprovalHandler {
    public void handle(Purchase p) {
        if (p.getAmount() < 1_000) System.out.println("TeamLead approved " + p.getAmount());
        else passToNext(p);
    }
}
public class ManagerHandler extends ApprovalHandler {
    public void handle(Purchase p) {
        if (p.getAmount() < 10_000) System.out.println("Manager approved " + p.getAmount());
        else passToNext(p);
    }
}
public class DirectorHandler extends ApprovalHandler {
    public void handle(Purchase p) {
        if (p.getAmount() < 100_000) System.out.println("Director approved " + p.getAmount());
        else passToNext(p);
    }
}

// Build the chain once
ApprovalHandler lead = new TeamLeadHandler();
lead.setNext(new ManagerHandler()).setNext(new DirectorHandler());

lead.handle(new Purchase(500));     // → TeamLead
lead.handle(new Purchase(8_000));   // → Manager
lead.handle(new Purchase(500_000)); // → not handled`,
    classDiagram: {
      width: 590, height: 290,
      nodes: [
        { id: "ApprovalHandler", type: "abstract", x: 205, y: 20,
          fields:  ["- next: ApprovalHandler"],
          methods: ["+ setNext(h): ApprovalHandler", "+ handle(p): void", "# passToNext(p): void"] },
        { id: "TeamLeadHandler", type: "class", x: 20, y: 195,
          methods: ["+ handle(p: Purchase): void"] },
        { id: "ManagerHandler", type: "class", x: 210, y: 195,
          methods: ["+ handle(p: Purchase): void"] },
        { id: "DirectorHandler", type: "class", x: 400, y: 195,
          methods: ["+ handle(p: Purchase): void"] },
      ],
      edges: [
        { from: "TeamLeadHandler",  to: "ApprovalHandler", type: "extends" },
        { from: "ManagerHandler",   to: "ApprovalHandler", type: "extends" },
        { from: "DirectorHandler",  to: "ApprovalHandler", type: "extends" },
        { from: "ApprovalHandler",  to: "ApprovalHandler", type: "aggregation", label: "next" },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Command",
    slug: "command",
    category: "Behavioral",
    priority: "Important",
    tagline: "Encapsulate a request as an object",
    quickSummary: "Turns a method call into a standalone Command object with execute() and undo() methods. Enables queuing, logging, and undo/redo. Classic use: text editor — every keystroke is a Command stored in a history stack. Also used in task queues and schedulers.",
    usageSignal: "You need undo/redo, queuing, logging, or scheduling of operations",
    watchOut: "Can produce many tiny Command classes. For simple cases without undo, plain lambdas or method references are cleaner.",
    definition:
      "Encapsulates a request as an object, letting you parameterise clients with different requests, queue or log operations, and support undoable actions.",
    whenToUse: [
      "You need undo/redo functionality",
      "Operations must be queued, scheduled, or logged",
      "Decoupling the invoker of an operation from the object that performs it",
    ],
    howToThink: [
      "A Command object = the action + its parameters + the receiver.",
      "Invoker calls `command.execute()` without knowing what it does.",
      "Undo: implement `undo()` in each Command — Invoker keeps a history stack.",
      "Macros: store a List<Command> and execute them in sequence.",
    ],
    realWorldExamples: [
      "javax.swing.Action — encapsulates a UI action (icon, name, logic) shared by both a menu item and a toolbar button; one object, multiple invokers",
      "java.util.concurrent.ExecutorService.submit(Runnable) — queues Runnable/Callable command objects for async execution",
      "Database transaction scripts — each SQL DML can be wrapped in a Command with execute() and rollback(), enabling transactional undo",
      "Git commits — each commit is an immutable command snapshot; git revert is the undo() applied to HEAD",
    ],
    pros: [
      "Undo/redo support through command history",
      "Queue and schedule operations transparently",
      "Decouples the invoker from the receiver",
    ],
    cons: [
      "Lots of small Command classes for each action",
      "Command objects can grow complex if they manage their own undo state",
    ],
    badCode: `// ✗ Button directly calls specific editor methods — no undo, no reuse
public class CopyButton {
    private TextEditor editor;
    public void click() { editor.copySelectedText(); }  // tightly coupled
}
public class PasteButton {
    private TextEditor editor;
    public void click() { editor.pasteText(); }  // can't reuse logic, no history
}`,
    goodCode: `// ✓ Command pattern
public interface Command {
    void execute();
    void undo();
}

// Receiver — knows how to perform the actual work
public class TextEditor {
    private StringBuilder text = new StringBuilder();
    private String clipboard = "";

    public void copy(String selected) { clipboard = selected; }
    public void paste()               { text.append(clipboard); }
    public void delete(int len)       { text.delete(text.length() - len, text.length()); }
}

// Concrete commands
public class PasteCommand implements Command {
    private final TextEditor editor;
    private final int pastedLength;

    public PasteCommand(TextEditor e, int len) { this.editor = e; this.pastedLength = len; }
    public void execute() { editor.paste(); }
    public void undo()    { editor.delete(pastedLength); }
}

// Invoker — executes commands and maintains undo history
public class CommandHistory {
    private final Deque<Command> history = new ArrayDeque<>();

    public void executeAndRecord(Command cmd) {
        cmd.execute();
        history.push(cmd);
    }

    public void undo() {
        if (!history.isEmpty()) history.pop().undo();
    }
}

// Usage
TextEditor editor = new TextEditor();
CommandHistory history = new CommandHistory();

history.executeAndRecord(new PasteCommand(editor, 5));
history.undo(); // reverts the paste`,
    classDiagram: {
      width: 620, height: 340,
      nodes: [
        { id: "Command", type: "interface", x: 220, y: 20,
          methods: ["+ execute(): void", "+ undo(): void"] },
        { id: "PasteCommand", type: "class", x: 20, y: 175,
          fields:  ["- editor: TextEditor", "- pastedLen: int"],
          methods: ["+ execute(): void", "+ undo(): void"] },
        { id: "DeleteCommand", type: "class", x: 215, y: 175,
          fields:  ["- editor: TextEditor"],
          methods: ["+ execute(): void", "+ undo(): void"] },
        { id: "CommandHistory", type: "class", x: 450, y: 20,
          fields:  ["- history: Deque<Command>"],
          methods: ["+ executeAndRecord(cmd): void", "+ undo(): void"] },
        { id: "TextEditor", type: "class", x: 450, y: 175,
          methods: ["+ paste(): void", "+ delete(len): void"] },
      ],
      edges: [
        { from: "PasteCommand",   to: "Command",    type: "implements" },
        { from: "DeleteCommand",  to: "Command",    type: "implements" },
        { from: "CommandHistory", to: "Command",    type: "aggregation", label: "history" },
        { from: "PasteCommand",   to: "TextEditor", type: "uses" },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Observer",
    slug: "observer",
    category: "Behavioral",
    priority: "Important",
    tagline: "Notify many objects when one changes state",
    quickSummary: "Defines a one-to-many dependency: when the subject (publisher) changes state, all registered observers (subscribers) are notified automatically. Foundation of every event system, MVC update cycle, and reactive stream. Java's EventListener, Android click listeners, and RxJava all use this.",
    usageSignal: "Multiple parts of the system must react whenever one object's state changes",
    watchOut: "Memory leaks if observers aren't deregistered. Cascading updates can be hard to trace. Update order is not guaranteed.",
    definition:
      "Defines a one-to-many dependency so that when one object (Subject) changes state, all its dependents (Observers) are notified and updated automatically.",
    whenToUse: [
      "Changes to one object require changing others, and you don't know how many objects need to change",
      "Event systems, UI data-binding, reactive streams",
      "Decoupling the publisher from its subscribers",
    ],
    howToThink: [
      "Subject maintains a list of Observer references and calls update() on all when state changes.",
      "Observers register themselves with the Subject at runtime — loose coupling.",
      "Push model: Subject sends data in update(). Pull model: Observer queries Subject after notification.",
      "Java's java.util.Observable or Guava EventBus are standard implementations.",
    ],
    realWorldExamples: [
      "Java Swing event listeners — JButton.addActionListener(l) subscribes an observer; the button notifies all listeners on click",
      "Spring ApplicationEvent / ApplicationListener — services publish domain events; any number of listeners react without coupling",
      "RxJava / Project Reactor — Observable.subscribe() registers observers; upstream data changes push values downstream automatically",
      "Model-View binding in Android (LiveData / StateFlow) — UI observes a LiveData; ViewModel pushes state changes automatically",
    ],
    pros: [
      "Loose coupling — Subject doesn't know observer concrete types",
      "Support for broadcast communication",
      "Observers can be added/removed at runtime",
    ],
    cons: [
      "Unexpected updates if observers trigger Subject changes (cascade)",
      "Memory leaks if observers are never unregistered",
    ],
    badCode: `// ✗ Subject knows every concrete subscriber — cannot add new ones without modifying it
public class StockMarket {
    private double price;
    private StockApp app;
    private EmailAlert email;
    private SmsAlert   sms;

    public void setPrice(double price) {
        this.price = price;
        app.updateDisplay(price);   // tightly coupled to every consumer
        email.sendAlert(price);
        sms.sendAlert(price);       // add Slack? modify this class again
    }
}`,
    goodCode: `// ✓ Observer pattern
public interface StockObserver {
    void update(String symbol, double price);
}

public class StockMarket {
    private final String symbol;
    private double price;
    private final List<StockObserver> observers = new ArrayList<>();

    public StockMarket(String symbol) { this.symbol = symbol; }

    public void subscribe(StockObserver o)   { observers.add(o); }
    public void unsubscribe(StockObserver o) { observers.remove(o); }

    public void setPrice(double price) {
        this.price = price;
        notifyObservers();
    }

    private void notifyObservers() {
        observers.forEach(o -> o.update(symbol, price));
    }
}

// Concrete observers — Subject doesn't know these classes exist
public class StockApp implements StockObserver {
    public void update(String symbol, double price) {
        System.out.println("App: " + symbol + " is now $" + price);
    }
}
public class EmailAlert implements StockObserver {
    public void update(String symbol, double price) {
        System.out.println("Email: " + symbol + " alert at $" + price);
    }
}

// Wire up at runtime
StockMarket aapl = new StockMarket("AAPL");
aapl.subscribe(new StockApp());
aapl.subscribe(new EmailAlert());
aapl.setPrice(185.50); // both observers notified`,
    classDiagram: {
      width: 620, height: 340,
      nodes: [
        { id: "StockMarket", type: "class", x: 20, y: 20,
          fields:  ["- observers: List<StockObserver>", "- price: double"],
          methods: ["+ subscribe(o): void", "+ unsubscribe(o): void", "+ setPrice(p): void"] },
        { id: "StockObserver", type: "interface", x: 430, y: 20,
          methods: ["+ update(symbol, price): void"] },
        { id: "StockApp",   type: "class", x: 430, y: 190,
          methods: ["+ update(sym, price): void"] },
        { id: "EmailAlert", type: "class", x: 430, y: 265,
          methods: ["+ update(sym, price): void"] },
      ],
      edges: [
        { from: "StockMarket", to: "StockObserver", type: "aggregation", label: "notifies *" },
        { from: "StockApp",    to: "StockObserver", type: "implements" },
        { from: "EmailAlert",  to: "StockObserver", type: "implements" },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Strategy",
    slug: "strategy",
    category: "Behavioral",
    priority: "Important",
    tagline: "Swap algorithms at runtime",
    quickSummary: "Encapsulates a family of algorithms behind a common interface and makes them interchangeable. Replace giant if-else or switch chains with pluggable Strategy objects. Common use: sorting strategies, payment methods, compression algorithms.",
    usageSignal: "You have multiple ways to do the same task and need to switch between them at runtime",
    watchOut: "Clients must know which strategies exist in order to choose one. Overkill if there are only 2 variants that never change.",
    definition:
      "Defines a family of algorithms, encapsulates each one, and makes them interchangeable so the algorithm can vary independently from clients that use it.",
    whenToUse: [
      "Multiple variants of an algorithm exist and you want to switch them at runtime",
      "You want to eliminate conditionals that select behaviour based on type",
      "Related classes differ only in their behaviour",
    ],
    howToThink: [
      "Extract the varying behaviour into a Strategy interface with a single method.",
      "Context holds a Strategy reference — inject it via constructor or setter.",
      "Each concrete Strategy is a class that implements one specific algorithm.",
      "Prefer Strategy over template literals of conditionals that change behaviour.",
    ],
    realWorldExamples: [
      "java.util.Comparator<T> — Collections.sort(list, comparator) injects a pluggable sort strategy; swap natural vs reverse vs custom order at call time",
      "Java Swing LayoutManager — FlowLayout, BorderLayout, GridBagLayout are strategy objects assigned to a container",
      "Spring ResourceLoader — ClassPathResource vs FileSystemResource vs UrlResource are resource-access strategies injected into components",
      "Payment gateways — a checkout service holds a PaymentStrategy; swap Stripe, PayPal, or Razorpay without touching checkout logic",
    ],
    pros: [
      "Algorithms are interchangeable at runtime",
      "Eliminates large conditionals",
      "Open/Closed: add new strategies without changing Context",
    ],
    cons: [
      "Clients must be aware of the different strategies to pick the right one",
      "Overkill when there are only 2-3 rarely changing variants",
    ],
    badCode: `// ✗ Context owns the algorithm — changing sort logic requires modifying this class
public class DataProcessor {
    public List<Integer> sort(List<Integer> data, String type) {
        if (type.equals("bubble"))  { /* bubble sort inline */ }
        else if (type.equals("quick")) { /* quick sort inline */ }
        else if (type.equals("merge")) { /* merge sort inline */ }
        return data;
    }
}`,
    goodCode: `// ✓ Strategy pattern
public interface SortStrategy {
    List<Integer> sort(List<Integer> data);
}

public class BubbleSortStrategy implements SortStrategy {
    public List<Integer> sort(List<Integer> data) {
        // bubble sort implementation
        return data;
    }
}
public class QuickSortStrategy implements SortStrategy {
    public List<Integer> sort(List<Integer> data) {
        // quick sort implementation
        return data;
    }
}
public class MergeSortStrategy implements SortStrategy {
    public List<Integer> sort(List<Integer> data) {
        // merge sort implementation
        return data;
    }
}

// Context holds a Strategy — knows nothing about its internals
public class DataProcessor {
    private SortStrategy strategy;

    public DataProcessor(SortStrategy strategy) { this.strategy = strategy; }
    public void setStrategy(SortStrategy s)     { this.strategy = s; }

    public List<Integer> process(List<Integer> data) {
        return strategy.sort(data);
    }
}

// Switch algorithms at runtime
DataProcessor dp = new DataProcessor(new QuickSortStrategy());
dp.process(data);

dp.setStrategy(new MergeSortStrategy()); // swap — no code change in DataProcessor
dp.process(data);`,
    classDiagram: {
      width: 580, height: 270,
      nodes: [
        { id: "DataProcessor", type: "class", x: 20, y: 75,
          fields:  ["- strategy: SortStrategy"],
          methods: ["+ setStrategy(s): void", "+ process(data): List"] },
        { id: "SortStrategy", type: "interface", x: 290, y: 20,
          methods: ["+ sort(data: List): List"] },
        { id: "BubbleSortStrategy", type: "class", x: 185, y: 182,
          methods: ["+ sort(data): List"] },
        { id: "QuickSortStrategy",  type: "class", x: 385, y: 182,
          methods: ["+ sort(data): List"] },
      ],
      edges: [
        { from: "DataProcessor",      to: "SortStrategy",   type: "aggregation", label: "uses" },
        { from: "BubbleSortStrategy", to: "SortStrategy",   type: "implements" },
        { from: "QuickSortStrategy",  to: "SortStrategy",   type: "implements" },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Template Method",
    slug: "template-method",
    category: "Behavioral",
    priority: "Important",
    tagline: "Fix the skeleton; subclasses fill in the steps",
    quickSummary: "Defines the overall algorithm structure in a base class, with specific steps delegated to subclasses. The parent controls the sequence; children just override the variable parts. Think data import: parse → validate → transform → save. The sequence is fixed; each format subclass overrides parse().",
    usageSignal: "Multiple subclasses share the same algorithm structure but differ in specific steps",
    watchOut: "Inheritance-based — if subclasses don't follow the contract, the algorithm breaks. Prefer Strategy (composition) for more flexibility.",
    definition:
      "Defines the skeleton of an algorithm in a base class, deferring some steps to subclasses without changing the algorithm's overall structure.",
    whenToUse: [
      "Multiple classes share the same algorithm skeleton but differ in specific steps",
      "You want to control which parts of the algorithm subclasses can override",
      "Avoid code duplication for the common steps",
    ],
    howToThink: [
      "Pull the common structure into an abstract base class as a `templateMethod()` calling hook methods.",
      "Mark the invariant steps `final` to prevent overriding.",
      "Subclasses override only the abstract hook methods — not the template method itself.",
      "Hooks can have default (no-op) implementations if some subclasses don't need them.",
    ],
    realWorldExamples: [
      "javax.servlet.HttpServlet — service() is the template method; override doGet() / doPost() hooks to supply your logic",
      "Spring JdbcTemplate — execute() manages connection, statement, and exception handling; you supply the StatementCallback with your SQL",
      "Java AbstractList / AbstractMap — provide a skeletal implementation; subclasses only override get() and size() to get a full collection",
      "JUnit 4 @Before / @After — the test runner calls setUp → test → tearDown in a fixed template; your subclass fills in each step",
    ],
    pros: [
      "Eliminates code duplication for the invariant parts",
      "Hollywood Principle: don't call us, we'll call you — base class controls flow",
      "Easy to add new variants by subclassing",
    ],
    cons: [
      "Template method in base class can become complex as more steps are added",
      "Subclasses must know which hooks to override — fragile base class problem",
    ],
    badCode: `// ✗ Chess and Cricket duplicate the game-loop structure
public class Chess {
    public void play() {
        System.out.println("Chess: setup");
        while (!isOver()) {
            System.out.println("Chess: player move");
        }
        System.out.println("Chess: print winner");
    }
}
public class Cricket {
    public void play() {
        System.out.println("Cricket: setup");     // duplicated structure
        while (!isOver()) {
            System.out.println("Cricket: player move");
        }
        System.out.println("Cricket: print winner");
    }
}`,
    goodCode: `// ✓ Template Method pattern
public abstract class Game {
    // Template method — final so subclasses cannot change the skeleton
    public final void play() {
        initialize();
        while (!isDone()) {
            makeMove();
        }
        printWinner();
    }

    protected abstract void initialize();
    protected abstract void makeMove();
    protected abstract boolean isDone();
    protected abstract void printWinner();
}

public class Chess extends Game {
    private int moves = 0;

    protected void initialize()  { System.out.println("Chess: place pieces"); }
    protected void makeMove()    { System.out.println("Chess: move " + ++moves); }
    protected boolean isDone()   { return moves >= 3; }
    protected void printWinner() { System.out.println("Chess: White wins"); }
}

public class Cricket extends Game {
    private int overs = 0;

    protected void initialize()  { System.out.println("Cricket: toss"); }
    protected void makeMove()    { System.out.println("Cricket: over " + ++overs); }
    protected boolean isDone()   { return overs >= 20; }
    protected void printWinner() { System.out.println("Cricket: Team A wins"); }
}

// game loop defined ONCE in Game.play()
new Chess().play();
new Cricket().play();`,
    classDiagram: {
      width: 520, height: 360,
      nodes: [
        { id: "Game", type: "abstract", x: 170, y: 20,
          methods: ["+ play(): void  «final»", "# initialize(): void",
                    "# makeMove(): void", "# isDone(): boolean",
                    "# printWinner(): void"] },
        { id: "Chess",   type: "class", x: 60, y: 232,
          methods: ["# initialize(): void", "# makeMove(): void", "# isDone(): boolean"] },
        { id: "Cricket", type: "class", x: 285, y: 232,
          methods: ["# initialize(): void", "# makeMove(): void", "# isDone(): boolean"] },
      ],
      edges: [
        { from: "Chess",   to: "Game", type: "extends" },
        { from: "Cricket", to: "Game", type: "extends" },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "State",
    slug: "state",
    category: "Behavioral",
    priority: "Good to Have",
    tagline: "Object behavior changes with its internal state",
    quickSummary: "Allows an object to alter its behavior when its state changes. State-specific behavior lives in State objects, not in a giant if-else. A vending machine is the classic example: insert coin → idle becomes has-coin; press button → dispenses or shows error depending on stock.",
    usageSignal: "An object's behavior depends heavily on which state it's currently in",
    watchOut: "Many states means many classes. For simple 2–3 state machines, a plain enum + switch may be cleaner.",
    definition:
      "Allows an object to alter its behaviour when its internal state changes, appearing to change its class.",
    whenToUse: [
      "An object's behaviour depends on its state and must change at runtime",
      "Operations have large multi-part conditional statements that depend on the object's state",
      "Modelling finite state machines: ATM, vending machine, order lifecycle",
    ],
    howToThink: [
      "Identify all states an object can be in and what transitions are valid.",
      "Model each state as a class implementing a State interface.",
      "Context holds a current State reference and delegates all behaviour to it.",
      "States trigger transitions by replacing Context's current state: `context.setState(new NextState())`.",
    ],
    realWorldExamples: [
      "Java Thread lifecycle — NEW → RUNNABLE → BLOCKED / WAITING → TIMED_WAITING → TERMINATED; JVM manages state transitions internally",
      "TCP connection — CLOSED → SYN_SENT → ESTABLISHED → FIN_WAIT → TIME_WAIT; each state has its own response to segment events",
      "E-commerce order lifecycle — PENDING → CONFIRMED → SHIPPED → DELIVERED → RETURNED; each state allows different operations",
      "Media player (VLC, Spotify) — STOPPED / PLAYING / PAUSED states respond differently to play, pause, and stop commands",
    ],
    pros: [
      "Organises state-specific code into classes — easy to add new states",
      "Eliminates large if/switch on state",
      "Makes transitions explicit and self-documenting",
    ],
    cons: [
      "Many small state classes if the state machine is large",
      "State classes can become coupled to each other through transitions",
    ],
    badCode: `// ✗ All state logic in one class — grows unbounded with new states
public class VendingMachine {
    private String state = "IDLE";

    public void insertCoin() {
        if (state.equals("IDLE"))            { state = "HAS_COIN"; }
        else if (state.equals("HAS_COIN"))   { System.out.println("Coin already inserted"); }
        else if (state.equals("DISPENSING")) { System.out.println("Dispensing in progress"); }
    }
    public void selectProduct() {
        if (state.equals("HAS_COIN"))        { state = "DISPENSING"; }
        else                                  { System.out.println("Insert coin first"); }
    }
    // Every new state = modify every method in this class`,
    goodCode: `// ✓ State pattern
public interface VendingState {
    void insertCoin(VendingMachine ctx);
    void selectProduct(VendingMachine ctx);
    void dispense(VendingMachine ctx);
}

public class VendingMachine {
    private VendingState state;
    public VendingMachine() { this.state = new IdleState(); }
    public void setState(VendingState s) { this.state = s; }

    public void insertCoin()    { state.insertCoin(this); }
    public void selectProduct() { state.selectProduct(this); }
    public void dispense()      { state.dispense(this); }
}

public class IdleState implements VendingState {
    public void insertCoin(VendingMachine ctx) {
        System.out.println("Coin accepted");
        ctx.setState(new HasCoinState());  // transition
    }
    public void selectProduct(VendingMachine ctx) { System.out.println("Insert coin first"); }
    public void dispense(VendingMachine ctx)      { System.out.println("No coin inserted"); }
}

public class HasCoinState implements VendingState {
    public void insertCoin(VendingMachine ctx) { System.out.println("Already has a coin"); }
    public void selectProduct(VendingMachine ctx) {
        System.out.println("Product selected");
        ctx.setState(new DispensingState());
    }
    public void dispense(VendingMachine ctx) { System.out.println("Select product first"); }
}

public class DispensingState implements VendingState {
    public void insertCoin(VendingMachine ctx)    { System.out.println("Wait, dispensing"); }
    public void selectProduct(VendingMachine ctx) { System.out.println("Wait, dispensing"); }
    public void dispense(VendingMachine ctx) {
        System.out.println("Dispensing product...");
        ctx.setState(new IdleState());  // back to idle
    }
}`,
    classDiagram: {
      width: 620, height: 315,
      nodes: [
        { id: "VendingMachine", type: "class", x: 20, y: 80,
          fields:  ["- state: VendingState"],
          methods: ["+ insertCoin(): void", "+ selectProduct(): void", "+ dispense(): void"] },
        { id: "VendingState", type: "interface", x: 335, y: 20,
          methods: ["+ insertCoin(ctx): void", "+ selectProduct(ctx): void", "+ dispense(ctx): void"] },
        { id: "IdleState",       type: "class", x: 20,  y: 228,
          methods: ["+ insertCoin(ctx): void"] },
        { id: "HasCoinState",    type: "class", x: 210, y: 228,
          methods: ["+ selectProduct(ctx): void"] },
        { id: "DispensingState", type: "class", x: 430, y: 228,
          methods: ["+ dispense(ctx): void"] },
      ],
      edges: [
        { from: "VendingMachine",  to: "VendingState",   type: "aggregation", label: "current" },
        { from: "IdleState",       to: "VendingState",   type: "implements" },
        { from: "HasCoinState",    to: "VendingState",   type: "implements" },
        { from: "DispensingState", to: "VendingState",   type: "implements" },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Mediator",
    slug: "mediator",
    category: "Behavioral",
    priority: "Good to Have",
    tagline: "Centralize communication to reduce coupling",
    quickSummary: "Reduces chaotic many-to-many dependencies into a clean star topology through a central mediator. Objects no longer talk to each other directly — they go through the mediator. Air traffic control: planes communicate only with the tower, never with each other.",
    usageSignal: "Many objects communicate in complex ways, creating a tangled web of dependencies",
    watchOut: "The mediator itself can become a god class that knows everything. Keep it focused on coordination, not business logic.",
    definition:
      "Defines an object that encapsulates how a set of objects interact, promoting loose coupling by preventing objects from referring to each other directly.",
    whenToUse: [
      "Many objects communicate in complex, hard-to-maintain ways",
      "Reusing components is difficult because they reference many others",
      "Centralising communication logic in one place (chat room, air traffic control, UI form)",
    ],
    howToThink: [
      "Replace object-to-object references with object-to-mediator references.",
      "Each colleague only knows the Mediator — it sends events to it.",
      "The Mediator knows all colleagues and routes events to the right ones.",
      "Result: N*(N-1) direct links become N links to the mediator.",
    ],
    realWorldExamples: [
      "Spring MVC DispatcherServlet — central mediator routing every HTTP request to the right controller, view resolver, and exception handler",
      "Air Traffic Control — aircraft don't communicate directly; all clearances go through ATC which coordinates traffic between them",
      "Chat room server — users send messages to the server (mediator); it routes them to the correct recipients without user-to-user coupling",
      "java.util.concurrent.Executor — decouples task submitters from worker threads; the executor manages scheduling and queuing centrally",
    ],
    pros: [
      "Decouples colleagues — they no longer reference each other",
      "Centralises interaction logic — easy to change routing",
      "Simplifies object protocols",
    ],
    cons: [
      "Mediator can become a God object if it handles too much logic",
      "Centralisation can make the mediator itself complex and hard to test",
    ],
    badCode: `// ✗ Every UI component directly references every other — spaghetti
public class LoginForm {
    private UsernameField usernameField;
    private PasswordField passwordField;
    private LoginButton   loginButton;
    private ErrorLabel    errorLabel;

    public void onUsernameChange() {
        loginButton.setEnabled(
            !usernameField.isEmpty() && !passwordField.isEmpty()
        );
        errorLabel.clear();    // LoginForm knows about 3 other widgets
    }
}`,
    goodCode: `// ✓ Mediator pattern
public interface DialogMediator {
    void notify(Component sender, String event);
}

public abstract class Component {
    protected DialogMediator mediator;
    public Component(DialogMediator m) { this.mediator = m; }
}

public class TextField extends Component {
    private String value = "";
    public TextField(DialogMediator m) { super(m); }
    public void   setValue(String v) { value = v; mediator.notify(this, "changed"); }
    public String getValue()         { return value; }
    public boolean isEmpty()         { return value.isBlank(); }
}

public class Button extends Component {
    private boolean enabled = false;
    public Button(DialogMediator m) { super(m); }
    public void setEnabled(boolean e) { this.enabled = e; }
    public void click()               { if (enabled) mediator.notify(this, "click"); }
}

// Mediator owns all the interaction logic
public class LoginDialog implements DialogMediator {
    private TextField username, password;
    private Button    loginBtn;

    public LoginDialog() {
        username = new TextField(this);
        password = new TextField(this);
        loginBtn = new Button(this);
    }

    public void notify(Component sender, String event) {
        if (event.equals("changed")) {
            loginBtn.setEnabled(!username.isEmpty() && !password.isEmpty());
        } else if (sender == loginBtn && event.equals("click")) {
            System.out.println("Logging in as " + username.getValue());
        }
    }
}`,
    classDiagram: {
      width: 600, height: 350,
      nodes: [
        { id: "DialogMediator", type: "interface", x: 215, y: 20,
          methods: ["+ notify(sender, event): void"] },
        { id: "LoginDialog", type: "class", x: 20, y: 185,
          fields:  ["- username: TextField", "- loginBtn: Button"],
          methods: ["+ notify(sender, event): void"] },
        { id: "Component", type: "abstract", x: 415, y: 20,
          fields:  ["# mediator: DialogMediator"],
          methods: [] },
        { id: "TextField", type: "class", x: 415, y: 185,
          methods: ["+ setValue(v): void", "+ isEmpty(): boolean"] },
        { id: "Button",    type: "class", x: 415, y: 275,
          methods: ["+ click(): void", "+ setEnabled(e): void"] },
      ],
      edges: [
        { from: "LoginDialog", to: "DialogMediator", type: "implements" },
        { from: "TextField",   to: "Component",      type: "extends" },
        { from: "Button",      to: "Component",      type: "extends" },
        { from: "Component",   to: "DialogMediator", type: "aggregation", label: "knows" },
        { from: "LoginDialog", to: "Component",      type: "aggregation", label: "manages" },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Memento",
    slug: "memento",
    category: "Behavioral",
    priority: "Good to Have",
    tagline: "Snapshot state so you can restore it later",
    quickSummary: "Captures an object's internal state in a Memento object without violating encapsulation, so it can be restored later. The Originator creates the memento; the Caretaker stores it. Classic uses: undo in text editors, game save/load, transaction rollback.",
    usageSignal: "You need undo/redo or snapshot/restore without exposing internal state",
    watchOut: "Storing many mementos is memory-intensive. Limit history depth or use differential snapshots for large objects.",
    definition:
      "Captures and externalises an object's internal state without violating encapsulation so the object can be restored to that state later.",
    whenToUse: [
      "You need undo/redo or snapshot/restore functionality",
      "Exposing the internal state for saving would violate encapsulation",
      "Transaction rollback: save state before a risky operation",
    ],
    howToThink: [
      "Originator creates a Memento containing a snapshot of its state.",
      "Memento is opaque — only the Originator can read its contents.",
      "Caretaker stores Mementos without inspecting them; triggers save/restore on the Originator.",
      "Classic undo: push a Memento before each action; pop and restore on undo.",
    ],
    realWorldExamples: [
      "IDE Ctrl+Z / undo history (IntelliJ, VS Code) — editor saves a Memento snapshot before every edit; undo pops and restores state",
      "Database SAVEPOINT — SAVEPOINT sp1 captures transaction state; ROLLBACK TO sp1 restores it without losing the outer transaction",
      "Game save/load system — serialized game state (position, inventory, quest flags) written as a Memento; loaded on restore",
      "Browser back button — the browser stores a Memento of page state (scroll position, form values) to restore on navigation",
    ],
    pros: [
      "Snapshots without breaking encapsulation",
      "Simplifies Originator — undo history managed externally",
    ],
    cons: [
      "Mementos can consume significant memory if state is large or history is long",
      "Dynamic languages may struggle to enforce Memento opacity",
    ],
    badCode: `// ✗ Editor exposes its state publicly so external code can snapshot it
public class TextEditor {
    public StringBuilder text = new StringBuilder();  // public — breaks encapsulation
    public int cursorPos;

    public void type(String s) { text.insert(cursorPos, s); cursorPos += s.length(); }
}

// Caretaker reads internals directly — tight coupling
String savedText   = editor.text.toString();
int    savedCursor = editor.cursorPos;
// ... later restore by writing directly to public fields`,
    goodCode: `// ✓ Memento pattern
// Memento — immutable snapshot; only TextEditor can create/read it
public class EditorMemento {
    private final String text;
    private final int    cursorPos;

    EditorMemento(String text, int cursorPos) {  // package-private: only Originator accesses
        this.text      = text;
        this.cursorPos = cursorPos;
    }
    String getText()   { return text; }
    int    getCursor() { return cursorPos; }
}

// Originator — creates and restores Mementos
public class TextEditor {
    private StringBuilder text      = new StringBuilder();
    private int           cursorPos = 0;

    public void type(String s) { text.insert(cursorPos, s); cursorPos += s.length(); }

    public EditorMemento save() {
        return new EditorMemento(text.toString(), cursorPos);
    }

    public void restore(EditorMemento m) {
        text      = new StringBuilder(m.getText());
        cursorPos = m.getCursor();
    }
}

// Caretaker — manages history without seeing internal state
public class EditorHistory {
    private final Deque<EditorMemento> history = new ArrayDeque<>();

    public void push(TextEditor e)  { history.push(e.save()); }
    public void undo(TextEditor e)  { if (!history.isEmpty()) e.restore(history.pop()); }
}

// Usage
TextEditor editor  = new TextEditor();
EditorHistory hist = new EditorHistory();

editor.type("Hello");
hist.push(editor);         // snapshot

editor.type(", World");
hist.push(editor);

hist.undo(editor);         // back to "Hello"`,
    classDiagram: {
      width: 620, height: 260,
      nodes: [
        { id: "TextEditor", type: "class", x: 20, y: 50,
          fields:  ["- text: StringBuilder", "- cursorPos: int"],
          methods: ["+ type(s): void", "+ save(): EditorMemento", "+ restore(m): void"] },
        { id: "EditorMemento", type: "class", x: 240, y: 20,
          fields:  ["- text: String", "- cursorPos: int"],
          methods: ["~ getText(): String", "~ getCursor(): int"] },
        { id: "EditorHistory", type: "class", x: 440, y: 75,
          fields:  ["- history: Deque<EditorMemento>"],
          methods: ["+ push(e: TextEditor): void", "+ undo(e: TextEditor): void"] },
      ],
      edges: [
        { from: "TextEditor",    to: "EditorMemento", type: "composition", label: "creates" },
        { from: "EditorHistory", to: "EditorMemento", type: "aggregation", label: "stores" },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Iterator",
    slug: "iterator",
    category: "Behavioral",
    priority: "Good to Have",
    tagline: "Traverse a collection without exposing its internals",
    quickSummary: "Provides a standard way to access collection elements sequentially without knowing the underlying data structure. Java's for-each loop uses this pattern everywhere — every Iterable returns an Iterator. Lets you swap from ArrayList to LinkedList without changing traversal code.",
    usageSignal: "You want uniform traversal over different collection types without exposing internals",
    watchOut: "Modern languages give you iterators for free. Avoid hand-rolling unless you have a custom data structure.",
    definition:
      "Provides a way to sequentially access elements of a collection without exposing its underlying representation.",
    whenToUse: [
      "You need a standard traversal interface for different collection types",
      "You want to traverse a collection without exposing its internals (array, tree, graph)",
      "Support multiple simultaneous, independent traversals of the same collection",
    ],
    howToThink: [
      "Define an Iterator interface: `hasNext()` and `next()`.",
      "The concrete collection creates and returns its own Iterator implementation.",
      "Client only uses the Iterator interface — decoupled from the collection type.",
      "Java's Iterable + for-each is the canonical built-in implementation.",
    ],
    realWorldExamples: [
      "java.util.Iterator<T> — every Java collection (ArrayList, HashSet, LinkedList) returns an Iterator; for-each desugars to hasNext()/next() calls",
      "Java 8 Stream API — Stream.iterator() exposes a lazy iterator over potentially infinite sequences",
      "Spring Data Page<T> / Slice<T> — paginated iterator over large database result sets, fetching one page at a time",
      "Database cursors — SQL CURSOR / ResultSet is a server-side iterator; the client calls next() to stream rows without loading all into memory",
    ],
    pros: [
      "Single Responsibility: traversal logic separate from collection",
      "Open/Closed: new iterators without changing the collection",
      "Multiple iterators can traverse the same collection simultaneously",
    ],
    cons: [
      "Overkill for simple collections — java.util already provides this",
      "Stateful iterator can be tricky if the collection is modified during traversal",
    ],
    badCode: `// ✗ Client depends on SongPlaylist's internal array — breaks if we switch to LinkedList
public class Client {
    public void printAll(SongPlaylist playlist) {
        for (int i = 0; i < playlist.songs.length; i++) { // exposes internal array
            System.out.println(playlist.songs[i]);
        }
    }
}`,
    goodCode: `// ✓ Iterator pattern
public interface Iterator<T> {
    boolean hasNext();
    T next();
}

public interface IterableCollection<T> {
    Iterator<T> createIterator();
}

// Concrete collection
public class SongPlaylist implements IterableCollection<String> {
    private final List<String> songs = new ArrayList<>();

    public void add(String song) { songs.add(song); }

    public Iterator<String> createIterator() {
        return new PlaylistIterator(songs);
    }
}

// Concrete iterator — knows the internals so the client doesn't have to
public class PlaylistIterator implements Iterator<String> {
    private final List<String> songs;
    private int index = 0;

    public PlaylistIterator(List<String> songs) { this.songs = songs; }

    public boolean hasNext() { return index < songs.size(); }
    public String  next()    { return songs.get(index++); }
}

// Client — doesn't know if collection is List, array, or tree
Iterator<String> it = new SongPlaylist().createIterator();
while (it.hasNext()) {
    System.out.println(it.next());
}`,
    classDiagram: {
      width: 580, height: 320,
      nodes: [
        { id: "IterableCollection", type: "interface", x: 20, y: 20,
          methods: ["+ createIterator(): Iterator"] },
        { id: "SongPlaylist", type: "class", x: 20, y: 165,
          fields:  ["- songs: List<String>"],
          methods: ["+ add(song): void", "+ createIterator(): Iterator"] },
        { id: "Iterator", type: "interface", x: 390, y: 20,
          methods: ["+ hasNext(): boolean", "+ next(): T"] },
        { id: "PlaylistIterator", type: "class", x: 365, y: 165,
          fields:  ["- songs: List<String>", "- index: int"],
          methods: ["+ hasNext(): boolean", "+ next(): String"] },
      ],
      edges: [
        { from: "SongPlaylist",     to: "IterableCollection", type: "implements" },
        { from: "PlaylistIterator", to: "Iterator",           type: "implements" },
        { from: "SongPlaylist",     to: "PlaylistIterator",   type: "composition", label: "creates" },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Visitor",
    slug: "visitor",
    category: "Behavioral",
    priority: "Rarely Used",
    tagline: "Add operations to a class hierarchy without modifying it",
    quickSummary: "Lets you add new operations to an existing class hierarchy without changing those classes. Each element accepts a Visitor and the visitor dispatches to the right method. Classic use: compiler AST traversal — TypeCheckVisitor and CodeGenVisitor both walk the same tree.",
    usageSignal: "You need many distinct operations on a stable element hierarchy",
    watchOut: "Adding a new element type requires updating every existing Visitor — extremely rigid to hierarchy changes. Only use when the hierarchy is truly stable.",
    definition:
      "Lets you add new operations to a class hierarchy without modifying the classes, by separating the operation into a separate Visitor object.",
    whenToUse: [
      "You need many distinct, unrelated operations on a stable object structure",
      "Adding new operations frequently but the class hierarchy rarely changes",
      "Operations accumulate logic that doesn't belong inside the element classes",
    ],
    howToThink: [
      "Element interface declares `accept(Visitor v)` — called by the client.",
      "Each concrete Element calls `visitor.visit(this)` — this is double dispatch.",
      "Visitor interface declares one `visit()` overload per concrete Element type.",
      "Add a new operation = new Visitor class; no element classes touched.",
    ],
    realWorldExamples: [
      "Java compiler AST passes — each compiler phase (type checking, code generation, optimisation) is a Visitor traversing the syntax tree",
      "javax.lang.model ElementVisitor — annotation processors implement ElementVisitor to inspect type, method, and field elements",
      "Apache Calcite query optimiser — rewrite rules are Visitors that traverse and transform relational algebra nodes",
      "HTML sanitisers (OWASP AntiSamy, jsoup Whitelist) — a Visitor walks the DOM tree and strips disallowed nodes/attributes",
    ],
    pros: [
      "Open/Closed: add operations without changing elements",
      "Related operations are grouped in one Visitor class",
      "Visitor accumulates state across the structure during traversal",
    ],
    cons: [
      "Adding a new Element type requires updating every Visitor",
      "Breaks encapsulation — elements may need to expose internal state to visitors",
    ],
    badCode: `// ✗ Operations mixed into element classes — adding "export" means editing all classes
public class Circle  { public double area() {/*...*/} public String serialize() {/*...*/} }
public class Square  { public double area() {/*...*/} public String serialize() {/*...*/} }
public class Triangle{ public double area() {/*...*/} public String serialize() {/*...*/} }
// Each new operation (render, export, validate) requires editing all 3 shape classes`,
    goodCode: `// ✓ Visitor pattern
public interface Shape {
    void accept(ShapeVisitor visitor);
}

public class Circle implements Shape {
    public double radius;
    public Circle(double r) { this.radius = r; }
    public void accept(ShapeVisitor v) { v.visit(this); }
}
public class Square implements Shape {
    public double side;
    public Square(double s) { this.side = s; }
    public void accept(ShapeVisitor v) { v.visit(this); }
}

// Visitor interface — one method per concrete Element
public interface ShapeVisitor {
    void visit(Circle c);
    void visit(Square s);
}

// Concrete visitor: area calculation
public class AreaVisitor implements ShapeVisitor {
    public double totalArea = 0;
    public void visit(Circle c) { totalArea += Math.PI * c.radius * c.radius; }
    public void visit(Square s) { totalArea += s.side * s.side; }
}

// Another visitor: XML export — zero changes to shapes
public class XmlExportVisitor implements ShapeVisitor {
    public void visit(Circle c) { System.out.println("<circle r=\"" + c.radius + "\"/>"); }
    public void visit(Square s) { System.out.println("<square s=\"" + s.side + "\"/>"); }
}

// Usage
List<Shape> shapes = List.of(new Circle(5), new Square(4));

AreaVisitor area = new AreaVisitor();
shapes.forEach(s -> s.accept(area));
System.out.println("Total area: " + area.totalArea);

shapes.forEach(s -> s.accept(new XmlExportVisitor()));`,
    classDiagram: {
      width: 620, height: 375,
      nodes: [
        { id: "Shape", type: "interface", x: 20, y: 20,
          methods: ["+ accept(v: ShapeVisitor): void"] },
        { id: "Circle", type: "class", x: 20, y: 165,
          fields: ["+ radius: double"], methods: ["+ accept(v): void"] },
        { id: "Square", type: "class", x: 215, y: 165,
          fields: ["+ side: double"],   methods: ["+ accept(v): void"] },
        { id: "ShapeVisitor", type: "interface", x: 430, y: 20,
          methods: ["+ visit(c: Circle): void", "+ visit(s: Square): void"] },
        { id: "AreaVisitor",      type: "class", x: 430, y: 175,
          methods: ["+ visit(c): void", "+ visit(s): void"] },
        { id: "XmlExportVisitor", type: "class", x: 430, y: 265,
          methods: ["+ visit(c): void", "+ visit(s): void"] },
      ],
      edges: [
        { from: "Circle",          to: "Shape",        type: "implements" },
        { from: "Square",          to: "Shape",        type: "implements" },
        { from: "AreaVisitor",     to: "ShapeVisitor", type: "implements" },
        { from: "XmlExportVisitor",to: "ShapeVisitor", type: "implements" },
        { from: "Shape",           to: "ShapeVisitor", type: "uses" },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Interpreter",
    slug: "interpreter",
    category: "Behavioral",
    priority: "Rarely Used",
    tagline: "Define a grammar and interpret its sentences",
    quickSummary: "Defines a class for each grammar rule, then composes those classes to interpret sentences. Each rule is a node in an expression tree. Used for simple domain-specific languages, expression evaluators, or SQL-like query builders.",
    usageSignal: "You need to interpret simple, repetitive expressions with a well-defined grammar",
    watchOut: "Doesn't scale to complex grammars. For anything non-trivial, use a parser generator (ANTLR, JavaCC) instead.",
    definition:
      "Defines a grammar for a language and provides an interpreter that uses the grammar representation to interpret sentences in that language.",
    whenToUse: [
      "You need to interpret sentences in a simple language (SQL, config DSL, boolean expressions)",
      "The grammar is simple and efficiency is not the primary concern",
      "Each grammar rule maps cleanly to a class",
    ],
    howToThink: [
      "Map each grammar rule to a class (Terminal or NonTerminal expression).",
      "All expression classes implement a common `interpret(Context)` interface.",
      "Build an Abstract Syntax Tree (AST) of expression objects from the input.",
      "Calling `root.interpret(ctx)` recursively evaluates the expression.",
    ],
    realWorldExamples: [
      "Java regex Pattern.compile() — the regex string is parsed into an AST of expression objects (CharNode, QuantifierNode, GroupNode) then interpreted against input",
      "Spring Expression Language (SpEL) — #{order.total * 0.9} is parsed into an expression tree and evaluated against the Spring context",
      "SQL parsers — SELECT, WHERE, JOIN clauses map to expression classes; the query planner interprets the tree to produce an execution plan",
      "Thymeleaf / JSTL template expressions — ${user.name} is tokenised, parsed into an expression AST, and interpreted against the model at render time",
    ],
    pros: [
      "Easy to extend the grammar — add a new expression class",
      "Each grammar rule is isolated in its own class",
    ],
    cons: [
      "Complex grammars lead to many small classes",
      "Parser (building the AST) is not part of the pattern — must be written separately",
      "Performance degrades for large, complex inputs",
    ],
    badCode: `// ✗ Hard-coded evaluation — every new rule requires modifying parseAndEval()
public class BoolEvaluator {
    public boolean eval(String expr) {
        if (expr.equals("true"))  return true;
        if (expr.equals("false")) return false;
        if (expr.startsWith("AND")) { /* parse AND... */ }
        if (expr.startsWith("OR"))  { /* parse OR... */ }
        // Adding NOT, XOR, NAND requires modifying this monolith
        throw new RuntimeException("Unknown: " + expr);
    }
}`,
    goodCode: `// ✓ Interpreter pattern
public interface BoolExpression {
    boolean interpret();
}

// Terminal expressions
public class Literal implements BoolExpression {
    private final boolean value;
    public Literal(boolean value) { this.value = value; }
    public boolean interpret() { return value; }
}

// Non-terminal expressions
public class AndExpression implements BoolExpression {
    private final BoolExpression left, right;
    public AndExpression(BoolExpression l, BoolExpression r) { left = l; right = r; }
    public boolean interpret() { return left.interpret() && right.interpret(); }
}

public class OrExpression implements BoolExpression {
    private final BoolExpression left, right;
    public OrExpression(BoolExpression l, BoolExpression r) { left = l; right = r; }
    public boolean interpret() { return left.interpret() || right.interpret(); }
}

public class NotExpression implements BoolExpression {
    private final BoolExpression expr;
    public NotExpression(BoolExpression e) { expr = e; }
    public boolean interpret() { return !expr.interpret(); }
}

// Build AST manually (a real implementation would use a parser)
// Represents: (true AND false) OR (NOT false)
BoolExpression ast =
    new OrExpression(
        new AndExpression(new Literal(true), new Literal(false)),
        new NotExpression(new Literal(false))
    );

System.out.println(ast.interpret()); // true`,
    classDiagram: {
      width: 620, height: 310,
      nodes: [
        { id: "BoolExpression", type: "interface", x: 215, y: 20,
          methods: ["+ interpret(): boolean"] },
        { id: "Literal",        type: "class", x: 20, y: 175,
          fields:  ["- value: boolean"],
          methods: ["+ interpret(): boolean"] },
        { id: "AndExpression",  type: "class", x: 215, y: 175,
          fields:  ["- left: BoolExpression", "- right: BoolExpression"],
          methods: ["+ interpret(): boolean"] },
        { id: "NotExpression",  type: "class", x: 430, y: 175,
          fields:  ["- expr: BoolExpression"],
          methods: ["+ interpret(): boolean"] },
      ],
      edges: [
        { from: "Literal",       to: "BoolExpression", type: "implements" },
        { from: "AndExpression", to: "BoolExpression", type: "implements" },
        { from: "NotExpression", to: "BoolExpression", type: "implements" },
        { from: "AndExpression", to: "BoolExpression", type: "aggregation", label: "left, right" },
        { from: "NotExpression", to: "BoolExpression", type: "aggregation", label: "expr" },
      ],
    },
  },
];

/* ── Category metadata ───────────────────────────────────────────────────── */
export const CATEGORY_META = {
  Creational: {
    color: "#1D6FA4",
    bg:    "#EBF4FD",
    count: PATTERNS.filter((p) => p.category === "Creational").length,
    description: "Deal with object creation mechanisms, aiming to create objects in a manner suitable to the situation.",
  },
  Structural: {
    color: "#2D7A4F",
    bg:    "#ECFDF5",
    count: PATTERNS.filter((p) => p.category === "Structural").length,
    description: "Explain how to assemble objects and classes into larger structures while keeping them flexible and efficient.",
  },
  Behavioral: {
    color: "#B7860C",
    bg:    "#FDF6E3",
    count: PATTERNS.filter((p) => p.category === "Behavioral").length,
    description: "Concerned with communication and responsibility between objects.",
  },
};

export const CATEGORIES = ["All", "Creational", "Structural", "Behavioral"];
