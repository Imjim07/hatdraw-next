// Alert: a message box in the shadcn/ui "Alert" format (a bordered card with an optional
// icon on the left and actions on the right; tones default, info, success, warning, error;
// a one-line "row" layout or a "complex" one with a title and description). Plain CSS
// (.alert-* in globals.css) instead of Tailwind and class-variance-authority, and inline
// icons (lucide shapes) instead of lucide-react, so nothing new is installed.
// Errors use role="alert" (read out at once); everything else role="status" (read out
// politely), so screen readers hear each swap response without it interrupting them.
import type { HTMLAttributes, ReactNode } from "react";

export type AlertVariant = "default" | "info" | "success" | "warning" | "error";

type AlertProps = HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant;
  size?: "sm" | "lg";
  icon?: ReactNode;
  action?: ReactNode;
  layout?: "row" | "complex";
};

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export function Alert({ variant = "default", size = "sm", icon, action, layout = "row", className, children, ...props }: AlertProps) {
  return (
    <div role={variant === "error" ? "alert" : "status"} {...props}
      className={cx("alert", `alert-${variant}`, `alert-${size}`, `alert-${layout}`, className)}>
      {icon && <span className="alert-icon" aria-hidden="true">{icon}</span>}
      <div className="alert-body">{children}</div>
      {action && <div className="alert-action">{action}</div>}
    </div>
  );
}

export const AlertTitle = ({ className, ...p }: HTMLAttributes<HTMLHeadingElement>) => <p className={cx("alert-title", className)} {...p} />;
export const AlertDescription = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => <div className={cx("alert-desc", className)} {...p} />;
export const AlertContent = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => <div className={cx("alert-content", className)} {...p} />;

// Icons (lucide shapes, 16px, stroke follows the tone's colour).
const Svg = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
export const IconCheck = () => <Svg><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></Svg>;
export const IconInfo = () => <Svg><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></Svg>;
export const IconWarn = () => <Svg><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4M12 17h.01" /></Svg>;
export const IconError = () => <Svg><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></Svg>;
export const IconClock = () => <Svg><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></Svg>;
export const IconSwap = () => <Svg><path d="m16 3 4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16" /></Svg>;
export const IconX = () => <Svg><path d="M18 6 6 18M6 6l12 12" /></Svg>;

export default Alert;
