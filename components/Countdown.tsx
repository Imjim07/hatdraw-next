"use client";
import { useEffect, useState } from "react";
import SpecularButton from "./SpecularButton";
import { landing } from "@/lib/copy/landing";

const C = landing.countdown;

export default function Countdown() {
  const [text, setText] = useState(C.coming);
  useEffect(() => {
    const now = new Date();
    const xmas = new Date(now.getFullYear(), 11, 25);
    const d = Math.ceil((xmas.getTime() - now.getTime()) / 864e5);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only value, read once after hydration
    setText(d > 1 ? C.days(d) : d === 1 ? C.tomorrow : d === 0 ? C.today : C.after);
  }, []);
  // Same glass edge as the hero buttons; a plain badge, not a control.
  return <SpecularButton as="span" className="pill pill-glass"><i />{text}</SpecularButton>;
}

export function Year() {
  const [y, setY] = useState<number | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only value, read once after hydration
  useEffect(() => setY(new Date().getFullYear()), []);
  return <>{y ?? ""}</>;
}
