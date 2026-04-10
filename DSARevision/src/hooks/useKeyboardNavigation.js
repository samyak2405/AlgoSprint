import { useEffect } from "react";

export function useKeyboardNavigation({ onBack, onReset, onTogglePalette }) {
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onTogglePalette?.();
      }
      if (e.key === "Backspace" && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
        onBack?.();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "r") {
        onReset?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onBack, onReset, onTogglePalette]);
}
