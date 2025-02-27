import { PageShell } from "@/components/page-shell";
import { ExamplesPage } from "@/components/ponder-client/examples-page";
import { Suspense } from "react";

export default function PonderClientPage() {
  return (
    <PageShell>
      <Suspense>
        <ExamplesPage />
      </Suspense>
    </PageShell>
  );
}
