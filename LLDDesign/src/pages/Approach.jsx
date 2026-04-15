import React, { useState } from "react";

/* ─────────────────────────── Data ─────────────────────────────── */

const STEPS = [
  {
    num: "01",
    title: "Clarify Requirements",
    time: "5 min",
    icon: "?",
    color: "#1D6FA4",
    bg: "#EBF4FD",
    tldr: "Ask before designing. Requirements drive every class and relationship you'll create.",
    what: "Split requirements into Functional (what the system does) and Non-functional (scale, concurrency, constraints). Write them down explicitly — don't hold them in your head.",
    howTo: [
      "Extract functional requirements: list every action a user or system can perform.",
      "Ask non-functional questions: expected load, concurrent users, read-heavy vs write-heavy, any strict latency SLAs?",
      "Identify out-of-scope items upfront so you don't over-engineer.",
      "Re-state requirements back to the interviewer to confirm alignment.",
    ],
    example: `// Example: Parking Lot System
// ──────────────────────────────
// Functional:
//   - Issue a ticket when a vehicle enters
//   - Allocate the nearest available slot
//   - Calculate fee on exit (hourly rate)
//   - Support cars, bikes, and trucks
//
// Non-functional:
//   - Single lot, multi-floor (no distributed design needed)
//   - Concurrency: multiple entry gates can operate simultaneously
//   - Out of scope: payment gateway, booking ahead`,
    tips: [
      "Always ask 'What changes frequently?' — that drives your design pattern choices.",
      "If the interviewer says 'you decide', make explicit assumptions and state them.",
    ],
    pitfalls: [
      "Starting to code before requirements are clear is the #1 time-waster in interviews.",
      "Treating non-functional requirements as optional — concurrency issues surface late.",
    ],
  },
  {
    num: "02",
    title: "Identify Core Entities",
    time: "3 min",
    icon: "◉",
    color: "#B7860C",
    bg: "#FDF6E3",
    tldr: "Underline every significant noun in the problem statement — each one is a candidate class.",
    what: "Extract the real-world objects in the system. These become your classes. Every noun that holds data or has behavior belongs here. Filter out implementation details (Database, Service) at this stage.",
    howTo: [
      "Read the problem statement and underline every noun.",
      "For each noun, ask: Does it have its own attributes? Does it have its own behaviors? If yes to both, it's a class.",
      "Group related nouns: 'booking' and 'reservation' may be the same entity.",
      "Distinguish between concrete things (Car, Room, Book) and roles (Member, Admin, Driver).",
    ],
    example: `// Problem: "Design a Library System for borrowing and returning books."
//
// Nouns extracted:
//   Library ✓  Book ✓  BookItem ✓  Member ✓
//   Librarian ✓  Catalog ✓  Lending ✓  Fine ✓
//
// Key distinction caught early:
//   Book    = metadata (title, author, ISBN)  — 1 record
//   BookItem = physical copy on the shelf     — many per Book
//
// Without this split, you can't model "3 copies available, 1 checked out"`,
    tips: [
      "The noun 'System' (Library System, Parking System) is almost never a class — it's the boundary.",
      "Don't name everything XxxManager or XxxService at this stage — you'll lose the domain model.",
    ],
    pitfalls: [
      "Creating too-fine-grained entities early (Address, PhoneNumber as classes) clutters the design.",
      "Missing the Book vs BookItem split is a classic library system mistake.",
    ],
  },
  {
    num: "03",
    title: "Define Attributes & Behaviors",
    time: "3 min",
    icon: "≡",
    color: "#2D7A4F",
    bg: "#EDFAF3",
    tldr: "For each entity: what it knows (fields) and what it can do (methods). Apply SRP immediately.",
    what: "Flesh out each class with its data (fields) and operations (methods). Apply the Single Responsibility Principle: if a class needs two unrelated reasons to change, split it. Group data and the behavior that operates on it together.",
    howTo: [
      "For each entity, list fields: primitive data it owns.",
      "List methods: actions it can perform or queries it can answer.",
      "Ask 'does this method really belong here?' — if a method uses mostly data from another class, it belongs there.",
      "Keep methods short and focused; long methods signal a missing class.",
    ],
    example: `// ParkingSlot entity sketch:
class ParkingSlot {
    // Fields (what it knows)
    private String slotId;
    private SlotType type;       // COMPACT, LARGE, MOTORCYCLE
    private boolean isOccupied;
    private Vehicle currentVehicle;

    // Methods (what it can do)
    public boolean canFit(Vehicle v)  { return type.fits(v.getType()); }
    public void park(Vehicle v)       { currentVehicle = v; isOccupied = true; }
    public void vacate()              { currentVehicle = null; isOccupied = false; }
    public boolean isAvailable()      { return !isOccupied; }
}

// ✗ Bad: putting fee calculation here violates SRP
//   Reason 1: slot availability logic  → changes with layout rules
//   Reason 2: pricing logic            → changes with business rules`,
    tips: [
      "If you find yourself writing getX().getY().getZ(), you're violating the Law of Demeter — add a method to the intermediate class.",
      "'Tell, don't ask' — prefer slot.park(vehicle) over if (slot.isAvailable()) slot.setOccupied(true).",
    ],
    pitfalls: [
      "Anemic domain model: classes with only getters/setters and all logic in a Service class.",
      "Putting UI formatting or persistence logic inside domain objects.",
    ],
  },
  {
    num: "04",
    title: "Map Relationships",
    time: "3 min",
    icon: "⟶",
    color: "#8B44AC",
    bg: "#F5EEF8",
    tldr: "Decide: Is-a (inheritance), Has-a (composition/aggregation), or Uses (dependency).",
    what: "Connect your entities. Getting relationships wrong forces painful rewrites. The three key questions: Is one thing a type of another? Is one thing physically part of another? Does one thing use another?",
    howTo: [
      "Is-a → Inheritance / Interface implementation. Use sparingly — prefer composition.",
      "Has-a (owned, same lifecycle) → Composition. ParkingLot is composed of ParkingFloors.",
      "Has-a (independent lifecycle) → Aggregation. Library has Books, but books can exist without the library.",
      "Uses → Dependency / Association. Ticket uses PricingStrategy.",
    ],
    example: `// Relationship map for Parking Lot:
//
//  ParkingLot  ◆───────  ParkingFloor   (Composition: floor can't exist without lot)
//  ParkingFloor ◆───────  ParkingSlot   (Composition: slot tied to floor)
//  ParkingSlot  ○───────  Vehicle       (Aggregation: vehicle exists independently)
//  Vehicle      ◁───────  Car           (Inheritance: Car IS-A Vehicle)
//  Vehicle      ◁───────  Bike          (Inheritance)
//  Vehicle      ◁───────  Truck         (Inheritance)
//  Ticket       ─ ─ ─ ─►  PricingStrategy (Dependency: uses but doesn't own)
//
// Rule of thumb: "part of and same lifetime" → composition (◆)
//               "has a reference, different lifetime" → aggregation (○)`,
    tips: [
      "Prefer composition over inheritance. 'Car is a Vehicle' is fine; 'ElectricCar is a Car is a Vehicle' is often a smell.",
      "If subclasses start overriding methods to throw UnsupportedOperationException, your inheritance is wrong.",
    ],
    pitfalls: [
      "Deep inheritance hierarchies (4+ levels) become rigid and hard to test.",
      "Using inheritance for code reuse rather than true IS-A relationships.",
    ],
  },
  {
    num: "05",
    title: "Apply Design Patterns",
    time: "3 min",
    icon: "✦",
    color: "#C0392B",
    bg: "#FBF0EF",
    tldr: "Patterns are vocabulary for recurring problems. Identify the problem first, then name the pattern.",
    what: "Look for recurring structural problems in your design — object creation, state management, notification, algorithm swapping. Match them to GoF patterns. Never apply a pattern without identifying the concrete problem it solves.",
    howTo: [
      "Spot the problem: 'I need interchangeable algorithms here' → Strategy.",
      "Spot the problem: 'Behavior changes based on state' → State.",
      "Spot the problem: 'Many objects need to react to one change' → Observer.",
      "Spot the problem: 'I need only one instance' → Singleton. 'Complex creation' → Factory/Builder.",
    ],
    example: `// Problem → Pattern mapping for common LLD problems:
//
// "Pricing varies by vehicle type and time"
//    → Strategy pattern (PricingStrategy interface, HourlyPricing, DailyPricing impls)
//
// "ATM behaves differently in each state (idle, card inserted, PIN entered)"
//    → State pattern (ATMState interface, IdleState, CardInsertedState, etc.)
//
// "Customer, restaurant, and delivery agent all track the same order"
//    → Observer pattern (Order is subject, all three are observers)
//
// "Creating a pizza with many optional toppings"
//    → Builder pattern (Pizza.builder().crust("thin").topping("cheese").build())
//
// "One shared DB connection pool across the app"
//    → Singleton pattern (ConnectionPool.getInstance())`,
    tips: [
      "In interviews, name the pattern and explain why: 'I'm using Strategy here because pricing rules change independently of slot allocation.'",
      "2–3 well-justified patterns beats 6 patterns crammed in to impress.",
    ],
    pitfalls: [
      "Pattern-first thinking: picking a pattern then forcing the problem to fit it.",
      "Using Singleton as an excuse to avoid proper dependency injection.",
    ],
  },
  {
    num: "06",
    title: "Define Interfaces & Abstractions",
    time: "2 min",
    icon: "◇",
    color: "#1D6FA4",
    bg: "#EBF4FD",
    tldr: "Program to interfaces, not implementations. Interfaces are contracts; abstract classes are partial implementations.",
    what: "Define the contracts (interfaces) and shared implementations (abstract classes) before writing concrete code. This enforces the Dependency Inversion Principle and makes your design testable and extensible.",
    howTo: [
      "For every place you'd write 'it could be X or Y', extract an interface.",
      "Use interfaces for cross-cutting behaviors: Payable, Reservable, Notifiable.",
      "Use abstract classes when concrete subclasses genuinely share implementation code.",
      "Depend on abstractions in constructors: pass PricingStrategy, not HourlyPricing.",
    ],
    example: `// ✗ Without interface — tightly coupled
class ParkingTicket {
    private HourlyPricing pricing;  // can never change to daily pricing

    public double calculateFee(long minutes) {
        return pricing.calculate(minutes);
    }
}

// ✓ With interface — open for extension, closed for modification
interface PricingStrategy {
    double calculate(long parkingMinutes);
}

class HourlyPricing  implements PricingStrategy { /* ... */ }
class DailyPricing   implements PricingStrategy { /* ... */ }
class WeekendPricing implements PricingStrategy { /* ... */ }

class ParkingTicket {
    private PricingStrategy pricing;  // inject any strategy

    public ParkingTicket(PricingStrategy pricing) {
        this.pricing = pricing;
    }

    public double calculateFee(long minutes) {
        return pricing.calculate(minutes);
    }
}`,
    tips: [
      "ISP (Interface Segregation): prefer many small, focused interfaces over one fat interface.",
      "If an interface has 8+ methods, it's probably two interfaces in a trench coat.",
    ],
    pitfalls: [
      "Creating an interface for a class that will never have a second implementation.",
      "Abstract classes with 15 methods where 12 throw UnsupportedOperationException.",
    ],
  },
  {
    num: "07",
    title: "Handle Edge Cases & Concurrency",
    time: "2 min",
    icon: "⚠",
    color: "#C17A10",
    bg: "#FDF3E0",
    tldr: "Ask 'what can go wrong?' before you stop. Thread safety on shared state is non-negotiable.",
    what: "Enumerate the failure modes in your system. Then address concurrency: which objects are shared across threads? Any mutable shared state needs synchronization or an atomic data structure.",
    howTo: [
      "Walk through each user action and ask: what if this fails halfway through?",
      "Identify shared mutable state: available slot count, booking list, inventory.",
      "Use synchronized blocks, volatile, or concurrent collections (ConcurrentHashMap) on shared state.",
      "Define custom exceptions for domain errors: SlotUnavailableException, InsufficientFundsException.",
    ],
    example: `// Concurrency: Two vehicles trying to take the last slot simultaneously
class ParkingFloor {
    private final List<ParkingSlot> slots;

    // ✗ Race condition — two threads can both see 1 slot available
    public ParkingSlot findAvailableSlot(VehicleType type) {
        return slots.stream()
                    .filter(s -> s.isAvailable() && s.canFit(type))
                    .findFirst().orElse(null);
    }

    // ✓ Synchronized — only one thread enters the critical section
    public synchronized ParkingSlot allocateSlot(VehicleType type) {
        ParkingSlot slot = slots.stream()
            .filter(s -> s.isAvailable() && s.canFit(type))
            .findFirst()
            .orElseThrow(() -> new SlotUnavailableException("No slot for " + type));
        slot.park(vehicle);   // check and act atomically
        return slot;
    }
}

// Edge cases to handle:
//   - Lot is full on entry → throw ParkingFullException
//   - Ticket not found on exit → throw InvalidTicketException
//   - Payment fails → don't vacate the slot; retry or flag for manual resolution`,
    tips: [
      "In interviews, mention concurrency even if you don't implement it fully — shows systems thinking.",
      "Prefer immutable objects where possible — they're thread-safe by definition.",
    ],
    pitfalls: [
      "Synchronizing at too fine a granularity causes deadlocks; too coarse causes bottlenecks.",
      "Using static mutable fields as makeshift singletons — invisible shared state.",
    ],
  },
  {
    num: "08",
    title: "Review Against SOLID",
    time: "2 min",
    icon: "✓",
    color: "#2D7A4F",
    bg: "#EDFAF3",
    tldr: "Run a quick SOLID checklist. One violation caught now saves a painful refactor later.",
    what: "Do a final pass over your design against the five SOLID principles. This is where you catch god classes, tight coupling, and missing abstractions before you commit to an implementation.",
    howTo: [
      "SRP: Can you describe each class's purpose in one sentence without using 'and'?",
      "OCP: Can you add a new vehicle type without modifying ParkingLot?",
      "LSP: Can every subclass be used wherever the parent is used, without surprises?",
      "ISP: Does every class implement only the methods it actually needs?",
      "DIP: Do high-level classes depend on interfaces, not concrete implementations?",
    ],
    example: `// SOLID checklist for Parking Lot design:
//
// ✓ SRP: ParkingLot manages floors. PricingStrategy calculates fees.
//        TicketService issues/validates tickets. Each class: one job.
//
// ✓ OCP: Adding ElectricVehicle requires new class + slot type,
//        zero changes to ParkingLot or ParkingFloor.
//
// ✓ LSP: ElectricCar extends Car. Can be parked in any Car slot.
//        No method throws "unsupported" for ElectricCar.
//
// ✓ ISP: Payable interface has only pay() and refund().
//        Reservable interface has only reserve() and cancel().
//        ParkingTicket implements Payable, not a fat 10-method interface.
//
// ✓ DIP: ParkingTicket depends on PricingStrategy (interface),
//        not HourlyPricing (concrete). Injected at construction.`,
    tips: [
      "The most common SOLID violation in LLD interviews: SRP (god classes) and DIP (new SomeConcreteClass() inside business logic).",
      "If you spot a violation, mention it and say how you'd fix it — shows maturity.",
    ],
    pitfalls: [
      "Checking SOLID only at the end. Build it in from step 3 onward.",
      "Creating one class per file but still violating SRP because it does two unrelated things.",
    ],
  },
];

