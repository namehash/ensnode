import { useQuery } from "@tanstack/react-query";

import type { RegistrarActionsRequest, RegistrarActionsResponse } from "@ensnode/ensnode-sdk";

import type { QueryParameter, WithEnsNodeProviderOptions } from "../types";
import { createRegistrarActionsQueryOptions } from "../utils/query";
import { useEnsNodeProviderOptions } from "./useEnsNodeProviderOptions";

interface UseRegistrarActionsParameters
  extends RegistrarActionsRequest,
    QueryParameter<RegistrarActionsResponse> {}

/**
 * Use Registrar Actions hook
 *
 * Query ENSNode Registrar Actions API.
 */
export function useRegistrarActions(
  parameters: WithEnsNodeProviderOptions & UseRegistrarActionsParameters = {},
) {
  const { options, query = {}, ...request } = parameters;
  const providerOptions = useEnsNodeProviderOptions(options);

  const queryOptions = createRegistrarActionsQueryOptions(providerOptions, request);

  return useQuery({
    ...queryOptions,
    refetchInterval: 10 * 1000, // 10 seconds - latest registrar actions change frequently
    ...query,
    enabled: query.enabled ?? queryOptions.enabled,
  });
}
