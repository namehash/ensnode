import { useQuery } from "@tanstack/react-query";

import { useEnsApiProviderOptions } from "@ensnode/ensnode-react";

import { useIndexingStatusWithSwr } from "@/components/indexing-status";

export function useEnsApiConfig() {
  const ensApiProviderOptions = useEnsApiProviderOptions();
  const indexingStatus = useIndexingStatusWithSwr();

  return useQuery({
    enabled: indexingStatus.isSuccess,
    queryKey: ["swr", ensApiProviderOptions.client.url.href, "config"],
    queryFn: async () => indexingStatus.data?.config, // enabled flag ensures this is only called when indexingStatus.data is available
  });
}
