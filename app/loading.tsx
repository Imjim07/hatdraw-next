import AdireLoader from "@/components/AdireLoader";

// Route-level fallback while a segment is loading.
export default function Loading() {
  return (
    <div className="loading-screen">
      <AdireLoader />
    </div>
  );
}
