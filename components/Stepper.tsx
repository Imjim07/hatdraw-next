import { common } from "@/lib/copy/common";

// The top stepper on the setup wizards (/draw and /ajo), after React Bits Pro
// "Onboarding 7" (a top stepper over a form card). Numbered steps joined by a line;
// finished steps show a tick, the current one is marked for screen readers.
export default function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="ob-steps" aria-label={common.stepOf(current + 1, steps.length)}>
      {steps.map((label, i) => {
        const state = i < current ? "done" : i === current ? "now" : "todo";
        return (
          <li key={label} className={state} aria-current={state === "now" ? "step" : undefined}>
            <span className="ob-dot" aria-hidden="true">
              {state === "done"
                ? <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5l3 3 6-7" /></svg>
                : i + 1}
            </span>
            <span className="ob-lbl">{label}{state === "done" && <span className="sr-only">{common.done}</span>}</span>
          </li>
        );
      })}
    </ol>
  );
}
