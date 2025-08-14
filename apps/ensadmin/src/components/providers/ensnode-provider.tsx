"use client";

import { selectedEnsNodeUrl } from "@/lib/env";
import { ENSNodeProvider as _ENSNodeProvider } from "@ensnode/ensnode-react";
import { useSearchParams } from "next/navigation";
import { PropsWithChildren } from "react";

export function ENSNodeProvider({ children }: PropsWithChildren) {
  const searchParams = useSearchParams();
  const ensNodeUrl = selectedEnsNodeUrl(searchParams);

  return <_ENSNodeProvider config={{ client: { url: ensNodeUrl } }}>{children}</_ENSNodeProvider>;
}
