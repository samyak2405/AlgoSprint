import React, { useState } from "react";
import { JAVA_API, CATEGORY_META } from "../data/javaApi.js";
import CodeBlock from "../components/CodeBlock.jsx";
import SemaphoreViz from "../visualizers/SemaphoreViz.jsx";
import CountDownLatchViz from "../visualizers/CountDownLatchViz.jsx";

function ApiCard({ api, index }) {
  const [open, setOpen] = useState(false);
  const meta = CATEGORY_META[api.category];

  return (
    <div className={"item-card" + (open ? " is-open" : "")}
         style={{ "--cat-color": meta?.color, "--cat-bg": meta?.bg }}
    >
      <button className="item-card-header" onClick={() => setOpen((v) => !v)}>
        <div className="item-card-left">
          <span className="item-card-icon">{String(index + 1).padStart(2, "0")}</span>
          <div className="item-card-meta">
            <div className="item-card-title">{api.title}</div>
            <div className="item-card-tags">
              <span className="item-tag" style={{ color: meta?.color, background: meta?.bg }}>
                {api.category}
              </span>
              {api.tags.slice(0, 2).map((t) => (
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
          {/* Purpose */}
          <div>
            <div className="item-section-label">Purpose</div>
            <p className="item-definition">{api.purpose}</p>
          </div>

          {/* Visualization */}
          {api.id === "semaphore" && (
            <div>
              <div className="item-section-label">Interactive Visualization</div>
              <SemaphoreViz />
            </div>
          )}
          {api.id === "count-down-latch" && (
            <div>
              <div className="item-section-label">Interactive Visualization</div>
              <CountDownLatchViz />
            </div>
          )}

          {/* Signature */}
          <div>
            <div className="item-section-label">Key API</div>
            <CodeBlock code={api.signature} lang="java" />
          </div>

          {/* Code example */}
          <div>
            <div className="item-section-label">Java Example</div>
            <CodeBlock code={api.codeExample} />
          </div>

          {/* Pitfalls */}
          {api.pitfalls && api.pitfalls.length > 0 && (
            <div>
              <div className="item-section-label">Common Pitfalls</div>
              <ul className="item-list-items item-list-items--cross">
                {api.pitfalls.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
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
    const matchSearch = !q || a.title.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  return (
    <div className="container">
      <div className="page-header">
        <span className="eyebrow-tag">Java API</span>
        <h1 className="page-title">java.util.concurrent</h1>
        <p className="page-subtitle">
          The full Java concurrency API — executors, futures, synchronizers, queues,
          concurrent collections, atomics, and locks — with Java examples and gotchas.
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
              {cat !== "All" && CATEGORY_META[cat].count > 0 && (
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
          placeholder="Search API..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="item-list">
        {filtered.length === 0 ? (
          <div className="empty-state">No API entries match your search.</div>
        ) : (
          filtered.map((api, i) => (
            <ApiCard key={api.id} api={api} index={i} />
          ))
        )}
      </div>
    </div>
  );
}
