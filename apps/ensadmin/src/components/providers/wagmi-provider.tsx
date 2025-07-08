"use client";

import { wagmiConfigForEnsNamespace} from "@/lib/wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import {PropsWithChildren, useEffect, useState} from "react";
import {WagmiProvider as WagmiProviderBase, Config as WagmiConfig, createConfig} from "wagmi";
import { getQueryClient } from "../query-client";
import {useSearchParams} from "next/navigation";
import {selectedEnsNodeUrl} from "@/lib/env";
import {useIndexingStatusQuery} from "@/components/ensnode";
import { toast } from "sonner";
import {getENSRootChainId} from "@ensnode/datasources";

/**
 * WagmiProvider component that provides wagmi context to the application.
 * This is a client-only component that wraps the application with the wagmi provider.
 */
export function WagmiProvider({ children }: PropsWithChildren) {
  const searchParams = useSearchParams();
  const ensNodeUrl = selectedEnsNodeUrl(searchParams);
  const indexingStatusQuery = useIndexingStatusQuery(ensNodeUrl);
  const [wagmiConfig, setWagmiConfig] = useState<WagmiConfig | undefined>();
  const [rpcEnvVarDefined, setRpcEnvVarDefined] = useState<boolean>(true);

  useEffect(() => {
      if (indexingStatusQuery.status === "success") {
          try {
              const configParams = wagmiConfigForEnsNamespace(indexingStatusQuery.data.env.NAMESPACE);
              const wagmiConfig = createConfig(configParams);
              setRpcEnvVarDefined(true);
              setWagmiConfig(wagmiConfig);
          } catch (error) { //this error handling doesn't catch the error from getEnsNamespaceRpcUrl (idk why)
              // and because it's not inside /status page therefore there is no handler for it!
              console.log(error);
              setRpcEnvVarDefined(false);
          }
      } else {
          setWagmiConfig(undefined);
      }
  }, [indexingStatusQuery.data, indexingStatusQuery.status]);

  if (typeof wagmiConfig === "undefined") {
      return <>{children}</>;
  }

  if (!rpcEnvVarDefined && indexingStatusQuery.status === "success"){
      return (
          <div className="p-6">
              <h1 className="text-2xl font-bold">An error occurred</h1>
              <p className="text-gray-600">No RPC URL was set for ENS namespace {indexingStatusQuery.data.env.NAMESPACE} (NEXT_PUBLIC_RPC_URL_{getENSRootChainId(indexingStatusQuery.data.env.NAMESPACE)}).</p>
          </div>
      );
  }

  return (
    <WagmiProviderBase config={wagmiConfig}>
      {children}
    </WagmiProviderBase>
  );
}
