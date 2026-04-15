import React, { useState } from "react";
import { SOLID_PRINCIPLES } from "../data/solid.js";

function CodeComparison({ violation, fix }) {
  const [tab, setTab] = useState("violation");
  const active = tab === "violation" ? violation : fix;

  return (
    <div className="code-comparison">
      <div className="code-tabs">
        <button
          className={"code-tab code-tab--bad" + (tab === "violation" ? " is-active" : "")}
          onClick={() => setTab("violation")}
        >
          {violation.title}
        </button>
        <button
          className={"code-tab code-tab--good" + (tab === "fix" ? " is-active" : "")}
          onClick={() => setTab("fix")}
        >
          {fix.title}
        </button>
      </div>
      <pre className={"code-block solid-code" + (tab === "fix" ? " code-block--good" : "")}>
        <code>{active.code}</code>
      </pre>
    </div>
  );
}

export default function Solid() {
  const [active, setActive] = useState(null);

  return (
    <div className="solid-page">
      <div className="solid-header container">
        <span className="eyebrow-tag">Object-Oriented Design</span>
        <h1 className="page-title">SOLID Principles</h1>
        <p className="page-subtitle">
          Five principles that make object-oriented designs more understandable, flexible,
          and maintainable. Each principle includes a violation and a clean fix.
        </p>

        {/* SOLID letter nav */}
        <div className="solid-letter-nav" role="navigation" aria-label="Jump to principle">
          {SOLID_PRINCIPLES.map((p) => (
            <a key={p.letter} href={`#principle-${p.letter}`} className="solid-letter-btn">
              {p.letter}
            </a>
          ))}
        </div>
      </div>

      <div className="solid-list container">
        {SOLID_PRINCIPLES.map((p, idx) => (
          <article
            key={p.letter}
            id={`principle-${p.letter}`}
            className="solid-card"
            style={{ "--idx": idx }}
          >
            <div className="solid-card-letter-col">
              <span className="solid-letter">{p.letter}</span>
            </div>

            <div className="solid-card-content">
              <header className="solid-card-header">
                <div>
                  <h2 className="solid-card-name">{p.name}</h2>
                  <p className="solid-card-tagline">"{p.tagline}"</p>
                </div>
              </header>

              <p className="solid-card-description">{p.description}</p>

              <CodeComparison violation={p.violation} fix={p.fix} />

              <div className="solid-takeaway">
                <span className="solid-takeaway-label">Key Takeaway</span>
                <p>{p.keyTakeaway}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
