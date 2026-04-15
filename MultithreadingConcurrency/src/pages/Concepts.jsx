import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CONCEPTS, CATEGORY_META } from "../data/concepts.js";

function ConceptCard({ concept, index }) {
  const navigate = useNavigate();
  const meta = CATEGORY_META[concept.category];
  const preview = concept.definition.length > 110
    ? concept.definition.slice(0, 110).trimEnd() + "…"
    : concept.definition;

  return (
    <div
      className="topic-card"
      style={{ "--cat-color": meta?.color, "--cat-bg": meta?.bg }}
      onClick={() => navigate(`/concepts/${concept.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/concepts/${concept.id}`)}
    >
      <div className="topic-card-header">
        <span className="topic-card-num">{String(index + 1).padStart(2, "0")}</span>
        <span className="topic-card-cat" style={{ color: meta?.color, background: meta?.bg }}>
          {concept.category}
        </span>
      </div>
      <h3 className="topic-card-title">{concept.title}</h3>
      <p className="topic-card-preview">{preview}</p>
      <div className="topic-card-footer">
        <div className="topic-card-tags">
          {concept.tags.slice(0, 3).map((t) => (
            <span key={t} className="topic-tag">{t}</span>
          ))}
        </div>
        <span className="topic-card-cta">View →</span>
      </div>
    </div>
  );
}

export default function Concepts() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const categories = ["All", ...Object.keys(CATEGORY_META)];

  const filtered = CONCEPTS.filter((c) => {
    const matchCat = activeCategory === "All" || c.category === activeCategory;
    const q = search.toLowerCase();
    return matchCat && (!q || c.title.toLowerCase().includes(q) || c.tags.some((t) => t.toLowerCase().includes(q)));
  });

  return (
    <div className="container">
      <div className="page-header">
        <span className="eyebrow-tag">Concepts</span>
        <h1 className="page-title">Core Concepts</h1>
        <p className="page-subtitle">
          The theory behind Java concurrency — thread lifecycle, memory model,
          synchronization primitives, and common pitfalls.
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
              {cat !== "All" && (
                <span style={{ marginLeft: 6, opacity: 0.55, fontSize: "0.85em" }}>
                  {CATEGORY_META[cat].count}
                </span>
              )}
            </button>
          ))}
        </div>
        <input
          type="search"
          className="page-search"
          placeholder="Search concepts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">No concepts match your search.</div>
      ) : (
        <div className="topic-grid">
          {filtered.map((concept, i) => (
            <ConceptCard key={concept.id} concept={concept} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
