import React, { useMemo } from "react";
import { searchIndex } from "../utils/searchIndex";

export function CommandPalette({ open, query, onQueryChange, index, mode, onClose, onJump }) {
  const results = useMemo(() => searchIndex(index, query, mode), [index, query, mode]);
  const isQuickMode = mode === "quick15";
  if (!open) return null;

  return (
    <div className="palette-overlay" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <input
          className="text-input"
          autoFocus
          placeholder={isQuickMode ? "Quick 15-min mode: type to narrow topics..." : "Type command or topic..."}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        <div className="palette-list">
          {isQuickMode && !query.trim() && <p className="muted">Showing curated Quick 15 topics</p>}
          {results.map((item) => (
            <button
              key={item.id}
              className="palette-item"
              onClick={() => {
                onJump(item);
                onClose();
              }}
            >
              <strong>{item.title}</strong>
              <small>{item.section}</small>
            </button>
          ))}
          {results.length === 0 && <p className="muted">No commands/topics found</p>}
        </div>
      </div>
    </div>
  );
}
