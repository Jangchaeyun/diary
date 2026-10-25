import { Suspense } from "react";
import { EntryDetail } from "@/components/EntryDetail";
import { PageSkeleton } from "@/components/States";

async function EntryContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EntryDetail id={id} />;
}

export default function EntryPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <EntryContent params={params} />
    </Suspense>
  );
}
