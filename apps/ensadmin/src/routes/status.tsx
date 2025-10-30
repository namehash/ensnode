import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { IndexingStatus } from "@/components/indexing-status";
import { LoadingSpinner } from "@/components/loading-spinner";

export const Route = createFileRoute("/status")({
  component: StatusPage,
  errorComponent: StatusError,
});

function StatusPage() {
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

function StatusError({ error }: { error: Error }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">An error occurred</h1>
      <p className="text-gray-600">{error.message}</p>
    </div>
  );
}
