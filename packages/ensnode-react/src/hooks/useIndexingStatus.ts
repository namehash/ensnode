import { useQuery } from "@tanstack/react-query";

import type {
  EnsApiIndexingStatusRequest,
  EnsApiIndexingStatusResponse,
} from "@ensnode/ensnode-sdk";

import type { QueryParameter, WithEnsNodeProviderOptions } from "../types";
import { createIndexingStatusQueryOptions } from "../utils/query";
import { useEnsNodeProviderOptions } from "./useEnsNodeProviderOptions";

interface UseIndexingStatusParameters
  extends EnsApiIndexingStatusRequest,
    QueryParameter<EnsApiIndexingStatusResponse> {}

export function useIndexingStatus(
  parameters: WithEnsNodeProviderOptions & UseIndexingStatusParameters = {},
) {
  const { options, query = {} } = parameters;
  const providerOptions = useEnsNodeProviderOptions(options);
  const queryOptions = createIndexingStatusQueryOptions(providerOptions);

  return useQuery({
    ...queryOptions,
    refetchInterval: 10 * 1000, // 10 seconds - indexing status changes frequently
    ...query,
    enabled: query.enabled ?? queryOptions.enabled,
  });
}
