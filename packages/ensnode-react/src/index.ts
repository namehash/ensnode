export type { QueryClient } from "@tanstack/react-query";

export {
  ENSNodeProvider,
  createConfig,
  type ENSNodeProviderProps,
} from "./provider";
export { ConnectionContext, type ConnectionContextState } from "./context";
export { ENSNodeContext } from "./context";

export {
  useENSNodeConfig,
  useResolveName,
  useResolveAddress,
  useConnections,
  useCurrentConnection,
  useConnectionConfig,
} from "./hooks/index";
export type {
  UseResolveNameReturnType,
  UseResolveAddressReturnType,
  UseCurrentConnectionParameters,
  UseCurrentConnectionReturnType,
} from "./hooks/index";

export type {
  ENSNodeConfig,
  ENSNodeValidator,
  ENSIndexerPublicConfig,
  QueryParameter,
  ConfigParameter,
  UseResolveNameParameters,
  UseResolveAddressParameters,
  UseQueryReturnType,
  Connection,
  AddConnectionVariables,
  RemoveConnectionVariables,
  UseConnectionsParameters,
  UseConnectionsReturnType,
} from "./types";

export {
  queryKeys,
  createForwardResolutionQueryOptions,
  createReverseResolutionQueryOptions,
} from "./utils/query";

export { BasicEnsNodeValidator, defaultValidator } from "./utils/validator";
