import React, { useMemo } from "react";
import { searchIndex } from "../utils/searchIndex";

export function SearchBar({ index, query, onQueryChange, mode, onJump }) {
  const results = useMemo(() => searchIndex(index, query, mode), [index, query, mode]);
  const isQuickMode = mode === "quick15";
  const shouldShowResults = query.trim() || isQuickMode;

  return (
    <div className="feature-card">
      <h3>{isQuickMode ? "Quick 15-min Revision" : "Search Topics"}</h3>
      <input
        className="text-input"
        placeholder={isQuickMode ? "Optional: narrow down quick revision topics..." : "Search by topic, complexity, or keyword..."}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />
      {shouldShowResults && (
        <div className="search-results">
          {isQuickMode && !query.trim() && <p className="muted">Curated quick path (15 high-impact topics)</p>}
          {results.length === 0 ? (
            <p className="muted">No matching topics</p>
          ) : (
            results.map((item) => (
              <button key={item.id} className="search-item" onClick={() => onJump(item)}>
                <strong>{item.title}</strong>
                <span>{item.section}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
