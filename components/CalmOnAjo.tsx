"use client";
// Ajo pages are about money: calm, no weather, no snow, no confetti (copy deck tone rule).
// Wraps the ambient effects in the root layout and leaves them out on every /ajo page.
// The path is only known at request time, so the check sits in its own Suspense boundary
// (the effects stream in after the page; nothing else waits for them).
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";

function Gate({ children }: { children: ReactNode }) {
  const path = usePathname() ?? "";
  return path === "/ajo" || path.startsWith("/ajo/") ? null : <>{children}</>;
}

export default function CalmOnAjo({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}><Gate>{children}</Gate></Suspense>;
}
