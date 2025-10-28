import { useQuery } from "@tanstack/react-query";

import type { ConfigResponse } from "@ensnode/ensnode-sdk";

import type { ConfigParameter, QueryParameter } from "../types";
import { ASSUME_IMMUTABLE_QUERY, createENSIndexerConfigQueryOptions } from "../utils/query";
import { useENSNodeConfig } from "./useENSNodeConfig";

type UseENSIndexerConfigParameters = QueryParameter<ConfigResponse>;

export function useENSIndexerConfig(
  parameters: ConfigParameter & UseENSIndexerConfigParameters = {},
) {
  const { config, query = {} } = parameters;
  const _config = useENSNodeConfig(config);

  const queryOptions = createENSIndexerConfigQueryOptions(_config);

  const options = {
    ...queryOptions,
    ...ASSUME_IMMUTABLE_QUERY,
    ...query,
    enabled: query.enabled ?? queryOptions.enabled,
  };

  return useQuery(options);
}
