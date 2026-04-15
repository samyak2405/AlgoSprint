import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PATTERNS, CATEGORY_META } from "../data/patterns.js";

function PatternCard({ pattern, index }) {
  const navigate = useNavigate();
  const meta = CATEGORY_META[pattern.category];
  const preview = pattern.intent.length > 110
    ? pattern.intent.slice(0, 110).trimEnd() + "…"
    : pattern.intent;

  return (
    <div
      className="topic-card"
      style={{ "--cat-color": meta?.color, "--cat-bg": meta?.bg }}
      onClick={() => navigate(`/patterns/${pattern.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/patterns/${pattern.id}`)}
    >
      <div className="topic-card-header">
        <span className="topic-card-num">{String(index + 1).padStart(2, "0")}</span>
        <span className="topic-card-cat" style={{ color: meta?.color, background: meta?.bg }}>
          {pattern.category}
        </span>
      </div>
      <h3 className="topic-card-title">{pattern.name}</h3>
      <p className="topic-card-tagline">{pattern.tagline}</p>
      <p className="topic-card-preview">{preview}</p>
      <div className="topic-card-footer">
        <div className="topic-card-tags">
          {(pattern.tags || []).slice(0, 3).map((t) => (
            <span key={t} className="topic-tag">{t}</span>
          ))}
        </div>
        <span className="topic-card-cta">View →</span>
      </div>
    </div>
  );
}

export default function Patterns() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const categories = ["All", ...Object.keys(CATEGORY_META)];

  const filtered = PATTERNS.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const q = search.toLowerCase();
    return matchCat && (!q || p.name.toLowerCase().includes(q) || p.tagline.toLowerCase().includes(q));
  });

  return (
    <div className="container">
      <div className="page-header">
        <span className="eyebrow-tag">Patterns</span>
        <h1 className="page-title">Concurrency Patterns</h1>
        <p className="page-subtitle">
          Reusable solutions to recurring concurrency problems — from the Thread Pool
          to Fork-Join. Intent, participants, and full Java implementations.
        </p>
      </div>

      <div className="page-controls">
        <div className="filter-tabs">
          {categories.map((cat) => (
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
          placeholder="Search patterns…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">No patterns match your search.</div>
      ) : (
        <div className="topic-grid">
          {filtered.map((pattern, i) => (
            <PatternCard key={pattern.id} pattern={pattern} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
