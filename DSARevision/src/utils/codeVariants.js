export function getCodeVariants(result, dpCodeVariants) {
  if (result.codeVariants && result.codeVariants.length) return result.codeVariants;
  if (result.name.startsWith("DP Variation:")) {
    const known = dpCodeVariants[result.name];
    if (known) return known;
    return [
      {
        title: "1) Recursive (plain)",
        code: `// Recursive idea for ${result.name}
// Define state, recurse over choices, combine subproblems.`,
      },
      {
        title: "2) Memoization + recursion (top-down)",
        code: `// Top-down memoized version
// Cache by state key and reuse overlapping subproblems.`,
      },
      {
        title: "3) Iterative DP (bottom-up)",
        code: result.javaCode,
      },
    ];
  }
  return [{ title: "Java", code: result.javaCode }];
}
