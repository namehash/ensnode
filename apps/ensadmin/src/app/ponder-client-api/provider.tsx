"use client";

import * as ponderSchema from "@ensnode/ponder-schema";
import { createClient } from "@ponder/client";
import { PonderProvider } from "@ponder/react";
import { PropsWithChildren, useState } from "react";

interface ProviderProps extends PropsWithChildren {
  url: string;
}

export function Provider({ url, children }: ProviderProps) {
  const [ponderClient] = useState(() => createClient(url, { schema }));

  return <PonderProvider client={ponderClient}>{children}</PonderProvider>;
}

export const schema = ponderSchema;
