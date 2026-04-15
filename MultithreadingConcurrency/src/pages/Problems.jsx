import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PROBLEMS } from "../data/problems.js";

const DIFF_COLOR = {
  Easy:   "var(--green)",
  Medium: "var(--gold)",
  Hard:   "var(--red)",
};

function ProblemCard({ problem, index }) {
  const navigate = useNavigate();
  const preview = problem.description.length > 110
    ? problem.description.slice(0, 110).trimEnd() + "…"
    : problem.description;
  const diffColor = DIFF_COLOR[problem.difficulty] || problem.difficultyColor;

  return (
    <div
      className="topic-card topic-card--problem"
      style={{ "--cat-color": diffColor }}
      onClick={() => navigate(`/problems/${problem.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/problems/${problem.id}`)}
    >
      <div className="topic-card-header">
        <span className="topic-card-num">{String(index + 1).padStart(2, "0")}</span>
        <span
          className="topic-card-cat"
          style={{ color: diffColor, background: "transparent", border: `1px solid ${diffColor}` }}
        >
          {problem.difficulty}
        </span>
        {problem.subtitle && (
          <span className="topic-card-subtitle">{problem.subtitle}</span>
        )}
      </div>
      <h3 className="topic-card-title">{problem.title}</h3>
      <p className="topic-card-preview">{preview}</p>
      <div className="topic-card-footer">
        <div className="topic-card-tags">
          {problem.tags.slice(0, 3).map((t) => (
            <span key={t} className="topic-tag">{t}</span>
          ))}
        </div>
        <span className="topic-card-cta">Solve →</span>
      </div>
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
    return matchDiff && (!q || p.title.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q)));
  });

  return (
    <div className="container">
      <div className="page-header">
        <span className="eyebrow-tag">Problems</span>
        <h1 className="page-title">Classic Problems</h1>
        <p className="page-subtitle">
          LeetCode concurrency problems and classic theory problems — each with a full
          Java solution using both low-level primitives and java.util.concurrent.
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
          placeholder="Search problems…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">No problems match your search.</div>
      ) : (
        <div className="topic-grid">
          {filtered.map((problem, i) => (
            <ProblemCard key={problem.id} problem={problem} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
