import { getExternalEnsAppNameUrl } from "@/lib/namespace-utils";
import { useENSIndexerConfig } from "@ensnode/ensnode-react";
import { Name } from "@ensnode/ensnode-sdk";

export function useENSAppNameUrl(name: Name) {
  const {data, ...query} = useENSIndexerConfig();

  return {
    ...query,
    data: data?.namespace ? getExternalEnsAppNameUrl(name, data.namespace) : null
  }
}
