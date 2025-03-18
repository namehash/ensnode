import { Suspense } from "react";

import { preferredEnsNodeUrl } from "@/lib/env";
import { Provider as PonderClientProvider } from "../../components/providers/ponder-client-provider";
import { PonderClientContent } from "./examples-content";

type PageProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

export default async function PonderClientPage({ searchParams }: PageProps) {
  const { ensnode = preferredEnsNodeUrl() } = await searchParams;

  const baseUrl = Array.isArray(ensnode)
    ? ensnode[0]
    : typeof ensnode === "string"
      ? ensnode
      : preferredEnsNodeUrl();

  return (
    <Suspense fallback={<Loading />}>
      <PonderClientProvider url={baseUrl}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold">Ponder Client Examples</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Explore how to query ENS data using the Ponder Client
              </p>
            </div>
          </div>
          <PonderClientContent />
        </div>
      </PonderClientProvider>
    </Suspense>
  );
}

function Loading() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
    </div>
  );
}
