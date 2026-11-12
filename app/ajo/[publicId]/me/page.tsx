import { Suspense } from "react";
import { Loading } from "@/components/ajo/Shell";
import MemberPage from "./MemberPage";

export default function Page({ params }: PageProps<"/ajo/[publicId]/me">) {
  return <Suspense fallback={<Loading label="Opening your turn" />}><MemberPage params={params} /></Suspense>;
}
