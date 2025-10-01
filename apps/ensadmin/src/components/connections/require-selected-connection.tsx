"use client";

import { useConnectionsLibrary } from "@/hooks/use-connections-library";
import { PropsWithChildren } from "react";

// Allows consumers to use `useSelectedConnection` by blocking rendering
// until it is available.
export function RequireSelectedConnection({ children }: PropsWithChildren<{}>) {
  const { selectedConnection } = useConnectionsLibrary();

  if (!selectedConnection) return null;

  return children;
}
