import React, { useMemo, useState, useCallback, useEffect } from "react";
import { SECTIONS } from "./src/data/appSections.js";
import { DP_INTERACTIVE_STEPS } from "./src/data/dpInteractiveSteps.js";
import { getCodeVariants, renderHighlightedCode } from "./src/utils/codeHighlight.jsx";
import { OBJECTIVE_VIEWS } from "./src/constants/appUi.js";
import { Header } from "./src/components/Header";
import { SectionTabs } from "./src/components/SectionTabs";
import { Breadcrumbs } from "./src/components/Breadcrumbs";
import { QuestionOptions } from "./src/components/QuestionOptions";
import { ResultCard } from "./src/components/ResultCard";
import { useDecisionTreeNavigation } from "./src/hooks/useDecisionTreeNavigation";
import { RevisionModeSwitcher } from "./src/components/RevisionModeSwitcher";
import { SearchBar } from "./src/components/SearchBar";
import { CommandPalette } from "./src/components/CommandPalette";
import { CompareView } from "./src/components/CompareView";
import { DecisionDebugger } from "./src/components/DecisionDebugger";
import { ComplexityHeatmap } from "./src/components/ComplexityHeatmap";
import { MistakeBank } from "./src/components/MistakeBank";
import { ProblemCueMapper } from "./src/components/ProblemCueMapper";
import { buildSearchIndex } from "./src/utils/searchIndex";
import { collectComplexityInsights } from "./src/utils/complexityInsights";
import { mapProblemCuesToPatterns } from "./src/utils/problemCueMapper";
import { MISTAKES_CATALOG } from "./src/data/mistakesCatalog";
import { useKeyboardNavigation } from "./src/hooks/useKeyboardNavigation";

export default function App() {
  const {
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
  } = useDecisionTreeNavigation(SECTIONS, "dataStructures");

  const [mode, setMode] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [cueText, setCueText] = useState("");
  const [theme, setTheme] = useState("light");
  const [objectiveView, setObjectiveView] = useState("core");

  const searchIndex = useMemo(() => buildSearchIndex(SECTIONS), []);
  const complexityRows = useMemo(() => collectComplexityInsights(SECTIONS), []);
  const cueSuggestions = useMemo(() => mapProblemCuesToPatterns(cueText), [cueText]);

  const handleJumpFromSearch = useCallback(
    (item) => {
      setObjectiveView("core");
      jumpToResult(item.sectionKey, item.optionTrail);
    },
    [jumpToResult]
  );

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  }, [theme]);

  useKeyboardNavigation({
    onBack: goBack,
    onReset: reset,
    onTogglePalette: () => setPaletteOpen((v) => !v),
  });

  return (
    <div className="page">
      <div className="container">
        <Header />
        <div className="objective-toggle-row">
          <div className="objective-toggle-left">
            {OBJECTIVE_VIEWS.map((view) => (
              <button
                key={view.id}
                className={`objective-toggle-btn ${objectiveView === view.id ? "active" : ""}`}
                onClick={() => setObjectiveView(view.id)}
              >
                {view.label}
              </button>
            ))}
          </div>
          <button className="objective-theme-btn" onClick={toggleTheme}>
            Theme: {theme === "dark" ? "Dark" : "Light"}
          </button>
        </div>
        {objectiveView === "core" && <SectionTabs sections={SECTIONS} currentSection={currentSection} onSwitchSection={switchSection} />}

        {objectiveView === "core" && <RevisionModeSwitcher mode={mode} onChange={setMode} />}
        {objectiveView === "core" && (
          <SearchBar index={searchIndex} query={searchQuery} onQueryChange={setSearchQuery} mode={mode} onJump={handleJumpFromSearch} />
        )}
        <CommandPalette
          open={paletteOpen}
          query={searchQuery}
          onQueryChange={setSearchQuery}
          index={searchIndex}
          mode={mode}
          onClose={() => setPaletteOpen(false)}
          onJump={handleJumpFromSearch}
        />
        {objectiveView === "core" && <ProblemCueMapper value={cueText} onChange={setCueText} suggestions={cueSuggestions} />}

        {objectiveView === "core" && (
          <div className="panel">
            <h2 className="panel-title">{sectionMeta.label}</h2>

            <Breadcrumbs path={path} onReset={reset} onJumpToPath={jumpToPathIndex} />

            <div className={`fade ${animating ? "animating" : ""}`}>
              {result ? (
                <ResultCard
                  key={result.name}
                  result={result}
                  onReset={reset}
                  getCodeVariants={getCodeVariants}
                  renderHighlightedCode={renderHighlightedCode}
                  dpSteps={DP_INTERACTIVE_STEPS}
                />
              ) : (
                <QuestionOptions currentNode={currentNode} onSelectOption={handleOption} onBack={goBack} hasPath={path.length > 0} />
              )}
            </div>
          </div>
        )}

        {objectiveView === "insights" && (
          <>
            <CompareView rows={complexityRows} />
            <DecisionDebugger path={path} result={result} />
            <ComplexityHeatmap rows={complexityRows} />
            <MistakeBank resultName={result?.name} catalog={MISTAKES_CATALOG} />
          </>
        )}
      </div>
    </div>
  );
}
