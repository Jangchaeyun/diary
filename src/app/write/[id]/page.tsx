import { Suspense } from "react";
import { WriteForm } from "@/components/WriteForm";
import { PageSkeleton } from "@/components/States";

async function EditContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WriteForm entryId={id} />;
}

export default function EditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <EditContent params={params} />
    </Suspense>
  );
}
