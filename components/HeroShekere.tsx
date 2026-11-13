import Shekere from "./Shekere";

/** Landing hero: the ṣẹ̀kẹ̀rẹ̀ shakes on tap, and once by itself ~2s after load.
 *  data-speed: with smooth scrolling on, it drifts up slower than the page (parallax). */
export default function HeroShekere() {
  return (
    <div className="hero-shekere" data-speed="clamp(0.85)">
      <Shekere names={["Tolu", "Chidinma", "Mum", "Uncle Femi", "You?"]} autoShake />
      <p className="shekere-cap" aria-hidden="true">{"Ṣẹ̀kẹ̀rẹ̀"} · every name is a bead</p>
    </div>
  );
}
