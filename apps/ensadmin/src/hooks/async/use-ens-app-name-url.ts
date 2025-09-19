import { getExternalEnsAppNameUrl } from "@/lib/namespace-utils";
import { Name } from "@ensnode/ensnode-sdk";
import { useNamespace } from "./use-namespace";

/**
 * Hook to get the external ENS app URL for a given name.
 *
 * This hook generates an external ENS application URL for the provided name
 * based on the current namespace configuration. It returns the query state
 * including loading, error states, and the generated URL when available.
 *
 * @param name - The ENS name to generate the URL for
 * @returns Query object with data (the external ENS app URL), loading state, and error state
 */
export function useENSAppNameUrl(name: Name) {
  const { data: namespace, ...query } = useNamespace();

  return {
    ...query,
    data: namespace ? getExternalEnsAppNameUrl(name, namespace) : null,
  };
}
