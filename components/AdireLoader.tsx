import { AdireGrid } from "./motifs";

// Adire eleko loader: an indigo dye wash sweeps across the cloth, then the
// motifs are drawn in one square at a time, held, and faded. Plain SVG + CSS.
// Reduced motion shows the finished cloth, still.
// Every caller passes its label from the copy (e.g. copy.common.loading, "Dyeing the cloth").
export default function AdireLoader({ size = 96, label }: { size?: number; label: string }) {
  return (
    <div className="adire-loader" role="status" style={{ width: size, height: size }}>
      <AdireGrid strokeWidth={6} />
      <span className="sr-only">{label}</span>
    </div>
  );
}
