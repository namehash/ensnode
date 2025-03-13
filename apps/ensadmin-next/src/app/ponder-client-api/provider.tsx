"use client";

import { Provider as QueryClientProvider } from "@/components/query-client/provider";
import * as ponderSchema from "@ensnode/ponder-schema";
import { createClient } from "@ponder/client";
import { PonderProvider } from "@ponder/react";

import { selectedEnsNodeUrl } from "@/lib/env";
import { useSearchParams } from "next/navigation";
import { type PropsWithChildren, useState } from "react";

export function Provider({ children }: PropsWithChildren) {
  const searchParams = useSearchParams();
  const [ponderClient] = useState(() =>
    createPonderClient(selectedEnsNodeUrl(searchParams), schema),
  );

  return (
    <PonderProvider client={ponderClient}>
      <QueryClientProvider>{children}</QueryClientProvider>
    </PonderProvider>
  );
}

function createPonderClient(ensNodeUrl: string, schema: Record<string, unknown>) {
  return createClient(new URL("/sql", ensNodeUrl).toString(), { schema });
}
export const schema = ponderSchema;
