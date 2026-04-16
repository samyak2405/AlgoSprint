import React, { useState } from "react";
import { COMPARISONS, CATEGORY_META_COMPARE } from "../data/comparisons.js";

function CompareTable({ comparison }) {
  const meta = CATEGORY_META_COMPARE[comparison.category] || {};

  return (
    <section className="compare-section" id={comparison.id}>
      <div className="compare-section-header">
        <span
          className="compare-category-badge"
          style={{ color: meta.color, background: meta.bg }}
        >
          {comparison.category}
        </span>
        <h2 className="compare-title">{comparison.title}</h2>
        <p className="compare-summary">{comparison.summary}</p>
      </div>

      <div className="compare-table-wrapper">
        <table className="compare-table">
          <thead>
            <tr>
              <th className="compare-feature-col">Feature</th>
              {comparison.columns.map((col) => (
                <th key={col} className="compare-value-col">
                  <code>{col}</code>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparison.rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "compare-row-even" : "compare-row-odd"}>
                <td className="compare-feature-cell">{row.feature}</td>
                {row.values.map((val, j) => (
                  <td key={j} className="compare-value-cell">{val}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {comparison.notes?.length > 0 && (
        <div className="compare-notes">
          <span className="compare-notes-label">Key Insights</span>
          <ul>
            {comparison.notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default function Compare() {
  const [activeCategory, setActiveCategory] = useState("All");
  const categories = ["All", ...new Set(COMPARISONS.map((c) => c.category))];

  const filtered =
    activeCategory === "All"
      ? COMPARISONS
      : COMPARISONS.filter((c) => c.category === activeCategory);

  return (
    <div className="page-container">
      <div className="page-hero">
        <h1 className="page-title">Comparison Tables</h1>
        <p className="page-subtitle">
          Side-by-side comparison of Java concurrency classes — choose the right tool for the job.
        </p>
      </div>

      {/* Category filter */}
      <div className="filter-bar">
        {categories.map((cat) => (
          <button
            key={cat}
            className={"filter-pill" + (activeCategory === cat ? " filter-pill--active" : "")}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="compare-list">
        {filtered.map((comparison) => (
          <CompareTable key={comparison.id} comparison={comparison} />
        ))}
      </div>
    </div>
  );
}
