import React from "react";

export function SnippetControls({ wrapCode, onToggleWrap }) {
  return (
    <div className="snippet-controls">
      <button className="ghost-btn" onClick={onToggleWrap}>
        {wrapCode ? "Disable Wrap" : "Enable Wrap"}
      </button>
    </div>
  );
}
