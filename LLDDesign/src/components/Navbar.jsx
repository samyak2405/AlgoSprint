import React, { useState } from "react";
import { NavLink } from "react-router-dom";

const HUB_URL = import.meta.env.VITE_HUB_URL || "/AlgoSprint/";

const NAV_LINKS = [
  { to: "/",          label: "Home"     },
  { to: "/patterns",  label: "Patterns" },
  { to: "/revision",  label: "Revision" },
  { to: "/approach",  label: "Approach" },
  { to: "/solid",     label: "SOLID"    },
  { to: "/problems",  label: "Problems" },
];

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

export default function Navbar({ theme, onToggleTheme }) {
  const [open, setOpen] = useState(false);
  const isDark = theme === "dark";

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <a href={HUB_URL} className="navbar-brand" title="Back to AlgoSprint Hub">
          <span className="navbar-brand-arrow">←</span>
          <span className="navbar-brand-text">
            <span className="navbar-brand-suite">AlgoSprint</span>
            <span className="navbar-brand-sep">·</span>
            <span className="navbar-brand-module">LLD</span>
          </span>
        </a>

        <nav className="navbar-links" aria-label="Main navigation">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                "navbar-link" + (isActive ? " navbar-link--active" : "")
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          className="navbar-theme-btn"
          onClick={onToggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Light mode" : "Dark mode"}
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
          <span>{isDark ? "Light" : "Dark"}</span>
        </button>

        <button
          className={"navbar-hamburger" + (open ? " is-open" : "")}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span /><span /><span />
        </button>
      </div>

      {open && (
        <nav className="navbar-mobile" aria-label="Mobile navigation">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                "navbar-mobile-link" + (isActive ? " navbar-mobile-link--active" : "")
              }
              onClick={() => setOpen(false)}
            >
              {label}
            </NavLink>
          ))}
          <button
            className="navbar-mobile-link navbar-mobile-theme"
            onClick={() => { onToggleTheme(); setOpen(false); }}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
            {isDark ? "Light mode" : "Dark mode"}
          </button>
          <a href={HUB_URL} className="navbar-mobile-link navbar-mobile-back">
            ← Back to Hub
          </a>
        </nav>
      )}
    </header>
  );
}