const MISTAKES = [
  {
    icon: "⚡",
    title: "Coding before clarifying",
    desc: "Jumping straight to classes without nailing requirements. The interviewer wants to see your thinking process, not speed-coding.",
    fix: "Spend the first 5 minutes only on requirements. Write them down visibly.",
  },
  {
    icon: "🏛",
    title: "God classes",
    desc: "ParkingLotManager with 20 methods that handles entry, exit, payment, reporting, and slot management. One class, infinite reasons to change.",
    fix: "Ask: 'Can I describe this class's job in one sentence without the word and?' If not, split it.",
  },
  {
    icon: "🔗",
    title: "Concrete coupling",
    desc: "Writing new HourlyPricing() inside ParkingTicket. Now you can't swap pricing strategy without modifying the ticket class.",
    fix: "Always accept interfaces in constructors. Depend on PricingStrategy, not HourlyPricing.",
  },
  {
    icon: "📐",
    title: "Inheritance over composition",
    desc: "Building deep hierarchies: Vehicle → Car → ElectricCar → ElectricSUV. When requirements change, the whole hierarchy breaks.",
    fix: "Prefer composition. Car has a PropulsionType, not Car extends FuelCar extends Vehicle.",
  },
  {
    icon: "✨",
    title: "Pattern overengineering",
    desc: "Cramming 8 patterns into a simple design to impress. Results in indirection for its own sake, confusing both the interviewer and future readers.",
    fix: "Each pattern must solve a named problem. 'I used Strategy because pricing varies' is good. 'I used Strategy' is not.",
  },
  {
    icon: "🔒",
    title: "Ignoring concurrency",
    desc: "findAvailableSlot() has a race condition: two threads see the same slot as free and double-book it.",
    fix: "Identify shared mutable state early (step 7). Synchronize check-and-act operations atomically.",
  },
];

