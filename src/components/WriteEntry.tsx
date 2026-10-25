"use client";

import { useSearchParams } from "next/navigation";
import { WriteForm } from "@/components/WriteForm";

export function WriteEntry() {
  const params = useSearchParams();
  return (
    <WriteForm
      initialDate={params.get("date")}
      initialMood={params.get("mood")}
      initialPrompt={params.get("prompt")}
    />
  );
}
