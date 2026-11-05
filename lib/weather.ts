export type Mode =
  | "snow" | "rain" | "storm" | "clear-day" | "clear-night"
  | "cloudy" | "fog" | "harmattan";

export const MODES: Mode[] = ["snow", "rain", "storm", "clear-day", "clear-night", "cloudy", "fog", "harmattan"];

export const MODE_LABEL: Record<Mode, { icon: string; label: string }> = {
  snow: { icon: "❄️", label: "Snowy" },
  rain: { icon: "🌧️", label: "Rainy" },
  storm: { icon: "⛈️", label: "Stormy" },
  "clear-day": { icon: "☀️", label: "Sunny" },
  "clear-night": { icon: "🌙", label: "Clear night" },
  cloudy: { icon: "☁️", label: "Cloudy" },
  fog: { icon: "🌫️", label: "Foggy" },
  harmattan: { icon: "🌬️", label: "Harmattan" },
};

export type WeatherInfo = {
  mode: Mode | null;
  temp?: number;
  city?: string;
  country?: string;
  symbol?: string;
};

// Countries where the dry, dusty harmattan wind blows Nov–Mar.
const HARMATTAN = new Set(["NG", "GH", "BJ", "TG", "CI", "BF", "NE", "ML", "SN", "GM", "GN", "SL", "LR", "TD", "CM"]);

/** Map a MET Norway symbol_code (+ humidity) to an ambient mode. */
export function modeFromMet(symbol: string, humidity: number | undefined, country: string | undefined, month: number): Mode {
  const s = symbol.toLowerCase();
  if (s.includes("thunder")) return "storm";
  if (s.includes("snow")) return "snow";
  if (s.includes("rain") || s.includes("sleet")) return "rain";
  if (s.includes("fog")) return "fog";
  // Harmattan: dry season in West Africa + low humidity, no rain.
  const dryMonths = [10, 11, 0, 1, 2]; // Nov–Mar (JS months)
  if (country && HARMATTAN.has(country) && dryMonths.includes(month) && (humidity ?? 100) < 40) return "harmattan";
  if (s.startsWith("cloudy") || s.startsWith("partlycloudy")) return "cloudy";
  if (s.endsWith("_night") || s.endsWith("_polartwilight")) return "clear-night";
  return "clear-day";
}
