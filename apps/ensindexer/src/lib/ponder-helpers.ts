/**
 * This file is required to build the ENSIndexerConfig object.
 * No dependencies in this file can import from `@/config` path
 * as the config object will not be ready yet.
 */

import type { Event, EventNames } from "ponder:registry";
import type { ChainConfig } from "ponder";

import {
  type ContractConfig,
  type DatasourceName,
  type ENSNamespaceId,
  ensTestEnvChain,
  maybeGetDatasource,
} from "@ensnode/datasources";
import { type BlockNumberRange, buildBlockNumberRange, type ChainId } from "@ensnode/ponder-sdk";

import type { ENSIndexerConfig } from "@/config/types";

/**
 * A type that represents only log events (case 6 in the Event conditional type).
 * This filters out block events, transaction events, transfer events, call trace events, and setup events.
 *
 * Valid event names have the pattern: `${ContractName}:${EventName}` where EventName is not "setup".
 * Invalid patterns that are excluded:
 * - `${string}:block` (block events)
 * - `${string}:transaction:${"from" | "to"}` (transaction events)
 * - `${string}:transfer:${"from" | "to"}` (transfer events)
 * - `${string}.${string}` (call trace events)
 * - `${ContractName}:setup` (setup events)
 */
export type LogEvent<T extends EventNames = EventNames> = T extends `${string}:block`
  ? never
  : T extends `${string}:transaction:${"from" | "to"}`
    ? never
    : T extends `${string}:transfer:${"from" | "to"}`
      ? never
      : T extends `${string}.${string}`
        ? never
        : T extends `${string}:setup`
          ? never
          : T extends `${string}:${string}`
            ? Event<T>
            : never;

export type EventWithArgs<ARGS extends Record<string, unknown> = {}> = Omit<LogEvent, "args"> & {
  args: ARGS;
};
/**
 * Given a contract's block range, returns a block range describing a start and end block
 * that maintains validity within the global blockrange. The returned start block will always be
 * defined, but if no end block is specified, the returned end block will be undefined.
 *
 * @param globalBlockrange a global block range across all indexed contracts
 * @param contractBlockrange the preferred blockrange for the given contract
 * @returns the start and end blocks, constrained to the provided `start` and `end`
 *  i.e. (globalStartBlock || 0) <= (contractStartBlock || 0) <= (contractEndBlock if specificed) <= (globalEndBlock if specificed)
 */
export const constrainBlockrange = (
  globalBlockrange: BlockNumberRange,
  contractBlockrange: BlockNumberRange,
): BlockNumberRange => {
  const highestStartBlock = Math.max(
    globalBlockrange.startBlock || 0,
    contractBlockrange.startBlock || 0,
  );

  const lowestEndBlock = Math.min(
    globalBlockrange.endBlock || Infinity,
    contractBlockrange.endBlock || Infinity,
  );

  const isEndConstrained = Number.isFinite(lowestEndBlock);

  const startBlock = isEndConstrained
    ? Math.min(highestStartBlock, lowestEndBlock)
    : highestStartBlock;
  const endBlock = isEndConstrained ? lowestEndBlock : undefined;

  return buildBlockNumberRange(startBlock, endBlock);
};

/**
/**
 * Builds a ponder#Config["chains"] for a single, specific chain in the context of the ENSIndexerConfig.
 *
 * @param rpcConfigs - The RPC configuration object from ENSIndexerConfig, keyed by chain ID.
 * @param chainId - The numeric chain ID for which to build the chain config.
 * @returns a ponder#Config["chains"]
 */
