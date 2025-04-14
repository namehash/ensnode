"use client";

import { useSearchParams } from "next/navigation";
import InspectorForm from "@/app/inspector/components/inspector-form";

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
