import { z } from "zod/v4";

import { ENSNamespaceIds } from "@ensnode/datasources";

import { deserializeChainId } from "../deserialize";
import type { ChainId } from "../types";
import { isHttpProtocol, isWebSocketProtocol } from "../url";
import { makeChainIdStringSchema, makeUrlSchema } from "../zod-schemas";
import type { RpcConfig } from "./types";
import {
  invariant_rpcEndpointConfigIncludesAtLeastOneHTTPProtocolURL,
  invariant_rpcEndpointConfigIncludesAtMostOneWebSocketsProtocolURL,
} from "./validatons";

export const DatabaseSchemaNameSchema = z
  .string({
    error: "DATABASE_SCHEMA is required.",
  })
  .trim()
  .min(1, {
    error: "DATABASE_SCHEMA is required and cannot be an empty string.",
  });

const RpcConfigSchema = z
  .string()
  .transform((val) => val.split(","))
  .pipe(z.array(makeUrlSchema("RPC URL")))
  .check(invariant_rpcEndpointConfigIncludesAtLeastOneHTTPProtocolURL)
  .check(invariant_rpcEndpointConfigIncludesAtMostOneWebSocketsProtocolURL);

export const RpcConfigsSchema = z
  .record(makeChainIdStringSchema("RPC URL"), RpcConfigSchema, {
    error: "Chains configuration must be an object mapping valid chain IDs to their configs.",
  })
  .transform((records) => {
    const rpcConfigs = new Map<ChainId, RpcConfig>();

    for (const [chainIdString, rpcConfig] of Object.entries(records)) {
      // rpcConfig is guaranteed to include at least one HTTP protocol URL
      const httpRPCs = rpcConfig.filter(isHttpProtocol) as [URL, ...URL[]];

      // rpcConfig is guaranteed to include at most one WebSocket protocol URL
      const websocketRPC = rpcConfig.find(isWebSocketProtocol);

      rpcConfigs.set(deserializeChainId(chainIdString), {
        httpRPCs,
        websocketRPC,
      });
    }

    return rpcConfigs;
  });

export const EnsIndexerUrlSchema = makeUrlSchema("ENSINDEXER_URL");

export const ENSNamespaceSchema = z.enum(ENSNamespaceIds, {
  error: ({ input }) =>
    `Invalid NAMESPACE. Got '${input}', but supported ENS namespaces are: ${Object.keys(ENSNamespaceIds).join(", ")}`,
});

/**
 * Parses a numeric value as a port number.
 * Ensures the value is an integer (not a float) within the valid port range.
 */
export const PortSchema = z.coerce
  .number({ error: "PORT must be a number." })
  .int({ error: "PORT must be an integer." })
  .min(1, { error: "PORT must be greater than or equal to 1." })
  .max(65535, { error: "PORT must be less than or equal to 65535" })
  .optional();

export const TheGraphApiKeySchema = z.string().optional();
