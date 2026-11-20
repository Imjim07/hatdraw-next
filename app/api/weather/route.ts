import { BRAND } from "@/lib/config";
import { modeFromMet, type WeatherInfo } from "@/lib/weather";

type Geo = { lat: number; lon: number; city?: string; country?: string };

/** Read the visitor's approximate location from host-provided headers.
 *  Works on Vercel, Netlify and Cloudflare. No IP is stored or logged. */
function geoFrom(h: Headers): Geo | null {
  const num = (v: string | null) => (v && !Number.isNaN(Number(v)) ? Number(v) : null);
  const dec = (v: string | null) => { try { return v ? decodeURIComponent(v) : undefined; } catch { return v ?? undefined; } };

  // Vercel
  let lat = num(h.get("x-vercel-ip-latitude")), lon = num(h.get("x-vercel-ip-longitude"));
  if (lat !== null && lon !== null)
    return { lat, lon, city: dec(h.get("x-vercel-ip-city")), country: h.get("x-vercel-ip-country") ?? undefined };

  // Netlify: base64 JSON
  const nf = h.get("x-nf-geo");
  if (nf) {
    try {
      const g = JSON.parse(Buffer.from(nf, "base64").toString("utf8"));
      if (typeof g.latitude === "number" && typeof g.longitude === "number")
        return { lat: g.latitude, lon: g.longitude, city: g.city, country: g.country?.code };
    } catch {}
  }

  // Cloudflare ("Add visitor location headers" managed transform)
  lat = num(h.get("cf-iplatitude")); lon = num(h.get("cf-iplongitude"));
  if (lat !== null && lon !== null)
    return { lat, lon, city: h.get("cf-ipcity") ?? undefined, country: h.get("cf-ipcountry") ?? undefined };

  return null;
}

export async function GET(req: Request) {
  const noStore = { headers: { "Cache-Control": "private, no-store" } }; // per-visitor: never CDN-cache
  const geo = geoFrom(req.headers);
  if (!geo) return Response.json({ mode: null } satisfies WeatherInfo, noStore);

  // Round to ~1 km: better upstream cache hits and less precise location.
  const lat = geo.lat.toFixed(2), lon = geo.lon.toFixed(2);
  const ua = process.env.MET_USER_AGENT || `${BRAND.domain}/0.1 ${BRAND.url}`; // HTTP headers must be plain ASCII

  try {
    const res = await fetch(
      `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`,
      { headers: { "User-Agent": ua }, next: { revalidate: 1800 } },
    );
    if (!res.ok) throw new Error(String(res.status));
    const j = await res.json();
    const now = j?.properties?.timeseries?.[0]?.data;
    const symbol: string = now?.next_1_hours?.summary?.symbol_code ?? now?.next_6_hours?.summary?.symbol_code ?? "";
    const d = now?.instant?.details ?? {};
    const info: WeatherInfo = {
      mode: symbol ? modeFromMet(symbol, d.relative_humidity, geo.country, new Date().getUTCMonth()) : null,
      temp: typeof d.air_temperature === "number" ? Math.round(d.air_temperature) : undefined,
      city: geo.city,
      country: geo.country,
      symbol,
    };
    return Response.json(info, noStore);
  } catch {
    return Response.json({ mode: null, city: geo.city, country: geo.country } satisfies WeatherInfo, noStore);
  }
}
