"use client";
import { useEffect, useRef } from "react";
import { useWeather } from "./WeatherContext";
import type { Mode } from "@/lib/weather";

/** Fire a confetti burst from anywhere: burst() */
export const burst = () => window.dispatchEvent(new Event("hd:burst"));

type P = { x: number; y: number; vx: number; vy: number; r: number; a: number; ph: number; w?: number; h?: number };
const R = Math.random;

function init(mode: Mode, W: number, H: number): P[] {
  const n = (k: number, cap: number) => Math.min(cap, Math.round(W / k));
  const mk = (count: number, f: () => P) => Array.from({ length: count }, f);
  switch (mode) {
    case "snow":
      return mk(n(11, 110), () => ({ x: R() * W, y: R() * H, vx: 0, vy: 0.3 + R() * 0.7, r: 0.6 + R() * 2.3, a: 0.35 + R() * 0.45, ph: R() * 6.3 }));
    case "rain": case "storm":
      return mk(n(mode === "storm" ? 5 : 7, 180), () => ({ x: R() * W, y: R() * H, vx: -1.6, vy: 9 + R() * 6, r: 10 + R() * 14, a: 0.18 + R() * 0.25, ph: 0 }));
    case "clear-day":
      return mk(n(30, 45), () => ({ x: R() * W, y: R() * H, vx: 0, vy: -(0.08 + R() * 0.25), r: 0.8 + R() * 2, a: 0.25 + R() * 0.45, ph: R() * 6.3 }));
    case "clear-night":
      return mk(n(9, 150), () => ({ x: R() * W, y: R() * H * 0.75, vx: 0, vy: 0, r: 0.4 + R() * 1.2, a: 0, ph: R() * 6.3, w: 0.4 + R() * 1.6 }));
    case "cloudy":
      return mk(7, () => ({ x: R() * W, y: R() * H * 0.65, vx: 0.06 + R() * 0.14, vy: 0, r: 0, a: 0.11 + R() * 0.09, ph: 0, w: 220 + R() * 280, h: 70 + R() * 80 }));
    case "fog":
      return mk(6, () => ({ x: R() * W, y: R() * H, vx: 0.12 + R() * 0.2, vy: 0, r: 0, a: 0.1 + R() * 0.07, ph: 0, w: W * (0.6 + R() * 0.5), h: 90 + R() * 150 }));
    case "harmattan":
      return mk(n(8, 150), () => ({ x: R() * W, y: R() * H, vx: -(0.25 + R() * 0.6), vy: 0.04 + R() * 0.14, r: 0.5 + R() * 1.5, a: 0.25 + R() * 0.35, ph: R() * 6.3 }));
  }
}

function frame(ctx: CanvasRenderingContext2D, mode: Mode, ps: P[], W: number, H: number, t: number, s: { flash: number; shoot: P | null }, still: boolean) {
  ctx.clearRect(0, 0, W, H);
  const wrap = (p: P, pad = 20) => {
    if (p.y > H + pad) { p.y = -pad; p.x = R() * W; }
    if (p.y < -pad) { p.y = H + pad; p.x = R() * W; }
    if (p.x < -pad - (p.w ?? 0)) p.x = W + pad;
    if (p.x > W + pad) p.x = -pad - (p.w ?? 0);
  };
  const move = (p: P) => { if (!still) { p.x += p.vx; p.y += p.vy; } wrap(p); };

  if (mode === "snow") {
    for (const p of ps) {
      if (!still) { p.ph += 0.01; p.x += Math.sin(p.ph) * 0.35; }
      move(p);
      ctx.fillStyle = `rgba(239,232,216,${p.a})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.3); ctx.fill();
    }
  } else if (mode === "rain" || mode === "storm") {
    ctx.lineWidth = 1; ctx.lineCap = "round";
    for (const p of ps) {
      move(p);
      ctx.strokeStyle = `rgba(170,200,230,${p.a})`;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.vx * (p.r / p.vy), p.y + p.r); ctx.stroke();
    }
    if (mode === "storm" && !still) {
      if (R() < 0.0022) s.flash = 0.16; // subtle & rare: no strobing
      if (s.flash > 0.004) { ctx.fillStyle = `rgba(220,230,255,${s.flash})`; ctx.fillRect(0, 0, W, H); s.flash *= 0.88; }
    }
  } else if (mode === "clear-day") {
    const g = ctx.createRadialGradient(W * 0.88, H * 0.04, 0, W * 0.88, H * 0.04, Math.max(W, H) * 0.55);
    g.addColorStop(0, "rgba(242,207,134,0.22)"); g.addColorStop(1, "rgba(242,207,134,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (const p of ps) {
      if (!still) { p.ph += 0.012; p.x += Math.sin(p.ph) * 0.25; }
      move(p);
      ctx.fillStyle = `rgba(242,207,134,${p.a * (0.6 + 0.4 * Math.sin(t / 900 + p.ph))})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.3); ctx.fill();
    }
  } else if (mode === "clear-night") {
    for (const p of ps) {
      const a = still ? 0.6 : 0.25 + 0.75 * Math.abs(Math.sin(t / 1000 * (p.w ?? 1) + p.ph));
      ctx.fillStyle = `rgba(239,232,216,${a * 0.85})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.3); ctx.fill();
    }
    if (!still) {
      if (!s.shoot && R() < 0.0015) s.shoot = { x: R() * W * 0.7 + W * 0.2, y: R() * H * 0.3, vx: -9, vy: 4, r: 0, a: 1, ph: 0 };
      const sh = s.shoot;
      if (sh) {
        const grad = ctx.createLinearGradient(sh.x, sh.y, sh.x - sh.vx * 9, sh.y - sh.vy * 9);
        grad.addColorStop(0, `rgba(242,207,134,${sh.a})`); grad.addColorStop(1, "rgba(242,207,134,0)");
        ctx.strokeStyle = grad; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(sh.x, sh.y); ctx.lineTo(sh.x - sh.vx * 9, sh.y - sh.vy * 9); ctx.stroke();
        sh.x += sh.vx; sh.y += sh.vy; sh.a -= 0.018;
        if (sh.a <= 0) s.shoot = null;
      }
    }
  } else if (mode === "cloudy" || mode === "fog") {
    for (const p of ps) {
      move(p);
      const w = p.w!, h = p.h!;
      ctx.save(); ctx.translate(p.x + w / 2, p.y); ctx.scale(1, h / w);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w / 2);
      const c = mode === "fog" ? "222,226,238" : "201,207,227"; // starch-blue reads on indigo
      g.addColorStop(0, `rgba(${c},${p.a})`); g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, w / 2, 0, 6.3); ctx.fill();
      ctx.restore();
    }
  } else if (mode === "harmattan") {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "rgba(214,160,92,0.13)"); g.addColorStop(1, "rgba(214,160,92,0.04)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (const p of ps) {
      if (!still) { p.ph += 0.008; p.y += Math.sin(p.ph) * 0.15; }
      move(p);
      ctx.fillStyle = `rgba(226,182,122,${p.a})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.3); ctx.fill();
    }
  }
}

