import {
  ConfigResponse,
  IndexingStatusRequest,
  IndexingStatusResponse,
} from "@ensnode/ensnode-sdk";

import { ConfigParameter, QueryParameter, useENSNodeConfig } from "@ensnode/ensnode-react";
import { useQuery } from "@tanstack/react-query";

import { createENSIndexerConfigQueryOptions, createIndexingStatusQueryOptions } from "./query";

type UseENSIndexerConfigParameters = QueryParameter<ConfigResponse>;

export function useENSIndexerConfig(
  parameters: ConfigParameter & UseENSIndexerConfigParameters = {},
) {
  const { config, query = {} } = parameters;
  const _config = useENSNodeConfig(config);

  const queryOptions = createENSIndexerConfigQueryOptions(_config);

  const options = {
    ...queryOptions,
    ...query,
    enabled: query.enabled ?? queryOptions.enabled,
  };

  return useQuery(options);
}

interface UseIndexingStatusParameters
  extends IndexingStatusRequest,
    QueryParameter<IndexingStatusResponse> {}

export function useIndexingStatus(parameters: ConfigParameter & UseIndexingStatusParameters = {}) {
  const { config, query = {}, ...args } = parameters;
  const _config = useENSNodeConfig(config);

  const queryOptions = createIndexingStatusQueryOptions(_config, { ...args });

  const options = {
    ...queryOptions,
    ...query,
    enabled: query.enabled ?? queryOptions.enabled,
  };

  return useQuery(options);
}
