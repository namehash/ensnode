import { getExternalEnsAppNameUrl } from "@/lib/namespace-utils";
import { Name } from "@ensnode/ensnode-sdk";
import { useNamespace } from "./use-namespace";

export function useENSAppNameUrl(name: Name) {
  const { data: namespace, ...query } = useNamespace();

  return {
    ...query,
    data: namespace ? getExternalEnsAppNameUrl(name, namespace) : null,
  };
}
