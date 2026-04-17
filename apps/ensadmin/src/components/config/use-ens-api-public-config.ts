import { useQuery } from "@tanstack/react-query";

import { useEnsNodeProviderOptions } from "@ensnode/ensnode-react";

import { useIndexingStatusWithSwr } from "@/components/indexing-status";

/**
 * Use the ENSApi Public Config for the currently selected connection.
 *
 * This hook combines the logic of fetching the indexing status (which includes
 * the ENSApi public config) with React Query to provide an easy way to access
 * the ENSApi config for the currently selected connection.
 */
export function useEnsApiPublicConfig() {
  const EnsNodeProviderOptions = useEnsNodeProviderOptions();
  const indexingStatus = useIndexingStatusWithSwr();

  return useQuery({
    enabled: indexingStatus.isFetched,
    queryKey: ["swr", EnsNodeProviderOptions.client.url.href, "ensApiPublicConfig"],
    queryFn: async () => {
      if (!indexingStatus.data) {
        throw new Error("Indexing status wasn't fetched successfully");
      }

      return indexingStatus.data.ensApiPublicConfig;
    },
  });
}
