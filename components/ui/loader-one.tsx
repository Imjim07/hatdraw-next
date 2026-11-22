// Three-dot loader (after the 21st.dev "loader-one"), the loader across the site: three
// dots that nudge right, brighten and swell one after another. Ported from framer-motion
// to a CSS animation (styles: .loader-one in globals.css), so it costs no JavaScript;
// it's also on /r, which has a size budget.
// Reduced motion: the dots stay still. The label is read out; callers pass it from the copy.
export default function LoaderOne({ label }: { label: string }) {
  return (
    <div className="loader-one" role="status">
      <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
