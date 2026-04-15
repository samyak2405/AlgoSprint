import React, { useState } from "react";
import { PROBLEMS } from "../data/problems.js";
import CodeBlock from "../components/CodeBlock.jsx";

function ProblemCard({ problem, index }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={"item-card" + (open ? " is-open" : "")}>
      <button className="item-card-header" onClick={() => setOpen((v) => !v)}>
        <div className="item-card-left">
          <span className="item-card-icon">{String(index + 1).padStart(2, "0")}</span>
          <div className="item-card-meta">
            <div className="item-card-title">{problem.title}</div>
            <div className="item-card-tags">
              <span
                className="item-tag"
                style={{ color: problem.difficultyColor, background: "transparent",
                  border: `1px solid ${problem.difficultyColor}` }}
              >
                {problem.difficulty}
              </span>
              <span className="item-tag" style={{ color: "var(--ink-3)", opacity: 0.7 }}>
                {problem.subtitle}
              </span>
              {problem.tags.slice(0, 2).map((t) => (
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
          {/* Description */}
          <div>
            <div className="item-section-label">Problem</div>
            <p className="item-prose">{problem.description}</p>
          </div>

          {/* Approach */}
          <div>
            <div className="item-section-label">Approach</div>
            <p className="item-definition">{problem.approach}</p>
          </div>

          {/* Solution */}
          <div>
            <div className="item-section-label">Java Solution</div>
            <CodeBlock code={problem.solution} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Problems() {
  const [search, setSearch] = useState("");
  const [activeDifficulty, setActiveDifficulty] = useState("All");

  const difficulties = ["All", "Easy", "Medium", "Hard"];

  const filtered = PROBLEMS.filter((p) => {
    const matchDiff = activeDifficulty === "All" || p.difficulty === activeDifficulty;
    const q = search.toLowerCase();
    const matchSearch = !q || p.title.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q));
    return matchDiff && matchSearch;
  });

  return (
    <div className="container">
      <div className="page-header">
        <span className="eyebrow-tag">Problems</span>
        <h1 className="page-title">Classic Problems</h1>
        <p className="page-subtitle">
          LeetCode concurrency problems and classic theory problems — each with a
          full Java solution using both low-level primitives and java.util.concurrent.
        </p>
      </div>

      <div className="page-controls">
        <div className="filter-tabs">
          {difficulties.map((d) => (
            <button
              key={d}
              className={"filter-tab" + (activeDifficulty === d ? " filter-tab--active" : "")}
              onClick={() => setActiveDifficulty(d)}
            >
              {d}
            </button>
          ))}
        </div>
        <input
          type="search"
          className="page-search"
          placeholder="Search problems..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="item-list">
        {filtered.length === 0 ? (
          <div className="empty-state">No problems match your search.</div>
        ) : (
          filtered.map((problem, i) => (
            <ProblemCard key={problem.id} problem={problem} index={i} />
          ))
        )}
      </div>
    </div>
  );
}
