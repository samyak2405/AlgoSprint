const SPACE_KEY_RE = /(space|memory|extra|aux|recursion)/i;
const BIG_O_RE = /O\([^)]+\)|\b2\^n\b|\bn\^2\b|\bn\^3\b|\bn\*m\b|\bexponential\b/gi;

export function collectComplexityInsights(sections) {
  const rows = [];

  function walk(sectionKey, sectionLabel, node, optionTrail) {
    if (!node || !Array.isArray(node.options)) return;

    node.options.forEach((opt) => {
      const nextTrail = [...optionTrail, opt.label];
      if (opt.result) {
        rows.push(normalizeResult(sectionKey, sectionLabel, opt.result, nextTrail));
        return;
      }
      if (opt.next) walk(sectionKey, sectionLabel, opt.next, nextTrail);
    });
  }

  Object.entries(sections).forEach(([sectionKey, meta]) => {
    walk(sectionKey, meta.label, meta.tree, []);
  });

  return rows;
}

function normalizeResult(sectionKey, sectionLabel, result, optionTrail) {
  const complexity = result.complexity || {};
  const entries = Object.entries(complexity);
  const timeEntries = entries.filter(([key]) => !SPACE_KEY_RE.test(key));
  const spaceEntries = entries.filter(([key]) => SPACE_KEY_RE.test(key));

  const timeScores = timeEntries.map(([, value]) => complexityScore(String(value)));
  const spaceScores = spaceEntries.map(([, value]) => complexityScore(String(value)));
  const fallbackSpaceScore = complexityScore(extractBigONotationFromText(result.tradeoffs || ""));

  return {
    id: `${sectionKey}-${result.name}-${optionTrail.join("-")}`,
    sectionKey,
    section: sectionLabel,
    topic: result.name,
    pkg: result.pkg || "General",
    whenToUse: result.whenToUse || "",
    tradeoffs: result.tradeoffs || "",
    optionTrail,
    timeComparisons: timeEntries.map(([key, value]) => `${key}: ${value}`),
    spaceComparisons: spaceEntries.map(([key, value]) => `${key}: ${value}`),
    timeBestScore: timeScores.length ? Math.min(...timeScores) : 99,
    timeWorstScore: timeScores.length ? Math.max(...timeScores) : 99,
    spaceScore: spaceScores.length ? Math.min(...spaceScores) : fallbackSpaceScore,
    timeSummary: summarizeComparisons(timeEntries, "Time not specified"),
    spaceSummary: summarizeComparisons(spaceEntries, "Space not specified"),
    rawComplexity: entries.map(([key, value]) => `${key}: ${value}`).join(" | "),
  };
}

function summarizeComparisons(entries, fallback) {
  if (!entries.length) return fallback;
  return entries.map(([key, value]) => `${key}: ${value}`).join(" | ");
}

function extractBigONotationFromText(text) {
  const matches = String(text).match(BIG_O_RE);
  if (!matches || !matches.length) return "";
  return matches.join(" ");
}

function complexityScore(value) {
  const v = String(value).toLowerCase();
  if (!v) return 99;
  if (/\bo\(1\)|constant/.test(v)) return 1;
  if (/o\(log n\)|logarith/.test(v)) return 2;
  if (/o\(n\)|v\+e|o\(n\+k\)|o\(n\+m\)/.test(v)) return 3;
  if (/o\(n log n\)|o\(\(v\+e\) log v\)|o\(log e\)/.test(v)) return 4;
  if (/o\(n\^2\)|o\(n\*w\)|o\(n\*m\)|o\(ve\)|2\^k/.test(v)) return 5;
  if (/o\(n\^3\)|o\(2\^n\)|2\^n|exponential/.test(v)) return 6;
  return 7;
}
