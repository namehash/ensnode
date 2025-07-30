export type { QueryClient } from "@tanstack/react-query";

export {
  ENSNodeProvider,
  createConfig,
  type ENSNodeProviderProps,
} from "./provider";
export { ENSNodeContext } from "./context";

export {
  useENSNodeConfig,
  useResolveName,
  useResolveAddress,
  useConnections,
  useCurrentConnection,
} from "./hooks/index";
export type {
  UseResolveNameReturnType,
  UseResolveAddressReturnType,
  UseCurrentConnectionParameters,
  UseCurrentConnectionReturnType,
} from "./hooks/index";

export type {
  ENSNodeConfig,
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
