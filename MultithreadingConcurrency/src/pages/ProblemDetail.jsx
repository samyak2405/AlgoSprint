import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PROBLEMS } from "../data/problems.js";
import CodeBlock from "../components/CodeBlock.jsx";

const DIFF_COLOR = {
  Easy:   "var(--green)",
  Medium: "var(--gold)",
  Hard:   "var(--red)",
};

export default function ProblemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const idx = PROBLEMS.findIndex((p) => p.id === id);
  const problem = PROBLEMS[idx];

  if (!problem) {
    return (
      <div className="container">
        <div className="detail-not-found">
          <p>Problem not found.</p>
          <button className="detail-back-btn" onClick={() => navigate("/problems")}>
            ← Back to Problems
          </button>
        </div>
      </div>
    );
  }

  const diffColor = DIFF_COLOR[problem.difficulty] || problem.difficultyColor;
  const prev = PROBLEMS[idx - 1];
  const next = PROBLEMS[idx + 1];

  return (
    <div className="container">
      <button className="detail-back-btn" onClick={() => navigate("/problems")}>
        ← Problems
      </button>

      <div className="detail-hero" style={{ "--cat-color": diffColor }}>
        <div className="detail-hero-top">
          <span className="detail-num">{String(idx + 1).padStart(2, "0")}</span>
          <span
            className="detail-cat"
            style={{ color: diffColor, background: "transparent", border: `1px solid ${diffColor}` }}
          >
            {problem.difficulty}
          </span>
          {problem.subtitle && (
            <span className="detail-subtitle-badge">{problem.subtitle}</span>
          )}
        </div>
        <h1 className="detail-title">{problem.title}</h1>
        <div className="detail-tags">
          {problem.tags.map((t) => <span key={t} className="topic-tag">{t}</span>)}
        </div>
      </div>

      <div className="detail-body">
        {/* Problem statement */}
        <section className="detail-section">
          <h2 className="detail-section-title">Problem</h2>
          <p className="detail-prose">{problem.description}</p>
        </section>

        {/* Approach */}
        <section className="detail-section">
          <h2 className="detail-section-title">Approach</h2>
          <p className="detail-prose">{problem.approach}</p>
        </section>

        {/* Solution */}
        <section className="detail-section">
          <h2 className="detail-section-title">Java Solution</h2>
          {problem.solutions ? (
            problem.solutions.map((ex) => (
              <div key={ex.title} className="code-example-block">
                <div className="code-example-header">
                  <h3 className="code-example-title">{ex.title}</h3>
                  {ex.description && <p className="code-example-desc">{ex.description}</p>}
                </div>
                <CodeBlock code={ex.code} />
              </div>
            ))
          ) : (
            <CodeBlock code={problem.solution} />
          )}
        </section>
      </div>

      <div className="detail-nav">
        <div>
          {prev && (
            <button className="detail-nav-btn detail-nav-btn--prev" onClick={() => navigate(`/problems/${prev.id}`)}>
              <span className="detail-nav-dir">← Previous</span>
              <span className="detail-nav-name">{prev.title}</span>
            </button>
          )}
        </div>
        <div>
          {next && (
            <button className="detail-nav-btn detail-nav-btn--next" onClick={() => navigate(`/problems/${next.id}`)}>
              <span className="detail-nav-dir">Next →</span>
              <span className="detail-nav-name">{next.title}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
