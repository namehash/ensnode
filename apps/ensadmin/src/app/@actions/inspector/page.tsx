"use client";

import InspectorForm from "@/app/inspector/components/inspector-form";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ActionsInspectorContent() {
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

export default function ActionsInspector() {
  return (
    <Suspense fallback={<div className="flex items-center">Loading...</div>}>
      <ActionsInspectorContent />
    </Suspense>
  );
}
