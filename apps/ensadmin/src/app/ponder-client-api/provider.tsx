"use client";

import { createClient } from "@ponder/client";
import { PonderProvider } from "@ponder/react";
import { useState } from "react";

import * as ponderSchema from "@ensnode/ensnode-schema";

type ProviderProps = {
  url: string;
  children: React.ReactNode;
};

export function Provider({ url, children }: ProviderProps) {
  const [ponderClient] = useState(() => createPonderClient(url, schema));

  return <PonderProvider client={ponderClient}>{children}</PonderProvider>;
}

function createPonderClient(ensNodeUrl: string, schema: Record<string, unknown>) {
  return createClient(new URL("/sql", ensNodeUrl).toString(), { schema });
}
export const schema = ponderSchema;
