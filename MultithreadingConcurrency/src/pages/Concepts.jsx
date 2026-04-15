import React, { useState } from "react";
import { CONCEPTS, CATEGORY_META } from "../data/concepts.js";
import CodeBlock from "../components/CodeBlock.jsx";
import ThreadLifecycleViz from "../visualizers/ThreadLifecycleViz.jsx";
import DeadlockViz from "../visualizers/DeadlockViz.jsx";
import RaceConditionViz from "../visualizers/RaceConditionViz.jsx";
import JMMViz from "../visualizers/JMMViz.jsx";

function ConceptCard({ concept, index }) {
  const [open, setOpen] = useState(false);
  const meta = CATEGORY_META[concept.category];

  return (
    <div className={"item-card" + (open ? " is-open" : "")}
         style={{ "--cat-color": meta?.color, "--cat-bg": meta?.bg }}
    >
      <button className="item-card-header" onClick={() => setOpen((v) => !v)}>
        <div className="item-card-left">
          <span className="item-card-icon">{String(index + 1).padStart(2, "0")}</span>
          <div className="item-card-meta">
            <div className="item-card-title">{concept.title}</div>
            <div className="item-card-tags">
              <span className="item-tag" style={{ color: meta?.color, background: meta?.bg }}>
                {concept.category}
              </span>
              {concept.tags.slice(0, 2).map((t) => (
                <span key={t} className="item-tag">{t}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="item-card-right">
          <i className={"item-chevron" + (open ? " is-open" : "")}>▾</i>
        </div>
      </button>

      {open && (
        <div className="item-card-body">
          {/* Definition */}
          <div>
            <div className="item-section-label">Definition</div>
            <p className="item-definition">{concept.definition}</p>
          </div>

          {/* When to use */}
          <div>
            <div className="item-section-label">When to think about this</div>
            <ul className="item-list-items item-list-items--arrow">
              {concept.whenToUse.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>

          {/* How to think */}
          <div>
            <div className="item-section-label">How to think about it</div>
            <ul className="item-list-items">
              {concept.howToThink.map((h, i) => <li key={i}>{h}</li>)}
            </ul>
          </div>

          {/* Visualization */}
          {concept.id === "thread-lifecycle" && (
            <div>
              <div className="item-section-label">Interactive Visualization</div>
              <ThreadLifecycleViz />
            </div>
          )}
          {concept.id === "java-memory-model" && (
            <div>
              <div className="item-section-label">Interactive Visualization</div>
              <JMMViz />
            </div>
          )}
          {concept.id === "deadlock" && (
            <div>
              <div className="item-section-label">Interactive Visualization</div>
              <DeadlockViz />
            </div>
          )}
          {concept.id === "race-condition" && (
            <div>
              <div className="item-section-label">Interactive Visualization</div>
              <RaceConditionViz />
            </div>
          )}

          {/* Code example */}
          <div>
            <div className="item-section-label">Java Example</div>
            <CodeBlock code={concept.codeExample} />
          </div>

          {/* Gotcha */}
          <div className="item-gotcha">
            <strong>Gotcha: </strong>{concept.gotcha}
          </div>

          {/* Takeaway */}
          <div className="item-takeaway">
            <span className="item-takeaway-label">Key Takeaway</span>
            <p>{concept.takeaway}</p>
          </div>
        </div>
      )}
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
    const matchSearch = !q || c.title.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q));
    return matchCat && matchSearch;
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
                <span style={{ marginLeft: 6, opacity: 0.6 }}>
                  {CATEGORY_META[cat].count}
                </span>
              )}
            </button>
          ))}
        </div>
        <input
          type="search"
          className="page-search"
          placeholder="Search concepts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="item-list">
        {filtered.length === 0 ? (
          <div className="empty-state">No concepts match your search.</div>
        ) : (
          filtered.map((concept, i) => (
            <ConceptCard key={concept.id} concept={concept} index={i} />
          ))
        )}
      </div>
    </div>
  );
}
