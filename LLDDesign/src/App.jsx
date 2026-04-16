import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Patterns from "./pages/Patterns.jsx";
import Solid from "./pages/Solid.jsx";
import Problems from "./pages/Problems.jsx";
import RevisionGuide from "./pages/RevisionGuide.jsx";
import Approach from "./pages/Approach.jsx";

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
          <Route path="/patterns" element={<Patterns />} />
          <Route path="/revision" element={<RevisionGuide />} />
          <Route path="/approach" element={<Approach />} />
          <Route path="/solid" element={<Solid />} />
          <Route path="/problems" element={<Problems />} />
        </Routes>
      </main>
    </div>
  );
}
