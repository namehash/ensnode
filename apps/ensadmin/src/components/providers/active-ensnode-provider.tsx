"use client";

import { useActiveENSNodeUrl } from "@/hooks/active/use-active-ensnode-url";
import { ENSNodeProvider as _ENSNodeProvider } from "@ensnode/ensnode-react";
import { PropsWithChildren } from "react";

export function ActiveENSNodeProvider({ children }: PropsWithChildren) {
  const url = useActiveENSNodeUrl();

  return <_ENSNodeProvider config={{ client: { url } }}>{children}</_ENSNodeProvider>;
}
