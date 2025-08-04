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
} from "./hooks/index";
export type {
  UseResolveNameReturnType,
  UseResolveAddressReturnType,
} from "./hooks/index";

export type {
  ENSNodeConfig,
  QueryParameter,
  ConfigParameter,
  UseResolveNameParameters,
  UseResolveAddressParameters,
  UseQueryReturnType,
} from "./types";

export type { ForwardResolutionSelection } from "@ensnode/ensnode-sdk";

export {
  queryKeys,
  createForwardResolutionQueryOptions,
  createReverseResolutionQueryOptions,
} from "./utils/query";
