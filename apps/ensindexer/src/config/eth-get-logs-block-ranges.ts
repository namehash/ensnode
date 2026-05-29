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
 * Mirrors `buildRpcConfigsFromEnv`: for each chain in the namespace, reads the optional
 * `ETH_GET_LOGS_BLOCK_RANGE_${chainId}` environment variable. Variables for chains outside the
 * namespace are ignored (same behavior as `RPC_URL_*`).
 *
 * NOTE: returns raw (unvalidated) string values; validation happens in {@link EthGetLogsBlockRangesSchema}.
 */
export function buildEthGetLogsBlockRangesFromEnv(
  env: EthGetLogsBlockRangeEnvironment,
  namespace: ENSNamespaceId,
): Record<ChainIdString, string> {
  const chainsInNamespace = Object.entries(getENSNamespace(namespace)).map(
    ([, datasource]) => (datasource as Datasource).chain,
  );

  const ethGetLogsBlockRanges: Record<ChainIdString, string> = {};

  for (const chain of chainsInNamespace) {
    const value = env[`ETH_GET_LOGS_BLOCK_RANGE_${chain.id}`];
    if (value !== undefined && value !== "") {
      ethGetLogsBlockRanges[serializeChainId(chain.id)] = value;
    }
  }

  return ethGetLogsBlockRanges;
}

const EthGetLogsBlockRangeValueSchema = z.coerce
  .number({ error: "ETH_GET_LOGS_BLOCK_RANGE must be a positive integer." })
  .int({ error: "ETH_GET_LOGS_BLOCK_RANGE must be a positive integer." })
  .min(1, { error: "ETH_GET_LOGS_BLOCK_RANGE must be a positive integer." });

/**
 * Parses the raw per-chain `eth_getLogs` block range overrides into a `Map<ChainId, number>`.
 */
export const EthGetLogsBlockRangesSchema = z
  .record(makeChainIdStringSchema("ETH_GET_LOGS_BLOCK_RANGE"), EthGetLogsBlockRangeValueSchema, {
    error:
      "ETH_GET_LOGS_BLOCK_RANGE configuration must be an object mapping valid chain IDs to positive integers.",
  })
  .transform((records) => {
    const ethGetLogsBlockRanges = new Map<ChainId, number>();

    for (const [chainIdString, blockRange] of Object.entries(records)) {
      ethGetLogsBlockRanges.set(deserializeChainId(chainIdString), blockRange);
    }

    return ethGetLogsBlockRanges;
  });
