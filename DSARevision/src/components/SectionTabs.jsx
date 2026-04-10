import React from "react";

export function SectionTabs({ sections, currentSection, onSwitchSection }) {
  return (
    <section className="section-switcher">
      {Object.entries(sections).map(([key, value]) => (
        <button key={key} className={`section-tab ${key === currentSection ? "active" : ""}`} onClick={() => onSwitchSection(key)}>
          <span>{value.label}</span>
          <small>{value.subtitle}</small>
        </button>
      ))}
    </section>
  );
}
