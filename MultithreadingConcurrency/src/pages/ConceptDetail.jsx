import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CONCEPTS, CATEGORY_META } from "../data/concepts.js";
import CodeBlock from "../components/CodeBlock.jsx";
import ThreadLifecycleViz from "../visualizers/ThreadLifecycleViz.jsx";
import DeadlockViz from "../visualizers/DeadlockViz.jsx";
import RaceConditionViz from "../visualizers/RaceConditionViz.jsx";
import JMMViz from "../visualizers/JMMViz.jsx";

const VIZ_MAP = {
  "thread-lifecycle": <ThreadLifecycleViz />,
  "java-memory-model": <JMMViz />,
  "deadlock": <DeadlockViz />,
  "race-condition": <RaceConditionViz />,
};

export default function ConceptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const idx = CONCEPTS.findIndex((c) => c.id === id);
  const concept = CONCEPTS[idx];

  if (!concept) {
    return (
      <div className="container">
        <div className="detail-not-found">
          <p>Concept not found.</p>
          <button className="detail-back-btn" onClick={() => navigate("/concepts")}>
            ← Back to Concepts
          </button>
        </div>
      </div>
    );
  }

  const meta = CATEGORY_META[concept.category];
  const prev = CONCEPTS[idx - 1];
  const next = CONCEPTS[idx + 1];

  return (
    <div className="container">
      {/* Back */}
      <button className="detail-back-btn" onClick={() => navigate("/concepts")}>
        ← Concepts
      </button>

      {/* Hero */}
      <div className="detail-hero" style={{ "--cat-color": meta?.color, "--cat-bg": meta?.bg }}>
        <div className="detail-hero-top">
          <span className="detail-num">{String(idx + 1).padStart(2, "0")}</span>
          <span className="detail-cat" style={{ color: meta?.color, background: meta?.bg }}>
            {concept.category}
          </span>
        </div>
        <h1 className="detail-title">{concept.title}</h1>
        <div className="detail-tags">
          {concept.tags.map((t) => <span key={t} className="topic-tag">{t}</span>)}
        </div>
      </div>

      <div className="detail-body">
        {/* Definition */}
        <section className="detail-section">
          <h2 className="detail-section-title">Definition</h2>
          <p className="detail-prose">{concept.definition}</p>
        </section>

        {/* When to use */}
        <section className="detail-section">
          <h2 className="detail-section-title">When to Think About This</h2>
          <ul className="detail-list detail-list--arrow">
            {concept.whenToUse.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </section>

        {/* How to think */}
        <section className="detail-section">
          <h2 className="detail-section-title">How to Think About It</h2>
          <ul className="detail-list">
            {concept.howToThink.map((h, i) => <li key={i}>{h}</li>)}
          </ul>
        </section>

        {/* Visualization */}
        {VIZ_MAP[concept.id] && (
          <section className="detail-section">
            <h2 className="detail-section-title">Interactive Visualization</h2>
            {VIZ_MAP[concept.id]}
          </section>
        )}

        {/* Code Examples */}
        <section className="detail-section">
          <h2 className="detail-section-title">Java Examples</h2>
          {concept.codeExamples ? (
            concept.codeExamples.map((ex) => (
              <div key={ex.title} className="code-example-block">
                <div className="code-example-header">
                  <h3 className="code-example-title">{ex.title}</h3>
                  {ex.description && <p className="code-example-desc">{ex.description}</p>}
                </div>
                <CodeBlock code={ex.code} />
              </div>
            ))
          ) : (
            <CodeBlock code={concept.codeExample} />
          )}
        </section>

        {/* Gotcha */}
        <div className="detail-gotcha">
          <span className="detail-gotcha-label">Gotcha</span>
          <p>{concept.gotcha}</p>
        </div>

        {/* Takeaway */}
        <div className="detail-takeaway">
          <span className="detail-takeaway-label">Key Takeaway</span>
          <p>{concept.takeaway}</p>
        </div>
      </div>

      {/* Prev / Next */}
      <div className="detail-nav">
        <div>
          {prev && (
            <button className="detail-nav-btn detail-nav-btn--prev" onClick={() => navigate(`/concepts/${prev.id}`)}>
              <span className="detail-nav-dir">← Previous</span>
              <span className="detail-nav-name">{prev.title}</span>
            </button>
          )}
        </div>
        <div>
          {next && (
            <button className="detail-nav-btn detail-nav-btn--next" onClick={() => navigate(`/concepts/${next.id}`)}>
              <span className="detail-nav-dir">Next →</span>
              <span className="detail-nav-name">{next.title}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
