import React from "react";
import { Link } from "react-router-dom";
import { PATTERNS, CATEGORY_META } from "../data/patterns.js";
import { SOLID_PRINCIPLES } from "../data/solid.js";

const SECTIONS = [
  {
    to: "/patterns",
    number: "01",
    title: "Design Patterns",
    subtitle: "Gang of Four",
    description:
      "All 23 GoF patterns — Creational, Structural, and Behavioral — with intent, trade-offs, and Java implementations.",
    stat: `${PATTERNS.length} patterns`,
    accent: "var(--gold)",
  },
  {
    to: "/solid",
    number: "02",
    title: "SOLID Principles",
    subtitle: "Object-Oriented Design",
    description:
      "The five foundational principles of clean OO design with before/after code comparisons.",
    stat: `${SOLID_PRINCIPLES.length} principles`,
    accent: "var(--red)",
  },
  {
    to: "/approach",
    number: "03",
    title: "How to Approach LLD",
    subtitle: "Problem-Solving Framework",
    description:
      "An 8-step framework for cracking any LLD interview — from clarifying requirements to SOLID review, with pattern decision cheatsheet.",
    stat: "8 steps",
    accent: "var(--red)",
  },
  {
    to: "/revision",
    number: "04",
    title: "Quick Revision Guide",
    subtitle: "15-Minute Sprint",
    description:
      "All 23 patterns distilled into scannable cards with priority labels — Important, Good to Have, Rarely Used — with filters and sort.",
    stat: "23 patterns",
    accent: "var(--gold)",
  },
  {
    to: "/problems",
    number: "05",
    title: "LLD Problems",
    subtitle: "Interview Prep",
    description:
      "Common LLD interview problems — Parking Lot, Library System, ATM — with class diagrams and implementations.",
    stat: "8 problems",
    accent: "var(--ink-2)",
  },
];

export default function Home() {
  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-inner container">
          <div className="hero-eyebrow">
            <span className="eyebrow-tag">Low Level Design</span>
          </div>
          <h1 className="hero-title">
            Design that
            <br />
            <em>scales.</em>
          </h1>
          <p className="hero-subtitle">
            Master object-oriented design patterns, SOLID principles, and real interview
            problems with clear explanations and production-grade Java examples.
          </p>
          <div className="hero-cta-row">
            <Link to="/patterns" className="btn btn-primary">
              Browse Patterns
            </Link>
            <Link to="/solid" className="btn btn-ghost">
              SOLID Principles →
            </Link>
          </div>
        </div>

        {/* Decorative category pills */}
        <div className="hero-categories">
          {Object.entries(CATEGORY_META).map(([cat, meta]) => (
            <span key={cat} className="hero-cat-pill" style={{ "--cat-color": meta.color }}>
              {meta.count} {cat}
            </span>
          ))}
        </div>
      </section>

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

      {/* Pattern category breakdown */}
      <section className="category-breakdown container">
        <h2 className="breakdown-title">Pattern Categories</h2>
        <div className="breakdown-grid">
          {Object.entries(CATEGORY_META).map(([cat, meta]) => (
            <div key={cat} className="breakdown-card" style={{ "--cat-color": meta.color, "--cat-bg": meta.bg }}>
              <div className="breakdown-card-count">{meta.count}</div>
              <div className="breakdown-card-name">{cat}</div>
              <p className="breakdown-card-desc">{meta.description}</p>
              <Link to={`/patterns?cat=${cat}`} className="breakdown-card-link">
                Explore →
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
