import type { z } from "zod/v4";

import { getENSRootChainId } from "@ensnode/datasources";

import { isHttpProtocol, isWebSocketProtocol } from "../url";
import type { ZodCheckFnInput } from "../zod-schemas";
import type { ENSNamespaceSchema, RpcConfigsSchema } from "./zod-schemas";

/**
 * Invariant: RPC endpoint configuration for a chain must include at least one http/https protocol URL.
 */
export function invariant_rpcEndpointConfigIncludesAtLeastOneHTTPProtocolURL(
  ctx: ZodCheckFnInput<URL[]>,
) {
  const endpoints = ctx.value;
  const httpEndpoints = endpoints.filter(isHttpProtocol);

  if (httpEndpoints.length < 1) {
    ctx.issues.push({
      code: "custom",
      input: endpoints,
      message: `RPC endpoint configuration for a chain must include at least one http/https protocol URL.`,
    });
  }
}

/**
 * Invariant: RPC configuration for a chain must include at most one WS/WSS protocol URL.
 */
export function invariant_rpcEndpointConfigIncludesAtMostOneWebSocketsProtocolURL(
  ctx: ZodCheckFnInput<URL[]>,
) {
  const endpoints = ctx.value;
  const wsEndpoints = endpoints.filter(isWebSocketProtocol);

  if (wsEndpoints.length > 1) {
    ctx.issues.push({
      code: "custom",
      input: endpoints,
      message: `RPC endpoint configuration for a chain must include at most one websocket (ws/wss) protocol URL.`,
    });
  }
}

// Invariant: rpcConfig is specified for the ENS Root Chain of the configured namespace
export function invariant_rpcConfigsSpecifiedForRootChain(
  ctx: ZodCheckFnInput<{
    namespace: z.infer<typeof ENSNamespaceSchema>;
    rpcConfigs: z.infer<typeof RpcConfigsSchema>;
  }>,
) {
  const { value: config } = ctx;

  const ensRootChainId = getENSRootChainId(config.namespace);

  if (!config.rpcConfigs.has(ensRootChainId)) {
    ctx.issues.push({
      code: "custom",
      input: config,
      message: `An RPC Config for the ENS Root Chain ('${ensRootChainId}') is required, but none was specified.`,
    });
  }
}
