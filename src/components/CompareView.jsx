import React, { useMemo, useState } from "react";

export function CompareView({ rows }) {
  const sortedRows = useMemo(() => [...rows].sort((a, b) => a.topic.localeCompare(b.topic)), [rows]);
  const [leftId, setLeftId] = useState("");
  const [rightId, setRightId] = useState("");

  const left = useMemo(() => sortedRows.find((row) => row.id === leftId) || sortedRows[0], [sortedRows, leftId]);
  const right = useMemo(() => {
    if (rightId) return sortedRows.find((row) => row.id === rightId) || sortedRows[1] || sortedRows[0];
    if (sortedRows.length < 2) return sortedRows[0];
    return sortedRows[1];
  }, [sortedRows, rightId]);

  if (!sortedRows.length) return null;

  return (
    <div className="feature-card">
      <h3>Compare View</h3>
      <p className="muted">Choose any two topics and compare time/space complexity, use-cases, and tradeoffs.</p>

      <div className="insights-controls">
        <select className="insights-select" value={left?.id || ""} onChange={(e) => setLeftId(e.target.value)}>
          {sortedRows.map((row) => (
            <option key={`left-${row.id}`} value={row.id}>
              {row.topic} ({row.section})
            </option>
          ))}
        </select>
        <select className="insights-select" value={right?.id || ""} onChange={(e) => setRightId(e.target.value)}>
          {sortedRows.map((row) => (
            <option key={`right-${row.id}`} value={row.id}>
              {row.topic} ({row.section})
            </option>
          ))}
        </select>
      </div>

      <div className="compare-grid compare-grid-detailed">
        <CompareColumn title="Topic A" row={left} />
        <CompareColumn title="Topic B" row={right} />
      </div>
    </div>
  );
}

function CompareColumn({ title, row }) {
  if (!row) return null;
  return (
    <div className="compare-card">
      <h4>
        {title}: {row.topic}
      </h4>
      <p>
        <strong>Section:</strong> {row.section}
      </p>
      <p>
        <strong>Category:</strong> {row.pkg}
      </p>
      <p>
        <strong>Time complexity:</strong> {row.timeSummary}
      </p>
      <p>
        <strong>Space complexity:</strong> {row.spaceSummary}
      </p>
      <p>
        <strong>When to use:</strong> {row.whenToUse}
      </p>
      <p>
        <strong>Tradeoffs:</strong> {row.tradeoffs}
      </p>
    </div>
  );
}
