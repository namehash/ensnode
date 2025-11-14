import { useQuery } from "@tanstack/react-query";

import type { RegistrarActionsRequest, RegistrarActionsResponse } from "@ensnode/ensnode-sdk";

import type { QueryParameter, WithSDKConfigParameter } from "../types";
import { createRegistrarActionsQueryOptions } from "../utils/query";
import { useENSNodeSDKConfig } from "./useENSNodeSDKConfig";

interface UseRegistrarActionsParameters
  extends RegistrarActionsRequest,
    QueryParameter<RegistrarActionsResponse> {}

/**
 * Use Registrar Actions hook
 *
 * Query ENSNode Registrar Actions API.
 */
export function useRegistrarActions(
  parameters: WithSDKConfigParameter & UseRegistrarActionsParameters = {},
) {
  const { config, query = {} } = parameters;
  const _config = useENSNodeSDKConfig(config);

  const queryOptions = createRegistrarActionsQueryOptions(_config, parameters);

  const options = {
    ...queryOptions,
    refetchInterval: 10 * 1000, // 10 seconds - latest registrar actions change frequently
    ...query,
    enabled: query.enabled ?? queryOptions.enabled,
  };

  return useQuery(options);
}
