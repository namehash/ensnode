import { Suspense } from "react";

import { IndexingStatus } from "@/components/indexing-status";
import { LoadingSpinner } from "@/components/loading-spinner";

export default function Status() {
  return (
    <Suspense fallback={<Loading />}>
      <IndexingStatus />
    </Suspense>
  );
}

function Loading() {
  return (
    <div className="flex justify-center items-center h-screen">
      <LoadingSpinner className="h-32 w-32" />
    </div>
  );
}
