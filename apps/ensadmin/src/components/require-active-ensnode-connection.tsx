"use client";

import { useENSNodeConnections } from "@/hooks/ensnode-connections";
import { PropsWithChildren } from "react";

/**
 * Allows consumers to use `useActiveENSNodeConection` by blocking rendering until it is available.
 */
export function RequireActiveENSNodeConnection({ children }: PropsWithChildren<{}>) {
  const { active } = useENSNodeConnections();

  if (!active) return null;
  return <>{children}</>;
}
