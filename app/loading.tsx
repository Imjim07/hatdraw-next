import AdireLoader from "@/components/AdireLoader";
import { common } from "@/lib/copy/common";

// Route-level fallback while a segment is loading.
export default function Loading() {
  return (
    <div className="loading-screen">
      <AdireLoader label={common.loading} />
    </div>
  );
}
