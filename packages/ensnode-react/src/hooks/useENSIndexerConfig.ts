import { ConfigResponse } from "@ensnode/ensnode-sdk";

import { useQuery } from "@tanstack/react-query";
import { ConfigParameter, QueryParameter } from "../types";
import { IMMUTABLE_QUERY, createENSIndexerConfigQueryOptions } from "../utils/query";
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
    ...IMMUTABLE_QUERY,
    ...query,
    enabled: query.enabled ?? queryOptions.enabled,
  };

  return useQuery(options);
}
