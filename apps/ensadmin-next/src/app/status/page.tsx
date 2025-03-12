import { IndexingStatus } from "@/components/indexing-status/components";
import { PageShell } from "@/components/page-shell";
import { Provider as QueryProvider } from "@/components/query-client/provider";
import { RecentDomains } from "@/components/recent-domains";
import { Suspense } from "react";

export default function Status() {
  return (
    <PageShell>
      <QueryProvider>
        <Suspense>
          <IndexingStatus />
        </Suspense>
        <Suspense>
          <div className="px-6 pb-6">
            <RecentDomains />
          </div>
        </Suspense>
      </QueryProvider>
    </PageShell>
  );
}
