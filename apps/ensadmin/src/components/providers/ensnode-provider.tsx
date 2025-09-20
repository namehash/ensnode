"use client";

import { useENSNodeConnection } from "@/hooks/active-ensnode-url";
import { ENSNodeProvider as _ENSNodeProvider } from "@ensnode/ensnode-react";
import { PropsWithChildren } from "react";

export function ENSNodeProvider({ children }: PropsWithChildren) {
  const url = useENSNodeConnection();
  return <_ENSNodeProvider config={{ client: { url } }}>{children}</_ENSNodeProvider>;
}
