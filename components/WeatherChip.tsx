"use client";
import { useWeather } from "./WeatherContext";
import { MODE_LABEL } from "@/lib/weather";
import { weather } from "@/lib/copy/weather";

export default function WeatherChip() {
  const { real, info, preview, letSnow, setLetSnow } = useWeather();
  if (!real) return null; // weather unknown → festive snow, nothing to explain
  const m = MODE_LABEL[real];
  const where = !preview && info?.city ? ` · ${info.city}` : "";
  const temp = !preview && typeof info?.temp === "number" ? ` ${info.temp}°` : "";
  const showToggle = real !== "snow";

  return (
    <div className="wx-chip" title={weather.title}>
      <span>{letSnow ? weather.snowing : `${m.icon} ${m.label}${temp}${where}`}{preview && weather.preview}</span>
      {showToggle && (
        <button onClick={() => setLetSnow(!letSnow)} aria-pressed={letSnow}>
          {letSnow ? weather.real : weather.letSnow}
        </button>
      )}
    </div>
  );
}
