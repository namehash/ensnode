import { Suspense } from "react";

import { IndexingStatus } from "@/components/indexing-status/components";
import { LoadingSpinner } from "@/components/loading-spinner";
import { RecentRegistrations } from "@/components/recent-registrations";

export default function Status() {
  return (
    <>
      <Suspense fallback={<Loading />}>
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
      <LoadingSpinner className="h-32 w-32" />
    </div>
  );
}
