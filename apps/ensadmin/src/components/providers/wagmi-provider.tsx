"use client";

import { wagmiConfigForEnsNamespace} from "@/lib/wagmi";
import {PropsWithChildren, useEffect, useState} from "react";
import {WagmiProvider as WagmiProviderBase, Config as WagmiConfig, createConfig} from "wagmi";
import {useSearchParams} from "next/navigation";
import {selectedEnsNodeUrl} from "@/lib/env";
import {useIndexingStatusQuery} from "@/components/ensnode";

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
          try {
              const wagmiConfig = createConfig(wagmiConfigForEnsNamespace(indexingStatusQuery.data.env.NAMESPACE));
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

  return (
    <WagmiProviderBase config={wagmiConfig}>
      {children}
    </WagmiProviderBase>
  );
}
