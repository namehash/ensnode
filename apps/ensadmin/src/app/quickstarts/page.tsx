import { Suspense } from "react";
import { Quickstarts } from "./client";

export default function QuickstartsPage() {
  return (
    <Suspense>
      <Quickstarts />
    </Suspense>
  );
}
