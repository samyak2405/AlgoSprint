export function buildSections({ dataStructuresTree, algorithmTree, patternTree, mathTree }) {
  return {
    dataStructures: {
      label: "Data Structures",
      subtitle: "Quickly choose the right Java data structure.",
      tree: dataStructuresTree,
    },
    algorithms: {
      label: "Algorithms",
      subtitle: "Pick algorithms by constraints and tradeoffs.",
      tree: algorithmTree,
    },
    patterns: {
      label: "Patterns",
      subtitle: "Match problem statements to proven solving patterns.",
      tree: patternTree,
    },
    maths: {
      label: "Maths",
      subtitle: "Revise high-impact math for DSA and interviews.",
      tree: mathTree,
    },
  };
}
