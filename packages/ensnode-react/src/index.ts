export {
  ENSNodeProvider,
  createConfig,
  type ENSNodeProviderProps,
} from "./provider.js";
export { ENSNodeContext } from "./context.js";

export { useConfig, useName, useAddress } from "./hooks/index.js";
export type { UseNameReturnType, UseAddressReturnType } from "./hooks/index.js";

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
} from "./utils/query.js";
