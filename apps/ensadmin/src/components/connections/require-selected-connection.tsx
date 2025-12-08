"use client";

import type { PropsWithChildren } from "react";

import { useConnectionsLibrary } from "@/hooks/use-connections-library";

// Allows consumers to use `useSelectedConnection` by blocking rendering
// until it is available.
export function RequireSelectedConnection({ children }: PropsWithChildren) {
  const { selectedConnection } = useConnectionsLibrary();

  if (!selectedConnection) return null;

  return children;
}
