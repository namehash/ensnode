import { Suspense } from "react";

import { ExamplesPage } from "@/components/ponder-client/examples-page";

export default function PonderClientPage() {
  return (
    <Suspense>
      <ExamplesPage />
    </Suspense>
  );
}
