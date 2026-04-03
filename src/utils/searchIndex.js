export function buildSearchIndex(sections) {
  const entries = [];

  function walkNode(sectionKey, sectionLabel, node, questionTrail, optionTrail) {
    if (!node) return;
    const baseTrail = [...questionTrail, node.question || sectionLabel].filter(Boolean);
    if (Array.isArray(node.options)) {
      node.options.forEach((opt) => {
        const nextOptionTrail = [...optionTrail, opt.label];
        if (opt.result) {
          entries.push({
            id: `${sectionKey}-${opt.result.name}-${nextOptionTrail.join("-")}`,
            title: opt.result.name,
            section: sectionLabel,
            sectionKey,
            trail: [...baseTrail, opt.label],
            optionTrail: nextOptionTrail,
            keywords: [
              opt.result.name,
              opt.result.pkg,
              opt.result.whenToUse,
              opt.result.why,
              opt.result.tradeoffs,
              ...Object.keys(opt.result.complexity || {}),
              ...Object.values(opt.result.complexity || {}),
              ...(opt.result.codeVariants || []).map((variant) => variant.title),
              opt.label,
              ...nextOptionTrail,
              ...baseTrail,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase(),
            quick15Score: getQuick15Score(opt.result.name, opt.result.pkg, opt.result.complexity),
          });
        } else if (opt.next) {
          walkNode(sectionKey, sectionLabel, opt.next, [...baseTrail, opt.label], nextOptionTrail);
        }
      });
    }
  }

  Object.entries(sections).forEach(([key, meta]) => {
    walkNode(key, meta.label, meta.tree, [], []);
  });

  const quick15Ids = new Set(
    [...entries]
      .sort((a, b) => b.quick15Score - a.quick15Score || a.title.localeCompare(b.title))
      .filter((entry) => entry.quick15Score > 0)
      .slice(0, 15)
      .map((entry) => entry.id)
  );

  return entries.map((entry) => ({
    ...entry,
    quick15: quick15Ids.has(entry.id),
  }));
}

export function searchIndex(index, query, mode) {
  const q = query.trim().toLowerCase();
  if (!q) {
    if (mode === "quick15") return index.filter((entry) => entry.quick15).slice(0, 15);
    return [];
  }

  let results = index.filter((entry) => entry.keywords.includes(q));
  if (mode === "quick15") {
    const prioritized = [];
    const others = [];
    results.forEach((entry) => {
      if (entry.quick15) prioritized.push(entry);
      else others.push(entry);
    });
    results = [...prioritized, ...others].slice(0, 15);
  }

  return results.slice(0, 20);
}

function getQuick15Score(name = "", pkg = "", complexity = {}) {
  const text = `${name} ${pkg}`.toLowerCase();
  const valueText = Object.values(complexity)
    .join(" ")
    .toLowerCase();

  let score = 0;
  const weightedPatterns = [
    { re: /arraylist|hashmap|treemap|hashset|treeset/, weight: 8 },
    { re: /binary search|two pointers|sliding window|prefix sum|monotonic stack/, weight: 10 },
    { re: /bfs|dfs|dijkstra|union-find|topological|shortest path/, weight: 11 },
    { re: /dynamic programming|knapsack|lis|lcs|dp variation/, weight: 12 },
    { re: /heap|priority queue|segment tree|fenwick/, weight: 9 },
    { re: /mod|gcd|sieve|bit/, weight: 7 },
  ];

  weightedPatterns.forEach(({ re, weight }) => {
    if (re.test(text)) score += weight;
  });

  if (valueText.includes("o(1)")) score += 1;
  if (valueText.includes("o(log n)")) score += 1;

  return score;
}
