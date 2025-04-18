"use client";

import InspectorForm from "@/app/inspector/components/inspector-form";
import { useSearchParams } from "next/navigation";

export default function ActionsInspector() {
  const searchParams = useSearchParams();
  const hasParams = searchParams.has("strategy") && searchParams.has("name");

  if (!hasParams) {
    return null;
  }

  return (
    <div className="flex items-center">
      <InspectorForm />
    </div>
  );
}
