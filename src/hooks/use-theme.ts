"use client";

import { useSyncExternalStore } from "react";

const THEME_KEY = "tz-theme";
const THEME_EVENT = "tz-theme-change";

export type Theme = "light" | "dark";

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function storedTheme(): Theme | null {
  const v = window.localStorage.getItem(THEME_KEY);
  return v === "dark" || v === "light" ? v : null;
}

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener(THEME_EVENT, onChange);
  // Changes from other tabs and from the OS setting.
  window.addEventListener("storage", onChange);
  media.addEventListener("change", onChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
    media.removeEventListener("change", onChange);
  };
}

function getSnapshot(): Theme {
  return storedTheme() ?? systemTheme();
}

function getServerSnapshot(): Theme {
  return "light";
}

/** Effective theme (stored choice, falling back to the OS preference). */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Stores the choice, applies it to <html> and notifies all subscribers. */
export function setTheme(theme: Theme): void {
  window.localStorage.setItem(THEME_KEY, theme);
  document.documentElement.dataset.theme = theme;
  window.dispatchEvent(new Event(THEME_EVENT));
}
