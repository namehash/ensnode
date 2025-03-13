import { Suspense } from "react";

import { PonderClientContent } from "./examples-content";
import { Provider as PonderClientProvider } from "./provider";

export default function PonderClientPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PonderClientProvider>
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
