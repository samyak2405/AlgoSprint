import React from "react";

export function QuestionOptions({ currentNode, onSelectOption, onBack, hasPath }) {
  return (
    <>
      <div className="question-row">
        <span className="icon">{currentNode.icon}</span>
        <h3>{currentNode.question}</h3>
      </div>
      <div className="options">
        {currentNode.options.map((option, idx) => (
          <button className="option-btn" key={`${currentNode.id}-${idx}`} onClick={() => onSelectOption(option)}>
            <span className="opt-char">{String.fromCharCode(65 + idx)}</span>
            <span>{option.label}</span>
            <span className="arrow">→</span>
          </button>
        ))}
      </div>
      {hasPath && (
        <button className="ghost-btn" onClick={onBack}>
          Back
        </button>
      )}
    </>
  );
}