const CHEATSHEET = [
  { trigger: "Object creation logic is complex or type varies",  pattern: "Factory Method / Abstract Factory" },
  { trigger: "Many optional parameters or assembly order matters", pattern: "Builder" },
  { trigger: "One shared instance across the app",               pattern: "Singleton" },
  { trigger: "Algorithms / strategies swap at runtime",          pattern: "Strategy" },
  { trigger: "Object behavior depends on its state",             pattern: "State" },
  { trigger: "Many objects need to react to one change",         pattern: "Observer" },
  { trigger: "Add behavior without modifying the class",         pattern: "Decorator" },
  { trigger: "Intercept or control access to an object",         pattern: "Proxy" },
  { trigger: "Simplify a complex subsystem for clients",         pattern: "Facade" },
  { trigger: "Wrap an incompatible interface",                   pattern: "Adapter" },
  { trigger: "Undo/redo or loggable operations",                 pattern: "Command" },
  { trigger: "Pass a request along a chain of handlers",         pattern: "Chain of Responsibility" },
  { trigger: "Fix algorithm skeleton; subclasses vary steps",    pattern: "Template Method" },
  { trigger: "Reduce many-to-many communication chaos",         pattern: "Mediator" },
  { trigger: "Snapshot and restore state (undo)",               pattern: "Memento" },
  { trigger: "Uniform traversal over different collections",     pattern: "Iterator" },
  { trigger: "Part–whole tree, treat uniformly",                 pattern: "Composite" },
];

