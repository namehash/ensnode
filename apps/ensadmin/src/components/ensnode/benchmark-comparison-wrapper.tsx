"use client";

import { selectedEnsNodeUrl } from "@/lib/env";
import * as ponderSchema from "@ensnode/ponder-schema";
import { createClient } from "@ponder/client";
import { PonderProvider } from "@ponder/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ENSNodeBenchmarkComparison } from "./benchmark-comparison";

function createPonderClient(ensNodeUrl: string, schema: Record<string, unknown>) {
  return createClient(new URL("/sql", ensNodeUrl).toString(), { schema });
}

export function ENSNodeBenchmarkComparisonWrapper() {
  const searchParams = useSearchParams();
  const ensNodeUrl = selectedEnsNodeUrl(searchParams);
  const [ponderClient, setPonderClient] = useState<ReturnType<typeof createClient> | null>(null);

  useEffect(() => {
    setPonderClient(createPonderClient(ensNodeUrl, ponderSchema));
  }, [ensNodeUrl]);

  if (!ponderClient) {
    return (
      <div className="w-full p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <PonderProvider client={ponderClient}>
      <ENSNodeBenchmarkComparison />
    </PonderProvider>
  );
}
