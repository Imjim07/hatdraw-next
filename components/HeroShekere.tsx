"use client";
import { useEffect, useRef, useState } from "react";
import Shekere from "./Shekere";

const NAMES = ["Tolu", "Chidinma", "Mum", "Uncle Femi", "You?"];
const SHAKE_MS = 900;

/** Landing hero: shakes on hover or tap, and once by itself ~2s after load. */
export default function HeroShekere() {
  const [shaking, setShaking] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);

  const shake = () => {
    if (shaking) return;
    setShaking(true);
    clearTimeout(t.current);
    t.current = setTimeout(() => setShaking(false), SHAKE_MS);
  };

  useEffect(() => {
    const auto = setTimeout(() => {
      setShaking(true);
      t.current = setTimeout(() => setShaking(false), SHAKE_MS);
    }, 2000);
    return () => { clearTimeout(auto); clearTimeout(t.current); };
  }, []);

  return (
    <div className="hero-shekere">
      <button type="button" className="shekere-btn" onClick={shake} onMouseEnter={shake}
        aria-label={"Shake the ṣẹ̀kẹ̀rẹ̀ (a beaded gourd rattle). Every name is a bead."}>
        <Shekere names={NAMES} shaking={shaking} />
      </button>
      <p className="shekere-cap" aria-hidden="true">{"Ṣẹ̀kẹ̀rẹ̀"} · every name is a bead</p>
    </div>
  );
}
