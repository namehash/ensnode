"use client";

import { useAvailableENSNodeConnections } from "@/hooks/ensnode-connections";
import { PropsWithChildren } from "react";

// Allows consumers to use `useSelectedENSNodeConnection` by blocking rendering
// until it is available.
export function RequireSelectedENSNodeConnection({ children }: PropsWithChildren<{}>) {
  const { selectedConnection } = useAvailableENSNodeConnections();

  if (!selectedConnection) return null;

  return children;
}
