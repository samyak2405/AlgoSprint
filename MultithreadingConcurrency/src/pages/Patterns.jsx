import React, { useState } from "react";
import { PATTERNS, CATEGORY_META } from "../data/patterns.js";
import CodeBlock from "../components/CodeBlock.jsx";
import ProducerConsumerViz from "../visualizers/ProducerConsumerViz.jsx";
import ThreadPoolViz from "../visualizers/ThreadPoolViz.jsx";

function PatternCard({ pattern, index }) {
  const [open, setOpen] = useState(false);
  const meta = CATEGORY_META[pattern.category];

  return (
    <div className={"item-card" + (open ? " is-open" : "")}
         style={{ "--cat-color": meta?.color, "--cat-bg": meta?.bg }}
    >
      <button className="item-card-header" onClick={() => setOpen((v) => !v)}>
        <div className="item-card-left">
          <span className="item-card-icon">{String(index + 1).padStart(2, "0")}</span>
          <div className="item-card-meta">
            <div className="item-card-title">{pattern.name}</div>
            <div className="item-card-tags">
              <span className="item-tag" style={{ color: meta?.color, background: meta?.bg }}>
                {pattern.category}
              </span>
              <span className="item-tag" style={{ fontStyle: "italic", opacity: 0.8 }}>
                {pattern.tagline}
              </span>
            </div>
          </div>
        </div>
        <div className="item-card-right">
          <i className={"item-chevron" + (open ? " is-open" : "")}>▾</i>
        </div>
      </button>

      {open && (
        <div className="item-card-body">
          {/* Intent */}
          <div>
            <div className="item-section-label">Intent</div>
            <p className="item-definition">{pattern.intent}</p>
          </div>

          {/* Participants */}
          <div>
            <div className="item-section-label">Participants</div>
            <ul className="item-list-items item-list-items--arrow">
              {pattern.participants.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>

          {/* When to use */}
          <div>
            <div className="item-section-label">When to use</div>
            <ul className="item-list-items item-list-items--check">
              {pattern.whenToUse.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>

          {/* Visualization */}
          {pattern.id === "thread-pool" && (
            <div>
              <div className="item-section-label">Interactive Visualization</div>
              <ThreadPoolViz />
            </div>
          )}
          {pattern.id === "producer-consumer" && (
            <div>
              <div className="item-section-label">Interactive Visualization</div>
              <ProducerConsumerViz />
            </div>
          )}

          {/* Implementation */}
          <div>
            <div className="item-section-label">Java Implementation</div>
            <CodeBlock code={pattern.implementation} />
          </div>

          {/* Trade-offs */}
          <div className="item-takeaway">
            <span className="item-takeaway-label">Trade-offs</span>
            <p>{pattern.tradeoffs}</p>
          </div>
        </div>
      )}
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
    const matchSearch = !q || p.name.toLowerCase().includes(q) ||
      p.tagline.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div className="container">
      <div className="page-header">
        <span className="eyebrow-tag">Patterns</span>
        <h1 className="page-title">Concurrency Patterns</h1>
        <p className="page-subtitle">
          Reusable solutions to recurring concurrency problems — from the Thread Pool
          to Fork-Join. Each pattern includes intent, participants, and a full Java implementation.
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
          placeholder="Search patterns..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="item-list">
        {filtered.length === 0 ? (
          <div className="empty-state">No patterns match your search.</div>
        ) : (
          filtered.map((pattern, i) => (
            <PatternCard key={pattern.id} pattern={pattern} index={i} />
          ))
        )}
      </div>
    </div>
  );
}
