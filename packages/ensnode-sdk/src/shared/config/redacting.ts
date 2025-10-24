/**
 * Generic utilities for redacting sensitive information from configuration objects.
 */

import { RpcConfig, RpcConfigs } from "./types";

/**
 * Default redacted value placeholder.
 */
const REDACTED = "*****";

/**
 * Generic function to redact URL objects by replacing the path with a redacted placeholder.
 */
export function redactUrl(url: URL): URL {
  return new URL(`/${REDACTED}`, url.origin);
}

/**
 * Generic function to redact strings by replacing them with a redacted placeholder.
 */
export function redactString(_: string): string {
  return REDACTED;
}

/**
 * Redact RPC configs by replacing URLs with redacted values.
 */
export function redactRpcConfigs(rpcConfigs: RpcConfigs): RpcConfigs {
  const redactedRpcConfigs = new Map<number, RpcConfig>();

  for (const [chainId, rpcConfig] of rpcConfigs.entries()) {
    const redactedHttpRPCs = rpcConfig.httpRPCs.map(redactUrl) as [URL, ...URL[]];
    const redactedWebsocketRPC = rpcConfig.websocketRPC
      ? redactUrl(rpcConfig.websocketRPC)
      : undefined;

    redactedRpcConfigs.set(chainId, {
      httpRPCs: redactedHttpRPCs,
      websocketRPC: redactedWebsocketRPC,
    });
  }

  return redactedRpcConfigs;
}
