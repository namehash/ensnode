"use client";

import { PropsWithChildren } from "react";

/**
 * No longer needed with simplified connection approach - just renders children directly.
 */
export function RequireActiveENSNodeConnection({ children }: PropsWithChildren<{}>) {
  return <>{children}</>;
}
