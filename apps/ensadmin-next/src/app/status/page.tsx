import { IndexingStatus } from "@/components/indexing-status/components";
import { PageShell } from "@/components/page-shell";
import { Provider as QueryProvider } from "@/components/query-client/provider";
import { Suspense } from "react";

export default function Status() {
  return (
    <PageShell>
      <QueryProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <IndexingStatus />
        </Suspense>
      </QueryProvider>
    </PageShell>
  );
}
