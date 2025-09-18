"use client";

import { useENSIndexerConfig } from "@ensnode/ensnode-react";

export function useActiveENSNodeConfig() {
  const { data } = useENSIndexerConfig();

  if (data === undefined) {
    throw new Error(`Invariant(useActiveENSNodeConfig): Expected an active ENSNode Config`);
  }

  return data;
}
