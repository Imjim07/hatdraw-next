import { Suspense } from "react";
import { Loading } from "@/components/ajo/Shell";
import AdminView from "./AdminView";

export default function Page({ params }: PageProps<"/ajo/[publicId]/admin">) {
  return <Suspense fallback={<Loading label="Opening your admin page" />}><AdminView params={params} /></Suspense>;
}
