import { Suspense } from "react";
import { ajo } from "@/lib/copy/ajo";
import { Loading } from "@/components/ajo/Shell";
import MemberPage from "./MemberPage";

export default function Page({ params }: PageProps<"/ajo/[publicId]/me">) {
  return <Suspense fallback={<Loading label={ajo.member.loading} />}><MemberPage params={params} /></Suspense>;
}
