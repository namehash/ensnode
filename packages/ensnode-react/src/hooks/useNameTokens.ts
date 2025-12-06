import { useQuery } from "@tanstack/react-query";

import type { NameTokensRequest, NameTokensResponse } from "@ensnode/ensnode-sdk";

import type { QueryParameter, WithSDKConfigParameter } from "../types";
import { createNameTokensQueryOptions } from "../utils/query";
import { useENSNodeSDKConfig } from "./useENSNodeSDKConfig";

interface UseNameTokensParameters extends NameTokensRequest, QueryParameter<NameTokensResponse> {}

/**
 * Use Name Tokens hook
 *
 * Query ENSNode Name Tokens API.
 */
export function useNameTokens(parameters: WithSDKConfigParameter & UseNameTokensParameters) {
  const { config, query = {} } = parameters;
  const _config = useENSNodeSDKConfig(config);

  const queryOptions = createNameTokensQueryOptions(_config, parameters);

  const options = {
    ...queryOptions,
    refetchInterval: 60 * 1000, // 60 seconds - latest Name Tokens change infrequently
    ...query,
    enabled: query.enabled ?? queryOptions.enabled,
  };

  return useQuery(options);
}
