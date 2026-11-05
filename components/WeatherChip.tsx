"use client";
import { useWeather } from "./WeatherContext";
import { MODE_LABEL } from "@/lib/weather";

export default function WeatherChip() {
  const { real, info, preview, letSnow, setLetSnow } = useWeather();
  if (!real) return null; // weather unknown → festive snow, nothing to explain
  const m = MODE_LABEL[real];
  const where = !preview && info?.city ? ` · ${info.city}` : "";
  const temp = !preview && typeof info?.temp === "number" ? ` ${info.temp}°` : "";
  const showToggle = real !== "snow";

  return (
    <div className="wx-chip" title="Live weather data from MET Norway (CC BY 4.0)">
      <span>{letSnow ? "❄️ Let it snow" : `${m.icon} ${m.label}${temp}${where}`}{preview && " (preview)"}</span>
      {showToggle && (
        <button onClick={() => setLetSnow(!letSnow)} aria-pressed={letSnow}>
          {letSnow ? "Real weather" : "Let it snow ❄️"}
        </button>
      )}
    </div>
  );
}
