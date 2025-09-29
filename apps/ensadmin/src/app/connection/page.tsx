import { Suspense } from "react";

import ConnectionInfo from "@/components/connection";
import { LoadingSpinner } from "@/components/loading-spinner";

export default function Connection() {
  return (
    <Suspense fallback={<Loading />}>
      <ConnectionInfo />
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
