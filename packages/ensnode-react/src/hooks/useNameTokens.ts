import { useQuery } from "@tanstack/react-query";

import type { NameTokensRequest, NameTokensResponse } from "@ensnode/ensnode-sdk";

import type { QueryParameter, WithSDKConfigParameter } from "../types";
import { createNameTokensQueryOptions } from "../utils/query";
import { useENSNodeSDKConfig } from "./useENSNodeSDKConfig";

type UseNameTokensParameters = NameTokensRequest & QueryParameter<NameTokensResponse>;

/**
 * Use Name Tokens hook
 *
 * Query ENSNode Name Tokens API.
 */
export function useNameTokens(parameters: WithSDKConfigParameter & UseNameTokensParameters) {
  const { config, query = {} } = parameters;
  const _config = useENSNodeSDKConfig(config);

  const queryOptions = createNameTokensQueryOptions(_config, parameters);

  return useQuery({
    ...queryOptions,
    refetchInterval: false, // no refetching - assume data is immutable until a full page refresh
    ...query,
    enabled: query.enabled ?? queryOptions.enabled,
  });
}
