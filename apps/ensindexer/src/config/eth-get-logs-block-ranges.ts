import type { ChainId, ChainIdString } from "enssdk";
import { z } from "zod/v4";

import { type Datasource, type ENSNamespaceId, getENSNamespace } from "@ensnode/datasources";
import { deserializeChainId, serializeChainId } from "@ensnode/ensnode-sdk";
import { makeChainIdStringSchema } from "@ensnode/ensnode-sdk/internal";

import type { EthGetLogsBlockRangeEnvironment } from "@/config/environment";

/**
 * Builds the raw, per-chain `eth_getLogs` block range overrides from the environment, scoped to the
 * chain IDs that appear in the specified `namespace`.
 *
 * For each chain in the namespace, a chain-specific `ETH_GET_LOGS_BLOCK_RANGE_${chainId}` takes
 * precedence over the global `ETH_GET_LOGS_BLOCK_RANGE` default (a chain-specific `0` wins over the
 * default and, once validated, disables the override for that chain). Variables for chains outside
 * the namespace are ignored (same behavior as `RPC_URL_*`).
 *
 * NOTE: returns raw (unvalidated) string values; validation and the `0` disable semantics are
 * applied in {@link EthGetLogsBlockRangesSchema}.
 */
export function buildEthGetLogsBlockRangesFromEnv(
  env: EthGetLogsBlockRangeEnvironment,
  namespace: ENSNamespaceId,
): Record<ChainIdString, string> {
  const defaultValue = env.ETH_GET_LOGS_BLOCK_RANGE || undefined;

  const chainsInNamespace = Object.entries(getENSNamespace(namespace)).map(
    ([, datasource]) => (datasource as Datasource).chain,
  );

  const ethGetLogsBlockRanges: Record<ChainIdString, string> = {};

  for (const chain of chainsInNamespace) {
    // a chain-specific value (including "0" to disable) takes precedence over the global default
    const value = (env[`ETH_GET_LOGS_BLOCK_RANGE_${chain.id}`] || undefined) ?? defaultValue;
    if (value !== undefined) {
      ethGetLogsBlockRanges[serializeChainId(chain.id)] = value;
    }
  }

  return ethGetLogsBlockRanges;
}

const EthGetLogsBlockRangeValueSchema = z.coerce
  .number({ error: "ETH_GET_LOGS_BLOCK_RANGE must be a non-negative integer." })
  .int({ error: "ETH_GET_LOGS_BLOCK_RANGE must be a non-negative integer." })
  .min(0, { error: "ETH_GET_LOGS_BLOCK_RANGE must be a non-negative integer." });

/**
 * Parses the raw per-chain `eth_getLogs` block range overrides into a `Map<ChainId, number>`,
 * dropping any chain configured with `0` (the disable sentinel) so Ponder auto-determines its range.
 */
export const EthGetLogsBlockRangesSchema = z
  .record(makeChainIdStringSchema("ETH_GET_LOGS_BLOCK_RANGE"), EthGetLogsBlockRangeValueSchema, {
    error:
      "ETH_GET_LOGS_BLOCK_RANGE configuration must be an object mapping valid chain IDs to non-negative integers.",
  })
  .transform((records) => {
    const ethGetLogsBlockRanges = new Map<ChainId, number>();

    for (const [chainIdString, blockRange] of Object.entries(records)) {
      // 0 disables the override for a chain, so it is omitted (Ponder auto-determines the range)
      if (blockRange > 0) {
        ethGetLogsBlockRanges.set(deserializeChainId(chainIdString), blockRange);
      }
    }

    return ethGetLogsBlockRanges;
  });
