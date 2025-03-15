import { IndexingStatus } from "@/components/indexing-status/components";
import { PageShell } from "@/components/page-shell";
import { Provider as QueryProvider } from "@/components/query-client/provider";
import { RecentRegistrations } from "@/components/recent-registrations";
import { Suspense } from "react";

import { IndexingStatus } from "@/components/indexing-status/components";

export default function Status() {
  return (
    <>
      <Suspense fallback={<Loading />}>
        <IndexingStatus />
      </Suspense>
      <Suspense>
        <IndexingStatus />
      </Suspense>
      <Suspense>
        <div className="px-6 pb-6">
          <RecentRegistrations />
        </div>
      </Suspense>
    </>
  );
}

function Loading() {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
    </div>
  );
}
