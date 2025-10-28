"use client";

import { QueryClientProvider as QueryClientProviderBase } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";

import { getQueryClient } from "@/components/query-client/index";

export function QueryClientProvider({ children }: PropsWithChildren) {
  const queryClient = getQueryClient();

  return <QueryClientProviderBase client={queryClient}>{children}</QueryClientProviderBase>;
}
