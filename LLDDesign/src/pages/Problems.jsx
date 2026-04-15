import React, { useState } from "react";

const PROBLEMS = [
  {
    title: "Parking Lot System",
    difficulty: "Medium",
    tags: ["OOP", "Design", "Patterns"],
    description:
      "Design a multi-floor parking lot that supports cars, bikes, and trucks. Handle ticket issuance, slot allocation, and payment on exit.",
    keyClasses: ["ParkingLot", "ParkingFloor", "ParkingSlot", "Vehicle", "Ticket", "PricingStrategy"],
    patterns: ["Strategy (pricing)", "Singleton (lot instance)", "Factory (vehicle types)"],
    hints: [
      "Use Strategy for flexible pricing (hourly, flat-rate, per-vehicle-type)",
      "Each floor manages its own slots — Composite pattern",
      "Ticket holds entry time; payment calculated on exit",
    ],
  },
  {
    title: "Library Management System",
    difficulty: "Medium",
    tags: ["OOP", "State", "Search"],
    description:
      "Design a library system supporting book search, member registration, book borrowing and returning, with fine calculation for late returns.",
    keyClasses: ["Library", "Book", "BookItem", "Member", "Lending", "FineCalculator"],
    patterns: ["State (book availability)", "Observer (due date alerts)", "Strategy (fine calculation)"],
    hints: [
      "Distinguish Book (metadata) from BookItem (physical copy) — one book, many copies",
      "Use State pattern for BookItem: Available → CheckedOut → Reserved",
      "FineCalculator as a Strategy allows different fine policies",
    ],
  },
  {
    title: "ATM Machine",
    difficulty: "Medium",
    tags: ["State", "Command", "OOP"],
    description:
      "Design an ATM that handles card insertion, PIN validation, cash withdrawal, deposit, and balance enquiry with proper state transitions.",
    keyClasses: ["ATM", "ATMState", "Card", "Account", "CashDispenser", "Transaction"],
    patterns: ["State (ATM states)", "Command (transactions)", "Chain of Responsibility (auth)"],
    hints: [
      "Model ATM states: Idle → CardInserted → PINEntered → SelectingTransaction → Dispensing",
      "Each transaction (withdraw, deposit, enquiry) is a Command — supports undo/log",
      "CashDispenser tracks denomination inventory",
    ],
  },
  {
    title: "Online Food Delivery",
    difficulty: "Hard",
    tags: ["OOP", "Observer", "Strategy"],
    description:
      "Design a food delivery platform (Swiggy/DoorDash) supporting restaurants, menus, orders, real-time delivery tracking, and payment.",
    keyClasses: ["Restaurant", "Menu", "Order", "DeliveryAgent", "PaymentGateway", "OrderTracker"],
    patterns: ["Observer (order tracking)", "Strategy (payment)", "State (order lifecycle)"],
    hints: [
      "Order state machine: Placed → Accepted → Preparing → OutForDelivery → Delivered",
      "Observer pattern for real-time updates to customer, restaurant, and delivery agent",
      "Use Strategy for payment methods: UPI, card, wallet, COD",
    ],
  },
  {
    title: "Hotel Booking System",
    difficulty: "Medium",
    tags: ["OOP", "Factory", "Observer"],
    description:
      "Design a hotel booking platform supporting room search by date/type, booking, cancellation with refund policies, and loyalty points.",
    keyClasses: ["Hotel", "Room", "RoomType", "Booking", "Guest", "RefundPolicy"],
    patterns: ["Factory (room types)", "Strategy (pricing/refund)", "Observer (availability updates)"],
    hints: [
      "Room availability as a date-interval problem — check for overlapping bookings",
      "Refund policy as Strategy: strict (no refund), moderate (50%), flexible (full)",
      "Booking holds guest reference, room reference, check-in/out dates",
    ],
  },
  {
    title: "Chess Game",
    difficulty: "Hard",
    tags: ["OOP", "Command", "Composite"],
    description:
      "Design a two-player chess game with proper piece movement validation, check/checkmate detection, and move history for undo.",
    keyClasses: ["Board", "Piece", "Player", "Move", "GameController", "MoveValidator"],
    patterns: ["Command (moves, undo)", "Observer (check detection)", "Template Method (piece movement)"],
    hints: [
      "Each Piece subclass knows its legal moves — Template Method for shared logic",
      "Store moves as Command objects — undo by reversing last command",
      "After each move, check if opponent's King is in check",
    ],
  },
  {
    title: "Ride-Sharing Platform",
    difficulty: "Hard",
    tags: ["OOP", "Strategy", "Observer"],
    description:
      "Design a ride-sharing service (Uber) handling driver-rider matching, trip state management, dynamic pricing, and payment.",
    keyClasses: ["Rider", "Driver", "Trip", "MatchingService", "PricingEngine", "PaymentService"],
    patterns: ["Strategy (matching, pricing)", "State (trip lifecycle)", "Observer (driver/rider updates)"],
    hints: [
      "Matching strategy: nearest-driver, pool vs. solo — Strategy pattern",
      "Trip state: Requested → Accepted → InProgress → Completed → Paid",
      "Surge pricing as a Strategy decorated onto base fare",
    ],
  },
  {
    title: "Notification System",
    difficulty: "Easy",
    tags: ["OOP", "Observer", "Decorator"],
    description:
      "Design a notification system that routes alerts across Email, SMS, Push, and Slack channels based on user preferences and alert priority.",
    keyClasses: ["NotificationService", "Channel", "Alert", "UserPreference", "RateLimiter"],
    patterns: ["Observer (publish-subscribe)", "Decorator (enriching notifications)", "Chain of Responsibility (routing)"],
    hints: [
      "Each channel (Email, SMS, Push) implements the same Channel interface",
      "Decorator to add retry logic, rate-limiting, or priority tagging without touching channels",
      "User preferences determine which channels receive which alert levels",
    ],
  },
];

