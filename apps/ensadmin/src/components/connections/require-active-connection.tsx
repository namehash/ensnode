"use client";

import type { PropsWithChildren } from "react";

import { ErrorInfo } from "@/components/error-info";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useEnsNodeStackInfo } from "@/hooks/use-ensnode-stack-info";

/**
 * Allows consumers to use `useActiveConnection` by blocking rendering until it is available.
 */
export function RequireActiveConnection({ children }: PropsWithChildren) {
  const ensNodeStackInfo = useEnsNodeStackInfo();

  if (ensNodeStackInfo.status === "pending") return <Loading />;

  if (ensNodeStackInfo.status === "error") {
    return (
      <section className="p-6">
        <ErrorInfo
          title="Error connecting to your selected ENSNode instance"
          description={ensNodeStackInfo.error.message}
        />
      </section>
    );
  }

  return children;
}

function Loading() {
  return (
    <div className="flex justify-center items-center h-screen">
      <LoadingSpinner className="h-32 w-32" />
    </div>
  );
}