export function chainsConnectionConfig(
  rpcConfigs: ENSIndexerConfig["rpcConfigs"],
  chainId: ChainId,
) {
  const rpcConfig = rpcConfigs.get(chainId);

  if (!rpcConfig) {
    throw new Error(
      `chainsConnectionConfig called for chain id ${chainId} but no associated rpcConfig is available. rpcConfig specifies the following chain ids: [${Object.keys(rpcConfigs).join(", ")}].`,
    );
  }

  // NOTE: disable cache on local chains (e.g. ganache, anvil, ens-test-env)
  const disableCache = chainId === 31337 || chainId === 1337 || chainId === ensTestEnvChain.id;

  return {
    [chainId.toString()]: {
      id: chainId,
      rpc: rpcConfig.httpRPCs.map((httpRPC) => httpRPC.toString()),
      ws: rpcConfig.websocketRPC?.toString(),
      disableCache,
    } satisfies ChainConfig,
  };
}

/**
 * Builds a `ponder#ContractConfig['chain']` given a contract's config, constraining the contract's
 * indexing range by the globally configured blockrange.
 *
 * @param {BlockNumberRange} globalBlockrange
 * @param {number} chainId
 * @param {ContractConfig} contractConfig
 *
 * @returns network configuration based on the contract
 */
export function chainConfigForContract<CONTRACT_CONFIG extends ContractConfig>(
  globalBlockrange: BlockNumberRange,
  chainId: number,
  contractConfig: CONTRACT_CONFIG,
) {
  const contractBlockrange = buildBlockNumberRange(
    contractConfig.startBlock,
    contractConfig.endBlock,
  );

  // Ponder will index the contract in perpetuity if endBlock is `undefined`
  const { startBlock, endBlock } = constrainBlockrange(globalBlockrange, contractBlockrange);

  return {
    [chainId.toString()]: {
      address: contractConfig.address, // provide per-network address if available
      startBlock,
      endBlock,
    },
  };
}

/**
 * TODO
 */
export function chainsConnectionConfigForDatasources(
  namespace: ENSNamespaceId,
  rpcConfigs: ENSIndexerConfig["rpcConfigs"],
  datasourceNames: DatasourceName[],
) {
  return datasourceNames
    .map((datasourceName) => maybeGetDatasource(namespace, datasourceName))
    .filter((ds) => !!ds)
    .map((datasource) => datasource.chain)
    .reduce<Record<string, ChainConfig>>(
      (memo, chain) => ({
        ...memo,
        ...chainsConnectionConfig(rpcConfigs, chain.id),
      }),
      {},
    );
}

type MapOfRequiredDatasources<
  N extends ENSNamespaceId,
  DATASOURCE_NAMES extends readonly DatasourceName[],
> = {
  [K in DATASOURCE_NAMES[number]]: Exclude<ReturnType<typeof maybeGetDatasource<N, K>>, undefined>;
};

type MapOfMaybeDatasources<
  N extends ENSNamespaceId,
  DATASOURCE_NAMES extends readonly DatasourceName[],
> = {
  [K in DATASOURCE_NAMES[number]]: ReturnType<typeof maybeGetDatasource<N, K>>;
};

/**
 * TODO
 */
export function getRequiredDatasources<
  N extends ENSNamespaceId,
  DATASOURCE_NAMES extends DatasourceName[],
>(namespace: N, datasourceNames: DATASOURCE_NAMES) {
  return Object.fromEntries(
    datasourceNames.map((datasourceName) => {
      const datasource = maybeGetDatasource(namespace, datasourceName);
      if (!datasource) {
        throw new Error(
          `Required datasource "${datasourceName}" not found for namespace "${namespace}"`,
        );
      }
      return [datasourceName, datasource] as const;
    }),
  ) as MapOfRequiredDatasources<N, DATASOURCE_NAMES>;
}

/**
 * TODO
 */
export function maybeGetDatasources<
  N extends ENSNamespaceId,
  DATASOURCE_NAMES extends DatasourceName[],
>(namespace: N, datasourceNames: DATASOURCE_NAMES) {
  return Object.fromEntries(
    datasourceNames.map(
      (datasourceName) => [datasourceName, maybeGetDatasource(namespace, datasourceName)] as const,
    ),
  ) as MapOfMaybeDatasources<N, DATASOURCE_NAMES>;
}