const DIFFICULTY_COLOR = {
  Easy:   { color: "#15803D", bg: "#DCFCE7" },
  Medium: { color: "#B45309", bg: "#FEF3C7" },
  Hard:   { color: "#B91C1C", bg: "#FEE2E2" },
};

export default function Problems() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="problems-page">
      <div className="problems-header container">
        <span className="eyebrow-tag">Interview Prep</span>
        <h1 className="page-title">LLD Interview Problems</h1>
        <p className="page-subtitle">
          {PROBLEMS.length} common LLD design problems with key classes, applicable patterns,
          and implementation hints.
        </p>
      </div>

      <div className="problems-list container">
        {PROBLEMS.map((prob, idx) => {
          const diff = DIFFICULTY_COLOR[prob.difficulty];
          const isOpen = expanded === idx;
          return (
            <article key={idx} className={"problem-card" + (isOpen ? " is-open" : "")}>
              <button
                className="problem-card-header"
                onClick={() => setExpanded(isOpen ? null : idx)}
                aria-expanded={isOpen}
              >
                <div className="problem-card-left">
                  <span className="problem-number">{String(idx + 1).padStart(2, "0")}</span>
                  <div>
                    <h2 className="problem-title">{prob.title}</h2>
                    <div className="problem-tags">
                      {prob.tags.map((t) => (
                        <span key={t} className="problem-tag">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="problem-card-right">
                  <span
                    className="problem-difficulty"
                    style={{ color: diff.color, background: diff.bg }}
                  >
                    {prob.difficulty}
                  </span>
                  <span className={"problem-chevron" + (isOpen ? " is-open" : "")}>↓</span>
                </div>
              </button>

              {isOpen && (
                <div className="problem-card-body">
                  <p className="problem-desc">{prob.description}</p>

                  <div className="problem-details">
                    <div className="problem-detail-block">
                      <h3 className="problem-detail-title">Key Classes</h3>
                      <div className="problem-chips">
                        {prob.keyClasses.map((c) => (
                          <span key={c} className="problem-chip problem-chip--class">{c}</span>
                        ))}
                      </div>
                    </div>

                    <div className="problem-detail-block">
                      <h3 className="problem-detail-title">Applicable Patterns</h3>
                      <div className="problem-chips">
                        {prob.patterns.map((p) => (
                          <span key={p} className="problem-chip problem-chip--pattern">{p}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="problem-hints">
                    <h3 className="problem-detail-title">Design Hints</h3>
                    <ul className="problem-hints-list">
                      {prob.hints.map((h, i) => <li key={i}>{h}</li>)}
                    </ul>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
