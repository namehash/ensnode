import { useQuery } from "@tanstack/react-query";

import { useEnsApiProviderOptions } from "@ensnode/ensnode-react";

import { useIndexingStatusWithSwr } from "@/components/indexing-status";

/**
 * Use the ENSApi Public Config for the currently selected connection.
 *
 * This hook combines the logic of fetching the indexing status (which includes
 * the ENSApi public config) with React Query to provide an easy way to access
 * the ENSApi config for the currently selected connection.
 */
export function useEnsApiConfig() {
  const ensApiProviderOptions = useEnsApiProviderOptions();
  const indexingStatus = useIndexingStatusWithSwr();

  return useQuery({
    enabled: indexingStatus.isFetched,
    queryKey: ["swr", ensApiProviderOptions.client.url.href, "config"],
    queryFn: async () => {
      if (!indexingStatus.data) {
        throw new Error("Indexing status wasn't fetched successfully");
      }

      return indexingStatus.data.config;
    },
  });
}
