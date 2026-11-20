import { Suspense } from "react";
import { ajo } from "@/lib/copy/ajo";
import { Loading } from "@/components/ajo/Shell";
import AdminView from "./AdminView";

export default function Page({ params }: PageProps<"/ajo/[publicId]/admin">) {
  return <Suspense fallback={<Loading label={ajo.admin.loading} />}><AdminView params={params} /></Suspense>;
}
