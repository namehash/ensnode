import { useQuery } from "@tanstack/react-query";

import type { NameTokensRequest, NameTokensResponse } from "@ensnode/ensnode-sdk";

import type { QueryParameter, WithEnsNodeProviderOptions } from "../types";
import { createNameTokensQueryOptions } from "../utils/query";
import { useEnsNodeProviderOptions } from "./useEnsNodeProviderOptions";

type UseNameTokensParameters = NameTokensRequest & QueryParameter<NameTokensResponse>;

/**
 * Use Name Tokens hook
 *
 * Query ENSNode Name Tokens API.
 */
export function useNameTokens(parameters: WithEnsNodeProviderOptions & UseNameTokensParameters) {
  const { options, query = {}, ...request } = parameters;
  const providerOptions = useEnsNodeProviderOptions(options);

  const queryOptions = createNameTokensQueryOptions(providerOptions, request);

  return useQuery({
    ...queryOptions,
    refetchInterval: false, // no refetching - assume data is immutable until a full page refresh
    ...query,
    enabled: query.enabled ?? queryOptions.enabled,
  });
}
