export {
  ENSNodeProvider,
  createConfig,
  type ENSNodeProviderProps,
} from "./provider.js";
export { ENSNodeContext } from "./context.js";

export {
  useConfig,
  useName,
  useAddress,
  useIndexerConfig,
  useIndexingStatus,
} from "./hooks/index.js";
export type {
  UseNameReturnType,
  UseAddressReturnType,
  UseIndexerConfigReturnType,
  UseIndexingStatusReturnType,
} from "./hooks/index.js";

export type {
  ENSNodeConfig,
  QueryParameter,
  ConfigParameter,
  UseNameParameters,
  UseAddressParameters,
  UseQueryReturnType,
} from "./types.js";

export type { QueryClient } from "@tanstack/react-query";

export {
  queryKeys,
  createForwardResolutionQueryOptions,
  createReverseResolutionQueryOptions,
  createIndexerConfigQueryOptions,
  createIndexingStatusQueryOptions,
} from "./utils/query.js";