const INTERVIEW_TIPS = [
  { label: "Think aloud", desc: "Narrate every decision. 'I'm choosing composition over inheritance here because...' The interviewer grades process, not just output." },
  { label: "Diagram first", desc: "Sketch the class diagram before writing code. A class diagram in 5 minutes prevents 20 minutes of wrong code." },
  { label: "Start broad", desc: "Name all classes first, then deep-dive into one or two the interviewer cares about. Don't gold-plate ParkingSlot before showing the full picture." },
  { label: "Clarify scope", desc: "Explicitly state what's in and out of scope. 'I'll skip the payment gateway integration and focus on the domain model' is a strength, not a cop-out." },
  { label: "Name patterns explicitly", desc: "When you apply a pattern, name it and justify it: 'This is a Strategy pattern because pricing rules change independently of the booking flow.'" },
  { label: "Handle one happy path first", desc: "Get the core vehicle entry → slot allocation → ticket issuance → exit → fee calculation flow working. Then handle edge cases." },
];

/* ─────────────────────────── Components ───────────────────────── */

function StepCard({ step, index }) {
  const [open, setOpen] = useState(index < 2); // first two open by default

  return (
    <div
      className={"ap-step" + (open ? " ap-step--open" : "")}
      style={{ "--step-color": step.color, "--step-bg": step.bg }}
    >
      <button className="ap-step-header" onClick={() => setOpen((v) => !v)}>
        <div className="ap-step-header-left">
          <span className="ap-step-num">{step.num}</span>
          <div className="ap-step-icon">{step.icon}</div>
          <div className="ap-step-meta">
            <span className="ap-step-title">{step.title}</span>
            <span className="ap-step-tldr">{step.tldr}</span>
          </div>
        </div>
        <div className="ap-step-header-right">
          <span className="ap-step-time">{step.time}</span>
          <span className="ap-step-chevron">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div className="ap-step-body">
          <p className="ap-step-what">{step.what}</p>

          <div className="ap-step-grid">
            {/* How-to list */}
            <div className="ap-step-col">
              <h4 className="ap-step-col-label">How to do it</h4>
              <ol className="ap-step-howto">
                {step.howTo.map((item, i) => (
                  <li key={i}>
                    <span className="ap-step-howto-num">{i + 1}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Tips & Pitfalls */}
            <div className="ap-step-col">
              <div className="ap-step-callouts">
                {step.tips.map((tip, i) => (
                  <div key={i} className="ap-callout ap-callout--tip">
                    <span className="ap-callout-icon">💡</span>
                    <span>{tip}</span>
                  </div>
                ))}
                {step.pitfalls.map((pit, i) => (
                  <div key={i} className="ap-callout ap-callout--warn">
                    <span className="ap-callout-icon">⚠</span>
                    <span>{pit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Code example */}
          <div className="ap-step-code-wrap">
            <div className="ap-code-label">Example</div>
            <div className="code-block ap-code-block">
              <pre><code>{step.example}</code></pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MistakeCard({ m }) {
  return (
    <div className="ap-mistake-card">
      <span className="ap-mistake-icon">{m.icon}</span>
      <div className="ap-mistake-body">
        <h4 className="ap-mistake-title">{m.title}</h4>
        <p className="ap-mistake-desc">{m.desc}</p>
        <div className="ap-mistake-fix">
          <span className="ap-mistake-fix-label">Fix</span>
          <span>{m.fix}</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Page ─────────────────────────────── */

export default function Approach() {
  const totalTime = STEPS.reduce((acc, s) => acc + parseInt(s.time), 0);

  return (
    <div className="ap-page">

      {/* ── Hero ──────────────────────────────────────── */}
      <div className="ap-hero container">
        <span className="eyebrow-tag">Framework</span>
        <h1 className="page-title">How to Solve LLD Problems</h1>
        <p className="page-subtitle">
          A repeatable 8-step framework for cracking any Low Level Design interview.
          Follow the sequence, and you'll never stare at a blank board again.
        </p>

        <div className="ap-hero-meta">
          <div className="ap-hero-stat">
            <span className="ap-hero-stat-num">8</span>
            <span className="ap-hero-stat-label">Steps</span>
          </div>
          <div className="ap-hero-stat">
            <span className="ap-hero-stat-num">{totalTime}</span>
            <span className="ap-hero-stat-label">Minutes</span>
          </div>
          <div className="ap-hero-stat">
            <span className="ap-hero-stat-num">{CHEATSHEET.length}</span>
            <span className="ap-hero-stat-label">Pattern triggers</span>
          </div>
        </div>

        {/* Time bar */}
        <div className="ap-time-bar">
          {STEPS.map((s) => (
            <div
              key={s.num}
              className="ap-time-segment"
              style={{
                flex: parseInt(s.time),
                background: s.color,
                opacity: 0.85,
              }}
              title={`${s.title}: ${s.time}`}
            >
              <span className="ap-time-segment-label">{s.num}</span>
            </div>
          ))}
        </div>
        <div className="ap-time-bar-legend">
          {STEPS.map((s) => (
            <span key={s.num} className="ap-time-legend-item" style={{ color: s.color }}>
              {s.num} {s.title} ({s.time})
            </span>
          ))}
        </div>
      </div>

      {/* ── 8-Step Framework ──────────────────────────── */}
      <div className="ap-steps container">
        <div className="ap-section-header">
          <h2 className="ap-section-title">The 8-Step Framework</h2>
          <p className="ap-section-sub">Click any step to expand the full guide. Steps 01–02 are open by default.</p>
        </div>
        <div className="ap-steps-list">
          {STEPS.map((s, i) => <StepCard key={s.num} step={s} index={i} />)}
        </div>
      </div>

      {/* ── Pattern Trigger Cheatsheet ─────────────────── */}
      <div className="ap-cheatsheet container">
        <div className="ap-section-header">
          <h2 className="ap-section-title">Pattern Decision Cheatsheet</h2>
          <p className="ap-section-sub">
            Recognize the problem, pick the pattern. Keep this mental model during design.
          </p>
        </div>
        <div className="ap-cheatsheet-table">
          <div className="ap-cheatsheet-row ap-cheatsheet-row--head">
            <span>When you see this problem…</span>
            <span>Reach for this pattern</span>
          </div>
          {CHEATSHEET.map((row, i) => (
            <div key={i} className="ap-cheatsheet-row">
              <span className="ap-cheatsheet-trigger">
                <span className="ap-cheatsheet-if">IF</span>
                {row.trigger}
              </span>
              <span className="ap-cheatsheet-pattern">{row.pattern}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Common Mistakes ───────────────────────────── */}
      <div className="ap-mistakes container">
        <div className="ap-section-header">
          <h2 className="ap-section-title">6 Mistakes That Fail Interviews</h2>
          <p className="ap-section-sub">These show up in almost every LLD interview. Know them before you walk in.</p>
        </div>
        <div className="ap-mistakes-grid">
          {MISTAKES.map((m, i) => <MistakeCard key={i} m={m} />)}
        </div>
      </div>

      {/* ── Interview Tips ────────────────────────────── */}
      <div className="ap-tips container">
        <div className="ap-section-header">
          <h2 className="ap-section-title">Interview Playbook</h2>
          <p className="ap-section-sub">Tactics that separate good LLD interviews from great ones.</p>
        </div>
        <div className="ap-tips-grid">
          {INTERVIEW_TIPS.map((tip, i) => (
            <div key={i} className="ap-tip-card">
              <span className="ap-tip-num">0{i + 1}</span>
              <div>
                <h4 className="ap-tip-label">{tip.label}</h4>
                <p className="ap-tip-desc">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Reference Checklist ─────────────────── */}
      <div className="ap-checklist container">
        <div className="ap-section-header">
          <h2 className="ap-section-title">Pre-Submit Checklist</h2>
          <p className="ap-section-sub">Run through this before you hand over the mic.</p>
        </div>
        <div className="ap-checklist-grid">
          {[
            "Requirements written down and confirmed with interviewer",
            "All core entities identified (nouns extracted from problem)",
            "Each class has a single, statable responsibility",
            "Relationships mapped: composition, aggregation, inheritance",
            "At least 1–2 design patterns applied with justification",
            "High-level classes depend on interfaces, not concrete impls",
            "Critical edge cases covered (resource unavailable, concurrent access)",
            "Shared mutable state is synchronized or thread-safe",
            "Custom exception types for domain errors (not raw RuntimeException)",
            "Class diagram or rough sketch is visible and legible",
          ].map((item, i) => (
            <ChecklistItem key={i} text={item} />
          ))}
        </div>
      </div>

    </div>
  );
}

function ChecklistItem({ text }) {
  const [checked, setChecked] = useState(false);
  return (
    <label className={"ap-check-item" + (checked ? " ap-check-item--done" : "")}>
      <input
        type="checkbox"
        checked={checked}
        onChange={() => setChecked((v) => !v)}
        className="ap-check-input"
      />
      <span className="ap-check-box">{checked ? "✓" : ""}</span>
      <span className="ap-check-text">{text}</span>
    </label>
  );
}
