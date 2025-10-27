import { useQuery } from "@tanstack/react-query";

import type { ConfigResponse } from "@ensnode/ensnode-sdk";

import type { ConfigParameter, QueryParameter } from "../types";
import { ASSUME_IMMUTABLE_QUERY, createConfigQueryOptions } from "../utils/query";
import { useENSNodeConfig } from "./useENSNodeConfig";

type UseENSNodeConfigParameters = QueryParameter<ConfigResponse>;

export function useENSNodeConfigQuery(
  parameters: ConfigParameter & UseENSNodeConfigParameters = {},
) {
  const { config, query = {} } = parameters;
  const _config = useENSNodeConfig(config);

  const queryOptions = createConfigQueryOptions(_config);

  const options = {
    ...queryOptions,
    ...ASSUME_IMMUTABLE_QUERY,
    ...query,
    enabled: query.enabled ?? queryOptions.enabled,
  };

  return useQuery(options);
}
