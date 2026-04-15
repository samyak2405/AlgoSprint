import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { PATTERNS, CATEGORIES, CATEGORY_META } from "../data/patterns.js";
import ClassDiagram from "../components/ClassDiagram.jsx";

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div className="code-block">
      <button className="code-copy-btn" onClick={copy} aria-label="Copy code">
        {copied ? "Copied!" : "Copy"}
      </button>
      <pre><code>{code}</code></pre>
    </div>
  );
}

function CodeComparison({ badCode, goodCode }) {
  const [active, setActive] = useState("good");
  return (
    <div className="code-comparison">
      <div className="code-tabs">
        <button
          className={`code-tab code-tab--bad${active === "bad" ? " is-active" : ""}`}
          onClick={() => setActive("bad")}
        >
          ✗ Before (Problem)
        </button>
        <button
          className={`code-tab code-tab--good${active === "good" ? " is-active" : ""}`}
          onClick={() => setActive("good")}
        >
          ✓ After (Pattern Applied)
        </button>
      </div>
      <div className="code-block" style={{ borderRadius: 0, margin: 0 }}>
        <pre><code>{active === "bad" ? badCode : goodCode}</code></pre>
      </div>
    </div>
  );
}

function ExpandIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
      <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
    </svg>
  );
}

function CompressIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
      <line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/>
    </svg>
  );
}

