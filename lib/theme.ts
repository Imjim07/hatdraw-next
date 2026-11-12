"use client";
import { useSyncExternalStore } from "react";

// Light or dark, as the CSS sees it: an explicit choice on <html> (data-theme="dark"|"light",
// or class "dark"|"light", whichever the toggle sets) wins; otherwise the device setting.
// For components that draw colours in JS (canvas, WebGL) and can't read CSS variables.
export type Theme = "light" | "dark";

export { THEME_KEY } from "./palette";

export function currentTheme(): Theme {
  const el = document.documentElement;
  const set = el.dataset.theme || (el.classList.contains("dark") ? "dark" : el.classList.contains("light") ? "light" : "");
  if (set === "dark" || set === "light") return set;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
  const mq = matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onChange);
  return () => { mo.disconnect(); mq.removeEventListener("change", onChange); };
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, currentTheme, () => "light");
}
