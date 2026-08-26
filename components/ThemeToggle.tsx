"use client";

import { useEffect, useState } from "react";

const THEME_KEY = "monitoring-proyek:theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "light" ? "light" : "dark");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      title={theme === "dark" ? "Ganti ke Light Mode" : "Ganti ke Dark Mode"}
    >
      <span>{theme === "dark" ? "☾" : "☀"}</span>
      {theme === "dark" ? "Dark Mode" : "Light Mode"}
    </button>
  );
}
