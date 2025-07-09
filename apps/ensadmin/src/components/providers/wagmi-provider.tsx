"use client";

import { useIndexingStatusQuery } from "@/components/ensnode";
import { selectedEnsNodeUrl } from "@/lib/env";
import { wagmiConfigParametersForEnsNamespace } from "@/lib/wagmi";
import { useSearchParams } from "next/navigation";
import { PropsWithChildren, useEffect, useState } from "react";
import { Config as WagmiConfig, WagmiProvider as WagmiProviderBase, createConfig } from "wagmi";

/**
 * WagmiProvider component that provides wagmi context to the application.
 * This is a client-only component that wraps the application with the wagmi provider.
 */
export function WagmiProvider({ children }: PropsWithChildren) {
  const searchParams = useSearchParams();
  const ensNodeUrl = selectedEnsNodeUrl(searchParams);
  const indexingStatusQuery = useIndexingStatusQuery(ensNodeUrl);
  const [wagmiConfig, setWagmiConfig] = useState<WagmiConfig | undefined>();

  useEffect(() => {
    if (indexingStatusQuery.status === "success") {
      // TODO: The check for valid RPC URL(s) should be performed when we're in the process of accepting a connection
      try {
        // `wagmiConfigForEnsNamespace` uses getter functions that would throw an error
        // if no valid RPC URL was provided in env vars
        // which would then be propagated here
        const wagmiConfig = createConfig(
          wagmiConfigParametersForEnsNamespace(indexingStatusQuery.data.env.NAMESPACE),
        );
        setWagmiConfig(wagmiConfig);
      } catch (error) {
        // forward all errors from RPC URL getters
        throw error;
      }
    } else {
      setWagmiConfig(undefined);
    }
  }, [indexingStatusQuery.data, indexingStatusQuery.status]);

  if (typeof wagmiConfig === "undefined") {
    return <>{children}</>;
  }

  return <WagmiProviderBase config={wagmiConfig}>{children}</WagmiProviderBase>;
}
