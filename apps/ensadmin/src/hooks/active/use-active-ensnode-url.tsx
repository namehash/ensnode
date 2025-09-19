"use client";

import { useENSNodeConnections } from "@/hooks/ensnode-connections";

export function useActiveENSNodeUrl() {
  const { active } = useENSNodeConnections();

  if (!active) {
    throw new Error(`Invariant(useActiveENSNodeUrl): Expected an active ENSNode Connection.`);
  }

  return active;
}
