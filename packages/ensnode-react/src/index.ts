export {
  ENSNodeProvider,
  createConfig,
  type ENSNodeProviderProps,
} from "./provider.js";
export { ENSNodeContext } from "./context.js";

export {
  useENSNodeConfig,
  useResolveName,
  useResolveAddress,
} from "./hooks/index.js";
export type {
  UseResolveNameReturnType,
  UseResolveAddressReturnType,
} from "./hooks/index.js";

export type {
  ENSNodeConfig,
  QueryParameter,
  ConfigParameter,
  UseResolveNameParameters,
  UseResolveAddressParameters,
  UseQueryReturnType,
} from "./types.js";

export type { QueryClient } from "@tanstack/react-query";

export {
  queryKeys,
  createForwardResolutionQueryOptions,
  createReverseResolutionQueryOptions,
} from "./utils/query.js";
