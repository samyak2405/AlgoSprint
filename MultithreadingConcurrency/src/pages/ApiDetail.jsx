import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { JAVA_API, CATEGORY_META } from "../data/javaApi.js";
import CodeBlock from "../components/CodeBlock.jsx";
import SemaphoreViz from "../visualizers/SemaphoreViz.jsx";
import CountDownLatchViz from "../visualizers/CountDownLatchViz.jsx";

const VIZ_MAP = {
  "semaphore": <SemaphoreViz />,
  "count-down-latch": <CountDownLatchViz />,
};

export default function ApiDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const idx = JAVA_API.findIndex((a) => a.id === id);
  const api = JAVA_API[idx];

  if (!api) {
    return (
      <div className="container">
        <div className="detail-not-found">
          <p>API entry not found.</p>
          <button className="detail-back-btn" onClick={() => navigate("/java-api")}>
            ← Back to Java API
          </button>
        </div>
      </div>
    );
  }

  const meta = CATEGORY_META[api.category];
  const prev = JAVA_API[idx - 1];
  const next = JAVA_API[idx + 1];

  return (
    <div className="container">
      <button className="detail-back-btn" onClick={() => navigate("/java-api")}>
        ← Java API
      </button>

      <div className="detail-hero" style={{ "--cat-color": meta?.color, "--cat-bg": meta?.bg }}>
        <div className="detail-hero-top">
          <span className="detail-num">{String(idx + 1).padStart(2, "0")}</span>
          <span className="detail-cat" style={{ color: meta?.color, background: meta?.bg }}>
            {api.category}
          </span>
        </div>
        <h1 className="detail-title">{api.title}</h1>
        <div className="detail-tags">
          {api.tags.map((t) => <span key={t} className="topic-tag">{t}</span>)}
        </div>
      </div>

      <div className="detail-body">
        {/* Purpose */}
        <section className="detail-section">
          <h2 className="detail-section-title">Purpose</h2>
          <p className="detail-prose">{api.purpose}</p>
        </section>

        {/* Visualization */}
        {VIZ_MAP[api.id] && (
          <section className="detail-section">
            <h2 className="detail-section-title">Interactive Visualization</h2>
            {VIZ_MAP[api.id]}
          </section>
        )}

        {/* Key API */}
        <section className="detail-section">
          <h2 className="detail-section-title">Key API</h2>
          <CodeBlock code={api.signature} />
        </section>

        {/* Code examples */}
        <section className="detail-section">
          <h2 className="detail-section-title">Java Examples</h2>
          {api.codeExamples ? (
            api.codeExamples.map((ex) => (
              <div key={ex.title} className="code-example-block">
                <div className="code-example-header">
                  <h3 className="code-example-title">{ex.title}</h3>
                  {ex.description && <p className="code-example-desc">{ex.description}</p>}
                </div>
                <CodeBlock code={ex.code} />
              </div>
            ))
          ) : (
            <CodeBlock code={api.codeExample} />
          )}
        </section>

        {/* Pitfalls */}
        {api.pitfalls?.length > 0 && (
          <div className="detail-gotcha">
            <span className="detail-gotcha-label">Common Pitfalls</span>
            <ul className="detail-list detail-list--cross" style={{ marginTop: 10 }}>
              {api.pitfalls.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
        )}

        {/* Best Practices */}
        {api.bestPractices?.length > 0 && (
          <div className="detail-best-practices">
            <span className="detail-best-practices-label">Best Practices</span>
            <ul className="detail-best-practices-list">
              {api.bestPractices.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
        )}

        {/* Thumb Rules */}
        {api.thumbRules?.length > 0 && (
          <div className="detail-thumb-rules">
            <span className="detail-thumb-rules-label">Thumb Rules</span>
            <ul className="detail-thumb-rules-list">
              {api.thumbRules.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}

        {/* Hidden Truths */}
        {api.hiddenTruths?.length > 0 && (
          <div className="detail-hidden-truths">
            <span className="detail-hidden-truths-label">Hidden Truths</span>
            <ul className="detail-hidden-truths-list">
              {api.hiddenTruths.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        )}
      </div>

      <div className="detail-nav">
        <div>
          {prev && (
            <button className="detail-nav-btn detail-nav-btn--prev" onClick={() => navigate(`/java-api/${prev.id}`)}>
              <span className="detail-nav-dir">← Previous</span>
              <span className="detail-nav-name">{prev.title}</span>
            </button>
          )}
        </div>
        <div>
          {next && (
            <button className="detail-nav-btn detail-nav-btn--next" onClick={() => navigate(`/java-api/${next.id}`)}>
              <span className="detail-nav-dir">Next →</span>
              <span className="detail-nav-name">{next.title}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
