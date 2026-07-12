"use client";

import { useEffect } from "react";
import { setTheme, useTheme } from "@/hooks/use-theme";

/**
 * Sun/moon button that flips the global theme. Styling comes entirely from
 * `className`; the labels default to German (admin) and can be passed
 * localized for the public site.
 */
export default function ThemeToggle({
  className = "",
  labelDark = "Dunkles Design aktivieren",
  labelLight = "Helles Design aktivieren",
}: {
  className?: string;
  /** Label for the action of switching TO dark mode. */
  labelDark?: string;
  /** Label for the action of switching TO light mode. */
  labelLight?: string;
}) {
  const theme = useTheme();

  // Keep <html data-theme> in sync with OS/tab changes after first paint.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const dark = theme === "dark";
  const label = dark ? labelLight : labelDark;
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={label}
      title={label}
      className={className}
    >
      {dark ? (
        /* Sun */
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19" />
        </svg>
      ) : (
        /* Moon */
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20.6 14.4A8.6 8.6 0 0 1 9.6 3.4a8.6 8.6 0 1 0 11 11Z" />
        </svg>
      )}
    </button>
  );
}
