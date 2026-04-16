import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PATTERNS, CATEGORY_META } from "../data/patterns.js";
import CodeBlock from "../components/CodeBlock.jsx";
import ProducerConsumerViz from "../visualizers/ProducerConsumerViz.jsx";
import ThreadPoolViz from "../visualizers/ThreadPoolViz.jsx";

const VIZ_MAP = {
  "thread-pool": <ThreadPoolViz />,
  "producer-consumer": <ProducerConsumerViz />,
};

export default function PatternDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const idx = PATTERNS.findIndex((p) => p.id === id);
  const pattern = PATTERNS[idx];

  if (!pattern) {
    return (
      <div className="container">
        <div className="detail-not-found">
          <p>Pattern not found.</p>
          <button className="detail-back-btn" onClick={() => navigate("/patterns")}>
            ← Back to Patterns
          </button>
        </div>
      </div>
    );
  }

  const meta = CATEGORY_META[pattern.category];
  const prev = PATTERNS[idx - 1];
  const next = PATTERNS[idx + 1];

  return (
    <div className="container">
      <button className="detail-back-btn" onClick={() => navigate("/patterns")}>
        ← Patterns
      </button>

      <div className="detail-hero" style={{ "--cat-color": meta?.color, "--cat-bg": meta?.bg }}>
        <div className="detail-hero-top">
          <span className="detail-num">{String(idx + 1).padStart(2, "0")}</span>
          <span className="detail-cat" style={{ color: meta?.color, background: meta?.bg }}>
            {pattern.category}
          </span>
        </div>
        <h1 className="detail-title">{pattern.name}</h1>
        <p className="detail-tagline">{pattern.tagline}</p>
        {pattern.tags && (
          <div className="detail-tags">
            {pattern.tags.map((t) => <span key={t} className="topic-tag">{t}</span>)}
          </div>
        )}
      </div>

      <div className="detail-body">
        {/* Intent */}
        <section className="detail-section">
          <h2 className="detail-section-title">Intent</h2>
          <p className="detail-prose">{pattern.intent}</p>
        </section>

        {/* Participants */}
        <section className="detail-section">
          <h2 className="detail-section-title">Participants</h2>
          <ul className="detail-list detail-list--arrow">
            {pattern.participants.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </section>

        {/* When to use */}
        <section className="detail-section">
          <h2 className="detail-section-title">When to Use</h2>
          <ul className="detail-list detail-list--check">
            {pattern.whenToUse.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </section>

        {/* Visualization */}
        {VIZ_MAP[pattern.id] && (
          <section className="detail-section">
            <h2 className="detail-section-title">Interactive Visualization</h2>
            {VIZ_MAP[pattern.id]}
          </section>
        )}

        {/* Implementation */}
        <section className="detail-section">
          <h2 className="detail-section-title">Java Implementation</h2>
          {pattern.implementations ? (
            pattern.implementations.map((ex) => (
              <div key={ex.title} className="code-example-block">
                <div className="code-example-header">
                  <h3 className="code-example-title">{ex.title}</h3>
                  {ex.description && <p className="code-example-desc">{ex.description}</p>}
                </div>
                <CodeBlock code={ex.code} />
              </div>
            ))
          ) : (
            <CodeBlock code={pattern.implementation} />
          )}
        </section>

        {/* Trade-offs */}
        <div className="detail-takeaway">
          <span className="detail-takeaway-label">Trade-offs</span>
          <p>{pattern.tradeoffs}</p>
        </div>

        {/* Best Practices */}
        {pattern.bestPractices?.length > 0 && (
          <div className="detail-best-practices">
            <span className="detail-best-practices-label">Best Practices</span>
            <ul className="detail-best-practices-list">
              {pattern.bestPractices.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
        )}

        {/* Thumb Rules */}
        {pattern.thumbRules?.length > 0 && (
          <div className="detail-thumb-rules">
            <span className="detail-thumb-rules-label">Thumb Rules</span>
            <ul className="detail-thumb-rules-list">
              {pattern.thumbRules.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}

        {/* Hidden Truths */}
        {pattern.hiddenTruths?.length > 0 && (
          <div className="detail-hidden-truths">
            <span className="detail-hidden-truths-label">Hidden Truths</span>
            <ul className="detail-hidden-truths-list">
              {pattern.hiddenTruths.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        )}
      </div>

      <div className="detail-nav">
        <div>
          {prev && (
            <button className="detail-nav-btn detail-nav-btn--prev" onClick={() => navigate(`/patterns/${prev.id}`)}>
              <span className="detail-nav-dir">← Previous</span>
              <span className="detail-nav-name">{prev.name}</span>
            </button>
          )}
        </div>
        <div>
          {next && (
            <button className="detail-nav-btn detail-nav-btn--next" onClick={() => navigate(`/patterns/${next.id}`)}>
              <span className="detail-nav-dir">Next →</span>
              <span className="detail-nav-name">{next.name}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
