"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { MODES, type Mode, type WeatherInfo } from "@/lib/weather";

type Ctx = {
  mode: Mode; // what's on screen
  real: Mode | null; // what the weather actually is (or ?wx= preview)
  info: WeatherInfo | null;
  preview: boolean;
  letSnow: boolean;
  setLetSnow: (b: boolean) => void;
};

const WeatherCtx = createContext<Ctx | null>(null);
const CACHE_KEY = "hd-wx", SNOW_KEY = "hd-snow", TTL = 30 * 60 * 1000;

export function WeatherProvider({ children }: { children: React.ReactNode }) {
  const [info, setInfo] = useState<WeatherInfo | null>(null);
  const [forced, setForced] = useState<Mode | null>(null);
  const [letSnow, setLetSnowState] = useState(false);

  useEffect(() => {
    // ?wx=rain etc. previews any scene (handy for design review & marketing videos)
    const wx = new URLSearchParams(window.location.search).get("wx") as Mode | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only value, read once after hydration
    if (wx && MODES.includes(wx)) setForced(wx);
    try { setLetSnowState(localStorage.getItem(SNOW_KEY) === "1"); } catch {}

    try {
      const c = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
      if (c && Date.now() - c.t < TTL) { setInfo(c.info); return; }
    } catch {}
    fetch("/api/weather")
      .then((r) => r.json())
      .then((i: WeatherInfo) => {
        setInfo(i);
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), info: i })); } catch {}
      })
      .catch(() => setInfo({ mode: null }));
  }, []);

  const setLetSnow = useCallback((b: boolean) => {
    setLetSnowState(b);
    try { localStorage.setItem(SNOW_KEY, b ? "1" : "0"); } catch {}
  }, []);

  const real = forced ?? info?.mode ?? null;
  const mode: Mode = letSnow ? "snow" : real ?? "snow"; // festive default when weather is unknown

  return (
    <WeatherCtx.Provider value={{ mode, real, info, preview: !!forced, letSnow, setLetSnow }}>
      {children}
    </WeatherCtx.Provider>
  );
}

export function useWeather() {
  const c = useContext(WeatherCtx);
  if (!c) throw new Error("useWeather must be used inside <WeatherProvider>");
  return c;
}
