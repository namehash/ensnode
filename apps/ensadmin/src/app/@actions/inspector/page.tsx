"use client";

import { useSearchParams } from "next/navigation";
import InspectorSummary from "./inspector-summary";

export default function ActionsInspector() {
  const searchParams = useSearchParams();
  const hasParams = searchParams.has("strategy") && searchParams.has("name");

  if (!hasParams) {
    return null;
  }

  return (
    <div className="flex items-center">
      <InspectorSummary />
    </div>
  );
}