export default function Ambient() {
  const { mode } = useWeather();
  const bg = useRef<HTMLCanvasElement>(null);
  const fx = useRef<HTMLCanvasElement>(null);

  // Weather scene
  useEffect(() => {
    const c = bg.current!, ctx = c.getContext("2d")!;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, ps: P[] = [], raf = 0;
    const s = { flash: 0, shoot: null as P | null };
    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth; H = window.innerHeight;
      c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ps = init(mode, W, H);
      if (still) frame(ctx, mode, ps, W, H, 0, s, true);
    };
    size();
    window.addEventListener("resize", size);
    const loop = (t: number) => { frame(ctx, mode, ps, W, H, t, s, false); raf = requestAnimationFrame(loop); };
    if (!still) raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", size); };
  }, [mode]);

  // Confetti layer
  useEffect(() => {
    const c = fx.current!, ctx = c.getContext("2d")!;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    type B = { x: number; y: number; vx: number; vy: number; w: number; h: number; c: string; a: number; va: number; life: number };
    let bits: B[] = [], raf = 0, running = false;
    const cols = ["#E3B45A", "#F2CF86", "#EFE8D8", "#C9CFE3", "#2E4A8F", "#EFE8D8"];
    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = window.innerWidth * dpr; c.height = window.innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    const loop = () => {
      const W = window.innerWidth, H = window.innerHeight;
      ctx.clearRect(0, 0, W, H);
      bits = bits.filter((b) => b.life > 0);
      for (const b of bits) {
        b.vy += 0.38; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.a += b.va;
        b.life = b.y > H + 20 ? 0 : b.life - 0.004;
        ctx.save(); ctx.globalAlpha = Math.max(0, b.life); ctx.translate(b.x, b.y); ctx.rotate(b.a);
        ctx.fillStyle = b.c; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); ctx.restore();
      }
      if (bits.length) raf = requestAnimationFrame(loop); else { running = false; ctx.clearRect(0, 0, W, H); }
    };
    const onBurst = () => {
      const W = window.innerWidth, H = window.innerHeight;
      for (let i = 0; i < 160; i++)
        bits.push({ x: W / 2, y: H * 0.42, vx: (R() - 0.5) * 16, vy: -R() * 15 - 4, w: R() * 8 + 4, h: R() * 5 + 3, c: cols[Math.floor(R() * cols.length)], a: R() * 6, va: (R() - 0.5) * 0.4, life: 1 });
      if (!running) { running = true; raf = requestAnimationFrame(loop); }
    };
    window.addEventListener("hd:burst", onBurst);
    window.addEventListener("resize", size);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("hd:burst", onBurst); window.removeEventListener("resize", size); };
  }, []);

  return (
    <>
      <canvas ref={bg} className="ambient" aria-hidden="true" data-mode={mode} />
      <canvas ref={fx} className="fx" aria-hidden="true" />
    </>
  );
}
