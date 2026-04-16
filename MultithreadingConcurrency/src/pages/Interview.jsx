import React, { useState } from "react";
import { INTERVIEW_QUESTIONS, INTERVIEW_TRAPS, DESIGN_TEMPLATES } from "../data/interview.js";

const CATEGORY_COLORS = {
  Fundamentals:    { color: "var(--blue)",  bg: "var(--blue-subtle)" },
  Synchronization: { color: "var(--red)",   bg: "var(--red-subtle)" },
  "Java API":      { color: "var(--gold)",  bg: "var(--gold-subtle)" },
  Performance:     { color: "var(--green)", bg: "var(--green-subtle)" },
  Patterns:        { color: "#A78BFA",      bg: "rgba(167,139,250,.12)" },
  Deadlock:        { color: "#F472B6",      bg: "rgba(244,114,182,.12)" },
  "Modern Java":   { color: "#34D399",      bg: "rgba(52,211,153,.12)" },
};

function QuestionCard({ q, index }) {
  const [expanded, setExpanded] = useState(false);
  const meta = CATEGORY_COLORS[q.category] || { color: "var(--ink-3)", bg: "var(--paper-2)" };

  return (
    <div className="interview-card" style={{ "--cat-color": meta.color, "--cat-bg": meta.bg }}>
      <button
        className="interview-card-header"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="interview-card-header-left">
          <span className="interview-q-num">Q{index + 1}</span>
          <span
            className="interview-category"
            style={{ color: meta.color, background: meta.bg }}
          >
            {q.category}
          </span>
          <span className="interview-question">{q.question}</span>
        </div>
        <span className="interview-toggle">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="interview-card-body">
          <div className="interview-answer">
            <span className="interview-section-label">Model Answer</span>
            <p>{q.answer}</p>
          </div>

          {q.code && (
            <div className="interview-code-block">
              <pre><code>{q.code}</code></pre>
            </div>
          )}

          {q.keyPoints?.length > 0 && (
            <div className="interview-key-points">
              <span className="interview-section-label">Key Points</span>
              <ul>
                {q.keyPoints.map((pt, i) => <li key={i}>{pt}</li>)}
              </ul>
            </div>
          )}

          {q.trap && (
            <div className="interview-trap">
              <span className="interview-trap-label">⚠ Common Trap</span>
              <p>{q.trap}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TrapCard({ trap }) {
  return (
    <div className="trap-card">
      <div className="trap-card-header">
        <span className="trap-icon">⚡</span>
        <strong className="trap-title">{trap.trap}</strong>
      </div>
      <p className="trap-detail">{trap.detail}</p>
    </div>
  );
}

function TemplateCard({ template }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="template-card">
      <button className="template-card-header" onClick={() => setExpanded((v) => !v)}>
        <div>
          <h3 className="template-title">{template.title}</h3>
          <p className="template-when">{template.when}</p>
        </div>
        <span className="interview-toggle">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div className="template-card-body">
          <p className="template-solution">{template.solution}</p>
          <pre className="interview-code-block"><code>{template.code}</code></pre>
        </div>
      )}
    </div>
  );
}

const TABS = ["Questions", "Traps", "Design Templates"];

export default function Interview() {
  const [activeTab, setActiveTab] = useState("Questions");
  const [activeCategory, setActiveCategory] = useState("All");
  const categories = ["All", ...new Set(INTERVIEW_QUESTIONS.map((q) => q.category))];

  const filteredQuestions =
    activeCategory === "All"
      ? INTERVIEW_QUESTIONS
      : INTERVIEW_QUESTIONS.filter((q) => q.category === activeCategory);

  return (
    <div className="page-container">
      <div className="page-hero">
        <h1 className="page-title">Interview Prep</h1>
        <p className="page-subtitle">
          Top interview questions, examiner traps, and design templates for Java concurrency interviews.
        </p>
      </div>

      {/* Tabs */}
      <div className="interview-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={"interview-tab" + (activeTab === tab ? " interview-tab--active" : "")}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {tab === "Questions" && <span className="interview-tab-count">{INTERVIEW_QUESTIONS.length}</span>}
            {tab === "Traps" && <span className="interview-tab-count">{INTERVIEW_TRAPS.length}</span>}
          </button>
        ))}
      </div>

      {/* Questions tab */}
      {activeTab === "Questions" && (
        <>
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
          <div className="interview-list">
            {filteredQuestions.map((q, i) => (
              <QuestionCard key={q.id} q={q} index={INTERVIEW_QUESTIONS.indexOf(q)} />
            ))}
          </div>
        </>
      )}

      {/* Traps tab */}
      {activeTab === "Traps" && (
        <div className="traps-grid">
          {INTERVIEW_TRAPS.map((trap, i) => (
            <TrapCard key={i} trap={trap} />
          ))}
        </div>
      )}

      {/* Design Templates tab */}
      {activeTab === "Design Templates" && (
        <div className="templates-list">
          {DESIGN_TEMPLATES.map((template, i) => (
            <TemplateCard key={i} template={template} />
          ))}
        </div>
      )}
    </div>
  );
}
