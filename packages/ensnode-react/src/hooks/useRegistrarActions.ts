import { useQuery } from "@tanstack/react-query";

import type { RegistrarActionsRequest, RegistrarActionsResponse } from "@ensnode/ensnode-sdk";

import type { QueryParameter, WithEnsApiProviderOptions } from "../types";
import { createRegistrarActionsQueryOptions } from "../utils/query";
import { useEnsApiProviderOptions } from "./useEnsApiProviderOptions";

interface UseRegistrarActionsParameters
  extends RegistrarActionsRequest,
    QueryParameter<RegistrarActionsResponse> {}

/**
 * Use Registrar Actions hook
 *
 * Query ENSNode Registrar Actions API.
 */
export function useRegistrarActions(
  parameters: WithEnsApiProviderOptions & UseRegistrarActionsParameters = {},
) {
  const { options, query = {} } = parameters;
  const providerOptions = useEnsApiProviderOptions(options);

  const queryOptions = createRegistrarActionsQueryOptions(providerOptions, parameters);

  return useQuery({
    ...queryOptions,
    refetchInterval: 10 * 1000, // 10 seconds - latest registrar actions change frequently
    ...query,
    enabled: query.enabled ?? queryOptions.enabled,
  });
}
