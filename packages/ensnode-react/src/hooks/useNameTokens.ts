import { useQuery } from "@tanstack/react-query";

import type { NameTokensRequest, NameTokensResponse } from "@ensnode/ensnode-sdk";

import type { QueryParameter, WithEnsApiProviderOptions } from "../types";
import { createNameTokensQueryOptions } from "../utils/query";
import { useEnsApiProviderOptions } from "./useEnsApiProviderOptions";

type UseNameTokensParameters = NameTokensRequest & QueryParameter<NameTokensResponse>;

/**
 * Use Name Tokens hook
 *
 * Query ENSNode Name Tokens API.
 */
export function useNameTokens(parameters: WithEnsApiProviderOptions & UseNameTokensParameters) {
  const { options, query = {} } = parameters;
  const providerOptions = useEnsApiProviderOptions(options);

  const queryOptions = createNameTokensQueryOptions(providerOptions, parameters);

  return useQuery({
    ...queryOptions,
    refetchInterval: false, // no refetching - assume data is immutable until a full page refresh
    ...query,
    enabled: query.enabled ?? queryOptions.enabled,
  });
}
