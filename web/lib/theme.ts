"use client";

import { useEffect, useState } from "react";

export type Mode = "system" | "light" | "dark";
const KEY = "fx-mode";

export function applyMode(m: Mode) {
  if (m === "system") document.documentElement.removeAttribute("data-mode");
  else document.documentElement.dataset.mode = m;
  try {
    if (m === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, m);
  } catch {}
}

export function useMode() {
  const [mode, setMode] = useState<Mode>("system");
  useEffect(() => {
    const m = document.documentElement.dataset.mode;
    if (m === "light" || m === "dark") setMode(m);
  }, []);
  return [mode, (m: Mode) => { setMode(m); applyMode(m); }] as const;
}

export const ACCENTS = [
  { name: "Black", hue: -1 }, { name: "Green", hue: 160 }, { name: "Emerald", hue: 145 }, { name: "Lime", hue: 125 }, { name: "Teal", hue: 195 },
  { name: "Cyan", hue: 220 }, { name: "Blue", hue: 250 }, { name: "Indigo", hue: 275 }, { name: "Violet", hue: 305 },
  { name: "Amber", hue: 75 }, { name: "Gold", hue: 90 }, { name: "Orange", hue: 50 }, { name: "Red", hue: 25 },
];
const HKEY = "fx-hue";

export function useHue() {
  const [hue, setHue] = useState(160);
  useEffect(() => { setHue(document.documentElement.dataset.accent ? -1 : +(document.documentElement.style.getPropertyValue("--hue") || 160)); }, []);
  return [hue, (h: number) => {
    setHue(h);
    document.documentElement.style.setProperty("--hue", String(h < 0 ? 250 : h));
    if (h < 0) document.documentElement.dataset.accent = "black";
    else delete document.documentElement.dataset.accent;
    try { localStorage.setItem(HKEY, String(h)); } catch {}
  }] as const;
}
