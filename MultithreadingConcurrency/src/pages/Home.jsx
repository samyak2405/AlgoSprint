import React from "react";
import { Link } from "react-router-dom";
import { CONCEPTS } from "../data/concepts.js";
import { JAVA_API } from "../data/javaApi.js";
import { PATTERNS } from "../data/patterns.js";
import { PROBLEMS } from "../data/problems.js";

const SECTIONS = [
  {
    to: "/concepts",
    number: "01",
    title: "Core Concepts",
    subtitle: "Fundamentals",
    description:
      "Thread lifecycle, Java Memory Model, synchronized, volatile, deadlock, race conditions — the theory you need before touching any API.",
    stat: `${CONCEPTS.length} concepts`,
    accent: "var(--blue)",
  },
  {
    to: "/java-api",
    number: "02",
    title: "Java Concurrency API",
    subtitle: "java.util.concurrent",
    description:
      "ExecutorService, CompletableFuture, CountDownLatch, Semaphore, BlockingQueue, ConcurrentHashMap, AtomicInteger, ReentrantLock — the full JUC toolkit.",
    stat: `${JAVA_API.length} classes`,
    accent: "var(--red)",
  },
  {
    to: "/patterns",
    number: "03",
    title: "Concurrency Patterns",
    subtitle: "Design Patterns",
    description:
      "Thread Pool, Producer-Consumer, Monitor Object, Read-Write Lock, Two-Phase Termination, Fork-Join — reusable solutions to recurring concurrency problems.",
    stat: `${PATTERNS.length} patterns`,
    accent: "var(--gold)",
  },
  {
    to: "/problems",
    number: "04",
    title: "Classic Problems",
    subtitle: "Interview Prep",
    description:
      "Print in Order, FooBar Alternately, Dining Philosophers, Bounded Blocking Queue, Readers-Writers — LeetCode concurrency problems with full Java solutions.",
    stat: `${PROBLEMS.length} problems`,
    accent: "var(--red)",
  },
  {
    to: "/revision",
    number: "05",
    title: "Quick Revision",
    subtitle: "15-Minute Sprint",
    description:
      "All concepts distilled into scannable cards with one-liners, key Java APIs, and gotchas. Filter by category.",
    stat: "all topics",
    accent: "var(--ink-2)",
  },
  {
    to: "/compare",
    number: "06",
    title: "Comparison Tables",
    subtitle: "Side-by-Side",
    description:
      "synchronized vs ReentrantLock vs StampedLock, CountDownLatch vs CyclicBarrier vs Phaser, Platform Thread vs Virtual Thread — choose the right tool.",
    stat: "7 tables",
    accent: "#A78BFA",
  },
  {
    to: "/interview",
    number: "07",
    title: "Interview Prep",
    subtitle: "Top Questions",
    description:
      "Top 15 concurrency interview questions with model answers, examiner traps, and design templates.",
    stat: "15 questions",
    accent: "#F472B6",
  },
];

const STATS = [
  { value: `${CONCEPTS.length}`,  label: "Concepts" },
  { value: `${JAVA_API.length}`,  label: "JUC Classes" },
  { value: `${PATTERNS.length}`,  label: "Patterns" },
  { value: `${PROBLEMS.length}`,  label: "Problems" },
];

export default function Home() {
  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-inner container">
          <div className="hero-eyebrow">
            <span className="eyebrow-tag">Multithreading & Concurrency</span>
          </div>
          <h1 className="hero-title">
            Threads that
            <br />
            <em>behave.</em>
          </h1>
          <p className="hero-subtitle">
            Master Java multithreading from first principles — thread lifecycle and the
            Java Memory Model, through the full java.util.concurrent API, to concurrency
            patterns and classic interview problems.
          </p>
          <div className="hero-cta-row">
            <Link to="/concepts" className="btn btn-primary">
              Start with Concepts
            </Link>
            <Link to="/java-api" className="btn btn-ghost">
              Java API →
            </Link>
          </div>
        </div>
      </section>

      {/* Stat strip */}
      <div className="hero-stats">
        {STATS.map((s) => (
          <div key={s.label} className="hero-stat">
            <span className="hero-stat-value">{s.value}</span>
            <span className="hero-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Sections grid */}
      <section className="sections-grid container">
        {SECTIONS.map((s) => (
          <Link to={s.to} key={s.to} className="section-card">
            <div className="section-card-number" style={{ color: s.accent }}>
              {s.number}
            </div>
            <div className="section-card-body">
              <div className="section-card-meta">
                <span className="section-card-subtitle">{s.subtitle}</span>
                <span className="section-card-stat">{s.stat}</span>
              </div>
              <h2 className="section-card-title">{s.title}</h2>
              <p className="section-card-desc">{s.description}</p>
            </div>
            <div className="section-card-arrow">→</div>
          </Link>
        ))}
      </section>
    </div>
  );
}
