import LoaderOne from "@/components/ui/loader-one";
import { common } from "@/lib/copy/common";

// Route-level fallback while a segment is loading.
export default function Loading() {
  return (
    <div className="loading-screen">
      <LoaderOne label={common.loading} />
    </div>
  );
}