function PatternDrawer({ pattern, onClose }) {
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (fullscreen) setFullscreen(false);
        else onClose();
      }
      if (e.key === "f" || e.key === "F") setFullscreen((v) => !v);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, fullscreen]);

  const meta = CATEGORY_META[pattern.category];

  return (
    <div
      className={"drawer-backdrop" + (fullscreen ? " drawer-backdrop--fullscreen" : "")}
      onClick={fullscreen ? undefined : onClose}
    >
      <aside
        className={"drawer" + (fullscreen ? " drawer--fullscreen" : "")}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={pattern.name}
      >
        <div className="drawer-header">
          <div>
            <span
              className="drawer-category-badge"
              style={{ "--cat-color": meta.color, "--cat-bg": meta.bg }}
            >
              {pattern.category}
            </span>
            <h2 className="drawer-title">{pattern.name}</h2>
          </div>
          <div className="drawer-header-actions">
            <button
              className="drawer-action-btn"
              onClick={() => setFullscreen((v) => !v)}
              aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              title={fullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
            >
              {fullscreen ? <CompressIcon /> : <ExpandIcon />}
              <span>{fullscreen ? "Exit" : "Expand"}</span>
            </button>
            <button className="drawer-close" onClick={onClose} aria-label="Close">×</button>
          </div>
        </div>

        <div className="drawer-body">
          <div className="drawer-col-article">
            {/* Definition */}
            <section className="drawer-section">
              <h3 className="drawer-section-label">Definition</h3>
              <p className="drawer-intent">{pattern.definition}</p>
            </section>

            {/* When to Use */}
            <section className="drawer-section">
              <h3 className="drawer-section-label">When to Use</h3>
              <ul className="drawer-list">
                {(pattern.whenToUse ?? []).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>

            {/* Pros & Cons */}
            <section className="drawer-section drawer-pros-cons">
              <div className="pros">
                <h3 className="drawer-section-label">Pros</h3>
                <ul className="drawer-list drawer-list--green">
                  {(pattern.pros ?? []).map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
              <div className="cons">
                <h3 className="drawer-section-label">Cons</h3>
                <ul className="drawer-list drawer-list--red">
                  {(pattern.cons ?? []).map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            </section>

            {/* How to Think */}
            {pattern.howToThink && pattern.howToThink.length > 0 && (
              <section className="drawer-section">
                <h3 className="drawer-section-label">How to Think Before Applying</h3>
                <ol className="drawer-think-list">
                  {pattern.howToThink.map((step, i) => (
                    <li key={i}>
                      <span className="drawer-think-num">{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Real World Examples */}
            {pattern.realWorldExamples && pattern.realWorldExamples.length > 0 && (
              <section className="drawer-section">
                <h3 className="drawer-section-label">Real World Examples</h3>
                <ul className="drawer-examples-list">
                  {pattern.realWorldExamples.map((ex, i) => (
                    <li key={i}>{ex}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Class Diagram */}
            {pattern.classDiagram && (
              <section className="drawer-section">
                <h3 className="drawer-section-label">Class Diagram</h3>
                <div className="drawer-diagram-wrap">
                  <ClassDiagram diagram={pattern.classDiagram} />
                </div>
              </section>
            )}
          </div>

          {/* Code column — bad/good comparison */}
          <div className="drawer-col-code">
            <section className="drawer-section">
              <h3 className="drawer-section-label">Implementation</h3>
              {pattern.badCode && pattern.goodCode ? (
                <CodeComparison badCode={pattern.badCode} goodCode={pattern.goodCode} />
              ) : (
                <CodeBlock code={pattern.goodCode ?? pattern.javaCode ?? ""} />
              )}
            </section>
          </div>
        </div>
      </aside>
    </div>
  );
}

function PatternCard({ pattern, onClick }) {
  const meta = CATEGORY_META[pattern.category];
  return (
    <button
      className="pattern-card"
      onClick={() => onClick(pattern)}
      style={{ "--cat-color": meta.color }}
    >
      <div className="pattern-card-header">
        <span
          className="pattern-card-badge"
          style={{ "--cat-color": meta.color, "--cat-bg": meta.bg }}
        >
          {pattern.category}
        </span>
      </div>
      <h3 className="pattern-card-name">{pattern.name}</h3>
      <p className="pattern-card-intent">{pattern.definition ?? pattern.intent}</p>
      <span className="pattern-card-cta">View pattern →</span>
    </button>
  );
}

export default function Patterns() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [search, setSearch] = useState("");

  const initialCat = searchParams.get("cat") || "All";
  const [activeCategory, setActiveCategory] = useState(
    CATEGORIES.includes(initialCat) ? initialCat : "All"
  );

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setSearchParams(cat === "All" ? {} : { cat });
  };

  const filtered = PATTERNS.filter((p) => {
    const matchesCat = activeCategory === "All" || p.category === activeCategory;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.definition ?? p.intent ?? "").toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="patterns-page">
      <div className="patterns-header container">
        <div>
          <span className="eyebrow-tag">Gang of Four</span>
          <h1 className="page-title">Design Patterns</h1>
          <p className="page-subtitle">
            {PATTERNS.length} patterns across 3 categories. Click any card to see intent,
            trade-offs, and Java implementation.
          </p>
        </div>
      </div>

      <div className="patterns-controls container">
        <div className="category-tabs" role="tablist" aria-label="Filter by category">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={activeCategory === cat}
              className={"cat-tab" + (activeCategory === cat ? " cat-tab--active" : "")}
              style={
                activeCategory === cat && cat !== "All"
                  ? { "--tab-color": CATEGORY_META[cat]?.color }
                  : {}
              }
              onClick={() => handleCategoryChange(cat)}
            >
              {cat}
              {cat !== "All" && (
                <span className="cat-tab-count">
                  {CATEGORY_META[cat].count}
                </span>
              )}
            </button>
          ))}
        </div>

        <input
          type="search"
          className="patterns-search"
          placeholder="Search patterns…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search patterns"
        />
      </div>

      {/* Category description strip */}
      {activeCategory !== "All" && (
        <div
          className="category-strip container"
          style={{
            "--cat-color": CATEGORY_META[activeCategory].color,
            "--cat-bg": CATEGORY_META[activeCategory].bg,
          }}
        >
          <span className="category-strip-label">{activeCategory}</span>
          <p className="category-strip-desc">{CATEGORY_META[activeCategory].description}</p>
        </div>
      )}

      <div className="patterns-grid container">
        {filtered.length === 0 ? (
          <p className="patterns-empty">No patterns match your search.</p>
        ) : (
          filtered.map((p) => (
            <PatternCard key={p.slug} pattern={p} onClick={setSelectedPattern} />
          ))
        )}
      </div>

      {selectedPattern && (
        <PatternDrawer
          pattern={selectedPattern}
          onClose={() => setSelectedPattern(null)}
        />
      )}
    </div>
  );
}
