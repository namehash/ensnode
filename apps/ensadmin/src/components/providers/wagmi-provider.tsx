"use client";

import { config } from "@/lib/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, useState } from "react";
import { WagmiProvider as WagmiProviderBase } from "wagmi";

/**
 * WagmiProvider component that provides wagmi context to the application.
 * This is a client-only component that wraps the application with the wagmi provider.
 */
export function WagmiProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProviderBase config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProviderBase>
  );
}
