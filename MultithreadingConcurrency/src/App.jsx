import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Concepts from "./pages/Concepts.jsx";
import JavaApi from "./pages/JavaApi.jsx";
import Patterns from "./pages/Patterns.jsx";
import Problems from "./pages/Problems.jsx";
import Revision from "./pages/Revision.jsx";

export default function App() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("mt-theme") || "light"; } catch { return "light"; }
  });

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("mt-theme", theme); } catch {}
  }, [theme]);

  return (
    <div className="app-root">
      <Navbar theme={theme} onToggleTheme={toggleTheme} />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/concepts" element={<Concepts />} />
          <Route path="/java-api" element={<JavaApi />} />
          <Route path="/patterns" element={<Patterns />} />
          <Route path="/problems" element={<Problems />} />
          <Route path="/revision" element={<Revision />} />
        </Routes>
      </main>
    </div>
  );
}
