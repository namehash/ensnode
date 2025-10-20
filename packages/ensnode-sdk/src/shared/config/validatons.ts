import { isHttpProtocol, isWebSocketProtocol } from "../url";
import { ZodCheckFnInput } from "../zod-schemas";

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
