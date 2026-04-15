import React, { useState, useMemo } from "react";
import { PATTERNS, CATEGORIES, CATEGORY_META } from "../data/patterns.js";

const PRIORITIES = ["All", "Important", "Good to Have", "Rarely Used"];

const PRIORITY_META = {
  "Important":    { color: "#C0392B", bg: "#FBF0EF", label: "Important",    dot: "#C0392B" },
  "Good to Have": { color: "#B7860C", bg: "#FDF6E3", label: "Good to Have", dot: "#B7860C" },
  "Rarely Used":  { color: "#9C9690", bg: "#F4F1EA", label: "Rarely Used",  dot: "#9C9690" },
};

const SORT_OPTIONS = [
  { value: "priority", label: "By Priority" },
  { value: "alpha",    label: "A → Z" },
  { value: "category", label: "By Category" },
];

const PRIORITY_ORDER = { "Important": 0, "Good to Have": 1, "Rarely Used": 2 };

function PriorityBadge({ priority }) {
  const m = PRIORITY_META[priority];
  if (!m) return null;
  return (
    <span
      className="rv-priority-badge"
      style={{ "--p-color": m.color, "--p-bg": m.bg }}
    >
      <span className="rv-priority-dot" style={{ background: m.dot }} />
      {m.label}
    </span>
  );
}

function CategoryBadge({ category }) {
  const m = CATEGORY_META[category];
  if (!m) return null;
  return (
    <span
      className="rv-cat-badge"
      style={{ "--cat-color": m.color, "--cat-bg": m.bg }}
    >
      {category}
    </span>
  );
}

function RevisionCard({ pattern, onOpen }) {
  return (
    <article className="rv-card" onClick={() => onOpen(pattern)}>
      <div className="rv-card-badges">
        <PriorityBadge priority={pattern.priority} />
        <CategoryBadge category={pattern.category} />
      </div>

      <h3 className="rv-card-name">{pattern.name}</h3>
      <p className="rv-card-tagline">{pattern.tagline}</p>

      <p className="rv-card-summary">{pattern.quickSummary}</p>

      <div className="rv-card-signals">
        <div className="rv-card-signal rv-card-signal--use">
          <span className="rv-signal-label">Use when</span>
          <span className="rv-signal-text">{pattern.usageSignal}</span>
        </div>
        <div className="rv-card-signal rv-card-signal--warn">
          <span className="rv-signal-label">Watch out</span>
          <span className="rv-signal-text">{pattern.watchOut}</span>
        </div>
      </div>

      <span className="rv-card-cta">Full details →</span>
    </article>
  );
}

