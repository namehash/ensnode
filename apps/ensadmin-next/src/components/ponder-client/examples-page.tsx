import { Suspense } from "react";
import { PonderClientContent, PonderClientShell } from "./examples-content";

export function ExamplesPage() {
  return (
    <Suspense>
      <PonderClientShell>
        <PonderClientContent />
      </PonderClientShell>
    </Suspense>
  );
}
