"use client";

import { useActiveENSNodeUrl } from "@/hooks/use-active-ensnode-url";
import { ENSNodeProvider as _ENSNodeProvider } from "@ensnode/ensnode-react";
import { PropsWithChildren } from "react";

export function ENSNodeProvider({ children }: PropsWithChildren) {
  const url = useActiveENSNodeUrl();
  return <_ENSNodeProvider config={{ client: { url } }}>{children}</_ENSNodeProvider>;
}
