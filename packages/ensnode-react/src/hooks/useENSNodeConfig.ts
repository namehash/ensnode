import { useQuery } from "@tanstack/react-query";

import type { ConfigResponse } from "@ensnode/ensnode-sdk";

import type { QueryParameter, WithSDKConfigParameter } from "../types";
import { ASSUME_IMMUTABLE_QUERY, createConfigQueryOptions } from "../utils/query";
import { useENSNodeSDKConfig } from "./useENSNodeSDKConfig";

type UseENSNodeConfigParameters = QueryParameter<ConfigResponse>;

export function useENSNodeConfig(
  parameters: WithSDKConfigParameter & UseENSNodeConfigParameters = {},
) {
  const { config, query = {} } = parameters;
  const _config = useENSNodeSDKConfig(config);

  const queryOptions = createConfigQueryOptions(_config);

  const options = {
    ...queryOptions,
    ...ASSUME_IMMUTABLE_QUERY,
    ...query,
    enabled: query.enabled ?? queryOptions.enabled,
  };

  return useQuery(options);
}
