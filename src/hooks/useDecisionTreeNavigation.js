import { useCallback, useMemo, useState } from "react";

export function useDecisionTreeNavigation(sections, initialSectionKey) {
  const [currentSection, setCurrentSection] = useState(initialSectionKey);
  const [path, setPath] = useState([]);
  const [currentNode, setCurrentNode] = useState(sections[initialSectionKey].tree);
  const [result, setResult] = useState(null);
  const [animating, setAnimating] = useState(false);

  const sectionMeta = useMemo(() => sections[currentSection], [sections, currentSection]);

  const switchSection = useCallback(
    (sectionKey) => {
      setCurrentSection(sectionKey);
      setPath([]);
      setCurrentNode(sections[sectionKey].tree);
      setResult(null);
    },
    [sections]
  );

  const reset = useCallback(() => {
    setPath([]);
    setCurrentNode(sections[currentSection].tree);
    setResult(null);
  }, [sections, currentSection]);

  const handleOption = useCallback(
    (option) => {
      setAnimating(true);
      setTimeout(() => {
        if (option.result) {
          setResult(option.result);
          setPath((prev) => [...prev, { label: option.label, node: currentNode }]);
        } else if (option.next) {
          setPath((prev) => [...prev, { label: option.label, node: currentNode }]);
          setCurrentNode(option.next);
        }
        setAnimating(false);
      }, 120);
    },
    [currentNode]
  );

  const goBack = useCallback(() => {
    if (!path.length) return;
    setAnimating(true);
    setTimeout(() => {
      const copy = [...path];
      const last = copy.pop();
      setPath(copy);
      setCurrentNode(last.node);
      setResult(null);
      setAnimating(false);
    }, 120);
  }, [path]);

  // Jump to any breadcrumb step (complete backtracking)
  const jumpToPathIndex = useCallback(
    (targetIndex) => {
      if (targetIndex < 0 || targetIndex >= path.length) return;
      setAnimating(true);
      setTimeout(() => {
        const nextPath = path.slice(0, targetIndex);
        setPath(nextPath);
        setCurrentNode(path[targetIndex].node);
        setResult(null);
        setAnimating(false);
      }, 120);
    },
    [path]
  );

  const jumpToResult = useCallback(
    (sectionKey, optionTrail) => {
      const section = sections[sectionKey];
      if (!section || !Array.isArray(optionTrail) || optionTrail.length === 0) return;

      const nextPath = [];
      let node = section.tree;
      let selectedResult = null;

      for (const label of optionTrail) {
        if (!node || !Array.isArray(node.options)) return;
        const selectedOption = node.options.find((opt) => opt.label === label);
        if (!selectedOption) return;

        nextPath.push({ label, node });

        if (selectedOption.result) {
          selectedResult = selectedOption.result;
          break;
        }
        node = selectedOption.next;
      }

      if (!selectedResult) return;

      setCurrentSection(sectionKey);
      setPath(nextPath);
      setCurrentNode(node);
      setResult(selectedResult);
    },
    [sections]
  );

  return {
    currentSection,
    sectionMeta,
    path,
    currentNode,
    result,
    animating,
    switchSection,
    reset,
    handleOption,
    goBack,
    jumpToPathIndex,
    jumpToResult,
  };
}
