import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { JAVA_API, CATEGORY_META } from "../data/javaApi.js";

function ApiCard({ api, index }) {
  const navigate = useNavigate();
  const meta = CATEGORY_META[api.category];
  const preview = api.purpose.length > 110
    ? api.purpose.slice(0, 110).trimEnd() + "…"
    : api.purpose;

  return (
    <div
      className="topic-card"
      style={{ "--cat-color": meta?.color, "--cat-bg": meta?.bg }}
      onClick={() => navigate(`/java-api/${api.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/java-api/${api.id}`)}
    >
      <div className="topic-card-header">
        <span className="topic-card-num">{String(index + 1).padStart(2, "0")}</span>
        <span className="topic-card-cat" style={{ color: meta?.color, background: meta?.bg }}>
          {api.category}
        </span>
      </div>
      <h3 className="topic-card-title">{api.title}</h3>
      <p className="topic-card-preview">{preview}</p>
      <div className="topic-card-footer">
        <div className="topic-card-tags">
          {api.tags.slice(0, 3).map((t) => (
            <span key={t} className="topic-tag">{t}</span>
          ))}
        </div>
        <span className="topic-card-cta">View →</span>
      </div>
    </div>
  );
}

export default function JavaApi() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const categories = ["All", ...Object.keys(CATEGORY_META)];

  const filtered = JAVA_API.filter((a) => {
    const matchCat = activeCategory === "All" || a.category === activeCategory;
    const q = search.toLowerCase();
    return matchCat && (!q || a.title.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q)));
  });

  return (
    <div className="container">
      <div className="page-header">
        <span className="eyebrow-tag">Java API</span>
        <h1 className="page-title">java.util.concurrent</h1>
        <p className="page-subtitle">
          The full Java concurrency API — executors, futures, synchronizers, queues,
          concurrent collections, atomics, locks, and virtual threads.
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
              {cat !== "All" && CATEGORY_META[cat]?.count > 0 && (
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
          placeholder="Search API…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">No API entries match your search.</div>
      ) : (
        <div className="topic-grid">
          {filtered.map((api, i) => (
            <ApiCard key={api.id} api={api} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
