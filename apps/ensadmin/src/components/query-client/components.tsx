"use client";

import { getQueryClient } from "@/components/query-client/index";
import { QueryClientProvider as QueryClientProviderBase } from "@tanstack/react-query";
import { PropsWithChildren } from "react";

export function QueryClientProvider({ children }: PropsWithChildren) {
  const queryClient = getQueryClient();

  return <QueryClientProviderBase client={queryClient}>{children}</QueryClientProviderBase>;
}
