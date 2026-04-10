import React, { useMemo, useState } from "react";

export function ComplexityHeatmap({ rows }) {
  const [query, setQuery] = useState("");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [sortBy, setSortBy] = useState("timeWorst");

  const sections = useMemo(() => Array.from(new Set(rows.map((row) => row.section))).sort(), [rows]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let next = rows.filter((row) => {
      if (sectionFilter !== "all" && row.section !== sectionFilter) return false;
      if (!q) return true;
      return `${row.topic} ${row.pkg} ${row.rawComplexity}`.toLowerCase().includes(q);
    });

    const sorters = {
      timeWorst: (a, b) => a.timeWorstScore - b.timeWorstScore || a.topic.localeCompare(b.topic),
      timeBest: (a, b) => a.timeBestScore - b.timeBestScore || a.topic.localeCompare(b.topic),
      space: (a, b) => a.spaceScore - b.spaceScore || a.topic.localeCompare(b.topic),
      topic: (a, b) => a.topic.localeCompare(b.topic),
    };

    next = next.sort(sorters[sortBy] || sorters.timeWorst);
    return next;
  }, [rows, query, sectionFilter, sortBy]);

  return (
    <div className="feature-card">
      <h3>Complexity Heatmap</h3>
      <p className="muted">Detailed time/space comparison across decision-tree topics.</p>

      <div className="insights-controls">
        <input
          className="text-input"
          placeholder="Filter by topic/package/complexity..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="insights-select" value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
          <option value="all">All sections</option>
          {sections.map((section) => (
            <option key={section} value={section}>
              {section}
            </option>
          ))}
        </select>
        <select className="insights-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="timeWorst">Sort: lower worst-case time first</option>
          <option value="timeBest">Sort: lower best-case time first</option>
          <option value="space">Sort: lower space first</option>
          <option value="topic">Sort: topic name</option>
        </select>
      </div>

      <div className="table-wrap">
        <table className="heatmap-table">
          <thead>
            <tr>
              <th>Topic</th>
              <th>Section</th>
              <th>Category</th>
              <th>Time (best)</th>
              <th>Time (worst)</th>
              <th>Time details</th>
              <th>Space details</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id}>
                <td>{row.topic}</td>
                <td>{row.section}</td>
                <td>{row.pkg}</td>
                <td>
                  <ComplexityCell score={row.timeBestScore} text={scoreToTier(row.timeBestScore)} />
                </td>
                <td>
                  <ComplexityCell score={row.timeWorstScore} text={scoreToTier(row.timeWorstScore)} />
                </td>
                <td>{row.timeSummary}</td>
                <td>{row.spaceSummary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComplexityCell({ score, text }) {
  return (
    <span className={`heat-badge heat-${Math.min(score, 7)}`}>
      {text}
    </span>
  );
}

function scoreToTier(score) {
  if (score <= 1) return "O(1)";
  if (score === 2) return "O(log n)";
  if (score === 3) return "O(n)";
  if (score === 4) return "O(n log n)";
  if (score === 5) return "O(n^2)+";
  if (score === 6) return "Exponential";
  return "Mixed";
}
