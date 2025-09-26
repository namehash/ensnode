"use client";

import { useAvailableENSNodeConnections } from "@/hooks/ensnode-connections";
import { PropsWithChildren } from "react";

// Allows consumers to use `useActiveENSNodeConnection` by blocking rendering until it is available.
export function RequireActiveENSNodeConnection({ children }: PropsWithChildren<{}>) {
  const { selectedConnection } = useAvailableENSNodeConnections();

  if (!selectedConnection) return null;

  return children;
}
