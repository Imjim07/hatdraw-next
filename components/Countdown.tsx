"use client";
import { useEffect, useState } from "react";

export default function Countdown() {
  const [text, setText] = useState("Christmas is coming");
  useEffect(() => {
    const now = new Date();
    const xmas = new Date(now.getFullYear(), 11, 25);
    const d = Math.ceil((xmas.getTime() - now.getTime()) / 864e5);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only value, read once after hydration
    setText(d > 1 ? `${d} days to Christmas` : d === 1 ? "Christmas is tomorrow!" : d === 0 ? "It's Christmas! 🎄" : "Planning next Christmas already?");
  }, []);
  return <span className="pill"><i />{text}</span>;
}

export function Year() {
  const [y, setY] = useState<number | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only value, read once after hydration
  useEffect(() => setY(new Date().getFullYear()), []);
  return <>{y ?? ""}</>;
}
