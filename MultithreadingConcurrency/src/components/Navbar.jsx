import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";

const HUB_URL = import.meta.env.VITE_HUB_URL || "/AlgoSprint/";

const NAV_LINKS = [
  { to: "/",           label: "Home",       icon: "⌂"  },
  { to: "/concepts",   label: "Concepts",   icon: "◈"  },
  { to: "/java-api",   label: "Java API",   icon: "⚙"  },
  { to: "/patterns",   label: "Patterns",   icon: "◎"  },
  { to: "/problems",   label: "Problems",   icon: "▣"  },
  { to: "/revision",   label: "Revision",   icon: "⚡" },
  { to: "/compare",    label: "Compare",    icon: "⇔"  },
  { to: "/interview",  label: "Interview",  icon: "✦"  },
];

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

export default function Navbar({ theme, onToggleTheme }) {
  const [open, setOpen] = useState(false);
  const isDark = theme === "dark";

  // Close sidebar on route change (mobile)
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("popstate", close);
    return () => window.removeEventListener("popstate", close);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* ── Mobile top bar ─────────────────────────── */}
      <div className="topbar">
        <a href={HUB_URL} className="topbar-brand">
          <span className="topbar-brand-arrow">←</span>
          <span className="topbar-brand-module">Concurrency</span>
        </a>
        <button
          className={"topbar-hamburger" + (open ? " is-open" : "")}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle sidebar"
          aria-expanded={open}
        >
          <span /><span /><span />
        </button>
      </div>

      {/* ── Overlay (mobile) ───────────────────────── */}
      {open && (
        <div
          className="sidebar-overlay"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ────────────────────────────────── */}
      <aside className={"sidebar" + (open ? " sidebar--open" : "")} aria-label="Site navigation">

        {/* Brand */}
        <div className="sidebar-brand">
          <a href={HUB_URL} className="sidebar-brand-link" title="Back to AlgoSprint Hub">
            <span className="sidebar-brand-arrow">←</span>
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-suite">AlgoSprint</span>
              <span className="sidebar-brand-module">Concurrency</span>
            </div>
          </a>
        </div>

        {/* Nav links */}
        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">Navigation</div>
          {NAV_LINKS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                "sidebar-link" + (isActive ? " sidebar-link--active" : "")
              }
              onClick={() => setOpen(false)}
            >
              <span className="sidebar-link-icon" aria-hidden="true">{icon}</span>
              <span className="sidebar-link-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button
            className="sidebar-theme-btn"
            onClick={onToggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
            <span>{isDark ? "Light mode" : "Dark mode"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
