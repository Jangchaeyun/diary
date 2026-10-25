import { Suspense } from "react";
import { WriteEntry } from "@/components/WriteEntry";
import { PageSkeleton } from "@/components/States";

export default function WritePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <WriteEntry />
    </Suspense>
  );
}