function QuickViewModal({ pattern, onClose }) {
  if (!pattern) return null;
  const pm = PRIORITY_META[pattern.priority];
  const cm = CATEGORY_META[pattern.category];

  return (
    <div className="rv-modal-backdrop" onClick={onClose}>
      <div
        className="rv-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={pattern.name}
      >
        <div className="rv-modal-header" style={{ "--pm-color": pm?.color }}>
          <div className="rv-modal-header-badges">
            <PriorityBadge priority={pattern.priority} />
            <CategoryBadge category={pattern.category} />
          </div>
          <h2 className="rv-modal-name">{pattern.name}</h2>
          <p className="rv-modal-tagline">{pattern.tagline}</p>
          <button className="rv-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="rv-modal-body">
          <section className="rv-modal-section">
            <h4 className="rv-modal-label">What it does</h4>
            <p className="rv-modal-text">{pattern.quickSummary}</p>
          </section>

          <div className="rv-modal-two-col">
            <section className="rv-modal-section">
              <h4 className="rv-modal-label rv-modal-label--use">Use when</h4>
              <p className="rv-modal-text">{pattern.usageSignal}</p>
            </section>
            <section className="rv-modal-section">
              <h4 className="rv-modal-label rv-modal-label--warn">Watch out</h4>
              <p className="rv-modal-text">{pattern.watchOut}</p>
            </section>
          </div>

          {pattern.whenToUse && pattern.whenToUse.length > 0 && (
            <section className="rv-modal-section">
              <h4 className="rv-modal-label">When to use</h4>
              <ul className="rv-modal-list">
                {pattern.whenToUse.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </section>
          )}

          {pattern.realWorldExamples && pattern.realWorldExamples.length > 0 && (
            <section className="rv-modal-section">
              <h4 className="rv-modal-label">Real world</h4>
              <ul className="rv-modal-list rv-modal-list--gold">
                {pattern.realWorldExamples.slice(0, 2).map((ex, i) => <li key={i}>{ex}</li>)}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RevisionGuide() {
  const [activePriority, setActivePriority] = useState("All");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("priority");
  const [search, setSearch] = useState("");
  const [openPattern, setOpenPattern] = useState(null);

  const stats = useMemo(() => {
    const total = PATTERNS.length;
    const important = PATTERNS.filter((p) => p.priority === "Important").length;
    const goodToHave = PATTERNS.filter((p) => p.priority === "Good to Have").length;
    const rare = PATTERNS.filter((p) => p.priority === "Rarely Used").length;
    return { total, important, goodToHave, rare };
  }, []);

  const filtered = useMemo(() => {
    let list = PATTERNS.filter((p) => {
      if (activePriority !== "All" && p.priority !== activePriority) return false;
      if (activeCategory !== "All" && p.category !== activeCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${p.name} ${p.tagline ?? ""} ${p.quickSummary ?? ""} ${p.category}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "priority") {
        const pd = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        return pd !== 0 ? pd : a.name.localeCompare(b.name);
      }
      if (sortBy === "alpha") return a.name.localeCompare(b.name);
      if (sortBy === "category") {
        const cd = a.category.localeCompare(b.category);
        return cd !== 0 ? cd : a.name.localeCompare(b.name);
      }
      return 0;
    });

    return list;
  }, [activePriority, activeCategory, sortBy, search]);

  return (
    <div className="rv-page">
      {/* ── Hero ──────────────────────────────────────────── */}
      <div className="rv-hero container">
        <span className="eyebrow-tag">Quick Revision</span>
        <h1 className="page-title">Design Patterns Cheatsheet</h1>
        <p className="page-subtitle">
          All {stats.total} GoF patterns distilled for a 15-minute revision sprint.
          Master the {stats.important} important ones first, then skim the rest.
        </p>

        <div className="rv-hero-stats">
          <div className="rv-stat rv-stat--important">
            <span className="rv-stat-num">{stats.important}</span>
            <span className="rv-stat-label">Must-know</span>
          </div>
          <div className="rv-stat rv-stat--good">
            <span className="rv-stat-num">{stats.goodToHave}</span>
            <span className="rv-stat-label">Good to have</span>
          </div>
          <div className="rv-stat rv-stat--rare">
            <span className="rv-stat-num">{stats.rare}</span>
            <span className="rv-stat-label">Rarely used</span>
          </div>
        </div>
      </div>

      {/* ── Controls ──────────────────────────────────────── */}
      <div className="rv-controls container">
        {/* Priority filter */}
        <div className="rv-filter-row">
          <span className="rv-filter-label">Priority</span>
          <div className="rv-pills" role="group" aria-label="Filter by priority">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                className={"rv-pill" + (activePriority === p ? " rv-pill--active" : "")}
                style={
                  activePriority === p && p !== "All"
                    ? { "--pill-color": PRIORITY_META[p]?.color, "--pill-bg": PRIORITY_META[p]?.bg }
                    : {}
                }
                onClick={() => setActivePriority(p)}
              >
                {p !== "All" && activePriority === p && (
                  <span className="rv-pill-dot" style={{ background: PRIORITY_META[p]?.color }} />
                )}
                {p}
                {p !== "All" && (
                  <span className="rv-pill-count">
                    {PATTERNS.filter((x) => x.priority === p).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Category + Sort + Search row */}
        <div className="rv-filter-row rv-filter-row--secondary">
          <span className="rv-filter-label">Category</span>
          <div className="rv-pills" role="group" aria-label="Filter by category">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={"rv-pill rv-pill--sm" + (activeCategory === cat ? " rv-pill--active" : "")}
                style={
                  activeCategory === cat && cat !== "All"
                    ? { "--pill-color": CATEGORY_META[cat]?.color, "--pill-bg": CATEGORY_META[cat]?.bg }
                    : {}
                }
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="rv-controls-right">
            <select
              className="rv-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort patterns"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <input
              type="search"
              className="rv-search"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search patterns"
            />
          </div>
        </div>

        <p className="rv-result-count">
          {filtered.length === PATTERNS.length
            ? `Showing all ${filtered.length} patterns`
            : `${filtered.length} of ${PATTERNS.length} patterns`}
        </p>
      </div>

      {/* ── Grid ──────────────────────────────────────────── */}
      <div className="rv-grid container">
        {filtered.length === 0 ? (
          <p className="rv-empty">No patterns match your filters.</p>
        ) : (
          filtered.map((p) => (
            <RevisionCard key={p.slug} pattern={p} onOpen={setOpenPattern} />
          ))
        )}
      </div>

      {/* ── Quick View Modal ──────────────────────────────── */}
      {openPattern && (
        <QuickViewModal pattern={openPattern} onClose={() => setOpenPattern(null)} />
      )}
    </div>
  );
}
