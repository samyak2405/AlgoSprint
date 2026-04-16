import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Concepts from "./pages/Concepts.jsx";
import ConceptDetail from "./pages/ConceptDetail.jsx";
import JavaApi from "./pages/JavaApi.jsx";
import ApiDetail from "./pages/ApiDetail.jsx";
import Patterns from "./pages/Patterns.jsx";
import PatternDetail from "./pages/PatternDetail.jsx";
import Problems from "./pages/Problems.jsx";
import ProblemDetail from "./pages/ProblemDetail.jsx";
import Revision from "./pages/Revision.jsx";
import Compare from "./pages/Compare.jsx";
import Interview from "./pages/Interview.jsx";

export default function App() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("algosprint-theme") || "light"; } catch { return "light"; }
  });

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("algosprint-theme", theme); } catch {}
  }, [theme]);

  return (
    <div className="app-root">
      <Navbar theme={theme} onToggleTheme={toggleTheme} />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/concepts" element={<Concepts />} />
          <Route path="/concepts/:id" element={<ConceptDetail />} />
          <Route path="/java-api" element={<JavaApi />} />
          <Route path="/java-api/:id" element={<ApiDetail />} />
          <Route path="/patterns" element={<Patterns />} />
          <Route path="/patterns/:id" element={<PatternDetail />} />
          <Route path="/problems" element={<Problems />} />
          <Route path="/problems/:id" element={<ProblemDetail />} />
          <Route path="/revision" element={<Revision />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/interview" element={<Interview />} />
        </Routes>
      </main>
    </div>
  );
}
