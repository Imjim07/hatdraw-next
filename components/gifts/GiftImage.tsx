import Image from "next/image";
import { Ododo } from "@/components/motifs";

/** A product photo, or the flower motif on a mist tile while it has none. Fills its parent. */
export default function GiftImage({ src, alt, sizes, priority }: { src?: string; alt: string; sizes: string; priority?: boolean }) {
  if (!src) return <span className="gf-ph" aria-hidden="true"><Ododo size="34%" color="var(--indigo)" strokeWidth={3} /></span>;
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="gf-img" />;
}
