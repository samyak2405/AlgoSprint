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

function ThemeToggleFab({ theme, onToggle }) {
  const isDark = theme === "dark";
  const nextMode = isDark ? "light" : "dark";
  return (
    <button
      className="theme-toggle-fab"
      onClick={onToggle}
      aria-label={`Switch to ${nextMode} mode`}
    >
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
      <span>{nextMode.charAt(0).toUpperCase() + nextMode.slice(1)}</span>
    </button>
  );
}

export default function App() {
  const BASE_URL = import.meta.env.BASE_URL || "/";
  const SIMULATOR_URL =
    import.meta.env.VITE_SIMULATOR_URL || `${BASE_URL}system-design-simulator/`;
  const LLD_URL = import.meta.env.VITE_LLD_URL || `${BASE_URL}lld/`;
  const MT_URL = import.meta.env.VITE_MT_URL || `${BASE_URL}multithreading/`;

  const getAreaFromLocation = useCallback(() => {
    // Works with Vite base (e.g. BASE_URL="/AlgoSprint/")
    const raw = window.location.pathname || "/";
    const rel = raw.startsWith(BASE_URL) ? `/${raw.slice(BASE_URL.length)}` : raw;
    const pathOnly = rel.replace(/\/+$/, "") || "/";

    if (pathOnly === "/system-design") return "systemDesign";
    if (pathOnly === "/dsa") return "dsa";
    return "hub";
  }, [BASE_URL]);

  // Initialise from URL first, then fall back to sessionStorage if URL says "hub"
  // (covers the case where the user pressed back from LLD/simulator and the hub reloaded)
  const [siteArea, setSiteArea] = useState(() => {
    const fromUrl = getAreaFromLocation();
    if (fromUrl !== "hub") return fromUrl;
    try {
      const saved = sessionStorage.getItem("algosprint-area");
      if (saved && saved !== "hub") return saved;
    } catch {}
    return "hub";
  });

  const navigate = useCallback(
    (area) => {
      const path =
        area === "systemDesign" ? "system-design" : area === "dsa" ? "dsa" : "";
      const nextUrl = `${BASE_URL}${path}`;
      // Save area in history state so popstate can restore it without re-reading the URL
      window.history.pushState({ area }, "", nextUrl);
      try { sessionStorage.setItem("algosprint-area", area); } catch {}
      setSiteArea(area);
    },
    [BASE_URL]
  );

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

  // Sync area to sessionStorage whenever it changes
  useEffect(() => {
    try { sessionStorage.setItem("algosprint-area", siteArea); } catch {}
  }, [siteArea]);

  useEffect(() => {
    const onPopState = (e) => {
      // Prefer the area stored in the history state (set by navigate()), fall back to URL
      const area = e.state?.area || getAreaFromLocation();
      setSiteArea(area);
      try { sessionStorage.setItem("algosprint-area", area); } catch {}
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [getAreaFromLocation]);

  if (siteArea === "hub") {
    return (
      <div className="page">
        <ThemeToggleFab theme={theme} onToggle={toggleTheme} />
        <div className="container">
          <header className="header">
            <span className="eyebrow">AlgoSprint · Learning Hub</span>
            <h1>DSA · HLD · LLD · OOPs</h1>
            <p className="subtext">
              One place to jump into DSA revision, system design practice, and more.
            </p>
          </header>

          <div className="hub-grid">
            <div className="hub-card">
              <div className="hub-card-top">
                <h2 className="hub-card-title">DSA</h2>
                <p className="hub-card-desc">
                  Decision trees, patterns, visualizers, complexity, and code snippets.
                </p>
              </div>
              <button className="ghost-btn hub-card-cta" onClick={() => navigate("dsa")}>
                Open DSA
              </button>
            </div>

            <div className="hub-card">
              <div className="hub-card-top">
                <h2 className="hub-card-title">HLD</h2>
                <p className="hub-card-desc">
                  High Level Design hub: theory + simulator.
                </p>
              </div>
              <button className="ghost-btn hub-card-cta" onClick={() => navigate("systemDesign")}>
                Open System Design
              </button>
            </div>

            <div className="hub-card">
              <div className="hub-card-top">
                <h2 className="hub-card-title">LLD</h2>
                <p className="hub-card-desc">
                  Design patterns, SOLID principles, and common interview problems.
                </p>
              </div>
              <a
                className="ghost-btn hub-card-cta"
                href={LLD_URL}
                onClick={() => {
                  try { sessionStorage.removeItem("algosprint-area"); } catch {}
                }}
              >
                Open LLD
              </a>
            </div>

            <div className="hub-card hub-card-disabled">
              <div className="hub-card-top">
                <h2 className="hub-card-title">OOPs</h2>
                <p className="hub-card-desc">OOP concepts and examples (coming soon).</p>
              </div>
              <button className="ghost-btn hub-card-cta" disabled>
                Coming soon
              </button>
            </div>

            <div className="hub-card">
              <div className="hub-card-top">
                <h2 className="hub-card-title">Multithreading</h2>
                <p className="hub-card-desc">
                  Thread lifecycle, java.util.concurrent, concurrency patterns, and classic interview problems.
                </p>
              </div>
              <a
                className="ghost-btn hub-card-cta"
                href={MT_URL}
                onClick={() => {
                  try { sessionStorage.removeItem("algosprint-area"); } catch {}
                }}
              >
                Open Multithreading
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (siteArea === "systemDesign") {
    return (
      <div className="page">
        <ThemeToggleFab theme={theme} onToggle={toggleTheme} />
        <div className="container">
          <div className="hub-back-row">
            <button className="ghost-btn" onClick={() => navigate("hub")}>
              ← Back to Hub
            </button>
          </div>

          <header className="header">
            <span className="eyebrow">AlgoSprint · System Design</span>
            <h1>High Level Design (HLD)</h1>
            <p className="subtext">
              Start with fundamentals, then practice with the simulator.
            </p>
          </header>

          <div className="hub-grid">
            <div className="hub-card">
              <div className="hub-card-top">
                <h2 className="hub-card-title">Theory</h2>
                <p className="hub-card-desc">
                  Concepts, trade-offs, and patterns (coming soon in this site).
                </p>
              </div>
              <button className="ghost-btn hub-card-cta" disabled>
                Coming soon
              </button>
            </div>

            <div className="hub-card">
              <div className="hub-card-top">
                <h2 className="hub-card-title">Simulator</h2>
                <p className="hub-card-desc">
                  Open the System Design Simulator app to practice HLD problems.
                </p>
              </div>
              <a
                className="ghost-btn hub-card-cta"
                href={SIMULATOR_URL}
                onClick={() => {
                  // Persist current area so pressing back restores "systemDesign" view
                  try { sessionStorage.setItem("algosprint-area", "systemDesign"); } catch {}
                }}
              >
                Open Simulator
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <ThemeToggleFab theme={theme} onToggle={toggleTheme} />
      <div className="container">
        <div className="hub-back-row">
          <button className="ghost-btn" onClick={() => navigate("hub")}>
            ← Back to Hub
          </button>
        </div>
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
