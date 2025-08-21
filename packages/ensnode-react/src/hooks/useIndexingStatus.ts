import { IndexingStatusRequest, IndexingStatusResponse } from "@ensnode/ensnode-sdk";
import { useQuery } from "@tanstack/react-query";
import { ConfigParameter, QueryParameter } from "../types";
import { createIndexingStatusQueryOptions } from "../utils/query";
import { useENSNodeConfig } from "./useENSNodeConfig";

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
