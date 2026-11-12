import { Suspense } from "react";
import { Loading } from "@/components/ajo/Shell";
import PublicSchedule from "./PublicSchedule";

// The public schedule. Params are runtime data (Cache Components), so they're read under Suspense.
export default function Page({ params }: PageProps<"/ajo/[publicId]">) {
  return <Suspense fallback={<Loading />}><PublicSchedule params={params} /></Suspense>;
}
